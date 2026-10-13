import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { UptimeData } from '@/types'

interface UptimeChartProps {
  data: UptimeData[]
}

export function UptimeChart({ data }: UptimeChartProps) {
  return (
    <div className="rounded-xl border border-border bg-surface p-6 shadow-xs">
      <h3 className="mb-4 text-base font-semibold text-foreground">Disponibilidade Operacional</h3>
      <ResponsiveContainer width="100%" height={300}>
        <AreaChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <defs>
            <linearGradient id="colorAvailability" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#4F46E5" stopOpacity={0.25} />
              <stop offset="95%" stopColor="#4F46E5" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#E6E9EF" />
          <XAxis dataKey="month" stroke="#687080" />
          <YAxis domain={[85, 100]} stroke="#687080" />
          <Tooltip
            contentStyle={{
              backgroundColor: '#FFFFFF',
              border: '1px solid #E6E9EF',
              borderRadius: '8px',
              boxShadow: '0 4px 6px -1px rgba(16, 24, 40, 0.06)',
              fontSize: '12px',
            }}
          />
          <Area
            type="monotone"
            dataKey="availability"
            name="Disponibilidade Operacional"
            stroke="#4F46E5"
            strokeWidth={2}
            fillOpacity={1}
            fill="url(#colorAvailability)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
