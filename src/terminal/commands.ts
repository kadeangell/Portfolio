import type { CommandHandler, TerminalWriter } from './types'

const commands = new Map<string, CommandHandler>()

commands.set('help', (_args, writer) => {
  writer.write('\r\nAvailable commands:\r\n')
  writer.write('  help     Show this message\r\n')
  writer.write('  clear    Clear the screen\r\n')
  writer.write('  echo     Print arguments\r\n')
  writer.write('  whoami   Display current user\r\n')
  writer.write('  date     Display current date\r\n')
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

export function getCommand(name: string): CommandHandler | undefined {
  return commands.get(name)
}

export function registerCommand(name: string, handler: CommandHandler): void {
  commands.set(name, handler)
}
