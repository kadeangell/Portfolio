import { useState, useEffect } from 'react'
import type { SessionState } from '~/terminal/tmux/types'

interface StatusBarProps {
  session: SessionState
  prefixActive: boolean
  zoomed: boolean
}

export function StatusBar({ session, prefixActive, zoomed }: StatusBarProps) {
  const [time, setTime] = useState(() => formatTime())

  useEffect(() => {
    const interval = setInterval(() => setTime(formatTime()), 1000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div
      className="flex items-center justify-between px-2 text-xs font-mono select-none shrink-0"
      style={{
        height: '1.5em',
        lineHeight: '1.5em',
        backgroundColor: '#14532d',
        color: '#86efac',
      }}
    >
      <div className="flex items-center gap-2">
        <span>[0]</span>
        {session.windows.map((win, i) => (
          <span
            key={win.id}
            className={i === session.activeWindowIndex ? 'font-bold' : ''}
          >
            {i}:{win.name}{i === session.activeWindowIndex ? '*' : ''}
            {zoomed && i === session.activeWindowIndex ? ' (Z)' : ''}
          </span>
        ))}
      </div>
      <div className="flex items-center gap-2">
        {prefixActive && (
          <span style={{ color: '#fbbf24' }}>[PREFIX]</span>
        )}
        <span>{time}</span>
      </div>
    </div>
  )
}

function formatTime(): string {
  const now = new Date()
  return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
}
