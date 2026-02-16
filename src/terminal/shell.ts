import type { TerminalWriter, CommandContext } from './types'
import { getCommand, getCommandNames } from './commands'
import { resolvePath, getNode, listDir } from './fs'

const HISTORY_KEY = 'shell-history'
const MAX_HISTORY = 500

function loadHistory(): string[] {
  try {
    const raw = localStorage.getItem(HISTORY_KEY)
    if (raw) return JSON.parse(raw)
  } catch { /* ignore */ }
  return []
}

function saveHistory(history: string[]): void {
  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history.slice(-MAX_HISTORY)))
  } catch { /* ignore */ }
}

type ShellMode =
  | { kind: 'normal' }
  | { kind: 'search'; query: string; matchIndex: number }

export class ShellAdapter {
  private inputBuffer = ''
  private cursorPos = 0
  private writer: TerminalWriter
  private inputListeners = new Set<(data: string) => void>()
  private keybinds = new Map<string, () => void>()
  private escapeBuffer = ''
  private inEscapeSequence = false
  private getContext: () => CommandContext = () => ({ cwd: '/', setCwd: () => {}, clearHistory: () => {}, runProcess: () => {}, getCommandHistory: () => [] })
  private onBeforePrompt: () => void = () => {}
  private onInputChange: (buffer: string, cursorPos: number, prompt: string) => void = () => {}

  // Command history
  private history: string[] = loadHistory()
  private historyIndex = -1
  private savedInput = ''

  // Shell mode (normal vs reverse-i-search)
  private mode: ShellMode = { kind: 'normal' }

  constructor(writer: TerminalWriter) {
    this.writer = writer
  }

  setContextProvider(provider: () => CommandContext): void {
    this.getContext = provider
  }

  setBeforePromptCallback(cb: () => void): void {
    this.onBeforePrompt = cb
  }

  setInputChangeCallback(cb: (buffer: string, cursorPos: number, prompt: string) => void): void {
    this.onInputChange = cb
  }

  private notifyInputChange(): void {
    const prompt = this.mode.kind === 'search'
      ? `(reverse-i-search)'${this.mode.query}': `
      : this.buildPrompt()
    this.onInputChange(this.inputBuffer, this.cursorPos, prompt)
  }

  private buildPrompt(): string {
    const ctx = this.getContext()
    const display = ctx.cwd === '/' ? '~' : '~' + ctx.cwd
    return `${display} $ `
  }

  printPrompt(): void {
    this.writer.write(this.buildPrompt())
  }

  getHistory(): string[] {
    return this.history
  }

  onInput(cb: (data: string) => void): () => void {
    this.inputListeners.add(cb)
    return () => this.inputListeners.delete(cb)
  }

  registerKeybind(key: string, handler: () => void): () => void {
    this.keybinds.set(key, handler)
    return () => this.keybinds.delete(key)
  }

  // ── History helpers ───────────────────────────────────────────

  private pushHistory(line: string): void {
    // Don't duplicate the last entry
    if (this.history.length > 0 && this.history[this.history.length - 1] === line) return
    this.history.push(line)
    saveHistory(this.history)
  }

  private resetHistoryBrowsing(): void {
    this.historyIndex = -1
    this.savedInput = ''
  }

  /** Replace the visible input line with new text, cursor at end. */
  private replaceInputLine(text: string): void {
    // Erase current line: move to start, clear to end
    if (this.cursorPos > 0) {
      this.writer.write(`\x1b[${this.cursorPos}D`)
    }
    this.writer.write('\x1b[K')
    // Write new text
    this.writer.write(text)
    this.inputBuffer = text
    this.cursorPos = text.length
  }

  // ── Reverse-i-search ─────────────────────────────────────────

  private searchMatch(): string | null {
    if (this.mode.kind !== 'search') return null
    const { query, matchIndex } = this.mode
    if (!query) return null
    let found = 0
    for (let i = this.history.length - 1; i >= 0; i--) {
      if (this.history[i].includes(query)) {
        if (found === matchIndex) return this.history[i]
        found++
      }
    }
    return null
  }

  private redrawSearchPrompt(): void {
    if (this.mode.kind !== 'search') return
    const match = this.searchMatch() ?? ''
    // Move to column 0, clear line, draw search prompt
    this.writer.write('\r\x1b[K')
    this.writer.write(`(reverse-i-search)'${this.mode.query}': ${match}`)
    // Update React state with the matched command
    this.inputBuffer = match
    this.cursorPos = match.length
  }

  private enterSearchMode(): void {
    this.savedInput = this.inputBuffer
    this.mode = { kind: 'search', query: '', matchIndex: 0 }
    this.redrawSearchPrompt()
    this.notifyInputChange()
  }

  private exitSearchMode(accept: boolean): void {
    const match = accept ? this.searchMatch() : null
    this.mode = { kind: 'normal' }

    // Build the full output as one write to avoid ghostty buffer issues
    const prompt = this.buildPrompt()
    const restored = accept && match !== null ? match : this.savedInput

    this.inputBuffer = restored
    this.cursorPos = restored.length
    this.savedInput = ''

    this.writer.write('\r\x1b[K' + prompt + restored)
    this.notifyInputChange()
  }

  // ── Main input handler ────────────────────────────────────────

