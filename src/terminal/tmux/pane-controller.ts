import { ShellAdapter } from '~/terminal/shell'
import { getProcess } from '~/terminal/process'
import { readFile, resolvePath } from '~/terminal/fs'
import type { WasmProcess } from '~/terminal/process'
import type { PaneId, PaneMode } from './types'

interface CellData {
  char: string
  fg: string
  bg: string
  bold: boolean
  italic: boolean
  underline: boolean
}

const DEFAULT_FG = 'rgb(204,204,204)'
const DEFAULT_BG = 'rgb(0,0,0)'
const EMPTY_CELL: CellData = { char: ' ', fg: DEFAULT_FG, bg: DEFAULT_BG, bold: false, italic: false, underline: false }

function cellFg(cell: any): string {
  return `rgb(${cell.fg_r},${cell.fg_g},${cell.fg_b})`
}

function cellBg(cell: any): string {
  return `rgb(${cell.bg_r},${cell.bg_g},${cell.bg_b})`
}

function readGhosttyRow(wasmTerm: any, y: number, cols: number): CellData[] {
  const cells = wasmTerm.getLine(y)
  const row: CellData[] = []
  if (cells) {
    for (let x = 0; x < cols; x++) {
      const cell = cells[x]
      if (cell) {
        row.push({
          char: cell.codepoint ? String.fromCodePoint(cell.codepoint) : ' ',
          fg: cellFg(cell),
          bg: cellBg(cell),
          bold: !!(cell.flags & 1),
          italic: !!(cell.flags & 4),
          underline: !!(cell.flags & 8),
        })
      } else {
        row.push(EMPTY_CELL)
      }
    }
  } else {
    for (let x = 0; x < cols; x++) row.push(EMPTY_CELL)
  }
  return row
}

function rowHasContent(row: CellData[]): boolean {
  return row.some((c) => c.char !== ' ')
}

export interface PaneControllerConfig {
  id: PaneId
  initialCwd: string
  ghosttyModule: any // { Terminal: constructor }
}

export class PaneController {
  readonly id: PaneId

  private shell: ShellAdapter
  private term: any // ghostty Terminal instance
  private wasmTerm: any
  private hiddenContainer: HTMLDivElement
  private ghosttyModule: any
  private cwd: string

  // Per-pane subscriber — only re-renders this pane's PaneView
  private paneSubscribers = new Set<() => void>()

  // State exposed to React
  private _history: CellData[][] = []
  private _inputLine = ''
  private _inputCursor = 0
  private _promptText = ''
  private _mode: PaneMode = 'shell'
  private _process: WasmProcess | null = null
  private _processCleanup: (() => void) | null = null
  private processContainer: HTMLDivElement | null = null

