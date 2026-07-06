import { useState } from 'react'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { WeeklyUpdateCard } from '@/components/updates/WeeklyUpdateCard'
import { UpdateForm } from '@/components/updates/UpdateForm'
import { useAuth } from '@/hooks/useAuth'
import { WeeklyUpdate } from '@/types'

export function WeeklyUpdates() {
  const [updates, setUpdates] = useState<WeeklyUpdate[]>([])
  const { canEditPlatform } = useAuth()

  const handleAddUpdate = (title: string, content: string) => {
    const newUpdate: WeeklyUpdate = {
      id: Date.now().toString(),
      title,
      content,
      date: new Date().toISOString().split('T')[0],
      author: 'Você'
    }
    setUpdates([newUpdate, ...updates])
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Atualizações Semanais</h1>
          <p className="text-gray-500">Registro de atividades e manutenções</p>
        </div>
        
        {canEditPlatform ? (
          <UpdateForm onSubmit={handleAddUpdate} />
        ) : (
          <div className="rounded-xl border border-gray-200 bg-white p-4 text-sm text-gray-600">
            Seu perfil possui acesso somente leitura para as atualizacoes semanais.
          </div>
        )}
        
        <div className="space-y-4">
          {updates.length > 0 ? (
            updates.map(update => (
              <WeeklyUpdateCard key={update.id} update={update} />
            ))
          ) : (
            <div className="rounded-xl border border-dashed border-gray-300 bg-white p-6 text-center">
              <p className="text-sm font-medium text-gray-700">
                Nenhuma atualização semanal cadastrada no momento.
              </p>
              <p className="mt-2 text-sm text-gray-500">
                Você poderá inserir novas atualizações manualmente por esta tela.
              </p>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}
