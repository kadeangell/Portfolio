package main

import (
	"bytes"
	_ "embed"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"sort"
	"strings"
	"time"
)

// The default tree mirrors src/terminal/fs/tree.ts on the website.
//
//go:embed content/tree.json
var defaultTree []byte

// node is a file or a directory. Directories keep insertion order, like the
// website's object-keyed tree, so `ls` output matches.
type node struct {
	dir      bool
	content  string
	names    []string
	children map[string]*node
}

func newDir() *node { return &node{dir: true, children: map[string]*node{}} }

func (n *node) put(name string, c *node) {
	if _, ok := n.children[name]; !ok {
		n.names = append(n.names, name)
	}
	n.children[name] = c
}

// parseTree decodes the JSON tree keeping key order (encoding/json maps lose it).
func parseTree(dec *json.Decoder) (*node, error) {
	if _, err := dec.Token(); err != nil { // the opening '{'
		return nil, err
	}
	return parseTreeBody(dec)
}

// parseTreeBody parses object members after the opening '{' has been consumed.
func parseTreeBody(dec *json.Decoder) (*node, error) {
	d := newDir()
	for dec.More() {
		key, err := dec.Token()
		if err != nil {
			return nil, err
		}
		name := key.(string)
		tok, err := dec.Token()
		if err != nil {
			return nil, err
		}
		switch v := tok.(type) {
		case string:
			d.put(name, &node{content: v})
		case json.Delim:
			child, err := parseTreeBody(dec)
			if err != nil {
				return nil, err
			}
			d.put(name, child)
		}
	}
	if _, err := dec.Token(); err != nil { // '}'
		return nil, err
	}
	return d, nil
}

// FS is one session's virtual filesystem, backed by the user's files in R2
// through the website's /api/fs endpoint. Reads hit memory; writes go through.
type FS struct {
	root   *node
	api    string // e.g. https://www.kadeangell.com/api/fs/guest%40kadeangell.com ("" = memory only)
	client *http.Client
}

func NewFS(apiBase, user string) (*FS, error) {
	root, err := parseTree(json.NewDecoder(bytes.NewReader(defaultTree)))
	if err != nil {
		return nil, err
	}
	f := &FS{root: root, client: &http.Client{Timeout: 6 * time.Second}}
	if apiBase != "" {
		f.api = strings.TrimRight(apiBase, "/") + "/api/fs/" + url.PathEscape(user)
		f.load()
	}
	return f, nil
}

// load applies the user's saved files over the default tree. Failures are
// ignored so the shell still works offline.
func (f *FS) load() {
	res, err := f.client.Get(f.api)
	if err != nil {
		return
	}
	defer res.Body.Close()
	if res.StatusCode != 200 {
		return
	}
	var body struct {
		Files map[string]string `json:"files"`
	}
	if json.NewDecoder(res.Body).Decode(&body) != nil {
		return
	}
	paths := make([]string, 0, len(body.Files))
	for p := range body.Files {
		paths = append(paths, p)
	}
	sort.Strings(paths)
	for _, p := range paths {
		f.apply(p, body.Files[p])
	}
}

func resolve(cwd, p string) string {
	if p == "~" || p == "" {
		return "/"
	}
	var parts []string
	if strings.HasPrefix(p, "/") {
		parts = strings.Split(p, "/")
	} else {
		parts = append(strings.Split(cwd, "/"), strings.Split(p, "/")...)
	}
	var out []string
	for _, s := range parts {
		switch s {
		case "", ".":
		case "..":
			if len(out) > 0 {
				out = out[:len(out)-1]
			}
		default:
			out = append(out, s)
		}
	}
	return "/" + strings.Join(out, "/")
}

func (f *FS) get(abs string) *node {
	cur := f.root
	for _, part := range strings.Split(abs, "/") {
		if part == "" {
			continue
		}
		if !cur.dir {
			return nil
		}
		next, ok := cur.children[part]
		if !ok {
			return nil
		}
		cur = next
	}
	return cur
}

// apply sets a file in memory, creating parent directories.
func (f *FS) apply(abs, content string) bool {
	parts := strings.FieldsFunc(abs, func(r rune) bool { return r == '/' })
	if len(parts) == 0 {
		return false
	}
	name := parts[len(parts)-1]
	cur := f.root
	for _, part := range parts[:len(parts)-1] {
		child, ok := cur.children[part]
		if !ok {
			child = newDir()
			cur.put(part, child)
		}
		if !child.dir {
			return false
		}
		cur = child
	}
	if existing, ok := cur.children[name]; ok && existing.dir {
		return false
	}
	cur.put(name, &node{content: content})
	return true
}

// Write sets a file and persists it to the bucket (best effort).
func (f *FS) Write(abs, content string) bool {
	if !f.apply(abs, content) {
		return false
	}
	if f.api != "" {
		segs := strings.Split(abs, "/")
		for i, s := range segs {
			segs[i] = url.PathEscape(s)
		}
		req, err := http.NewRequest(http.MethodPut, f.api+strings.Join(segs, "/"), bytes.NewBufferString(content))
		if err == nil {
			if res, err := f.client.Do(req); err == nil {
				io.Copy(io.Discard, res.Body)
				res.Body.Close()
			}
		}
	}
	return true
}

func (f *FS) String() string { return fmt.Sprintf("fs(%s)", f.api) }
