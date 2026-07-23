import { findEquipmentCatalogItem, SERASA_SITE_ID, SERASA_SITE_NAME } from '@/lib/equipmentCatalog'
import { mockPredictiveTasks } from '@/lib/mockData'
import { PredictiveTask, PredictiveTaskDraft, User } from '@/types'

const PREDICTIVE_TASKS_STORAGE_KEY = 'ems.predictiveTasks.manual.v1'

function getEquipmentFallbackScope(task: PredictiveTask) {
  const equipment = findEquipmentCatalogItem(task.equipmentId)

  return {
    clientName: task.clientName ?? equipment?.client,
    siteId:
      task.siteId ??
      equipment?.siteId ??
      (equipment?.client === 'Serasa Experian' ? SERASA_SITE_ID : undefined),
    siteName:
      task.siteName ??
      equipment?.siteName ??
      (equipment?.client === 'Serasa Experian' ? SERASA_SITE_NAME : undefined),
  }
}

function normalizePredictiveTask(task: PredictiveTask, origin: PredictiveTask['origin']): PredictiveTask {
  const scope = getEquipmentFallbackScope(task)

  return {
    ...task,
    ...scope,
    origin,
  }
}

function sanitizeStoredTask(rawValue: unknown): PredictiveTask | null {
  if (!rawValue || typeof rawValue !== 'object') {
    return null
  }

  const task = rawValue as Partial<PredictiveTask>
  if (
    !task.id ||
    !task.equipmentId ||
    !task.equipmentName ||
    !task.title ||
    !task.description ||
    !task.technicalAnalysis ||
    !Array.isArray(task.detailedAnalysis) ||
    !task.type ||
    !task.priority ||
    !task.dueDate ||
    !task.status ||
    typeof task.riskScore !== 'number' ||
    typeof task.estimatedCost !== 'number'
  ) {
    return null
  }

  return normalizePredictiveTask(
    {
      id: task.id,
      equipmentId: task.equipmentId,
      equipmentName: task.equipmentName,
      clientName: task.clientName,
      siteId: task.siteId,
      siteName: task.siteName,
      type: task.type,
      title: task.title,
      description: task.description,
      technicalAnalysis: task.technicalAnalysis,
      detailedAnalysis: task.detailedAnalysis.filter((item): item is string => typeof item === 'string' && item.trim().length > 0),
      priority: task.priority,
      dueDate: task.dueDate,
      status: task.status,
      riskScore: task.riskScore,
      estimatedCost: task.estimatedCost,
      origin: 'manual',
      createdAt: task.createdAt,
      createdBy: task.createdBy,
      updatedAt: task.updatedAt,
      updatedBy: task.updatedBy,
    },
    'manual'
  )
}

function saveManualPredictiveTasks(tasks: PredictiveTask[]) {
  localStorage.setItem(PREDICTIVE_TASKS_STORAGE_KEY, JSON.stringify(tasks))
}

export function loadManualPredictiveTasks() {
  try {
    const rawValue = localStorage.getItem(PREDICTIVE_TASKS_STORAGE_KEY)
    if (!rawValue) {
      return []
    }

    const parsed = JSON.parse(rawValue)
    if (!Array.isArray(parsed)) {
      return []
    }

    return parsed
      .map((item) => sanitizeStoredTask(item))
      .filter((task): task is PredictiveTask => Boolean(task))
  } catch {
    return []
  }
}

export function loadAllPredictiveTasks() {
  const seedTasks = mockPredictiveTasks.map((task) => normalizePredictiveTask(task, 'seed'))
  const manualTasks = loadManualPredictiveTasks()

  return [...manualTasks, ...seedTasks]
}

export function isPredictiveTaskScoped(task: PredictiveTask, selectedClient: string, selectedSite: string) {
  const resolvedTask = normalizePredictiveTask(task, task.origin ?? 'seed')
  const matchesClient = selectedClient === 'all-clients' || resolvedTask.clientName === selectedClient
  const matchesSite = selectedSite === 'all-sites' || resolvedTask.siteId === selectedSite

  return matchesClient && matchesSite
}

export function createPredictiveTask(draft: PredictiveTaskDraft, actor: User) {
  const equipment = findEquipmentCatalogItem(draft.equipmentId)
  if (!equipment) {
    return {
      success: false,
      message: 'Equipamento nao encontrado para criar a analise preditiva.',
    }
  }

  const now = new Date().toISOString()
  const detailedAnalysis = draft.detailedAnalysis
    .split('\n')
    .map((item) => item.trim())
    .filter(Boolean)

  const nextTask = normalizePredictiveTask(
    {
      id: `predictive-${Date.now()}`,
      equipmentId: equipment.id,
      equipmentName: equipment.name,
      clientName: equipment.client,
      siteId: equipment.siteId,
      siteName: equipment.siteName,
      type: draft.type,
      title: draft.title.trim(),
      description: draft.description.trim(),
      technicalAnalysis: draft.technicalAnalysis.trim(),
      detailedAnalysis,
      priority: draft.priority,
      dueDate: draft.dueDate,
      status: draft.status,
      riskScore: draft.riskScore,
      estimatedCost: draft.estimatedCost,
      origin: 'manual',
      createdAt: now,
      createdBy: actor.name,
      updatedAt: now,
      updatedBy: actor.name,
    },
    'manual'
  )

  const currentTasks = loadManualPredictiveTasks()
  saveManualPredictiveTasks([nextTask, ...currentTasks])

  return {
    success: true,
    task: nextTask,
  }
}
