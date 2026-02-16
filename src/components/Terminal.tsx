import { useRef, useEffect, useState } from 'react'
import { ShellAdapter } from '~/terminal/shell'
import { installWindowAPI } from '~/terminal/api'
import { printMotd } from '~/terminal/bashrc'

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
    for (let x = 0; x < cols; x++) {
      row.push(EMPTY_CELL)
    }
  }
  return row
}

function rowHasContent(row: CellData[]): boolean {
  return row.some((c) => c.char !== ' ')
}

export function Terminal({ cwd, setCwd }: TerminalProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const hiddenInputRef = useRef<HTMLTextAreaElement>(null)
  const [history, setHistory] = useState<CellData[][]>([])
  const [inputLine, setInputLine] = useState('')
  const [inputCursor, setInputCursor] = useState(0)
  const [displayCwd, setDisplayCwd] = useState(cwd)
  const [focused, setFocused] = useState(true)
  const wasmTermRef = useRef<any>(null)
  const shellRef = useRef<ShellAdapter | null>(null)
  const termRef = useRef<any>(null)

  const cwdRef = useRef(cwd)
  const setCwdRef = useRef(setCwd)
  useEffect(() => { cwdRef.current = cwd; setDisplayCwd(cwd) }, [cwd])
  useEffect(() => { setCwdRef.current = setCwd }, [setCwd])

  // Focus the hidden input on mount
  useEffect(() => {
    hiddenInputRef.current?.focus()
  }, [])

  // Auto-scroll to bottom when content changes
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight
    }
  }, [history, inputLine])

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
      const { init, Terminal: GhosttyTerminal } = await import('ghostty-web')
      await init()

      if (disposed) return

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

      shell.setInputChangeCallback((buffer, pos) => {
        setInputLine(buffer)
        setInputCursor(pos)
      })

      shell.setContextProvider(() => ({
        cwd: cwdRef.current,
        setCwd: (path: string) => {
          cwdRef.current = path
          setDisplayCwd(path)
          setCwdRef.current(path)
        },
        clearHistory: () => setHistory([]),
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
  }, [])

  // Keyboard input via hidden textarea
  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    const shell = shellRef.current
    if (!shell) return

    // Let browser hotkeys pass through (Cmd on macOS, Ctrl on Windows/Linux)
    const isMac = /mac|iphone|ipad|ipod/i.test(navigator.userAgent)
    const modKey = isMac ? e.metaKey : e.ctrlKey
    if (modKey) {
      const browserKeys = new Set(['l', 't', 'w', 'n', 'r', 'q', 'Tab', 'shift'])
      // Cmd/Ctrl+Shift combos (e.g. Cmd+Shift+T to reopen tab)
      if (e.shiftKey) return
      if (browserKeys.has(e.key)) return
    }

    // On macOS, also let Cmd+<key> combos through that aren't terminal shortcuts
    if (e.metaKey && isMac) return

    // Prevent default for keys we handle
    if (e.key === 'Enter') {
      e.preventDefault()
      shell.handleData('\r')
    } else if (e.key === 'Backspace') {
      e.preventDefault()
      shell.handleData('\x7f')
    } else if (e.key === 'Tab') {
      e.preventDefault()
      shell.handleData('\t')
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      shell.handleData('\x1b[A')
    } else if (e.key === 'ArrowDown') {
      e.preventDefault()
      shell.handleData('\x1b[B')
    } else if (e.key === 'ArrowRight') {
      e.preventDefault()
      shell.handleData('\x1b[C')
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault()
      shell.handleData('\x1b[D')
    } else if (e.key === 'Home') {
      e.preventDefault()
      shell.handleData('\x1b[H')
    } else if (e.key === 'End') {
      e.preventDefault()
      shell.handleData('\x1b[F')
    } else if (e.key === 'Delete') {
      e.preventDefault()
      shell.handleData('\x1b[3~')
    } else if (e.ctrlKey && e.key === 'c') {
      e.preventDefault()
      shell.handleData('\x03')
    } else if (e.ctrlKey && e.key === 'd') {
      e.preventDefault()
      shell.handleData('\x04')
    } else if (e.ctrlKey && e.key === 'l') {
      e.preventDefault()
      shell.handleData('\x0c')
    } else if (e.ctrlKey && e.key === 'u') {
      e.preventDefault()
      shell.handleData('\x15')
    } else if (e.ctrlKey && e.key === 'a') {
      e.preventDefault()
      shell.handleData('\x01')
    } else if (e.ctrlKey && e.key === 'e') {
      e.preventDefault()
      shell.handleData('\x05')
    } else if (e.ctrlKey && e.key === 'w') {
      e.preventDefault()
      shell.handleData('\x17')
    } else if (e.ctrlKey && e.key === 'k') {
      e.preventDefault()
      shell.handleData('\x0b')
    } else if (e.key.length === 1 && !e.ctrlKey && !e.metaKey) {
      e.preventDefault()
      shell.handleData(e.key)
    }
  }

  function focusInput() {
    hiddenInputRef.current?.focus()
  }

  const promptText = displayCwd === '/' ? '~ $ ' : '~' + displayCwd + ' $ '

  return (
    <div
      ref={containerRef}
      onClick={focusInput}
      className="bg-black text-neutral-300 font-mono text-sm leading-[1.2] px-4 py-3 sm:px-[5vw] sm:py-[4vh] md:px-[8vw] md:py-[6vh] lg:px-[12vw] lg:py-[8vh] h-screen w-screen box-border overflow-auto cursor-text"
    >
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
