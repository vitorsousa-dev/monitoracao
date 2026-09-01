import { useMemo, useState } from 'react'
import { CheckSquare2, X, Tag, ShieldCheck, Users, Clock4 } from 'lucide-react'
import type { Alarm } from '@/types'
import { useAlarmAcknowledgments, type AcknowledgmentDecision, getChCodeFromAlarm } from '@/lib/alarmAcknowledgmentStorage'
import { useAuth } from '@/hooks/useAuth'
import { DECISION_OPTIONS } from './AcknowledgeAlarmAction'

interface BatchAcknowledgeButtonProps {
  alarms: Alarm[]
  label?: string
  scopeTitle?: string
  variant?: 'primary' | 'outline'
  size?: 'sm' | 'md'
}

export function BatchAcknowledgeButton({
  alarms,
  label = 'Reconhecer em massa',
  scopeTitle = 'alarme(s) selecionados',
  variant = 'primary',
  size = 'md',
}: BatchAcknowledgeButtonProps) {
  const { user } = useAuth()
  const { acknowledgeMany, isAcknowledged } = useAlarmAcknowledgments()
  const [open, setOpen] = useState(false)
  const [decision, setDecision] = useState<AcknowledgmentDecision>('communication_noise')
  const [deductionPct, setDeductionPct] = useState(90)
  const [notes, setNotes] = useState('')
  const [result, setResult] = useState<string | null>(null)

  const activeAlarms = useMemo(
    () => alarms.filter((alarm) => !isAcknowledged(alarm.id)),
    [alarms, isAcknowledged]
  )

  const chHistogram = useMemo(() => {
    const map = new Map<string, Alarm[]>()
    activeAlarms.forEach((alarm) => {
      const ch = getChCodeFromAlarm(alarm.message, alarm.rawCode, alarm.errorCode) ?? 'OUTROS'
      const arr = map.get(ch) ?? []
      arr.push(alarm)
      map.set(ch, arr)
    })
    return Array.from(map.entries())
      .map(([chCode, items]) => ({ chCode, count: items.length, ids: items.map((i) => i.id) }))
      .sort((a, b) => b.count - a.count)
  }, [activeAlarms])

  const [selectedChs, setSelectedChs] = useState<Set<string>>(new Set())
  const allChSelected = selectedChs.size === 0 || selectedChs.size === chHistogram.length

  const selectedIds = useMemo(() => {
    if (chHistogram.length === 0) return []
    if (selectedChs.size === 0 || allChSelected) {
      return activeAlarms.map((a) => a.id)
    }
    const ids: string[] = []
    chHistogram.forEach((row) => {
      if (selectedChs.has(row.chCode)) ids.push(...row.ids)
    })
    return ids
  }, [activeAlarms, chHistogram, selectedChs, allChSelected])

  function resetState() {
    setDecision('communication_noise')
    setDeductionPct(90)
    setNotes('')
    setSelectedChs(new Set())
    setResult(null)
  }

  function openModal() {
    resetState()
    setOpen(true)
  }

  function submit() {
    if (!user) return
    const defaultOption = DECISION_OPTIONS.find((o) => o.value === decision) ?? DECISION_OPTIONS[DECISION_OPTIONS.length - 1]
    const actualDeduction = deductionPct ?? defaultOption.defaultDeduction
    const count = acknowledgeMany(selectedIds, {
      by: user.name,
      decision,
      notes: notes.trim() || undefined,
      impactDeductionPct: actualDeduction,
    })
    setResult(`✔ ${count} alarme(s) reconhecido(s) com sucesso.`)
    setTimeout(() => {
      setOpen(false)
      setResult(null)
    }, 1800)
  }

  function toggleCh(chCode: string) {
    const next = new Set(selectedChs)
    if (next.has(chCode)) next.delete(chCode)
    else next.add(chCode)
    setSelectedChs(next)
  }

  const ButtonVariant =
    variant === 'primary'
      ? size === 'sm'
        ? 'inline-flex items-center gap-1.5 rounded-md border border-success/30 bg-success/90 px-2.5 py-1.5 text-[12px] font-semibold text-white hover:bg-success'
        : 'inline-flex items-center gap-2 rounded-lg border border-success/30 bg-success/95 px-4 py-2 text-sm font-semibold text-white hover:bg-success'
      : size === 'sm'
        ? 'inline-flex items-center gap-1.5 rounded-md border border-gray-200 bg-white px-2.5 py-1.5 text-[12px] font-semibold text-gray-800 hover:bg-gray-50'
        : 'inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-800 hover:bg-gray-50'

  return (
    <>
      <button
        type="button"
        onClick={openModal}
        disabled={activeAlarms.length === 0}
        className={`${ButtonVariant} shadow-sm transition-colors disabled:cursor-not-allowed disabled:opacity-50`}
      >
        <CheckSquare2 className={size === 'sm' ? 'h-3.5 w-3.5' : 'h-4 w-4'} />
        <span>{label}</span>
        <span
          className={
            size === 'sm'
              ? 'rounded-full bg-white/20 px-1.5 py-0.5 text-[10px] font-semibold'
              : 'rounded-full bg-success-foreground/15 px-2 py-0.5 text-[11px] font-semibold'
          }
        >
          {activeAlarms.length}
        </span>
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-2xl rounded-2xl border border-gray-200 bg-white p-6 shadow-2xl">
            <div className="mb-4 flex items-start justify-between gap-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Reconhecimento em massa</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Aplicar reconhecimento em {selectedIds.length} {scopeTitle}. Alarmes reconhecidos deixam de impactar a saude do site conforme desconto aplicado.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setOpen(false)
                }}
                className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {result && (
              <div className="mb-4 rounded-lg border border-success/30 bg-success/10 p-3 text-sm font-medium text-success">
                {result}
              </div>
            )}

            <div className="space-y-4">
              <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                <div className="mb-2 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm font-semibold text-gray-900">
                    <Users className="h-4 w-4 text-primary" />
                    Filtrar por codigo de alarme (CH)
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedChs(new Set())
                    }}
                    className="text-[11px] font-semibold text-primary hover:text-primary/80"
                  >
                    Selecionar todos
                  </button>
                </div>

                {chHistogram.length === 0 ? (
                  <div className="rounded-lg border border-dashed border-gray-300 bg-white p-4 text-center text-sm text-gray-500">
                    Nenhum alarme ativo para reconhecer no escopo atual.
                  </div>
                ) : (
                  <div className="grid max-h-56 grid-cols-1 gap-2 overflow-y-auto pr-1 sm:grid-cols-2 lg:grid-cols-3">
                    {chHistogram.map((row) => {
                      const checked = selectedChs.size === 0 ? true : selectedChs.has(row.chCode)
                      return (
                        <button
                          key={row.chCode}
                          type="button"
                          onClick={() => toggleCh(row.chCode)}
                          className={`flex items-center justify-between rounded-lg border p-2.5 text-left transition-colors ${
                            checked
                              ? 'border-success/40 bg-success/5 shadow-sm ring-1 ring-success/20'
                              : 'border-gray-200 bg-white hover:bg-gray-50'
                          }`}
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <div
                              className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border text-white ${
                                checked ? 'border-success bg-success' : 'border-gray-300 bg-white text-transparent'
                              }`}
                            >
                              <ShieldCheck className="h-3 w-3" />
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-900">
                                <Tag className="h-3 w-3 text-primary" />
                                {row.chCode}
                              </div>
                            </div>
                          </div>
                          <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-semibold text-gray-700">
                            {row.count}
                          </span>
                        </button>
                      )
                    })}
                  </div>
                )}

                <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-gray-200 pt-3 text-[12px] text-gray-600">
                  <div className="inline-flex items-center gap-1.5">
                    <Clock4 className="h-3.5 w-3.5" />
                    {selectedChs.size === 0
                      ? 'Todos os codigos selecionados'
                      : `${selectedChs.size} de ${chHistogram.length} codigos marcados`}
                  </div>
                  <div className="text-[12px] font-semibold text-gray-900">
                    {selectedIds.length} alarme(s) serao reconhecidos
                  </div>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700">Motivo do reconhecimento</label>
                <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {DECISION_OPTIONS.map((opt) => {
                    const selected = opt.value === decision
                    return (
                      <button
                        type="button"
                        key={opt.value}
                        onClick={() => {
                          setDecision(opt.value)
                          setDeductionPct(opt.defaultDeduction)
                        }}
                        className={`rounded-lg border p-3 text-left transition-colors ${
                          selected
                            ? 'border-success/50 bg-success/5 ring-2 ring-success/20'
                            : 'border-gray-200 hover:bg-gray-50'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-3">
                          <span className="text-sm font-semibold text-gray-900">{opt.label}</span>
                          <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-semibold text-primary">
                            {opt.defaultDeduction}% desconto
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
                  placeholder="Ex.: Apenas ruido de comunicacao CH53 reportado pela engenharia como aceitavel..."
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setOpen(false)
                  }}
                  className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={submit}
                  disabled={selectedIds.length === 0 || !user}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-success px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-success/90 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <CheckSquare2 className="h-4 w-4" />
                  Reconhecer {selectedIds.length} alarme(s)
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
