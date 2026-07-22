import { applyScheduleMaterialConsumption, loadInventoryAssets } from '@/lib/assetInventoryStorage'
import { appendAutomatedEquipmentHistoryEntry } from '@/lib/equipmentHistoryStorage'
import {
  AlertKanbanColumn,
  AlertKanbanState,
  MaintenanceSchedule,
  MaintenanceScheduleDraft,
  MaintenanceScheduleStatus,
  EquipmentHistoryTarget,
  User,
} from '@/types'

const STORAGE_KEY = 'ems-maintenance-workflow-store'

type MaintenanceWorkflowStore = {
  schedulesByEquipment: Record<string, MaintenanceSchedule[]>
  kanbanByEquipment: Record<string, AlertKanbanState>
}

const EMPTY_STORE: MaintenanceWorkflowStore = {
  schedulesByEquipment: {},
  kanbanByEquipment: {},
}

function createId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
}

function loadStore(): MaintenanceWorkflowStore {
  if (typeof window === 'undefined') {
    return EMPTY_STORE
  }

  const rawStore = window.localStorage.getItem(STORAGE_KEY)
  if (!rawStore) {
    return EMPTY_STORE
  }

  try {
    const parsed = JSON.parse(rawStore) as Partial<MaintenanceWorkflowStore>
    return {
      schedulesByEquipment: parsed.schedulesByEquipment ?? {},
      kanbanByEquipment: parsed.kanbanByEquipment ?? {},
    }
  } catch {
    return EMPTY_STORE
  }
}

function saveStore(store: MaintenanceWorkflowStore) {
  if (typeof window === 'undefined') {
    return
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(store))
}

function toKanbanColumn(status: MaintenanceScheduleStatus): AlertKanbanColumn {
  if (status === 'Em andamento') {
    return 'in_progress'
  }

  if (status === 'Finalizado') {
    return 'completed'
  }

  return 'pending'
}

function buildSchedule(
  equipment: EquipmentHistoryTarget,
  draft: MaintenanceScheduleDraft,
  actor: User,
  id?: string,
  createdAt?: string,
  createdBy?: string,
  materialsAppliedAt?: string
): MaintenanceSchedule {
  const now = new Date().toISOString()
  const assets = loadInventoryAssets()
  return {
    id: id ?? createId('schedule'),
    equipmentId: equipment.id,
    equipmentName: equipment.name,
    clientName: equipment.client,
    siteId: equipment.siteId,
    siteName: equipment.siteName,
    date: draft.date,
    time: draft.time,
    technician: draft.technician.trim(),
    maintenanceType: draft.maintenanceType,
    priority: draft.priority,
    observations: draft.observations.trim(),
    materialsUsed: draft.materialsUsed.map((material) => ({
      id: `${material.assetId}-${material.quantity}`,
      assetId: material.assetId,
      assetName: assets.find((asset) => asset.id === material.assetId)?.name ?? material.assetId,
      quantity: material.quantity,
      unit: assets.find((asset) => asset.id === material.assetId)?.unit ?? '',
      observations: material.observations.trim(),
    })),
    status: draft.status,
    materialsAppliedAt,
    createdAt: createdAt ?? now,
    createdBy: createdBy ?? actor.name,
    updatedAt: now,
    updatedBy: actor.name,
  }
}

function finalizeScheduleMaterialsIfNeeded(
  equipment: EquipmentHistoryTarget,
  schedule: MaintenanceSchedule,
  actor: User
): MaintenanceSchedule {
  if (schedule.status !== 'Finalizado' || schedule.materialsAppliedAt || schedule.materialsUsed.length === 0) {
    return schedule
  }

  applyScheduleMaterialConsumption(equipment, schedule, actor)
  return {
    ...schedule,
    materialsAppliedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    updatedBy: actor.name,
  }
}

function setKanbanState(
  store: MaintenanceWorkflowStore,
  equipmentId: string,
  actor: User,
  status: AlertKanbanColumn,
  archived: boolean
) {
  return {
    ...store.kanbanByEquipment,
    [equipmentId]: {
      equipmentId,
      status,
      archived,
      updatedAt: new Date().toISOString(),
      updatedBy: actor.name,
    },
  }
}

