export type Vec3 = [number, number, number]

export interface Triangle {
  a: Vec3
  b: Vec3
  c: Vec3
  /** Diffuse color, 0-255 per channel */
  color: Vec3
}

export interface Model {
  triangles: Triangle[]
  vertexCount: number
  faceCount: number
}

/** Parse the `Kd` diffuse colors out of a .mtl file. */
export function parseMtl(src: string): Map<string, Vec3> {
  const out = new Map<string, Vec3>()
  let current: string | null = null
  for (const raw of src.split('\n')) {
    const line = raw.trim()
    if (line.startsWith('newmtl ')) {
      current = line.slice(7).trim()
    } else if (current && line.startsWith('Kd ')) {
      const [r, g, b] = line.slice(3).trim().split(/\s+/).map(Number)
      out.set(current, [r * 255, g * 255, b * 255])
    }
  }
  return out
}

/**
 * Parse a Wavefront .obj (v, f, usemtl). Faces with more than three vertices
 * are fan-triangulated. Each face takes the color of the material active when
 * it was declared. The renderer expects counter-clockwise winding.
 */
export function parseObj(objSrc: string, mtlSrc: string): Model {
  const materials = parseMtl(mtlSrc)
  const verts: Vec3[] = []
  const triangles: Triangle[] = []
  let color: Vec3 = [200, 200, 200]
  let faceCount = 0

  for (const raw of objSrc.split('\n')) {
    const line = raw.trim()
    if (line.startsWith('v ')) {
      const [x, y, z] = line.slice(2).trim().split(/\s+/).map(Number)
      verts.push([x, y, z])
    } else if (line.startsWith('usemtl ')) {
      color = materials.get(line.slice(7).trim()) ?? color
    } else if (line.startsWith('f ')) {
      // "f 1 2 3" or "f 1/1/1 2/2/2 3/3/3": only the vertex index matters
      const idx = line
        .slice(2)
        .trim()
        .split(/\s+/)
        .map((tok) => {
          const n = parseInt(tok.split('/')[0], 10)
          return n < 0 ? verts.length + n : n - 1
        })
      faceCount++
      for (let i = 1; i < idx.length - 1; i++) {
        triangles.push({ a: verts[idx[0]], b: verts[idx[i]], c: verts[idx[i + 1]], color })
      }
    }
  }

  return { triangles, vertexCount: verts.length, faceCount }
}
