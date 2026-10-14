import { useEffect, useState, useCallback } from 'react'
import type { CoolAutomationConfig } from './types'

const STORAGE_KEY = 'ems-coolautomation-config-v1'
export const COOLAUTOMATION_UPDATED_EVENT = 'ems-coolautomation-updated'

const DEFAULT_CONFIG: CoolAutomationConfig = {
  baseUrl: '',
  deviceSerialNumber: '',
  apiVersion: 'v2.0',
  timeoutMs: 10000,
  enabled: false,
}

function loadConfig(): CoolAutomationConfig {
  if (typeof window === 'undefined') return DEFAULT_CONFIG
  const raw = window.localStorage.getItem(STORAGE_KEY)
  if (!raw) return DEFAULT_CONFIG
  try {
    return { ...DEFAULT_CONFIG, ...JSON.parse(raw) }
  } catch {
    return DEFAULT_CONFIG
  }
}

function saveConfig(config: CoolAutomationConfig) {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(config))
  window.dispatchEvent(new CustomEvent(COOLAUTOMATION_UPDATED_EVENT, { detail: config }))
}

export function useCoolAutomationConfig() {
  const [config, setConfig] = useState<CoolAutomationConfig>(() => loadConfig())

  useEffect(() => {
    const handler = () => setConfig(loadConfig())
    window.addEventListener(COOLAUTOMATION_UPDATED_EVENT, handler)
    return () => window.removeEventListener(COOLAUTOMATION_UPDATED_EVENT, handler)
  }, [])

  const updateConfig = useCallback((next: Partial<CoolAutomationConfig>) => {
    setConfig((current) => {
      const merged = { ...current, ...next }
      saveConfig(merged)
      return merged
    })
  }, [])

  return { config, updateConfig }
}
