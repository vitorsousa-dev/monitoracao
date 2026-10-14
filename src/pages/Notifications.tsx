import { useMemo, useState } from 'react'
import { Mail, MessageSquare, Send, CheckCircle2, AlertTriangle, History, Settings as SettingsIcon, Copy, Loader2 } from 'lucide-react'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { useAlarmAcknowledgments, getChCodeFromAlarm } from '@/lib/alarmAcknowledgmentStorage'
import {
  useNotificationConfig,
  useNotificationHistory,
  sendNotification,
  parseRecipients,
  buildSmsMessage,
  buildEmailBody,
  buildEmailSubject,
} from '@/lib/notificationStorage'
import { westCorpChMetadata, getWestCorpChMeta } from '@/lib/westCorpOperationalData'
import { mockAlarms } from '@/lib/mockData'
import { westCorpAlarms } from '@/lib/westCorpOperationalData'
import { sbaTorresBrasilAlarms } from '@/lib/sbaTorresBrasilOperationalData'
import { wellnesstecAlarms } from '@/lib/wellnesstecOperationalData'
import { useScope } from '@/hooks/useScope'
import { findEquipmentCatalogItem } from '@/lib/equipmentCatalog'
import { Link } from 'react-router-dom'

const SEVERITY_TONE: Record<string, 'danger' | 'warning' | 'info' | 'default'> = {
  Critical: 'danger',
  High: 'danger',
  Medium: 'warning',
  Low: 'info',
}

function fallbackChMeta(chCode: string) {
  return {
    severity: 'Medium' as const,
    category: 'Sem categoria',
    shortTitle: `Alarme ${chCode}`,
    impact: 'Alarme sem mapeamento técnico específico. Verificar manualmente o equipamento e registrar a ocorrência.',
    description:
      'Realizar inspeção visual do equipamento, verificar alarmes no display local, conferir alimentação e comunicação. Registrar a causa raiz e a ação executada.',
  }
}

