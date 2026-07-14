import { useMemo } from 'react'
import { DashboardLayout } from '../components/layout/DashboardLayout'
import { PredictiveTasks } from '../components/predictive/PredictiveTasks'
import { mockEquipment, mockPredictiveTasks } from '../lib/mockData'
import { useScope } from '@/hooks/useScope'

export function PredictiveMaintenance() {
  const { selectedClient, selectedSite } = useScope()

  const visiblePredictiveTasks = useMemo(() => {
    const scopedEquipmentIds = new Set(
      mockEquipment
        .filter((equipment) => {
          const matchesClient = selectedClient === 'all-clients' || equipment.client === selectedClient
          const matchesSite =
            selectedSite === 'all-sites' ||
            (selectedSite === 'serasa-pdc' && equipment.client === 'Serasa Experian') ||
            equipment.siteId === selectedSite

          return matchesClient && matchesSite
        })
        .map((equipment) => equipment.id)
    )

    if (scopedEquipmentIds.size === 0) {
      return []
    }

    return mockPredictiveTasks.filter((task) => scopedEquipmentIds.has(task.equipmentId))
  }, [selectedClient, selectedSite])

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Manutencao Preditiva</h1>
          <p className="text-gray-500">Analises tecnicas por equipamento com foco em falhas recorrentes</p>
        </div>

        {visiblePredictiveTasks.length > 0 ? (
          <PredictiveTasks tasks={visiblePredictiveTasks} />
        ) : (
          <div className="rounded-xl border border-gray-200 bg-white p-6">
            <h3 className="text-lg font-semibold text-gray-900">Análises Técnicas Preditivas</h3>
            <p className="mt-3 text-sm leading-6 text-gray-500">
              Nao ha tarefas preditivas cadastradas para o cliente/site selecionado. As analises atuais permanecem
              disponiveis somente para a `Serasa Experian`.
            </p>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
