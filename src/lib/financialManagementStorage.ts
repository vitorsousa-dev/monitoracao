import { findEquipmentCatalogItem } from '@/lib/equipmentCatalog'
import { appendAutomatedEquipmentHistoryEntry } from '@/lib/equipmentHistoryStorage'
import {
  AlertKanbanColumn,
  FinancialBudget,
  FinancialEntry,
  FinancialEntryDraft,
  MaintenanceSchedule,
  MaintenanceScheduleStatus,
  User,
} from '@/types'

const STORAGE_KEY = 'ems-financial-management-store'
export const FINANCIAL_MANAGEMENT_UPDATED_EVENT = 'ems-financial-management-updated'

type FinancialManagementStore = {
  entries: FinancialEntry[]
  budgets: FinancialBudget[]
}

const EMPTY_STORE: FinancialManagementStore = {
  entries: [],
  budgets: [],
}

function createId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
}

function toKanbanStatus(status: MaintenanceScheduleStatus): AlertKanbanColumn {
  if (status === 'Em andamento') {
    return 'in_progress'
  }

  if (status === 'Finalizado' || status === 'Cancelado') {
    return 'completed'
  }

  return 'pending'
}

function loadStore(): FinancialManagementStore {
  if (typeof window === 'undefined') {
    return EMPTY_STORE
  }

  const rawStore = window.localStorage.getItem(STORAGE_KEY)
  if (!rawStore) {
    return EMPTY_STORE
  }

  try {
    const parsed = JSON.parse(rawStore) as Partial<FinancialManagementStore>
    return {
      entries: parsed.entries ?? [],
      budgets: parsed.budgets ?? [],
    }
  } catch {
    return EMPTY_STORE
  }
}

function saveStore(store: FinancialManagementStore) {
  if (typeof window === 'undefined') {
    return
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(store))
  window.dispatchEvent(new CustomEvent(FINANCIAL_MANAGEMENT_UPDATED_EVENT))
}

function buildBudgetId(clientName: string, siteId?: string) {
  return siteId ? `${clientName}::${siteId}` : `${clientName}::global`
}

function getScheduleScope(schedule: Pick<MaintenanceSchedule, 'clientName' | 'siteId' | 'siteName'>) {
  return {
    clientName: schedule.clientName,
    siteId: schedule.siteId,
    siteName: schedule.siteName,
  }
}

function getOrCreateBudget(
  store: FinancialManagementStore,
  scope: { clientName: string; siteId?: string; siteName?: string },
  actor?: User
) {
  const budgetId = buildBudgetId(scope.clientName, scope.siteId)
  const existingBudget = store.budgets.find((budget) => budget.id === budgetId)

  if (existingBudget) {
    return existingBudget
  }

  const now = new Date().toISOString()
  const nextBudget: FinancialBudget = {
    id: budgetId,
    clientName: scope.clientName,
    siteId: scope.siteId,
    siteName: scope.siteName,
    currentBalance: 0,
    createdAt: now,
    createdBy: actor?.name ?? 'Sistema',
    updatedAt: now,
    updatedBy: actor?.name ?? 'Sistema',
  }

  store.budgets = [nextBudget, ...store.budgets]
  return nextBudget
}

function buildFinancialEntry(
  schedule: MaintenanceSchedule,
  draft: FinancialEntryDraft,
  actor: User,
  existingEntry?: FinancialEntry
): FinancialEntry {
  const now = new Date().toISOString()

  return {
    id: existingEntry?.id ?? createId('financial'),
    scheduleId: schedule.id,
    equipmentId: schedule.equipmentId,
    equipmentName: schedule.equipmentName,
    clientName: schedule.clientName,
    siteId: schedule.siteId,
    siteName: schedule.siteName,
    maintenanceType: schedule.maintenanceType,
    technician: schedule.technician,
    scheduledDate: schedule.date,
    scheduledTime: schedule.time,
    workflowStatus: schedule.status,
    kanbanStatus: toKanbanStatus(schedule.status),
    plannedRevenue: draft.plannedRevenue,
    laborCost: draft.laborCost,
    materialsCost: draft.materialsCost,
    outsourcedCost: draft.outsourcedCost,
    travelCost: draft.travelCost,
    otherCost: draft.otherCost,
    billedAmount: draft.billedAmount,
    receivedAmount: draft.receivedAmount,
    notes: draft.notes.trim(),
    budgetAppliedAt: existingEntry?.budgetAppliedAt,
    budgetAppliedAmount: existingEntry?.budgetAppliedAmount,
    createdAt: existingEntry?.createdAt ?? now,
    createdBy: existingEntry?.createdBy ?? actor.name,
    updatedAt: now,
    updatedBy: actor.name,
  }
}

