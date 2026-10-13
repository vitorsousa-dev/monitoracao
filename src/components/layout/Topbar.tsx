import { useState, useEffect, useRef } from 'react'
import { useLocation, Link } from 'react-router-dom'
import { Bell, Building2, MapPinned, Menu, LogOut, ChevronDown, Settings } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { useScope } from '@/hooks/useScope'
import { useLayout } from '@/contexts/LayoutContext'
import { cn } from '@/lib/utils'

const pageTitles: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/equipment': 'Saúde dos Equipamentos',
  '/alarms': 'Alarmes',
  '/alert-management': 'Gestão de Alertas',
  '/assets': 'Gestão de Ativos',
  '/financial': 'Gestão Financeira',
  '/predictive': 'Manutenção Preditiva',
  '/sustainability': 'Sustentabilidade',
  '/updates': 'Atualizações Semanais',
  '/users': 'Usuários',
  '/settings': 'Configurações',
}

function getBreadcrumb(path: string) {
  if (pageTitles[path]) return pageTitles[path]
  const base = '/' + path.split('/')[1]
  return pageTitles[base] ?? 'Página'
}

export function Topbar() {
  const { user, logout } = useAuth()
  const { selectedClient, selectedSite, availableClients, availableSites, canSelectAnyClient, setSelectedClient, setSelectedSite } = useScope()
  const { openMobileSidebar } = useLayout()
  const location = useLocation()
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const userMenuRef = useRef<HTMLDivElement>(null)

  const currentTitle = getBreadcrumb(location.pathname)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const roleLabel = user?.role === 'admin' ? 'Administrador' : user?.role === 'manager' ? 'Gerente' : 'Usuário'

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-surface/80 backdrop-blur-md">
      <div className="flex h-16 items-center gap-3 px-4 lg:px-6">
        {/* Mobile menu */}
        <button
          type="button"
          onClick={openMobileSidebar}
          className="rounded-md p-2 text-muted hover:bg-surface-muted hover:text-foreground lg:hidden"
          aria-label="Abrir menu"
        >
          <Menu className="h-5 w-5" />
        </button>

        {/* Breadcrumbs */}
        <div className="min-w-0 flex-1">
          <nav className="flex items-center gap-1.5 text-sm text-muted">
            <Link to="/dashboard" className="truncate hover:text-foreground">
              MeuDashboard
            </Link>
            <span className="text-border">/</span>
            <span className="truncate font-medium text-foreground">{currentTitle}</span>
          </nav>
        </div>

        {/* Scope selects */}
        <div className="hidden items-center gap-2 md:flex">
          <div className="relative">
            <Building2 className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
            <select
              value={selectedClient}
              onChange={(e) => setSelectedClient(e.target.value)}
              disabled={!canSelectAnyClient}
              className="h-9 w-[180px] appearance-none rounded-lg border border-border bg-surface pl-8 pr-7 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary disabled:cursor-not-allowed disabled:bg-surface-muted"
            >
              {availableClients.map((client) => (
                <option key={client.id} value={client.id}>
                  {client.label}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
          </div>

          <div className="relative">
            <MapPinned className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
            <select
              value={selectedSite}
              onChange={(e) => setSelectedSite(e.target.value)}
              className="h-9 w-[200px] appearance-none rounded-lg border border-border bg-surface pl-8 pr-7 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            >
              {availableSites.map((site) => (
                <option key={site.id} value={site.id}>
                  {site.label}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
          </div>
        </div>

        {/* Notifications */}
        <button
          type="button"
          className="relative rounded-lg p-2 text-muted hover:bg-surface-muted hover:text-foreground"
          aria-label="Notificações"
        >
          <Bell className="h-5 w-5" />
          <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-danger ring-2 ring-surface" />
        </button>

        {/* User menu */}
        <div className="relative" ref={userMenuRef}>
          <button
            type="button"
            onClick={() => setUserMenuOpen((o) => !o)}
            className="flex items-center gap-2 rounded-lg p-1 hover:bg-surface-muted"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-soft text-sm font-bold text-primary">
              {user?.name?.charAt(0)?.toUpperCase() ?? 'U'}
            </div>
            <div className="hidden text-left lg:block">
              <p className="text-sm font-semibold leading-tight text-foreground">{user?.name}</p>
              <p className="text-[11px] leading-tight text-muted">{roleLabel}</p>
            </div>
            <ChevronDown className={cn('hidden h-4 w-4 text-muted transition-transform lg:block', userMenuOpen && 'rotate-180')} />
          </button>

          {userMenuOpen && (
            <div className="absolute right-0 top-full mt-2 w-56 origin-top-right animate-fade-in rounded-xl border border-border bg-surface p-1.5 shadow-lg">
              <div className="border-b border-border px-3 py-2.5">
                <p className="text-sm font-semibold text-foreground">{user?.name}</p>
                <p className="text-[11px] text-muted">{user?.email}</p>
              </div>
              <Link
                to="/settings"
                onClick={() => setUserMenuOpen(false)}
                className="mt-1 flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-muted hover:bg-surface-muted hover:text-foreground"
              >
                <Settings className="h-4 w-4" />
                Configurações
              </Link>
              <button
                type="button"
                onClick={() => {
                  setUserMenuOpen(false)
                  logout()
                }}
                className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-danger hover:bg-danger-soft"
              >
                <LogOut className="h-4 w-4" />
                Sair
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Mobile scope */}
      <div className="flex items-center gap-2 border-t border-border px-4 py-2 md:hidden">
        <div className="relative flex-1">
          <Building2 className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
          <select
            value={selectedClient}
            onChange={(e) => setSelectedClient(e.target.value)}
            disabled={!canSelectAnyClient}
            className="h-9 w-full appearance-none rounded-lg border border-border bg-surface pl-8 pr-7 text-sm text-foreground"
          >
            {availableClients.map((client) => (
              <option key={client.id} value={client.id}>
                {client.label}
              </option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
        </div>
        <div className="relative flex-1">
          <MapPinned className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
          <select
            value={selectedSite}
            onChange={(e) => setSelectedSite(e.target.value)}
            className="h-9 w-full appearance-none rounded-lg border border-border bg-surface pl-8 pr-7 text-sm text-foreground"
          >
            {availableSites.map((site) => (
              <option key={site.id} value={site.id}>
                {site.label}
              </option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
        </div>
      </div>
    </header>
  )
}
