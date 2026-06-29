import { useState } from 'react'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { EquipmentCard } from '@/components/equipment/EquipmentCard'
import { EquipmentFilters } from '@/components/equipment/EquipmentFilters'
import { mockEquipment } from '@/lib/mockData'

export function EquipmentHealth() {
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [typeFilter, setTypeFilter] = useState('')

  const filteredEquipment = mockEquipment.filter(equipment => {
    const matchesSearch = equipment.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         equipment.area.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = !statusFilter || equipment.status === statusFilter
    const matchesType = !typeFilter || equipment.type === typeFilter
    
    return matchesSearch && matchesStatus && matchesType
  })

  const stats = {
    total: mockEquipment.length,
    healthy: mockEquipment.filter(e => e.status === 'Verde').length,
    warning: mockEquipment.filter(e => e.status === 'Amarelo').length,
    critical: mockEquipment.filter(e => e.status === 'Vermelho').length
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Saúde dos Equipamentos</h1>
          <p className="text-gray-500">Monitoramento detalhado de todos os equipamentos</p>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-sm text-gray-500 mb-1">Total</p>
            <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-sm text-gray-500 mb-1">Verdes</p>
            <p className="text-2xl font-bold text-success">{stats.healthy}</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-sm text-gray-500 mb-1">Amarelos</p>
            <p className="text-2xl font-bold text-warning">{stats.warning}</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-sm text-gray-500 mb-1">Vermelhos</p>
            <p className="text-2xl font-bold text-danger">{stats.critical}</p>
          </div>
        </div>
        
        <EquipmentFilters
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          statusFilter={statusFilter}
          onStatusFilterChange={setStatusFilter}
          typeFilter={typeFilter}
          onTypeFilterChange={setTypeFilter}
        />
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredEquipment.map(equipment => (
            <EquipmentCard key={equipment.id} equipment={equipment} />
          ))}
          {filteredEquipment.length === 0 && (
            <div className="col-span-full text-center py-12">
              <p className="text-gray-500">Nenhum equipamento encontrado</p>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}