export function loadEquipmentSchedules(equipmentId: string) {
  const store = loadStore()
  return store.schedulesByEquipment[equipmentId] ?? []
}

export function loadAllEquipmentSchedules() {
  const store = loadStore()
  return Object.values(store.schedulesByEquipment).flat()
}

export function loadKanbanStates() {
  const store = loadStore()
  return store.kanbanByEquipment
}

export function createEquipmentSchedule(equipment: EquipmentHistoryTarget, draft: MaintenanceScheduleDraft, actor: User) {
  const store = loadStore()
  const nextSchedule = finalizeScheduleMaterialsIfNeeded(equipment, buildSchedule(equipment, draft, actor), actor)
  const nextSchedules = [nextSchedule, ...(store.schedulesByEquipment[equipment.id] ?? [])]
  const nextStore: MaintenanceWorkflowStore = {
    schedulesByEquipment: {
      ...store.schedulesByEquipment,
      [equipment.id]: nextSchedules,
    },
    kanbanByEquipment:
      draft.status === 'Finalizado' || draft.status === 'Cancelado'
        ? store.kanbanByEquipment
        : setKanbanState(store, equipment.id, actor, toKanbanColumn(draft.status), false),
  }

  saveStore(nextStore)
  appendAutomatedEquipmentHistoryEntry(equipment, actor, {
    actionType: 'Agendamento',
    description: `Agendamento criado para ${draft.date} às ${draft.time}.`,
    observations: [
      `Tecnico responsavel: ${draft.technician.trim() || 'Nao informado'}.`,
      `Tipo de manutencao: ${draft.maintenanceType}.`,
      `Prioridade: ${draft.priority}.`,
      `Status inicial: ${draft.status}.`,
      draft.materialsUsed.length > 0
        ? `Materiais reservados: ${nextSchedule.materialsUsed
            .map((material) => `${material.assetName} (${material.quantity} ${material.unit || 'un'})`)
            .join(', ')}.`
        : '',
      draft.observations.trim() ? `Observacao: ${draft.observations.trim()}` : '',
    ]
      .filter(Boolean)
      .join(' '),
  })
}

export function updateEquipmentSchedule(
  equipment: EquipmentHistoryTarget,
  scheduleId: string,
  draft: MaintenanceScheduleDraft,
  actor: User
) {
  const store = loadStore()
  const currentSchedules = store.schedulesByEquipment[equipment.id] ?? []
  const existingSchedule = currentSchedules.find((schedule) => schedule.id === scheduleId)

  if (!existingSchedule) {
    return
  }

  const nextSchedules = currentSchedules.map((schedule) =>
    schedule.id === scheduleId
      ? finalizeScheduleMaterialsIfNeeded(
          equipment,
          buildSchedule(
            equipment,
            draft,
            actor,
            schedule.id,
            schedule.createdAt,
            schedule.createdBy,
            schedule.materialsAppliedAt
          ),
          actor
        )
      : schedule
  )

  let nextKanban = store.kanbanByEquipment
  if (draft.status === 'Finalizado' || draft.status === 'Cancelado') {
    nextKanban = setKanbanState(store, equipment.id, actor, 'completed', true)
  } else {
    nextKanban = setKanbanState(store, equipment.id, actor, toKanbanColumn(draft.status), false)
  }

  saveStore({
    schedulesByEquipment: {
      ...store.schedulesByEquipment,
      [equipment.id]: nextSchedules,
    },
    kanbanByEquipment: nextKanban,
  })

  appendAutomatedEquipmentHistoryEntry(equipment, actor, {
    actionType: draft.status === 'Finalizado' ? 'Conclusao' : draft.status === 'Cancelado' ? 'Atualizacao' : 'Agendamento',
    description: `Agendamento atualizado para o status ${draft.status}.`,
    observations: [
      `Tecnico responsavel: ${draft.technician.trim() || 'Nao informado'}.`,
      `Tipo de manutencao: ${draft.maintenanceType}.`,
      `Prioridade: ${draft.priority}.`,
      draft.materialsUsed.length > 0
        ? `Materiais reservados: ${nextSchedules
            .find((schedule) => schedule.id === scheduleId)
            ?.materialsUsed.map((material) => `${material.assetName} (${material.quantity} ${material.unit || 'un'})`)
            .join(', ')}.`
        : '',
      draft.observations.trim() ? `Observacao: ${draft.observations.trim()}` : '',
    ]
      .filter(Boolean)
      .join(' '),
  })
}

