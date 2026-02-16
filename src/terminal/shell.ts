import type { TerminalWriter, CommandContext } from './types'
import { getCommand, getCommandNames } from './commands'
import { resolvePath, getNode, listDir } from './fs'

export class ShellAdapter {
  private inputBuffer = ''
  private cursorPos = 0
  private writer: TerminalWriter
  private inputListeners = new Set<(data: string) => void>()
  private keybinds = new Map<string, () => void>()
  private escapeBuffer = ''
  private inEscapeSequence = false
  private getContext: () => CommandContext = () => ({ cwd: '/', setCwd: () => {}, clearHistory: () => {}, runProcess: () => {} })
  private onBeforePrompt: () => void = () => {}
  private onInputChange: (buffer: string, cursorPos: number) => void = () => {}

  constructor(writer: TerminalWriter) {
    this.writer = writer
  }

  setContextProvider(provider: () => CommandContext): void {
    this.getContext = provider
  }

  setBeforePromptCallback(cb: () => void): void {
    this.onBeforePrompt = cb
  }

  setInputChangeCallback(cb: (buffer: string, cursorPos: number) => void): void {
    this.onInputChange = cb
  }

  private notifyInputChange(): void {
    this.onInputChange(this.inputBuffer, this.cursorPos)
  }

  printPrompt(): void {
    const ctx = this.getContext()
    const display = ctx.cwd === '/' ? '~' : '~' + ctx.cwd
    this.writer.write(`${display} $ `)
  }

  onInput(cb: (data: string) => void): () => void {
    this.inputListeners.add(cb)
    return () => this.inputListeners.delete(cb)
  }

  registerKeybind(key: string, handler: () => void): () => void {
    this.keybinds.set(key, handler)
    return () => this.keybinds.delete(key)
  }

