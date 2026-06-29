import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, AlertTriangle, Activity } from 'lucide-react'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { EquipmentStatusBadge } from '@/components/equipment/EquipmentStatusBadge'
import { PerformanceGauge } from '@/components/charts/PerformanceGauge'
import { mockEquipment } from '@/lib/mockData'

export function EquipmentDetail() {
  const { id } = useParams()
  const equipment = mockEquipment.find(e => e.id === id)

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

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link to="/equipment" className="p-2 hover:bg-gray-100 rounded-lg">
            <ArrowLeft className="h-5 w-5 text-gray-600" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{equipment.name}</h1>
            <p className="text-gray-500">{equipment.type} • {equipment.area} • {equipment.client}</p>
          </div>
          <EquipmentStatusBadge status={equipment.status} />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <PerformanceGauge value={equipment.health} title="Saúde" />
          <PerformanceGauge value={equipment.availability} title="Disponibilidade" />
          <PerformanceGauge value={equipment.comfort} title="Conforto" />
          <PerformanceGauge value={equipment.performance} title="Desempenho" />
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
      </div>
    </DashboardLayout>
  )
}
