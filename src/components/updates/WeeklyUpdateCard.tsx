import { Calendar, User } from 'lucide-react'
import { WeeklyUpdate } from '@/types'

interface WeeklyUpdateCardProps {
  update: WeeklyUpdate
}

export function WeeklyUpdateCard({ update }: WeeklyUpdateCardProps) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 bg-primary/10 text-primary rounded-full flex items-center justify-center">
            <Calendar className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{update.title}</h3>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <User className="h-3 w-3" />
              <span>{update.author}</span>
              <span>•</span>
              <span>{new Date(update.date).toLocaleDateString('pt-BR')}</span>
            </div>
          </div>
        </div>
      </div>
      
      <p className="text-gray-600 leading-relaxed">{update.content}</p>
    </div>
  )
}
