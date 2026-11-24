package main

import (
	"fmt"
	"io"
	"math"
	"strings"
	"time"

	tea "charm.land/bubbletea/v2"
	"github.com/charmbracelet/colorprofile"
	"github.com/charmbracelet/x/ansi"
)

const (
	accentFg   = "\x1b[38;2;74;222;128m"
	accentInv  = "\x1b[30;48;2;74;222;128m" // inverted: black on accent
	dimFg      = "\x1b[38;5;240m"
	greyFg     = "\x1b[38;5;245m"
	textFg     = "\x1b[38;5;252m"
	boldOn     = "\x1b[1m"
	styleReset = "\x1b[0m"

	typeInterval  = 22 * time.Millisecond
	autoSpin      = 0.6 // radians per second
	dragSens      = 0.05
	maxPitch      = 1.3
	descWidth     = 62
	defaultStatus = "Use ← → to browse, enter for details, ctrl+c to exit. Drag the model to spin it."
	detailStatus  = "← → change view · enter to buy · esc back · ctrl+c exit"
)

type tickMsg time.Time

func tick() tea.Cmd {
	return tea.Tick(33*time.Millisecond, func(t time.Time) tea.Msg { return tickMsg(t) })
}

// region is a clickable rectangle in screen cells.
type region struct {
	id         string // "prev", "next", "buy", "exit", "dot:N", "confirm", "cancel"
	x, y, w, h int
}

func (r region) contains(x, y int) bool { return x >= r.x && x < r.x+r.w && y >= r.y && y < r.y+r.h }

type shopMode int

const (
	modeBrowse   shopMode = iota // the catalog, one product at a time
	modeDetail                   // "see details": views of one product
	modeConfirm                  // "Purchase the X?" dialog
	modeCheckout                 // checkout
)

type shopModel struct {
	products []product
	sel      int
	w, h     int
	yaw      float64
	pitch    float64
	last     time.Time
	started  time.Time // when the current product's description began typing
	status   string
	mode     shopMode
	viewIdx  int    // which view of the product the detail screen shows
	choice   string // "confirm" | "cancel"
	hover    string
	dragging bool
	dragX    int
	dragY    int
	regions  []region
	viewport region

	kitty    bool                // terminal supports Kitty graphics (unicode placeholders)
	uploaded map[int]bool        // Kitty image ids already sent to the terminal
	placed   string              // last placement sent, "id:cols:rows"
	halfCach map[string][]string // half-block fallback renders, by size
}

func newShopModel(ps []product, w, h int, kitty bool) *shopModel {
	now := time.Now()
	return &shopModel{products: ps, w: w, h: h, yaw: 0.6, pitch: 0.35, last: now, started: now,
		status: defaultStatus, choice: "confirm", kitty: kitty, uploaded: map[int]bool{}, halfCach: map[string][]string{}}
}

func (m *shopModel) Init() tea.Cmd { return tick() }

func (m *shopModel) selectItem(i int) {
	n := len(m.products)
	m.sel = (i%n + n) % n
	m.status = defaultStatus
	m.started = time.Now()
}

func (m *shopModel) selectView(i int) {
	n := len(m.products[m.sel].views())
	m.viewIdx = (i%n + n) % n
}

func (m *shopModel) openDetail() {
	m.mode, m.viewIdx = modeDetail, 0
	m.status = detailStatus
}

func (m *shopModel) hit(x, y int) string {
	for _, r := range m.regions {
		if r.contains(x, y) {
			return r.id
		}
	}
	return ""
}

// advance is Enter: browse -> detail -> confirm -> checkout.
func (m *shopModel) advance() {
	switch m.mode {
	case modeBrowse:
		m.openDetail()
	case modeDetail:
		m.mode, m.choice = modeConfirm, "confirm"
	case modeConfirm:
		if m.choice == "confirm" {
			m.mode = modeCheckout
		} else {
			m.mode, m.status = modeDetail, detailStatus
		}
	case modeCheckout:
		m.mode, m.status = modeBrowse, defaultStatus
	}
}

// back is Esc: one step toward the catalog.
func (m *shopModel) back() {
	switch m.mode {
	case modeDetail:
		m.mode, m.status = modeBrowse, defaultStatus
	case modeConfirm:
		m.mode, m.status = modeDetail, detailStatus
	case modeCheckout:
		m.mode, m.status = modeDetail, detailStatus
	}
}

