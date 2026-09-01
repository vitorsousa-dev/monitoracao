import { useMemo, useState } from 'react'
import {
  useAlarmAcknowledgments,
  useEffectiveAlarmHealthImpact,
  getHealthStatusText,
  type AcknowledgmentDecision,
} from '@/lib/alarmAcknowledgmentStorage'
import { useAuth } from '@/hooks/useAuth'
import { CheckCircle2, Undo2, Tag, X, ShieldCheck, TrendingUp, AlertTriangle, Activity } from 'lucide-react'
import type { Alarm } from '@/types'

const DECISION_OPTIONS: { value: AcknowledgmentDecision; label: string; description: string; defaultDeduction: number }[] = [
  { value: 'false_positive', label: 'Falso positivo', description: 'Este alarme nao representa falha real', defaultDeduction: 100 },
  { value: 'communication_noise', label: 'Ruido de comunicacao', description: 'Ex.: CH53 / interferencia / timeout pontual', defaultDeduction: 90 },
  { value: 'expected_operation', label: 'Operacao normal', description: 'Comportamento esperado / ciclo normal do equipamento', defaultDeduction: 70 },
  { value: 'site_acceptance', label: 'Aceite da operacao', description: 'Equipe de campo validou, nao requer acao', defaultDeduction: 60 },
  { value: 'other', label: 'Outro / analisado', description: 'Marcado manualmente por decisao operacional', defaultDeduction: 50 },
]

interface AcknowledgeAlarmActionProps {
  alarm: Pick<Alarm, 'id' | 'message' | 'rawCode' | 'errorCode'> & Partial<Pick<Alarm, 'type'>>
  compact?: boolean
  onChange?: () => void
}

