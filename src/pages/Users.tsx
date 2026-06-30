import { DashboardLayout } from '../components/layout/DashboardLayout'
import { UserManagement } from '../components/users/UserManagement'
import { UserForm } from '../components/users/UserForm'
import { useAuth } from '../hooks/useAuth'
import { User } from '../types'

export function Users() {
  const { user, users, createUser, deleteUser } = useAuth()

  const handleAddUser = (userData: Omit<User, 'id' | 'createdAt'>) => {
    const result = createUser(userData)
    if (!result.success) {
      window.alert(result.message)
      return
    }

    window.alert(result.message)
  }

  const handleDeleteUser = (userId: string) => {
    const result = deleteUser(userId)
    window.alert(result.message)
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Usuarios</h1>
          <p className="text-gray-500">Gestao de usuarios do sistema</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <UserManagement users={users} onDelete={handleDeleteUser} currentUserId={user?.id} />
          </div>
          <div className="lg:col-span-1">
            <UserForm onAdd={handleAddUser} />
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
