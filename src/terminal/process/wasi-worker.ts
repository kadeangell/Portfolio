import { WASI, Fd, wasi as wasiDefs } from '@bjorn3/browser_wasi_shim'

class SharedBufferStdin extends Fd {
  private signal: Int32Array
  private length: Int32Array
  private data: Uint8Array

  constructor(buffer: SharedArrayBuffer) {
    super()
    this.signal = new Int32Array(buffer, 0, 1)
    this.length = new Int32Array(buffer, 4, 1)
    this.data = new Uint8Array(buffer, 8)
  }

  fd_read(size: number): { ret: number; data: Uint8Array } {
    // Block until data is available
    while (Atomics.load(this.signal, 0) === 0) {
      Atomics.wait(this.signal, 0, 0)
    }

    // Check for EOF
    if (Atomics.load(this.signal, 0) === -1) {
      return { ret: 0, data: new Uint8Array(0) }
    }

    const dataLen = Atomics.load(this.length, 0)
    const toRead = Math.min(dataLen, size)
    const result = new Uint8Array(toRead)
    result.set(this.data.subarray(0, toRead))

    // Signal buffer consumed
    Atomics.store(this.signal, 0, 0)

    return { ret: 0, data: result }
  }

  fd_fdstat_get(): { ret: number; fdstat: any } {
    return {
      ret: 0,
      fdstat: new wasiDefs.Fdstat(wasiDefs.FILETYPE_CHARACTER_DEVICE, 0),
    }
  }
}

class PostMessageOutput extends Fd {
  private stream: string

  constructor(stream: 'stdout' | 'stderr') {
    super()
    this.stream = stream
  }

  fd_write(data: Uint8Array): { ret: number; nwritten: number } {
    const text = new TextDecoder().decode(data)
    self.postMessage({ type: this.stream, data: text })
    return { ret: 0, nwritten: data.byteLength }
  }

  fd_fdstat_get(): { ret: number; fdstat: any } {
    return {
      ret: 0,
      fdstat: new wasiDefs.Fdstat(wasiDefs.FILETYPE_CHARACTER_DEVICE, 0),
    }
  }
}

self.onmessage = async (e: MessageEvent) => {
  if (e.data.type === 'start') {
    const { wasmBytes, stdinBuffer, args, env } = e.data

    const stdin = new SharedBufferStdin(stdinBuffer)
    const stdout = new PostMessageOutput('stdout')
    const stderr = new PostMessageOutput('stderr')

    const fds: Fd[] = [stdin, stdout, stderr]
    const wasi = new WASI(args, env, fds)

    try {
      const module = await WebAssembly.compile(wasmBytes)
      const instance = await WebAssembly.instantiate(module, {
        wasi_snapshot_preview1: wasi.wasiImport,
      })
      const exitCode = wasi.start(instance as any)
      self.postMessage({ type: 'exit', code: exitCode })
    } catch (err: any) {
      const message = err instanceof Error ? err.message : String(err)
      self.postMessage({ type: 'stderr', data: `Error: ${message}\r\n` })
      self.postMessage({ type: 'exit', code: 1 })
    }
  }
}