  handleData(data: string): void {
    // Notify raw input listeners first
    for (const listener of this.inputListeners) {
      listener(data)
    }

    for (let i = 0; i < data.length; i++) {
      const ch = data[i]
      const code = ch.charCodeAt(0)

      // Handle escape sequences (arrow keys, etc.)
      if (this.inEscapeSequence) {
        this.escapeBuffer += ch
        if (this.escapeBuffer === '[') {
          // Waiting for the final character
          continue
        }
        if (this.escapeBuffer.startsWith('[')) {
          this.handleEscapeSequence(this.escapeBuffer)
          this.notifyInputChange()
        }
        this.inEscapeSequence = false
        this.escapeBuffer = ''
        continue
      }

      if (code === 0x1b) {
        // ESC — start of escape sequence
        this.inEscapeSequence = true
        this.escapeBuffer = ''
        continue
      }

      if (code === 0x03) {
        // Ctrl+C — cancel current input
        if (this.checkKeybind('ctrl+c')) continue
        this.writer.write('^C\r\n')
        this.inputBuffer = ''
        this.cursorPos = 0
        this.onBeforePrompt()
        this.printPrompt()
        this.notifyInputChange()
        continue
      }

      if (code === 0x04) {
        // Ctrl+D — EOF
        if (this.checkKeybind('ctrl+d')) continue
        continue
      }

      if (code === 0x0c) {
        // Ctrl+L — clear screen
        if (this.checkKeybind('ctrl+l')) continue
        this.getContext().clearHistory()
        this.writer.write('\x1b[2J\x1b[H')
        this.printPrompt()
        this.writer.write(this.inputBuffer)
        // Move cursor back to correct position
        const charsAfter = this.inputBuffer.length - this.cursorPos
        if (charsAfter > 0) {
          this.writer.write(`\x1b[${charsAfter}D`)
        }
        this.notifyInputChange()
        continue
      }

      if (code === 0x01) {
        // Ctrl+A — move to beginning of line
        if (this.checkKeybind('ctrl+a')) continue
        if (this.cursorPos > 0) {
          this.writer.write(`\x1b[${this.cursorPos}D`)
          this.cursorPos = 0
        }
        this.notifyInputChange()
        continue
      }

      if (code === 0x05) {
        // Ctrl+E — move to end of line
        if (this.checkKeybind('ctrl+e')) continue
        if (this.cursorPos < this.inputBuffer.length) {
          const move = this.inputBuffer.length - this.cursorPos
          this.writer.write(`\x1b[${move}C`)
          this.cursorPos = this.inputBuffer.length
        }
        this.notifyInputChange()
        continue
      }

      if (code === 0x17) {
        // Ctrl+W — delete word before cursor
        if (this.checkKeybind('ctrl+w')) continue
        if (this.cursorPos > 0) {
          let pos = this.cursorPos
          // Skip whitespace before cursor
          while (pos > 0 && this.inputBuffer[pos - 1] === ' ') pos--
          // Skip non-whitespace (the word)
          while (pos > 0 && this.inputBuffer[pos - 1] !== ' ') pos--
          const deleted = this.cursorPos - pos
          const before = this.inputBuffer.slice(0, pos)
          const after = this.inputBuffer.slice(this.cursorPos)
          this.inputBuffer = before + after
          // Move cursor back by deleted chars
          this.writer.write(`\x1b[${deleted}D`)
          // Rewrite rest of line + clear trailing chars
          this.writer.write(after + ' '.repeat(deleted))
          // Move cursor back to correct position
          this.writer.write(`\x1b[${after.length + deleted}D`)
          this.cursorPos = pos
        }
        this.notifyInputChange()
        continue
      }

      if (code === 0x0b) {
        // Ctrl+K — kill from cursor to end of line
        if (this.checkKeybind('ctrl+k')) continue
        if (this.cursorPos < this.inputBuffer.length) {
          this.inputBuffer = this.inputBuffer.slice(0, this.cursorPos)
          this.writer.write('\x1b[K')
        }
        this.notifyInputChange()
        continue
      }

      if (code === 0x15) {
        // Ctrl+U — clear line before cursor
        if (this.checkKeybind('ctrl+u')) continue
        if (this.cursorPos > 0) {
          // Move cursor to start, clear line, rewrite text after old cursor
          this.writer.write(`\x1b[${this.cursorPos}D`)
          this.writer.write('\x1b[K')
          const remaining = this.inputBuffer.slice(this.cursorPos)
          this.inputBuffer = remaining
          this.cursorPos = 0
          this.writer.write(remaining)
          if (remaining.length > 0) {
            this.writer.write(`\x1b[${remaining.length}D`)
          }
        }
        this.notifyInputChange()
        continue
      }

      if (code === 0x7f || code === 0x08) {
        // Backspace
        if (this.cursorPos > 0) {
          const before = this.inputBuffer.slice(0, this.cursorPos - 1)
          const after = this.inputBuffer.slice(this.cursorPos)
          this.inputBuffer = before + after
          this.cursorPos--
          // Move back, rewrite rest of line, clear trailing char, reposition cursor
          this.writer.write('\b')
          this.writer.write(after + ' ')
          this.writer.write(`\x1b[${after.length + 1}D`)
        }
        this.notifyInputChange()
        continue
      }

      if (code === 0x0d) {
        // Enter
        this.writer.write('\r\n')
        const line = this.inputBuffer.trim()
        this.inputBuffer = ''
        this.cursorPos = 0
        let suppress = false
        if (line) {
          suppress = this.executeCommand(line) === 'suppress-prompt'
        }
        this.onBeforePrompt()
        if (!suppress) {
          this.printPrompt()
        }
        this.notifyInputChange()
        continue
      }

      if (code === 0x09) {
        // Tab — autocomplete
        if (this.checkKeybind('tab')) continue
        this.handleTab()
        continue
      }

      // Regular printable character
      if (code >= 0x20) {
        const before = this.inputBuffer.slice(0, this.cursorPos)
        const after = this.inputBuffer.slice(this.cursorPos)
        this.inputBuffer = before + ch + after
        this.cursorPos++
        // Write the character + rest of line, then reposition cursor
        this.writer.write(ch + after)
        if (after.length > 0) {
          this.writer.write(`\x1b[${after.length}D`)
        }
        this.notifyInputChange()
      }
    }
  }

