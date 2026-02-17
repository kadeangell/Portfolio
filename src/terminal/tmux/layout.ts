import type { LayoutNode, PaneId, Rect } from './types'

/** Recursively compute pixel-normalized rects for every pane in the tree. */
export function computeRects(
  node: LayoutNode,
  bounds: Rect,
): Map<PaneId, Rect> {
  const result = new Map<PaneId, Rect>()

  if (node.kind === 'leaf') {
    result.set(node.paneId, bounds)
    return result
  }

  const { direction, ratio, first, second } = node

  let firstBounds: Rect
  let secondBounds: Rect

  if (direction === 'vertical') {
    // Left / right split
    const splitWidth = bounds.width * ratio
    firstBounds = { x: bounds.x, y: bounds.y, width: splitWidth, height: bounds.height }
    secondBounds = { x: bounds.x + splitWidth, y: bounds.y, width: bounds.width - splitWidth, height: bounds.height }
  } else {
    // Top / bottom split
    const splitHeight = bounds.height * ratio
    firstBounds = { x: bounds.x, y: bounds.y, width: bounds.width, height: splitHeight }
    secondBounds = { x: bounds.x, y: bounds.y + splitHeight, width: bounds.width, height: bounds.height - splitHeight }
  }

  for (const [id, rect] of computeRects(first, firstBounds)) {
    result.set(id, rect)
  }
  for (const [id, rect] of computeRects(second, secondBounds)) {
    result.set(id, rect)
  }

  return result
}

/** Find the nearest pane in the given direction from the active pane. */
export function findPaneInDirection(
  rects: Map<PaneId, Rect>,
  fromPaneId: PaneId,
  direction: 'up' | 'down' | 'left' | 'right',
): PaneId | null {
  const fromRect = rects.get(fromPaneId)
  if (!fromRect) return null

  const fromCenterX = fromRect.x + fromRect.width / 2
  const fromCenterY = fromRect.y + fromRect.height / 2

  let bestId: PaneId | null = null
  let bestDist = Infinity

  for (const [id, rect] of rects) {
    if (id === fromPaneId) continue

    const centerX = rect.x + rect.width / 2
    const centerY = rect.y + rect.height / 2

    let valid = false
    switch (direction) {
      case 'left':
        valid = centerX < fromCenterX
        break
      case 'right':
        valid = centerX > fromCenterX
        break
      case 'up':
        valid = centerY < fromCenterY
        break
      case 'down':
        valid = centerY > fromCenterY
        break
    }

    if (!valid) continue

    const dist = Math.abs(centerX - fromCenterX) + Math.abs(centerY - fromCenterY)
    if (dist < bestDist) {
      bestDist = dist
      bestId = id
    }
  }

  return bestId
}

/** Replace a leaf node (by paneId) with a new node. Returns new root. */
export function replaceNode(
  root: LayoutNode,
  targetPaneId: PaneId,
  replacement: LayoutNode,
): LayoutNode {
  if (root.kind === 'leaf') {
    return root.paneId === targetPaneId ? replacement : root
  }

  return {
    ...root,
    first: replaceNode(root.first, targetPaneId, replacement),
    second: replaceNode(root.second, targetPaneId, replacement),
  }
}

/** Remove a pane from the layout tree. Returns null if tree becomes empty. */
export function removePane(
  root: LayoutNode,
  paneId: PaneId,
): LayoutNode | null {
  if (root.kind === 'leaf') {
    return root.paneId === paneId ? null : root
  }

  const firstContains = collectPaneIds(root.first).includes(paneId)
  const secondContains = collectPaneIds(root.second).includes(paneId)

  if (!firstContains && !secondContains) return root

  if (firstContains && root.first.kind === 'leaf' && root.first.paneId === paneId) {
    return root.second
  }
  if (secondContains && root.second.kind === 'leaf' && root.second.paneId === paneId) {
    return root.first
  }

  // Recurse into the side that contains the pane
  if (firstContains) {
    const newFirst = removePane(root.first, paneId)
    if (newFirst === null) return root.second
    return { ...root, first: newFirst }
  } else {
    const newSecond = removePane(root.second, paneId)
    if (newSecond === null) return root.first
    return { ...root, second: newSecond }
  }
}

/** Collect all pane IDs from a layout tree. */
export function collectPaneIds(node: LayoutNode): PaneId[] {
  if (node.kind === 'leaf') return [node.paneId]
  return [...collectPaneIds(node.first), ...collectPaneIds(node.second)]
}
