import type { WasmProcess, WasmProcessConfig } from './types'

const STDIN_BUFFER_SIZE = 65536 // 64KB

export class WasiProcess implements WasmProcess {
  private config: WasmProcessConfig
  private worker: Worker | null = null
  private stdinBuffer: SharedArrayBuffer
  private stdinSignal: Int32Array
  private stdinLength: Int32Array
  private stdinData: Uint8Array
  private pendingInput: number[] = []
  private flushTimer: ReturnType<typeof setTimeout> | null = null
  private outputCallbacks: ((data: string) => void)[] = []
  private exitCallbacks: ((code: number) => void)[] = []

  constructor(config: WasmProcessConfig) {
    this.config = config
    this.stdinBuffer = new SharedArrayBuffer(STDIN_BUFFER_SIZE)
    this.stdinSignal = new Int32Array(this.stdinBuffer, 0, 1)
    this.stdinLength = new Int32Array(this.stdinBuffer, 4, 1)
    this.stdinData = new Uint8Array(this.stdinBuffer, 8)
  }

  async start(): Promise<void> {
    const response = await fetch(this.config.wasmUrl)
    const wasmBytes = await response.arrayBuffer()

    this.worker = new Worker(
      new URL('./wasi-worker.ts', import.meta.url),
      { type: 'module' },
    )

    this.worker.onmessage = (e: MessageEvent) => {
      switch (e.data.type) {
        case 'stdout':
        case 'stderr':
          for (const cb of this.outputCallbacks) cb(e.data.data)
          break
        case 'exit':
          for (const cb of this.exitCallbacks) cb(e.data.code)
          this.worker?.terminate()
          this.worker = null
          break
      }
    }

    const envEntries = Object.entries(this.config.env).map(
      ([k, v]) => `${k}=${v}`,
    )

    this.worker.postMessage({
      type: 'start',
      wasmBytes,
      stdinBuffer: this.stdinBuffer,
      args: [this.config.wasmUrl.split('/').pop() || 'program', ...this.config.args],
      env: envEntries,
      cols: this.config.cols,
      rows: this.config.rows,
    })
  }

  write(data: string): void {
    const bytes = new TextEncoder().encode(data)
    this.pendingInput.push(...bytes)
    this.flushToSharedBuffer()
  }

  private flushToSharedBuffer(): void {
    if (this.pendingInput.length === 0) return

    if (Atomics.load(this.stdinSignal, 0) !== 0) {
      // Worker hasn't consumed previous data yet, retry shortly
      if (!this.flushTimer) {
        this.flushTimer = setTimeout(() => {
          this.flushTimer = null
          this.flushToSharedBuffer()
        }, 1)
      }
      return
    }

    const maxBytes = STDIN_BUFFER_SIZE - 8
    const toWrite = this.pendingInput.splice(0, maxBytes)
    const bytes = new Uint8Array(toWrite)
    this.stdinData.set(bytes)
    Atomics.store(this.stdinLength, 0, bytes.length)
    Atomics.store(this.stdinSignal, 0, 1)
    Atomics.notify(this.stdinSignal, 0)

    // If there's still pending data, schedule another flush
    if (this.pendingInput.length > 0) {
      this.flushTimer = setTimeout(() => {
        this.flushTimer = null
        this.flushToSharedBuffer()
      }, 1)
    }
  }

  resize(cols: number, rows: number): void {
    this.worker?.postMessage({ type: 'resize', cols, rows })
  }

  terminate(): void {
    if (this.flushTimer) {
      clearTimeout(this.flushTimer)
      this.flushTimer = null
    }

    // Send EOF signal
    Atomics.store(this.stdinSignal, 0, -1)
    Atomics.notify(this.stdinSignal, 0)

    setTimeout(() => {
      this.worker?.terminate()
      this.worker = null
    }, 100)
  }

  onOutput(cb: (data: string) => void): void {
    this.outputCallbacks.push(cb)
  }

  onExit(cb: (code: number) => void): void {
    this.exitCallbacks.push(cb)
  }
}