export function moveEquipmentKanbanCard(
  equipment: EquipmentHistoryTarget,
  nextStatus: AlertKanbanColumn,
  actor: User,
  relatedOpenSchedule?: MaintenanceSchedule
) {
  const store = loadStore()
  const nextKanban = setKanbanState(store, equipment.id, actor, nextStatus, false)
  let nextSchedulesByEquipment = store.schedulesByEquipment

  if (relatedOpenSchedule) {
    const mappedStatus: MaintenanceScheduleStatus =
      nextStatus === 'pending' ? 'Agendado' : nextStatus === 'in_progress' ? 'Em andamento' : 'Finalizado'

    const updatedSchedules = (store.schedulesByEquipment[equipment.id] ?? []).map((schedule) =>
      schedule.id === relatedOpenSchedule.id
        ? finalizeScheduleMaterialsIfNeeded(equipment, {
            ...schedule,
            status: mappedStatus,
            updatedAt: new Date().toISOString(),
            updatedBy: actor.name,
          }, actor)
        : schedule
    )

    nextSchedulesByEquipment = {
      ...store.schedulesByEquipment,
      [equipment.id]: updatedSchedules,
    }
  }

  saveStore({
    schedulesByEquipment: nextSchedulesByEquipment,
    kanbanByEquipment: nextKanban,
  })

  appendAutomatedEquipmentHistoryEntry(equipment, actor, {
    actionType: 'Atualizacao',
    description: `Equipamento movido para ${nextStatus === 'pending' ? 'AINDA NAO REALIZADO' : nextStatus === 'in_progress' ? 'EM TRATAMENTO' : 'CONCLUIDO'}.`,
    observations: [
      `Movido por ${actor.name}.`,
      `Data e hora: ${new Date().toLocaleString('pt-BR')}.`,
      relatedOpenSchedule
        ? `Agendamento sincronizado automaticamente para ${nextStatus === 'pending' ? 'Agendado' : nextStatus === 'in_progress' ? 'Em andamento' : 'Finalizado'}.`
        : '',
    ]
      .filter(Boolean)
      .join(' '),
  })
}

export function registerScheduleStep(
  equipment: EquipmentHistoryTarget,
  scheduleId: string,
  actor: User,
  stepLabel: string
) {
  const store = loadStore()
  const currentSchedules = store.schedulesByEquipment[equipment.id] ?? []
  const targetSchedule = currentSchedules.find((schedule) => schedule.id === scheduleId)

  if (!targetSchedule) {
    return
  }

  let nextStatus = targetSchedule.status
  if (stepLabel === 'Equipamento em manutencao') {
    nextStatus = 'Em andamento'
  }
  if (stepLabel === 'Concluido') {
    nextStatus = 'Finalizado'
  }

  const nextSchedules = currentSchedules.map((schedule) =>
    schedule.id === scheduleId
      ? finalizeScheduleMaterialsIfNeeded(equipment, {
          ...schedule,
          status: nextStatus,
          updatedAt: new Date().toISOString(),
          updatedBy: actor.name,
        }, actor)
      : schedule
  )

  let nextKanban = store.kanbanByEquipment
  if (nextStatus === 'Finalizado' || nextStatus === 'Cancelado') {
    nextKanban = setKanbanState(store, equipment.id, actor, 'completed', true)
  } else {
    nextKanban = setKanbanState(store, equipment.id, actor, toKanbanColumn(nextStatus), false)
  }

  saveStore({
    schedulesByEquipment: {
      ...store.schedulesByEquipment,
      [equipment.id]: nextSchedules,
    },
    kanbanByEquipment: nextKanban,
  })

  appendAutomatedEquipmentHistoryEntry(equipment, actor, {
    actionType: stepLabel === 'Concluido' ? 'Conclusao' : 'Atualizacao',
    description: `Etapa do agendamento registrada: ${stepLabel}.`,
    observations: `Agendamento ${targetSchedule.maintenanceType} para ${targetSchedule.date} às ${targetSchedule.time}. Responsavel pela acao: ${actor.name}.`,
  })
}
