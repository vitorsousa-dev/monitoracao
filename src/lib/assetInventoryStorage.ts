import { appendAutomatedEquipmentHistoryEntry } from '@/lib/equipmentHistoryStorage'
import {
  EquipmentHistoryTarget,
  InventoryAsset,
  InventoryAssetDraft,
  InventoryMovement,
  InventoryMovementDraft,
  MaintenanceSchedule,
  RefrigerantHistoryDraft,
  RefrigerantHistoryEntry,
  User,
} from '@/types'

const STORAGE_KEY = 'ems-asset-inventory-store'

type AssetInventoryStore = {
  assets: InventoryAsset[]
  movementsByAsset: Record<string, InventoryMovement[]>
  refrigerantByEquipment: Record<string, RefrigerantHistoryEntry[]>
}

const EMPTY_STORE: AssetInventoryStore = {
  assets: [],
  movementsByAsset: {},
  refrigerantByEquipment: {},
}

function createId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
}

function loadStore(): AssetInventoryStore {
  if (typeof window === 'undefined') {
    return EMPTY_STORE
  }

  const rawStore = window.localStorage.getItem(STORAGE_KEY)
  if (!rawStore) {
    return EMPTY_STORE
  }

  try {
    const parsed = JSON.parse(rawStore) as Partial<AssetInventoryStore>
    return {
      assets: parsed.assets ?? [],
      movementsByAsset: parsed.movementsByAsset ?? {},
      refrigerantByEquipment: parsed.refrigerantByEquipment ?? {},
    }
  } catch {
    return EMPTY_STORE
  }
}

function saveStore(store: AssetInventoryStore) {
  if (typeof window === 'undefined') {
    return
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(store))
}

function sanitizeNumber(value: number) {
  if (!Number.isFinite(value)) {
    return 0
  }

  return Number(value.toFixed(3))
}

function buildInventoryAsset(draft: InventoryAssetDraft, actor: User, existingAsset?: InventoryAsset): InventoryAsset {
  const timestamp = new Date().toISOString()
  return {
    id: existingAsset?.id ?? createId('asset'),
    clientName: draft.clientName.trim(),
    siteId: draft.siteId || undefined,
    siteName: draft.siteName?.trim() || undefined,
    name: draft.name.trim(),
    category: draft.category,
    code: draft.code.trim(),
    manufacturer: draft.manufacturer.trim(),
    quantityCurrent: sanitizeNumber(draft.quantityCurrent),
    quantityMinimum: sanitizeNumber(draft.quantityMinimum),
    unit: draft.unit.trim(),
    storageLocation: draft.storageLocation.trim(),
    observations: draft.observations.trim(),
    createdAt: existingAsset?.createdAt ?? timestamp,
    createdBy: existingAsset?.createdBy ?? actor.name,
    updatedAt: timestamp,
    updatedBy: actor.name,
  }
}

function buildMovement(
  asset: InventoryAsset,
  draft: InventoryMovementDraft,
  actor: User,
  relatedScheduleId?: string
): InventoryMovement {
  const timestamp = new Date().toISOString()
  return {
    id: createId('asset-movement'),
    assetId: asset.id,
    assetName: asset.name,
    clientName: asset.clientName,
    siteId: asset.siteId,
    siteName: asset.siteName,
    date: draft.date,
    time: draft.time,
    type: draft.type,
    quantity: sanitizeNumber(draft.quantity),
    unit: asset.unit,
    reason: draft.reason.trim(),
    observations: draft.observations.trim(),
    relatedEquipmentId: draft.relatedEquipmentId,
    relatedEquipmentName: draft.relatedEquipmentName,
    relatedScheduleId,
    createdAt: timestamp,
    createdBy: actor.name,
  }
}

function movementDelta(type: InventoryMovement['type'], quantity: number) {
  if (type === 'Entrada') {
    return quantity
  }

  if (type === 'Saida') {
    return -quantity
  }

  return quantity
}

export function loadInventoryAssets() {
  return loadStore().assets
}

export function loadAssetMovements(assetId: string) {
  return loadStore().movementsByAsset[assetId] ?? []
}

