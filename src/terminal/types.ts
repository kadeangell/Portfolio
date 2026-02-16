export interface TerminalWriter {
  write(data: string): void
}

export interface CommandContext {
  cwd: string
  setCwd: (path: string) => void
  clearHistory: () => void
  runProcess: (name: string, args: string[]) => void
}

export type CommandHandler = (
  args: string[],
  writer: TerminalWriter,
  ctx: CommandContext,
) => void | 'suppress-prompt' | Promise<void | 'suppress-prompt'>

export interface TerminalAPI {
  write(data: string): void
  onInput(cb: (data: string) => void): () => void
  registerKeybind(key: string, handler: () => void): () => void
  clear(): void
  cols: number
  rows: number
}

declare global {
  interface Window {
    __terminal?: TerminalAPI
  }
}
