import { IEERData } from '../../types'
import { Gauge, GaugeCircle } from 'lucide-react'

interface IEERCalculatorProps {
  data: IEERData[]
}

export function IEERCalculator({ data }: IEERCalculatorProps) {
  const avgIEER = data.reduce((sum, item) => sum + item.ieer, 0) / data.length
  const avgEfficiency = data.reduce((sum, item) => sum + item.efficiency, 0) / data.length

  const getEfficiencyColor = (efficiency: number) => {
    if (efficiency >= 100) return 'text-success'
    if (efficiency >= 90) return 'text-warning'
    return 'text-danger'
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Indice IEER</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-gradient-to-br from-primary/5 to-primary/10 p-6 rounded-xl text-center">
          <div className="flex items-center justify-center mb-3">
            <Gauge className="h-8 w-8 text-primary" />
          </div>
          <p className="text-xs text-gray-500 mb-1">IEER Medio</p>
          <p className="text-4xl font-bold text-primary">{avgIEER.toFixed(1)}</p>
          <p className="text-xs text-gray-500 mt-1">Meta: {data[0]?.target} IEER</p>
        </div>
        <div className="bg-gradient-to-br from-success/5 to-success/10 p-6 rounded-xl text-center">
          <div className="flex items-center justify-center mb-3">
            <GaugeCircle className="h-8 w-8 text-success" />
          </div>
          <p className="text-xs text-gray-500 mb-1">Eficiencia Media</p>
          <p className={`text-4xl font-bold ${getEfficiencyColor(avgEfficiency)}`}>{avgEfficiency.toFixed(1)}%</p>
          <p className="text-xs text-gray-500 mt-1">vs. ideal</p>
        </div>
      </div>

      <div className="mt-6 space-y-3">
        <h4 className="font-medium text-gray-700 text-sm">Por Equipamento</h4>
        {data.map((item) => (
          <div key={item.equipmentId} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div>
              <p className="font-medium text-gray-900">{item.equipmentName}</p>
              <p className="text-xs text-gray-500">Atualizado: {item.lastUpdated}</p>
            </div>
            <div className="text-right">
              <p className={`text-xl font-bold ${getEfficiencyColor(item.efficiency)}`}>{item.ieer.toFixed(1)} IEER</p>
              <p className={`text-xs ${getEfficiencyColor(item.efficiency)}`}>{item.efficiency.toFixed(1)}% eficiencia</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
