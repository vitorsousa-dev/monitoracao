import { useState } from 'react'
import { DashboardLayout } from '../components/layout/DashboardLayout'
import { UserManagement } from '../components/users/UserManagement'
import { UserForm } from '../components/users/UserForm'
import { mockUsers } from '../lib/mockData'
import { User } from '../types'

export function Users() {
  const [users, setUsers] = useState<User[]>(mockUsers)

  const handleAddUser = (userData: Omit<User, 'id' | 'createdAt'>) => {
    const newUser: User = {
      ...userData,
      id: Date.now().toString(),
      createdAt: new Date().toISOString().split('T')[0]
    }
    setUsers([newUser, ...users])
  }

  const handleDeleteUser = (userId: string) => {
    setUsers(users.filter(u => u.id !== userId))
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
            <UserManagement users={users} onDelete={handleDeleteUser} />
          </div>
          <div className="lg:col-span-1">
            <UserForm onAdd={handleAddUser} />
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