func (m *shopModel) activate(id string) {
	switch {
	case id == "prev" && m.mode == modeDetail:
		m.selectView(m.viewIdx - 1)
	case id == "next" && m.mode == modeDetail:
		m.selectView(m.viewIdx + 1)
	case id == "prev":
		m.selectItem(m.sel - 1)
	case id == "next":
		m.selectItem(m.sel + 1)
	case id == "details" || id == "buy" || id == "confirm" || id == "done":
		m.advance()
	case id == "cancel":
		m.choice = "cancel"
		m.advance()
	case id == "back":
		m.back()
	case strings.HasPrefix(id, "view:"):
		var i int
		fmt.Sscanf(id, "view:%d", &i)
		m.selectView(i)
	case strings.HasPrefix(id, "dot:"):
		var i int
		fmt.Sscanf(id, "dot:%d", &i)
		m.selectItem(i)
	}
}

func (m *shopModel) Update(msg tea.Msg) (tea.Model, tea.Cmd) {
	model, cmd := m.update(msg)
	if img := m.syncImage(); img != nil {
		return model, tea.Sequence(img, cmd)
	}
	return model, cmd
}

func (m *shopModel) update(msg tea.Msg) (tea.Model, tea.Cmd) {
	switch msg := msg.(type) {
	case tea.WindowSizeMsg:
		m.w, m.h = msg.Width, msg.Height
	case tickMsg:
		now := time.Time(msg)
		dt := math.Min(0.1, now.Sub(m.last).Seconds())
		m.last = now
		if !m.dragging {
			m.yaw += autoSpin * dt
		}
		return m, tick()
	case tea.KeyPressMsg:
		return m.key(msg.String())
	case tea.MouseClickMsg:
		mo := msg.Mouse()
		if mo.Button != tea.MouseLeft {
			break
		}
		if id := m.hit(mo.X, mo.Y); id != "" {
			if id == "exit" {
				return m, tea.Quit
			}
			m.activate(id)
		} else if m.mode == modeConfirm || m.mode == modeCheckout {
			m.back() // click on the backdrop
		} else if m.viewport.contains(mo.X, mo.Y) {
			m.dragging, m.dragX, m.dragY = true, mo.X, mo.Y
		}
	case tea.MouseMotionMsg:
		mo := msg.Mouse()
		if m.dragging {
			// Cells are ~2x taller than wide, so weight x less
			m.yaw += float64(mo.X-m.dragX) * dragSens * 1.4
			m.pitch = math.Max(-maxPitch, math.Min(maxPitch, m.pitch+float64(mo.Y-m.dragY)*dragSens*2))
			m.dragX, m.dragY = mo.X, mo.Y
		} else {
			m.hover = m.hit(mo.X, mo.Y)
			if m.mode == modeConfirm && (m.hover == "confirm" || m.hover == "cancel") {
				m.choice = m.hover
			}
		}
	case tea.MouseReleaseMsg:
		m.dragging = false
	}
	return m, nil
}

func (m *shopModel) key(k string) (tea.Model, tea.Cmd) {
	if k == "ctrl+c" {
		return m, tea.Quit
	}
	switch k {
	case "enter":
		m.advance()
		return m, nil
	case "esc":
		m.back()
		return m, nil
	}
	switch m.mode {
	case modeBrowse:
		switch k {
		case "right", "l":
			m.selectItem(m.sel + 1)
		case "left", "h":
			m.selectItem(m.sel - 1)
		case "q":
			return m, tea.Quit
		}
	case modeDetail:
		switch k {
		case "right", "l":
			m.selectView(m.viewIdx + 1)
		case "left", "h":
			m.selectView(m.viewIdx - 1)
		}
	case modeConfirm:
		switch k {
		case "left", "right", "tab", "h", "l":
			if m.choice == "confirm" {
				m.choice = "cancel"
			} else {
				m.choice = "confirm"
			}
		}
	}
	return m, nil
}

// ── Kitty graphics ────────────────────────────────────────────

// currentPhoto returns the photo being shown in the detail view, if any.
func (m *shopModel) currentPhoto() *productImage {
	if m.mode != modeDetail {
		return nil
	}
	p := m.products[m.sel]
	vs := p.views()
	if m.viewIdx >= len(vs) || vs[m.viewIdx].kind != "photo" {
		return nil
	}
	return &p.imgs[vs[m.viewIdx].photo]
}

