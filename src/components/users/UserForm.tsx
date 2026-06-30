import { useState } from 'react'
import { User } from '../../types'

interface UserFormProps {
  onAdd: (user: Omit<User, 'id' | 'createdAt'>) => void
}

export function UserForm({ onAdd }: UserFormProps) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState<User['role']>('viewer')
  const [clientAccess, setClientAccess] = useState('Serasa Experian')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onAdd({
      name,
      email,
      password,
      role,
      clientAccess: role === 'admin' ? ['*'] : clientAccess.split(',').map((client) => client.trim()).filter(Boolean),
    })
    setName('')
    setEmail('')
    setPassword('')
    setRole('viewer')
    setClientAccess('Serasa Experian')
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
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            placeholder="********"
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
            <option value="admin">Administrador</option>
            <option value="manager">Gerente</option>
            <option value="viewer">Usuario Comum</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Cliente/Site</label>
          <input
            type="text"
            value={clientAccess}
            onChange={(e) => setClientAccess(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            placeholder="Serasa Experian"
            disabled={role === 'admin'}
            required={role !== 'admin'}
          />
          <p className="mt-1 text-xs text-gray-500">
            Para administrador o acesso eh total. Para os demais, informe o cliente autorizado.
          </p>
        </div>
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
