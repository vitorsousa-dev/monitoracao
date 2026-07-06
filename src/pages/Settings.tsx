import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { useAuth } from '@/hooks/useAuth'
import { User, Bell, Shield, Database } from 'lucide-react'

function getRoleLabel(role: 'admin' | 'manager' | 'viewer') {
  if (role === 'admin') return 'Administrador'
  if (role === 'manager') return 'Gerencial'
  return 'Usuario Comum'
}

function formatDate(date: string) {
  return new Date(`${date}T00:00:00`).toLocaleDateString('pt-BR')
}

export function Settings() {
  const { user, canEditPlatform } = useAuth()

  if (!user) {
    return null
  }

  const notificationItems = [
    {
      title: 'Ocorrencias criticas',
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
    {
      label: 'Perfil de acesso',
      value: getRoleLabel(user.role),
    },
    {
      label: 'Sessao atual',
      value: 'Ativa neste navegador',
    },
    {
      label: 'Escopo de acesso',
      value: user.clientAccess.includes('*') ? 'Todos os clientes e modulos habilitados' : user.clientAccess.join(', '),
    },
    {
      label: 'Permissao de edicao',
      value: canEditPlatform ? 'Liberada para configuracoes e administracao' : 'Somente leitura e acompanhamento',
    },
  ]

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Configurações</h1>
          <p className="text-gray-500">Acompanhe as informacoes da sua conta e os recursos disponiveis para o seu perfil.</p>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <User className="h-5 w-5" />
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
                <div key={item.label} className="flex items-start justify-between gap-4 rounded-lg border border-gray-100 bg-gray-50 p-4">
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
                <h3 className="text-lg font-semibold text-gray-900">Dados</h3>
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
      </div>
    </DashboardLayout>
  )
}
