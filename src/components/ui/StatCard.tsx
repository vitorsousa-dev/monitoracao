import { ReactNode } from 'react'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { cn } from '@/lib/utils'

interface StatCardProps {
  label: string
  value: ReactNode
  unit?: string
  icon?: ReactNode
  trend?: {
    value: string
    direction: 'up' | 'down' | 'neutral'
    inverse?: boolean
  }
  subtitle?: ReactNode
  tone?: 'default' | 'success' | 'warning' | 'danger' | 'primary'
}

const toneRing: Record<NonNullable<StatCardProps['tone']>, string> = {
  default: 'bg-surface-muted text-muted',
  success: 'bg-success-soft text-success',
  warning: 'bg-warning-soft text-warning',
  danger: 'bg-danger-soft text-danger',
  primary: 'bg-primary-soft text-primary',
}

export function StatCard({ label, value, unit, icon, trend, subtitle, tone = 'default' }: StatCardProps) {
  const trendGood =
    trend?.direction === 'neutral' ? true : trend?.inverse ? trend.direction === 'down' : trend?.direction === 'up'

  return (
    <div className="rounded-xl border border-border bg-surface p-5 shadow-xs">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[13px] font-medium text-muted">{label}</p>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-2xl font-bold tracking-tight text-foreground tabular-nums">{value}</span>
            {unit && <span className="text-sm font-medium text-muted">{unit}</span>}
          </div>
        </div>
        {icon && (
          <div className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-lg', toneRing[tone])}>
            {icon}
          </div>
        )}
      </div>

      {(trend || subtitle) && (
        <div className="mt-3 flex items-center gap-2">
          {trend && (
            <span
              className={cn(
                'inline-flex items-center gap-1 text-xs font-semibold',
                trend.direction === 'neutral'
                  ? 'text-muted'
                  : trendGood
                    ? 'text-success'
                    : 'text-danger'
              )}
            >
              {trend.direction === 'up' && <TrendingUp className="h-3.5 w-3.5" />}
              {trend.direction === 'down' && <TrendingDown className="h-3.5 w-3.5" />}
              {trend.direction === 'neutral' && <Minus className="h-3.5 w-3.5" />}
              {trend.value}
            </span>
          )}
          {subtitle && <span className="text-xs text-muted">{subtitle}</span>}
        </div>
      )}
    </div>
  )
}
