package main

import (
	"bytes"
	"github.com/charmbracelet/colorprofile"
	"io"
	"strings"
	"testing"
	"time"

	tea "charm.land/bubbletea/v2"
	"github.com/charmbracelet/x/ansi"
)

func testShop(t *testing.T) *shopModel {
	// The fixture mirrors the live catalog, which includes the circle test
	// product (model + photo) so the photo views keep test coverage.
	ps, err := parseProducts([]byte(`[
	  {"id":"question","name":"Question Mark","tagline":"$ unknown","description":"Coming soon."},
	  {"id":"circle","name":"Circle","tagline":"Test product","description":"This is a test product.","images":["circle.png"]}
	]`))
	if err != nil {
		t.Fatal(err)
	}
	if live, err := loadProducts(); err != nil || len(live) != 2 || live[0].ID != "question" || live[1].ID != "circle" {
		t.Fatalf("live catalog: %v %v", live, err)
	}
	return newShopModel(ps, 100, 34, true)
}

func screen(m *shopModel) string { return ansi.Strip(m.View().Content) }

func TestShopRendersAndNavigates(t *testing.T) {
	m := testShop(t)
	m.started = time.Now().Add(-10 * time.Second) // finish typing
	s := screen(m)
	for _, want := range []string{"◆ SHOP", "Question Mark", "$ unknown", "Coming soon.", "[ see details ]", "[ exit ]", "● ○", "◀", "▶"} {
		if !strings.Contains(s, want) {
			t.Errorf("screen missing %q:\n%s", want, s)
		}
	}
	if got := len(strings.Split(s, "\n")); got != 34 {
		t.Errorf("screen height %d, want 34", got)
	}
	m.Update(tea.KeyPressMsg{Code: tea.KeyRight})
	if m.sel != 1 {
		t.Errorf("right arrow: sel=%d", m.sel)
	}
	m.Update(tea.KeyPressMsg{Code: tea.KeyLeft})
	m.Update(tea.KeyPressMsg{Code: tea.KeyLeft})
	if m.sel != 1 {
		t.Errorf("left wraps: sel=%d", m.sel)
	}
	t.Log("\n" + screen(m))
}

func key(m *shopModel, k tea.KeyPressMsg) tea.Cmd {
	_, cmd := m.Update(k)
	m.View()
	return cmd
}

var (
	enter = tea.KeyPressMsg{Code: tea.KeyEnter}
	esc   = tea.KeyPressMsg{Code: tea.KeyEscape}
	right = tea.KeyPressMsg{Code: tea.KeyRight}
	left  = tea.KeyPressMsg{Code: tea.KeyLeft}
)

// Enter walks browse -> detail -> confirm -> checkout.
func TestPurchaseFlow(t *testing.T) {
	m := testShop(t)
	if m.mode != modeBrowse {
		t.Fatal("starts in browse")
	}
	key(m, enter)
	if m.mode != modeDetail || !strings.Contains(screen(m), "Shaded") {
		t.Fatalf("1st enter should open details:\n%s", screen(m))
	}
	key(m, enter)
	if m.mode != modeConfirm || !strings.Contains(screen(m), "Purchase the Question Mark?") {
		t.Fatalf("2nd enter should confirm:\n%s", screen(m))
	}
	key(m, enter)
	if m.mode != modeCheckout || !strings.Contains(screen(m), "CHECKOUT") {
		t.Fatalf("3rd enter should open checkout:\n%s", screen(m))
	}
	// Esc walks back
	key(m, esc)
	if m.mode != modeDetail {
		t.Errorf("esc from checkout -> detail, got %v", m.mode)
	}
	key(m, esc)
	if m.mode != modeBrowse {
		t.Errorf("esc from detail -> browse, got %v", m.mode)
	}
	// cancel in the dialog returns to details
	key(m, enter)
	key(m, enter)
	key(m, right) // choose cancel
	key(m, enter)
	if m.mode != modeDetail {
		t.Errorf("cancel -> detail, got %v", m.mode)
	}
}

func TestDetailViews(t *testing.T) {
	m := testShop(t)
	key(m, right) // circle
	key(m, enter)
	got := []string{}
	for i := 0; i < 3; i++ {
		got = append(got, m.products[m.sel].views()[m.viewIdx].kind)
		key(m, right)
	}
	if strings.Join(got, ",") != "shaded,wire,photo" {
		t.Fatalf("circle views: %v", got)
	}
	if m.viewIdx != 0 {
		t.Errorf("views should wrap, viewIdx=%d", m.viewIdx)
	}
	key(m, left)
	if m.viewIdx != 2 {
		t.Errorf("left wraps to the photo, viewIdx=%d", m.viewIdx)
	}
	// Question mark has no photo: only two views
	m2 := testShop(t)
	key(m2, enter)
	if n := len(m2.products[m2.sel].views()); n != 2 {
		t.Errorf("question views = %d, want 2", n)
	}
}

