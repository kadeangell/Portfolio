package main

import (
	"context"
	"errors"
	"flag"
	"log"
	"net"
	"os"
	"os/exec"
	"os/signal"
	"path/filepath"
	"sync"
	"syscall"
	"time"

	"charm.land/ssh"
	"charm.land/wish/v2"
	gossh "golang.org/x/crypto/ssh"
)

const guestUser = "guest@kadeangell.com"

var (
	vimBin   string
	bwrapBin string
)

// findTools locates vim (resolving symlinks like /etc/alternatives) and bwrap.
func findTools(vimOverride string) {
	if p, err := exec.LookPath("bwrap"); err == nil {
		bwrapBin = p
	}
	v := vimOverride
	if v == "" {
		if p, err := exec.LookPath("vim"); err == nil {
			v = p
		}
	}
	if v != "" {
		if r, err := filepath.EvalSymlinks(v); err == nil {
			vimBin = r
		}
	}
	if vimBin == "" || bwrapBin == "" {
		log.Printf("vim sandbox unavailable (vim=%q bwrap=%q)", vimBin, bwrapBin)
	}
}

func main() {
	addr := flag.String("addr", ":2222", "listen address")
	hostKey := flag.String("host-key", "host_key_ed25519", "host key path (created if missing)")
	api := flag.String("api", "https://www.kadeangell.com", "site origin whose /api/fs stores files ('' = in-memory only)")
	vimFlag := flag.String("vim", "", "path to the vim binary (default: first vim on PATH)")
	flag.Parse()
	findTools(*vimFlag)

	srv, err := wish.NewServer(
		wish.WithAddress(*addr),
		wish.WithHostKeyPath(*hostKey),
		// Open to everyone: no password or key required. Everyone is the guest.
		wish.WithPublicKeyAuth(func(ssh.Context, ssh.PublicKey) bool { return true }),
		wish.WithPasswordAuth(func(ssh.Context, string) bool { return true }),
		wish.WithKeyboardInteractiveAuth(func(ssh.Context, gossh.KeyboardInteractiveChallenge) bool { return true }),
		wish.WithIdleTimeout(10*time.Minute),
		wish.WithMaxTimeout(2*time.Hour),
		wish.WithMiddleware(func(next ssh.Handler) ssh.Handler {
			return func(sess ssh.Session) { handle(sess, *api) }
		}),
	)
	if err != nil {
		log.Fatal(err)
	}

	done := make(chan os.Signal, 1)
	signal.Notify(done, os.Interrupt, syscall.SIGTERM)
	go func() {
		log.Printf("listening on %s", *addr)
		if err := srv.ListenAndServe(); err != nil && !errors.Is(err, ssh.ErrServerClosed) && !errors.Is(err, net.ErrClosed) {
			log.Fatal(err)
		}
	}()
	<-done
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	srv.Shutdown(ctx)
}

// Resizer tracks the terminal size and notifies whoever is currently running
// full-screen (vim or the shop) when it changes.
type Resizer struct {
	mu   sync.Mutex
	w, h int
	cb   func(w, h int)
}

func (r *Resizer) get() (int, int) {
	r.mu.Lock()
	defer r.mu.Unlock()
	return r.w, r.h
}

func (r *Resizer) set(cb func(w, h int)) {
	r.mu.Lock()
	r.cb = cb
	r.mu.Unlock()
}

func (r *Resizer) update(w, h int) {
	r.mu.Lock()
	r.w, r.h = w, h
	cb := r.cb
	r.mu.Unlock()
	if cb != nil {
		cb(w, h)
	}
}

func handle(sess ssh.Session, api string) {
	defer sess.Close()
	pty, winCh, isPty := sess.Pty()
	if !isPty {
		sess.Write([]byte("This site needs a terminal. Run: ssh -t " + sess.User() + "@kadeangell.com\n"))
		return
	}
	fs, err := NewFS(api, guestUser)
	if err != nil {
		log.Printf("fs: %v", err)
		return
	}
	rz := &Resizer{w: max(pty.Window.Width, 20), h: max(pty.Window.Height, 10)}
	go func() {
		for w := range winCh {
			rz.update(max(w.Width, 20), max(w.Height, 10))
		}
	}()
	// One reader owns the session's input; whatever is in the foreground
	// (the shell, vim, the shop) takes chunks from this channel.
	in := make(chan []byte)
	go func() {
		defer close(in)
		buf := make([]byte, 4096)
		for {
			n, err := sess.Read(buf)
			if n > 0 {
				in <- append([]byte(nil), buf[:n]...)
			}
			if err != nil {
				return
			}
		}
	}()
	newShell(sess, in, rz, pty.Term, sess.Environ(), fs).Run()
}
