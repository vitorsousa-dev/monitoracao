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
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <h3 className="text-xl font-semibold text-gray-900">{title}</h3>
      {subtitle && <p className="mt-2 text-sm leading-6 text-gray-500">{subtitle}</p>}
      
      <div className="relative mt-3 h-[138px]">
        <ResponsiveContainer width="100%" height="100%">
          <RadialBarChart cx="50%" cy="68%" innerRadius="72%" outerRadius="100%" barSize={9} data={data} startAngle={180} endAngle={0}>
            <RadialBar
              background
              dataKey="value"
              cornerRadius={10}
            />
          </RadialBarChart>
        </ResponsiveContainer>
        <div className="absolute inset-x-0 bottom-1 flex items-end justify-center">
          <span className="text-[2.2rem] font-bold leading-none" style={{ color: getHealthStatusColor(value) }}>
            {value}%
          </span>
        </div>
      </div>
    </div>
  )
}