  handleData(data: string): void {
    // Notify raw input listeners first
    for (const listener of this.inputListeners) {
      listener(data)
    }

    for (let i = 0; i < data.length; i++) {
      const ch = data[i]
      const code = ch.charCodeAt(0)

      // ── Escape sequences ──────────────────────────────────
      if (this.inEscapeSequence) {
        this.escapeBuffer += ch
        if (this.escapeBuffer === '[') continue
        if (this.escapeBuffer.startsWith('[')) {
          // In search mode, escape cancels
          if (this.mode.kind === 'search') {
            this.exitSearchMode(false)
            this.inEscapeSequence = false
            this.escapeBuffer = ''
            continue
          }
          this.handleEscapeSequence(this.escapeBuffer)
          this.notifyInputChange()
        }
        this.inEscapeSequence = false
        this.escapeBuffer = ''
        continue
      }

      if (code === 0x1b) {
        // Bare Escape in search mode cancels immediately
        if (this.mode.kind === 'search') {
          this.exitSearchMode(false)
          continue
        }
        this.inEscapeSequence = true
        this.escapeBuffer = ''
        continue
      }

      // ── Search mode input ─────────────────────────────────
      if (this.mode.kind === 'search') {
        if (code === 0x12) {
          // Ctrl+R again — next match
          this.mode = { ...this.mode, matchIndex: this.mode.matchIndex + 1 }
          this.redrawSearchPrompt()
          this.notifyInputChange()
          continue
        }
        if (code === 0x07) {
          // Ctrl+G — cancel search
          this.exitSearchMode(false)
          continue
        }
        if (code === 0x03) {
          // Ctrl+C — cancel search
          this.exitSearchMode(false)
          continue
        }
        if (code === 0x0d) {
          // Enter — accept match and run it
          const match = this.searchMatch()
          this.exitSearchMode(true)
          if (match) {
            // Execute the matched command
            this.writer.write('\r\n')
            this.pushHistory(match)
            this.inputBuffer = ''
            this.cursorPos = 0
            let suppress = false
            suppress = this.executeCommand(match) === 'suppress-prompt'
            this.onBeforePrompt()
            if (!suppress) {
              this.printPrompt()
            }
            this.notifyInputChange()
          }
          continue
        }
        if (code === 0x7f || code === 0x08) {
          // Backspace — remove last char from query
          if (this.mode.query.length > 0) {
            this.mode = { ...this.mode, query: this.mode.query.slice(0, -1), matchIndex: 0 }
            this.redrawSearchPrompt()
            this.notifyInputChange()
          }
          continue
        }
        if (code >= 0x20) {
          // Printable character — append to query
          this.mode = { ...this.mode, query: this.mode.query + ch, matchIndex: 0 }
          this.redrawSearchPrompt()
          this.notifyInputChange()
          continue
        }
        // Any other control char — accept match and fall through to normal handling
        this.exitSearchMode(true)
        // Don't continue — let this char be processed normally below
      }

      // ── Normal mode input ─────────────────────────────────

      if (code === 0x12) {
        // Ctrl+R — enter reverse-i-search
        this.enterSearchMode()
        continue
      }

      if (code === 0x03) {
        // Ctrl+C — cancel current input
        if (this.checkKeybind('ctrl+c')) continue
        this.resetHistoryBrowsing()
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
          while (pos > 0 && this.inputBuffer[pos - 1] === ' ') pos--
          while (pos > 0 && this.inputBuffer[pos - 1] !== ' ') pos--
          const deleted = this.cursorPos - pos
          const before = this.inputBuffer.slice(0, pos)
          const after = this.inputBuffer.slice(this.cursorPos)
          this.inputBuffer = before + after
          this.writer.write(`\x1b[${deleted}D`)
          this.writer.write(after + ' '.repeat(deleted))
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
        this.resetHistoryBrowsing()
        let suppress = false
        if (line) {
          this.pushHistory(line)
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
        // Any typing resets history browsing
        this.resetHistoryBrowsing()
        const before = this.inputBuffer.slice(0, this.cursorPos)
        const after = this.inputBuffer.slice(this.cursorPos)
        this.inputBuffer = before + ch + after
        this.cursorPos++
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
      const prefix = parts[0] || ''
      const matches = getCommandNames().filter((n) => n.startsWith(prefix))
      this.applyCompletion(prefix, matches, true)
    } else {
      const partial = parts[parts.length - 1] || ''
      const ctx = this.getContext()

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
      completion = matches[0]
      for (let i = 1; i < matches.length; i++) {
        let j = 0
        while (j < completion.length && j < matches[i].length && completion[j] === matches[i][j]) j++
        completion = completion.slice(0, j)
      }
      if (completion === partial) {
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
      case '[A': {
        // Up arrow — browse history backward
        if (this.history.length === 0) break
        if (this.historyIndex === -1) {
          // Entering history mode — save current input
          this.savedInput = this.inputBuffer
          this.historyIndex = this.history.length - 1
        } else if (this.historyIndex > 0) {
          this.historyIndex--
        } else {
          break // already at oldest
        }
        this.replaceInputLine(this.history[this.historyIndex])
        break
      }
      case '[B': {
        // Down arrow — browse history forward
        if (this.historyIndex === -1) break
        if (this.historyIndex < this.history.length - 1) {
          this.historyIndex++
          this.replaceInputLine(this.history[this.historyIndex])
        } else {
          // Past newest — restore saved input
          this.historyIndex = -1
          this.replaceInputLine(this.savedInput)
          this.savedInput = ''
        }
        break
      }
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
