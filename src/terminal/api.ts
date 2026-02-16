import type { TerminalAPI, TerminalWriter } from './types'
import type { ShellAdapter } from './shell'

export function installWindowAPI(writer: TerminalWriter, shell: ShellAdapter): () => void {
  const api: TerminalAPI = {
    write(data: string) {
      writer.write(data)
    },
    onInput(cb: (data: string) => void) {
      return shell.onInput(cb)
    },
    registerKeybind(key: string, handler: () => void) {
      return shell.registerKeybind(key, handler)
    },
    clear() {
      writer.write('\x1b[2J\x1b[H')
    },
    get cols() {
      return 80 // TODO: read from ghostty term
    },
    get rows() {
      return 24 // TODO: read from ghostty term
    },
  }

  window.__terminal = api

  return () => {
    delete window.__terminal
  }
}