// syncImage uploads the photo to the terminal the first time it's needed and
// (re)sends its placement when the cell size changes. The picture itself then
// appears through placeholder characters in the normal text output, so the
// renderer's diffing never fights with it.
func (m *shopModel) syncImage() tea.Cmd {
	if !m.kitty {
		return nil
	}
	img := m.currentPhoto()
	if img == nil {
		return nil
	}
	var cmds []tea.Cmd
	if !m.uploaded[img.id] {
		m.uploaded[img.id] = true
		cmds = append(cmds, tea.Raw(kittyTransmit(img.id, img.data)))
	}
	_, pc, pr := m.photoGeom()
	if key := fmt.Sprintf("%d:%d:%d", img.id, pc, pr); key != m.placed {
		m.placed = key
		cmds = append(cmds, tea.Raw(kittyPlace(img.id, pc, pr)))
	}
	if len(cmds) == 0 {
		return nil
	}
	return tea.Sequence(cmds...)
}

// cleanupImages frees every uploaded image; run when the shop exits.
func (m *shopModel) cleanupImages() string {
	var b strings.Builder
	for id := range m.uploaded {
		b.WriteString(kittyDelete(id))
	}
	return b.String()
}

// ── Layout ────────────────────────────────────────────────────

const (
	browseOverhead = 14
	detailOverhead = 15
)

// geom returns the size of the model/photo area for the current mode.
func (m *shopModel) geom() (rows, cols int) {
	over := browseOverhead
	if m.mode == modeDetail {
		over = detailOverhead
	}
	rows = max(4, m.h-over)
	cols = max(8, min(int(float64(rows)*1.9), m.w-12))
	return
}

// photoGeom sizes a (square) photo for the area: cells are twice as tall as
// wide, so it is twice as many columns as rows.
func (m *shopModel) photoGeom() (rows, cols, prows int) {
	rows, cols = m.geom()
	pc := min(cols, rows*2)
	pc -= pc % 2
	return rows, pc, pc / 2
}

// ── Rendering ─────────────────────────────────────────────────

func center(s string, w int) (string, int) {
	pad := (w - ansi.StringWidth(s)) / 2
	if pad < 0 {
		pad = 0
	}
	return strings.Repeat(" ", pad) + s, pad
}

func wrap(text string, width int) []string {
	var lines []string
	cur := ""
	for _, w := range strings.Fields(text) {
		if cur != "" && len([]rune(cur))+1+len([]rune(w)) > width {
			lines = append(lines, cur)
			cur = w
		} else if cur == "" {
			cur = w
		} else {
			cur += " " + w
		}
	}
	if cur != "" {
		lines = append(lines, cur)
	}
	return lines
}

func (m *shopModel) button(id, label string) string {
	if m.hover == id {
		return accentInv + label + styleReset
	}
	return accentFg + label + styleReset
}

func (m *shopModel) View() tea.View {
	m.regions = m.regions[:0]
	var lines []string
	switch m.mode {
	case modeBrowse:
		lines = m.browseLines()
	case modeDetail:
		lines = m.detailLines()
	case modeConfirm:
		lines = m.confirmLines()
	case modeCheckout:
		lines = m.checkoutLines()
	}
	for len(lines) < m.h {
		lines = append(lines, "")
	}
	if len(lines) > m.h {
		lines = lines[:m.h]
	}
	v := tea.NewView(strings.Join(lines, "\n"))
	v.AltScreen = true
	v.MouseMode = tea.MouseModeCellMotion
	v.WindowTitle = "shop"
	return v
}

// stage places the rows of a model/photo area, with ◀ ▶ on the middle row, and
// records the clickable arrows. width is the visible width of the rows.
func (m *shopModel) stage(out []string, rows []string, width int) []string {
	left := (m.w - width) / 2
	m.viewport = region{"viewport", left, len(out), width, len(rows)}
	for i, row := range rows {
		line := strings.Repeat(" ", left) + row
		if i == len(rows)/2 {
			ax := max(0, left-4)
			nx := left + width + 1
			line = strings.Repeat(" ", ax) + m.button("prev", " ◀ ") + strings.Repeat(" ", max(0, left-ax-3)) + row +
				strings.Repeat(" ", max(0, nx-left-width)) + m.button("next", " ▶ ")
			m.regions = append(m.regions, region{"prev", ax, len(out), 3, 1}, region{"next", nx, len(out), 3, 1})
		}
		out = append(out, line)
	}
	return out
}

