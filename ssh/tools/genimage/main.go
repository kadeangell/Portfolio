// genimage renders the placeholder product photo for the circle: a smooth-shaded,
// banded sphere on a studio-style backdrop. Replace content/images/circle.png
// with a real photograph whenever there is one.
//
//	go run ./tools/genimage
package main

import (
	"image"
	"image/color"
	"image/png"
	"math"
	"os"
)

const size, ss = 640, 3

type v3 [3]float64

func norm(v v3) v3 {
	l := math.Sqrt(v[0]*v[0] + v[1]*v[1] + v[2]*v[2])
	return v3{v[0] / l, v[1] / l, v[2] / l}
}
func dot(a, b v3) float64 { return a[0]*b[0] + a[1]*b[1] + a[2]*b[2] }

// latitude bands, same palette as the model's materials
var bands = []v3{{255, 107, 107}, {255, 209, 102}, {46, 196, 182}, {167, 139, 250}}

func main() {
	light := norm(v3{-0.45, 0.6, 0.75})
	img := image.NewNRGBA(image.Rect(0, 0, size, size))
	for py := 0; py < size; py++ {
		for px := 0; px < size; px++ {
			var r, g, b float64
			for sy := 0; sy < ss; sy++ {
				for sx := 0; sx < ss; sx++ {
					x := (float64(px)+(float64(sx)+0.5)/ss)/size*2 - 1
					y := 1 - (float64(py)+(float64(sy)+0.5)/ss)/size*2
					cr, cg, cb := shade(x, y, light)
					r, g, b = r+cr, g+cg, b+cb
				}
			}
			n := float64(ss * ss)
			img.SetNRGBA(px, py, color.NRGBA{uint8(r / n), uint8(g / n), uint8(b / n), 255})
		}
	}
	f, err := os.Create("content/images/circle.png")
	if err != nil {
		panic(err)
	}
	defer f.Close()
	if err := png.Encode(f, img); err != nil {
		panic(err)
	}
}

func shade(x, y float64, light v3) (r, g, b float64) {
	const rad = 0.62
	// backdrop: soft vignette
	d := math.Hypot(x, y+0.05)
	bg := 28 + 22*math.Max(0, 1-d)
	// contact shadow under the sphere
	sx, sy := x/0.7, (y+0.72)/0.12
	shadow := math.Max(0, 1-(sx*sx+sy*sy))
	bg *= 1 - 0.8*shadow
	r, g, b = bg, bg, bg*1.05

	x0, y0 := x, y-0.0 // sphere centered, slightly above the shadow
	if x0*x0+y0*y0 >= rad*rad {
		return
	}
	z := math.Sqrt(rad*rad - x0*x0 - y0*y0)
	n := norm(v3{x0, y0, z})
	// latitude band from the y component
	band := int(math.Floor((n[1] + 1) / 2 * float64(len(bands))))
	band = max(0, min(len(bands)-1, band))
	base := bands[band]
	diff := math.Max(0, dot(n, light))
	view := v3{0, 0, 1}
	refl := v3{2*dot(n, light)*n[0] - light[0], 2*dot(n, light)*n[1] - light[1], 2*dot(n, light)*n[2] - light[2]}
	spec := math.Pow(math.Max(0, dot(refl, view)), 40) * 0.55
	rim := math.Pow(1-n[2], 3) * 0.18
	k := 0.22 + 0.85*diff
	return math.Min(255, base[0]*k+255*spec+255*rim*0.3),
		math.Min(255, base[1]*k+255*spec+255*rim*0.3),
		math.Min(255, base[2]*k+255*spec+255*rim*0.5)
}