export function loadEquipmentRefrigerantHistory(equipmentId: string) {
  return loadStore().refrigerantByEquipment[equipmentId] ?? []
}

export function createInventoryAsset(draft: InventoryAssetDraft, actor: User) {
  const store = loadStore()
  const nextAsset = buildInventoryAsset(draft, actor)

  saveStore({
    ...store,
    assets: [nextAsset, ...store.assets],
  })
}

export function updateInventoryAsset(assetId: string, draft: InventoryAssetDraft, actor: User) {
  const store = loadStore()
  const existingAsset = store.assets.find((asset) => asset.id === assetId)
  if (!existingAsset) {
    return
  }

  const nextAsset = buildInventoryAsset(draft, actor, existingAsset)
  saveStore({
    ...store,
    assets: store.assets.map((asset) => (asset.id === assetId ? nextAsset : asset)),
  })
}

export function registerInventoryMovement(assetId: string, draft: InventoryMovementDraft, actor: User) {
  const store = loadStore()
  const asset = store.assets.find((item) => item.id === assetId)
  if (!asset) {
    return { success: false, message: 'Ativo de estoque nao encontrado.' }
  }

  const quantity = sanitizeNumber(draft.quantity)
  if (quantity <= 0) {
    return { success: false, message: 'Informe uma quantidade valida.' }
  }

  const delta = movementDelta(draft.type, quantity)
  const nextQuantity = sanitizeNumber(asset.quantityCurrent + delta)
  if (draft.type === 'Saida' && nextQuantity < 0) {
    return { success: false, message: 'Quantidade insuficiente para registrar a saida.' }
  }

  const nextMovement = buildMovement(asset, { ...draft, quantity }, actor)
  saveStore({
    assets: store.assets.map((item) =>
      item.id === assetId
        ? {
            ...item,
            quantityCurrent: Math.max(0, nextQuantity),
            updatedAt: new Date().toISOString(),
            updatedBy: actor.name,
          }
        : item
    ),
    movementsByAsset: {
      ...store.movementsByAsset,
      [assetId]: [nextMovement, ...(store.movementsByAsset[assetId] ?? [])],
    },
    refrigerantByEquipment: store.refrigerantByEquipment,
  })

  return { success: true, message: 'Movimentacao registrada com sucesso.' }
}

export function applyScheduleMaterialConsumption(
  equipment: EquipmentHistoryTarget,
  schedule: MaintenanceSchedule,
  actor: User
) {
  const store = loadStore()
  if (schedule.materialsUsed.length === 0) {
    return { success: true, consumedItems: [] as InventoryMovement[] }
  }

  const nextAssets = [...store.assets]
  const nextMovementsByAsset = { ...store.movementsByAsset }
  const consumedItems: InventoryMovement[] = []

  for (const material of schedule.materialsUsed) {
    const assetIndex = nextAssets.findIndex((asset) => asset.id === material.assetId)
    if (assetIndex === -1) {
      continue
    }

    const targetAsset = nextAssets[assetIndex]
    const quantity = sanitizeNumber(material.quantity)
    if (quantity <= 0) {
      continue
    }

    const nextQuantity = Math.max(0, sanitizeNumber(targetAsset.quantityCurrent - quantity))
    nextAssets[assetIndex] = {
      ...targetAsset,
      quantityCurrent: nextQuantity,
      updatedAt: new Date().toISOString(),
      updatedBy: actor.name,
    }

    const movement = buildMovement(
      targetAsset,
      {
        date: schedule.date,
        time: schedule.time,
        type: 'Saida',
        quantity,
        reason: `Utilizado na manutencao ${schedule.maintenanceType}.`,
        observations: material.observations,
        relatedEquipmentId: equipment.id,
        relatedEquipmentName: equipment.name,
      },
      actor,
      schedule.id
    )

    consumedItems.push(movement)
    nextMovementsByAsset[targetAsset.id] = [movement, ...(nextMovementsByAsset[targetAsset.id] ?? [])]
  }

  saveStore({
    assets: nextAssets,
    movementsByAsset: nextMovementsByAsset,
    refrigerantByEquipment: store.refrigerantByEquipment,
  })

  if (consumedItems.length > 0) {
    appendAutomatedEquipmentHistoryEntry(equipment, actor, {
      actionType: 'Recebimento de Material',
      description: 'Baixa automatica de materiais executada ao concluir o agendamento.',
      observations: consumedItems
        .map((item) => `${item.assetName}: ${item.quantity} ${item.unit}.`)
        .join(' '),
    })
  }

  return { success: true, consumedItems }
}

