import { useMemo } from 'react'
import { DashboardLayout } from '../components/layout/DashboardLayout'
import { PredictiveTasks } from '../components/predictive/PredictiveTasks'
import { SERASA_SITE_ID } from '@/lib/equipmentCatalog'
import { mockEquipment, mockPredictiveTasks } from '../lib/mockData'
import { useScope } from '@/hooks/useScope'

function getEquipmentSiteId(equipment: { client: string; siteId?: string }) {
  return equipment.siteId ?? (equipment.client === 'Serasa Experian' ? SERASA_SITE_ID : undefined)
}

export function PredictiveMaintenance() {
  const { selectedClient, selectedSite } = useScope()

  const visiblePredictiveTasks = useMemo(() => {
    const scopedEquipmentIds = new Set(
      mockEquipment
        .filter((equipment) => {
          const matchesClient = selectedClient === 'all-clients' || equipment.client === selectedClient
          const matchesSite = selectedSite === 'all-sites' || getEquipmentSiteId(equipment) === selectedSite

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
              Nao ha tarefas preditivas cadastradas para o cliente/site selecionado.
            </p>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
