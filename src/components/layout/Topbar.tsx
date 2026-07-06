import { Bell, Building2, MapPinned, User } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { useScope } from '@/hooks/useScope'

export function Topbar() {
  const { user, logout } = useAuth()
  const {
    selectedClient,
    selectedSite,
    availableClients,
    availableSites,
    canSelectAnyClient,
    setSelectedClient,
    setSelectedSite,
  } = useScope()
  const roleLabel =
    user?.role === 'admin'
      ? 'Administrador'
      : user?.role === 'manager'
        ? 'Gerente'
        : 'Usuario Comum'
  const accessLabel = user?.role === 'admin' ? 'Todos os clientes' : user?.clientAccess.join(', ')

  return (
    <header className="bg-white border-b border-gray-200 min-h-16 flex flex-col gap-3 px-6 py-3 lg:flex-row lg:items-center lg:justify-between">
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
        <div className="min-w-[220px]">
          <label className="mb-1 flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-gray-500">
            <Building2 className="h-3.5 w-3.5" />
            Cliente
          </label>
          <select
            value={selectedClient}
            onChange={(event) => setSelectedClient(event.target.value)}
            disabled={!canSelectAnyClient}
            className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary disabled:bg-gray-50 disabled:text-gray-500"
          >
            {availableClients.map((client) => (
              <option key={client.id} value={client.id}>
                {client.label}
              </option>
            ))}
          </select>
        </div>

        <div className="min-w-[240px]">
          <label className="mb-1 flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-gray-500">
            <MapPinned className="h-3.5 w-3.5" />
            Site
          </label>
          <select
            value={selectedSite}
            onChange={(event) => setSelectedSite(event.target.value)}
            className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
          >
            {availableSites.map((site) => (
              <option key={site.id} value={site.id}>
                {site.label}
              </option>
            ))}
          </select>
        </div>
      </div>
      
      <div className="flex items-center gap-4">
        <button className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg">
          <Bell className="h-5 w-5" />
          <span className="absolute top-1 right-1 h-2 w-2 bg-danger rounded-full"></span>
        </button>
        
        <div className="flex items-center gap-3 pl-4 border-l border-gray-200">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-medium text-gray-900">{user?.name}</p>
            <p className="text-xs text-gray-500">{roleLabel}</p>
            <p className="text-[11px] text-gray-400">
              {accessLabel} | {selectedSite === 'all-sites' ? 'Todos os sites' : availableSites.find((site) => site.id === selectedSite)?.label ?? 'Site selecionado'}
            </p>
          </div>
          <div className="h-10 w-10 bg-primary/10 text-primary rounded-full flex items-center justify-center">
            <User className="h-5 w-5" />
          </div>
          <button
            onClick={logout}
            className="text-sm text-gray-600 hover:text-danger"
          >
            Sair
          </button>
        </div>
      </div>
    </header>
  )
}
