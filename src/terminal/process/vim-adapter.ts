import type { WasmProcess, WasmProcessConfig } from './types'
import { writeFile, resolvePath } from '~/terminal/fs'

export class VimWasmProcess implements WasmProcess {
  private config: WasmProcessConfig
  private vim: any = null
  private canvas: HTMLCanvasElement | null = null
  private input: HTMLInputElement | null = null
  private exitCallbacks: ((code: number) => void)[] = []
  private outputCallbacks: ((data: string) => void)[] = []
  /** Maps vim internal paths → virtual FS absolute paths */
  private vimPathToVfsPath = new Map<string, string>()

  constructor(config: WasmProcessConfig) {
    this.config = config
  }

  async start(): Promise<void> {
    const { VimWasm } = await import('vim-wasm')

    // Create canvas sized to fill the container
    this.canvas = document.createElement('canvas')
    this.canvas.style.width = '100%'
    this.canvas.style.height = '100%'
    this.canvas.style.display = 'block'
    this.canvas.style.background = '#000000'
    this.config.container.appendChild(this.canvas)

    // Create hidden input for vim's keyboard capture
    this.input = document.createElement('input')
    this.input.style.position = 'absolute'
    this.input.style.left = '-9999px'
    this.input.style.top = '0'
    this.input.style.width = '1px'
    this.input.style.height = '1px'
    this.input.style.opacity = '0'
    this.config.container.appendChild(this.input)

    this.vim = new VimWasm({
      canvas: this.canvas,
      input: this.input,
      workerScriptPath: '/vim-wasm/vim.js',
    })

    // Match terminal appearance once vim is ready
    this.vim.onVimInit = () => {
      // Font: match the terminal's monospace / 14px
      this.vim.cmdline('set guifont=monospace:h14')
      // Colors: match terminal bg=#000000 fg=#cccccc
      this.vim.cmdline('highlight Normal guibg=#000000 guifg=#cccccc')
      this.vim.cmdline('highlight NonText guibg=#000000 guifg=#555555')
      this.vim.cmdline('highlight StatusLine guibg=#333333 guifg=#cccccc gui=NONE')
      this.vim.cmdline('highlight StatusLineNC guibg=#1a1a1a guifg=#666666 gui=NONE')
      this.vim.cmdline('highlight LineNr guibg=#000000 guifg=#555555')
      this.vim.cmdline('highlight CursorLine guibg=#111111')
      this.vim.cmdline('highlight Visual guibg=#264f78')
      this.vim.cmdline('highlight Pmenu guibg=#1a1a1a guifg=#cccccc')
      this.vim.cmdline('highlight PmenuSel guibg=#264f78 guifg=#cccccc')
      this.vim.cmdline('highlight VertSplit guibg=#000000 guifg=#333333')
    }

    this.vim.onVimExit = (_status: number) => {
      this.cleanup()
      for (const cb of this.exitCallbacks) cb(0)
    }

    this.vim.onError = (err: Error) => {
      console.error('vim.wasm error:', err)
      this.cleanup()
      for (const cb of this.exitCallbacks) cb(1)
    }

    // Write exported files back to the virtual FS + localStorage
    this.vim.onFileExport = (fullpath: string, contents: ArrayBuffer) => {
      const text = new TextDecoder().decode(new Uint8Array(contents))

      // Check if this vim path maps to a known VFS file
      const vfsPath = this.vimPathToVfsPath.get(fullpath)
      if (vfsPath) {
        writeFile(vfsPath, text)
      } else {
        // New file — derive VFS path from filename + cwd
        const name = fullpath.split('/').pop()
        if (name) {
          writeFile(resolvePath(this.config.cwd, name), text)
        }
      }
    }

    // Build file map from virtual FS content passed via env
    const files: Record<string, string> = {}
    const cmdArgs: string[] = []

    if (this.config.args.length > 0) {
      const filename = this.config.args[0]
      const content = this.config.env['__FILE_CONTENT__'] ?? ''
      const vfsPath = this.config.env['__VFS_PATH__'] ?? ''
      const vimPath = `/tmp/${filename}`
      files[vimPath] = content
      cmdArgs.push(vimPath)

      if (vfsPath) {
        this.vimPathToVfsPath.set(vimPath, vfsPath)
      }
    }

    // Autocmd: trigger :export after every :w so onFileExport fires
    cmdArgs.push('-c', 'autocmd BufWritePost * silent! export')

    this.vim.start({
      files: Object.keys(files).length > 0 ? files : undefined,
      cmdArgs,
    })

    this.input.focus()
  }

  private cleanup(): void {
    if (this.canvas) {
      this.canvas.remove()
      this.canvas = null
    }
    if (this.input) {
      this.input.remove()
      this.input = null
    }
    this.vim = null
  }

  write(_data: string): void {
    // vim-wasm handles its own input via the input element
  }

  resize(_cols: number, _rows: number): void {
    if (this.canvas && this.vim) {
      const rect = this.config.container.getBoundingClientRect()
      if (rect.width > 0 && rect.height > 0) {
        this.vim.resize(rect.width, rect.height)
      }
    }
  }

  terminate(): void {
    if (this.vim) {
      try {
        this.vim.cmdline('qa!')
      } catch {
        this.cleanup()
        for (const cb of this.exitCallbacks) cb(1)
      }
    }
  }

  onOutput(cb: (data: string) => void): void {
    this.outputCallbacks.push(cb)
  }

  onExit(cb: (code: number) => void): void {
    this.exitCallbacks.push(cb)
  }
}
