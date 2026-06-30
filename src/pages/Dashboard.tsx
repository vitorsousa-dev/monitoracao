import { useMemo, useState } from 'react'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { PerformanceGauge } from '@/components/charts/PerformanceGauge'
import { HealthTrendChart } from '@/components/charts/HealthTrendChart'
import { UptimeChart } from '@/components/charts/UptimeChart'
import { EquipmentCard } from '@/components/equipment/EquipmentCard'
import { WeeklyUpdateCard } from '@/components/updates/WeeklyUpdateCard'
import { RankingView } from '@/components/dashboard/RankingView'
import { RecurringAlarms } from '@/components/alarms/RecurringAlarms'
import {
  mockEquipment,
  mockMonthlySummaries,
  mockMonthlyEquipmentSnapshots,
  mockWeeklyUpdates,
  mockAlarms,
  mockPredictiveTasks
} from '@/lib/mockData'
import { Equipment, EquipmentJustification, SystemRanking } from '@/types'
import { buildEquipmentJustification, getHealthStatusText } from '@/lib/utils'
import { TrendingUp, TrendingDown, Activity, AlertTriangle, Minus, Printer } from 'lucide-react'

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

export function Dashboard() {
  const availableMonths = mockMonthlySummaries
  const [startMonth, setStartMonth] = useState(availableMonths[0]?.monthKey ?? '')
  const [endMonth, setEndMonth] = useState(availableMonths[availableMonths.length - 1]?.monthKey ?? '')

  const selectedSummaries = useMemo(() => {
    if (!startMonth || !endMonth) {
      return []
    }

    const [from, to] = startMonth <= endMonth ? [startMonth, endMonth] : [endMonth, startMonth]
    return mockMonthlySummaries.filter((summary) => summary.monthKey >= from && summary.monthKey <= to)
  }, [startMonth, endMonth])

  const selectedSnapshots = useMemo(() => {
    if (selectedSummaries.length === 0) {
      return []
    }

    const monthKeys = new Set(selectedSummaries.map((summary) => summary.monthKey))
    return mockMonthlyEquipmentSnapshots.filter((snapshot) => monthKeys.has(snapshot.monthKey))
  }, [selectedSummaries])

  const aggregatedEquipment = useMemo(() => {
    const equipmentMap = new Map<string, Equipment & { _count: number }>()
    const relevantSnapshots = selectedSnapshots.filter((snapshot) => snapshot.totalOccurrences > 0)

    relevantSnapshots.forEach((snapshot) => {
      const current = equipmentMap.get(snapshot.id)
      if (!current) {
        equipmentMap.set(snapshot.id, {
          ...snapshot,
          health: snapshot.health,
          availability: snapshot.availability,
          comfort: snapshot.comfort,
          performance: snapshot.performance,
          mttr: snapshot.mttr,
          totalOccurrences: snapshot.totalOccurrences,
          criticalOccurrences: snapshot.criticalOccurrences,
          moderateOccurrences: snapshot.moderateOccurrences,
          informativeOccurrences: snapshot.informativeOccurrences,
          lastUpdated: snapshot.endDate,
          _count: 1,
        })
        return
      }

      current.health += snapshot.health
      current.availability += snapshot.availability
      current.comfort += snapshot.comfort
      current.performance += snapshot.performance
      current.mttr += snapshot.mttr
      current.totalOccurrences += snapshot.totalOccurrences
      current.criticalOccurrences += snapshot.criticalOccurrences
      current.moderateOccurrences += snapshot.moderateOccurrences
      current.informativeOccurrences += snapshot.informativeOccurrences
      current.lastUpdated = snapshot.endDate
      current._count += 1
      equipmentMap.set(snapshot.id, current)
    })

    return Array.from(equipmentMap.values())
      .map(({ _count, ...equipment }) => ({
        ...equipment,
        health: Number((equipment.health / _count).toFixed(2)),
        availability: Number((equipment.availability / _count).toFixed(2)),
        comfort: Number((equipment.comfort / _count).toFixed(2)),
        performance: Number((equipment.performance / _count).toFixed(2)),
        mttr: Number((equipment.mttr / _count).toFixed(2)),
        status: getHealthStatusText(equipment.health / _count) as Equipment['status'],
      }))
      .sort((a, b) => b.totalOccurrences - a.totalOccurrences || a.health - b.health)
  }, [selectedSnapshots])

  const dashboardMetrics = useMemo(() => {
    if (selectedSummaries.length === 0) {
      return {
        averageHealth: 0,
        averageAvailability: 0,
        mttr: 0,
        totalOccurrences: 0,
        affectedEquipment: 0,
      }
    }

    const count = selectedSummaries.length
    return {
      averageHealth: Number((selectedSummaries.reduce((sum, item) => sum + item.health, 0) / count).toFixed(2)),
      averageAvailability: Number((selectedSummaries.reduce((sum, item) => sum + item.availability, 0) / count).toFixed(2)),
      mttr: Number((selectedSummaries.reduce((sum, item) => sum + item.mttr, 0) / count).toFixed(2)),
      totalOccurrences: selectedSummaries.reduce((sum, item) => sum + item.totalOccurrences, 0),
      affectedEquipment: aggregatedEquipment.length,
    }
  }, [selectedSummaries, aggregatedEquipment.length])

  const rankingData = useMemo<SystemRanking[]>(() => {
    return aggregatedEquipment.map((equipment, index) => ({
      id: equipment.id,
      equipmentId: equipment.id,
      equipmentName: equipment.name,
      clientName: equipment.client,
      systemName: `${equipment.area} • ${equipment.name}`,
      totalAlarms: equipment.totalOccurrences,
      criticalAlarms: equipment.criticalOccurrences,
      healthScore: equipment.health,
      availability: equipment.availability,
      rank: index + 1,
      trend: index === 0 ? 'down' : index === 1 ? 'stable' : 'up',
    }))
  }, [aggregatedEquipment])

  const filteredAlarms = useMemo(() => {
    if (selectedSummaries.length === 0) {
      return []
    }

    const monthKeys = new Set(selectedSummaries.map((summary) => summary.monthKey))
    return mockAlarms.filter((alarm) => monthKeys.has(alarm.createdAt.slice(0, 7)))
  }, [selectedSummaries])

  const highlightedEquipment = useMemo(
    () => (aggregatedEquipment.length > 0 ? aggregatedEquipment : mockEquipment.slice(0, 3)).slice(0, 3),
    [aggregatedEquipment]
  )

  const equipmentJustifications = useMemo(() => {
    const entries: Array<[string, EquipmentJustification]> = highlightedEquipment.map((equipment) => [
      equipment.id,
      buildEquipmentJustification(equipment, filteredAlarms, mockPredictiveTasks),
    ])

    return new Map<string, EquipmentJustification>(entries)
  }, [filteredAlarms, highlightedEquipment])

  const currentSummary = selectedSummaries[selectedSummaries.length - 1]
  const currentSummaryIndex = currentSummary
    ? mockMonthlySummaries.findIndex((summary) => summary.monthKey === currentSummary.monthKey)
    : -1
  const previousSummary = currentSummaryIndex > 0 ? mockMonthlySummaries[currentSummaryIndex - 1] : null

  const availabilityDelta = previousSummary ? Number((currentSummary.availability - previousSummary.availability).toFixed(2)) : 0
  const mttrDelta = previousSummary ? Number((currentSummary.mttr - previousSummary.mttr).toFixed(2)) : 0
  const selectedPeriodLabel = selectedSummaries.length > 0
    ? `${selectedSummaries[0].month} a ${selectedSummaries[selectedSummaries.length - 1].month}`
    : 'Periodo sem dados'

  const renderTrend = (delta: number, reverseGood = false) => {
    if (delta === 0) {
      return (
        <div className="flex items-center text-gray-500">
          <Minus className="h-4 w-4 mr-1" />
          <span className="text-sm font-medium">Sem base anterior</span>
        </div>
      )
    }

    const isPositive = delta > 0
    const positiveIsGood = reverseGood ? !isPositive : isPositive
    const Icon = isPositive ? TrendingUp : TrendingDown
    const color = positiveIsGood ? 'text-success' : 'text-danger'
    const signal = delta > 0 ? '+' : ''

    return (
      <div className={`flex items-center ${color}`}>
        <Icon className="h-4 w-4 mr-1" />
        <span className="text-sm font-medium">{signal}{delta}{reverseGood ? 'h' : '%'}</span>
      </div>
    )
  }

  const handleExportOverviewPdf = () => {
    const printWindow = window.open('', '_blank', 'noopener,noreferrer,width=1120,height=900')
    if (!printWindow) {
      return
    }

    const rankingRows = rankingData.slice(0, 5).map((item) => `
      <tr>
        <td>${item.rank}</td>
        <td>${escapeHtml(item.equipmentName ?? item.systemName)}</td>
        <td>${item.totalAlarms}</td>
        <td>${item.criticalAlarms}</td>
        <td>${item.healthScore}%</td>
      </tr>
    `).join('')

    const equipmentRows = highlightedEquipment.map((equipment) => {
      const justification = equipmentJustifications.get(equipment.id)
      return `
        <div class="equipment-card">
          <h3>${escapeHtml(equipment.name)} <span>${escapeHtml(equipment.status)}</span></h3>
          <p class="equipment-meta">${escapeHtml(equipment.area)} | Saude ${equipment.health}% | Disponibilidade ${equipment.availability}% | MTTR ${equipment.mttr.toFixed(1)}h</p>
          <p class="summary">${escapeHtml(justification?.summary ?? '')}</p>
          <ul>
            ${(justification?.details ?? []).map((detail) => `<li>${escapeHtml(detail)}</li>`).join('')}
          </ul>
        </div>
      `
    }).join('')

    const predictiveRows = mockPredictiveTasks.slice(0, 5).map((task) => `
      <div class="insight-card">
        <h4>${escapeHtml(task.equipmentName)}</h4>
        <p>${escapeHtml(task.technicalAnalysis)}</p>
      </div>
    `).join('')

    const followupRows = filteredAlarms
      .filter((alarm) => alarm.status === 'pending_followup')
      .slice(0, 8)
      .map((alarm) => `
        <li>${escapeHtml(alarm.equipmentName)} - ${escapeHtml(alarm.message)} (${escapeHtml(alarm.createdAt)})</li>
      `)
      .join('')

    printWindow.document.write(`
      <html lang="pt-BR">
        <head>
          <title>EMS - Overview Executivo</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 32px; color: #1f2937; }
            h1 { margin: 0 0 6px; font-size: 28px; }
            h2 { margin: 24px 0 12px; font-size: 18px; color: #502044; }
            p { margin: 0; line-height: 1.5; }
            .subtitle { color: #6b7280; margin-bottom: 18px; }
            .kpi-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-top: 18px; }
            .kpi-card, .equipment-card, .insight-card { border: 1px solid #e5e7eb; border-radius: 12px; padding: 14px; background: #fff; }
            .kpi-card strong { display: block; font-size: 28px; color: #111827; margin-top: 6px; }
            table { width: 100%; border-collapse: collapse; }
            th, td { border: 1px solid #e5e7eb; padding: 10px; text-align: left; font-size: 13px; }
            th { background: #f9fafb; }
            .equipment-card h3 { display: flex; justify-content: space-between; margin: 0 0 8px; font-size: 16px; }
            .equipment-card span { color: #a63056; font-size: 13px; }
            .equipment-meta { color: #6b7280; font-size: 13px; }
            .summary { margin-top: 10px; font-weight: 600; }
            ul { margin: 10px 0 0 18px; padding: 0; }
            li { margin-bottom: 6px; }
            .section-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
            .footer { margin-top: 28px; font-size: 12px; color: #6b7280; }
          </style>
        </head>
        <body>
          <h1>EMS | Relatorio Gerencial</h1>
          <p class="subtitle">Overview executivo do dashboard | Periodo: ${escapeHtml(selectedPeriodLabel)}</p>

          <div class="kpi-grid">
            <div class="kpi-card"><p>Saude Geral</p><strong>${dashboardMetrics.averageHealth}%</strong></div>
            <div class="kpi-card"><p>Disponibilidade</p><strong>${dashboardMetrics.averageAvailability}%</strong></div>
            <div class="kpi-card"><p>MTTR</p><strong>${dashboardMetrics.mttr}h</strong></div>
            <div class="kpi-card"><p>Ocorrencias</p><strong>${dashboardMetrics.totalOccurrences}</strong></div>
          </div>

          <h2>Ranking de Alarmes</h2>
          <table>
            <thead>
              <tr>
                <th>Posicao</th>
                <th>Equipamento</th>
                <th>Total</th>
                <th>Criticos</th>
                <th>Saude</th>
              </tr>
            </thead>
            <tbody>${rankingRows}</tbody>
          </table>

          <h2>Justificativas dos Equipamentos</h2>
          ${equipmentRows}

          <div class="section-grid">
            <div>
              <h2>Analises Preditivas</h2>
              ${predictiveRows || '<p>Sem analises preditivas registradas.</p>'}
            </div>
            <div>
              <h2>Alarmes com Follow-up</h2>
              <ul>${followupRows || '<li>Nenhum follow-up pendente no periodo.</li>'}</ul>
            </div>
          </div>

          <p class="footer">Documento gerado automaticamente a partir do dashboard EMS.</p>
          <script>
            window.onload = function() {
              window.print();
            }
          </script>
        </body>
      </html>
    `)
    printWindow.document.close()
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-gray-500">Visão consolidada dos sistemas e unidades com ocorrência no período</p>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-sm font-medium text-gray-700 mb-3">Período de análise</p>
            <div className="flex flex-col gap-3 sm:flex-row">
              <div>
                <label className="block text-xs text-gray-500 mb-1">De</label>
                <select
                  value={startMonth}
                  onChange={(e) => setStartMonth(e.target.value)}
                  className="w-full min-w-[140px] rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                >
                  {availableMonths.map((summary) => (
                    <option key={`start-${summary.monthKey}`} value={summary.monthKey}>
                      {summary.month}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Até</label>
                <select
                  value={endMonth}
                  onChange={(e) => setEndMonth(e.target.value)}
                  className="w-full min-w-[140px] rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                >
                  {availableMonths.map((summary) => (
                    <option key={`end-${summary.monthKey}`} value={summary.monthKey}>
                      {summary.month}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <button
              onClick={handleExportOverviewPdf}
              className="mt-4 inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90 transition-colors"
            >
              <Printer className="h-4 w-4" />
              Exportar overview em PDF
            </button>
            {currentSummary && (
              <p className="mt-3 text-xs text-gray-500">
                Dados disponíveis de {selectedSummaries[0]?.startDate} até {currentSummary.endDate}
              </p>
            )}
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <PerformanceGauge
            value={dashboardMetrics.averageHealth}
            title="Saúde Geral"
            subtitle="Equipamentos com ocorrências no período"
          />
          
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-semibold text-gray-900">Disponibilidade</h3>
              {renderTrend(availabilityDelta)}
            </div>
            <p className="text-4xl font-bold text-primary mb-1">{dashboardMetrics.averageAvailability}%</p>
            <p className="text-sm text-gray-500">Média dos equipamentos impactados</p>
          </div>
          
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-semibold text-gray-900">MTTR</h3>
              {renderTrend(mttrDelta, true)}
            </div>
            <p className="text-4xl font-bold text-gray-900 mb-1">{dashboardMetrics.mttr}h</p>
            <p className="text-sm text-gray-500">Tempo médio de resolução no período</p>
          </div>
          
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-semibold text-gray-900">Ocorrências</h3>
              <div className="flex items-center text-danger">
                <AlertTriangle className="h-4 w-4 mr-1" />
              </div>
            </div>
            <p className="text-4xl font-bold text-gray-900 mb-1">{dashboardMetrics.totalOccurrences}</p>
            <p className="text-sm text-gray-500">{dashboardMetrics.affectedEquipment} equipamentos impactados</p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <HealthTrendChart data={selectedSummaries.map(({ month, health, target }) => ({ month, health, target }))} />
          <UptimeChart data={selectedSummaries.map(({ month, availability }) => ({ month, availability }))} />
        </div>
        
        <RankingView rankings={rankingData} />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900">Equipamentos Críticos</h2>
              <Activity className="h-5 w-5 text-gray-500" />
            </div>
            <div className="space-y-4">
              {highlightedEquipment.map(equipment => (
                <EquipmentCard
                  key={equipment.id}
                  equipment={equipment}
                  justification={equipmentJustifications.get(equipment.id)}
                />
              ))}
            </div>
          </div>
          
          <div className="space-y-6">
            <RecurringAlarms alarms={filteredAlarms} />
            
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900">Últimas Atualizações</h2>
              </div>
              <div className="space-y-4">
                {mockWeeklyUpdates.slice(0, 3).map(update => (
                  <WeeklyUpdateCard key={update.id} update={update} />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