func (m *shopModel) browseLines() []string {
	p := m.products[m.sel]
	rows, cols := m.geom()

	var out []string
	title, _ := center(accentFg+boldOn+"◆ SHOP"+styleReset, m.w)
	out = append(out, title, "")
	out = m.stage(out, renderModel(p.model, cols, rows, m.yaw, m.pitch).lines(), cols)

	// Dots
	var dots []string
	for i := range m.products {
		ch := dimFg + "○" + styleReset
		if i == m.sel {
			ch = accentFg + "●" + styleReset
		} else if m.hover == fmt.Sprintf("dot:%d", i) {
			ch = accentFg + "○" + styleReset
		}
		dots = append(dots, ch)
	}
	dotLine, pad := center(strings.Join(dots, " "), m.w)
	for i := range m.products {
		m.regions = append(m.regions, region{fmt.Sprintf("dot:%d", i), pad + i*2, len(out), 1, 1})
	}
	out = append(out, dotLine)

	// Detail
	nameLine, _ := center(accentFg+boldOn+p.Name+styleReset+"  "+greyFg+p.Tagline+styleReset, m.w)
	out = append(out, "", nameLine)

	desc := wrap(p.Description, descWidth)
	revealed := int(time.Since(m.started) / typeInterval)
	for i := 0; i < 4; i++ {
		if i >= len(desc) {
			out = append(out, "")
			continue
		}
		full := desc[i]
		n := min(revealed, len([]rune(full)))
		revealed -= len([]rune(full)) + 1
		if revealed < 0 {
			revealed = 0
		}
		_, pad := center(full, m.w)
		out = append(out, strings.Repeat(" ", pad)+textFg+string([]rune(full)[:n])+styleReset)
	}

	stats, _ := center(dimFg+fmt.Sprintf("%d vertices · %d faces · .obj", p.model.vertexCount, p.model.faceCount)+styleReset, m.w)
	out = append(out, stats, "")

	btns, bpad := center(m.button("details", "[ see details ]")+"    "+m.button("exit", "[ exit ]"), m.w)
	m.regions = append(m.regions, region{"details", bpad, len(out), 15, 1}, region{"exit", bpad + 19, len(out), 8, 1})
	out = append(out, btns, "")
	return append(out, m.statusLine(m.status))
}

func (m *shopModel) statusLine(status string) string {
	if ansi.StringWidth(status) > m.w-4 {
		status = ansi.Truncate(status, m.w-4, "…")
	}
	st, _ := center(dimFg+status+styleReset, m.w)
	return st
}

// photoLines renders the current photo into rows x cols cells.
func (m *shopModel) photoLines(img *productImage, cols, rows int) []string {
	if m.kitty {
		return kittyLines(img.id, cols, rows)
	}
	key := fmt.Sprintf("%d:%d:%d", img.id, cols, rows)
	if l, ok := m.halfCach[key]; ok {
		return l
	}
	if img.img == nil {
		img.img, _ = decodePNG(img.data)
	}
	if img.img == nil {
		return make([]string, rows)
	}
	l := halfBlockLines(img.img, cols, rows)
	m.halfCach[key] = l
	return l
}

func (m *shopModel) detailLines() []string {
	p := m.products[m.sel]
	vs := p.views()
	if m.viewIdx >= len(vs) {
		m.viewIdx = 0
	}
	v := vs[m.viewIdx]
	rows, cols := m.geom()

	var out []string
	title, _ := center(accentFg+boldOn+"◆ SHOP"+styleReset, m.w)
	name, _ := center(accentFg+boldOn+p.Name+styleReset+"  "+greyFg+p.Tagline+styleReset, m.w)
	out = append(out, title, "", name, "")

	switch v.kind {
	case "shaded":
		out = m.stage(out, renderModel(p.model, cols, rows, m.yaw, m.pitch).lines(), cols)
	case "wire":
		out = m.stage(out, renderWire(p.model, cols, rows, m.yaw, m.pitch).lines(), cols)
	case "photo":
		_, pc, pr := m.photoGeom()
		lines := m.photoLines(&p.imgs[v.photo], pc, pr)
		// vertically center the photo in the area
		top := (rows - len(lines)) / 2
		area := make([]string, 0, rows)
		for i := 0; i < top; i++ {
			area = append(area, "")
		}
		area = append(area, lines...)
		for len(area) < rows {
			area = append(area, "")
		}
		out = m.stage(out, area, pc)
	}

	// View tabs
	var tabs []string
	widths := make([]int, len(vs))
	for i, vw := range vs {
		label := " " + vw.label + " "
		widths[i] = len(label)
		switch {
		case i == m.viewIdx:
			tabs = append(tabs, accentInv+label+styleReset)
		case m.hover == fmt.Sprintf("view:%d", i):
			tabs = append(tabs, accentFg+label+styleReset)
		default:
			tabs = append(tabs, greyFg+label+styleReset)
		}
	}
	tabLine, pad := center(strings.Join(tabs, " "), m.w)
	x := pad
	for i := range vs {
		m.regions = append(m.regions, region{fmt.Sprintf("view:%d", i), x, len(out) + 1, widths[i], 1})
		x += widths[i] + 1
	}
	out = append(out, "", tabLine, "")

	desc := wrap(p.Description, descWidth)
	for i := 0; i < 4; i++ {
		if i >= len(desc) {
			out = append(out, "")
			continue
		}
		l, _ := center(textFg+desc[i]+styleReset, m.w)
		out = append(out, l)
	}

	btns, bpad := center(m.button("buy", "[ buy ]")+"    "+m.button("back", "[ back ]"), m.w)
	m.regions = append(m.regions, region{"buy", bpad, len(out) + 1, 7, 1}, region{"back", bpad + 11, len(out) + 1, 8, 1})
	out = append(out, "", btns, "")
	status := detailStatus
	if v.kind == "photo" && !m.kitty {
		status = "Photo shown in blocks: use a Kitty-graphics terminal (kitty, Ghostty) for the full image."
	}
	return append(out, m.statusLine(status))
}

