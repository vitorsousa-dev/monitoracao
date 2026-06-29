import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { UptimeData } from '@/types'

interface UptimeChartProps {
  data: UptimeData[]
}

export function UptimeChart({ data }: UptimeChartProps) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Disponibilidade Operacional</h3>
      <ResponsiveContainer width="100%" height={300}>
        <AreaChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <defs>
            <linearGradient id="colorAvailability" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#0F6CBD" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#0F6CBD" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
          <XAxis dataKey="month" stroke="#6C757D" />
          <YAxis domain={[85, 100]} stroke="#6C757D" />
          <Tooltip
            contentStyle={{
              backgroundColor: '#FFFFFF',
              border: '1px solid #E5E7EB',
              borderRadius: '8px',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
            }}
          />
          <Area
            type="monotone"
            dataKey="availability"
            name="Disponibilidade"
            stroke="#0F6CBD"
            strokeWidth={2}
            fillOpacity={1}
            fill="url(#colorAvailability)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
