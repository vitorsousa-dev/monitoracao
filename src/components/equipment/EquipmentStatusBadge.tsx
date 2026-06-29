import { cn } from '@/lib/utils'

interface EquipmentStatusBadgeProps {
  status: 'Verde' | 'Amarelo' | 'Vermelho'
}

export function EquipmentStatusBadge({ status }: EquipmentStatusBadgeProps) {
  const styles = {
    Verde: 'bg-success/10 text-success',
    Amarelo: 'bg-warning/10 text-warning',
    Vermelho: 'bg-danger/10 text-danger',
  }

  return (
    <span className={cn(
      "px-3 py-1 rounded-full text-xs font-medium",
      styles[status]
    )}>
      {status}
    </span>
  )
}
