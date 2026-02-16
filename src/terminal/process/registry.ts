import type { WasmProcess, WasmProcessConfig } from './types'

export type ProcessFactory = (config: WasmProcessConfig) => WasmProcess

const registry = new Map<string, ProcessFactory>()

export function registerProcess(name: string, factory: ProcessFactory): void {
  registry.set(name, factory)
}

export function getProcess(name: string): ProcessFactory | undefined {
  return registry.get(name)
}

export function getProcessNames(): string[] {
  return [...registry.keys()]
}
