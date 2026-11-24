package main

import "math"

// renderWire draws the front-facing triangle edges as line characters. A second
// ASCII view of the same model (the shaded view is renderModel).
func renderWire(m *model, cols, rows int, yaw, pitch float64) frame {
	size := cols * rows
	f := frame{cols: cols, rows: rows, chars: make([]byte, size), colors: make([]uint32, size)}
	for i := range f.chars {
		f.chars[i] = ' '
	}
	scale := math.Min(float64(rows)/2, float64(cols)/2/cellAspect) * 0.92 / m.radius
	cx, cy := float64(cols)/2, float64(rows)/2
	plot := func(x, y int, ch byte, col uint32) {
		if x >= 0 && x < cols && y >= 0 && y < rows {
			f.chars[y*cols+x], f.colors[y*cols+x] = ch, col
		}
	}
	for _, tri := range m.tris {
		a, b, c := rotate(tri.a, yaw, pitch), rotate(tri.b, yaw, pitch), rotate(tri.c, yaw, pitch)
		ux, uy, uz := b[0]-a[0], b[1]-a[1], b[2]-a[2]
		vx, vy, vz := c[0]-a[0], c[1]-a[1], c[2]-a[2]
		if n := ux*vy - uy*vx; n <= 0 { // z of the face normal: facing away
			_ = uz
			_ = vz
			continue
		}
		col := uint32(tri.color[0])<<16 | uint32(tri.color[1])<<8 | uint32(tri.color[2])
		pt := func(q vec3) (float64, float64) { return cx + q[0]*scale*cellAspect, cy - q[1]*scale }
		pts := [3][2]float64{}
		pts[0][0], pts[0][1] = pt(a)
		pts[1][0], pts[1][1] = pt(b)
		pts[2][0], pts[2][1] = pt(c)
		for i := 0; i < 3; i++ {
			p, q := pts[i], pts[(i+1)%3]
			dx, dy := q[0]-p[0], q[1]-p[1]
			steps := int(math.Ceil(math.Max(math.Abs(dx), math.Abs(dy))))
			ch := byte('+')
			if steps > 0 {
				// slope in visual space (a cell is 2x taller than wide)
				ang := math.Atan2(-dy*cellAspect, dx) // screen up is positive
				ang = math.Mod(ang+math.Pi, math.Pi)  // 0..pi
				switch {
				case ang < math.Pi/8 || ang >= 7*math.Pi/8:
					ch = '-'
				case ang < 3*math.Pi/8:
					ch = '/'
				case ang < 5*math.Pi/8:
					ch = '|'
				default:
					ch = '\\'
				}
			}
			for s := 0; s <= steps; s++ {
				t := 0.0
				if steps > 0 {
					t = float64(s) / float64(steps)
				}
				plot(int(math.Floor(p[0]+dx*t)), int(math.Floor(p[1]+dy*t)), ch, col)
			}
		}
	}
	return f
}