  private handleTab(): void {
    const textBeforeCursor = this.inputBuffer.slice(0, this.cursorPos)
    const parts = textBeforeCursor.split(/\s+/)
    const isFirstWord = parts.length <= 1

    if (isFirstWord) {
      // Complete command names
      const prefix = parts[0] || ''
      const matches = getCommandNames().filter((n) => n.startsWith(prefix))
      this.applyCompletion(prefix, matches, true)
    } else {
      // Complete filesystem paths
      const partial = parts[parts.length - 1] || ''
      const ctx = this.getContext()

      // Split partial into directory part and name prefix
      const lastSlash = partial.lastIndexOf('/')
      let dirPath: string
      let namePrefix: string
      if (lastSlash === -1) {
        dirPath = ctx.cwd
        namePrefix = partial
      } else {
        dirPath = resolvePath(ctx.cwd, partial.slice(0, lastSlash + 1))
        namePrefix = partial.slice(lastSlash + 1)
      }

      const entries = listDir(dirPath)
      if (!entries) return

      const matches = entries.filter((e) => e.startsWith(namePrefix))
      // Build full completions preserving the directory prefix the user typed
      const typedDir = lastSlash === -1 ? '' : partial.slice(0, lastSlash + 1)
      const fullMatches = matches.map((m) => {
        const node = getNode(resolvePath(ctx.cwd, typedDir + m))
        return typedDir + m + (node?.kind === 'dir' ? '/' : '')
      })
      this.applyCompletion(partial, fullMatches, false)
    }
  }

  private applyCompletion(partial: string, matches: string[], addSpace: boolean): void {
    if (matches.length === 0) return

    let completion: string
    if (matches.length === 1) {
      completion = matches[0] + (addSpace ? ' ' : '')
    } else {
      // Complete to longest common prefix
      completion = matches[0]
      for (let i = 1; i < matches.length; i++) {
        let j = 0
        while (j < completion.length && j < matches[i].length && completion[j] === matches[i][j]) j++
        completion = completion.slice(0, j)
      }
      if (completion === partial) {
        // No further completion possible — show options
        this.writer.write('\r\n' + matches.join('  ') + '\r\n')
        this.onBeforePrompt()
        this.printPrompt()
        this.writer.write(this.inputBuffer)
        const after = this.inputBuffer.slice(this.cursorPos)
        if (after.length > 0) {
          this.writer.write(`\x1b[${after.length}D`)
        }
        this.notifyInputChange()
        return
      }
    }

    // Insert the completed portion
    const insert = completion.slice(partial.length)
    if (!insert) return

    const before = this.inputBuffer.slice(0, this.cursorPos)
    const after = this.inputBuffer.slice(this.cursorPos)
    this.inputBuffer = before + insert + after
    this.cursorPos += insert.length
    this.writer.write(insert + after)
    if (after.length > 0) {
      this.writer.write(`\x1b[${after.length}D`)
    }
    this.notifyInputChange()
  }

  private handleEscapeSequence(seq: string): void {
    switch (seq) {
      case '[A': // Up arrow — command history (future)
        break
      case '[B': // Down arrow — command history (future)
        break
      case '[C': // Right arrow
        if (this.cursorPos < this.inputBuffer.length) {
          this.cursorPos++
          this.writer.write('\x1b[C')
        }
        break
      case '[D': // Left arrow
        if (this.cursorPos > 0) {
          this.cursorPos--
          this.writer.write('\x1b[D')
        }
        break
      case '[H': // Home
        if (this.cursorPos > 0) {
          this.writer.write(`\x1b[${this.cursorPos}D`)
          this.cursorPos = 0
        }
        break
      case '[F': // End
        if (this.cursorPos < this.inputBuffer.length) {
          const move = this.inputBuffer.length - this.cursorPos
          this.writer.write(`\x1b[${move}C`)
          this.cursorPos = this.inputBuffer.length
        }
        break
      case '[3~': // Delete key
        if (this.cursorPos < this.inputBuffer.length) {
          const before = this.inputBuffer.slice(0, this.cursorPos)
          const after = this.inputBuffer.slice(this.cursorPos + 1)
          this.inputBuffer = before + after
          this.writer.write(after + ' ')
          this.writer.write(`\x1b[${after.length + 1}D`)
        }
        break
    }
  }

  private checkKeybind(key: string): boolean {
    const handler = this.keybinds.get(key)
    if (handler) {
      handler()
      return true
    }
    return false
  }

  private executeCommand(line: string): 'suppress-prompt' | undefined {
    const parts = line.split(/\s+/)
    const name = parts[0]
    const args = parts.slice(1)

    const cmd = getCommand(name)
    if (cmd) {
      const result = cmd(args, this.writer, this.getContext())
      if (result === 'suppress-prompt') {
        return 'suppress-prompt'
      }
      this.writer.write('\r\n')
    } else {
      this.writer.write(`${name}: command not found\r\n`)
    }
  }
}