function appendFinancialHistory(schedule: MaintenanceSchedule, actor: User, description: string, observations: string) {
  const equipment = findEquipmentCatalogItem(schedule.equipmentId)
  if (!equipment) {
    return
  }

  appendAutomatedEquipmentHistoryEntry(equipment, actor, {
    actionType: 'Atualizacao',
    description,
    observations,
  })
}

export function buildEmptyFinancialEntryDraft(scheduleId = ''): FinancialEntryDraft {
  return {
    scheduleId,
    plannedRevenue: 0,
    laborCost: 0,
    materialsCost: 0,
    outsourcedCost: 0,
    travelCost: 0,
    otherCost: 0,
    billedAmount: 0,
    receivedAmount: 0,
    notes: '',
  }
}

export function loadFinancialEntries() {
  return loadStore().entries
}

export function loadFinancialBudgets() {
  return loadStore().budgets
}

export function loadFinancialBudget(scope: { clientName: string; siteId?: string }) {
  const store = loadStore()
  return store.budgets.find((budget) => budget.id === buildBudgetId(scope.clientName, scope.siteId))
}

export function loadFinancialEntryByScheduleId(scheduleId: string) {
  return loadStore().entries.find((entry) => entry.scheduleId === scheduleId)
}

export function calculateFinancialEntryTotals(entry: Pick<
  FinancialEntry,
  'laborCost' | 'materialsCost' | 'outsourcedCost' | 'travelCost' | 'otherCost' | 'billedAmount' | 'receivedAmount' | 'plannedRevenue'
>) {
  const totalCost = entry.laborCost + entry.materialsCost + entry.outsourcedCost + entry.travelCost + entry.otherCost
  const margin = entry.billedAmount - totalCost
  const pendingToReceive = Math.max(entry.billedAmount - entry.receivedAmount, 0)
  const forecastGap = entry.plannedRevenue - entry.billedAmount

  return {
    totalCost: Number(totalCost.toFixed(2)),
    margin: Number(margin.toFixed(2)),
    pendingToReceive: Number(pendingToReceive.toFixed(2)),
    forecastGap: Number(forecastGap.toFixed(2)),
  }
}

function reconcileBudgetForEntry(
  store: FinancialManagementStore,
  entry: FinancialEntry,
  actor?: User,
  previousEntry?: FinancialEntry
) {
  const scope = getScheduleScope({
    clientName: entry.clientName,
    siteId: entry.siteId,
    siteName: entry.siteName,
  } as MaintenanceSchedule)
  const budget = getOrCreateBudget(store, scope, actor)
  const totalCost = calculateFinancialEntryTotals(entry).totalCost
  const previousAppliedAmount = previousEntry?.budgetAppliedAmount ?? 0
  const wasApplied = Boolean(previousEntry?.budgetAppliedAt)
  const isCompleted = entry.workflowStatus === 'Finalizado'

  if (!isCompleted && wasApplied) {
    budget.currentBalance = Number((budget.currentBalance + previousAppliedAmount).toFixed(2))
    budget.updatedAt = new Date().toISOString()
    budget.updatedBy = actor?.name ?? entry.updatedBy

    return {
      ...entry,
      budgetAppliedAt: undefined,
      budgetAppliedAmount: undefined,
    }
  }

  if (!isCompleted) {
    return {
      ...entry,
      budgetAppliedAt: undefined,
      budgetAppliedAmount: undefined,
    }
  }

  const delta = wasApplied ? totalCost - previousAppliedAmount : totalCost
  if (delta !== 0) {
    budget.currentBalance = Number((budget.currentBalance - delta).toFixed(2))
    budget.updatedAt = new Date().toISOString()
    budget.updatedBy = actor?.name ?? entry.updatedBy
  }

  return {
    ...entry,
    budgetAppliedAt: new Date().toISOString(),
    budgetAppliedAmount: totalCost,
  }
}