func (m *shopModel) confirmLines() []string {
	p := m.products[m.sel]
	top := max(0, m.h/2-4)
	var out []string
	for i := 0; i < top; i++ {
		out = append(out, "")
	}
	head, _ := center(accentFg+boldOn+"Purchase the "+p.Name+"?"+styleReset, m.w)
	body, _ := center(greyFg+"Press enter to continue to checkout."+styleReset, m.w)
	out = append(out, head, "", body, "")
	btn := func(id, label string) string {
		if m.choice == id {
			return accentInv + label + styleReset
		}
		return accentFg + label + styleReset
	}
	row, pad := center(btn("confirm", "[ confirm ]")+"    "+btn("cancel", "[ cancel ]"), m.w)
	m.regions = append(m.regions, region{"confirm", pad, len(out), 11, 1}, region{"cancel", pad + 15, len(out), 10, 1})
	out = append(out, row, "")
	hint, _ := center(dimFg+"← → choose · enter select · esc back"+styleReset, m.w)
	return append(out, hint)
}

func (m *shopModel) checkoutLines() []string {
	p := m.products[m.sel]
	top := max(0, m.h/2-4)
	var out []string
	for i := 0; i < top; i++ {
		out = append(out, "")
	}
	head, _ := center(accentFg+boldOn+"◆ CHECKOUT"+styleReset, m.w)
	item, _ := center(textFg+"1 × "+p.Name+styleReset, m.w)
	body, _ := center(greyFg+"Checkout isn't open yet. Nothing was charged."+styleReset, m.w)
	out = append(out, head, "", item, "", body, "")
	btn, pad := center(m.button("done", "[ back to the shop ]"), m.w)
	m.regions = append(m.regions, region{"done", pad, len(out), 20, 1})
	out = append(out, btn, "")
	hint, _ := center(dimFg+"enter back to the shop · esc back to details · ctrl+c exit"+styleReset, m.w)
	return append(out, hint)
}

// runShop runs the Bubble Tea shop over the session until it quits.
func runShop(s *Shell) {
	ps, err := loadProducts()
	if err != nil {
		s.write("shop: " + err.Error() + "\n")
		return
	}
	w, h := s.rz.get()
	pr, pw := io.Pipe()
	env := append(append([]string{}, s.env...), "TERM="+s.term)
	kitty := kittyCapable(s.term)
	profile := colorprofile.Env(env)
	if kitty {
		// kitty and Ghostty are truecolor terminals; don't let a missing
		// $COLORTERM downsample the image id carried in the placeholder color
		profile = colorprofile.TrueColor
	}
	model := newShopModel(ps, w, h, kitty)
	prog := tea.NewProgram(model,
		tea.WithInput(pr),
		tea.WithOutput(s.out),
		tea.WithColorProfile(profile),
		tea.WithEnvironment(env),
		tea.WithWindowSize(w, h),
		tea.WithoutSignalHandler(),
	)
	s.rz.set(func(w, h int) { prog.Send(tea.WindowSizeMsg{Width: w, Height: h}) })
	defer s.rz.set(nil)

	done := make(chan struct{})
	go func() {
		for {
			select {
			case b, ok := <-s.in:
				if !ok {
					prog.Quit()
					return
				}
				if _, err := pw.Write(b); err != nil {
					return
				}
			case <-done:
				return
			}
		}
	}()
	prog.Run()
	close(done)
	pr.Close()
	pw.Close()
	s.write(model.cleanupImages() + "\x1b[0m")
}
