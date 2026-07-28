import { Alarm, EquipmentMonthlySnapshot, MonthlySummary, SiteMonthlySnapshot } from '@/types'
import {
  SBA_TORRES_BRASIL_CLIENT,
  SBA_TORRES_BRASIL_SITE_ID,
  SBA_TORRES_BRASIL_SITE_NAME,
  sbaTorresBrasilSite,
  sbaTorresBrasilSystems,
} from './sbaTorresBrasilData'
import { getHealthStatusText } from './utils'

type SbaAggregatedIncident = {
  monthKey: string
  systemName: string
  error: string
  occurrences: number
  affectedMachines: number
}

type SbaEquipmentIncident = {
  monthKey: string
  equipmentName: string
  error: string
  occurrences: number
}

export interface SbaTorresBrasilUnitHealthRollup {
  id: string
  unitName: string
  systemId: string
  systemName: string
  unitType: 'ODU' | 'IDU' | 'SYSTEM'
  totalAlerts: number
  health: number
  availability: number
  mttr: number
  status: 'Verde' | 'Amarelo' | 'Vermelho'
  lastAlertAt: string
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max)
}

function slugify(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function getMonthLabel(monthKey: string) {
  const [, month] = monthKey.split('-')
  const labels: Record<string, string> = {
    '01': 'Jan',
    '02': 'Fev',
    '03': 'Mar',
    '04': 'Abr',
    '05': 'Mai',
    '06': 'Jun',
    '07': 'Jul',
    '08': 'Ago',
    '09': 'Set',
    '10': 'Out',
    '11': 'Nov',
    '12': 'Dez',
  }

  return `${labels[month] ?? month}/${monthKey.slice(2, 4)}`
}

function buildAlarmType(error: string) {
  if (error.toLowerCase().includes('superaquecimento')) {
    return 'warning'
  }

  if (error.toLowerCase().includes('performance')) {
    return 'warning'
  }

  return 'critical'
}

const SBA_MAY_INCIDENTS: SbaAggregatedIncident[] = [
  { monthKey: '2026-05', systemName: 'UC-A SBA', error: 'Temp Entrada Serpentina Evap Baixo Rendimento', occurrences: 301, affectedMachines: 22 },
  { monthKey: '2026-05', systemName: 'UC-B SBA', error: 'Temp Entrada Serpentina Evap Baixo Rendimento', occurrences: 105, affectedMachines: 24 },
  { monthKey: '2026-05', systemName: 'UC-B SBA', error: 'Baixa performance de sistema em refrigeracao', occurrences: 80, affectedMachines: 12 },
  { monthKey: '2026-05', systemName: 'UC-C SBA.MINI', error: 'Temp Entrada Serpentina Evap Baixo Rendimento', occurrences: 71, affectedMachines: 5 },
  { monthKey: '2026-05', systemName: 'UC-A SBA', error: 'Alto Superaquecimento util (Evaporadora)', occurrences: 42, affectedMachines: 7 },
  { monthKey: '2026-05', systemName: 'UC-C SBA.MINI', error: 'Baixa performance de sistema em refrigeracao', occurrences: 33, affectedMachines: 5 },
  { monthKey: '2026-05', systemName: 'UC-A SBA', error: 'Baixa performance de sistema em refrigeracao', occurrences: 25, affectedMachines: 6 },
  { monthKey: '2026-05', systemName: 'UC-B SBA', error: 'Indoor error', occurrences: 22, affectedMachines: 15 },
  { monthKey: '2026-05', systemName: 'UC-A SBA', error: 'Indoor error', occurrences: 5, affectedMachines: 5 },
  { monthKey: '2026-05', systemName: 'Device', error: 'Device disconnected', occurrences: 3, affectedMachines: 1 },
  { monthKey: '2026-05', systemName: 'UC-C SBA.MINI', error: 'Alto Superaquecimento util (Evaporadora)', occurrences: 3, affectedMachines: 1 },
  { monthKey: '2026-05', systemName: 'UC-B SBA', error: 'Alto Superaquecimento util (Evaporadora)', occurrences: 2, affectedMachines: 1 },
  { monthKey: '2026-05', systemName: 'UC-C SBA.MINI', error: 'Units disconnected', occurrences: 2, affectedMachines: 1 },
  { monthKey: '2026-05', systemName: 'UC-C SBA.MINI', error: 'Performance de Resfriamento', occurrences: 1, affectedMachines: 1 },
]

const SBA_JUNE_EQUIPMENT_INCIDENTS: SbaEquipmentIncident[] = [
  { monthKey: '2026-06', equipmentName: 'UC-C SBA', error: 'Inverter DC Link - Erro de Voltagem', occurrences: 225 },
  { monthKey: '2026-06', equipmentName: 'UC-C SBA', error: 'Alerta de Tensao de Entrada', occurrences: 44 },
  { monthKey: '2026-06', equipmentName: 'STAFF-11-A', error: 'Temp Entrada Serpentina Evap Baixo Rendimento', occurrences: 26 },
  { monthKey: '2026-06', equipmentName: 'COPA-01 A LADO MERC.', error: 'Baixa performance de sistema em refrigeracao', occurrences: 25 },
  { monthKey: '2026-06', equipmentName: 'COPA-02 B LADO PURIF.', error: 'Baixa performance de sistema em refrigeracao', occurrences: 25 },
  { monthKey: '2026-06', equipmentName: 'STAFF-10-A', error: 'Temp Entrada Serpentina Evap Baixo Rendimento', occurrences: 23 },
  { monthKey: '2026-06', equipmentName: 'STAFF-09-A', error: 'Temp Entrada Serpentina Evap Baixo Rendimento', occurrences: 22 },
  { monthKey: '2026-06', equipmentName: 'STAFF-14-A', error: 'Temp Entrada Serpentina Evap Baixo Rendimento', occurrences: 22 },
  { monthKey: '2026-06', equipmentName: 'STAFF-15-A', error: 'Temp Entrada Serpentina Evap Baixo Rendimento', occurrences: 22 },
  { monthKey: '2026-06', equipmentName: 'STAFF-13-A', error: 'Temp Entrada Serpentina Evap Baixo Rendimento', occurrences: 20 },
  { monthKey: '2026-06', equipmentName: 'STAFF-12-A', error: 'Temp Entrada Serpentina Evap Baixo Rendimento', occurrences: 19 },
  { monthKey: '2026-06', equipmentName: 'STAFF-17-A', error: 'Temp Entrada Serpentina Evap Baixo Rendimento', occurrences: 19 },
  { monthKey: '2026-06', equipmentName: 'B-EL SALVADOR', error: 'Temp Entrada Serpentina Evap Baixo Rendimento', occurrences: 18 },
  { monthKey: '2026-06', equipmentName: 'STAFF-18-A', error: 'Temp Entrada Serpentina Evap Baixo Rendimento', occurrences: 17 },
  { monthKey: '2026-06', equipmentName: 'STAFF-19-A', error: 'Temp Entrada Serpentina Evap Baixo Rendimento', occurrences: 17 },
  { monthKey: '2026-06', equipmentName: 'STAFF-20-A', error: 'Temp Entrada Serpentina Evap Baixo Rendimento', occurrences: 17 },
]

type SbaSystemMonthlyMetric = {
  monthKey: string
  systemName: string
  systemId: string
  totalAlerts: number
  affectedMachines: number
  issueCount: number
  performanceAlerts: number
  disconnectedAlerts: number
  indoorAlerts: number
  voltageAlerts: number
}

function normalizeEquipmentName(value: string) {
  return value.replace(/\s+\([A-Z0-9]+\)$/i, '').trim()
}

function resolveSystemName(equipmentName: string) {
  const normalizedEquipment = normalizeEquipmentName(equipmentName)

  if (normalizedEquipment === 'UC-C SBA') {
    return 'UC-C SBA.MINI'
  }

  const matchedSystem = sbaTorresBrasilSystems.find(
    (system) =>
      system.systemName === normalizedEquipment ||
      system.outdoorUnits.includes(normalizedEquipment) ||
      system.internalUnits.includes(normalizedEquipment)
  )

  return matchedSystem?.systemName ?? normalizedEquipment
}

function getSystemId(systemName: string) {
  return slugify(systemName)
}

function buildSystemMetricAccumulator(
  monthKey: string,
  systemName: string,
  systemId: string
): SbaSystemMonthlyMetric {
  return {
    monthKey,
    systemName,
    systemId,
    totalAlerts: 0,
    affectedMachines: 0,
    issueCount: 0,
    performanceAlerts: 0,
    disconnectedAlerts: 0,
    indoorAlerts: 0,
    voltageAlerts: 0,
  }
}

const groupedSystemMetrics = SBA_MAY_INCIDENTS.reduce<Map<string, SbaSystemMonthlyMetric>>((accumulator, incident) => {
  const monthKey = incident.monthKey
  const systemId = getSystemId(incident.systemName)
  const key = `${monthKey}|${systemId}`
  const current = accumulator.get(key) ?? buildSystemMetricAccumulator(monthKey, incident.systemName, systemId)

  current.totalAlerts += incident.occurrences
  current.affectedMachines = Math.max(current.affectedMachines, incident.affectedMachines)
  current.issueCount += 1
  current.performanceAlerts += incident.error.toLowerCase().includes('performance') ? incident.occurrences : 0
  current.disconnectedAlerts += incident.error.toLowerCase().includes('disconnected') ? incident.occurrences : 0
  current.indoorAlerts += incident.error.toLowerCase().includes('indoor error') ? incident.occurrences : 0
  current.voltageAlerts += incident.error.toLowerCase().includes('tensao') || incident.error.toLowerCase().includes('voltagem') ? incident.occurrences : 0

  accumulator.set(key, current)
  return accumulator
}, new Map())

SBA_JUNE_EQUIPMENT_INCIDENTS.forEach((incident) => {
  const systemName = resolveSystemName(incident.equipmentName)
  const systemId = getSystemId(systemName)
  const key = `${incident.monthKey}|${systemId}`
  const current = groupedSystemMetrics.get(key) ?? buildSystemMetricAccumulator(incident.monthKey, systemName, systemId)

  current.totalAlerts += incident.occurrences
  current.affectedMachines += 1
  current.issueCount += 1
  current.performanceAlerts += incident.error.toLowerCase().includes('performance') ? incident.occurrences : 0
  current.disconnectedAlerts += incident.error.toLowerCase().includes('disconnected') ? incident.occurrences : 0
  current.indoorAlerts += incident.error.toLowerCase().includes('indoor error') ? incident.occurrences : 0
  current.voltageAlerts += incident.error.toLowerCase().includes('tensao') || incident.error.toLowerCase().includes('voltagem') ? incident.occurrences : 0

  groupedSystemMetrics.set(key, current)
})

function buildSystemSnapshot(metric: SbaSystemMonthlyMetric): EquipmentMonthlySnapshot {
  const healthPenalty =
    metric.totalAlerts * 0.09 +
    metric.affectedMachines * 2.1 +
    metric.performanceAlerts * 0.03 +
    metric.disconnectedAlerts * 0.8 +
    metric.indoorAlerts * 0.05 +
    metric.voltageAlerts * 0.06
  const availabilityPenalty =
    metric.totalAlerts * 0.08 +
    metric.affectedMachines * 1.7 +
    metric.disconnectedAlerts * 1.2 +
    metric.indoorAlerts * 0.04 +
    metric.voltageAlerts * 0.05
  const comfortPenalty = metric.totalAlerts * 0.07 + metric.affectedMachines * 1.4 + metric.performanceAlerts * 0.05
  const performancePenalty = metric.totalAlerts * 0.08 + metric.performanceAlerts * 0.06 + metric.affectedMachines * 1.5 + metric.voltageAlerts * 0.04
  const mttr = Number(clamp(2.4 + metric.issueCount * 0.55 + metric.affectedMachines * 0.12, 2.4, 18).toFixed(2))
  const lastUpdated = metric.monthKey === '2026-06' ? '2026-06-30' : '2026-05-31'
  const startDate = `${metric.monthKey}-01`
  const endDate = metric.monthKey === '2026-06' ? '2026-06-30' : '2026-05-31'

  const health = Number(clamp(98 - healthPenalty, 42, 99).toFixed(2))
  const availability = Number(clamp(99 - availabilityPenalty, 45, 99).toFixed(2))
  const comfort = Number(clamp(97 - comfortPenalty, 46, 99).toFixed(2))
  const performance = Number(clamp(97 - performancePenalty, 44, 99).toFixed(2))

  return {
    id: `sba-system-${metric.systemId}`,
    name: metric.systemName,
    type: 'VRV',
    area: SBA_TORRES_BRASIL_SITE_NAME,
    client: SBA_TORRES_BRASIL_CLIENT,
    siteId: SBA_TORRES_BRASIL_SITE_ID,
    health,
    availability,
    comfort,
    performance,
    status: getHealthStatusText(health) as EquipmentMonthlySnapshot['status'],
    mttr,
    totalOccurrences: metric.totalAlerts,
    criticalOccurrences: metric.totalAlerts,
    moderateOccurrences: 0,
    informativeOccurrences: 0,
    lastUpdated,
    monthKey: metric.monthKey,
    month: getMonthLabel(metric.monthKey),
    startDate,
    endDate,
  }
}

export const sbaTorresBrasilMonthlyEquipmentSnapshots: EquipmentMonthlySnapshot[] = Array.from(groupedSystemMetrics.values())
  .map(buildSystemSnapshot)
  .sort((a, b) => a.monthKey.localeCompare(b.monthKey) || b.totalOccurrences - a.totalOccurrences)

export const sbaTorresBrasilMonthlySummaries: MonthlySummary[] = Array.from(
  sbaTorresBrasilMonthlyEquipmentSnapshots.reduce<Map<string, EquipmentMonthlySnapshot[]>>((accumulator, snapshot) => {
    const current = accumulator.get(snapshot.monthKey) ?? []
    current.push(snapshot)
    accumulator.set(snapshot.monthKey, current)
    return accumulator
  }, new Map())
)
  .map(([monthKey, snapshots]) => {
    const count = snapshots.length || 1
    return {
      monthKey,
      month: getMonthLabel(monthKey),
      startDate: snapshots[0]?.startDate ?? `${monthKey}-01`,
      endDate: snapshots[snapshots.length - 1]?.endDate ?? `${monthKey}-30`,
      health: Number((snapshots.reduce((sum, snapshot) => sum + snapshot.health, 0) / count).toFixed(2)),
      target: 90,
      availability: Number((snapshots.reduce((sum, snapshot) => sum + snapshot.availability, 0) / count).toFixed(2)),
      mttr: Number((snapshots.reduce((sum, snapshot) => sum + snapshot.mttr, 0) / count).toFixed(2)),
      totalOccurrences: snapshots.reduce((sum, snapshot) => sum + snapshot.totalOccurrences, 0),
      affectedEquipment: snapshots.length,
    }
  })
  .sort((a, b) => a.monthKey.localeCompare(b.monthKey))

export const sbaTorresBrasilSiteMonthlySnapshots: SiteMonthlySnapshot[] = sbaTorresBrasilMonthlySummaries.map((summary) => ({
  ...sbaTorresBrasilSite,
  saudeGeral: summary.health,
  disponibilidade: summary.availability,
  conforto: Number(clamp(summary.health + 1.2, 0, 100).toFixed(2)),
  performance: Number(clamp(summary.availability + 0.7, 0, 100).toFixed(2)),
  ocorrenciasCriticas: summary.totalOccurrences,
  ultimaAtualizacao: summary.endDate.split('-').reverse().join('/'),
  monthKey: summary.monthKey,
  month: summary.month,
}))

const sbaMayAlarms: Alarm[] = SBA_MAY_INCIDENTS.map((incident, index) => ({
  id: `sba-alarm-may-${index + 1}`,
  equipmentId: `sba-system-${slugify(incident.systemName)}`,
  equipmentName: incident.systemName,
  type: buildAlarmType(incident.error),
  message: `${incident.error} com ${incident.occurrences} ocorrencias e ${incident.affectedMachines} maquina(s) afetada(s) no periodo.`,
  status: incident.occurrences > 1 ? 'pending_followup' : 'open',
  priority: incident.occurrences >= 50 ? 1 : incident.occurrences >= 10 ? 2 : 3,
  createdAt: `${incident.monthKey}-${String(Math.min(index + 10, 28)).padStart(2, '0')}T12:00:00`,
  updatedAt: '2026-05-31T18:00:00',
  clientName: SBA_TORRES_BRASIL_CLIENT,
  areaName: incident.systemName,
  hasFollowup: incident.occurrences > 1,
  followupCount: incident.occurrences,
}))

const sbaJuneAlarms: Alarm[] = SBA_JUNE_EQUIPMENT_INCIDENTS.map((incident, index) => {
  const systemName = resolveSystemName(incident.equipmentName)
  return {
    id: `sba-alarm-june-${index + 1}`,
    equipmentId: `sba-system-${getSystemId(systemName)}`,
    equipmentName: incident.equipmentName,
    type: buildAlarmType(incident.error),
    message: `${incident.error} com ${incident.occurrences} ocorrencias no periodo.`,
    status: incident.occurrences > 1 ? 'pending_followup' : 'open',
    priority: incident.occurrences >= 50 ? 1 : incident.occurrences >= 10 ? 2 : 3,
    createdAt: `${incident.monthKey}-${String(Math.min(index + 10, 28)).padStart(2, '0')}T12:00:00`,
    updatedAt: '2026-06-30T18:00:00',
    clientName: SBA_TORRES_BRASIL_CLIENT,
    areaName: systemName,
    hasFollowup: incident.occurrences > 1,
    followupCount: incident.occurrences,
  }
})

export const sbaTorresBrasilAlarms: Alarm[] = [...sbaMayAlarms, ...sbaJuneAlarms]

const sbaJuneUnitRollupMap = SBA_JUNE_EQUIPMENT_INCIDENTS.reduce<Map<string, SbaTorresBrasilUnitHealthRollup>>((accumulator, incident) => {
  const systemName = resolveSystemName(incident.equipmentName)
  const systemId = getSystemId(systemName)
  const unitName = normalizeEquipmentName(incident.equipmentName)
  const system = sbaTorresBrasilSystems.find((entry) => entry.systemName === systemName)
  const unitType: SbaTorresBrasilUnitHealthRollup['unitType'] =
    system?.outdoorUnits.includes(unitName) || unitName.startsWith('UC-') ? 'ODU' : 'IDU'
  const id = `${systemId}-${slugify(unitName)}`
  const current = accumulator.get(id) ?? {
    id,
    unitName,
    systemId,
    systemName,
    unitType,
    totalAlerts: 0,
    health: 98,
    availability: 99,
    mttr: 1.2,
    status: 'Verde',
    lastAlertAt: '2026-06-30 18:00',
  }

  current.totalAlerts += incident.occurrences
  current.lastAlertAt = '2026-06-30 18:00'
  accumulator.set(id, current)
  return accumulator
}, new Map())

export const sbaTorresBrasilUnitHealthRollups: SbaTorresBrasilUnitHealthRollup[] = Array.from(sbaJuneUnitRollupMap.values())
  .map((unit) => {
    const penalty = unit.totalAlerts * (unit.unitType === 'ODU' ? 0.22 : 0.18)
    const health = clamp(98 - penalty, 38, 99)
    const availability = clamp(99 - unit.totalAlerts * (unit.unitType === 'ODU' ? 0.17 : 0.14), 42, 99)
    const mttr = clamp(1.8 + unit.totalAlerts * (unit.unitType === 'ODU' ? 0.05 : 0.04), 1.8, 16)

    return {
      ...unit,
      health: Number(health.toFixed(2)),
      availability: Number(availability.toFixed(2)),
      mttr: Number(mttr.toFixed(2)),
      status: getHealthStatusText(health) as SbaTorresBrasilUnitHealthRollup['status'],
    }
  })
  .sort((a, b) => b.totalAlerts - a.totalAlerts || a.unitName.localeCompare(b.unitName))

export const sbaTorresBrasilSystemsWithOccurrences = new Set(
  sbaTorresBrasilMonthlyEquipmentSnapshots
    .map((snapshot) => snapshot.name)
    .filter((systemName) => sbaTorresBrasilSystems.some((system) => system.systemName === systemName))
)