  constructor(config: PaneControllerConfig) {
    this.id = config.id
    this.cwd = config.initialCwd
    this.ghosttyModule = config.ghosttyModule

    // Create hidden ghostty container
    this.hiddenContainer = document.createElement('div')
    this.hiddenContainer.style.position = 'absolute'
    this.hiddenContainer.style.left = '-9999px'
    this.hiddenContainer.style.top = '-9999px'
    this.hiddenContainer.style.width = '1px'
    this.hiddenContainer.style.height = '1px'
    this.hiddenContainer.style.overflow = 'hidden'
    document.body.appendChild(this.hiddenContainer)

    // Create ghostty terminal
    const GhosttyTerminal = this.ghosttyModule.Terminal
    this.term = new GhosttyTerminal({ fontSize: 14 })
    this.term.open(this.hiddenContainer)
    this.wasmTerm = this.term.wasmTerm

    // Writer for VT100 parsing
    const writer = {
      write: (data: string) => {
        this.term.write(data)
      },
    }

    // Create shell adapter
    this.shell = new ShellAdapter(writer)

    // Wire flush-to-history
    const flushToHistory = () => {
      if (!this.wasmTerm) return
      const cols = this.term.cols || 80
      const totalRows = this.term.rows || 24
      const cursor = this.wasmTerm.getCursor()
      const cursorY = cursor?.y ?? 0

      let lastContentRow = -1
      for (let y = totalRows - 1; y >= 0; y--) {
        const row = readGhosttyRow(this.wasmTerm, y, cols)
        if (rowHasContent(row)) {
          lastContentRow = y
          break
        }
      }

      if (lastContentRow >= 0) {
        const captureEnd = Math.max(lastContentRow, cursorY - 1)
        const captured: CellData[][] = []
        for (let y = 0; y <= captureEnd; y++) {
          captured.push(readGhosttyRow(this.wasmTerm, y, cols))
        }
        this._history = [...this._history, ...captured]
      }

      this.term.write('\x1b[2J\x1b[H')
    }

    this.shell.setBeforePromptCallback(flushToHistory)

    this.shell.setInputChangeCallback((buffer, pos, prompt) => {
      this._inputLine = buffer
      this._inputCursor = pos
      this._promptText = prompt
      this.notifyPaneSubscribers()
    })

    this.shell.setContextProvider(() => ({
      cwd: this.cwd,
      setCwd: (path: string) => {
        this.cwd = path
      },
      clearHistory: () => {
        this._history = []
        this.notifyPaneSubscribers()
      },
      runProcess: (name: string, args: string[]) => {
        this.runProcess(name, args)
      },
      getCommandHistory: () => this.shell.getHistory(),
      startTmux: undefined,
    }))

    // Print initial prompt
    this.shell.printPrompt()
  }

  dispose(): void {
    if (this._process) {
      this._process.terminate()
      this._process = null
    }
    this.term?.dispose()
    if (this.hiddenContainer.parentNode) {
      document.body.removeChild(this.hiddenContainer)
    }
  }

  handleKeyData(data: string): void {
    if (this._mode === 'process') return
    this.shell.handleData(data)
  }

  runProcess(name: string, args: string[]): void {
    const factory = getProcess(name)
    if (!factory) return
    const container = this.processContainer
    if (!container) return

    const env: Record<string, string> = {}
    if (args.length > 0) {
      const resolved = resolvePath(this.cwd, args[0])
      env['__VFS_PATH__'] = resolved
      const content = readFile(resolved)
      if (content !== null) {
        env['__FILE_CONTENT__'] = content
      }
    }

    const process = factory({
      wasmUrl: '',
      args,
      env,
      cwd: this.cwd,
      cols: this.term?.cols || 80,
      rows: this.term?.rows || 24,
      container,
    })

    const cleanup = () => {
      container.replaceChildren()
      this._mode = 'shell'
      this._process = null
      this._processCleanup = null
      this.notifyPaneSubscribers()
      setTimeout(() => {
        this.shell.printPrompt()
      }, 0)
    }

    process.onExit(() => cleanup())
    this._mode = 'process'
    this._process = process
    this._processCleanup = cleanup
    this.notifyPaneSubscribers()

    process.start().catch((err) => {
      console.error('Failed to start process in pane:', err)
      cleanup()
    })
  }

  setProcessContainer(el: HTMLDivElement | null): void {
    this.processContainer = el
  }

  /** Subscribe to pane-local state changes. Returns unsubscribe function. */
  subscribe(cb: () => void): () => void {
    this.paneSubscribers.add(cb)
    return () => this.paneSubscribers.delete(cb)
  }

  private notifyPaneSubscribers(): void {
    for (const cb of this.paneSubscribers) cb()
  }

  // Getters
  getHistory(): CellData[][] { return this._history }
  getInputLine(): string { return this._inputLine }
  getInputCursor(): number { return this._inputCursor }
  getPromptText(): string { return this._promptText }
  getCwd(): string { return this.cwd }
  getMode(): PaneMode { return this._mode }
  getProcess(): WasmProcess | null { return this._process }
}
