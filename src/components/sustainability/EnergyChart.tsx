import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { EnergyData } from '../../types'

interface EnergyChartProps {
  data: EnergyData[]
}

export function EnergyChart({ data }: EnergyChartProps) {
  if (data.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Consumo Elétrico</h3>
        </div>
        <div className="rounded-xl border border-dashed border-primary/30 bg-primary/5 p-6">
          <p className="text-base font-medium text-gray-900">Aguardando conexão com multimedidor</p>
          <p className="mt-2 text-sm text-gray-600">
            Os dados de consumo elétrico serão exibidos automaticamente assim que a integração com o multimedidor estiver disponível.
          </p>
        </div>
      </div>
    )
  }

  const totalKwh = data.reduce((sum, item) => sum + item.kwhConsumed, 0)
  const totalCost = data.reduce((sum, item) => sum + item.kwhCost, 0)
  const avgKwh = Math.round(totalKwh / data.length)

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Consumo de Energia (kWh)</h3>
        <div className="text-right">
          <p className="text-2xl font-bold text-primary">{avgKwh} kWh</p>
          <p className="text-xs text-gray-500">Media mensal</p>
        </div>
      </div>
      
      <div className="mb-4 grid grid-cols-2 gap-4">
        <div className="bg-gray-50 p-3 rounded-lg">
          <p className="text-xs text-gray-500">Total Consumido</p>
          <p className="text-xl font-bold text-gray-900">{totalKwh.toLocaleString()} kWh</p>
        </div>
        <div className="bg-gray-50 p-3 rounded-lg">
          <p className="text-xs text-gray-500">Custo Total</p>
          <p className="text-xl font-bold text-gray-900">R${totalCost.toFixed(2)}</p>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={250}>
        <AreaChart data={data} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
          <defs>
            <linearGradient id="colorKwh" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#0F6CBD" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#0F6CBD" stopOpacity={0} />
            </linearGradient>
          </defs>
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
          <Area
            type="monotone"
            dataKey="kwhConsumed"
            name="Consumo (kWh)"
            stroke="#0F6CBD"
            strokeWidth={2}
            fillOpacity={1}
            fill="url(#colorKwh)"
          />
          <Area
            type="monotone"
            dataKey="target"
            name="Meta"
            stroke="#00B050"
            strokeWidth={2}
            strokeDasharray="5 5"
            fill="none"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
