export interface Equipment {
  id: string
  name: string
  type: 'VRV' | 'Split' | 'Cassete' | 'Chiller'
  area: string
  client: string
  siteId?: string
  health: number
  availability: number
  comfort: number
  performance: number
  status: 'Verde' | 'Amarelo' | 'Vermelho'
  mttr: number
  totalOccurrences: number
  criticalOccurrences: number
  moderateOccurrences: number
  informativeOccurrences: number
  lastUpdated: string
}

export interface EquipmentJustification {
  summary: string
  details: string[]
}

export interface SiteSystemCatalog {
  id: string
  client: string
  siteId: string
  systemName: string
  outdoorUnits: string[]
  internalUnits: string[]
  status: 'active' | 'vacant'
}

export interface FinancialHealthMetrics {
  score: number
  correctiveExposure: number
  predictiveInvestment: number
  avoidedTechnicalVisits: number
  avoidedWaste: number
  netEstimatedCost: number
  savingsRate: number
}

export interface WeeklyUpdate {
  id: string
  date: string
  title: string
  content: string
  author: string
}

export interface HealthTrendData {
  month: string
  health: number
  target: number
}

export interface UptimeData {
  month: string
  availability: number
}

export interface MonthlySummary {
  monthKey: string
  month: string
  startDate: string
  endDate: string
  health: number
  target: number
  availability: number
  mttr: number
  totalOccurrences: number
  affectedEquipment: number
}

export interface SiteLocation {
  siteId: string
  nome: string
  cliente: string
  endereco: string
  cidade: string
  estado: string
  latitude: number | null
  longitude: number | null
  saudeGeral: number
  disponibilidade: number
  conforto: number
  performance: number
  ocorrenciasCriticas: number
  ultimaAtualizacao: string
}

export interface SiteMonthlySnapshot extends SiteLocation {
  monthKey: string
  month: string
}

export interface EquipmentMonthlySnapshot extends Equipment {
  monthKey: string
  month: string
  startDate: string
  endDate: string
}

export interface User {
  id: string
  name: string
  email: string
  role: 'admin' | 'manager' | 'viewer'
  password: string
  createdAt: string
  clientAccess: string[]
}

export interface Alarm {
  id: string
  equipmentId: string
  equipmentName: string
  type: 'critical' | 'warning' | 'info'
  message: string
  status: 'open' | 'acknowledged' | 'resolved' | 'pending_followup'
  priority: number
  createdAt: string
  updatedAt: string
  clientName: string
  areaName: string
  hasFollowup: boolean
  followupCount: number
}

export interface PredictiveTask {
  id: string
  equipmentId: string
  equipmentName: string
  clientName?: string
  siteId?: string
  siteName?: string
  type: 'maintenance' | 'inspection' | 'replacement'
  title: string
  description: string
  technicalAnalysis: string
  detailedAnalysis: string[]
  priority: 'high' | 'medium' | 'low'
  dueDate: string
  status: 'pending' | 'in_progress' | 'completed'
  riskScore: number
  estimatedCost: number
  origin?: 'seed' | 'manual'
  createdAt?: string
  createdBy?: string
  updatedAt?: string
  updatedBy?: string
}

export interface PredictiveTaskDraft {
  equipmentId: string
  type: PredictiveTask['type']
  title: string
  description: string
  technicalAnalysis: string
  detailedAnalysis: string
  priority: PredictiveTask['priority']
  dueDate: string
  status: PredictiveTask['status']
  riskScore: number
  estimatedCost: number
}

export interface SystemRanking {
  id: string
  equipmentId?: string
  equipmentName?: string
  clientName: string
  systemName: string
  totalAlarms: number
  criticalAlarms: number
  healthScore: number
  availability: number
  rank: number
  trend: 'up' | 'down' | 'stable'
}

export interface EnergyData {
  month: string
  kwhConsumed: number
  kwhCost: number
  target: number
  previousYear: number
}

export interface IEERData {
  equipmentId: string
  equipmentName: string
  ieer: number
  target: number
  efficiency: number
  lastUpdated: string
}

export interface WaterData {
  month: string
  cubicMeters: number
  cost: number
  target: number
  previousYear: number
}

export type EquipmentHistoryActionType =
  | 'Inspecao'
  | 'Manutencao Preventiva'
  | 'Manutencao Corretiva'
  | 'Troca de Peca'
  | 'Falha'
  | 'Visita Tecnica'
  | 'Recebimento de Material'
  | 'Instalacao'
  | 'Atualizacao'
  | 'Agendamento'
  | 'Conclusao'
  | 'Observacao'

export interface EquipmentHistoryAttachment {
  id: string
  name: string
  mimeType: string
  size: number
  dataUrl: string
}

export interface EquipmentHistoryAuditEvent {
  id: string
  equipmentId: string
  entryId?: string
  action: 'created' | 'updated' | 'deleted'
  actorId: string | null
  actorName: string
  timestamp: string
  summary: string
}

