import { createCoolAutomationError } from './errors'
import type { CoolAutomationConfig } from './types'

const ALLOWED_READ_COMMANDS = new Set([
  'ls',
  'ls2',
  'stat',
  'temp',
  'ver',
  'ver2',
  'id',
  'help',
])

const WRITE_COMMAND_PREFIXES = [
  'on',
  'off',
  'set',
  'reset',
  'mode',
  'fspeed',
  'temp',
  'stemp',
  'fan',
  'swing',
  'filter',
]

export function isReadCommand(command: string): boolean {
  const normalized = command.trim().toLowerCase()
  if (!normalized) return false
  if (ALLOWED_READ_COMMANDS.has(normalized)) return true
  for (const prefix of WRITE_COMMAND_PREFIXES) {
    if (normalized.startsWith(prefix) && !normalized.startsWith('stat')) {
      return false
    }
  }
  return true
}

export function validateWriteCommand(command: string): void {
  if (!isReadCommand(command)) {
    throw createCoolAutomationError(
      'WRITE_COMMAND_BLOCKED',
      `Comando de escrita bloqueado por segurança: "${command}". Apenas comandos de leitura são permitidos.`
    )
  }
}

export function validateUrl(url: string): void {
  try {
    const parsed = new URL(url)
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      throw createCoolAutomationError('INVALID_URL', `Protocolo não permitido: ${parsed.protocol}`)
    }
  } catch (err) {
    if (err instanceof Error && err.name === 'CoolAutomationError') throw err
    throw createCoolAutomationError('INVALID_URL', `URL inválida: ${url}`)
  }
}

export function validateConfig(config: Partial<CoolAutomationConfig>): { valid: boolean; missing: string[] } {
  const missing: string[] = []
  if (!config.baseUrl) missing.push('baseUrl')
  if (!config.deviceSerialNumber) missing.push('deviceSerialNumber')
  if (!config.apiVersion) missing.push('apiVersion')
  if (!config.timeoutMs) missing.push('timeoutMs')
  return { valid: missing.length === 0, missing }
}

export function sanitizeForLog(url: string): string {
  try {
    const parsed = new URL(url)
    if (parsed.password || parsed.username) {
      parsed.username = ''
      parsed.password = ''
    }
    return parsed.toString()
  } catch {
    return '[url-invalida]'
  }
}
