import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Thermometer, Clock, AlertTriangle, CheckCircle } from 'lucide-react'
import { Equipment, EquipmentJustification } from '@/types'
import { EquipmentStatusBadge } from './EquipmentStatusBadge'
import { getHealthStatusColor } from '@/lib/utils'

interface EquipmentCardProps {
  equipment: Equipment
  justification?: EquipmentJustification
}

export function EquipmentCard({ equipment, justification }: EquipmentCardProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  return (
    <div className="block rounded-xl border border-gray-200 bg-white p-6 transition-shadow hover:shadow-md">
      <div className="flex items-start justify-between mb-4">
        <div>
          <Link to={`/equipment/${equipment.id}`} className="inline-block">
            <h3 className="text-lg font-semibold text-gray-900 hover:text-primary transition-colors">{equipment.name}</h3>
          </Link>
          <p className="text-sm text-gray-500">{equipment.type} • {equipment.area}</p>
        </div>
        <EquipmentStatusBadge status={equipment.status} />
      </div>
      
      <div className="space-y-4">
        <div>
          <div className="flex items-center justify-between text-sm mb-1">
            <span className="text-gray-600 flex items-center gap-1">
              <Thermometer className="h-4 w-4" /> Saúde
            </span>
            <span className="font-semibold" style={{ color: getHealthStatusColor(equipment.health) }}>
              {equipment.health}%
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="h-2 rounded-full transition-all"
              style={{ 
                width: `${equipment.health}%`,
                backgroundColor: getHealthStatusColor(equipment.health)
              }}
            />
          </div>
        </div>
        
        <div className="grid grid-cols-3 gap-4 pt-2 border-t border-gray-100">
          <div className="text-center">
            <div className="flex items-center justify-center text-primary mb-1">
              <CheckCircle className="h-4 w-4" />
            </div>
            <p className="text-lg font-bold text-gray-900">{equipment.availability}%</p>
            <p className="text-xs text-gray-500">Disp.</p>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center text-warning mb-1">
              <Clock className="h-4 w-4" />
            </div>
            <p className="text-lg font-bold text-gray-900">{equipment.mttr.toFixed(1)}h</p>
            <p className="text-xs text-gray-500">MTTR</p>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center text-danger mb-1">
              <AlertTriangle className="h-4 w-4" />
            </div>
            <p className="text-lg font-bold text-gray-900">{equipment.totalOccurrences}</p>
            <p className="text-xs text-gray-500">Ocorrências</p>
          </div>
        </div>

        {justification && (
          <div className="pt-4 border-t border-gray-100">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Justificativa</p>
            <p className="mt-2 text-sm text-gray-700">{justification.summary}</p>

            <button
              type="button"
              onClick={() => setIsExpanded((current) => !current)}
              className="mt-3 inline-flex items-center rounded-lg border border-primary/20 bg-primary/5 px-3 py-2 text-xs font-medium text-primary transition-colors hover:bg-primary/10"
            >
              {isExpanded ? 'Ocultar detalhes' : 'Mais detalhes'}
            </button>

            {isExpanded && (
              <div className="mt-3 rounded-lg bg-slate-50 p-3">
                <ul className="space-y-2 text-xs leading-5 text-gray-600">
                  {justification.details.map((detail) => (
                    <li key={detail}>- {detail}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        <div className="pt-3">
          <Link
            to={`/equipment/${equipment.id}`}
            className="inline-flex items-center text-xs font-medium text-primary hover:text-primary/80 transition-colors"
          >
            Abrir equipamento
          </Link>
        </div>
      </div>
    </div>
  )
}
