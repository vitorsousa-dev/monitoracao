import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { PerformanceGauge } from '@/components/charts/PerformanceGauge'
import { HealthTrendChart } from '@/components/charts/HealthTrendChart'
import { UptimeChart } from '@/components/charts/UptimeChart'
import { EquipmentCard } from '@/components/equipment/EquipmentCard'
import { WeeklyUpdateCard } from '@/components/updates/WeeklyUpdateCard'
import { RankingView } from '@/components/dashboard/RankingView'
import { RecurringAlarms } from '@/components/alarms/RecurringAlarms'
import { mockEquipment, mockHealthTrend, mockUptimeData, mockWeeklyUpdates, mockSystemRankings, mockAlarms } from '@/lib/mockData'
import { TrendingUp, TrendingDown, Activity, AlertTriangle } from 'lucide-react'

export function Dashboard() {
  const averageHealth = 94
  const averageAvailability = 97
  const mttr = 3.5
  const totalOccurrences = 44

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-500">Visão geral do sistema de monitoramento HVAC/VRV</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <PerformanceGauge value={averageHealth} title="Saúde Geral" subtitle="Indicador principal" />
          
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-semibold text-gray-900">Disponibilidade</h3>
              <div className="flex items-center text-success">
                <TrendingUp className="h-4 w-4 mr-1" />
                <span className="text-sm font-medium">+2%</span>
              </div>
            </div>
            <p className="text-4xl font-bold text-primary mb-1">{averageAvailability}%</p>
            <p className="text-sm text-gray-500">vs. mês anterior</p>
          </div>
          
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-semibold text-gray-900">MTTR</h3>
              <div className="flex items-center text-success">
                <TrendingDown className="h-4 w-4 mr-1" />
                <span className="text-sm font-medium">-0.5h</span>
              </div>
            </div>
            <p className="text-4xl font-bold text-gray-900 mb-1">{mttr}h</p>
            <p className="text-sm text-gray-500">Tempo médio de resolução</p>
          </div>
          
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-semibold text-gray-900">Ocorrências</h3>
              <div className="flex items-center text-danger">
                <AlertTriangle className="h-4 w-4 mr-1" />
              </div>
            </div>
            <p className="text-4xl font-bold text-gray-900 mb-1">{totalOccurrences}</p>
            <p className="text-sm text-gray-500">Este mês</p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <HealthTrendChart data={mockHealthTrend} />
          <UptimeChart data={mockUptimeData} />
        </div>
        
        <RankingView rankings={mockSystemRankings} />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900">Equipamentos</h2>
              <Activity className="h-5 w-5 text-gray-500" />
            </div>
            <div className="space-y-4">
              {mockEquipment.slice(0, 3).map(equipment => (
                <EquipmentCard key={equipment.id} equipment={equipment} />
              ))}
            </div>
          </div>
          
          <div className="space-y-6">
            <RecurringAlarms alarms={mockAlarms} />
            
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
