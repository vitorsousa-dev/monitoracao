import { useMemo, useState } from 'react'
import { User } from '../../types'
import { mockSites } from '@/lib/mockData'
import { Building2, CheckCircle2 } from 'lucide-react'

interface UserFormProps {
  onAdd: (user: Omit<User, 'id' | 'createdAt'>) => void
}

export function UserForm({ onAdd }: UserFormProps) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState<User['role']>('viewer')
  const [selectedClients, setSelectedClients] = useState<string[]>(['Serasa Experian'])
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  const availableClients = useMemo(() => {
    const clients = Array.from(new Set(mockSites.map((site) => site.cliente)))
    return clients.sort()
  }, [])

  const toggleClient = (client: string) => {
    setSelectedClients((current) =>
      current.includes(client) ? current.filter((item) => item !== client) : [...current, client]
    )
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setFeedback(null)

    if (role !== 'admin' && selectedClients.length === 0) {
      setFeedback({ type: 'error', message: 'Selecione pelo menos um cliente autorizado.' })
      return
    }

    onAdd({
      name,
      email,
      password,
      role,
      clientAccess: role === 'admin' ? ['*'] : selectedClients,
    })

    setFeedback({ type: 'success', message: 'Usuario criado com sucesso.' })
    setName('')
    setEmail('')
    setPassword('')
    setRole('viewer')
    setSelectedClients(['Serasa Experian'])
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Adicionar Novo Usuario</h3>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Nome Completo</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            placeholder="Digite o nome..."
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            placeholder="email@exemplo.com"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Senha</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            minLength={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            placeholder="Minimo 4 caracteres"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Funcao</label>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value as User['role'])}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
          >
            <option value="admin">Administrador (acesso total)</option>
            <option value="manager">Gerente (operacoes por cliente)</option>
            <option value="viewer">Usuario Comum (somente leitura)</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Clientes autorizados {role === 'admin' && <span className="text-xs text-gray-400 font-normal">(admin = todos)</span>}
          </label>
          <div
            className={`border rounded-lg p-3 space-y-2 ${
              role === 'admin' ? 'bg-gray-50 border-gray-200 opacity-70' : 'border-gray-300'
            }`}
          >
            {role === 'admin' ? (
              <div className="flex items-center gap-2 py-1 text-sm text-gray-600">
                <CheckCircle2 className="h-4 w-4 text-primary" />
                Acesso total concedido automaticamente a todos os clientes.
              </div>
            ) : (
              availableClients.map((client) => {
                const isSelected = selectedClients.includes(client)
                return (
                  <label
                    key={client}
                    className={`flex items-center gap-2 px-2 py-1.5 rounded-md cursor-pointer transition-colors ${
                      isSelected ? 'bg-primary/10 text-primary' : 'hover:bg-gray-50 text-gray-700'
                    }`}
                  >
                    <input
                      type="checkbox"
                      className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                      checked={isSelected}
                      onChange={() => toggleClient(client)}
                    />
                    <Building2 className="h-4 w-4" />
                    <span className="text-sm font-medium">{client}</span>
                  </label>
                )
              })
            )}
          </div>
          <p className="mt-1 text-xs text-gray-500">
            Selecione um ou mais clientes que esse usuario podera acessar.
          </p>
        </div>
        {feedback && (
          <div
            className={`rounded-lg px-3 py-2 text-sm ${
              feedback.type === 'success'
                ? 'bg-success/10 text-success border border-success/20'
                : 'bg-danger/10 text-danger border border-danger/20'
            }`}
          >
            {feedback.message}
          </div>
        )}
        <button
          type="submit"
          className="w-full bg-primary text-white py-2 rounded-lg hover:bg-primary/90 transition-colors"
        >
          Adicionar Usuario
        </button>
      </form>
    </div>
  )
}