export function AcknowledgeAlarmAction({ alarm, compact, onChange }: AcknowledgeAlarmActionProps) {
  const { user } = useAuth()
  const { isAcknowledged, getAck, acknowledge, unacknowledge } = useAlarmAcknowledgments()
  const [open, setOpen] = useState(false)
  const [decision, setDecision] = useState<AcknowledgmentDecision>('communication_noise')
  const [deductionPct, setDeductionPct] = useState(90)
  const [notes, setNotes] = useState('')

  const acked = isAcknowledged(alarm.id)
  const ackInfo = getAck(alarm.id)

  function openAck() {
    const currentCh = (alarm.errorCode ?? alarm.rawCode ?? alarm.message.match(/\bCH\d{2,3}\b/)?.[0] ?? '')
    const initialDecision: AcknowledgmentDecision =
      currentCh === 'CH53' ? 'communication_noise' : 'other'
    const defaultOption = DECISION_OPTIONS.find((o) => o.value === initialDecision) ?? DECISION_OPTIONS[DECISION_OPTIONS.length - 1]
    setDecision(initialDecision)
    setDeductionPct(defaultOption.defaultDeduction)
    setNotes('')
    setOpen(true)
  }

  function submit() {
    if (!user) return
    acknowledge(alarm.id, {
      by: user.name,
      decision,
      notes: notes.trim() || undefined,
      impactDeductionPct: deductionPct,
    })
    setOpen(false)
    onChange?.()
  }

  function revert() {
    unacknowledge(alarm.id)
    onChange?.()
  }

  function onSelectDecision(value: AcknowledgmentDecision) {
    setDecision(value)
    const opt = DECISION_OPTIONS.find((o) => o.value === value)
    if (opt) setDeductionPct(opt.defaultDeduction)
  }

  if (acked) {
    return (
      <div className="flex flex-col items-end gap-1">
        <span className="inline-flex items-center gap-1 rounded-full bg-success/10 px-2 py-0.5 text-[11px] font-medium text-success">
          <CheckCircle2 className="h-3 w-3" /> Reconhecido
        </span>
        {ackInfo && (
          <div className="text-right text-[10px] leading-tight text-gray-500">
            <div className="font-medium text-gray-700">
              por {ackInfo.acknowledgedBy} · desconto {ackInfo.impactDeductionPct}%
            </div>
            <div>
              {ackInfo.decision === 'false_positive' && 'Falso positivo'}
              {ackInfo.decision === 'communication_noise' && 'Ruido de comunicacao'}
              {ackInfo.decision === 'expected_operation' && 'Operacao normal'}
              {ackInfo.decision === 'site_acceptance' && 'Aceite da operacao'}
              {ackInfo.decision === 'other' && 'Outro / analisado'}
            </div>
          </div>
        )}
        <button
          type="button"
          onClick={revert}
          className="inline-flex items-center gap-1 rounded-md border border-gray-200 bg-white px-2 py-1 text-[11px] font-medium text-gray-700 hover:bg-gray-50"
        >
          <Undo2 className="h-3 w-3" /> Reverter
        </button>
      </div>
    )
  }

  return (
    <>
      <button
        type="button"
        onClick={openAck}
        className={`inline-flex items-center gap-1 rounded-md border border-success/30 bg-success/10 px-2.5 py-1.5 text-xs font-semibold text-success hover:bg-success/15 ${
          compact ? 'px-2 py-1 text-[11px]' : ''
        }`}
      >
        <CheckCircle2 className="h-3.5 w-3.5" /> Reconhecer
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg rounded-xl border border-gray-200 bg-white p-6 shadow-2xl">
            <div className="mb-4 flex items-start justify-between gap-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Reconhecer alarme</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Alarmes reconhecidos deixam de impactar a saude do site proporcionalmente ao desconto aplicado.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 text-xs text-gray-700">
                <div className="flex flex-wrap items-center gap-2">
                  <Tag className="h-3.5 w-3.5 text-primary" />
                  <span className="font-semibold text-gray-900">{alarm.errorCode ?? alarm.rawCode ?? alarm.message.match(/\bCH\d{2,3}\b/)?.[0] ?? 'Alarme'}</span>
                  <span className="truncate text-gray-500">{alarm.message}</span>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700">Motivo do reconhecimento</label>
                <div className="mt-2 space-y-2">
                  {DECISION_OPTIONS.map((opt) => {
                    const selected = opt.value === decision
                    return (
                      <button
                        type="button"
                        key={opt.value}
                        onClick={() => onSelectDecision(opt.value)}
                        className={`w-full rounded-lg border p-3 text-left transition-colors ${
                          selected
                            ? 'border-success/50 bg-success/5 ring-2 ring-success/20'
                            : 'border-gray-200 hover:bg-gray-50'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-3">
                          <span className="text-sm font-semibold text-gray-900">{opt.label}</span>
                          <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-semibold text-primary">
                            Desconto {opt.defaultDeduction}%
                          </span>
                        </div>
                        <p className="mt-0.5 text-xs text-gray-500">{opt.description}</p>
                      </button>
                    )
                  })}
                </div>
              </div>

              <div>
                <div className="mb-1 flex items-center justify-between">
                  <label className="text-sm font-medium text-gray-700">
                    Impacto na saude · <span className="text-primary">Desconto de {deductionPct}%</span>
                  </label>
                  <span className="text-xs text-gray-500">0% = nenhum desconto · 100% = ignora completamente</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={100}
                  step={5}
                  value={deductionPct}
                  onChange={(e) => setDeductionPct(Number(e.target.value))}
                  className="w-full accent-primary"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Notas (opcional)</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                  placeholder="Observacoes da equipe de campo / engenharia..."
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={submit}
                  className="rounded-lg bg-success px-4 py-2 text-sm font-semibold text-white hover:bg-success/90"
                >
                  Confirmar reconhecimento
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export function AcknowledgmentHeaderCards({ alarms, baseSiteHealth = 76, baseSiteAvailability = 94 }: { alarms: Alarm[]; baseSiteHealth?: number; baseSiteAvailability?: number }) {
  const impact = useEffectiveAlarmHealthImpact(alarms)
  const { ackStore } = useAlarmAcknowledgments()

  const totalActive = useMemo(() => alarms.filter((a) => !ackStore[a.id]).length, [alarms, ackStore])
  const totalAcked = useMemo(() => alarms.filter((a) => !!ackStore[a.id]).length, [alarms, ackStore])

  const healthDelta = useMemo(() => {
    const deltaWeight = impact.savedWeight
    return Number(Math.min(100 - baseSiteHealth, deltaWeight * 1.4).toFixed(2))
  }, [impact.savedWeight, baseSiteHealth])

  const effectiveHealth = useMemo(() => clamp(baseSiteHealth + healthDelta, 0, 100), [baseSiteHealth, healthDelta])
  const availDelta = useMemo(() => Number(Math.min(100 - baseSiteAvailability, impact.savedWeight * 0.9).toFixed(2)), [impact.savedWeight, baseSiteAvailability])
  const effectiveAvailability = useMemo(() => clamp(baseSiteAvailability + availDelta, 0, 100), [baseSiteAvailability, availDelta])

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <div className="rounded-xl border border-gray-200 bg-white p-4">
        <div className="flex items-center gap-2 text-xs font-medium text-gray-500">
          <Activity className="h-4 w-4 text-primary" />
          Total de alarmes
        </div>
        <div className="mt-2 text-2xl font-bold text-gray-900">{alarms.length}</div>
        <p className="mt-0.5 text-[11px] text-gray-500">Peso bruto acumulado: {impact.totalWeight}</p>
      </div>
      <div className="rounded-xl border border-warning/20 bg-warning/5 p-4">
        <div className="flex items-center gap-2 text-xs font-medium text-warning">
          <AlertTriangle className="h-4 w-4" />
          Ativos (sem reconhecimento)
        </div>
        <div className="mt-2 text-2xl font-bold text-gray-900">{totalActive}</div>
        <p className="mt-0.5 text-[11px] text-gray-500">Impactando atualmente a saude: {impact.effectiveWeight.toFixed(2)}</p>
      </div>
      <div className="rounded-xl border border-success/20 bg-success/5 p-4">
        <div className="flex items-center gap-2 text-xs font-medium text-success">
          <ShieldCheck className="h-4 w-4" />
          Reconhecidos
        </div>
        <div className="mt-2 text-2xl font-bold text-gray-900">{totalAcked}</div>
        <p className="mt-0.5 text-[11px] text-gray-500">Reduzindo o impacto em {impact.recognitionRate.toFixed(1)}% · {impact.falsePositiveCount} falsos positivos</p>
      </div>
      <div className={`rounded-xl border p-4 ${effectiveHealth >= 90 ? 'border-success/30 bg-success/5' : effectiveHealth >= 72 ? 'border-warning/30 bg-warning/5' : 'border-danger/30 bg-danger/5'}`}>
        <div className="flex items-center gap-2 text-xs font-medium text-gray-500">
          <TrendingUp className="h-4 w-4 text-primary" />
          Saude do site (ajustada)
        </div>
        <div className="mt-2 flex items-end justify-between gap-2">
          <div className={`text-2xl font-bold ${effectiveHealth >= 90 ? 'text-success' : effectiveHealth >= 72 ? 'text-warning' : 'text-danger'}`}>
            {effectiveHealth.toFixed(1)}
          </div>
          <div className="rounded-full bg-white/80 px-2 py-0.5 text-[10px] font-semibold text-success">
            +{healthDelta.toFixed(1)} pts
          </div>
        </div>
        <div className="mt-0.5 flex items-center justify-between text-[11px] text-gray-500">
          <span>Status {getHealthStatusText(effectiveHealth)}</span>
          <span>Disp. {effectiveAvailability.toFixed(1)}%</span>
        </div>
      </div>
    </div>
  )
}

function clamp(v: number, min: number, max: number) {
  return Math.min(max, Math.max(min, v))
}

export { DECISION_OPTIONS }
