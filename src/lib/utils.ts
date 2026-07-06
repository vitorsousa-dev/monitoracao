import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { Alarm, Equipment, EquipmentJustification, FinancialHealthMetrics, PredictiveTask } from "../types"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getHealthStatusColor(health: number) {
  if (health >= 90) return '#00B050'
  if (health >= 80) return '#FFC000'
  return '#E53935'
}

export function getHealthStatusText(health: number) {
  if (health >= 90) return 'Verde'
  if (health >= 80) return 'Amarelo'
  return 'Vermelho'
}

function formatMetricLabel(label: string, value: number) {
  return `${label} em ${value.toFixed(1)}%`
}

function getDegradedMetrics(equipment: Equipment) {
  const metrics: string[] = []

  if (equipment.availability < 90) {
    metrics.push(formatMetricLabel('disponibilidade', equipment.availability))
  }
  if (equipment.comfort < 90) {
    metrics.push(formatMetricLabel('conforto', equipment.comfort))
  }
  if (equipment.performance < 90) {
    metrics.push(formatMetricLabel('performance', equipment.performance))
  }

  return metrics
}

export function buildEquipmentJustification(
  equipment: Equipment,
  alarms: Alarm[],
  predictiveTasks: PredictiveTask[]
): EquipmentJustification {
  const equipmentAlarms = alarms.filter((alarm) => alarm.equipmentId === equipment.id)
  const criticalAlarms = equipmentAlarms.filter((alarm) => alarm.type === 'critical').length
  const warningAlarms = equipmentAlarms.filter((alarm) => alarm.type === 'warning').length
  const equipmentTasks = predictiveTasks.filter((task) => task.equipmentId === equipment.id)
  const degradedMetrics = getDegradedMetrics(equipment)
  const details: string[] = []

  if (criticalAlarms > 0) {
    details.push(`${criticalAlarms} alarmes criticos registrados no periodo.`)
  } else if (warningAlarms > 0) {
    details.push(`${warningAlarms} alarmes de atencao registrados no periodo.`)
  } else if (equipment.totalOccurrences > 0) {
    details.push(`${equipment.totalOccurrences} ocorrencias consolidadas no periodo analisado.`)
  } else {
    details.push('Sem alarmes ativos no periodo selecionado.')
  }

  if (equipmentTasks.length > 0) {
    details.push(`Condicao preditiva: ${equipmentTasks[0].technicalAnalysis}`)
  }

  if (degradedMetrics.length > 0) {
    details.push(`${degradedMetrics.join(', ')} abaixo da faixa verde.`)
  }

  if (equipment.mttr > 0) {
    details.push(`MTTR atual de ${equipment.mttr.toFixed(1)}h.`)
  }

  if (equipment.status === 'Vermelho') {
    return {
      summary: 'Status vermelho por recorrencia de alarmes e degradacao operacional relevante.',
      details: details.slice(0, 3),
    }
  }

  if (equipment.status === 'Amarelo') {
    return {
      summary: equipmentAlarms.length > 0 || equipmentTasks.length > 0
        ? 'Status amarelo por necessidade de acompanhamento tecnico e perda parcial de desempenho.'
        : 'Status amarelo por indicadores operacionais abaixo da meta, mesmo sem alarme ativo no periodo.',
      details: details.slice(0, 3),
    }
  }

  return {
    summary: equipmentAlarms.length > 0 || equipmentTasks.length > 0
      ? 'Status verde com estabilidade geral, mas com ponto de atencao monitorado.'
      : 'Status verde por estabilidade operacional e ausencia de evidencias criticas no periodo.',
    details: details.slice(0, 3),
  }
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

export function buildFinancialHealthMetrics(
  alarms: Alarm[],
  predictiveTasks: PredictiveTask[],
  averageHealth: number,
  averageAvailability: number
): FinancialHealthMetrics {
  const marketReference = {
    criticalAlarmCost: 350,
    warningAlarmCost: 180,
    infoAlarmCost: 80,
    followupCost: 120,
    technicalVisitSaving: 950,
    lowValueMaintenanceSaving: 1650,
  }

  const criticalCount = alarms.filter((alarm) => alarm.type === 'critical').length
  const warningCount = alarms.filter((alarm) => alarm.type === 'warning').length
  const infoCount = alarms.filter((alarm) => alarm.type === 'info').length
  const followupCount = alarms.filter((alarm) => alarm.status === 'pending_followup').length

  const correctiveExposure =
    criticalCount * marketReference.criticalAlarmCost +
    warningCount * marketReference.warningAlarmCost +
    infoCount * marketReference.infoAlarmCost +
    followupCount * marketReference.followupCost

  const predictiveInvestment = predictiveTasks.reduce((sum, task) => sum + task.estimatedCost, 0)
  const avoidedTechnicalVisits = predictiveTasks.length * marketReference.technicalVisitSaving
  const avoidedWaste = predictiveTasks.length * marketReference.lowValueMaintenanceSaving
  const avoidedSavings = avoidedTechnicalVisits + avoidedWaste
  const netEstimatedCost = Math.max(correctiveExposure + predictiveInvestment - avoidedSavings, 0)
  const grossManagedValue = correctiveExposure + predictiveInvestment
  const savingsRate = grossManagedValue > 0
    ? clamp((avoidedSavings / grossManagedValue) * 100, 0, 100)
    : 100

  const score = clamp(
    averageHealth * 0.25 +
      averageAvailability * 0.15 +
      savingsRate * 0.35 +
      (100 - clamp(netEstimatedCost / 250, 0, 100)) * 0.25,
    0,
    100
  )

  return {
    score: Number(score.toFixed(2)),
    correctiveExposure: Number(correctiveExposure.toFixed(2)),
    predictiveInvestment: Number(predictiveInvestment.toFixed(2)),
    avoidedTechnicalVisits: Number(avoidedTechnicalVisits.toFixed(2)),
    avoidedWaste: Number(avoidedWaste.toFixed(2)),
    netEstimatedCost: Number(netEstimatedCost.toFixed(2)),
    savingsRate: Number(savingsRate.toFixed(2)),
  }
}
