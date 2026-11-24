import { root } from './tree'
import type { FsNode } from './types'

// Files live in R2 behind /api/fs/<user>. Everyone is the guest user until
// there is auth. Reads are served from the in-memory tree (loaded once at boot);
// writes go through to the bucket.
export const CURRENT_USER = 'guest@kadeangell.com'
const API = `/api/fs/${encodeURIComponent(CURRENT_USER)}`

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
 * Write a file to the virtual FS and persist it to the user's R2 bucket.
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

  // Persist (fire and forget; the in-memory tree stays the source of truth
  // for this session if the API is unreachable, e.g. on the dev server)
  void fetch(`${API}${absolutePath.split('/').map(encodeURIComponent).join('/')}`, {
    method: 'PUT',
    body: content,
  }).catch(() => {})

  return true
}

/** Apply a file to the in-memory tree without persisting. */
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

/** Load the user's files from R2 into the in-memory tree. */
async function restoreFromBucket(): Promise<void> {
  try {
    const res = await fetch(API)
    if (!res.ok) return
    const { files } = (await res.json()) as { files: Record<string, string> }
    for (const [path, content] of Object.entries(files)) applyToTree(path, content)
  } catch {
    // API unreachable (dev server, offline): run with the default tree
  }
}

/** Resolves once the user's files have been loaded. Await before the first prompt. */
export const fsReady: Promise<void> =
  typeof window === 'undefined' ? Promise.resolve() : restoreFromBucket()
