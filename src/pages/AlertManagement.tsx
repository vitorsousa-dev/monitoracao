import { DragEvent, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { AlertTriangle, CalendarClock, GripVertical, Wrench, ChevronDown, ChevronUp, ShieldCheck, ShieldAlert, TrendingUp } from 'lucide-react'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { useScope } from '@/hooks/useScope'
import { useAuth } from '@/hooks/useAuth'
import { AcknowledgeAlarmAction } from '@/components/alarms/AcknowledgeAlarmAction'
import { AcknowledgmentHeaderCards } from '@/components/alarms/AcknowledgeAlarmAction'
import { equipmentCatalog, findEquipmentCatalogItem } from '@/lib/equipmentCatalog'
import { loadEquipmentSchedules, loadKanbanStates, moveEquipmentKanbanCard } from '@/lib/maintenanceWorkflowStorage'
import { mockAlarms } from '@/lib/mockData'
import { loadAllPredictiveTasks, isPredictiveTaskScoped } from '@/lib/predictiveTaskStorage'
import { sbaTorresBrasilSystems } from '@/lib/sbaTorresBrasilData'
import { sbaTorresBrasilAlarms } from '@/lib/sbaTorresBrasilOperationalData'
import { wellnesstecSystems } from '@/lib/wellnesstecData'
import { wellnesstecAlarms } from '@/lib/wellnesstecOperationalData'
import { westCorpSystems } from '@/lib/westCorpData'
import { westCorpAlarms } from '@/lib/westCorpOperationalData'
import { useAlarmAcknowledgments, applyAckDiscountToHealth } from '@/lib/alarmAcknowledgmentStorage'
import { AlertKanbanColumn, Alarm, EquipmentHistoryTarget, MaintenanceSchedule, PredictiveTask, SiteSystemCatalog } from '@/types'

type BoardCard = {
  equipment: EquipmentHistoryTarget
  alarms: Alarm[]
  anomalies: PredictiveTask[]
  openSchedules: MaintenanceSchedule[]
  column: AlertKanbanColumn
  lastMovement?: string
  lastActor?: string
}

const COLUMN_META: Array<{
  id: AlertKanbanColumn
  title: string
  description: string
}> = [
  {
    id: 'pending',
    title: 'Ainda nao realizado',
    description: 'Equipamentos aguardando atendimento.',
  },
  {
    id: 'in_progress',
    title: 'Em tratamento',
    description: 'Equipamentos sendo analisados.',
  },
  {
    id: 'completed',
    title: 'Concluido',
    description: 'Problemas resolvidos.',
  },
]

const ALL_STRUCTURED_SYSTEMS: SiteSystemCatalog[] = [
  ...westCorpSystems,
  ...sbaTorresBrasilSystems,
  ...wellnesstecSystems,
]

function normalize(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
}

function slugify(value: string) {
  return normalize(value)
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function findSystemForAlarm(alarm: Alarm): SiteSystemCatalog | null {
  const alarmEquipment = findEquipmentCatalogItem(alarm.equipmentId)
  const normalizedArea = normalize(alarm.areaName ?? '')
  const normalizedEquipName = normalize(alarmEquipment?.name ?? '')

  for (const system of ALL_STRUCTURED_SYSTEMS) {
    const normalizedSystemName = normalize(system.systemName)
    if (alarmEquipment?.client && alarmEquipment.client !== system.client) continue
    if (alarmEquipment?.siteId && alarmEquipment.siteId !== system.siteId) continue

    if (normalizedArea && normalizedArea.includes(normalizedSystemName.slice(0, 8))) return system
    if (normalizedEquipName.includes(normalizedSystemName.slice(0, 8))) return system
    if (system.id === alarm.equipmentId) return system
    if (system.outdoorUnits.some((odu) => normalize(odu).includes(normalizedEquipName.slice(0, 8)))) return system
    if (system.id.includes(slugify(alarm.equipmentId))) return system
    if (normalizedSystemName === normalizedArea) return system
  }

  for (const system of ALL_STRUCTURED_SYSTEMS) {
    if (alarmEquipment?.client && alarmEquipment.client !== system.client) continue
    if (alarmEquipment?.siteId && alarmEquipment.siteId !== system.siteId) continue
    if (system.internalUnits.some((idu) => normalize(idu).includes(normalizedEquipName.slice(0, 8)))) return system
  }

  return null
}

function findUnitCatalogEntry(system: SiteSystemCatalog, unitName: string): EquipmentHistoryTarget | null {
  const normalizedUnitName = normalize(unitName)
  const direct = equipmentCatalog.find((entry) => {
    if (entry.siteId !== system.siteId) return false
    return normalize(entry.name).includes(normalizedUnitName.slice(0, 8)) || normalizedUnitName.includes(normalize(entry.name).slice(0, 8))
  })
  if (direct) return direct

  const id = `${system.id}-${slugify(unitName)}`
  const catalogById = equipmentCatalog.find((entry) => entry.id === id)
  if (catalogById) return catalogById

  return null
}

function isAlarmScoped(alarm: Alarm, selectedClient: string, selectedSite: string) {
  const alarmEquipment = findEquipmentCatalogItem(alarm.equipmentId)
  const matchesClient = selectedClient === 'all-clients' || alarm.clientName === selectedClient
  const matchesSite = selectedSite === 'all-sites' || alarmEquipment?.siteId === selectedSite

  return matchesClient && matchesSite
}

function groupScopedAlarms(selectedClient: string, selectedSite: string) {
  const alarms = [...mockAlarms, ...westCorpAlarms, ...sbaTorresBrasilAlarms, ...wellnesstecAlarms].filter((alarm) =>
    isAlarmScoped(alarm, selectedClient, selectedSite)
  )
  const activeAlarms = alarms.filter((alarm) => alarm.status !== 'resolved')

  return activeAlarms.reduce<Map<string, Alarm[]>>((accumulator, alarm) => {
    const push = (targetId: string) => {
      const current = accumulator.get(targetId) ?? []
      current.push(alarm)
      accumulator.set(targetId, current)
    }

    push(alarm.equipmentId)

    const alarmEquipment = findEquipmentCatalogItem(alarm.equipmentId)
    if (alarmEquipment && (alarmEquipment.source === 'equipment' || alarmEquipment.source.endsWith('-unit'))) {
      return accumulator
    }

    const system = findSystemForAlarm(alarm)
    if (!system) return accumulator

    const systemMatchesClient = selectedClient === 'all-clients' || system.client === selectedClient
    const systemMatchesSite = selectedSite === 'all-sites' || system.siteId === selectedSite
    if (!systemMatchesClient || !systemMatchesSite) return accumulator

    system.internalUnits.forEach((unitName) => {
      const unitEntry = findUnitCatalogEntry(system, unitName)
      if (unitEntry) push(unitEntry.id)
    })

    return accumulator
  }, new Map())
}

function groupScopedAnomalies(selectedClient: string, selectedSite: string) {
  const predictiveTasks = loadAllPredictiveTasks()
    .filter((task) => isPredictiveTaskScoped(task, selectedClient, selectedSite))
    .filter((task) => task.status !== 'completed')

  return predictiveTasks.reduce<Map<string, PredictiveTask[]>>((accumulator, task) => {
    const current = accumulator.get(task.equipmentId) ?? []
    current.push(task)
    accumulator.set(task.equipmentId, current)
    return accumulator
  }, new Map())
}

function isEquipmentScoped(equipment: EquipmentHistoryTarget, selectedClient: string, selectedSite: string) {
  const matchesClient = selectedClient === 'all-clients' || equipment.client === selectedClient
  const matchesSite = selectedSite === 'all-sites' || equipment.siteId === selectedSite
  return matchesClient && matchesSite
}

function getColumnFromSchedules(schedules: MaintenanceSchedule[]): AlertKanbanColumn {
  const inProgress = schedules.some((schedule) => schedule.status === 'Em andamento')
  if (inProgress) {
    return 'in_progress'
  }

  const pending = schedules.some((schedule) => schedule.status === 'Agendado')
  return pending ? 'pending' : 'completed'
}

function getColumnFromAnomalies(anomalies: PredictiveTask[]): AlertKanbanColumn {
  if (anomalies.some((task) => task.status === 'in_progress')) {
    return 'in_progress'
  }

  return 'pending'
}

export function AlertManagement() {
  const { selectedClient, selectedSite } = useScope()
  const { user } = useAuth()
  const { ackStore, weightStore, isAcknowledged } = useAlarmAcknowledgments()
  const [version, setVersion] = useState(0)
  const [draggingId, setDraggingId] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<'active' | 'acknowledged' | 'all'>('active')
  const [expandedAlarmsFor, setExpandedAlarmsFor] = useState<Record<string, boolean>>({})
  const kanbanStates = useMemo(() => loadKanbanStates(), [version, ackStore])

  const flatAllAlarms = useMemo(() => {
    const pool = [...mockAlarms, ...westCorpAlarms, ...sbaTorresBrasilAlarms, ...wellnesstecAlarms]
    const expanded: Alarm[] = []
    pool.forEach((alarm) => {
      if (!isAlarmScoped(alarm, selectedClient, selectedSite)) return
      expanded.push(alarm)
      const alarmEquipment = findEquipmentCatalogItem(alarm.equipmentId)
      if (alarmEquipment && (alarmEquipment.source === 'equipment' || alarmEquipment.source.endsWith('-unit'))) {
        return
      }
      const system = findSystemForAlarm(alarm)
      if (!system) return
      const systemMatchesClient = selectedClient === 'all-clients' || system.client === selectedClient
      const systemMatchesSite = selectedSite === 'all-sites' || system.siteId === selectedSite
      if (!systemMatchesClient || !systemMatchesSite) return
      system.internalUnits.forEach((unitName) => {
        const unitEntry = findUnitCatalogEntry(system, unitName)
        if (unitEntry) {
          expanded.push({
            ...alarm,
            id: `${alarm.id}--${unitEntry.id}`,
            equipmentId: unitEntry.id,
            equipmentName: unitEntry.name,
            areaName: system.systemName,
          })
        }
      })
    })
    return expanded
  }, [selectedClient, selectedSite])

  const boardCards = useMemo(() => {
    const groupedAlarms = groupScopedAlarms(selectedClient, selectedSite)
    const groupedAnomalies = groupScopedAnomalies(selectedClient, selectedSite)
    const equipmentIds = new Set([...groupedAlarms.keys(), ...groupedAnomalies.keys()])

    Object.keys(kanbanStates).forEach((equipmentId) => {
      const equipment = findEquipmentCatalogItem(equipmentId)
      if (!equipment || !isEquipmentScoped(equipment, selectedClient, selectedSite)) {
        return
      }

      const openSchedules = loadEquipmentSchedules(equipmentId).filter(
        (schedule) => schedule.status === 'Agendado' || schedule.status === 'Em andamento'
      )

      if (openSchedules.length > 0 || !kanbanStates[equipmentId].archived) {
        equipmentIds.add(equipmentId)
      }
    })

    const resolvedCards: BoardCard[] = []

    Array.from(equipmentIds).forEach((equipmentId) => {
        const equipment = findEquipmentCatalogItem(equipmentId)
        if (!equipment || !isEquipmentScoped(equipment, selectedClient, selectedSite)) {
          return
        }

        const alarms = groupedAlarms.get(equipmentId) ?? []
        const anomalies = groupedAnomalies.get(equipmentId) ?? []
        const schedules = loadEquipmentSchedules(equipmentId)
        const openSchedules = schedules.filter((schedule) => schedule.status === 'Agendado' || schedule.status === 'Em andamento')
        const state = kanbanStates[equipmentId]

        if (state?.archived && openSchedules.length === 0 && alarms.length === 0 && anomalies.length === 0) {
          return
        }

        const column =
          state?.status ??
          (openSchedules.length > 0
            ? getColumnFromSchedules(openSchedules)
            : anomalies.length > 0
              ? getColumnFromAnomalies(anomalies)
              : 'pending')

        resolvedCards.push({
          equipment,
          alarms,
          anomalies,
          openSchedules,
          column,
          lastMovement: state?.updatedAt,
          lastActor: state?.updatedBy,
        })
      })

    return resolvedCards.sort((a, b) => {
        const alarmDelta = b.alarms.length - a.alarms.length
        if (alarmDelta !== 0) return alarmDelta
        return a.equipment.name.localeCompare(b.equipment.name)
      })
  }, [kanbanStates, selectedClient, selectedSite])

  const filteredCardsByView = useMemo(
    () =>
      boardCards.map((card) => {
        const alarmsFiltered = card.alarms.filter((a) => {
          if (viewMode === 'active') return !isAcknowledged(a.id)
          if (viewMode === 'acknowledged') return isAcknowledged(a.id)
          return true
        })
        return { ...card, alarms: alarmsFiltered }
      }).filter((card) => {
        if (viewMode === 'acknowledged') return card.alarms.length > 0 || card.anomalies.length > 0 || card.openSchedules.length > 0
        return card.alarms.length > 0 || card.anomalies.length > 0 || card.openSchedules.length > 0
      }),
    [boardCards, viewMode, isAcknowledged]
  )

  const canManageBoard = user?.role === 'admin' || user?.role === 'manager'

  const handleDrop = (event: DragEvent<HTMLDivElement>, nextColumn: AlertKanbanColumn) => {
    event.preventDefault()

    if (!canManageBoard || !user) {
      return
    }

    const equipmentId = event.dataTransfer.getData('text/plain')
    const card = boardCards.find((item) => item.equipment.id === equipmentId)
    if (!card || card.column === nextColumn) {
      setDraggingId(null)
      return
    }

    moveEquipmentKanbanCard(card.equipment, nextColumn, user, card.openSchedules[0])
    setDraggingId(null)
    setVersion((current) => current + 1)
  }

  const FilterChip = ({ value, label, count }: { value: 'active' | 'acknowledged' | 'all'; label: string; count: number }) => {
    const active = viewMode === value
    return (
      <button
        type="button"
        onClick={() => setViewMode(value)}
        className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors ${
          active
            ? 'border-primary bg-primary text-white shadow-sm'
            : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
        }`}
      >
        <span>{label}</span>
        <span
          className={`rounded-full px-1.5 py-0.5 text-[10px] ${
            active ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-600'
          }`}
        >
          {count}
        </span>
      </button>
    )
  }

  const countActive = flatAllAlarms.filter((a) => !isAcknowledged(a.id)).length
  const countAck = flatAllAlarms.filter((a) => isAcknowledged(a.id)).length

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestao de Alertas</h1>
          <p className="text-gray-500">
            Kanban operacional dos equipamentos com alertas ativos, anomalias preditivas e agendamentos abertos no escopo atual.
            Reconheca alarmes para ajustar a saude do site em tempo real.
          </p>
        </div>

        <AcknowledgmentHeaderCards alarms={flatAllAlarms} />

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <FilterChip value="active" label="Ativos (lista de impacto)" count={countActive} />
            <FilterChip value="acknowledged" label="Reconhecidos" count={countAck} />
            <FilterChip value="all" label="Todos" count={flatAllAlarms.length} />
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-500">
            {viewMode === 'active' && <span className="inline-flex items-center gap-1"><ShieldAlert className="h-3.5 w-3.5 text-danger" /> Impactando a saude do site</span>}
            {viewMode === 'acknowledged' && <span className="inline-flex items-center gap-1"><ShieldCheck className="h-3.5 w-3.5 text-success" /> Desconto aplicado no calculo</span>}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
          {COLUMN_META.map((column) => {
            const cards = filteredCardsByView.filter((card) => card.column === column.id)

            return (
              <div
                key={column.id}
                onDragOver={(event) => event.preventDefault()}
                onDrop={(event) => handleDrop(event, column.id)}
                className="rounded-2xl border border-gray-200 bg-slate-50 p-4 transition-colors"
              >
                <div className="mb-4">
                  <div className="flex items-center justify-between gap-3">
                    <h2 className="text-lg font-semibold text-gray-900">{column.title}</h2>
                    <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-gray-600">
                      {cards.length} itens
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-gray-500">{column.description}</p>
                </div>

                <div className="space-y-3">
                  {cards.length > 0 ? (
                    cards.map((card) => {
                      const original = boardCards.find((o) => o.equipment.id === card.equipment.id)
                      const allAlarmsForEquipment = original?.alarms ?? []
                      const activeCount = allAlarmsForEquipment.filter((a) => !isAcknowledged(a.id)).length
                      const ackedCount = allAlarmsForEquipment.filter((a) => isAcknowledged(a.id)).length
                      const discount = applyAckDiscountToHealth(card.equipment.health, card.equipment.availability, allAlarmsForEquipment, ackStore, weightStore)
                      const expanded = expandedAlarmsFor[card.equipment.id]
                      const statusColor = discount.health >= 90 ? 'text-success' : discount.health >= 72 ? 'text-warning' : 'text-danger'
                      return (
                      <div
                        key={card.equipment.id}
                        draggable={canManageBoard}
                        onDragStart={(event) => {
                          event.dataTransfer.setData('text/plain', card.equipment.id)
                          setDraggingId(card.equipment.id)
                        }}
                        onDragEnd={() => setDraggingId(null)}
                        className={`rounded-2xl border border-gray-200 bg-white p-4 shadow-sm transition-all duration-200 ${
                          draggingId === card.equipment.id ? 'scale-[0.98] opacity-70 shadow-md' : 'hover:shadow-md'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="flex items-center gap-2">
                              {canManageBoard && <GripVertical className="h-4 w-4 text-gray-400" />}
                              <h3 className="text-base font-semibold text-gray-900">{card.equipment.name}</h3>
                            </div>
                            <p className="mt-1 text-sm text-gray-500">
                              {card.equipment.client}
                              {card.equipment.siteName ? ` • ${card.equipment.siteName}` : ''}
                            </p>
                          </div>
                          <div className="flex flex-col items-end gap-1">
                            {activeCount > 0 && (
                              <span className="rounded-full bg-danger/10 px-3 py-1 text-xs font-semibold text-danger">
                                {activeCount} ativos
                              </span>
                            )}
                            {ackedCount > 0 && (
                              <span className="rounded-full bg-success/10 px-3 py-1 text-xs font-semibold text-success">
                                {ackedCount} reconhecidos
                              </span>
                            )}
                            {activeCount === 0 && ackedCount === 0 && card.anomalies.length > 0 && (
                              <span className="rounded-full bg-warning/10 px-3 py-1 text-xs font-semibold text-warning">
                                {card.anomalies.length} anomalias
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="mt-4 grid grid-cols-3 gap-3 text-center">
                          <div className="rounded-xl bg-slate-50 p-3">
                            <p className="text-xs text-gray-500">Saude base</p>
                            <p className="mt-1 text-lg font-bold text-gray-900">{card.equipment.health}%</p>
                            <p className={`text-[11px] font-semibold ${statusColor} inline-flex items-center gap-1`}>
                              <TrendingUp className="h-3 w-3" />
                              Ajust. {discount.health.toFixed(1)}%
                              {discount.health > card.equipment.health && (
                                <span className="text-success">(+{(discount.health - card.equipment.health).toFixed(1)})</span>
                              )}
                            </p>
                          </div>
                          <div className="rounded-xl bg-slate-50 p-3">
                            <p className="text-xs text-gray-500">Anomalias</p>
                            <p className="mt-1 text-lg font-bold text-gray-900">{card.anomalies.length}</p>
                          </div>
                          <div className="rounded-xl bg-slate-50 p-3">
                            <p className="text-xs text-gray-500">Agendamentos abertos</p>
                            <p className="mt-1 text-lg font-bold text-gray-900">{card.openSchedules.length}</p>
                          </div>
                        </div>

                        {card.anomalies[0] && (
                          <div className="mt-4 rounded-xl border border-warning/20 bg-warning/5 p-3">
                            <p className="text-xs font-semibold uppercase tracking-wide text-warning">Anomalia preditiva</p>
                            <p className="mt-1 text-sm font-medium text-gray-900">{card.anomalies[0].title}</p>
                            <p className="mt-1 text-xs text-gray-500">
                              Status: {card.anomalies[0].status === 'in_progress' ? 'Em andamento' : 'Pendente'} •
                              Risco {card.anomalies[0].riskScore}
                            </p>
                          </div>
                        )}

                        {card.openSchedules[0] && (
                          <div className="mt-4 rounded-xl border border-primary/10 bg-primary/5 p-3">
                            <p className="text-xs font-semibold uppercase tracking-wide text-primary">Agendamento aberto</p>
                            <p className="mt-1 text-sm font-medium text-gray-900">
                              {card.openSchedules[0].maintenanceType} • {card.openSchedules[0].status}
                            </p>
                            <p className="mt-1 text-xs text-gray-500">
                              {card.openSchedules[0].date} às {card.openSchedules[0].time} • {card.openSchedules[0].technician}
                            </p>
                          </div>
                        )}

                        {card.lastMovement && (
                          <p className="mt-3 text-xs text-gray-500">
                            Ultima movimentacao: {new Date(card.lastMovement).toLocaleString('pt-BR')}
                            {card.lastActor ? ` por ${card.lastActor}` : ''}
                          </p>
                        )}

                        {allAlarmsForEquipment.length > 0 && (
                          <div className="mt-4 rounded-xl border border-gray-200 bg-slate-50/60 p-3">
                            <button
                              type="button"
                              onClick={() =>
                                setExpandedAlarmsFor((prev) => ({ ...prev, [card.equipment.id]: !prev[card.equipment.id] }))
                              }
                              className="flex w-full items-center justify-between text-left text-xs font-semibold text-gray-700 hover:text-gray-900"
                            >
                              <span className="flex items-center gap-2">
                                <AlertTriangle className="h-3.5 w-3.5 text-warning" />
                                Lista de alarmes ({allAlarmsForEquipment.length}) · ativos {activeCount}, reconhecidos {ackedCount}
                              </span>
                              {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                            </button>
                            {expanded && (
                              <div className="mt-3 space-y-2">
                                {allAlarmsForEquipment.map((alarm) => {
                                  const acked = isAcknowledged(alarm.id)
                                  if (viewMode === 'active' && acked) return null
                                  if (viewMode === 'acknowledged' && !acked) return null
                                  return (
                                    <div key={alarm.id} className={`rounded-lg border p-2.5 text-xs ${acked ? 'border-success/20 bg-success/5' : 'border-gray-200 bg-white'}`}>
                                      <div className="flex items-start justify-between gap-3">
                                        <div className="min-w-0">
                                          <div className="flex flex-wrap items-center gap-1.5">
                                            <span className={`inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${alarm.type === 'critical' ? 'bg-danger/10 text-danger' : alarm.type === 'warning' ? 'bg-warning/10 text-warning' : 'bg-primary/10 text-primary'}`}>
                                              {alarm.type === 'critical' ? 'CRITICO' : alarm.type === 'warning' ? 'AVISO' : 'INFO'}
                                            </span>
                                            <span className="truncate font-medium text-gray-900">{alarm.equipmentName}</span>
                                          </div>
                                          <p className="mt-1 line-clamp-2 text-gray-600">{alarm.message}</p>
                                          <p className="mt-0.5 text-[10px] text-gray-500">
                                            {alarm.createdAt} • {alarm.clientName} • {alarm.areaName}
                                          </p>
                                        </div>
                                        <AcknowledgeAlarmAction alarm={alarm as any} compact />
                                      </div>
                                    </div>
                                  )
                                })}
                              </div>
                            )}
                          </div>
                        )}

                        <div className="mt-4 flex flex-wrap gap-2">
                          <Link
                            to={`/equipment/${card.equipment.id}?tab=scheduling`}
                            className="inline-flex items-center rounded-lg border border-primary/20 bg-primary/5 px-3 py-2 text-xs font-medium text-primary transition-colors hover:bg-primary/10"
                          >
                            <CalendarClock className="mr-2 h-3.5 w-3.5" />
                            Agendamento
                          </Link>
                          <Link
                            to={`/equipment/${card.equipment.id}?tab=history`}
                            className="inline-flex items-center rounded-lg border border-gray-300 px-3 py-2 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-50"
                          >
                            <Wrench className="mr-2 h-3.5 w-3.5" />
                            Timeline
                          </Link>
                        </div>
                      </div>
                    )})
                  ) : (
                    <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-8 text-center">
                      <AlertTriangle className="mx-auto h-6 w-6 text-gray-300" />
                      <p className="mt-3 text-sm font-medium text-gray-700">Nenhum equipamento nesta etapa.</p>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </DashboardLayout>
  )
}
