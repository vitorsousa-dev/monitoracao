import { useState } from 'react'
import {
  Activity,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  Play,
  Settings as SettingsIcon,
  Cpu,
  Database,
  Wifi,
  Server,
} from 'lucide-react'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import {
  useCoolAutomationConfig,
  runCoolAutomationDiagnostic,
  validateConfig,
} from '@/lib/coolautomation'
import type { DiagnosticResult, DiagnosticStep } from '@/lib/coolautomation'

function StepRow({ step }: { step: DiagnosticStep }) {
  const toneMap: Record<DiagnosticStep['status'], 'success' | 'danger' | 'warning' | 'default'> = {
    passed: 'success',
    failed: 'danger',
    skipped: 'warning',
    pending: 'default',
  }
  const iconMap: Record<DiagnosticStep['status'], typeof CheckCircle2> = {
    passed: CheckCircle2,
    failed: XCircle,
    skipped: AlertTriangle,
    pending: Clock,
  }
  const Icon = iconMap[step.status]

  return (
    <div className="flex items-start gap-3 rounded-lg border border-border bg-surface p-3">
      <Icon className={`mt-0.5 h-5 w-5 shrink-0 text-${toneMap[step.status]}`} />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-semibold text-foreground capitalize">{step.name}</span>
          <Badge tone={toneMap[step.status]}>{step.status}</Badge>
          {step.responseTimeMs !== undefined && (
            <span className="text-xs text-muted">{step.responseTimeMs}ms</span>
          )}
          {step.httpStatus !== undefined && (
            <Badge tone="default">HTTP {step.httpStatus}</Badge>
          )}
        </div>
        <p className="mt-1 text-sm text-muted">{step.message}</p>
        {step.details && (
          <pre className="mt-2 overflow-x-auto rounded bg-surface-muted p-2 text-xs text-foreground">
            {JSON.stringify(step.details, null, 2)}
          </pre>
        )}
      </div>
    </div>
  )
}

