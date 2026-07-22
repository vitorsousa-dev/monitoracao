import { useMemo } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { DashboardLayout } from '../components/layout/DashboardLayout'
import { AlarmsList } from '../components/alarms/AlarmsList'
import { RecurringAlarms } from '../components/alarms/RecurringAlarms'
import { findEquipmentCatalogItem } from '@/lib/equipmentCatalog'
import { mockAlarms } from '../lib/mockData'
import { westCorpAlarms } from '@/lib/westCorpOperationalData'
import { useScope } from '@/hooks/useScope'

export function Alarms() {
  const { selectedClient, selectedSite } = useScope()
  const [searchParams] = useSearchParams()
  const selectedEquipmentId = searchParams.get('equipmentId') ?? ''
  const selectedEquipmentName = searchParams.get('equipmentName') ?? ''
  const scopedAlarms = useMemo(() => {
    const combinedAlarms = [...mockAlarms, ...westCorpAlarms]
    return combinedAlarms.filter((alarm) => {
      const alarmEquipment = findEquipmentCatalogItem(alarm.equipmentId)
      const matchesClient = selectedClient === 'all-clients' || alarm.clientName === selectedClient
      const matchesSite = selectedSite === 'all-sites' || alarmEquipment?.siteId === selectedSite
      return matchesClient && matchesSite
    })
  }, [selectedClient, selectedSite])

  const filteredRecurringAlarms = useMemo(() => {
    if (!selectedEquipmentId) {
      return scopedAlarms
    }

    return scopedAlarms.filter((alarm) => alarm.equipmentId === selectedEquipmentId)
  }, [scopedAlarms, selectedEquipmentId])

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Alarmes</h1>
          <p className="text-gray-500">Monitoramento e gestao de alarmes do sistema</p>
        </div>

        {selectedEquipmentId && (
          <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-gray-900">Detalhes do alarme por equipamento</p>
              <p className="text-sm text-gray-600">{selectedEquipmentName}</p>
            </div>
            <Link
              to="/alarms"
              className="px-3 py-2 rounded-lg border border-gray-200 bg-white text-sm text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Limpar filtro
            </Link>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <AlarmsList
              alarms={scopedAlarms}
              selectedEquipmentId={selectedEquipmentId}
              selectedEquipmentName={selectedEquipmentName}
            />
          </div>
          <div className="lg:col-span-1">
            <RecurringAlarms alarms={filteredRecurringAlarms} />
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