function buildRefrigerantEntry(
  equipment: EquipmentHistoryTarget,
  draft: RefrigerantHistoryDraft,
  actor: User,
  existingEntry?: RefrigerantHistoryEntry
): RefrigerantHistoryEntry {
  const timestamp = new Date().toISOString()
  return {
    id: existingEntry?.id ?? createId('refrigerant-entry'),
    equipmentId: equipment.id,
    equipmentName: equipment.name,
    clientName: equipment.client,
    siteId: equipment.siteId,
    siteName: equipment.siteName,
    date: draft.date,
    time: draft.time,
    action: draft.action,
    refrigerantType: draft.refrigerantType.trim(),
    quantity: sanitizeNumber(draft.quantity),
    unit: draft.unit.trim(),
    observations: draft.observations.trim(),
    createdAt: existingEntry?.createdAt ?? timestamp,
    createdBy: existingEntry?.createdBy ?? actor.name,
    updatedAt: timestamp,
    updatedBy: actor.name,
  }
}

export function createRefrigerantHistoryEntry(
  equipment: EquipmentHistoryTarget,
  draft: RefrigerantHistoryDraft,
  actor: User
) {
  const store = loadStore()
  const nextEntry = buildRefrigerantEntry(equipment, draft, actor)

  saveStore({
    ...store,
    refrigerantByEquipment: {
      ...store.refrigerantByEquipment,
      [equipment.id]: [nextEntry, ...(store.refrigerantByEquipment[equipment.id] ?? [])],
    },
  })

  appendAutomatedEquipmentHistoryEntry(equipment, actor, {
    actionType: 'Atualizacao',
    description: `Historico de fluido atualizado com a acao "${draft.action}".`,
    observations: `${draft.refrigerantType.trim()} - ${sanitizeNumber(draft.quantity)} ${draft.unit.trim()}. ${draft.observations.trim()}`.trim(),
  })
}

export function updateRefrigerantHistoryEntry(
  equipment: EquipmentHistoryTarget,
  entryId: string,
  draft: RefrigerantHistoryDraft,
  actor: User
) {
  const store = loadStore()
  const currentEntries = store.refrigerantByEquipment[equipment.id] ?? []
  const existingEntry = currentEntries.find((entry) => entry.id === entryId)
  if (!existingEntry) {
    return
  }

  const nextEntry = buildRefrigerantEntry(equipment, draft, actor, existingEntry)
  saveStore({
    ...store,
    refrigerantByEquipment: {
      ...store.refrigerantByEquipment,
      [equipment.id]: currentEntries.map((entry) => (entry.id === entryId ? nextEntry : entry)),
    },
  })

  appendAutomatedEquipmentHistoryEntry(equipment, actor, {
    actionType: 'Atualizacao',
    description: `Registro de fluido editado para a acao "${draft.action}".`,
    observations: `${draft.refrigerantType.trim()} - ${sanitizeNumber(draft.quantity)} ${draft.unit.trim()}. ${draft.observations.trim()}`.trim(),
  })
}

export function deleteRefrigerantHistoryEntry(equipment: EquipmentHistoryTarget, entryId: string, actor: User) {
  const store = loadStore()
  const currentEntries = store.refrigerantByEquipment[equipment.id] ?? []
  const existingEntry = currentEntries.find((entry) => entry.id === entryId)
  if (!existingEntry) {
    return
  }

  saveStore({
    ...store,
    refrigerantByEquipment: {
      ...store.refrigerantByEquipment,
      [equipment.id]: currentEntries.filter((entry) => entry.id !== entryId),
    },
  })

  appendAutomatedEquipmentHistoryEntry(equipment, actor, {
    actionType: 'Atualizacao',
    description: 'Registro de fluido removido.',
    observations: `${existingEntry.refrigerantType} - ${existingEntry.quantity} ${existingEntry.unit}.`,
  })
}
