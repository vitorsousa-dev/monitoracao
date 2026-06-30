import { DashboardLayout } from '../components/layout/DashboardLayout'
import { PredictiveTasks } from '../components/predictive/PredictiveTasks'
import { mockPredictiveTasks } from '../lib/mockData'

export function PredictiveMaintenance() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Manutencao Preditiva</h1>
          <p className="text-gray-500">Analises tecnicas por equipamento com foco em falhas recorrentes</p>
        </div>

        <PredictiveTasks tasks={mockPredictiveTasks} />
      </div>
    </DashboardLayout>
  )
}
