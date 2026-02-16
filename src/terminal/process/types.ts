export interface WasmProcessConfig {
  wasmUrl: string
  args: string[]
  env: Record<string, string>
  cwd: string
  cols: number
  rows: number
  container: HTMLElement
}

export interface WasmProcess {
  start(): Promise<void>
  write(data: string): void
  resize(cols: number, rows: number): void
  terminate(): void
  onOutput(cb: (data: string) => void): void
  onExit(cb: (code: number) => void): void
}
