package main

import (
	"io"
	"sort"
	"strings"
)

const maxHistory = 500

// Shell is a small line editor plus command runner over one SSH session,
// mirroring src/terminal/shell.ts: ~/path $ prompt, history, tab completion.
type Shell struct {
	out     io.Writer
	in      <-chan []byte
	rz      *Resizer
	term    string
	env     []string
	fs      *FS
	cwd     string
	history []string
	buf     []rune
	pos     int
	histIdx int // == len(history) when not browsing
	saved   string
	done    bool
}

func newShell(out io.Writer, in <-chan []byte, rz *Resizer, term string, env []string, fs *FS) *Shell {
	return &Shell{out: out, in: in, rz: rz, term: term, env: env, fs: fs, cwd: "/"}
}

// write converts \n to \r\n, since the SSH pty is in raw mode.
func (s *Shell) write(text string) {
	text = strings.ReplaceAll(text, "\r\n", "\n")
	io.WriteString(s.out, strings.ReplaceAll(text, "\n", "\r\n"))
}

func (s *Shell) prompt() string {
	d := "~"
	if s.cwd != "/" {
		d = "~" + s.cwd
	}
	return d + " $ "
}

func (s *Shell) redraw() {
	line := string(s.buf)
	s.write("\r\x1b[K" + s.prompt() + line)
	if back := len(s.buf) - s.pos; back > 0 {
		s.write("\x1b[" + itoa(back) + "D")
	}
}

func itoa(n int) string {
	if n == 0 {
		return "0"
	}
	var d []byte
	for n > 0 {
		d = append([]byte{byte('0' + n%10)}, d...)
		n /= 10
	}
	return string(d)
}

// Run reads the session's input until it closes or the user exits.
func (s *Shell) Run() {
	s.write(motd())
	s.write(s.prompt())
	var pending []byte
	for !s.done {
		b, ok := <-s.in
		if !ok {
			return
		}
		pending = s.consume(append(pending, b...))
	}
}

// consume handles as many complete input sequences as it can and returns the rest.
func (s *Shell) consume(b []byte) []byte {
	for len(b) > 0 && !s.done {
		c := b[0]
		switch {
		case c == 0x1b:
			if len(b) < 2 {
				return b // wait for the rest of the sequence
			}
			if b[1] != '[' && b[1] != 'O' {
				b = b[1:] // lone Alt+key; drop the ESC
				continue
			}
			// find the CSI final byte
			end := 2
			for end < len(b) && (b[end] < 0x40 || b[end] > 0x7e) {
				end++
			}
			if end >= len(b) {
				return b
			}
			s.escape(string(b[1 : end+1]))
			b = b[end+1:]
		case c < 0x80:
			s.control(rune(c))
			b = b[1:]
		default:
			// UTF-8 rune; wait for a full one
			need := 2
			switch {
			case c >= 0xf0:
				need = 4
			case c >= 0xe0:
				need = 3
			}
			if len(b) < need {
				return b
			}
			r := []rune(string(b[:need]))
			if len(r) > 0 {
				s.insert(r[0])
			}
			b = b[need:]
		}
	}
	return b
}

func (s *Shell) insert(r rune) {
	s.buf = append(s.buf, 0)
	copy(s.buf[s.pos+1:], s.buf[s.pos:])
	s.buf[s.pos] = r
	s.pos++
	if s.pos == len(s.buf) {
		s.write(string(r))
	} else {
		s.redraw()
	}
}

func (s *Shell) setLine(text string) {
	s.buf = []rune(text)
	s.pos = len(s.buf)
	s.redraw()
}

func (s *Shell) escape(seq string) {
	switch seq {
	case "[A", "OA":
		s.historyMove(-1)
	case "[B", "OB":
		s.historyMove(1)
	case "[C", "OC":
		if s.pos < len(s.buf) {
			s.pos++
			s.write("\x1b[C")
		}
	case "[D", "OD":
		if s.pos > 0 {
			s.pos--
			s.write("\x1b[D")
		}
	case "[H", "OH", "[1~":
		s.pos = 0
		s.redraw()
	case "[F", "OF", "[4~":
		s.pos = len(s.buf)
		s.redraw()
	case "[3~":
		if s.pos < len(s.buf) {
			s.buf = append(s.buf[:s.pos], s.buf[s.pos+1:]...)
			s.redraw()
		}
	}
}

