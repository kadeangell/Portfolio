import { useEffect, useRef } from 'react'

const VERTEX_SHADER = `
  attribute vec2 pos;
  varying vec2 vUv;
  void main() {
    vUv = (pos + 1.0) * 0.5;
    gl_Position = vec4(pos, 0.0, 1.0);
  }
`

const FRAGMENT_SHADER = `
  precision highp float;
  varying vec2 vUv;
  uniform float uTime;
  uniform vec2 uResolution;

  void main() {
    vec2 uv = vUv;

    // Scanlines — darken every other pixel row
    float scanline = sin(uv.y * uResolution.y * 3.14159);
    scanline = (scanline * 0.5 + 0.5) * 0.9 + 0.1;
    float scanAlpha = (1.0 - scanline) * 0.25;

    // Vignette — darken edges
    vec2 vignetteUv = uv * (1.0 - uv);
    float vignette = vignetteUv.x * vignetteUv.y * 15.0;
    vignette = clamp(pow(vignette, 0.25), 0.0, 1.0);
    float vignetteAlpha = (1.0 - vignette) * 0.4;

    // Subtle flicker
    float flicker = 1.0 + 0.01 * sin(uTime * 8.0) * sin(uTime * 3.0);

    float alpha = (scanAlpha + vignetteAlpha) * flicker;
    gl_FragColor = vec4(0.0, 0.0, 0.0, alpha);
  }
`

function compileShader(gl: WebGLRenderingContext, type: number, source: string): WebGLShader | null {
  const shader = gl.createShader(type)
  if (!shader) return null
  gl.shaderSource(shader, source)
  gl.compileShader(shader)
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    console.error('Shader compile error:', gl.getShaderInfoLog(shader))
    gl.deleteShader(shader)
    return null
  }
  return shader
}

function createProgram(gl: WebGLRenderingContext): WebGLProgram | null {
  const vert = compileShader(gl, gl.VERTEX_SHADER, VERTEX_SHADER)
  const frag = compileShader(gl, gl.FRAGMENT_SHADER, FRAGMENT_SHADER)
  if (!vert || !frag) return null

  const program = gl.createProgram()
  if (!program) return null
  gl.attachShader(program, vert)
  gl.attachShader(program, frag)
  gl.linkProgram(program)

  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    console.error('Program link error:', gl.getProgramInfoLog(program))
    gl.deleteProgram(program)
    return null
  }
  return program
}

export function CRTOverlay() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const gl = canvas.getContext('webgl', { alpha: true, premultipliedAlpha: false })
    if (!gl) return

    const program = createProgram(gl)
    if (!program) return

    // Full-screen quad
    const vertices = new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1])
    const buffer = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer)
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW)

    const posLoc = gl.getAttribLocation(program, 'pos')
    gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0)
    gl.enableVertexAttribArray(posLoc)

    const timeLoc = gl.getUniformLocation(program, 'uTime')
    const resLoc = gl.getUniformLocation(program, 'uResolution')

    gl.enable(gl.BLEND)
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA)

    function resize() {
      canvas!.width = window.innerWidth
      canvas!.height = window.innerHeight
      gl!.viewport(0, 0, canvas!.width, canvas!.height)
    }

    window.addEventListener('resize', resize)
    resize()

    let animId: number
    function render() {
      gl!.useProgram(program)
      gl!.uniform1f(timeLoc, performance.now() / 1000)
      gl!.uniform2f(resLoc, canvas!.width, canvas!.height)
      gl!.drawArrays(gl!.TRIANGLE_STRIP, 0, 4)
      animId = requestAnimationFrame(render)
    }
    render()

    return () => {
      window.removeEventListener('resize', resize)
      cancelAnimationFrame(animId)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 z-50 pointer-events-none"
    />
  )
}
