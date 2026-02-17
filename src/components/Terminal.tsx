import { useRef, useEffect, useState, useCallback } from 'react'
import { ShellAdapter } from '~/terminal/shell'
import { installWindowAPI } from '~/terminal/api'
import { printMotd } from '~/terminal/bashrc'
import { getProcess, registerProcess, VimWasmProcess } from '~/terminal/process'
import { readFile } from '~/terminal/fs'
import { resolvePath } from '~/terminal/fs'
import type { WasmProcess } from '~/terminal/process'
import { TmuxManager } from '~/terminal/tmux/manager'
import { processTmuxKey } from '~/terminal/tmux/keybinds'
import { TmuxView } from '~/components/tmux/TmuxView'

interface CellData {
  char: string
  fg: string
  bg: string
  bold: boolean
  italic: boolean
  underline: boolean
}

interface TerminalProps {
  cwd: string
  setCwd: (value: string | ((old: string) => string | null) | null) => void
}

type TerminalMode =
  | { kind: 'shell' }
  | { kind: 'process'; process: WasmProcess; cleanup: () => void }

const DEFAULT_FG = 'rgb(204,204,204)'
const DEFAULT_BG = 'rgb(0,0,0)'
const EMPTY_CELL: CellData = { char: ' ', fg: DEFAULT_FG, bg: DEFAULT_BG, bold: false, italic: false, underline: false }

// Register built-in process factories
registerProcess('vim', (config) => new VimWasmProcess(config))
registerProcess('vi', (config) => new VimWasmProcess(config))
registerProcess('nvim', (config) => new VimWasmProcess(config))

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
    for (let x = 0; x < cols; x++) {
      row.push(EMPTY_CELL)
    }
  }
  return row
}

function rowHasContent(row: CellData[]): boolean {
  return row.some((c) => c.char !== ' ')
}

/** Translate a KeyboardEvent to VT100 data string for the shell adapter. */
function keyToVt100(e: React.KeyboardEvent<HTMLTextAreaElement>): string | null {
  // Let browser hotkeys pass through
  const isMac = /mac|iphone|ipad|ipod/i.test(navigator.userAgent)
  const modKey = isMac ? e.metaKey : e.ctrlKey
  if (modKey) {
    const browserKeys = new Set(['l', 't', 'w', 'n', 'q', 'Tab', 'shift'])
    if (e.shiftKey) return null
    if (browserKeys.has(e.key)) return null
  }
  if (e.metaKey && isMac) return null

  if (e.key === 'Enter') return '\r'
  if (e.key === 'Backspace') return '\x7f'
  if (e.key === 'Tab') return '\t'
  if (e.key === 'ArrowUp') return '\x1b[A'
  if (e.key === 'ArrowDown') return '\x1b[B'
  if (e.key === 'ArrowRight') return '\x1b[C'
  if (e.key === 'ArrowLeft') return '\x1b[D'
  if (e.key === 'Home') return '\x1b[H'
  if (e.key === 'End') return '\x1b[F'
  if (e.key === 'Delete') return '\x1b[3~'
  if (e.ctrlKey && e.key === 'c') return '\x03'
  if (e.ctrlKey && e.key === 'd') return '\x04'
  if (e.ctrlKey && e.key === 'l') return '\x0c'
  if (e.ctrlKey && e.key === 'u') return '\x15'
  if (e.ctrlKey && e.key === 'a') return '\x01'
  if (e.ctrlKey && e.key === 'e') return '\x05'
  if (e.ctrlKey && e.key === 'w') return '\x17'
  if (e.ctrlKey && e.key === 'k') return '\x0b'
  if (e.ctrlKey && e.key === 'r') return '\x12'
  if (e.ctrlKey && e.key === 'g') return '\x07'
  if (e.key === 'Escape') return '\x1b'
  if (e.key.length === 1 && !e.ctrlKey && !e.metaKey) return e.key
  return null
}

