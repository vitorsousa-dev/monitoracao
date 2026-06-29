import { User } from '../../types'
import { User as UserIcon, Edit, Trash2, Shield, UserCog, Wrench } from 'lucide-react'

interface UserManagementProps {
  users: User[]
  onDelete: (userId: string) => void
}

export function UserManagement({ users, onDelete }: UserManagementProps) {
  const getRoleIcon = (role: User['role']) => {
    switch (role) {
      case 'admin':
        return <Shield className="h-4 w-4 text-danger" />
      case 'manager':
        return <UserCog className="h-4 w-4 text-primary" />
      default:
        return <Wrench className="h-4 w-4 text-warning" />
    }
  }

  const getRoleText = (role: User['role']) => {
    switch (role) {
      case 'admin':
        return 'Administrador'
      case 'manager':
        return 'Gerente'
      default:
        return 'Tecnico'
    }
  }

  const getRoleBadge = (role: User['role']) => {
    switch (role) {
      case 'admin':
        return 'bg-danger/10 text-danger'
      case 'manager':
        return 'bg-primary/10 text-primary'
      default:
        return 'bg-warning/10 text-warning'
    }
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Gerenciamento de Usuarios</h3>
      
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Usuario</th>
              <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Email</th>
              <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Funcao</th>
              <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Criado em</th>
              <th className="text-right py-3 px-4 text-sm font-medium text-gray-600">Acoes</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="py-4 px-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary/10 text-primary rounded-full flex items-center justify-center">
                      <UserIcon className="h-5 w-5" />
                    </div>
                    <span className="font-medium text-gray-900">{user.name}</span>
                  </div>
                </td>
                <td className="py-4 px-4 text-gray-600">{user.email}</td>
                <td className="py-4 px-4">
                  <span className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getRoleBadge(user.role)}`}>
                    {getRoleIcon(user.role)}
                    {getRoleText(user.role)}
                  </span>
                </td>
                <td className="py-4 px-4 text-gray-600">{user.createdAt}</td>
                <td className="py-4 px-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <button className="p-2 text-gray-500 hover:text-primary hover:bg-primary/10 rounded-lg transition-colors">
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => onDelete(user.id)}
                      className="p-2 text-gray-500 hover:text-danger hover:bg-danger/10 rounded-lg transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
