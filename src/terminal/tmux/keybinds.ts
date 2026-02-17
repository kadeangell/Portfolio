import type { TmuxManager } from './manager'

export type KeyAction = 'passthrough' | 'handled' | 'activate-prefix' | 'detach'

/**
 * Process a keyboard event in tmux mode.
 * Returns the action the caller should take.
 */
export function processTmuxKey(e: KeyboardEvent | React.KeyboardEvent, manager: TmuxManager): KeyAction {
  // Let browser hotkeys pass through (Cmd on macOS, Ctrl on Windows/Linux for browser combos)
  const isMac = /mac|iphone|ipad|ipod/i.test(navigator.userAgent)
  if (e.metaKey && isMac) return 'passthrough'
  const modKey = isMac ? e.metaKey : e.ctrlKey
  if (modKey) {
    const browserKeys = new Set(['l', 't', 'w', 'n', 'q', 'Tab'])
    if (e.shiftKey) return 'passthrough'
    if (browserKeys.has(e.key)) return 'passthrough'
  }

  // Handle overlays first — consume all keys
  const overlay = manager.getOverlay()
  if (overlay === 'window-viewer') {
    e.preventDefault()
    manager.handleWindowViewerKey(e.key)
    return 'handled'
  }
  if (overlay === 'kill-pane-confirm') {
    e.preventDefault()
    manager.handleKillPaneConfirmKey(e.key)
    // Check if kill-pane resulted in needing to detach
    if (manager.isLastPane() && (e.key === 'y' || e.key === 'Y')) {
      return 'detach'
    }
    return 'handled'
  }

  // Prefix mode: Ctrl+B was pressed, waiting for the command key
  if (manager.isPrefixActive()) {
    // Ignore bare modifier keys — wait for the actual command key
    if (e.key === 'Shift' || e.key === 'Control' || e.key === 'Alt' || e.key === 'Meta') {
      return 'handled'
    }

    e.preventDefault()
    manager.cancelPrefix()

    switch (e.key) {
      // Split panes
      case '%':
        manager.splitPane('vertical')
        return 'handled'
      case '"':
        manager.splitPane('horizontal')
        return 'handled'

      // Navigate panes
      case 'ArrowUp':
        manager.navigatePane('up')
        return 'handled'
      case 'ArrowDown':
        manager.navigatePane('down')
        return 'handled'
      case 'ArrowLeft':
        manager.navigatePane('left')
        return 'handled'
      case 'ArrowRight':
        manager.navigatePane('right')
        return 'handled'

      // Window operations
      case 'c':
        manager.createWindow()
        return 'handled'
      case 'n':
        manager.nextWindow()
        return 'handled'
      case 'p':
        manager.previousWindow()
        return 'handled'
      case 'w':
        manager.openWindowViewer()
        return 'handled'

      // Detach
      case 'd':
        return 'detach'

      // Kill pane
      case 'x':
        if (manager.isLastPane()) {
          return 'detach'
        }
        manager.openKillPaneConfirm()
        return 'handled'

      // Zoom pane
      case 'z':
        manager.zoomPane()
        return 'handled'

      default:
        // Unknown prefix command, ignore
        return 'handled'
    }
  }

  // Detect Ctrl+B to activate prefix
  if (e.ctrlKey && e.key === 'b') {
    e.preventDefault()
    manager.activatePrefix()
    return 'activate-prefix'
  }

  // Everything else passes through to the active pane
  return 'passthrough'
}
