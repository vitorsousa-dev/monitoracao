import { NavLink } from 'react-router-dom'
import { 
  LayoutDashboard, 
  Thermometer, 
  Calendar, 
  Settings,
  Activity,
  AlertTriangle,
  TrendingUp,
  Droplets,
  Users
} from 'lucide-react'
import { cn } from '@/lib/utils'

const navItems = [
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/equipment', label: 'Saúde dos Equipamentos', icon: Thermometer },
  { path: '/alarms', label: 'Alarmes', icon: AlertTriangle },
  { path: '/predictive', label: 'Manutenção Preditiva', icon: TrendingUp },
  { path: '/sustainability', label: 'Sustentabilidade', icon: Droplets },
  { path: '/users', label: 'Usuários', icon: Users },
  { path: '/updates', label: 'Atualizações Semanais', icon: Calendar },
  { path: '/settings', label: 'Configurações', icon: Settings },
]

export function Sidebar() {
  return (
    <aside className="w-64 bg-white border-r border-gray-200 min-h-screen flex flex-col">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <Activity className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-xl font-bold text-gray-900">HVAC Monitor</h1>
            <p className="text-xs text-gray-500">Sistema de Monitoramento</p>
          </div>
        </div>
      </div>
      
      <nav className="flex-1 p-4 space-y-2">
        {navItems.map((item) => (
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
