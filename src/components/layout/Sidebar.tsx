import { NavLink, useLocation } from 'react-router-dom'
import {
  LayoutDashboard,
  Thermometer,
  AlertTriangle,
  Wallet,
  TrendingUp,
  Droplets,
  KanbanSquare,
  Boxes,
  Calendar,
  Settings,
  Users,
  ChevronLeft,
  ChevronRight,
  X,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useScope } from '@/hooks/useScope'
import { useLayout } from '@/contexts/LayoutContext'
import { useAuth } from '@/hooks/useAuth'

interface NavItem {
  path: string
  label: string
  icon: React.ComponentType<{ className?: string }>
  badge?: string
}

interface NavGroup {
  label: string
  items: NavItem[]
}

const navGroups: NavGroup[] = [
  {
    label: 'Visão geral',
    items: [{ path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard }],
  },
  {
    label: 'Operação',
    items: [
      { path: '/equipment', label: 'Saúde dos Equipamentos', icon: Thermometer },
      { path: '/alarms', label: 'Alarmes', icon: AlertTriangle },
      { path: '/alert-management', label: 'Gestão de Alertas', icon: KanbanSquare },
    ],
  },
  {
    label: 'Análise & Gestão',
    items: [
      { path: '/assets', label: 'Gestão de Ativos', icon: Boxes },
      { path: '/financial', label: 'Gestão Financeira', icon: Wallet },
      { path: '/predictive', label: 'Manutenção Preditiva', icon: TrendingUp },
      { path: '/sustainability', label: 'Sustentabilidade', icon: Droplets },
      { path: '/updates', label: 'Atualizações Semanais', icon: Calendar },
    ],
  },
  {
    label: 'Administração',
    items: [
      { path: '/users', label: 'Usuários', icon: Users },
      { path: '/settings', label: 'Configurações', icon: Settings },
    ],
  },
]

export function Sidebar() {
  const { sidebarCollapsed, toggleSidebarCollapsed, mobileSidebarOpen, closeMobileSidebar } = useLayout()
  const { selectedClient, availableClients } = useScope()
  const { user } = useAuth()
  const location = useLocation()

  const clientLabel = availableClients.find((c) => c.id === selectedClient)?.label ?? 'Todos os clientes'

  const isCollapsed = sidebarCollapsed

  const sidebarWidth = isCollapsed ? 'lg:w-[72px]' : 'lg:w-64'

  return (
    <>
      {/* Mobile backdrop */}
      {mobileSidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
          onClick={closeMobileSidebar}
          aria-hidden
        />
      )}

      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex flex-col border-r border-border bg-surface transition-[width,transform] duration-200 ease-out lg:static lg:z-auto',
          sidebarWidth,
          mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        {/* Brand */}
        <div className="flex h-16 items-center justify-between border-b border-border px-4">
          <div className={cn('flex items-center gap-2.5', isCollapsed && 'lg:justify-center lg:px-0')}>
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm">
              <LayoutDashboard className="h-5 w-5" />
            </div>
            {!isCollapsed && (
              <div className="min-w-0">
                <p className="truncate text-[15px] font-bold leading-tight text-foreground">MeuDashboard</p>
                <p className="truncate text-[11px] text-muted">Monitoramento operacional</p>
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={closeMobileSidebar}
            className="rounded-md p-1.5 text-muted hover:bg-surface-muted hover:text-foreground lg:hidden"
            aria-label="Fechar menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Workspace / Cliente atual */}
        {!isCollapsed && (
          <div className="border-b border-border p-3">
            <div className="rounded-lg bg-surface-muted p-3">
              <p className="text-[11px] font-medium uppercase tracking-wide text-muted">Espaço de trabalho</p>
              <p className="mt-1 truncate text-sm font-semibold text-foreground">{clientLabel}</p>
            </div>
          </div>
        )}

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 scrollbar-thin">
          {navGroups.map((group) => (
            <div key={group.label} className="mb-5">
              {!isCollapsed && (
                <p className="mb-1.5 px-3 text-[11px] font-semibold uppercase tracking-wider text-muted">
                  {group.label}
                </p>
              )}
              <ul className="space-y-1">
                {group.items.map((item) => {
                  const active = location.pathname === item.path || location.pathname.startsWith(`${item.path}/`)
                  return (
                    <li key={item.path}>
                      <NavLink
                        to={item.path}
                        onClick={mobileSidebarOpen ? closeMobileSidebar : undefined}
                        className={cn(
                          'group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                          isCollapsed && 'lg:justify-center lg:px-2',
                          active
                            ? 'bg-primary-soft text-primary'
                            : 'text-muted hover:bg-surface-muted hover:text-foreground'
                        )}
                        title={isCollapsed ? item.label : undefined}
                      >
                        {active && (
                          <span className="absolute left-0 top-1/2 h-5 w-1 -translate-y-1/2 rounded-r bg-primary" />
                        )}
                        <item.icon className={cn('h-[18px] w-[18px] shrink-0', active ? 'text-primary' : '')} />
                        {!isCollapsed && <span className="truncate">{item.label}</span>}
                      </NavLink>
                    </li>
                  )
                })}
              </ul>
            </div>
          ))}
        </nav>

        {/* User + collapse */}
        <div className="border-t border-border p-3">
          {!isCollapsed ? (
            <div className="flex items-center gap-3 rounded-lg p-2">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary-soft text-sm font-bold text-primary">
                {user?.name?.charAt(0)?.toUpperCase() ?? 'U'}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-foreground">{user?.name ?? 'Usuário'}</p>
                <p className="truncate text-[11px] text-muted">
                  {user?.role === 'admin' ? 'Administrador' : user?.role === 'manager' ? 'Gerente' : 'Usuário'}
                </p>
              </div>
              <button
                type="button"
                onClick={toggleSidebarCollapsed}
                className="rounded-md p-1.5 text-muted hover:bg-surface-muted hover:text-foreground"
                aria-label="Recolher menu"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={toggleSidebarCollapsed}
              className="flex w-full items-center justify-center rounded-lg p-2.5 text-muted hover:bg-surface-muted hover:text-foreground"
              aria-label="Expandir menu"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          )}
        </div>
      </aside>
    </>
  )
}
