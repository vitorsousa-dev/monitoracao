import { useState } from 'react'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { WeeklyUpdateCard } from '@/components/updates/WeeklyUpdateCard'
import { UpdateForm } from '@/components/updates/UpdateForm'
import { mockWeeklyUpdates } from '@/lib/mockData'
import { WeeklyUpdate } from '@/types'

export function WeeklyUpdates() {
  const [updates, setUpdates] = useState<WeeklyUpdate[]>(mockWeeklyUpdates)

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
        
        <UpdateForm onSubmit={handleAddUpdate} />
        
        <div className="space-y-4">
          {updates.map(update => (
            <WeeklyUpdateCard key={update.id} update={update} />
          ))}
        </div>
      </div>
    </DashboardLayout>
  )
}
