import {
  EquipmentHistoryAttachment,
  EquipmentHistoryAuditEvent,
  EquipmentHistoryEntry,
  EquipmentHistoryEntryDraft,
  EquipmentHistoryTarget,
  User,
} from '@/types'

const STORAGE_KEY = 'ems-equipment-history-store'

type EquipmentHistoryStore = {
  entriesByEquipment: Record<string, EquipmentHistoryEntry[]>
  auditByEquipment: Record<string, EquipmentHistoryAuditEvent[]>
}

const EMPTY_STORE: EquipmentHistoryStore = {
  entriesByEquipment: {},
  auditByEquipment: {},
}

function createId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
}

function loadStore(): EquipmentHistoryStore {
  if (typeof window === 'undefined') {
    return EMPTY_STORE
  }

  const rawStore = window.localStorage.getItem(STORAGE_KEY)
  if (!rawStore) {
    return EMPTY_STORE
  }

  try {
    const parsed = JSON.parse(rawStore) as Partial<EquipmentHistoryStore>
    return {
      entriesByEquipment: parsed.entriesByEquipment ?? {},
      auditByEquipment: parsed.auditByEquipment ?? {},
    }
  } catch {
    return EMPTY_STORE
  }
}

function saveStore(store: EquipmentHistoryStore) {
  if (typeof window === 'undefined') {
    return
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(store))
}

function addEntryToStore(
  store: EquipmentHistoryStore,
  equipment: EquipmentHistoryTarget,
  entry: EquipmentHistoryEntry,
  actor: User,
  action: EquipmentHistoryAuditEvent['action'],
  summary: string
) {
  return {
    entriesByEquipment: {
      ...store.entriesByEquipment,
      [equipment.id]: [entry, ...(store.entriesByEquipment[equipment.id] ?? [])],
    },
    auditByEquipment: {
      ...store.auditByEquipment,
      [equipment.id]: [
        buildAuditEvent(equipment.id, actor, action, summary, entry.id),
        ...(store.auditByEquipment[equipment.id] ?? []),
      ],
    },
  }
}

function buildAuditEvent(
  equipmentId: string,
  actor: User,
  action: EquipmentHistoryAuditEvent['action'],
  summary: string,
  entryId?: string
): EquipmentHistoryAuditEvent {
  return {
    id: createId('history-audit'),
    equipmentId,
    entryId,
    action,
    actorId: actor.id,
    actorName: actor.name,
    timestamp: new Date().toISOString(),
    summary,
  }
}

export function loadEquipmentHistory(equipmentId: string) {
  const store = loadStore()
  return {
    entries: store.entriesByEquipment[equipmentId] ?? [],
    auditTrail: store.auditByEquipment[equipmentId] ?? [],
  }
}

export function createEquipmentHistoryEntry(
  equipment: EquipmentHistoryTarget,
  draft: EquipmentHistoryEntryDraft,
  actor: User
) {
  const store = loadStore()
  const timestamp = new Date().toISOString()
  const nextEntry: EquipmentHistoryEntry = {
    id: createId('history-entry'),
    equipmentId: equipment.id,
    equipmentName: equipment.name,
    clientName: equipment.client,
    siteId: equipment.siteId,
    siteName: equipment.siteName,
    date: draft.date,
    time: draft.time,
    responsibleUser: draft.responsibleUser.trim(),
    actionType: draft.actionType,
    description: draft.description.trim(),
    observations: draft.observations.trim(),
    attachments: draft.attachments,
    photos: draft.photos,
    createdAt: timestamp,
    createdBy: actor.name,
    updatedAt: timestamp,
    updatedBy: actor.name,
  }
  saveStore(addEntryToStore(store, equipment, nextEntry, actor, 'created', `Criou o registro "${draft.actionType}".`))
}

