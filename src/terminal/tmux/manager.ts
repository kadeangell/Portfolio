import type {
  PaneId,
  WindowId,
  WindowState,
  SessionState,
  LayoutNode,
  TmuxOverlay,
  Rect,
} from './types'
import { computeRects, findPaneInDirection, replaceNode, removePane, collectPaneIds } from './layout'
import { PaneController } from './pane-controller'

let nextPaneId = 1
let nextWindowId = 1

function genPaneId(): PaneId {
  return `pane-${nextPaneId++}`
}

function genWindowId(): WindowId {
  return `win-${nextWindowId++}`
}

export class TmuxManager {
  private session: SessionState
  private paneControllers = new Map<PaneId, PaneController>()
  private ghosttyModule: any
  private initialCwd: string
  private onChange: () => void

  // Prefix key state
  private _prefixActive = false
  private prefixTimeout: ReturnType<typeof setTimeout> | null = null

  // Overlay state
  private _overlay: TmuxOverlay = 'none'
  private _windowViewerIndex = 0

  // Zoom state
  private _zoomedPaneId: PaneId | null = null

  constructor(config: {
    ghosttyModule: any
    initialCwd: string
    onChange: () => void
  }) {
    this.ghosttyModule = config.ghosttyModule
    this.initialCwd = config.initialCwd
    this.onChange = config.onChange

    // Create initial pane and window
    const paneId = genPaneId()
    const controller = new PaneController({
      id: paneId,
      initialCwd: this.initialCwd,
      ghosttyModule: this.ghosttyModule,
    })
    this.paneControllers.set(paneId, controller)

    const window: WindowState = {
      id: genWindowId(),
      name: 'shell',
      layout: { kind: 'leaf', paneId },
      activePaneId: paneId,
    }

    this.session = {
      windows: [window],
      activeWindowIndex: 0,
    }
  }

  // ── Getters ─────────────────────────────────────────────────

  getSnapshot(): SessionState {
    return this.session
  }

  getActiveWindow(): WindowState {
    return this.session.windows[this.session.activeWindowIndex]
  }

  getActivePane(): PaneController | undefined {
    const win = this.getActiveWindow()
    return this.paneControllers.get(win.activePaneId)
  }

  getPaneController(id: PaneId): PaneController | undefined {
    return this.paneControllers.get(id)
  }

  computePaneRects(): Map<PaneId, Rect> {
    const win = this.getActiveWindow()
    if (this._zoomedPaneId && this.paneControllers.has(this._zoomedPaneId)) {
      // In zoom mode, only the zoomed pane takes full area
      const map = new Map<PaneId, Rect>()
      map.set(this._zoomedPaneId, { x: 0, y: 0, width: 1, height: 1 })
      return map
    }
    return computeRects(win.layout, { x: 0, y: 0, width: 1, height: 1 })
  }

  isPrefixActive(): boolean {
    return this._prefixActive
  }

  getOverlay(): TmuxOverlay {
    return this._overlay
  }

  getWindowViewerIndex(): number {
    return this._windowViewerIndex
  }

  isZoomed(): boolean {
    return this._zoomedPaneId !== null
  }

  // ── Prefix key ──────────────────────────────────────────────

  activatePrefix(): void {
    this._prefixActive = true
    if (this.prefixTimeout) clearTimeout(this.prefixTimeout)
    this.prefixTimeout = setTimeout(() => {
      this._prefixActive = false
      this.onChange()
    }, 2000) // 2 second timeout
    this.onChange()
  }

  cancelPrefix(): void {
    this._prefixActive = false
    if (this.prefixTimeout) {
      clearTimeout(this.prefixTimeout)
      this.prefixTimeout = null
    }
    this.onChange()
  }

  // ── Pane operations ─────────────────────────────────────────

  splitPane(direction: 'horizontal' | 'vertical'): void {
    const win = this.getActiveWindow()
    const activePaneId = win.activePaneId
    const activeController = this.paneControllers.get(activePaneId)
    if (!activeController) return

    // Unzoom if zoomed
    if (this._zoomedPaneId) this._zoomedPaneId = null

    const newPaneId = genPaneId()
    const newController = new PaneController({
      id: newPaneId,
      initialCwd: activeController.getCwd(),
      ghosttyModule: this.ghosttyModule,
    })
    this.paneControllers.set(newPaneId, newController)

    // Replace the active pane's leaf node with a split
    const newSplit: LayoutNode = {
      kind: 'split',
      direction,
      ratio: 0.5,
      first: { kind: 'leaf', paneId: activePaneId },
      second: { kind: 'leaf', paneId: newPaneId },
    }

    win.layout = replaceNode(win.layout, activePaneId, newSplit)
    win.activePaneId = newPaneId
    this.onChange()
  }

  navigatePane(direction: 'up' | 'down' | 'left' | 'right'): void {
    const win = this.getActiveWindow()
    const rects = this.computePaneRects()
    const target = findPaneInDirection(rects, win.activePaneId, direction)
    if (target) {
      win.activePaneId = target
      this.onChange()
    }
  }

