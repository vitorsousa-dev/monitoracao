import { useEffect, useMemo, useState } from 'react'
import { useParams, Link, useSearchParams } from 'react-router-dom'
import { ArrowLeft, AlertTriangle, Activity, CalendarClock, Droplets, History } from 'lucide-react'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { EquipmentStatusBadge } from '@/components/equipment/EquipmentStatusBadge'
import { PerformanceGauge } from '@/components/charts/PerformanceGauge'
import { EquipmentHistoryPanel } from '@/components/equipment-history/EquipmentHistoryPanel'
import { EquipmentRefrigerantPanel } from '@/components/equipment-refrigerant/EquipmentRefrigerantPanel'
import { EquipmentSchedulingPanel } from '@/components/equipment-scheduling/EquipmentSchedulingPanel'
import { findEquipmentCatalogItem } from '@/lib/equipmentCatalog'
import { useAuth } from '@/hooks/useAuth'

export function EquipmentDetail() {
  const { id } = useParams()
  const [searchParams, setSearchParams] = useSearchParams()
  const { hasClientAccess } = useAuth()
  const [activeTab, setActiveTab] = useState<'summary' | 'history' | 'scheduling' | 'refrigerant'>(
    searchParams.get('tab') === 'history'
      ? 'history'
      : searchParams.get('tab') === 'scheduling'
        ? 'scheduling'
        : searchParams.get('tab') === 'refrigerant'
          ? 'refrigerant'
        : 'summary'
  )
  const equipment = useMemo(() => (id ? findEquipmentCatalogItem(id) : undefined), [id])

  useEffect(() => {
    const requestedTab =
      searchParams.get('tab') === 'history'
        ? 'history'
        : searchParams.get('tab') === 'scheduling'
          ? 'scheduling'
          : searchParams.get('tab') === 'refrigerant'
            ? 'refrigerant'
          : 'summary'
    setActiveTab(requestedTab)
  }, [searchParams])

  const handleTabChange = (tab: 'summary' | 'history' | 'scheduling' | 'refrigerant') => {
    setActiveTab(tab)
    const nextSearchParams = new URLSearchParams(searchParams)
    nextSearchParams.set('tab', tab)
    setSearchParams(nextSearchParams, { replace: true })
  }

  if (!equipment) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <p className="text-gray-500">Equipamento não encontrado</p>
          <Link to="/equipment" className="text-primary hover:underline mt-4 inline-block">
            Voltar para lista
          </Link>
        </div>
      </DashboardLayout>
    )
  }

  if (!hasClientAccess(equipment.client)) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <p className="text-gray-500">Voce nao possui acesso a este equipamento.</p>
          <Link to="/equipment" className="text-primary hover:underline mt-4 inline-block">
            Voltar para lista
          </Link>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link to="/equipment" className="p-2 hover:bg-gray-100 rounded-lg">
            <ArrowLeft className="h-5 w-5 text-gray-600" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{equipment.name}</h1>
            <p className="text-gray-500">
              {equipment.type} • {equipment.area} • {equipment.client}
              {equipment.siteName ? ` • ${equipment.siteName}` : ''}
            </p>
          </div>
          <EquipmentStatusBadge status={equipment.status} />
        </div>

        <div className="flex flex-wrap gap-2 rounded-2xl border border-gray-200 bg-white p-2 shadow-sm">
          <button
            type="button"
            onClick={() => handleTabChange('summary')}
            className={`rounded-xl px-4 py-2.5 text-sm font-medium transition-colors ${
              activeTab === 'summary' ? 'bg-primary text-white' : 'text-gray-700 hover:bg-gray-50'
            }`}
          >
            Resumo
          </button>
          <button
            type="button"
            onClick={() => handleTabChange('history')}
            className={`inline-flex items-center rounded-xl px-4 py-2.5 text-sm font-medium transition-colors ${
              activeTab === 'history' ? 'bg-primary text-white' : 'text-gray-700 hover:bg-gray-50'
            }`}
          >
            <History className="mr-2 h-4 w-4" />
            Historico
          </button>
          <button
            type="button"
            onClick={() => handleTabChange('scheduling')}
            className={`inline-flex items-center rounded-xl px-4 py-2.5 text-sm font-medium transition-colors ${
              activeTab === 'scheduling' ? 'bg-primary text-white' : 'text-gray-700 hover:bg-gray-50'
            }`}
          >
            <CalendarClock className="mr-2 h-4 w-4" />
            Agendamento
          </button>
          <button
            type="button"
            onClick={() => handleTabChange('refrigerant')}
            className={`inline-flex items-center rounded-xl px-4 py-2.5 text-sm font-medium transition-colors ${
              activeTab === 'refrigerant' ? 'bg-primary text-white' : 'text-gray-700 hover:bg-gray-50'
            }`}
          >
            <Droplets className="mr-2 h-4 w-4" />
            Fluido
          </button>
        </div>

        {activeTab === 'summary' ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <PerformanceGauge value={equipment.health} title="Saúde" />
              <PerformanceGauge value={equipment.availability} title="Disponibilidade" />
              <PerformanceGauge value={equipment.comfort ?? equipment.health} title="Conforto" />
              <PerformanceGauge value={equipment.performance ?? equipment.availability} title="Desempenho" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Ocorrências</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-danger/5 rounded-lg">
                    <div className="flex items-center gap-3">
                      <AlertTriangle className="h-5 w-5 text-danger" />
                      <span className="font-medium text-gray-900">Críticas</span>
                    </div>
                    <span className="text-2xl font-bold text-danger">{equipment.criticalOccurrences}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-warning/5 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Activity className="h-5 w-5 text-warning" />
                      <span className="font-medium text-gray-900">Moderadas</span>
                    </div>
                    <span className="text-2xl font-bold text-warning">{equipment.moderateOccurrences}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-neutral/5 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Activity className="h-5 w-5 text-neutral" />
                      <span className="font-medium text-gray-900">Informativas</span>
                    </div>
                    <span className="text-2xl font-bold text-neutral">{equipment.informativeOccurrences}</span>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Detalhes</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">MTTR</span>
                    <span className="font-semibold text-gray-900">{equipment.mttr.toFixed(1)}h</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Última atualização</span>
                    <span className="font-semibold text-gray-900">
                      {new Date(equipment.lastUpdated).toLocaleDateString('pt-BR')}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Status</span>
                    <EquipmentStatusBadge status={equipment.status} />
                  </div>
                </div>
              </div>
            </div>
          </>
        ) : activeTab === 'history' ? (
          <EquipmentHistoryPanel equipment={equipment} />
        ) : activeTab === 'refrigerant' ? (
          <EquipmentRefrigerantPanel equipment={equipment} />
        ) : (
          <EquipmentSchedulingPanel equipment={equipment} />
        )}
      </div>
    </DashboardLayout>
  )
}
