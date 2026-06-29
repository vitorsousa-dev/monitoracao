import { RadialBarChart, RadialBar, ResponsiveContainer } from 'recharts'
import { getHealthStatusColor } from '@/lib/utils'

interface PerformanceGaugeProps {
  value: number
  title: string
  subtitle?: string
}

export function PerformanceGauge({ value, title, subtitle }: PerformanceGaugeProps) {
  const data = [
    { name: 'value', value: value, fill: getHealthStatusColor(value) }
  ]

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
      {subtitle && <p className="text-sm text-gray-500 mb-4">{subtitle}</p>}
      
      <div className="relative">
        <ResponsiveContainer width="100%" height={200}>
          <RadialBarChart cx="50%" cy="50%" innerRadius="70%" outerRadius="100%" barSize={10} data={data} startAngle={180} endAngle={0}>
            <RadialBar
              background
              dataKey="value"
              cornerRadius={10}
            />
          </RadialBarChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-4xl font-bold" style={{ color: getHealthStatusColor(value) }}>
            {value}%
          </span>
        </div>
      </div>
    </div>
  )
}