  killPane(): void {
    const win = this.getActiveWindow()
    const paneId = win.activePaneId
    const paneIds = collectPaneIds(win.layout)

    // If this is the last pane in the last window, signal detach
    if (paneIds.length <= 1 && this.session.windows.length <= 1) {
      // Will be handled by caller as detach
      return
    }

    const controller = this.paneControllers.get(paneId)
    if (controller) {
      controller.dispose()
      this.paneControllers.delete(paneId)
    }

    if (paneIds.length <= 1) {
      // Last pane in this window — remove the window
      this.session.windows.splice(this.session.activeWindowIndex, 1)
      if (this.session.activeWindowIndex >= this.session.windows.length) {
        this.session.activeWindowIndex = this.session.windows.length - 1
      }
      this.onChange()
      return
    }

    const newLayout = removePane(win.layout, paneId)
    if (newLayout) {
      win.layout = newLayout
      // Set active pane to the first pane in the remaining layout
      const remainingPanes = collectPaneIds(newLayout)
      win.activePaneId = remainingPanes[0]
    }

    this._zoomedPaneId = null
    this.onChange()
  }

  /** Returns true if this is the last pane in the last window (caller should detach). */
  isLastPane(): boolean {
    const win = this.getActiveWindow()
    const paneIds = collectPaneIds(win.layout)
    return paneIds.length <= 1 && this.session.windows.length <= 1
  }

  zoomPane(): void {
    const win = this.getActiveWindow()
    if (this._zoomedPaneId === win.activePaneId) {
      this._zoomedPaneId = null
    } else {
      this._zoomedPaneId = win.activePaneId
    }
    this.onChange()
  }

  // ── Window operations ───────────────────────────────────────

  createWindow(): void {
    const paneId = genPaneId()
    const controller = new PaneController({
      id: paneId,
      initialCwd: this.initialCwd,
      ghosttyModule: this.ghosttyModule,
    })
    this.paneControllers.set(paneId, controller)

    const win: WindowState = {
      id: genWindowId(),
      name: 'shell',
      layout: { kind: 'leaf', paneId },
      activePaneId: paneId,
    }

    this.session.windows.push(win)
    this.session.activeWindowIndex = this.session.windows.length - 1
    this._zoomedPaneId = null
    this.onChange()
  }

  nextWindow(): void {
    if (this.session.windows.length <= 1) return
    this.session.activeWindowIndex = (this.session.activeWindowIndex + 1) % this.session.windows.length
    this._zoomedPaneId = null
    this.onChange()
  }

  previousWindow(): void {
    if (this.session.windows.length <= 1) return
    this.session.activeWindowIndex = (this.session.activeWindowIndex - 1 + this.session.windows.length) % this.session.windows.length
    this._zoomedPaneId = null
    this.onChange()
  }

  selectWindow(index: number): void {
    if (index < 0 || index >= this.session.windows.length) return
    this.session.activeWindowIndex = index
    this._zoomedPaneId = null
    this.onChange()
  }

  // ── Overlay ─────────────────────────────────────────────────

  openWindowViewer(): void {
    this._overlay = 'window-viewer'
    this._windowViewerIndex = this.session.activeWindowIndex
    this.onChange()
  }

  openKillPaneConfirm(): void {
    this._overlay = 'kill-pane-confirm'
    this.onChange()
  }

  closeOverlay(): void {
    this._overlay = 'none'
    this.onChange()
  }

  handleWindowViewerKey(key: string): boolean {
    if (this._overlay !== 'window-viewer') return false

    switch (key) {
      case 'ArrowUp':
      case 'k':
        this._windowViewerIndex = Math.max(0, this._windowViewerIndex - 1)
        this.onChange()
        return true
      case 'ArrowDown':
      case 'j':
        this._windowViewerIndex = Math.min(this.session.windows.length - 1, this._windowViewerIndex + 1)
        this.onChange()
        return true
      case 'Enter':
        this.selectWindow(this._windowViewerIndex)
        this._overlay = 'none'
        this.onChange()
        return true
      case 'q':
      case 'Escape':
        this._overlay = 'none'
        this.onChange()
        return true
      default:
        return true // Consume all keys in overlay
    }
  }

  handleKillPaneConfirmKey(key: string): boolean {
    if (this._overlay !== 'kill-pane-confirm') return false

    if (key === 'y' || key === 'Y') {
      this._overlay = 'none'
      this.killPane()
      return true
    }
    if (key === 'n' || key === 'N' || key === 'Escape' || key === 'q') {
      this._overlay = 'none'
      this.onChange()
      return true
    }
    return true // Consume all keys in overlay
  }

  // ── Lifecycle ───────────────────────────────────────────────

  dispose(): void {
    if (this.prefixTimeout) clearTimeout(this.prefixTimeout)
    for (const controller of this.paneControllers.values()) {
      controller.dispose()
    }
    this.paneControllers.clear()
  }
}
