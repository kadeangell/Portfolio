import { useRef, useEffect, useState, useCallback } from 'react'
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

interface CursorState {
  x: number
  y: number
  visible: boolean
}

interface ScreenState {
  rows: CellData[][]
  cursor: CursorState
  cols: number
  totalRows: number
}

const DEFAULT_FG = 'rgb(204,204,204)'
const DEFAULT_BG = 'rgb(0,0,0)'

function cellFg(cell: any): string {
  return `rgb(${cell.fg_r},${cell.fg_g},${cell.fg_b})`
}

function cellBg(cell: any): string {
  return `rgb(${cell.bg_r},${cell.bg_g},${cell.bg_b})`
}

export function Terminal() {
  const containerRef = useRef<HTMLDivElement>(null)
  const hiddenInputRef = useRef<HTMLTextAreaElement>(null)
  const [screen, setScreen] = useState<ScreenState | null>(null)
  const [focused, setFocused] = useState(true)
  const wasmTermRef = useRef<any>(null)
  const shellRef = useRef<ShellAdapter | null>(null)
  const termRef = useRef<any>(null)

  // Read cells from ghostty's buffer and update React state
  const syncScreen = useCallback(() => {
    const wasmTerm = wasmTermRef.current
    const term = termRef.current
    if (!wasmTerm || !term) return

    const cols = term.cols || 80
    const totalRows = term.rows || 24
    const cursor = wasmTerm.getCursor()
    const rows: CellData[][] = []

    for (let y = 0; y < totalRows; y++) {
      const cells = wasmTerm.getLine(y)
      const row: CellData[] = []
      if (cells) {
        for (let x = 0; x < cols; x++) {
          const cell = cells[x]
          if (cell) {
            const fg = cellFg(cell)
            const bg = cellBg(cell)
            row.push({
              char: cell.codepoint ? String.fromCodePoint(cell.codepoint) : ' ',
              fg,
              bg,
              bold: !!(cell.flags & 1),
              italic: !!(cell.flags & 4),
              underline: !!(cell.flags & 8),
            })
          } else {
            row.push({ char: ' ', fg: DEFAULT_FG, bg: DEFAULT_BG, bold: false, italic: false, underline: false })
          }
        }
      } else {
        for (let x = 0; x < cols; x++) {
          row.push({ char: ' ', fg: DEFAULT_FG, bg: DEFAULT_BG, bold: false, italic: false, underline: false })
        }
      }
      rows.push(row)
    }

    setScreen({
      rows,
      cursor: { x: cursor?.x ?? 0, y: cursor?.y ?? 0, visible: cursor?.visible ?? true },
      cols,
      totalRows,
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
      const { init, Terminal: GhosttyTerminal } = await import('ghostty-web')
      await init()

      if (disposed) return

      const term = new GhosttyTerminal({ fontSize: 14 })
      term.open(hiddenContainer)
      termRef.current = term
      wasmTermRef.current = term.wasmTerm

      // Create a writer that writes to ghostty's VT100 parser and syncs our UI
      const writer = {
        write(data: string) {
          term.write(data)
          syncScreen()
        },
      }

      const shell = new ShellAdapter(writer)
      shellRef.current = shell
      cleanupWindowAPI = installWindowAPI(writer, shell)

      // Print MOTD and initial prompt
      printMotd(writer)
      shell.printPrompt()
      syncScreen()

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
  }, [syncScreen])

  // Keyboard input via hidden textarea
  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    const shell = shellRef.current
    if (!shell) return

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

  return (
    <div
      ref={containerRef}
      onClick={focusInput}
      className="bg-black text-neutral-300 font-mono text-sm leading-[1.2] p-28 h-screen w-screen box-border overflow-auto cursor-text"
    >
      {screen && screen.rows.map((row, y) => {
        // Skip trailing empty rows
        const hasContent = row.some((c) => c.char !== ' ')
        const hasCursor = screen.cursor.y === y && screen.cursor.visible
        if (!hasContent && !hasCursor && y > 0) return null

        return (
          <div key={y} className="whitespace-pre min-h-[1.2em]">
            {row.map((cell, x) => {
              const isCursor = screen.cursor.visible && screen.cursor.x === x && screen.cursor.y === y

              return (
                <span
                  key={x}
                  className={[
                    cell.bold ? 'font-bold' : '',
                    cell.italic ? 'italic' : '',
                    cell.underline ? 'underline' : '',
                    isCursor && focused ? 'animate-blink' : '',
                  ].filter(Boolean).join(' ') || undefined}
                  style={{
                    color: cell.fg !== DEFAULT_FG ? cell.fg : undefined,
                    backgroundColor: isCursor
                      ? focused ? '#d4d4d4' : '#555'
                      : cell.bg !== DEFAULT_BG ? cell.bg : undefined,
                  }}
                >
                  {cell.char}
                </span>
              )
            })}
          </div>
        )
      })}
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
