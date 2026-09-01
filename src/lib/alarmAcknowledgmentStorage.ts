import { useEffect, useState, useCallback, useMemo } from 'react'
import type { Alarm } from '@/types'

export const ACK_UPDATED_EVENT = 'ems-alarm-acknowledgment-updated'
export const CH_WEIGHT_UPDATED_EVENT = 'ems-ch-weight-updated'

const ACK_STORAGE_KEY = 'ems-alarm-acknowledgments-v1'
const CH_WEIGHT_STORAGE_KEY = 'ems-ch-weight-config-v1'

export type AcknowledgmentDecision =
  | 'false_positive'
  | 'communication_noise'
  | 'expected_operation'
  | 'site_acceptance'
  | 'other'

export interface AlarmAcknowledgment {
  alarmId: string
  acknowledgedAt: string
  acknowledgedBy: string
  decision: AcknowledgmentDecision
  notes?: string
  impactDeductionPct: number
}

export interface ChWeightOverride {
  chCode: string
  severity?: 'critical' | 'warning' | 'info'
  deductionPct?: number
  disabled?: boolean
  note?: string
}

type AckStore = Record<string, AlarmAcknowledgment>
type WeightStore = Record<string, ChWeightOverride>

const EMPTY_ACK: AckStore = {}
const EMPTY_WEIGHT: WeightStore = {}

function loadAck(): AckStore {
  if (typeof window === 'undefined') return EMPTY_ACK
  const raw = window.localStorage.getItem(ACK_STORAGE_KEY)
  if (!raw) return EMPTY_ACK
  try {
    return JSON.parse(raw) as AckStore
  } catch {
    return EMPTY_ACK
  }
}

function saveAck(store: AckStore) {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(ACK_STORAGE_KEY, JSON.stringify(store))
  window.dispatchEvent(new CustomEvent(ACK_UPDATED_EVENT, { detail: store }))
}

function loadWeight(): WeightStore {
  if (typeof window === 'undefined') return EMPTY_WEIGHT
  const raw = window.localStorage.getItem(CH_WEIGHT_STORAGE_KEY)
  if (!raw) {
    return { CH53: { chCode: 'CH53', deductionPct: 85, severity: 'info', note: 'Ruido de comunicacao recorrente, reduzir impacto na saude' } }
  }
  try {
    return JSON.parse(raw) as WeightStore
  } catch {
    return EMPTY_WEIGHT
  }
}

function saveWeight(store: WeightStore) {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(CH_WEIGHT_STORAGE_KEY, JSON.stringify(store))
  window.dispatchEvent(new CustomEvent(CH_WEIGHT_UPDATED_EVENT, { detail: store }))
}

export function getChCodeFromAlarm(message: string, rawCode?: string, errorCode?: string): string | null {
  if (errorCode) return errorCode
  if (rawCode) return rawCode
  const match = message.match(/\bCH\d{2,3}\b/)
  return match ? match[0] : null
}

export function getChSeverityMultiplier(chCode: string | null, type: Alarm['type'], weights: WeightStore): number {
  const override = chCode ? weights[chCode] : undefined
  if (override?.disabled) return 0
  const resolvedSeverity = override?.severity ?? type
  if (override?.deductionPct != null) {
    const base = resolvedSeverity === 'critical' ? 1 : resolvedSeverity === 'warning' ? 0.55 : 0.2
    return Math.max(0, base * (1 - override.deductionPct / 100))
  }
  if (resolvedSeverity === 'critical') return 1
  if (resolvedSeverity === 'warning') return 0.55
  return 0.2
}

export function useAlarmAcknowledgments() {
  const [ack, setAck] = useState<AckStore>(() => loadAck())
  const [weights, setWeights] = useState<WeightStore>(() => loadWeight())

  useEffect(() => {
    const onAck = () => setAck(loadAck())
    const onWeight = () => setWeights(loadWeight())
    const onStorage = () => {
      setAck(loadAck())
      setWeights(loadWeight())
    }
    window.addEventListener(ACK_UPDATED_EVENT, onAck)
    window.addEventListener(CH_WEIGHT_UPDATED_EVENT, onWeight)
    window.addEventListener('storage', onStorage)
    return () => {
      window.removeEventListener(ACK_UPDATED_EVENT, onAck)
      window.removeEventListener(CH_WEIGHT_UPDATED_EVENT, onWeight)
      window.removeEventListener('storage', onStorage)
    }
  }, [])

  const acknowledge = useCallback(
    (
      alarmId: string,
      params: {
        by: string
        decision: AcknowledgmentDecision
        notes?: string
        impactDeductionPct?: number
      }
    ) => {
      const store = loadAck()
      const impactPct = params.impactDeductionPct ?? defaultDeductionForDecision(params.decision)
      store[alarmId] = {
        alarmId,
        acknowledgedAt: new Date().toISOString(),
        acknowledgedBy: params.by,
        decision: params.decision,
        notes: params.notes,
        impactDeductionPct: impactPct,
      }
      saveAck(store)
    },
    []
  )

  const acknowledgeMany = useCallback(
    (
      alarmIds: string[],
      params: {
        by: string
        decision: AcknowledgmentDecision
        notes?: string
        impactDeductionPct?: number
      }
    ) => {
      if (alarmIds.length === 0) return 0
      const store = loadAck()
      const impactPct = params.impactDeductionPct ?? defaultDeductionForDecision(params.decision)
      const now = new Date().toISOString()
      let added = 0
      for (const id of alarmIds) {
        if (!store[id]) {
          added += 1
        }
        store[id] = {
          alarmId: id,
          acknowledgedAt: now,
          acknowledgedBy: params.by,
          decision: params.decision,
          notes: params.notes,
          impactDeductionPct: impactPct,
        }
      }
      saveAck(store)
      return added
    },
    []
  )

  const unacknowledgeMany = useCallback((alarmIds: string[]) => {
    if (alarmIds.length === 0) return 0
    const store = loadAck()
    let removed = 0
    for (const id of alarmIds) {
      if (store[id]) {
        delete store[id]
        removed += 1
      }
    }
    saveAck(store)
    return removed
  }, [])

  const unacknowledge = useCallback((alarmId: string) => {
    const store = loadAck()
    delete store[alarmId]
    saveAck(store)
  }, [])

  const isAcknowledged = useCallback(
    (alarmId: string) => !!ack[alarmId],
    [ack]
  )

  const getAck = useCallback(
    (alarmId: string): AlarmAcknowledgment | undefined => ack[alarmId],
    [ack]
  )

  const setChWeightOverride = useCallback((chCode: string, override: Partial<ChWeightOverride> | null) => {
    const store = loadWeight()
    if (override == null) {
      delete store[chCode]
    } else {
      store[chCode] = { ...(store[chCode] ?? {}), chCode, ...override }
    }
    saveWeight(store)
  }, [])

  return {
    ackStore: ack,
    weightStore: weights,
    acknowledge,
    acknowledgeMany,
    unacknowledge,
    unacknowledgeMany,
    isAcknowledged,
    getAck,
    setChWeightOverride,
  }
}

