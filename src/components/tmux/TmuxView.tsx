import type { TmuxManager } from '~/terminal/tmux/manager'
import { collectPaneIds } from '~/terminal/tmux/layout'
import { PaneView } from './PaneView'
import { StatusBar } from './StatusBar'
import { WindowViewer } from './WindowViewer'

interface TmuxViewProps {
  manager: TmuxManager
  focused: boolean
}

export function TmuxView({ manager, focused }: TmuxViewProps) {
  const session = manager.getSnapshot()
  const activeWindow = manager.getActiveWindow()
  const rects = manager.computePaneRects()
  const overlay = manager.getOverlay()

  // Get visible pane IDs (all panes in zoomed mode only show the zoomed one)
  const visiblePaneIds = manager.isZoomed()
    ? [activeWindow.activePaneId]
    : collectPaneIds(activeWindow.layout)

  return (
    <div className="flex flex-col h-full w-full" style={{ backgroundColor: '#000' }}>
      {/* Pane area */}
      <div className="relative flex-1 min-h-0">
        {visiblePaneIds.map((paneId) => {
          const controller = manager.getPaneController(paneId)
          const rect = rects.get(paneId)
          if (!controller || !rect) return null
          return (
            <PaneView
              key={paneId}
              controller={controller}
              rect={rect}
              isActive={paneId === activeWindow.activePaneId}
              focused={focused}
            />
          )
        })}

        {/* Kill pane confirm overlay */}
        {overlay === 'kill-pane-confirm' && (
          <div className="absolute inset-0 flex items-center justify-center z-50">
            <div
              className="border rounded px-4 py-3 text-sm font-mono"
              style={{
                backgroundColor: 'rgba(0, 0, 0, 0.95)',
                borderColor: '#ef4444',
                color: '#d4d4d4',
              }}
            >
              kill-pane? (y/n)
            </div>
          </div>
        )}

        {/* Window viewer overlay */}
        {overlay === 'window-viewer' && (
          <WindowViewer
            session={session}
            selectedIndex={manager.getWindowViewerIndex()}
          />
        )}
      </div>

      {/* Status bar */}
      <StatusBar
        session={session}
        prefixActive={manager.isPrefixActive()}
        zoomed={manager.isZoomed()}
      />
    </div>
  )
}
