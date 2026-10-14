import { useEffect, useState, useCallback } from 'react'

export const NOTIFICATIONS_UPDATED_EVENT = 'ems-notifications-updated'

const CONFIG_STORAGE_KEY = 'ems-notification-config-v1'
const HISTORY_STORAGE_KEY = 'ems-notification-history-v1'

export interface NotificationApiConfig {
  endpoint: string
  apiKey: string
  defaultEmails: string[]
  defaultPhones: string[]
  senderName: string
}

export interface SentNotification {
  id: string
  sentAt: string
  channel: 'sms' | 'email'
  recipient: string
  subject: string
  body: string
  alarmIds: string[]
  equipmentCount: number
  status: 'sent' | 'failed' | 'pending'
  error?: string
}

const DEFAULT_CONFIG: NotificationApiConfig = {
  endpoint: '',
  apiKey: '',
  defaultEmails: [],
  defaultPhones: [],
  senderName: 'MeuDashboard',
}

function loadConfig(): NotificationApiConfig {
  if (typeof window === 'undefined') return DEFAULT_CONFIG
  const raw = window.localStorage.getItem(CONFIG_STORAGE_KEY)
  if (!raw) return DEFAULT_CONFIG
  try {
    return { ...DEFAULT_CONFIG, ...JSON.parse(raw) }
  } catch {
    return DEFAULT_CONFIG
  }
}

function saveConfig(config: NotificationApiConfig) {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(CONFIG_STORAGE_KEY, JSON.stringify(config))
  window.dispatchEvent(new CustomEvent(NOTIFICATIONS_UPDATED_EVENT, { detail: config }))
}

function loadHistory(): SentNotification[] {
  if (typeof window === 'undefined') return []
  const raw = window.localStorage.getItem(HISTORY_STORAGE_KEY)
  if (!raw) return []
  try {
    return JSON.parse(raw) as SentNotification[]
  } catch {
    return []
  }
}

function saveHistory(history: SentNotification[]) {
  if (typeof window === 'undefined') return
  const trimmed = history.slice(0, 200)
  window.localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(trimmed))
  window.dispatchEvent(new CustomEvent(NOTIFICATIONS_UPDATED_EVENT, { detail: trimmed }))
}

export function useNotificationConfig() {
  const [config, setConfig] = useState<NotificationApiConfig>(() => loadConfig())

  useEffect(() => {
    const handler = () => setConfig(loadConfig())
    window.addEventListener(NOTIFICATIONS_UPDATED_EVENT, handler)
    return () => window.removeEventListener(NOTIFICATIONS_UPDATED_EVENT, handler)
  }, [])

  const updateConfig = useCallback((next: Partial<NotificationApiConfig>) => {
    setConfig((current) => {
      const merged = { ...current, ...next }
      saveConfig(merged)
      return merged
    })
  }, [])

  return { config, updateConfig }
}

export function useNotificationHistory() {
  const [history, setHistory] = useState<SentNotification[]>(() => loadHistory())

  useEffect(() => {
    const handler = () => setHistory(loadHistory())
    window.addEventListener(NOTIFICATIONS_UPDATED_EVENT, handler)
    return () => window.removeEventListener(NOTIFICATIONS_UPDATED_EVENT, handler)
  }, [])

  const addSent = useCallback((entry: SentNotification) => {
    setHistory((current) => {
      const next = [entry, ...current]
      saveHistory(next)
      return next
    })
  }, [])

  const clearHistory = useCallback(() => {
    saveHistory([])
    setHistory([])
  }, [])

  return { history, addSent, clearHistory }
}

export function parseRecipients(input: string): string[] {
  return input
    .split(/[,\n;]/)
    .map((s) => s.trim())
    .filter(Boolean)
}

export function buildSmsMessage(
  alarms: Array<{ equipmentName: string; chCode: string; shortTitle: string; description: string }>,
  senderName: string
): string {
  const header = `[${senderName}] ${alarms.length} alarme(s) requerem atencao:\n`
  const body = alarms
    .slice(0, 8)
    .map((a, i) => `${i + 1}. ${a.chCode} ${a.equipmentName} - ${a.shortTitle}. Acao: ${a.description.slice(0, 90)}`)
    .join('\n')
  const tail = alarms.length > 8 ? `\n+${alarms.length - 8} ocorrencia(s) adicional(is).` : ''
  return (header + body + tail).slice(0, 1500)
}

export function buildEmailBody(
  alarms: Array<{
    equipmentName: string
    chCode: string
    shortTitle: string
    severity: string
    impact: string
    description: string
    clientName?: string
    areaName?: string
  }>,
  senderName: string
): string {
  const header = `Olá,\n\nA plataforma ${senderName} identificou ${alarms.length} alarme(s) ativo(s) que requerem acompanhamento técnico.\n`
  const sections = alarms
    .map(
      (a, i) =>
        `${i + 1}. ${a.chCode} — ${a.shortTitle} (severidade: ${a.severity})\n` +
        `   Equipamento: ${a.equipmentName}${a.areaName ? ` / ${a.areaName}` : ''}${a.clientName ? ` / ${a.clientName}` : ''}\n` +
        `   Impacto: ${a.impact}\n` +
        `   Ação técnica recomendada: ${a.description}\n`
    )
    .join('\n')
  const footer = `\nRecomenda-se confirmar a execução da ação e registrar a resolução na plataforma.\n\n--\n${senderName} · Monitoramento Operacional`
  return header + '\n' + sections + footer
}

export function buildEmailSubject(alarmsCount: number): string {
  return `${alarmsCount} alarme(s) ativo(s) requerem atenção técnica`
}

export async function sendNotification(
  config: NotificationApiConfig,
  params: {
    channel: 'sms' | 'email'
    recipient: string
    subject: string
    body: string
    alarmIds: string[]
    equipmentCount: number
  }
): Promise<SentNotification> {
  const entry: SentNotification = {
    id: `notif-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    sentAt: new Date().toISOString(),
    channel: params.channel,
    recipient: params.recipient,
    subject: params.subject,
    body: params.body,
    alarmIds: params.alarmIds,
    equipmentCount: params.equipmentCount,
    status: 'pending',
  }

  if (!config.endpoint || !config.apiKey) {
    entry.status = 'failed'
    entry.error = 'Endpoint ou chave de API não configurados nas Configurações.'
    return entry
  }

  try {
    const response = await fetch(config.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${config.apiKey}`,
      },
      body: JSON.stringify({
        channel: params.channel,
        to: params.recipient,
        subject: params.subject,
        message: params.body,
        alarmIds: params.alarmIds,
        senderName: config.senderName,
      }),
    })

    if (!response.ok) {
      entry.status = 'failed'
      entry.error = `API retornou status ${response.status}.`
    } else {
      entry.status = 'sent'
    }
  } catch (err) {
    entry.status = 'failed'
    entry.error = err instanceof Error ? err.message : 'Erro de conexão com a API.'
  }

  return entry
}
