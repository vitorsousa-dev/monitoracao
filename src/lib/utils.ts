import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getHealthStatusColor(health: number) {
  if (health >= 90) return '#00B050'
  if (health >= 80) return '#FFC000'
  return '#E53935'
}

export function getHealthStatusText(health: number) {
  if (health >= 90) return 'Verde'
  if (health >= 80) return 'Amarelo'
  return 'Vermelho'
}
