import { useState } from 'react'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { UserManagement } from '@/components/users/UserManagement'
import { UserForm } from '@/components/users/UserForm'
import { useAuth } from '@/hooks/useAuth'
import { User } from '@/types'
import { User as UserIcon, Bell, Shield, Database, AlertTriangle, CheckCircle2, ShieldAlert, Users as UsersIcon } from 'lucide-react'

function getRoleLabel(role: 'admin' | 'manager' | 'viewer') {
  if (role === 'admin') return 'Administrador'
  if (role === 'manager') return 'Gerencial'
  return 'Usuario Comum'
}

function formatDate(date: string) {
  return new Date(`${date}T00:00:00`).toLocaleDateString('pt-BR')
}

type FeedbackBanner = {
  type: 'success' | 'error' | 'info'
  title: string
  message: string
} | null

export function Settings() {
  const { user, users, canEditPlatform, createUser, deleteUser } = useAuth()
  const [feedback, setFeedback] = useState<FeedbackBanner>(null)

  if (!user) {
    return null
  }

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

  const notificationItems = [
    {
      title: 'Eventos Criticos',
      description: 'Prioriza alarmes de alta severidade vinculados aos equipamentos do seu escopo.',
    },
    {
      title: 'Pendencias preditivas',
      description: 'Consolida analises tecnicas e pontos de atencao dos equipamentos acompanhados.',
    },
    {
      title: 'Resumo executivo',
      description:
        user.role === 'viewer'
          ? 'Exibe visoes consolidadas para acompanhamento e consulta das operacoes do site.'
          : 'Exibe visoes consolidadas para acompanhamento gerencial das operacoes do site.',
    },
  ]

  const securityItems = [
    { label: 'Perfil de acesso', value: getRoleLabel(user.role) },
    { label: 'Sessao atual', value: 'Ativa neste navegador' },
    {
      label: 'Escopo de acesso',
      value: user.clientAccess.includes('*') ? 'Todos os clientes e modulos habilitados' : user.clientAccess.join(', '),
    },
    {
      label: 'Permissao de edicao',
      value: canEditPlatform ? 'Liberada para configuracoes e administracao' : 'Somente leitura e acompanhamento',
    },
  ]

  const summaryStats = {
    total: users.length,
    admins: users.filter((u) => u.role === 'admin').length,
    managers: users.filter((u) => u.role === 'manager').length,
    viewers: users.filter((u) => u.role === 'viewer').length,
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Configurações</h1>
          <p className="text-gray-500">
            Acompanhe as informacoes da sua conta, recursos disponiveis e (se for administrador) gerencie usuarios da plataforma.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <UserIcon className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Perfil</h3>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="rounded-lg border border-gray-100 bg-gray-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Nome</p>
                <p className="mt-2 text-sm font-medium text-gray-900">{user.name}</p>
              </div>
              <div className="rounded-lg border border-gray-100 bg-gray-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Email</p>
                <p className="mt-2 text-sm font-medium text-gray-900 break-all">{user.email}</p>
              </div>
              <div className="rounded-lg border border-gray-100 bg-gray-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Perfil</p>
                <p className="mt-2 text-sm font-medium text-gray-900">{getRoleLabel(user.role)}</p>
              </div>
              <div className="rounded-lg border border-gray-100 bg-gray-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Cadastro</p>
                <p className="mt-2 text-sm font-medium text-gray-900">{formatDate(user.createdAt)}</p>
              </div>
              <div className="rounded-lg border border-gray-100 bg-gray-50 p-4 sm:col-span-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Clientes habilitados</p>
                <p className="mt-2 text-sm font-medium text-gray-900">
                  {user.clientAccess.includes('*') ? 'Todos os clientes cadastrados' : user.clientAccess.join(', ')}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-warning/10 text-warning">
                <Bell className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Notificações</h3>
            </div>

            <div className="space-y-3">
              {notificationItems.map((item) => (
                <div key={item.title} className="rounded-lg border border-gray-100 bg-gray-50 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-semibold text-gray-900">{item.title}</p>
                    <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">Disponivel</span>
                  </div>
                  <p className="mt-2 text-sm leading-6 text-gray-600">{item.description}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-success/10 text-success">
                <Shield className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Segurança</h3>
            </div>

            <div className="space-y-3">
              {securityItems.map((item) => (
                <div
                  key={item.label}
                  className="flex items-start justify-between gap-4 rounded-lg border border-gray-100 bg-gray-50 p-4"
                >
                  <p className="text-sm font-medium text-gray-600">{item.label}</p>
                  <p className="max-w-xs text-right text-sm font-semibold text-gray-900">{item.value}</p>
                </div>
              ))}
            </div>
          </div>

          {user.role === 'admin' && (
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="mb-6 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-neutral/10 text-neutral">
                  <Database className="h-5 w-5" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Dados & Governança</h3>
              </div>

              <div className="space-y-3">
                <div className="rounded-lg border border-gray-100 bg-gray-50 p-4">
                  <p className="text-sm font-semibold text-gray-900">Escopo administrativo</p>
                  <p className="mt-2 text-sm leading-6 text-gray-600">
                    Perfil habilitado para administrar usuarios, controlar configuracoes da plataforma e consolidar a base executiva do cliente.
                  </p>
                </div>
                <div className="rounded-lg border border-gray-100 bg-gray-50 p-4">
                  <p className="text-sm font-semibold text-gray-900">Atualizacao operacional</p>
                  <p className="mt-2 text-sm leading-6 text-gray-600">
                    Os dados mensais sao incorporados ao sistema para recalculo automatico de alarmes, saude, disponibilidade e indicadores consolidados.
                  </p>
                </div>
                <div className="rounded-lg border border-gray-100 bg-gray-50 p-4">
                  <p className="text-sm font-semibold text-gray-900">Governanca</p>
                  <p className="mt-2 text-sm leading-6 text-gray-600">
                    Esta area permanece exclusiva para administradores, preservando o controle sobre estrutura, acessos e base de informacoes do ambiente.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {user.role === 'admin' && (
          <div className="space-y-6 border-t border-gray-200 pt-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Administração de Usuários</h2>
                <p className="text-gray-500">
                  Area exclusiva do perfil Administrador. Somente aqui e permitido criar, consultar e remover usuarios da plataforma.
                </p>
              </div>
              <div className="rounded-lg border border-primary/20 bg-primary/5 px-3 py-2 text-xs text-primary flex items-center gap-2">
                <ShieldAlert className="h-4 w-4" />
                Modo administrador ativo
              </div>
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
        )}
      </div>
    </DashboardLayout>
  )
}
