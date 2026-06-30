import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { WaterData } from '../../types'
import { Droplets } from 'lucide-react'

interface WaterChartProps {
  data: WaterData[]
}

export function WaterChart({ data }: WaterChartProps) {
  if (data.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center gap-2 mb-4">
          <Droplets className="h-6 w-6 text-primary" />
          <h3 className="text-lg font-semibold text-gray-900">Consumo de Agua</h3>
        </div>
        <div className="rounded-xl border border-dashed border-primary/30 bg-primary/5 p-6">
          <p className="text-base font-medium text-gray-900">Aguardando integração com sensores</p>
          <p className="mt-2 text-sm text-gray-600">
            Os indicadores de consumo de água serão disponibilizados quando a leitura dos sensores estiver conectada à plataforma.
          </p>
        </div>
      </div>
    )
  }

  const totalWater = data.reduce((sum, item) => sum + item.cubicMeters, 0)
  const totalCost = data.reduce((sum, item) => sum + item.cost, 0)

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Droplets className="h-6 w-6 text-primary" />
          <h3 className="text-lg font-semibold text-gray-900">Consumo de Agua</h3>
        </div>
      </div>

      <div className="mb-4 grid grid-cols-2 gap-4">
        <div className="bg-gray-50 p-3 rounded-lg">
          <p className="text-xs text-gray-500">Total Consumido</p>
          <p className="text-xl font-bold text-gray-900">{totalWater.toFixed(1)} m³</p>
        </div>
        <div className="bg-gray-50 p-3 rounded-lg">
          <p className="text-xs text-gray-500">Custo Total</p>
          <p className="text-xl font-bold text-gray-900">R${totalCost.toFixed(2)}</p>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={250}>
        <BarChart data={data} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
          <XAxis dataKey="month" stroke="#6C757D" />
          <YAxis stroke="#6C757D" />
          <Tooltip
            contentStyle={{
              backgroundColor: '#FFFFFF',
              border: '1px solid #E5E7EB',
              borderRadius: '8px',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
            }}
          />
          <Legend />
          <Bar dataKey="cubicMeters" name="m³" fill="#0F6CBD" radius={[4, 4, 0, 0]} />
          <Bar dataKey="target" name="Meta" fill="#00B050" radius={[4, 4, 0, 0]} opacity={0.7} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
