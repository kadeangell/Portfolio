import type { Model, Vec3 } from './obj'

/** Dark to bright. Chosen so every glyph is HTML-safe. */
const RAMP = ' .:-=+*#%@'

/** A terminal cell is roughly twice as tall as it is wide. */
const CELL_ASPECT = 2

const LIGHT = normalize([-0.45, 0.6, 0.75])

function normalize(v: Vec3): Vec3 {
  const l = Math.hypot(v[0], v[1], v[2]) || 1
  return [v[0] / l, v[1] / l, v[2] / l]
}

function rotate(v: Vec3, yaw: number, pitch: number): Vec3 {
  const cy = Math.cos(yaw), sy = Math.sin(yaw)
  const cp = Math.cos(pitch), sp = Math.sin(pitch)
  // yaw about Y, then pitch about X
  const x1 = v[0] * cy + v[2] * sy
  const z1 = -v[0] * sy + v[2] * cy
  const y2 = v[1] * cp - z1 * sp
  const z2 = v[1] * sp + z1 * cp
  return [x1, y2, z2]
}

export interface Frame {
  cols: number
  rows: number
  /** Character per cell, row-major (' ' = empty) */
  chars: string[]
  /** Packed 0xRRGGBB per cell */
  colors: Uint32Array
}

/** Largest vertex distance from the origin, used to fit the model to the view. */
export function modelRadius(model: Model): number {
  let r = 0
  for (const t of model.triangles) {
    for (const v of [t.a, t.b, t.c]) r = Math.max(r, Math.hypot(v[0], v[1], v[2]))
  }
  return r || 1
}

/**
 * Software-rasterize `model` into a grid of colored characters: orthographic
 * projection, z-buffer, backface culling and flat Lambert shading.
 */
export function renderModel(
  model: Model,
  cols: number,
  rows: number,
  yaw: number,
  pitch: number,
  radius = modelRadius(model),
): Frame {
  const size = cols * rows
  const chars: string[] = new Array(size).fill(' ')
  const colors = new Uint32Array(size)
  const depth = new Float32Array(size).fill(-Infinity)

  // Fit the bounding sphere inside the grid, accounting for cell aspect ratio
  const scale = Math.min(rows / 2, cols / 2 / CELL_ASPECT) * 0.92 / radius
  const cx = cols / 2
  const cy = rows / 2

  for (const tri of model.triangles) {
    const a = rotate(tri.a, yaw, pitch)
    const b = rotate(tri.b, yaw, pitch)
    const c = rotate(tri.c, yaw, pitch)

    // Face normal (counter-clockwise = outward); camera looks down -z
    const ux = b[0] - a[0], uy = b[1] - a[1], uz = b[2] - a[2]
    const vx = c[0] - a[0], vy = c[1] - a[1], vz = c[2] - a[2]
    const n = normalize([uy * vz - uz * vy, uz * vx - ux * vz, ux * vy - uy * vx])
    if (n[2] <= 0) continue // facing away

    const lambert = Math.max(0, n[0] * LIGHT[0] + n[1] * LIGHT[1] + n[2] * LIGHT[2])
    const intensity = 0.12 + 0.88 * lambert
    const glyph = RAMP[Math.min(RAMP.length - 1, Math.floor(intensity * RAMP.length))]
    const k = 0.3 + 0.7 * intensity
    const packed =
      (Math.min(255, Math.round(tri.color[0] * k)) << 16) |
      (Math.min(255, Math.round(tri.color[1] * k)) << 8) |
      Math.min(255, Math.round(tri.color[2] * k))

    // Project to cell space
    const pts = [a, b, c].map((p) => [cx + p[0] * scale * CELL_ASPECT, cy - p[1] * scale, p[2]])
    const [p0, p1, p2] = pts
    const minX = Math.max(0, Math.floor(Math.min(p0[0], p1[0], p2[0])))
    const maxX = Math.min(cols - 1, Math.ceil(Math.max(p0[0], p1[0], p2[0])))
    const minY = Math.max(0, Math.floor(Math.min(p0[1], p1[1], p2[1])))
    const maxY = Math.min(rows - 1, Math.ceil(Math.max(p0[1], p1[1], p2[1])))
    const area = (p1[0] - p0[0]) * (p2[1] - p0[1]) - (p2[0] - p0[0]) * (p1[1] - p0[1])
    if (area === 0) continue

    for (let y = minY; y <= maxY; y++) {
      for (let x = minX; x <= maxX; x++) {
        // Sample at the cell center
        const px = x + 0.5
        const py = y + 0.5
        const w0 = ((p1[0] - px) * (p2[1] - py) - (p2[0] - px) * (p1[1] - py)) / area
        const w1 = ((p2[0] - px) * (p0[1] - py) - (p0[0] - px) * (p2[1] - py)) / area
        const w2 = 1 - w0 - w1
        if (w0 < 0 || w1 < 0 || w2 < 0) continue
        const z = w0 * p0[2] + w1 * p1[2] + w2 * p2[2]
        const i = y * cols + x
        if (z > depth[i]) {
          depth[i] = z
          chars[i] = glyph
          colors[i] = packed
        }
      }
    }
  }

  return { cols, rows, chars, colors }
}

/** Serialize a frame to HTML: one <span> per run of same-colored cells. */
export function frameToHtml(frame: Frame): string {
  const { cols, rows, chars, colors } = frame
  let html = ''
  for (let y = 0; y < rows; y++) {
    let run = ''
    let runColor = -1
    for (let x = 0; x < cols; x++) {
      const i = y * cols + x
      const ch = chars[i]
      const color = ch === ' ' ? 0 : colors[i]
      if (color !== runColor && run) {
        html += runColor === 0 ? run : `<span style="color:#${runColor.toString(16).padStart(6, '0')}">${run}</span>`
        run = ''
      }
      runColor = color
      run += ch
    }
    html += runColor === 0 ? run : `<span style="color:#${runColor.toString(16).padStart(6, '0')}">${run}</span>`
    html += '\n'
  }
  return html
}
