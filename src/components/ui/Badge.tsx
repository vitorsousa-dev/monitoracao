import { ReactNode } from 'react'
import { cn } from '@/lib/utils'

type BadgeTone = 'default' | 'success' | 'warning' | 'danger' | 'info' | 'primary'

const toneStyles: Record<BadgeTone, string> = {
  default: 'bg-surface-muted text-muted border-border',
  success: 'bg-success-soft text-success border-success/20',
  warning: 'bg-warning-soft text-warning border-warning/20',
  danger: 'bg-danger-soft text-danger border-danger/20',
  info: 'bg-info-soft text-info border-info/20',
  primary: 'bg-primary-soft text-primary border-primary/20',
}

interface BadgeProps {
  children: ReactNode
  tone?: BadgeTone
  className?: string
  icon?: ReactNode
}

export function Badge({ children, tone = 'default', className, icon }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium',
        toneStyles[tone],
        className
      )}
    >
      {icon}
      {children}
    </span>
  )
}
