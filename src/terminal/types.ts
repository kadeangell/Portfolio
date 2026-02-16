export interface TerminalWriter {
  write(data: string): void
}

export interface TerminalAPI {
  write(data: string): void
  onInput(cb: (data: string) => void): () => void
  registerKeybind(key: string, handler: () => void): () => void
  clear(): void
  cols: number
  rows: number
}

export type CommandHandler = (args: string[], writer: TerminalWriter) => void | Promise<void>

declare global {
  interface Window {
    __terminal?: TerminalAPI
  }
}
