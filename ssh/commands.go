package main

import (
	"fmt"
	"math"
	"sort"
	"strings"
	"time"
)

type command func(s *Shell, args []string)

var commands map[string]command

func commandNames() []string {
	names := make([]string, 0, len(commands))
	for n := range commands {
		names = append(names, n)
	}
	sort.Strings(names)
	return names
}

func init() {
	commands = map[string]command{
		"help": func(s *Shell, _ []string) {
			s.write("Available commands:\n" +
				"  help     Show this message\n" +
				"  clear    Clear the screen\n" +
				"  echo     Print arguments\n" +
				"  whoami   Display current user\n" +
				"  date     Display current date\n" +
				"  pwd      Print working directory\n" +
				"  ls       List directory contents\n" +
				"  cd       Change directory\n" +
				"  cat      Print file contents\n" +
				"  history  Show command history\n" +
				"  vim      Open file in Vim editor\n" +
				"  github   Show GitHub profile\n" +
				"  linkedin Show LinkedIn profile\n" +
				"  legacy   Show legacy portfolio\n" +
				"  shop     Browse the shape shop\n" +
				"  rainbow  Test color output\n" +
				"  exit     Close the connection\n")
		},
		"history": func(s *Shell, _ []string) {
			if len(s.history) == 0 {
				s.write("(no history)\n")
				return
			}
			for i, h := range s.history {
				s.write(fmt.Sprintf("  %4d  %s\n", i+1, h))
			}
		},
		"clear":  func(s *Shell, _ []string) { s.write("\x1b[2J\x1b[H") },
		"echo":   func(s *Shell, a []string) { s.write(strings.Join(a, " ") + "\n") },
		"whoami": func(s *Shell, _ []string) { s.write("guest\n") },
		"date":   func(s *Shell, _ []string) { s.write(time.Now().Format("Mon Jan 02 2006 15:04:05 MST") + "\n") },
		"pwd":    func(s *Shell, _ []string) { s.write(s.cwd + "\n") },
		"exit":   func(s *Shell, _ []string) { s.write("logout\n"); s.done = true },
		"ls":     ls,
		"cd": func(s *Shell, a []string) {
			if len(a) == 0 || a[0] == "~" {
				s.cwd = "/"
				return
			}
			p := resolve(s.cwd, a[0])
			if n := s.fs.get(p); n == nil || !n.dir {
				s.write("cd: " + a[0] + ": No such directory\n")
				return
			}
			s.cwd = p
		},
		"cat": func(s *Shell, a []string) {
			if len(a) == 0 {
				s.write("cat: missing file operand\n")
				return
			}
			n := s.fs.get(resolve(s.cwd, a[0]))
			switch {
			case n == nil:
				s.write("cat: " + a[0] + ": No such file or directory\n")
			case n.dir:
				s.write("cat: " + a[0] + ": Is a directory\n")
			default:
				s.write(n.content)
			}
		},
		"github":   func(s *Shell, _ []string) { s.write("https://github.com/kadeangell\n") },
		"linkedin": func(s *Shell, _ []string) { s.write("https://www.linkedin.com/in/kade-angell\n") },
		"legacy":   func(s *Shell, _ []string) { s.write("https://www.kadeangell.com/legacy/\n") },
		"shop":     func(s *Shell, _ []string) { runShop(s) },
		"rainbow":  rainbow,
	}
	for _, n := range []string{"vim", "vi", "nvim"} {
		commands[n] = runVim
	}
}

func rainbow(s *Shell, _ []string) {
	const reset = "\x1b[0m"
	colors := []struct{ code, name string }{
		{"31", "red"}, {"33", "yellow"}, {"32", "green"}, {"36", "cyan"}, {"34", "blue"}, {"35", "magenta"},
	}
	for _, c := range colors {
		s.write("\x1b[" + c.code + "m" + strings.Repeat("█", 8) + reset)
	}
	s.write("\n")
	for _, c := range colors {
		s.write("\x1b[" + c.code + "m" + fmt.Sprintf("%-8s", c.name) + reset)
	}
	s.write("\n")
	for _, c := range colors {
		s.write("\x1b[" + c.code + ";1m" + strings.Repeat("█", 8) + reset)
	}
	s.write("\n\n  256-color gradient:\n  ")
	for i := 196; i <= 201; i++ {
		s.write(fmt.Sprintf("\x1b[38;5;%dm██%s", i, reset))
	}
	for i := 207; i >= 202; i-- {
		s.write(fmt.Sprintf("\x1b[38;5;%dm██%s", i, reset))
	}
	s.write("\n\n  RGB true color:\n  ")
	for i := 0; i < 48; i++ {
		r, g, b := hsl(float64(i)/48*360, 1, 0.5)
		s.write(fmt.Sprintf("\x1b[38;2;%d;%d;%dm█%s", r, g, b, reset))
	}
	s.write("\n")
}

func hsl(h, sat, l float64) (int, int, int) {
	a := sat * math.Min(l, 1-l)
	f := func(n float64) int {
		k := math.Mod(n+h/30, 12)
		return int(math.Round((l - a*math.Max(-1, math.Min(math.Min(k-3, 9-k), 1))) * 255))
	}
	return f(0), f(8), f(4)
}

// ls supports -a (include . and ..), -l (one per line with sizes) and -1.
func ls(s *Shell, args []string) {
	var all, long, one bool
	var paths []string
	for _, arg := range args {
		if len(arg) > 1 && strings.HasPrefix(arg, "-") && !strings.HasPrefix(arg, "--") {
			for _, f := range arg[1:] {
				switch f {
				case 'a', 'A':
					all = true
				case 'l':
					long = true
				case '1':
					one = true
				default:
					s.write(fmt.Sprintf("ls: invalid option -- '%c'\n", f))
					return
				}
			}
		} else {
			paths = append(paths, arg)
		}
	}
	target, label := s.cwd, ""
	if len(paths) > 0 {
		target, label = resolve(s.cwd, paths[0]), paths[0]
	}
	n := s.fs.get(target)
	if n == nil {
		if label == "" {
			label = target
		}
		s.write("ls: " + label + ": No such directory\n")
		return
	}
	if !n.dir {
		s.write(label + "\n")
		return
	}
	type row struct {
		text string
		size int
		dir  bool
	}
	dirText := func(name string) string { return "\x1b[1;34m" + name + "/\x1b[0m" }
	var rows []row
	if all {
		rows = append(rows, row{dirText("."), 0, true}, row{dirText(".."), 0, true})
	}
	for _, name := range n.names {
		c := n.children[name]
		if c.dir {
			rows = append(rows, row{dirText(name), 0, true})
		} else {
			rows = append(rows, row{name, len(c.content), false})
		}
	}
	switch {
	case long:
		for _, r := range rows {
			mode := "-rw-r--r--"
			if r.dir {
				mode = "drwxr-xr-x"
			}
			s.write(fmt.Sprintf("%s %6d %s\n", mode, r.size, r.text))
		}
	case one:
		for _, r := range rows {
			s.write(r.text + "\n")
		}
	default:
		texts := make([]string, len(rows))
		for i, r := range rows {
			texts[i] = r.text
		}
		s.write(strings.Join(texts, "  ") + "\n")
	}
}
