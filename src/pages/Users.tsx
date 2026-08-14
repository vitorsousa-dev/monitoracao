import { useState } from 'react'
import { DashboardLayout } from '../components/layout/DashboardLayout'
import { UserManagement } from '../components/users/UserManagement'
import { UserForm } from '../components/users/UserForm'
import { useAuth } from '../hooks/useAuth'
import { User } from '../types'
import { AlertTriangle, CheckCircle2, ShieldAlert, Users as UsersIcon } from 'lucide-react'

type FeedbackBanner = {
  type: 'success' | 'error' | 'info'
  title: string
  message: string
} | null

export function Users() {
  const { user, users, canManageUsers, createUser, deleteUser } = useAuth()
  const [feedback, setFeedback] = useState<FeedbackBanner>(null)

  const handleAddUser = (userData: Omit<User, 'id' | 'createdAt'>) => {
    const result = createUser(userData)
    setFeedback({
      type: result.success ? 'success' : 'error',
      title: result.success ? 'Usuario criado' : 'Nao foi possivel criar usuario',
      message: result.message,
    })
    window.setTimeout(() => setFeedback(null), 4000)
  }

  const handleDeleteUser = (userId: string) => {
    const toDelete = users.find((item) => item.id === userId)
    if (!toDelete) return

    const confirmed = window.confirm(
      `Deseja realmente remover o usuario "${toDelete.name}" (${toDelete.email})? Esta acao nao pode ser desfeita.`
    )
    if (!confirmed) return

    const result = deleteUser(userId)
    setFeedback({
      type: result.success ? 'success' : 'error',
      title: result.success ? 'Usuario removido' : 'Nao foi possivel remover usuario',
      message: result.message,
    })
    window.setTimeout(() => setFeedback(null), 4000)
  }

  const summaryStats = {
    total: users.length,
    admins: users.filter((u) => u.role === 'admin').length,
    managers: users.filter((u) => u.role === 'manager').length,
    viewers: users.filter((u) => u.role === 'viewer').length,
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Usuarios</h1>
            <p className="text-gray-500">Gestao de usuarios do sistema — perfis, clientes e permissoes</p>
          </div>
          {!canManageUsers && (
            <div className="rounded-lg border border-danger/20 bg-danger/5 px-3 py-2 text-xs text-danger flex items-center gap-2">
              <ShieldAlert className="h-4 w-4" />
              Esta area requer perfil de administrador.
            </div>
          )}
        </div>

        {feedback && (
          <div
            className={`rounded-xl border p-4 flex items-start gap-3 ${
              feedback.type === 'success'
                ? 'border-success/20 bg-success/5 text-success'
                : feedback.type === 'error'
                  ? 'border-danger/20 bg-danger/5 text-danger'
                  : 'border-primary/20 bg-primary/5 text-primary'
            }`}
          >
            {feedback.type === 'success' ? (
              <CheckCircle2 className="h-5 w-5 shrink-0" />
            ) : (
              <AlertTriangle className="h-5 w-5 shrink-0" />
            )}
            <div className="min-w-0">
              <p className="text-sm font-semibold">{feedback.title}</p>
              <p className="text-sm opacity-90">{feedback.message}</p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                <UsersIcon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Total</p>
                <p className="text-xl font-semibold text-gray-900">{summaryStats.total}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-danger/10 text-danger flex items-center justify-center">
                <ShieldAlert className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Administradores</p>
                <p className="text-xl font-semibold text-gray-900">{summaryStats.admins}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                <UsersIcon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Gerentes</p>
                <p className="text-xl font-semibold text-gray-900">{summaryStats.managers}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-warning/10 text-warning flex items-center justify-center">
                <UsersIcon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Comuns</p>
                <p className="text-xl font-semibold text-gray-900">{summaryStats.viewers}</p>
              </div>
            </div>
          </div>
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
