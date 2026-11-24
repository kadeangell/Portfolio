package main

import (
	"strconv"
	"strings"
)

type vec3 [3]float64

type triangle struct {
	a, b, c vec3
	color   vec3 // 0-255 per channel
}

type model struct {
	tris        []triangle
	vertexCount int
	faceCount   int
	radius      float64
}

// parseMtl reads the Kd diffuse colors out of a .mtl file.
func parseMtl(src string) map[string]vec3 {
	out := map[string]vec3{}
	cur := ""
	for _, raw := range strings.Split(src, "\n") {
		line := strings.TrimSpace(raw)
		switch {
		case strings.HasPrefix(line, "newmtl "):
			cur = strings.TrimSpace(line[7:])
		case cur != "" && strings.HasPrefix(line, "Kd "):
			f := strings.Fields(line[3:])
			if len(f) >= 3 {
				r, _ := strconv.ParseFloat(f[0], 64)
				g, _ := strconv.ParseFloat(f[1], 64)
				b, _ := strconv.ParseFloat(f[2], 64)
				out[cur] = vec3{r * 255, g * 255, b * 255}
			}
		}
	}
	return out
}

// parseObj parses a Wavefront .obj (v, f, usemtl). Faces with more than three
// vertices are fan-triangulated; each face takes the color of the material
// active when it was declared. Matches src/shop/obj.ts.
func parseObj(objSrc, mtlSrc string) *model {
	mats := parseMtl(mtlSrc)
	var verts []vec3
	m := &model{}
	color := vec3{200, 200, 200}
	for _, raw := range strings.Split(objSrc, "\n") {
		line := strings.TrimSpace(raw)
		switch {
		case strings.HasPrefix(line, "v "):
			f := strings.Fields(line[2:])
			if len(f) >= 3 {
				x, _ := strconv.ParseFloat(f[0], 64)
				y, _ := strconv.ParseFloat(f[1], 64)
				z, _ := strconv.ParseFloat(f[2], 64)
				verts = append(verts, vec3{x, y, z})
			}
		case strings.HasPrefix(line, "usemtl "):
			if c, ok := mats[strings.TrimSpace(line[7:])]; ok {
				color = c
			}
		case strings.HasPrefix(line, "f "):
			var idx []int
			for _, tok := range strings.Fields(line[2:]) {
				n, _ := strconv.Atoi(strings.Split(tok, "/")[0])
				if n < 0 {
					idx = append(idx, len(verts)+n)
				} else {
					idx = append(idx, n-1)
				}
			}
			m.faceCount++
			for i := 1; i < len(idx)-1; i++ {
				if idx[0] < 0 || idx[i] < 0 || idx[i+1] < 0 || idx[0] >= len(verts) || idx[i] >= len(verts) || idx[i+1] >= len(verts) {
					continue
				}
				m.tris = append(m.tris, triangle{verts[idx[0]], verts[idx[i]], verts[idx[i+1]], color})
			}
		}
	}
	m.vertexCount = len(verts)
	m.radius = 1
	r := 0.0
	for _, t := range m.tris {
		for _, v := range [3]vec3{t.a, t.b, t.c} {
			if d := hypot3(v); d > r {
				r = d
			}
		}
	}
	if r > 0 {
		m.radius = r
	}
	return m
}