func (s *Shell) historyMove(dir int) {
	if len(s.history) == 0 {
		return
	}
	if s.histIdx == len(s.history) && dir < 0 {
		s.saved = string(s.buf)
	}
	next := s.histIdx + dir
	if next < 0 || next > len(s.history) {
		return
	}
	s.histIdx = next
	if next == len(s.history) {
		s.setLine(s.saved)
	} else {
		s.setLine(s.history[next])
	}
}

func (s *Shell) control(c rune) {
	switch c {
	case '\r', '\n':
		line := string(s.buf)
		s.buf, s.pos = nil, 0
		s.write("\n")
		s.run(line)
		s.histIdx = len(s.history)
		s.saved = ""
		if !s.done {
			s.write(s.prompt())
		}
	case 0x7f, 0x08: // backspace
		if s.pos > 0 {
			s.buf = append(s.buf[:s.pos-1], s.buf[s.pos:]...)
			s.pos--
			s.redraw()
		}
	case 0x03: // Ctrl+C
		s.write("^C\n")
		s.buf, s.pos = nil, 0
		s.histIdx = len(s.history)
		s.write(s.prompt())
	case 0x04: // Ctrl+D
		if len(s.buf) == 0 {
			s.write("logout\n")
			s.done = true
		}
	case 0x0c: // Ctrl+L
		s.write("\x1b[2J\x1b[H")
		s.redraw()
	case 0x01:
		s.pos = 0
		s.redraw()
	case 0x05:
		s.pos = len(s.buf)
		s.redraw()
	case 0x15: // Ctrl+U
		s.buf, s.pos = s.buf[s.pos:], 0
		s.redraw()
	case 0x0b: // Ctrl+K
		s.buf = s.buf[:s.pos]
		s.redraw()
	case 0x17: // Ctrl+W
		i := s.pos
		for i > 0 && s.buf[i-1] == ' ' {
			i--
		}
		for i > 0 && s.buf[i-1] != ' ' {
			i--
		}
		s.buf = append(s.buf[:i], s.buf[s.pos:]...)
		s.pos = i
		s.redraw()
	case '\t':
		s.complete()
	default:
		if c >= 0x20 {
			s.insert(c)
		}
	}
}

// complete does basic tab completion of command names and paths.
func (s *Shell) complete() {
	before := string(s.buf[:s.pos])
	fields := strings.Split(before, " ")
	word := fields[len(fields)-1]
	var candidates []string
	if len(fields) == 1 {
		for _, n := range commandNames() {
			if strings.HasPrefix(n, word) {
				candidates = append(candidates, n)
			}
		}
	} else {
		dirPart, namePart := "", word
		if i := strings.LastIndex(word, "/"); i >= 0 {
			dirPart, namePart = word[:i+1], word[i+1:]
		}
		base := s.cwd
		if dirPart != "" {
			base = resolve(s.cwd, dirPart)
		}
		if d := s.fs.get(base); d != nil && d.dir {
			for _, name := range d.names {
				if strings.HasPrefix(name, namePart) {
					c := dirPart + name
					if d.children[name].dir {
						c += "/"
					}
					candidates = append(candidates, c)
				}
			}
		}
	}
	if len(candidates) == 0 {
		return
	}
	sort.Strings(candidates)
	common := candidates[0]
	for _, c := range candidates[1:] {
		for !strings.HasPrefix(c, common) {
			common = common[:len(common)-1]
		}
	}
	if len(candidates) == 1 && !strings.HasSuffix(common, "/") {
		common += " "
	}
	if len(common) > len(word) {
		for _, r := range common[len(word):] {
			s.insert(r)
		}
		return
	}
	if len(candidates) > 1 {
		s.write("\n" + strings.Join(candidates, "  ") + "\n")
		s.redraw()
	}
}

func (s *Shell) run(line string) {
	line = strings.TrimSpace(line)
	if line == "" {
		return
	}
	if len(s.history) == 0 || s.history[len(s.history)-1] != line {
		s.history = append(s.history, line)
		if len(s.history) > maxHistory {
			s.history = s.history[len(s.history)-maxHistory:]
		}
	}
	fields := strings.Fields(line)
	name, args := fields[0], fields[1:]
	if cmd, ok := commands[name]; ok {
		cmd(s, args)
		return
	}
	s.write(name + ": command not found\n")
}