export interface EquipmentHistoryEntry {
  id: string
  equipmentId: string
  equipmentName: string
  clientName: string
  siteId?: string
  siteName?: string
  date: string
  time: string
  responsibleUser: string
  actionType: EquipmentHistoryActionType
  description: string
  observations: string
  attachments: EquipmentHistoryAttachment[]
  photos: EquipmentHistoryAttachment[]
  createdAt: string
  createdBy: string
  updatedAt: string
  updatedBy: string
}

export interface EquipmentHistoryEntryDraft {
  date: string
  time: string
  responsibleUser: string
  actionType: EquipmentHistoryActionType
  description: string
  observations: string
  attachments: EquipmentHistoryAttachment[]
  photos: EquipmentHistoryAttachment[]
}

export interface EquipmentHistoryTarget {
  id: string
  name: string
  type: string
  area: string
  client: string
  siteId?: string
  siteName?: string
  health: number
  availability: number
  comfort?: number
  performance?: number
  status: 'Verde' | 'Amarelo' | 'Vermelho'
  mttr: number
  totalOccurrences: number
  criticalOccurrences: number
  moderateOccurrences: number
  informativeOccurrences: number
  lastUpdated: string
  source: 'equipment' | 'west-system' | 'west-unit'
}

export type InventoryAssetCategory = string

export interface InventoryAsset {
  id: string
  clientName: string
  siteId?: string
  siteName?: string
  name: string
  category: InventoryAssetCategory
  code: string
  manufacturer: string
  quantityCurrent: number
  quantityMinimum: number
  unit: string
  storageLocation: string
  observations: string
  createdAt: string
  createdBy: string
  updatedAt: string
  updatedBy: string
}

export interface InventoryAssetDraft {
  clientName: string
  siteId?: string
  siteName?: string
  name: string
  category: InventoryAssetCategory
  code: string
  manufacturer: string
  quantityCurrent: number
  quantityMinimum: number
  unit: string
  storageLocation: string
  observations: string
}

export type InventoryMovementType = 'Entrada' | 'Saida' | 'Ajuste'

export interface InventoryMovement {
  id: string
  assetId: string
  assetName: string
  clientName: string
  siteId?: string
  siteName?: string
  date: string
  time: string
  type: InventoryMovementType
  quantity: number
  unit: string
  reason: string
  observations: string
  relatedEquipmentId?: string
  relatedEquipmentName?: string
  relatedScheduleId?: string
  createdAt: string
  createdBy: string
}

export interface InventoryMovementDraft {
  date: string
  time: string
  type: InventoryMovementType
  quantity: number
  reason: string
  observations: string
  relatedEquipmentId?: string
  relatedEquipmentName?: string
}

export interface ScheduleMaterialUsage {
  id: string
  assetId: string
  assetName: string
  quantity: number
  unit: string
  observations: string
}

export interface ScheduleMaterialUsageDraft {
  assetId: string
  quantity: number
  observations: string
}

export type MaintenanceScheduleType =
  | 'Preventiva'
  | 'Corretiva'
  | 'Preditiva'
  | 'Inspecao'
  | 'Visita Tecnica'
  | 'Acompanhamento'

export type MaintenanceSchedulePriority = 'Baixa' | 'Media' | 'Alta' | 'Critica'

export type MaintenanceScheduleStatus = 'Agendado' | 'Em andamento' | 'Finalizado' | 'Cancelado'

export interface MaintenanceSchedule {
  id: string
  equipmentId: string
  equipmentName: string
  clientName: string
  siteId?: string
  siteName?: string
  date: string
  time: string
  technician: string
  maintenanceType: MaintenanceScheduleType
  priority: MaintenanceSchedulePriority
  observations: string
  materialsUsed: ScheduleMaterialUsage[]
  status: MaintenanceScheduleStatus
  materialsAppliedAt?: string
  createdAt: string
  createdBy: string
  updatedAt: string
  updatedBy: string
}

export interface MaintenanceScheduleDraft {
  date: string
  time: string
  technician: string
  maintenanceType: MaintenanceScheduleType
  priority: MaintenanceSchedulePriority
  observations: string
  materialsUsed: ScheduleMaterialUsageDraft[]
  status: MaintenanceScheduleStatus
}

export type AlertKanbanColumn = 'pending' | 'in_progress' | 'completed'

export interface AlertKanbanState {
  equipmentId: string
  status: AlertKanbanColumn
  archived: boolean
  updatedAt: string
  updatedBy: string
}

export type RefrigerantHistoryAction = 'Adicionado' | 'Complementado' | 'Removido' | 'Recuperado' | 'Ajuste'

export interface RefrigerantHistoryEntry {
  id: string
  equipmentId: string
  equipmentName: string
  clientName: string
  siteId?: string
  siteName?: string
  date: string
  time: string
  action: RefrigerantHistoryAction
  refrigerantType: string
  quantity: number
  unit: string
  observations: string
  createdAt: string
  createdBy: string
  updatedAt: string
  updatedBy: string
}

export interface RefrigerantHistoryDraft {
  date: string
  time: string
  action: RefrigerantHistoryAction
  refrigerantType: string
  quantity: number
  unit: string
  observations: string
}
