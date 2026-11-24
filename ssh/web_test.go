package main

import (
	"net/http"
	"net/http/httptest"
	"os"
	"strings"
	"testing"
)

func get(method, ua string) *httptest.ResponseRecorder {
	req := httptest.NewRequest(method, "/some/path?x=1", nil)
	req.Header.Set("User-Agent", ua)
	rec := httptest.NewRecorder()
	webHandler().ServeHTTP(rec, req)
	return rec
}

func TestCurlGetsText(t *testing.T) {
	for _, ua := range []string{"curl/8.5.0", "Wget/1.21", "HTTPie/3.2.2", "xh/0.22"} {
		rec := get("GET", ua)
		if rec.Code != 200 || !strings.HasPrefix(rec.Header().Get("Content-Type"), "text/plain") {
			t.Errorf("%s: code=%d type=%q", ua, rec.Code, rec.Header().Get("Content-Type"))
		}
		if !strings.Contains(rec.Body.String(), "nice, you curl'd my website") {
			t.Errorf("%s: body missing message", ua)
		}
	}
	if rec := get("HEAD", "curl/8.5.0"); rec.Code != 200 || rec.Body.Len() != 0 {
		t.Errorf("HEAD: code=%d bodyLen=%d", rec.Code, rec.Body.Len())
	}
}

func TestBrowsersRedirect(t *testing.T) {
	rec := get("GET", "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/120 Safari/537.36")
	if rec.Code != http.StatusMovedPermanently || rec.Header().Get("Location") != "https://www.kadeangell.com/some/path?x=1" {
		t.Errorf("code=%d location=%q", rec.Code, rec.Header().Get("Location"))
	}
	if get("GET", "").Code != http.StatusMovedPermanently {
		t.Error("no User-Agent should redirect")
	}
}

func TestMessageIsPlainText(t *testing.T) {
	if strings.Contains(curlText, "\x1b") || strings.Contains(curlText, "<html") {
		t.Error("curl text should be plain: no escapes or HTML")
	}
	for _, line := range logo {
		if !strings.Contains(curlText, strings.TrimRight(line, " ")) {
			t.Errorf("logo line missing from curl text: %q", line)
		}
	}
	if os.Getenv("SHOW") != "" {
		t.Log("\n" + curlText)
	}
}
