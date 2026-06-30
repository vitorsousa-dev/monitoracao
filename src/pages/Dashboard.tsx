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
  mockAlarms
} from '@/lib/mockData'
import { Equipment, SystemRanking } from '@/types'
import { getHealthStatusText } from '@/lib/utils'
import { TrendingUp, TrendingDown, Activity, AlertTriangle, Minus } from 'lucide-react'

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

  const currentSummary = selectedSummaries[selectedSummaries.length - 1]
  const currentSummaryIndex = currentSummary
    ? mockMonthlySummaries.findIndex((summary) => summary.monthKey === currentSummary.monthKey)
    : -1
  const previousSummary = currentSummaryIndex > 0 ? mockMonthlySummaries[currentSummaryIndex - 1] : null

  const availabilityDelta = previousSummary ? Number((currentSummary.availability - previousSummary.availability).toFixed(2)) : 0
  const mttrDelta = previousSummary ? Number((currentSummary.mttr - previousSummary.mttr).toFixed(2)) : 0

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
              {(aggregatedEquipment.length > 0 ? aggregatedEquipment : mockEquipment.slice(0, 3)).slice(0, 3).map(equipment => (
                <EquipmentCard key={equipment.id} equipment={equipment} />
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
