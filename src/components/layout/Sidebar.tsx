import { NavLink } from 'react-router-dom'
import { 
  LayoutDashboard, 
  Thermometer, 
  Calendar, 
  Settings,
  AlertTriangle,
  TrendingUp,
  Droplets,
  Users
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuth } from '@/hooks/useAuth'

const navItems = [
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/equipment', label: 'Saúde dos Equipamentos', icon: Thermometer },
  { path: '/alarms', label: 'Alarmes', icon: AlertTriangle },
  { path: '/predictive', label: 'Manutenção Preditiva', icon: TrendingUp },
  { path: '/sustainability', label: 'Sustentabilidade', icon: Droplets },
  { path: '/users', label: 'Usuários', icon: Users, adminOnly: true },
  { path: '/updates', label: 'Atualizações Semanais', icon: Calendar },
  { path: '/settings', label: 'Configurações', icon: Settings },
]

export function Sidebar() {
  const { canManageUsers } = useAuth()
  const visibleNavItems = navItems.filter((item) => !item.adminOnly || canManageUsers)

  return (
    <aside className="w-64 bg-white border-r border-gray-200 min-h-screen flex flex-col">
      <div className="border-b border-gray-200 p-6">
        <div className="flex items-center justify-center">
          <img
            src="/ems-logo.png"
            alt="EMS"
            className="h-auto w-full max-w-[300px] object-contain"
          />
        </div>
      </div>
      
      <nav className="flex-1 p-4 space-y-2">
        {visibleNavItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 px-4 py-3 rounded-lg transition-colors",
                isActive
                  ? "bg-primary/10 text-primary font-medium"
                  : "text-gray-600 hover:bg-gray-100"
              )
            }
          >
            <item.icon className="h-5 w-5" />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>
    </aside>
  )
}
