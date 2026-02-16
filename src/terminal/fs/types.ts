export type FsNode = FsFile | FsDirectory

export interface FsFile {
  kind: 'file'
  name: string
  content: string
}

export interface FsDirectory {
  kind: 'dir'
  name: string
  children: Record<string, FsNode>
}
