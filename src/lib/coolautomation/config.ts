import type { CoolAutomationConfig } from './types'

const DEFAULT_TIMEOUT = 10000

type EnvSource = Record<string, string | undefined>

function getEnvSource(): EnvSource {
  const meta = (import.meta as unknown as { env?: EnvSource }).env
  if (meta) return meta
  if (typeof process !== 'undefined' && process.env) return process.env as EnvSource
  return {}
}

function getEnv(name: string, fallback = ''): string {
  const source = getEnvSource()
  return source[name] ?? fallback
}

export function loadCoolAutomationConfig(): CoolAutomationConfig {
  return {
    baseUrl: getEnv('VITE_COOLAUTOMATION_BASE_URL'),
    deviceSerialNumber: getEnv('VITE_COOLAUTOMATION_DEVICE_SN'),
    apiVersion: (getEnv('VITE_COOLAUTOMATION_API_VERSION', 'v2.0') as 'v1.0' | 'v2.0') ?? 'v2.0',
    timeoutMs: Number(getEnv('VITE_COOLAUTOMATION_TIMEOUT', String(DEFAULT_TIMEOUT))) || DEFAULT_TIMEOUT,
    enabled: getEnv('VITE_COOLAUTOMATION_ENABLED', 'false') === 'true',
  }
}

export { DEFAULT_TIMEOUT }