function defaultDeductionForDecision(decision: AcknowledgmentDecision): number {
  switch (decision) {
    case 'false_positive':
      return 100
    case 'communication_noise':
      return 90
    case 'expected_operation':
      return 70
    case 'site_acceptance':
      return 60
    case 'other':
      return 50
  }
}

interface AlarmMinimal {
  id: string
  type: Alarm['type']
  priority?: number
  message: string
  rawCode?: string
  errorCode?: string
}

export function useEffectiveAlarmHealthImpact<T extends AlarmMinimal>(alarms: T[]) {
  const { ackStore, weightStore } = useAlarmAcknowledgments()

  return useMemo(() => {
    let totalWeight = 0
    let effectiveWeight = 0
    let falsePositiveCount = 0
    let recognizedCount = 0

    for (const alarm of alarms) {
      const ch = getChCodeFromAlarm(alarm.message, alarm.rawCode, alarm.errorCode)
      const severityMult = getChSeverityMultiplier(ch, alarm.type, weightStore)
      const priorityWeight = alarm.type === 'critical' ? 2.1 : alarm.type === 'warning' ? 1 : 0.35
      const raw = severityMult * priorityWeight
      totalWeight += raw
      const acked = ackStore[alarm.id]
      if (acked) {
        recognizedCount += 1
        if (acked.decision === 'false_positive' || acked.impactDeductionPct >= 100) {
          falsePositiveCount += 1
        }
        const deduction = Math.min(100, Math.max(0, acked.impactDeductionPct))
        effectiveWeight += raw * (1 - deduction / 100)
      } else {
        effectiveWeight += raw
      }
    }

    return {
      totalWeight: Number(totalWeight.toFixed(4)),
      effectiveWeight: Number(effectiveWeight.toFixed(4)),
      savedWeight: Number((totalWeight - effectiveWeight).toFixed(4)),
      recognitionRate: totalWeight > 0 ? Number(((totalWeight - effectiveWeight) / totalWeight * 100).toFixed(2)) : 0,
      recognizedCount,
      falsePositiveCount,
    }
  }, [alarms, ackStore, weightStore])
}

export function applyAckDiscountToHealth(
  baseHealth: number,
  baseAvailability: number,
  alarms: AlarmMinimal[],
  ackStore: AckStore,
  weightStore: WeightStore
): { health: number; availability: number; totalPenalty: number; effectivePenalty: number; ackedCount: number } {
  let totalPenalty = 0
  let effectivePenalty = 0
  let ackedCount = 0
  for (const alarm of alarms) {
    const ch = getChCodeFromAlarm(alarm.message, alarm.rawCode, alarm.errorCode)
    const severityMult = getChSeverityMultiplier(ch, alarm.type, weightStore)
    const priorityWeight = alarm.type === 'critical' ? 2.2 : alarm.type === 'warning' ? 1.1 : 0.4
    const raw = severityMult * priorityWeight
    totalPenalty += raw
    const acked = ackStore[alarm.id]
    if (acked) {
      ackedCount += 1
      const deduction = Math.min(100, Math.max(0, acked.impactDeductionPct))
      effectivePenalty += raw * (1 - deduction / 100)
    } else {
      effectivePenalty += raw
    }
  }
  const delta = totalPenalty - effectivePenalty
  const health = clamp(baseHealth + delta * 1.35, 0, 100)
  const availability = clamp(baseAvailability + delta * 0.85, 0, 100)
  return {
    health: Number(health.toFixed(2)),
    availability: Number(availability.toFixed(2)),
    totalPenalty: Number(totalPenalty.toFixed(4)),
    effectivePenalty: Number(effectivePenalty.toFixed(4)),
    ackedCount,
  }
}

function clamp(v: number, min: number, max: number) {
  return Math.min(max, Math.max(min, v))
}

export function getHealthStatusText(score: number): 'Verde' | 'Amarelo' | 'Vermelho' {
  if (score >= 90) return 'Verde'
  if (score >= 72) return 'Amarelo'
  return 'Vermelho'
}
