import { DragEvent, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { AlertTriangle, CalendarClock, GripVertical, Wrench } from 'lucide-react'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { useScope } from '@/hooks/useScope'
import { useAuth } from '@/hooks/useAuth'
import { findEquipmentCatalogItem } from '@/lib/equipmentCatalog'
import { loadEquipmentSchedules, loadKanbanStates, moveEquipmentKanbanCard } from '@/lib/maintenanceWorkflowStorage'
import { mockAlarms } from '@/lib/mockData'
import { westCorpAlarms } from '@/lib/westCorpOperationalData'
import { AlertKanbanColumn, Alarm, EquipmentHistoryTarget, MaintenanceSchedule } from '@/types'

type BoardCard = {
  equipment: EquipmentHistoryTarget
  alarms: Alarm[]
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

function isAlarmScoped(alarm: Alarm, selectedClient: string, selectedSite: string) {
  const alarmEquipment = findEquipmentCatalogItem(alarm.equipmentId)
  const matchesClient = selectedClient === 'all-clients' || alarm.clientName === selectedClient
  const matchesSite = selectedSite === 'all-sites' || alarmEquipment?.siteId === selectedSite

  return matchesClient && matchesSite
}

function groupScopedAlarms(selectedClient: string, selectedSite: string) {
  const alarms = [...mockAlarms, ...westCorpAlarms].filter((alarm) => isAlarmScoped(alarm, selectedClient, selectedSite))
  const activeAlarms = alarms.filter((alarm) => alarm.status !== 'resolved')

  return activeAlarms.reduce<Map<string, Alarm[]>>((accumulator, alarm) => {
    const current = accumulator.get(alarm.equipmentId) ?? []
    current.push(alarm)
    accumulator.set(alarm.equipmentId, current)
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

export function AlertManagement() {
  const { selectedClient, selectedSite } = useScope()
  const { user } = useAuth()
  const [version, setVersion] = useState(0)
  const [draggingId, setDraggingId] = useState<string | null>(null)
  const kanbanStates = useMemo(() => loadKanbanStates(), [version])

  const boardCards = useMemo(() => {
    const groupedAlarms = groupScopedAlarms(selectedClient, selectedSite)
    const equipmentIds = new Set(groupedAlarms.keys())

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
        const schedules = loadEquipmentSchedules(equipmentId)
        const openSchedules = schedules.filter((schedule) => schedule.status === 'Agendado' || schedule.status === 'Em andamento')
        const state = kanbanStates[equipmentId]

        if (state?.archived && openSchedules.length === 0) {
          return
        }

        const column = state?.status ?? (openSchedules.length > 0 ? getColumnFromSchedules(openSchedules) : 'pending')

        resolvedCards.push({
          equipment,
          alarms,
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

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestao de Alertas</h1>
          <p className="text-gray-500">
            Kanban operacional dos equipamentos com alertas ativos e agendamentos abertos no escopo atual.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
          {COLUMN_META.map((column) => {
            const cards = boardCards.filter((card) => card.column === column.id)

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
                    cards.map((card) => (
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
                          <span className="rounded-full bg-danger/10 px-3 py-1 text-xs font-semibold text-danger">
                            {card.alarms.length} alertas
                          </span>
                        </div>

                        <div className="mt-4 grid grid-cols-2 gap-3 text-center">
                          <div className="rounded-xl bg-slate-50 p-3">
                            <p className="text-xs text-gray-500">Saúde</p>
                            <p className="mt-1 text-lg font-bold text-gray-900">{card.equipment.health}%</p>
                          </div>
                          <div className="rounded-xl bg-slate-50 p-3">
                            <p className="text-xs text-gray-500">Agendamentos abertos</p>
                            <p className="mt-1 text-lg font-bold text-gray-900">{card.openSchedules.length}</p>
                          </div>
                        </div>

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
                    ))
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
