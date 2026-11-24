package main

import (
	"fmt"
	"math"
	"strings"
)

// Dark to bright, same ramp as src/shop/render.ts.
const ramp = " .:-=+*#%@"

// A terminal cell is roughly twice as tall as it is wide.
const cellAspect = 2.0

var light = normalize(vec3{-0.45, 0.6, 0.75})

func hypot3(v vec3) float64 { return math.Sqrt(v[0]*v[0] + v[1]*v[1] + v[2]*v[2]) }

func normalize(v vec3) vec3 {
	l := hypot3(v)
	if l == 0 {
		l = 1
	}
	return vec3{v[0] / l, v[1] / l, v[2] / l}
}

func rotate(v vec3, yaw, pitch float64) vec3 {
	cy, sy := math.Cos(yaw), math.Sin(yaw)
	cp, sp := math.Cos(pitch), math.Sin(pitch)
	x1 := v[0]*cy + v[2]*sy
	z1 := -v[0]*sy + v[2]*cy
	y2 := v[1]*cp - z1*sp
	z2 := v[1]*sp + z1*cp
	return vec3{x1, y2, z2}
}

// frame is a grid of colored characters.
type frame struct {
	cols, rows int
	chars      []byte
	colors     []uint32 // packed 0xRRGGBB
}

// renderModel software-rasterizes the model: orthographic projection, z-buffer,
// backface culling and flat Lambert shading. Port of src/shop/render.ts.
func renderModel(m *model, cols, rows int, yaw, pitch float64) frame {
	size := cols * rows
	f := frame{cols: cols, rows: rows, chars: make([]byte, size), colors: make([]uint32, size)}
	for i := range f.chars {
		f.chars[i] = ' '
	}
	depth := make([]float64, size)
	for i := range depth {
		depth[i] = math.Inf(-1)
	}
	scale := math.Min(float64(rows)/2, float64(cols)/2/cellAspect) * 0.92 / m.radius
	cx, cy := float64(cols)/2, float64(rows)/2

	for _, tri := range m.tris {
		a, b, c := rotate(tri.a, yaw, pitch), rotate(tri.b, yaw, pitch), rotate(tri.c, yaw, pitch)
		ux, uy, uz := b[0]-a[0], b[1]-a[1], b[2]-a[2]
		vx, vy, vz := c[0]-a[0], c[1]-a[1], c[2]-a[2]
		n := normalize(vec3{uy*vz - uz*vy, uz*vx - ux*vz, ux*vy - uy*vx})
		if n[2] <= 0 {
			continue
		}
		lambert := math.Max(0, n[0]*light[0]+n[1]*light[1]+n[2]*light[2])
		intensity := 0.12 + 0.88*lambert
		gi := int(intensity * float64(len(ramp)))
		if gi > len(ramp)-1 {
			gi = len(ramp) - 1
		}
		glyph := ramp[gi]
		k := 0.3 + 0.7*intensity
		ch := func(v float64) uint32 { return uint32(math.Min(255, math.Round(v*k))) }
		packed := ch(tri.color[0])<<16 | ch(tri.color[1])<<8 | ch(tri.color[2])

		var p [3][3]float64
		for i, q := range [3]vec3{a, b, c} {
			p[i] = [3]float64{cx + q[0]*scale*cellAspect, cy - q[1]*scale, q[2]}
		}
		minX := int(math.Max(0, math.Floor(math.Min(p[0][0], math.Min(p[1][0], p[2][0])))))
		maxX := int(math.Min(float64(cols-1), math.Ceil(math.Max(p[0][0], math.Max(p[1][0], p[2][0])))))
		minY := int(math.Max(0, math.Floor(math.Min(p[0][1], math.Min(p[1][1], p[2][1])))))
		maxY := int(math.Min(float64(rows-1), math.Ceil(math.Max(p[0][1], math.Max(p[1][1], p[2][1])))))
		area := (p[1][0]-p[0][0])*(p[2][1]-p[0][1]) - (p[2][0]-p[0][0])*(p[1][1]-p[0][1])
		if area == 0 {
			continue
		}
		for y := minY; y <= maxY; y++ {
			for x := minX; x <= maxX; x++ {
				px, py := float64(x)+0.5, float64(y)+0.5
				w0 := ((p[1][0]-px)*(p[2][1]-py) - (p[2][0]-px)*(p[1][1]-py)) / area
				w1 := ((p[2][0]-px)*(p[0][1]-py) - (p[0][0]-px)*(p[2][1]-py)) / area
				w2 := 1 - w0 - w1
				if w0 < 0 || w1 < 0 || w2 < 0 {
					continue
				}
				z := w0*p[0][2] + w1*p[1][2] + w2*p[2][2]
				i := y*cols + x
				if z > depth[i] {
					depth[i] = z
					f.chars[i] = glyph
					f.colors[i] = packed
				}
			}
		}
	}
	return f
}

// lines serializes the frame to truecolor ANSI, one string per row.
func (f frame) lines() []string {
	out := make([]string, f.rows)
	for y := 0; y < f.rows; y++ {
		var b strings.Builder
		var run strings.Builder
		runColor := uint32(0)
		flush := func() {
			if run.Len() == 0 {
				return
			}
			if runColor == 0 {
				b.WriteString(run.String())
			} else {
				fmt.Fprintf(&b, "\x1b[38;2;%d;%d;%dm%s\x1b[39m", runColor>>16&255, runColor>>8&255, runColor&255, run.String())
			}
			run.Reset()
		}
		for x := 0; x < f.cols; x++ {
			i := y*f.cols + x
			ch := f.chars[i]
			color := f.colors[i]
			if ch == ' ' {
				color = 0
			}
			if color != runColor {
				flush()
				runColor = color
			}
			run.WriteByte(ch)
		}
		flush()
		out[y] = b.String()
	}
	return out
}
