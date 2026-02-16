import { root } from './tree'
import type { FsNode } from './types'

const VFS_PREFIX = 'vfs:'

export function resolvePath(cwd: string, path: string): string {
  if (path === '~' || path === '') return '/'

  const parts = path.startsWith('/') ? path.split('/') : [...cwd.split('/'), ...path.split('/')]
  const resolved: string[] = []

  for (const part of parts) {
    if (part === '' || part === '.') continue
    if (part === '..') {
      resolved.pop()
    } else {
      resolved.push(part)
    }
  }

  return '/' + resolved.join('/')
}

export function getNode(absolutePath: string): FsNode | undefined {
  if (absolutePath === '/') return root

  const parts = absolutePath.split('/').filter(Boolean)
  let current: FsNode = root

  for (const part of parts) {
    if (current.kind !== 'dir') return undefined
    const child: FsNode | undefined = current.children[part]
    if (!child) return undefined
    current = child
  }

  return current
}

export function listDir(absolutePath: string): string[] | null {
  const node = getNode(absolutePath)
  if (!node || node.kind !== 'dir') return null
  return Object.keys(node.children)
}

export function readFile(absolutePath: string): string | null {
  const node = getNode(absolutePath)
  if (!node || node.kind !== 'file') return null
  return node.content
}

export function isDirectory(absolutePath: string): boolean {
  const node = getNode(absolutePath)
  return node !== undefined && node.kind === 'dir'
}

/**
 * Write a file to the virtual FS and persist to localStorage.
 * Creates intermediate directories as needed.
 */
export function writeFile(absolutePath: string, content: string): boolean {
  const parts = absolutePath.split('/').filter(Boolean)
  const fileName = parts.pop()
  if (!fileName) return false

  // Walk/create parent directories
  let current: FsNode = root
  for (const part of parts) {
    if (current.kind !== 'dir') return false
    let child: FsNode | undefined = current.children[part]
    if (!child) {
      const newDir: FsNode = { kind: 'dir', name: part, children: {} }
      current.children[part] = newDir
      child = newDir
    }
    if (child.kind !== 'dir') return false
    current = child
  }

  if (current.kind !== 'dir') return false

  // Don't overwrite a directory
  const existing = current.children[fileName]
  if (existing && existing.kind === 'dir') return false

  current.children[fileName] = { kind: 'file', name: fileName, content }

  // Persist to localStorage
  try {
    localStorage.setItem(VFS_PREFIX + absolutePath, content)
  } catch {
    // localStorage full or unavailable
  }

  return true
}

/** Apply a file to the in-memory tree without persisting to localStorage. */
function applyToTree(absolutePath: string, content: string): void {
  const parts = absolutePath.split('/').filter(Boolean)
  const fileName = parts.pop()
  if (!fileName) return

  let current: FsNode = root
  for (const part of parts) {
    if (current.kind !== 'dir') return
    let child: FsNode | undefined = current.children[part]
    if (!child) {
      const newDir: FsNode = { kind: 'dir', name: part, children: {} }
      current.children[part] = newDir
      child = newDir
    }
    if (child.kind !== 'dir') return
    current = child
  }

  if (current.kind !== 'dir') return
  current.children[fileName] = { kind: 'file', name: fileName, content }
}

/** Restore localStorage-persisted files into the in-memory tree on boot. */
function restoreFromStorage(): void {
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (!key?.startsWith(VFS_PREFIX)) continue
      const path = key.slice(VFS_PREFIX.length)
      const content = localStorage.getItem(key)
      if (content === null) continue
      applyToTree(path, content)
    }
  } catch {
    // localStorage unavailable (SSR, private browsing, etc.)
  }
}

// Restore persisted files when this module first loads
restoreFromStorage()
