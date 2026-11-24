package main

import (
	"context"
	_ "embed"
	"io"
	"io/fs"
	"os"
	"os/exec"
	"path/filepath"
	"strings"
	"time"

	"github.com/creack/pty"
)

//go:embed content/vimrc
var vimrc []byte

const (
	maxFileBytes  = 256 * 1024
	maxMirrorSize = 8 * 1024 * 1024
	vimMaxTime    = 30 * time.Minute
)

// vim runs the real Vim, restricted (-Z), inside a bubblewrap sandbox with no
// network, no access to the host filesystem, and resource limits. The user's
// virtual files are mirrored into a throwaway directory first, and any file Vim
// changed or created is written back to the virtual FS (and so to R2) after.
func runVim(s *Shell, args []string) {
	if vimBin == "" || bwrapBin == "" {
		s.write("vim: not available on this server\n")
		return
	}
	var files []string
	for _, a := range args {
		if strings.HasPrefix(a, "-") || strings.HasPrefix(a, "+") {
			s.write("vim: options are not supported over ssh\n")
			return
		}
		if n := s.fs.get(resolve(s.cwd, a)); n != nil && n.dir {
			s.write("vim: " + a + ": Is a directory\n")
			return
		}
		files = append(files, a)
	}
	if len(files) > 8 {
		s.write("vim: too many files\n")
		return
	}

	tmp, err := os.MkdirTemp("", "kssh-vim-")
	if err != nil {
		s.write("vim: " + err.Error() + "\n")
		return
	}
	defer os.RemoveAll(tmp)
	work := filepath.Join(tmp, "work")
	rc := filepath.Join(tmp, "rc")
	original := map[string]string{}
	budget := maxMirrorSize
	mirror(s.fs.root, "", work, original, &budget)
	if os.MkdirAll(work, 0o755) != nil || os.WriteFile(rc, vimrc, 0o644) != nil {
		s.write("vim: could not prepare sandbox\n")
		return
	}

	w, h := s.rz.get()
	ctx, cancel := context.WithTimeout(context.Background(), vimMaxTime)
	defer cancel()
	bw := []string{
		"--unshare-all", "--die-with-parent",
		"--ro-bind", "/usr", "/usr",
		"--symlink", "usr/bin", "/bin", "--symlink", "usr/lib", "/lib", "--symlink", "usr/lib64", "/lib64",
		"--ro-bind", rc, "/etc/vimrc-site",
		"--proc", "/proc", "--dev", "/dev", "--tmpfs", "/tmp",
		"--bind", work, "/work", "--chdir", "/work" + s.cwd,
		"--clearenv", "--setenv", "TERM", s.term, "--setenv", "HOME", "/work",
		"--setenv", "LANG", "C.UTF-8", "--setenv", "LC_ALL", "C.UTF-8",
		"/usr/bin/prlimit", "--as=1073741824", "--fsize=4194304", "--nofile=64", "--cpu=900", "--",
		vimBin, "-Z", "-n", "-N", "-i", "NONE", "-u", "/etc/vimrc-site", "--",
	}
	cmd := exec.CommandContext(ctx, bwrapBin, append(bw, files...)...)
	cmd.Env = []string{"PATH=/usr/bin:/bin"}
	ptmx, err := pty.StartWithSize(cmd, &pty.Winsize{Rows: uint16(h), Cols: uint16(w)})
	if err != nil {
		s.write("vim: " + err.Error() + "\n")
		return
	}
	s.rz.set(func(w, h int) { pty.Setsize(ptmx, &pty.Winsize{Rows: uint16(h), Cols: uint16(w)}) })

	outDone := make(chan struct{})
	go func() { io.Copy(s.out, ptmx); close(outDone) }()
	exited := make(chan struct{})
	go func() { cmd.Wait(); close(exited) }()

loop:
	for {
		select {
		case b, ok := <-s.in:
			if !ok {
				cancel()
				<-exited
				break loop
			}
			ptmx.Write(b)
		case <-exited:
			break loop
		}
	}
	s.rz.set(nil)
	ptmx.Close()
	<-outDone
	// Put the terminal back the way the shell expects it
	s.write("\x1b[?1049l\x1b[?1000l\x1b[?1002l\x1b[?1003l\x1b[?1006l\x1b[?25h\x1b[0m\r\n")

	writeBack(s, work, original)
}

// mirror writes the virtual tree into dir, recording originals by virtual path.
func mirror(n *node, vpath, dir string, original map[string]string, budget *int) {
	os.MkdirAll(dir, 0o755)
	for _, name := range n.names {
		c := n.children[name]
		if c.dir {
			mirror(c, vpath+"/"+name, filepath.Join(dir, name), original, budget)
			continue
		}
		if len(c.content) > maxFileBytes || *budget < len(c.content) {
			continue
		}
		*budget -= len(c.content)
		original[vpath+"/"+name] = c.content
		os.WriteFile(filepath.Join(dir, name), []byte(c.content), 0o644)
	}
}

// writeBack saves files Vim changed or created. Symlinks, devices and oversized
// files are ignored.
func writeBack(s *Shell, work string, original map[string]string) {
	count := 0
	filepath.WalkDir(work, func(path string, d fs.DirEntry, err error) error {
		if err != nil || !d.Type().IsRegular() {
			return nil
		}
		rel, err := filepath.Rel(work, path)
		if err != nil || strings.HasPrefix(rel, "..") {
			return nil
		}
		vp := "/" + filepath.ToSlash(rel)
		if len(vp) > 200 {
			return nil
		}
		info, err := d.Info()
		if err != nil || info.Size() > maxFileBytes {
			return nil
		}
		data, err := os.ReadFile(path)
		if err != nil {
			return nil
		}
		content := string(data)
		if old, ok := original[vp]; ok && old == content {
			return nil
		}
		if count++; count > 50 {
			return nil
		}
		s.fs.Write(vp, content)
		return nil
	})
}
