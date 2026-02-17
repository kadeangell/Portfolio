import type { SessionState } from '~/terminal/tmux/types'
import { collectPaneIds } from '~/terminal/tmux/layout'

interface WindowViewerProps {
  session: SessionState
  selectedIndex: number
}

export function WindowViewer({ session, selectedIndex }: WindowViewerProps) {
  return (
    <div className="absolute inset-0 flex items-center justify-center z-50">
      <div
        className="border rounded px-4 py-3 text-sm font-mono min-w-[300px] max-w-[80%]"
        style={{
          backgroundColor: 'rgba(0, 0, 0, 0.95)',
          borderColor: '#4ade80',
          color: '#d4d4d4',
        }}
      >
        <div className="mb-2 text-xs" style={{ color: '#86efac' }}>
          Choose window (Enter=select, q=cancel)
        </div>
        {session.windows.map((win, i) => {
          const paneCount = collectPaneIds(win.layout).length
          const isSelected = i === selectedIndex
          const isActive = i === session.activeWindowIndex
          return (
            <div
              key={win.id}
              className="py-0.5 px-1"
              style={{
                backgroundColor: isSelected ? '#14532d' : 'transparent',
                color: isSelected ? '#86efac' : '#d4d4d4',
              }}
            >
              {isSelected ? '>' : ' '} {i}: {win.name}
              {isActive ? ' *' : ''}
              {' '}({paneCount} pane{paneCount !== 1 ? 's' : ''})
            </div>
          )
        })}
      </div>
    </div>
  )
}