func TestKittyPhoto(t *testing.T) {
	m := testShop(t)
	key(m, right)
	key(m, enter)
	_, cmd := m.Update(left) // wrap to the photo view
	if m.viewIdx != 2 {
		t.Fatalf("viewIdx=%d", m.viewIdx)
	}
	if cmd == nil {
		t.Fatal("entering the photo view should upload and place the image")
	}
	if !m.uploaded[100] || !strings.HasPrefix(m.placed, "100:") {
		t.Errorf("uploaded=%v placed=%q", m.uploaded, m.placed)
	}
	if m.syncImage() != nil {
		t.Error("a second sync with the same size should send nothing")
	}
	_, pc, pr := m.photoGeom()
	lines := kittyLines(100, pc, pr)
	if len(lines) != pr {
		t.Fatalf("placeholder rows %d, want %d", len(lines), pr)
	}
	// every placeholder cell must be exactly 1 column wide
	if w := ansi.StringWidth(lines[0]); w != pc {
		t.Errorf("placeholder row width %d, want %d", w, pc)
	}
	if !strings.Contains(lines[0], "\x1b[38;5;100m") {
		t.Error("image id should ride in the foreground color")
	}
	s := screen(m)
	if !strings.Contains(s, string(placeholder)) {
		t.Error("photo view should draw placeholder cells")
	}
	if got := strings.Count(kittyTransmit(100, m.products[1].imgs[0].data), "\x1b_G"); got < 2 {
		t.Errorf("a 85KB PNG should go out in several chunks, got %d", got)
	}
}

func TestPhotoFallbackAndWireframe(t *testing.T) {
	m := testShop(t)
	m.kitty = false
	key(m, right)
	key(m, enter)
	m.viewIdx = 2
	s := screen(m)
	if !strings.Contains(s, "▀") || !strings.Contains(s, "Kitty-graphics terminal") {
		t.Errorf("non-kitty terminals get half-blocks and a hint:\n%s", s)
	}
	m.viewIdx = 1
	w := screen(m)
	if !strings.ContainsAny(w, "/\\|-") || strings.Contains(w, "@@@@") {
		t.Errorf("wireframe view should draw line characters only:\n%s", w)
	}
	t.Log("\n" + w)
}

func TestShopMouse(t *testing.T) {
	m := testShop(t)
	click := func(id string) tea.Cmd {
		m.View() // refresh hit regions
		for _, r := range m.regions {
			if r.id == id {
				_, cmd := m.Update(tea.MouseClickMsg{X: r.x, Y: r.y, Button: tea.MouseLeft})
				m.View()
				return cmd
			}
		}
		t.Fatalf("no region %q in mode %v", id, m.mode)
		return nil
	}
	click("next")
	if m.sel != 1 {
		t.Errorf("next: sel=%d", m.sel)
	}
	click("dot:0")
	if m.sel != 0 {
		t.Errorf("dot: sel=%d", m.sel)
	}
	click("details")
	if m.mode != modeDetail {
		t.Fatal("details button")
	}
	click("next") // arrows switch views in the detail screen
	if m.viewIdx != 1 {
		t.Errorf("view arrow: viewIdx=%d", m.viewIdx)
	}
	click("view:0")
	if m.viewIdx != 0 {
		t.Errorf("view tab: viewIdx=%d", m.viewIdx)
	}
	click("buy")
	click("confirm")
	if m.mode != modeCheckout {
		t.Fatalf("mode=%v", m.mode)
	}
	click("done")
	if m.mode != modeBrowse {
		t.Errorf("done -> browse, got %v", m.mode)
	}
	if cmd := click("exit"); cmd == nil {
		t.Error("exit should quit")
	}
	// drag rotates
	yaw, pitch := m.yaw, m.pitch
	m.View()
	v := m.viewport
	m.Update(tea.MouseClickMsg{X: v.x + 2, Y: v.y + 2, Button: tea.MouseLeft})
	m.Update(tea.MouseMotionMsg{X: v.x + 6, Y: v.y + 5, Button: tea.MouseLeft})
	m.Update(tea.MouseReleaseMsg{X: v.x + 6, Y: v.y + 5})
	if m.yaw <= yaw || m.pitch <= pitch {
		t.Errorf("drag right/down should increase yaw and pitch: %v->%v %v->%v", yaw, m.yaw, pitch, m.pitch)
	}
}

func TestCtrlCQuits(t *testing.T) {
	m := testShop(t)
	_, cmd := m.Update(tea.KeyPressMsg{Code: 'c', Mod: tea.ModCtrl})
	if cmd == nil {
		t.Error("ctrl+c should quit")
	}
}

// The renderer must pass placeholder cells (U+10EEEE plus two combining marks)
// and the Kitty APC sequences through to the terminal untouched.
func TestKittyThroughRenderer(t *testing.T) {
	m := testShop(t)
	key(m, right)
	key(m, enter)
	m.viewIdx = 2
	m.uploaded, m.placed = map[int]bool{}, ""
	var out bytes.Buffer
	pr, pw := io.Pipe()
	prog := tea.NewProgram(m, tea.WithInput(pr), tea.WithOutput(&out),
		tea.WithColorProfile(colorprofile.TrueColor), tea.WithWindowSize(100, 34), tea.WithoutSignalHandler())
	go func() {
		time.Sleep(400 * time.Millisecond)
		prog.Quit()
	}()
	prog.Run()
	pw.Close()
	s := out.String()
	_, pc, pr2 := m.photoGeom()
	cells := strings.Count(s, string(placeholder))
	if cells < pc*pr2 {
		t.Errorf("placeholder cells in output: %d, want at least %d", cells, pc*pr2)
	}
	// the first cell must still carry its row and column marks
	if !strings.Contains(s, string([]rune{placeholder, diacritics[0], diacritics[0]})) {
		t.Error("row/column diacritics were dropped by the renderer")
	}
	if !strings.Contains(s, "\x1b_Ga=t,f=100,t=d,i=100") && !m.uploaded[100] {
		t.Error("image upload sequence missing")
	}
	t.Logf("output bytes=%d placeholder cells=%d uploadSeq=%v placeSeq=%v colorSeq=%v",
		len(s), cells, strings.Contains(s, "a=t,f=100"), strings.Contains(s, "a=p,U=1,i=100"), strings.Contains(s, "38;5;100m"))
}
