import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { HealthTrendData } from '@/types'

interface HealthTrendChartProps {
  data: HealthTrendData[]
}

export function HealthTrendChart({ data }: HealthTrendChartProps) {
  return (
    <div className="rounded-xl border border-border bg-surface p-6 shadow-xs">
      <h3 className="mb-4 text-base font-semibold text-foreground">Tendência de Saúde do Sistema</h3>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E6E9EF" />
          <XAxis dataKey="month" stroke="#687080" />
          <YAxis domain={[75, 100]} stroke="#687080" />
          <Tooltip
            contentStyle={{
              backgroundColor: '#FFFFFF',
              border: '1px solid #E6E9EF',
              borderRadius: '8px',
              boxShadow: '0 4px 6px -1px rgba(16, 24, 40, 0.06)',
              fontSize: '12px',
            }}
          />
          <Legend wrapperStyle={{ fontSize: '12px' }} />
          <Line
            type="monotone"
            dataKey="health"
            name="Saúde do Sistema"
            stroke="#4F46E5"
            strokeWidth={2}
            dot={{ fill: '#4F46E5', r: 4 }}
            activeDot={{ r: 6 }}
          />
          <Line
            type="monotone"
            dataKey="target"
            name="Meta"
            stroke="#16A36A"
            strokeWidth={2}
            strokeDasharray="5 5"
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
