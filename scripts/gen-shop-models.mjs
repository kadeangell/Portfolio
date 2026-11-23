// Generates the shop's .obj/.mtl models. Run: node scripts/gen-shop-models.mjs
// All models are convex and centered on the origin; faces wind counter-clockwise
// when viewed from outside.
import { writeFileSync } from 'node:fs'

const OUT = new URL('../src/shop/models/', import.meta.url)
const sub = (a, b) => a.map((v, i) => v - b[i])
const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]]
const dot = (a, b) => a.reduce((s, v, i) => s + v * b[i], 0)

/** faces: [{ idx: [i,j,k], mat }] with 0-based vertex indices. Fixes winding to face outward. */
function write(name, verts, faces, materials) {
  const fixed = faces.map((f) => {
    const [a, b, c] = f.idx.map((i) => verts[i])
    const n = cross(sub(b, a), sub(c, a))
    const centroid = [0, 1, 2].map((k) => (a[k] + b[k] + c[k]) / 3)
    return dot(n, centroid) < 0 ? { ...f, idx: [f.idx[0], f.idx[2], f.idx[1]] } : f
  })
  let mtl = ''
  for (const [m, rgb] of Object.entries(materials)) {
    mtl += `newmtl ${m}\nKd ${rgb.map((v) => v.toFixed(3)).join(' ')}\n\n`
  }
  let obj = `# ${name}\nmtllib ${name}.mtl\no ${name}\n`
  for (const v of verts) obj += `v ${v.map((x) => x.toFixed(5)).join(' ')}\n`
  let current = ''
  for (const f of fixed) {
    if (f.mat !== current) { obj += `usemtl ${f.mat}\n`; current = f.mat }
    obj += `f ${f.idx.map((i) => i + 1).join(' ')}\n`
  }
  writeFileSync(new URL(`${name}.obj`, OUT), obj)
  writeFileSync(new URL(`${name}.mtl`, OUT), mtl)
  console.log(name, verts.length, 'verts', fixed.length, 'faces')
}

const hex = (h) => [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16) / 255)

// Triangle -> regular tetrahedron, four colored faces
write('triangle',
  [[1, 1, 1], [1, -1, -1], [-1, 1, -1], [-1, -1, 1]],
  [
    { idx: [0, 1, 2], mat: 'coral' },
    { idx: [0, 3, 1], mat: 'amber' },
    { idx: [0, 2, 3], mat: 'teal' },
    { idx: [1, 3, 2], mat: 'violet' },
  ],
  { coral: hex('ff6b6b'), amber: hex('ffd166'), teal: hex('2ec4b6'), violet: hex('a78bfa') })

// Pentagon -> pentagonal pyramid, alternating side colors and a base
{
  const verts = [[0, 1, 0], [0, -0.7, 0]] // apex, base center
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2
    verts.push([Math.cos(a) * 1.05, -0.7, Math.sin(a) * 1.05])
  }
  const faces = []
  const sides = ['sky', 'lime', 'sky', 'lime', 'rose']
  for (let i = 0; i < 5; i++) {
    const a = 2 + i, b = 2 + ((i + 1) % 5)
    faces.push({ idx: [0, a, b], mat: sides[i] })
    faces.push({ idx: [1, b, a], mat: 'base' })
  }
  write('pentagon', verts, faces,
    { sky: hex('4cc9f0'), lime: hex('b5e48c'), rose: hex('f72585'), base: hex('6b7280') })
}

// Circle -> UV sphere, colored in latitude bands with alternating longitudes
{
  const SEG = 20, RINGS = 12
  const verts = [[0, 1, 0]]
  for (let r = 1; r < RINGS; r++) {
    const phi = (r / RINGS) * Math.PI
    for (let s = 0; s < SEG; s++) {
      const th = (s / SEG) * Math.PI * 2
      verts.push([Math.sin(phi) * Math.cos(th), Math.cos(phi), Math.sin(phi) * Math.sin(th)])
    }
  }
  verts.push([0, -1, 0])
  const bottom = verts.length - 1
  const ring = (r, s) => 1 + (r - 1) * SEG + (s % SEG)
  const mats = ['m0', 'm1', 'm2', 'm3', 'm4', 'm5']
  const bandMat = (r, s) => mats[(Math.floor(((r - 0.5) / RINGS) * mats.length) + (s % 2)) % mats.length]
  const faces = []
  for (let s = 0; s < SEG; s++) {
    faces.push({ idx: [0, ring(1, s + 1), ring(1, s)], mat: bandMat(0.5, s) })
    for (let r = 1; r < RINGS - 1; r++) {
      const m = bandMat(r + 0.5, s)
      faces.push({ idx: [ring(r, s), ring(r, s + 1), ring(r + 1, s)], mat: m })
      faces.push({ idx: [ring(r, s + 1), ring(r + 1, s + 1), ring(r + 1, s)], mat: m })
    }
    faces.push({ idx: [bottom, ring(RINGS - 1, s), ring(RINGS - 1, s + 1)], mat: bandMat(RINGS - 0.5, s) })
  }
  write('circle', verts, faces, {
    m0: hex('ff595e'), m1: hex('ff924c'), m2: hex('ffca3a'),
    m3: hex('8ac926'), m4: hex('1982c4'), m5: hex('6a4c93'),
  })
}