export function Notifications() {
  const { isAcknowledged } = useAlarmAcknowledgments()
  const { config } = useNotificationConfig()
  const { history, addSent } = useNotificationHistory()
  const { selectedClient, selectedSite } = useScope()

  const [channel, setChannel] = useState<'sms' | 'email'>('email')
  const [recipientInput, setRecipientInput] = useState('')
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [sending, setSending] = useState(false)
  const [resultMsg, setResultMsg] = useState<string | null>(null)

  const allAlarms = useMemo(
    () => [...mockAlarms, ...westCorpAlarms, ...sbaTorresBrasilAlarms, ...wellnesstecAlarms],
    []
  )

  const scopedAlarms = useMemo(() => {
    return allAlarms.filter((alarm) => {
      if (isAcknowledged(alarm.id)) return false
      const equip = findEquipmentCatalogItem(alarm.equipmentId)
      const matchesClient = selectedClient === 'all-clients' || alarm.clientName === selectedClient
      const matchesSite = selectedSite === 'all-sites' || equip?.siteId === selectedSite
      return matchesClient && matchesSite
    })
  }, [allAlarms, selectedClient, selectedSite, isAcknowledged])

  const enrichedAlarms = useMemo(() => {
    return scopedAlarms
      .map((alarm) => {
        const ch = getChCodeFromAlarm(alarm.message, alarm.rawCode, alarm.errorCode) ?? 'CH00'
        const meta = getWestCorpChMeta(ch) ?? westCorpChMetadata[ch] ?? fallbackChMeta(ch)
        return { alarm, ch, meta }
      })
      .sort((a, b) => {
        const sevOrder: Record<string, number> = { Critical: 0, High: 1, Medium: 2, Low: 3 }
        return (sevOrder[a.meta.severity] ?? 9) - (sevOrder[b.meta.severity] ?? 9)
      })
  }, [scopedAlarms])

  const selectedAlarms = useMemo(
    () => enrichedAlarms.filter((e) => selectedIds.has(e.alarm.id)),
    [enrichedAlarms, selectedIds]
  )

  const previewSms = useMemo(
    () =>
      buildSmsMessage(
        selectedAlarms.map((e) => ({
          equipmentName: e.alarm.equipmentName,
          chCode: e.ch,
          shortTitle: e.meta.shortTitle,
          description: e.meta.description,
        })),
        config.senderName
      ),
    [selectedAlarms, config.senderName]
  )

  const previewEmail = useMemo(
    () => ({
      subject: buildEmailSubject(selectedAlarms.length),
      body: buildEmailBody(
        selectedAlarms.map((e) => ({
          equipmentName: e.alarm.equipmentName,
          chCode: e.ch,
          shortTitle: e.meta.shortTitle,
          severity: e.meta.severity,
          impact: e.meta.impact,
          description: e.meta.description,
          clientName: e.alarm.clientName,
          areaName: e.alarm.areaName,
        })),
        config.senderName
      ),
    }),
    [selectedAlarms, config.senderName]
  )

  const recipients = useMemo(() => parseRecipients(recipientInput), [recipientInput])
  const defaultRecipients = useMemo(
    () => (channel === 'email' ? config.defaultEmails : config.defaultPhones),
    [channel, config]
  )

  function toggleAlarm(id: string) {
    setSelectedIds((current) => {
      const next = new Set(current)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function toggleAll() {
    if (selectedIds.size === enrichedAlarms.length) setSelectedIds(new Set())
    else setSelectedIds(new Set(enrichedAlarms.map((e) => e.alarm.id)))
  }

  async function handleSend() {
    if (selectedAlarms.length === 0 || recipients.length === 0) return
    setSending(true)
    setResultMsg(null)

    const body = channel === 'sms' ? previewSms : previewEmail.body
    const subject = channel === 'sms' ? `[${config.senderName}] ${selectedAlarms.length} alarme(s)` : previewEmail.subject

    let successCount = 0
    let failCount = 0
    for (const recipient of recipients) {
      const entry = await sendNotification(config, {
        channel,
        recipient,
        subject,
        body,
        alarmIds: selectedAlarms.map((e) => e.alarm.id),
        equipmentCount: new Set(selectedAlarms.map((e) => e.alarm.equipmentId)).size,
      })
      addSent(entry)
      if (entry.status === 'sent') successCount += 1
      else failCount += 1
    }

    setSending(false)
    if (failCount === 0) {
      setResultMsg(`✔ ${successCount} notificação(ões) enviada(s) com sucesso.`)
    } else {
      setResultMsg(`${successCount} enviada(s) • ${failCount} falha(s). Verifique a configuração da API.`)
    }
  }

  function copyPreview() {
    const text = channel === 'sms' ? previewSms : `${previewEmail.subject}\n\n${previewEmail.body}`
    navigator.clipboard?.writeText(text)
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Notificações</h1>
            <p className="mt-1 text-sm text-muted">
              Alarmes ativos filtrados com descrição técnica pronta para encaminhamento ao cliente.
            </p>
          </div>
          <Link
            to="/settings"
            className="inline-flex items-center gap-2 rounded-lg border border-border bg-surface px-4 py-2 text-sm font-medium text-foreground hover:bg-surface-muted"
          >
            <SettingsIcon className="h-4 w-4" />
            Configurar API
          </Link>
        </div>

        {!config.endpoint && (
          <div className="rounded-xl border border-warning/30 bg-warning-soft p-4">
            <p className="flex items-center gap-2 text-sm font-medium text-warning">
              <AlertTriangle className="h-4 w-4" />
              API de notificações não configurada. Configure o endpoint e a chave em{' '}
              <Link to="/settings" className="underline">Configurações</Link>.
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Lista de alarmes */}
          <div className="lg:col-span-2">
            <Card>
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-base font-semibold text-foreground">Alarmes ativos elegíveis</h2>
                  <p className="text-xs text-muted">
                    {enrichedAlarms.length} alarme(s) · reconhecidos (ruído/falso positivo) são excluídos automaticamente
                  </p>
                </div>
                <button
                  type="button"
                  onClick={toggleAll}
                  className="rounded-lg border border-border bg-surface px-3 py-1.5 text-xs font-medium text-foreground hover:bg-surface-muted"
                >
                  {selectedIds.size === enrichedAlarms.length && enrichedAlarms.length > 0 ? 'Desmarcar todos' : 'Selecionar todos'}
                </button>
              </div>

              {enrichedAlarms.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-center">
                  <CheckCircle2 className="h-8 w-8 text-success" />
                  <p className="mt-2 text-sm font-medium text-foreground">Nenhum alarme ativo</p>
                  <p className="mt-1 text-xs text-muted">Todos os alarmes foram reconhecidos.</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-[600px] overflow-y-auto scrollbar-thin pr-1">
                  {enrichedAlarms.map(({ alarm, ch, meta }) => {
                    const checked = selectedIds.has(alarm.id)
                    return (
                      <label
                        key={alarm.id}
                        className={`flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition-colors ${
                          checked ? 'border-primary/40 bg-primary-soft/40' : 'border-border bg-surface hover:bg-surface-muted'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleAlarm(alarm.id)}
                          className="mt-0.5 h-4 w-4 accent-primary"
                        />
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <Badge tone="primary">{ch}</Badge>
                            <span className="text-sm font-semibold text-foreground">{meta.shortTitle}</span>
                            <Badge tone={SEVERITY_TONE[meta.severity] ?? 'default'}>{meta.severity}</Badge>
                          </div>
                          <p className="mt-1 text-sm text-muted">
                            <strong>{alarm.equipmentName}</strong>
                            {alarm.areaName && ` · ${alarm.areaName}`}
                            {alarm.clientName && ` · ${alarm.clientName}`}
                          </p>
                          <p className="mt-1 text-xs text-foreground">
                            <strong className="text-success">Ação técnica:</strong> {meta.description}
                          </p>
                        </div>
                      </label>
                    )
                  })}
                </div>
              )}
            </Card>
          </div>

          {/* Painel de envio */}
          <div className="space-y-6">
            <Card>
              <h2 className="mb-4 text-base font-semibold text-foreground">Compor notificação</h2>

              <div className="mb-4 flex gap-2">
                <button
                  type="button"
                  onClick={() => setChannel('email')}
                  className={`flex flex-1 items-center justify-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium ${
                    channel === 'email'
                      ? 'border-primary bg-primary-soft text-primary'
                      : 'border-border bg-surface text-muted hover:bg-surface-muted'
                  }`}
                >
                  <Mail className="h-4 w-4" />
                  Email
                </button>
                <button
                  type="button"
                  onClick={() => setChannel('sms')}
                  className={`flex flex-1 items-center justify-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium ${
                    channel === 'sms'
                      ? 'border-primary bg-primary-soft text-primary'
                      : 'border-border bg-surface text-muted hover:bg-surface-muted'
                  }`}
                >
                  <MessageSquare className="h-4 w-4" />
                  SMS
                </button>
              </div>

              <div className="mb-4">
                <label className="mb-1.5 block text-xs font-medium text-muted">
                  Destinatário(s) {channel === 'email' ? '(email)' : '(telefone)'}
                </label>
                <textarea
                  value={recipientInput}
                  onChange={(e) => setRecipientInput(e.target.value)}
                  rows={2}
                  placeholder={
                    channel === 'email'
                      ? 'cliente@empresa.com, outro@empresa.com'
                      : '+5511999999999, +5511888888888'
                  }
                  className="w-full resize-none rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
                {defaultRecipients.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setRecipientInput(defaultRecipients.join(', '))}
                    className="mt-1.5 text-xs text-primary hover:underline"
                  >
                    Usar destinatários padrão ({defaultRecipients.length})
                  </button>
                )}
              </div>

              <div className="mb-4">
                <div className="mb-1.5 flex items-center justify-between">
                  <label className="text-xs font-medium text-muted">Preview da mensagem</label>
                  <button
                    type="button"
                    onClick={copyPreview}
                    className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                  >
                    <Copy className="h-3 w-3" /> Copiar
                  </button>
                </div>
                <div className="max-h-64 overflow-y-auto rounded-lg border border-border bg-surface-muted p-3 text-xs text-foreground scrollbar-thin">
                  {selectedAlarms.length === 0 ? (
                    <p className="text-muted">Selecione pelo menos um alarme para gerar o preview.</p>
                  ) : channel === 'email' ? (
                    <>
                      <p className="mb-2 font-semibold">Assunto: {previewEmail.subject}</p>
                      <pre className="whitespace-pre-wrap font-sans">{previewEmail.body}</pre>
                    </>
                  ) : (
                    <pre className="whitespace-pre-wrap font-sans">{previewSms}</pre>
                  )}
                </div>
              </div>

              {resultMsg && (
                <div
                  className={`mb-4 rounded-lg p-3 text-sm ${
                    resultMsg.includes('falha') ? 'bg-danger-soft text-danger' : 'bg-success-soft text-success'
                  }`}
                >
                  {resultMsg}
                </div>
              )}

              <button
                type="button"
                onClick={handleSend}
                disabled={sending || selectedAlarms.length === 0 || recipients.length === 0}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {sending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Enviando...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4" />
                    Enviar {selectedAlarms.length} alarme(s) para {recipients.length} destinatário(s)
                  </>
                )}
              </button>
            </Card>

            {/* Histórico */}
            <Card>
              <div className="mb-4 flex items-center gap-2">
                <History className="h-4 w-4 text-muted" />
                <h2 className="text-base font-semibold text-foreground">Histórico recente</h2>
              </div>
              {history.length === 0 ? (
                <p className="text-sm text-muted">Nenhuma notificação enviada ainda.</p>
              ) : (
                <div className="space-y-2 max-h-64 overflow-y-auto scrollbar-thin pr-1">
                  {history.slice(0, 8).map((entry) => (
                    <div key={entry.id} className="rounded-lg border border-border bg-surface p-2.5">
                      <div className="flex items-center justify-between gap-2">
                        <Badge tone={entry.status === 'sent' ? 'success' : 'danger'}>
                          {entry.channel.toUpperCase()} · {entry.status === 'sent' ? 'enviado' : 'falha'}
                        </Badge>
                        <span className="text-[10px] text-muted">
                          {new Date(entry.sentAt).toLocaleString('pt-BR')}
                        </span>
                      </div>
                      <p className="mt-1 truncate text-xs text-foreground">{entry.recipient}</p>
                      <p className="mt-0.5 truncate text-xs text-muted">{entry.subject}</p>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