export function Terminal({ cwd, setCwd }: TerminalProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const hiddenInputRef = useRef<HTMLTextAreaElement>(null)
  const processContainerRef = useRef<HTMLDivElement>(null)
  const [history, setHistory] = useState<CellData[][]>([])
  const [inputLine, setInputLine] = useState('')
  const [inputCursor, setInputCursor] = useState(0)
  const [promptText, setPromptText] = useState('')
  const [focused, setFocused] = useState(true)
  const [mode, setMode] = useState<TerminalMode>({ kind: 'shell' })
  const wasmTermRef = useRef<any>(null)
  const shellRef = useRef<ShellAdapter | null>(null)
  const termRef = useRef<any>(null)
  const modeRef = useRef(mode)

  // Tmux state
  const [tmuxActive, setTmuxActive] = useState(false)
  const [, setTmuxVersion] = useState(0) // bumped to trigger re-renders
  const tmuxManagerRef = useRef<TmuxManager | null>(null)
  const ghosttyModuleRef = useRef<any>(null)

  const cwdRef = useRef(cwd)
  const setCwdRef = useRef(setCwd)
  useEffect(() => { cwdRef.current = cwd }, [cwd])
  useEffect(() => { setCwdRef.current = setCwd }, [setCwd])
  useEffect(() => { modeRef.current = mode }, [mode])

  // Focus the hidden input on mount and when returning to shell mode
  useEffect(() => {
    if (mode.kind === 'shell' || tmuxActive) {
      hiddenInputRef.current?.focus()
    }
  }, [mode, tmuxActive])

  // Auto-scroll to bottom when content changes
  useEffect(() => {
    if (containerRef.current && mode.kind === 'shell' && !tmuxActive) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight
    }
  }, [history, inputLine, mode, tmuxActive])

  // Start tmux
  const startTmux = useCallback(() => {
    const module = ghosttyModuleRef.current
    if (!module) return

    const manager = new TmuxManager({
      ghosttyModule: module,
      initialCwd: cwdRef.current,
      onChange: () => setTmuxVersion((v) => v + 1),
    })

    tmuxManagerRef.current = manager
    setTmuxActive(true)
  }, [])

  // Detach tmux (dispose manager, restore original shell)
  const detachTmux = useCallback(() => {
    const manager = tmuxManagerRef.current
    if (manager) {
      manager.dispose()
      tmuxManagerRef.current = null
    }
    setTmuxActive(false)
    // Restore prompt in original shell
    setTimeout(() => {
      shellRef.current?.printPrompt()
      hiddenInputRef.current?.focus()
    }, 0)
  }, [])

  const runProcess = useCallback((name: string, args: string[]) => {
    const factory = getProcess(name)
    if (!factory) return

    const container = processContainerRef.current
    if (!container) return

    // Read file content for vim if a filename was provided
    const env: Record<string, string> = {}
    if (args.length > 0) {
      const resolved = resolvePath(cwdRef.current, args[0])
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
      cwd: cwdRef.current,
      cols: termRef.current?.cols || 80,
      rows: termRef.current?.rows || 24,
      container,
    })

    const cleanup = () => {
      container.replaceChildren()
      setMode({ kind: 'shell' })
      // Re-print prompt after process exits
      setTimeout(() => {
        shellRef.current?.printPrompt()
        hiddenInputRef.current?.focus()
      }, 0)
    }

    process.onExit(() => cleanup())
    setMode({ kind: 'process', process, cleanup })

    process.start().catch((err) => {
      console.error('Failed to start process:', err)
      cleanup()
    })
  }, [])

  useEffect(() => {
    let disposed = false
    let cleanupWindowAPI: (() => void) | undefined

    // Hidden container for ghostty WASM initialization
    const hiddenContainer = document.createElement('div')
    hiddenContainer.style.position = 'absolute'
    hiddenContainer.style.left = '-9999px'
    hiddenContainer.style.top = '-9999px'
    hiddenContainer.style.width = '1px'
    hiddenContainer.style.height = '1px'
    hiddenContainer.style.overflow = 'hidden'
    document.body.appendChild(hiddenContainer)

    async function setup() {
      const ghosttyModule = await import('ghostty-web')
      const { init, Terminal: GhosttyTerminal } = ghosttyModule
      await init()

      if (disposed) return

      // Store the module so TmuxManager can create additional terminals
      ghosttyModuleRef.current = { Terminal: GhosttyTerminal }

      const term = new GhosttyTerminal({ fontSize: 14 })
      term.open(hiddenContainer)
      termRef.current = term
      wasmTermRef.current = term.wasmTerm

      // Writer feeds ghostty for VT100 parsing — no screen sync on every write
      const writer = {
        write(data: string) {
          term.write(data)
        },
      }

      const shell = new ShellAdapter(writer)
      shellRef.current = shell

      // Flush ghostty content into React history, then clear ghostty
      const flushToHistory = () => {
        const wasmTerm = wasmTermRef.current
        if (!wasmTerm) return
        const cols = term.cols || 80
        const totalRows = term.rows || 24
        const cursor = wasmTerm.getCursor()
        const cursorY = cursor?.y ?? 0

        let lastContentRow = -1
        for (let y = totalRows - 1; y >= 0; y--) {
          const row = readGhosttyRow(wasmTerm, y, cols)
          if (rowHasContent(row)) {
            lastContentRow = y
            break
          }
        }

        if (lastContentRow >= 0) {
          const captureEnd = Math.max(lastContentRow, cursorY - 1)
          const captured: CellData[][] = []
          for (let y = 0; y <= captureEnd; y++) {
            captured.push(readGhosttyRow(wasmTerm, y, cols))
          }
          setHistory((prev) => [...prev, ...captured])
        }

        term.write('\x1b[2J\x1b[H')
      }

      shell.setBeforePromptCallback(flushToHistory)

      shell.setInputChangeCallback((buffer, pos, prompt) => {
        setInputLine(buffer)
        setInputCursor(pos)
        setPromptText(prompt)
      })

      shell.setContextProvider(() => ({
        cwd: cwdRef.current,
        setCwd: (path: string) => {
          cwdRef.current = path
          setCwdRef.current(path)
        },
        clearHistory: () => setHistory([]),
        runProcess,
        getCommandHistory: () => shell.getHistory(),
        startTmux,
      }))

      cleanupWindowAPI = installWindowAPI(writer, shell)

      // Print MOTD, flush to history, then start with fresh prompt
      printMotd(writer)
      flushToHistory()
      shell.printPrompt()

      return () => {
        term.dispose()
      }
    }

    let termCleanup: (() => void) | undefined
    setup().then((cleanup) => {
      termCleanup = cleanup
    })

    return () => {
      disposed = true
      termCleanup?.()
      cleanupWindowAPI?.()
      document.body.removeChild(hiddenContainer)
    }
  }, [runProcess, startTmux])

  // Keyboard input via hidden textarea
  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    // ── Tmux mode ──────────────────────────────────────────────
    if (tmuxActive) {
      const manager = tmuxManagerRef.current
      if (!manager) return

      const action = processTmuxKey(e, manager)

      if (action === 'passthrough') {
        // Translate the key event to VT100 and send to active pane
        const activePane = manager.getActivePane()
        if (!activePane) return

        // If active pane is in process mode, let the process handle it
        if (activePane.getMode() === 'process') return

        const data = keyToVt100(e)
        if (data !== null) {
          e.preventDefault()
          activePane.handleKeyData(data)
        }
        return
      }

      if (action === 'detach') {
        detachTmux()
        return
      }

      // 'handled' and 'activate-prefix' — already handled by processTmuxKey
      return
    }

    // ── Normal mode ────────────────────────────────────────────
    const shell = shellRef.current
    if (!shell) return

    // In process mode, don't handle shell keys
    if (modeRef.current.kind === 'process') return

    const data = keyToVt100(e)
    if (data !== null) {
      e.preventDefault()
      shell.handleData(data)
    }
  }

  function focusInput() {
    if (mode.kind === 'shell' || tmuxActive) {
      hiddenInputRef.current?.focus()
    }
  }

  return (
    <div
      ref={containerRef}
      onClick={focusInput}
      className={`bg-black text-neutral-300 font-mono text-sm leading-[1.2] h-screen w-screen box-border cursor-text ${
        tmuxActive
          ? 'overflow-hidden px-4 py-3 sm:px-[5vw] sm:py-[4vh] md:px-[8vw] md:py-[6vh] lg:px-[12vw] lg:py-[8vh]'
          : mode.kind === 'shell'
            ? 'overflow-auto px-4 py-3 sm:px-[5vw] sm:py-[4vh] md:px-[8vw] md:py-[6vh] lg:px-[12vw] lg:py-[8vh]'
            : 'overflow-hidden px-4 py-3 sm:px-[5vw] sm:py-[4vh] md:px-[8vw] md:py-[6vh] lg:px-[12vw] lg:py-[8vh]'
      }`}
    >
      {tmuxActive && tmuxManagerRef.current ? (
        <TmuxView manager={tmuxManagerRef.current} focused={focused} />
      ) : (
        <>
          {mode.kind === 'shell' && (
            <>
              {history.map((row, i) => (
                <div key={`h${i}`} className="whitespace-pre min-h-[1.2em]">
                  {row.map((cell, x) => (
                    <span
                      key={x}
                      className={[
                        cell.bold ? 'font-bold' : '',
                        cell.italic ? 'italic' : '',
                        cell.underline ? 'underline' : '',
                      ].filter(Boolean).join(' ') || undefined}
                      style={{
                        color: cell.fg !== DEFAULT_FG ? cell.fg : undefined,
                        backgroundColor: cell.bg !== DEFAULT_BG ? cell.bg : undefined,
                      }}
                    >
                      {cell.char}
                    </span>
                  ))}
                </div>
              ))}
              <div className="whitespace-pre min-h-[1.2em]">
                <span>{promptText}</span>
                <span>{inputLine.slice(0, inputCursor)}</span>
                <span
                  className={focused ? 'animate-blink' : undefined}
                  style={{ backgroundColor: focused ? '#d4d4d4' : '#555' }}
                >
                  {inputLine[inputCursor] ?? ' '}
                </span>
                {inputCursor < inputLine.length && (
                  <span>{inputLine.slice(inputCursor + 1)}</span>
                )}
              </div>
            </>
          )}
          <div
            ref={processContainerRef}
            className={mode.kind === 'process' ? 'w-full h-full relative' : 'hidden'}
          />
        </>
      )}
      {/* Hidden textarea — always present as keyboard entry point */}
      <textarea
        ref={hiddenInputRef}
        onKeyDown={handleKeyDown}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        className="absolute -left-[9999px] -top-[9999px] opacity-0 w-0 h-0 p-0 border-none"
        autoComplete="off"
        spellCheck={false}
        autoFocus
      />
    </div>
  )
}