export function updateEquipmentHistoryEntry(
  equipment: EquipmentHistoryTarget,
  entryId: string,
  draft: EquipmentHistoryEntryDraft,
  actor: User
) {
  const store = loadStore()
  const currentEntries = store.entriesByEquipment[equipment.id] ?? []
  const nextEntries = currentEntries.map((entry) =>
    entry.id === entryId
      ? {
          ...entry,
          date: draft.date,
          time: draft.time,
          responsibleUser: draft.responsibleUser.trim(),
          actionType: draft.actionType,
          description: draft.description.trim(),
          observations: draft.observations.trim(),
          attachments: draft.attachments,
          photos: draft.photos,
          updatedAt: new Date().toISOString(),
          updatedBy: actor.name,
        }
      : entry
  )

  const nextAudit = [
    buildAuditEvent(equipment.id, actor, 'updated', `Atualizou o registro "${draft.actionType}".`, entryId),
    ...(store.auditByEquipment[equipment.id] ?? []),
  ]

  saveStore({
    entriesByEquipment: {
      ...store.entriesByEquipment,
      [equipment.id]: nextEntries,
    },
    auditByEquipment: {
      ...store.auditByEquipment,
      [equipment.id]: nextAudit,
    },
  })
}

export function deleteEquipmentHistoryEntry(equipment: EquipmentHistoryTarget, entryId: string, actor: User) {
  const store = loadStore()
  const currentEntries = store.entriesByEquipment[equipment.id] ?? []
  const targetEntry = currentEntries.find((entry) => entry.id === entryId)
  const nextEntries = currentEntries.filter((entry) => entry.id !== entryId)
  const nextAudit = [
    buildAuditEvent(
      equipment.id,
      actor,
      'deleted',
      `Excluiu o registro "${targetEntry?.actionType ?? 'Historico'}".`,
      entryId
    ),
    ...(store.auditByEquipment[equipment.id] ?? []),
  ]

  saveStore({
    entriesByEquipment: {
      ...store.entriesByEquipment,
      [equipment.id]: nextEntries,
    },
    auditByEquipment: {
      ...store.auditByEquipment,
      [equipment.id]: nextAudit,
    },
  })
}

export function appendAutomatedEquipmentHistoryEntry(
  equipment: EquipmentHistoryTarget,
  actor: User,
  {
    actionType = 'Atualizacao',
    description,
    observations = '',
    responsibleUser,
  }: {
    actionType?: EquipmentHistoryEntryDraft['actionType']
    description: string
    observations?: string
    responsibleUser?: string
  }
) {
  const store = loadStore()
  const now = new Date()
  const timestamp = now.toISOString()
  const nextEntry: EquipmentHistoryEntry = {
    id: createId('history-entry'),
    equipmentId: equipment.id,
    equipmentName: equipment.name,
    clientName: equipment.client,
    siteId: equipment.siteId,
    siteName: equipment.siteName,
    date: now.toISOString().slice(0, 10),
    time: now.toTimeString().slice(0, 5),
    responsibleUser: responsibleUser?.trim() || actor.name,
    actionType,
    description: description.trim(),
    observations: observations.trim(),
    attachments: [],
    photos: [],
    createdAt: timestamp,
    createdBy: actor.name,
    updatedAt: timestamp,
    updatedBy: actor.name,
  }

  saveStore(
    addEntryToStore(
      store,
      equipment,
      nextEntry,
      actor,
      'created',
      `Registrou automaticamente o evento "${actionType}".`
    )
  )
}

export function fileToStoredAttachment(file: File): Promise<EquipmentHistoryAttachment> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()

    reader.onload = () => {
      if (typeof reader.result !== 'string') {
        reject(new Error('Falha ao carregar o arquivo.'))
        return
      }

      resolve({
        id: createId('history-file'),
        name: file.name,
        mimeType: file.type || 'application/octet-stream',
        size: file.size,
        dataUrl: reader.result,
      })
    }

    reader.onerror = () => reject(new Error('Falha ao carregar o arquivo.'))
    reader.readAsDataURL(file)
  })
}
