import type { CommandHandler, TerminalWriter } from './types'
import { resolvePath, getNode, listDir, readFile, isDirectory } from './fs'

const commands = new Map<string, CommandHandler>()

commands.set('help', (_args, writer) => {
  writer.write('\r\nAvailable commands:\r\n')
  writer.write('  help     Show this message\r\n')
  writer.write('  clear    Clear the screen\r\n')
  writer.write('  echo     Print arguments\r\n')
  writer.write('  whoami   Display current user\r\n')
  writer.write('  date     Display current date\r\n')
  writer.write('  pwd      Print working directory\r\n')
  writer.write('  ls       List directory contents\r\n')
  writer.write('  cd       Change directory\r\n')
  writer.write('  cat      Print file contents\r\n')
  writer.write('  rainbow  Test color output\r\n')
})

commands.set('clear', (_args, writer) => {
  writer.write('\x1b[2J\x1b[H')
})

commands.set('echo', (args, writer) => {
  writer.write('\r\n' + args.join(' '))
})

commands.set('whoami', (_args, writer) => {
  writer.write('\r\nguest')
})

commands.set('date', (_args, writer) => {
  writer.write('\r\n' + new Date().toString())
})

commands.set('pwd', (_args, writer, ctx) => {
  writer.write('\r\n' + ctx.cwd)
})

commands.set('ls', (args, writer, ctx) => {
  const target = args[0] ? resolvePath(ctx.cwd, args[0]) : ctx.cwd
  const entries = listDir(target)
  if (!entries) {
    writer.write(`\r\nls: ${args[0] || target}: No such directory`)
    return
  }

  const node = getNode(target)
  if (!node || node.kind !== 'dir') return

  const parts: string[] = []
  for (const name of entries) {
    const child = node.children[name]
    if (child.kind === 'dir') {
      // Bold blue for directories, with trailing /
      parts.push(`\x1b[1;34m${name}/\x1b[0m`)
    } else {
      parts.push(name)
    }
  }
  writer.write('\r\n' + parts.join('  '))
})

commands.set('cd', (args, _writer, ctx) => {
  const target = args[0]
  if (!target || target === '~') {
    ctx.setCwd('/')
    return
  }

  const resolved = resolvePath(ctx.cwd, target)
  if (!isDirectory(resolved)) {
    _writer.write(`\r\ncd: ${target}: No such directory`)
    return
  }
  ctx.setCwd(resolved)
})

commands.set('cat', (args, writer, ctx) => {
  if (!args[0]) {
    writer.write('\r\ncat: missing file operand')
    return
  }

  const resolved = resolvePath(ctx.cwd, args[0])
  const node = getNode(resolved)

  if (!node) {
    writer.write(`\r\ncat: ${args[0]}: No such file or directory`)
    return
  }
  if (node.kind === 'dir') {
    writer.write(`\r\ncat: ${args[0]}: Is a directory`)
    return
  }

  const content = readFile(resolved)
  if (content !== null) {
    // Replace \n with \r\n for terminal display
    writer.write('\r\n' + content.replace(/\n/g, '\r\n'))
  }
})

commands.set('rainbow', (_args, writer) => {
  const ESC = '\x1b'
  const RESET = `${ESC}[0m`
  const colors = [
    { code: '31', name: 'red' },
    { code: '33', name: 'yellow' },
    { code: '32', name: 'green' },
    { code: '36', name: 'cyan' },
    { code: '34', name: 'blue' },
    { code: '35', name: 'magenta' },
  ]

  writer.write('\r\n')
  // Color blocks
  for (const c of colors) {
    writer.write(`${ESC}[${c.code}m${'█'.repeat(8)}${RESET}`)
  }
  writer.write('\r\n')
  // Color labels
  for (const c of colors) {
    writer.write(`${ESC}[${c.code}m${c.name.padEnd(8)}${RESET}`)
  }
  writer.write('\r\n')
  // Bright variants
  for (const c of colors) {
    writer.write(`${ESC}[${c.code};1m${'█'.repeat(8)}${RESET}`)
  }
  writer.write('\r\n')
  // 256-color gradient
  writer.write('\r\n  256-color gradient:\r\n  ')
  for (let i = 196; i <= 201; i++) {
    writer.write(`${ESC}[38;5;${i}m${'██'}${RESET}`)
  }
  for (let i = 207; i >= 202; i--) {
    writer.write(`${ESC}[38;5;${i}m${'██'}${RESET}`)
  }
  writer.write('\r\n  ')
  // RGB gradient (true color)
  writer.write('\r\n  RGB true color:\r\n  ')
  for (let i = 0; i < 48; i++) {
    const hue = (i / 48) * 360
    const [r, g, b] = hslToRgb(hue, 100, 50)
    writer.write(`${ESC}[38;2;${r};${g};${b}m█${RESET}`)
  }
  writer.write('\r\n')
})

function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  s /= 100
  l /= 100
  const k = (n: number) => (n + h / 30) % 12
  const a = s * Math.min(l, 1 - l)
  const f = (n: number) => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)))
  return [Math.round(f(0) * 255), Math.round(f(8) * 255), Math.round(f(4) * 255)]
}

export function getCommand(name: string): CommandHandler | undefined {
  return commands.get(name)
}

export function registerCommand(name: string, handler: CommandHandler): void {
  commands.set(name, handler)
}

export function getCommandNames(): string[] {
  return [...commands.keys()]
}
