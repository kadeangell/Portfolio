import type { CommandHandler, TerminalWriter } from './types'

const commands = new Map<string, CommandHandler>()

commands.set('help', (_args, writer) => {
  writer.write('\r\nAvailable commands:\r\n')
  writer.write('  help     Show this message\r\n')
  writer.write('  clear    Clear the screen\r\n')
  writer.write('  echo     Print arguments\r\n')
  writer.write('  whoami   Display current user\r\n')
  writer.write('  date     Display current date\r\n')
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
