package main

import (
	"bytes"
	"encoding/base64"
	"fmt"
	"image"
	"image/color"
	_ "image/jpeg"
	"image/png"
	"strings"

	"github.com/charmbracelet/x/ansi"
)

// Combining marks that encode a row or column number in a Kitty "unicode
// placeholder" cell (first 128 of kitty's rowcolumn-diacritics.txt).
var diacritics = []rune{
	0x0305, 0x030D, 0x030E, 0x0310, 0x0312, 0x033D, 0x033E, 0x033F, 0x0346, 0x034A, 0x034B, 0x034C,
	0x0350, 0x0351, 0x0352, 0x0357, 0x035B, 0x0363, 0x0364, 0x0365, 0x0366, 0x0367, 0x0368, 0x0369,
	0x036A, 0x036B, 0x036C, 0x036D, 0x036E, 0x036F, 0x0483, 0x0484, 0x0485, 0x0486, 0x0487, 0x0592,
	0x0593, 0x0594, 0x0595, 0x0597, 0x0598, 0x0599, 0x059C, 0x059D, 0x059E, 0x059F, 0x05A0, 0x05A1,
	0x05A8, 0x05A9, 0x05AB, 0x05AC, 0x05AF, 0x05C4, 0x0610, 0x0611, 0x0612, 0x0613, 0x0614, 0x0615,
	0x0616, 0x0617, 0x0657, 0x0658, 0x0659, 0x065A, 0x065B, 0x065D, 0x065E, 0x06D6, 0x06D7, 0x06D8,
	0x06D9, 0x06DA, 0x06DB, 0x06DC, 0x06DF, 0x06E0, 0x06E1, 0x06E2, 0x06E4, 0x06E7, 0x06E8, 0x06EB,
	0x06EC, 0x0730, 0x0732, 0x0733, 0x0735, 0x0736, 0x073A, 0x073D, 0x073F, 0x0740, 0x0741, 0x0743,
	0x0745, 0x0747, 0x0749, 0x074A, 0x07EB, 0x07EC, 0x07ED, 0x07EE, 0x07EF, 0x07F0, 0x07F1, 0x07F3,
	0x0816, 0x0817, 0x0818, 0x0819, 0x081B, 0x081C, 0x081D, 0x081E, 0x081F, 0x0820, 0x0821, 0x0822,
	0x0823, 0x0825, 0x0826, 0x0827, 0x0829, 0x082A, 0x082B, 0x082C,
}

const placeholder = '\U0010EEEE'

// kittyCapable reports whether the client terminal supports Kitty graphics with
// unicode placeholders (kitty, Ghostty). Decided from $TERM, which ssh forwards.
func kittyCapable(term string) bool {
	t := strings.ToLower(term)
	return strings.Contains(t, "kitty") || strings.Contains(t, "ghostty")
}

// kittyTransmit uploads a PNG under image id `id` (stored, not displayed), in
// the protocol's 4096-byte base64 chunks.
func kittyTransmit(id int, pngData []byte) string {
	enc := base64.StdEncoding.EncodeToString(pngData)
	var b strings.Builder
	for i := 0; i < len(enc); i += 4096 {
		end := min(i+4096, len(enc))
		more := 1
		if end == len(enc) {
			more = 0
		}
		if i == 0 {
			fmt.Fprintf(&b, "\x1b_Ga=t,f=100,t=d,i=%d,q=2,m=%d;%s\x1b\\", id, more, enc[i:end])
		} else {
			fmt.Fprintf(&b, "\x1b_Gm=%d,q=2;%s\x1b\\", more, enc[i:end])
		}
	}
	return b.String()
}

// kittyPlace creates a virtual placement sized cols x rows cells for image id.
func kittyPlace(id, cols, rows int) string {
	return fmt.Sprintf("\x1b_Ga=p,U=1,i=%d,c=%d,r=%d,q=2\x1b\\", id, cols, rows)
}

// kittyDelete frees an uploaded image.
func kittyDelete(id int) string { return fmt.Sprintf("\x1b_Ga=d,d=I,i=%d,q=2\x1b\\", id) }

// kittyLines returns the placeholder cells for a cols x rows area. The image id
// rides in the foreground color (256-color form), the row and column in marks.
func kittyLines(id, cols, rows int) []string {
	cols, rows = min(cols, len(diacritics)), min(rows, len(diacritics))
	out := make([]string, rows)
	for r := 0; r < rows; r++ {
		var b strings.Builder
		fmt.Fprintf(&b, "\x1b[38;5;%dm", id)
		for c := 0; c < cols; c++ {
			b.WriteRune(placeholder)
			b.WriteRune(diacritics[r])
			b.WriteRune(diacritics[c])
		}
		b.WriteString("\x1b[39m")
		out[r] = b.String()
	}
	return out
}

// halfBlockLines draws the image with upper-half blocks (two pixels per cell),
// for terminals without Kitty graphics. Needs truecolor.
func halfBlockLines(img image.Image, cols, rows int) []string {
	b := img.Bounds()
	sample := func(x, y, w, h int) (uint8, uint8, uint8) {
		// box-average the source pixels covered by this output pixel
		x0, x1 := b.Min.X+x*b.Dx()/w, b.Min.X+(x+1)*b.Dx()/w
		y0, y1 := b.Min.Y+y*b.Dy()/h, b.Min.Y+(y+1)*b.Dy()/h
		if x1 <= x0 {
			x1 = x0 + 1
		}
		if y1 <= y0 {
			y1 = y0 + 1
		}
		var r, g, bl, n uint32
		for yy := y0; yy < y1; yy++ {
			for xx := x0; xx < x1; xx++ {
				c := color.NRGBAModel.Convert(img.At(xx, yy)).(color.NRGBA)
				r += uint32(c.R)
				g += uint32(c.G)
				bl += uint32(c.B)
				n++
			}
		}
		return uint8(r / n), uint8(g / n), uint8(bl / n)
	}
	out := make([]string, rows)
	for y := 0; y < rows; y++ {
		var sb strings.Builder
		for x := 0; x < cols; x++ {
			tr, tg, tb := sample(x, y*2, cols, rows*2)
			br, bg, bb := sample(x, y*2+1, cols, rows*2)
			fmt.Fprintf(&sb, "\x1b[38;2;%d;%d;%d;48;2;%d;%d;%dm▀", tr, tg, tb, br, bg, bb)
		}
		sb.WriteString("\x1b[0m")
		out[y] = sb.String()
	}
	return out
}

func decodePNG(data []byte) (image.Image, error) { return png.Decode(bytes.NewReader(data)) }

var _ = ansi.StringWidth