export function saveFinancialBudget(
  scope: { clientName: string; siteId?: string; siteName?: string },
  currentBalance: number,
  actor: User
) {
  const store = loadStore()
  const budget = getOrCreateBudget(store, scope, actor)
  const nextBudget: FinancialBudget = {
    ...budget,
    currentBalance,
    updatedAt: new Date().toISOString(),
    updatedBy: actor.name,
  }

  saveStore({
    entries: store.entries,
    budgets: store.budgets.map((entry) => (entry.id === nextBudget.id ? nextBudget : entry)),
  })

  return nextBudget
}

export function saveFinancialEntry(schedule: MaintenanceSchedule, draft: FinancialEntryDraft, actor: User) {
  const store = loadStore()
  const existingEntry = store.entries.find((entry) => entry.scheduleId === schedule.id)
  const builtEntry = buildFinancialEntry(schedule, draft, actor, existingEntry)
  const nextEntry = reconcileBudgetForEntry(store, builtEntry, actor, existingEntry)
  const nextEntries = existingEntry
    ? store.entries.map((entry) => (entry.scheduleId === schedule.id ? nextEntry : entry))
    : [nextEntry, ...store.entries]

  saveStore({
    entries: nextEntries,
    budgets: store.budgets,
  })

  const totals = calculateFinancialEntryTotals(nextEntry)
  appendFinancialHistory(
    schedule,
    actor,
    existingEntry ? 'Lancamento financeiro atualizado.' : 'Lancamento financeiro criado.',
    [
      `Receita prevista: R$ ${nextEntry.plannedRevenue.toFixed(2)}.`,
      `Custo total lancado: R$ ${totals.totalCost.toFixed(2)}.`,
      `Faturado: R$ ${nextEntry.billedAmount.toFixed(2)}.`,
      `Recebido: R$ ${nextEntry.receivedAmount.toFixed(2)}.`,
      nextEntry.notes ? `Observacoes: ${nextEntry.notes}` : '',
    ]
      .filter(Boolean)
      .join(' ')
  )

  return nextEntry
}

export function syncFinancialEntriesWithSchedule(schedule: MaintenanceSchedule, actor?: User) {
  const store = loadStore()
  const existingEntry = store.entries.find((entry) => entry.scheduleId === schedule.id)

  if (!existingEntry) {
    return
  }

  const builtEntry: FinancialEntry = {
    ...existingEntry,
    equipmentId: schedule.equipmentId,
    equipmentName: schedule.equipmentName,
    clientName: schedule.clientName,
    siteId: schedule.siteId,
    siteName: schedule.siteName,
    maintenanceType: schedule.maintenanceType,
    technician: schedule.technician,
    scheduledDate: schedule.date,
    scheduledTime: schedule.time,
    workflowStatus: schedule.status,
    kanbanStatus: toKanbanStatus(schedule.status),
    updatedAt: new Date().toISOString(),
    updatedBy: actor?.name ?? existingEntry.updatedBy,
  }
  const nextEntry = reconcileBudgetForEntry(store, builtEntry, actor, existingEntry)

  saveStore({
    entries: store.entries.map((entry) => (entry.scheduleId === schedule.id ? nextEntry : entry)),
    budgets: store.budgets,
  })

  if (actor) {
    appendFinancialHistory(
      schedule,
      actor,
      'Lancamento financeiro sincronizado com o fluxo operacional.',
      `Status operacional atualizado para ${schedule.status}.`
    )
  }
}
