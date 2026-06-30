import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { Alarm, Equipment, EquipmentJustification, PredictiveTask } from "../types"

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
