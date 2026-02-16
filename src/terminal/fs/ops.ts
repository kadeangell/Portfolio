import { root } from './tree'
import type { FsNode } from './types'

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
