export type PaneId = string
export type WindowId = string

/** Leaf node — a single pane */
export interface LeafNode {
  kind: 'leaf'
  paneId: PaneId
}

/** Split node — divides space between two children */
export interface SplitNode {
  kind: 'split'
  direction: 'horizontal' | 'vertical' // horizontal = top/bottom, vertical = left/right
  ratio: number // 0..1, fraction allocated to first child
  first: LayoutNode
  second: LayoutNode
}

export type LayoutNode = LeafNode | SplitNode

/** Normalized rectangle (0..1 fractions of container) */
export interface Rect {
  x: number
  y: number
  width: number
  height: number
}

export type PaneMode = 'shell' | 'process'

export interface WindowState {
  id: WindowId
  name: string
  layout: LayoutNode
  activePaneId: PaneId
}

export interface SessionState {
  windows: WindowState[]
  activeWindowIndex: number
}

export type TmuxOverlay = 'none' | 'window-viewer' | 'kill-pane-confirm'