export function CoolAutomationDiagnostic() {
  const { config, updateConfig } = useCoolAutomationConfig()
  const [result, setResult] = useState<DiagnosticResult | null>(null)
  const [running, setRunning] = useState(false)
  const [unitUid, setUnitUid] = useState('')
  const [showConfig, setShowConfig] = useState(false)

  const { valid, missing } = validateConfig(config)

  async function handleRun() {
    setRunning(true)
    setResult(null)
    try {
      const diagnostic = await runCoolAutomationDiagnostic(config, {
        unitUid: unitUid.trim() || undefined,
      })
      setResult(diagnostic)
    } finally {
      setRunning(false)
    }
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Diagnóstico CoolAutomation
            </h1>
            <p className="mt-1 text-sm text-muted">
              Teste de conectividade e validação da integração com a API REST dos dispositivos.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowConfig((v) => !v)}
            className="inline-flex items-center gap-2 rounded-lg border border-border bg-surface px-4 py-2 text-sm font-medium text-foreground hover:bg-surface-muted"
          >
            <SettingsIcon className="h-4 w-4" />
            Configuração
          </button>
        </div>

        {showConfig && (
          <Card>
            <h2 className="mb-4 text-base font-semibold text-foreground">Configuração da API</h2>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="md:col-span-2">
                <label className="mb-1.5 block text-xs font-medium text-muted">Base URL</label>
                <input
                  type="url"
                  value={config.baseUrl}
                  onChange={(e) => updateConfig({ baseUrl: e.target.value })}
                  placeholder="http://192.168.1.100:10103"
                  className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-muted">Número de série do dispositivo</label>
                <input
                  type="text"
                  value={config.deviceSerialNumber}
                  onChange={(e) => updateConfig({ deviceSerialNumber: e.target.value })}
                  placeholder="CM-XXXXXX"
                  className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-muted">Versão da API</label>
                <select
                  value={config.apiVersion}
                  onChange={(e) => updateConfig({ apiVersion: e.target.value as 'v1.0' | 'v2.0' })}
                  className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                >
                  <option value="v2.0">v2.0 (ls2)</option>
                  <option value="v1.0">v1.0 (raw ASCII_IF)</option>
                </select>
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-muted">Timeout (ms)</label>
                <input
                  type="number"
                  value={config.timeoutMs}
                  onChange={(e) => updateConfig({ timeoutMs: Number(e.target.value) })}
                  className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
              </div>
              <div className="flex items-end">
                <label className="flex items-center gap-2 text-sm text-foreground">
                  <input
                    type="checkbox"
                    checked={config.enabled}
                    onChange={(e) => updateConfig({ enabled: e.target.checked })}
                    className="h-4 w-4 accent-primary"
                  />
                  Habilitar integração
                </label>
              </div>
            </div>
            <div className="mt-4">
              <label className="mb-1.5 block text-xs font-medium text-muted">
                UID da unidade para teste individual (opcional)
              </label>
              <input
                type="text"
                value={unitUid}
                onChange={(e) => setUnitUid(e.target.value)}
                placeholder="1.1"
                className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </div>
          </Card>
        )}

        <div className="flex items-center justify-between rounded-xl border border-border bg-surface p-4">
          <div className="flex items-center gap-3">
            <Activity className="h-5 w-5 text-primary" />
            <div>
              <p className="text-sm font-medium text-foreground">
                {valid ? 'Configuração presente' : 'Configuração incompleta'}
              </p>
              <p className="text-xs text-muted">
                {valid
                  ? `Dispositivo: ${config.deviceSerialNumber} · ${config.apiVersion}`
                  : `Campos ausentes: ${missing.join(', ')}`}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleRun}
            disabled={running || !valid}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {running ? <Clock className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
            {running ? 'Executando...' : 'Executar diagnóstico'}
          </button>
        </div>

        {result && (
          <>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              <Card>
                <div className="flex items-center gap-2 text-muted">
                  <Cpu className="h-4 w-4" />
                  <span className="text-xs">Unidades</span>
                </div>
                <p className="mt-2 text-2xl font-bold tabular-nums text-foreground">{result.unitsFound}</p>
              </Card>
              <Card>
                <div className="flex items-center gap-2 text-muted">
                  <Wifi className="h-4 w-4" />
                  <span className="text-xs">Origem</span>
                </div>
                <p className="mt-2 text-sm font-semibold text-foreground">
                  {result.source === 'local-device' ? 'Dispositivo local' : result.source === 'cloud-api' ? 'API em nuvem' : 'Desconhecida'}
                </p>
              </Card>
              <Card>
                <div className="flex items-center gap-2 text-muted">
                  <Database className="h-4 w-4" />
                  <span className="text-xs">Campos retornados</span>
                </div>
                <p className="mt-2 text-2xl font-bold tabular-nums text-foreground">{result.fieldsReturned.length}</p>
              </Card>
              <Card>
                <div className="flex items-center gap-2 text-muted">
                  <Clock className="h-4 w-4" />
                  <span className="text-xs">Último teste</span>
                </div>
                <p className="mt-2 text-xs font-medium text-foreground">
                  {result.lastTestAt ? new Date(result.lastTestAt).toLocaleString('pt-BR') : '—'}
                </p>
              </Card>
            </div>

            <Card>
              <h2 className="mb-4 text-base font-semibold text-foreground">Resultados dos testes</h2>
              <div className="space-y-3">
                <StepRow step={result.configStatus} />
                <StepRow step={result.connectivityStatus} />
                <StepRow step={result.ls2QueryStatus} />
                <StepRow step={result.unitQueryStatus} />
              </div>
            </Card>

            {result.fieldsReturned.length > 0 && (
              <Card>
                <h2 className="mb-3 text-base font-semibold text-foreground">Campos de dados retornados</h2>
                <div className="flex flex-wrap gap-2">
                  {result.fieldsReturned.map((field) => (
                    <Badge key={field} tone="default">{field}</Badge>
                  ))}
                </div>
              </Card>
            )}

            {result.testedResources.length > 0 && (
              <Card>
                <h2 className="mb-3 text-base font-semibold text-foreground">Recursos testados</h2>
                <div className="flex flex-wrap gap-2">
                  {result.testedResources.map((resource) => (
                    <Badge key={resource} tone="primary">{resource}</Badge>
                  ))}
                </div>
              </Card>
            )}

            {result.alarmHistoryNote && (
              <Card>
                <div className="flex items-start gap-3">
                  <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-warning" />
                  <div>
                    <h2 className="text-base font-semibold text-foreground">Histórico de alarmes</h2>
                    <p className="mt-1 text-sm text-muted">{result.alarmHistoryNote}</p>
                  </div>
                </div>
              </Card>
            )}
          </>
        )}

        {!result && !running && (
          <Card>
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Server className="h-10 w-10 text-muted" />
              <p className="mt-3 text-sm font-medium text-foreground">Nenhum diagnóstico executado</p>
              <p className="mt-1 text-xs text-muted">
                Clique em "Executar diagnóstico" para testar a conectividade com o dispositivo.
              </p>
            </div>
          </Card>
        )}
      </div>
    </DashboardLayout>
  )
}
