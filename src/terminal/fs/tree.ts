import type { FsFile, FsDirectory, FsNode } from './types'

function file(name: string, content: string): FsFile {
  return { kind: 'file', name, content }
}

function dir(name: string, children: FsNode[]): FsDirectory {
  const record: Record<string, FsNode> = {}
  for (const child of children) {
    record[child.name] = child
  }
  return { kind: 'dir', name, children: record }
}

export const root: FsDirectory = dir('/', [
  file('about.txt', 'Hello! I\'m Kade Angell.\nWelcome to my portfolio.\n'),
  file('resume.txt', 'Resume placeholder — content coming soon.\n'),
  dir('projects', [
    file('portfolio.txt', 'portfolio — this terminal-based portfolio site.\nBuilt with React, TypeScript, and ghostty-web.\n'),
    file('zaymo.txt', 'zaymo — placeholder project description.\n'),
  ]),
  dir('links', [
    file('github.txt', 'https://github.com/kadeangell\n'),
    file('linkedin.txt', 'https://linkedin.com/in/kadeangell\n'),
  ]),
])
