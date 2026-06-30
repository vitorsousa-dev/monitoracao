import { Bell, Search, User } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'

export function Topbar() {
  const { user, logout } = useAuth()
  const roleLabel =
    user?.role === 'admin'
      ? 'Administrador'
      : user?.role === 'manager'
        ? 'Gerente'
        : 'Usuario Comum'
  const accessLabel = user?.role === 'admin' ? 'Todos os clientes' : user?.clientAccess.join(', ')

  return (
    <header className="bg-white border-b border-gray-200 h-16 flex items-center justify-between px-6">
      <div className="flex items-center gap-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Pesquisar..."
            className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary w-64"
          />
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
            <p className="text-[11px] text-gray-400">{accessLabel}</p>
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
