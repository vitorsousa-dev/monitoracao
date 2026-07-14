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
