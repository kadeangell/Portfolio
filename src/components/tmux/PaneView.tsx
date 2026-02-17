import { useRef, useEffect, useState } from 'react'
import type { PaneController } from '~/terminal/tmux/pane-controller'
import type { Rect } from '~/terminal/tmux/types'

const DEFAULT_FG = 'rgb(204,204,204)'
const DEFAULT_BG = 'rgb(0,0,0)'

interface PaneViewProps {
  controller: PaneController
  rect: Rect
  isActive: boolean
  focused: boolean
}

export function PaneView({ controller, rect, isActive, focused }: PaneViewProps) {
  const processContainerRef = useRef<HTMLDivElement>(null)
  const scrollRef = useRef<HTMLDivElement>(null)

  // Subscribe to pane-local state changes (input, history, mode)
  const [, setRenderVersion] = useState(0)
  useEffect(() => {
    return controller.subscribe(() => setRenderVersion((v) => v + 1))
  }, [controller])

  useEffect(() => {
    controller.setProcessContainer(processContainerRef.current)
    return () => controller.setProcessContainer(null)
  }, [controller])

  const history = controller.getHistory()
  const inputLine = controller.getInputLine()
  const inputCursor = controller.getInputCursor()
  const promptText = controller.getPromptText()
  const mode = controller.getMode()

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current && mode === 'shell') {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  })

  const showCursorBlink = isActive && focused

  return (
    <div
      className="absolute box-border"
      style={{
        left: `${rect.x * 100}%`,
        top: `${rect.y * 100}%`,
        width: `${rect.width * 100}%`,
        height: `${rect.height * 100}%`,
        borderColor: isActive ? '#4ade80' : '#333',
        borderWidth: '1px',
        borderStyle: 'solid',
      }}
    >
      {mode === 'shell' && (
        <div
          ref={scrollRef}
          className="h-full overflow-y-auto overflow-x-hidden px-2 py-1 text-sm font-mono leading-[1.2]"
          style={{ color: DEFAULT_FG, backgroundColor: DEFAULT_BG }}
        >
          {history.map((row, i) => (
            <div key={`h${i}`} className="whitespace-pre-wrap break-all min-h-[1.2em]">
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
          <div className="whitespace-pre-wrap break-all min-h-[1.2em]">
            <span>{promptText}</span>
            <span>{inputLine.slice(0, inputCursor)}</span>
            <span
              className={showCursorBlink ? 'animate-blink' : undefined}
              style={{ backgroundColor: showCursorBlink ? '#d4d4d4' : isActive ? '#888' : '#555' }}
            >
              {inputLine[inputCursor] ?? ' '}
            </span>
            {inputCursor < inputLine.length && (
              <span>{inputLine.slice(inputCursor + 1)}</span>
            )}
          </div>
        </div>
      )}
      <div
        ref={processContainerRef}
        className={mode === 'process' ? 'w-full h-full relative' : 'hidden'}
      />
    </div>
  )
}
