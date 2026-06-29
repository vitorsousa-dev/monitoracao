import { PredictiveTask } from '../../types'
import { Calendar, DollarSign, AlertTriangle, CheckCircle, Clock } from 'lucide-react'

interface PredictiveTasksProps {
  tasks: PredictiveTask[]
}

export function PredictiveTasks({ tasks }: PredictiveTasksProps) {
  const getPriorityColor = (priority: PredictiveTask['priority']) => {
    switch (priority) {
      case 'high':
        return 'bg-danger/10 text-danger border-danger/20'
      case 'medium':
        return 'bg-warning/10 text-warning border-warning/20'
      default:
        return 'bg-neutral/10 text-neutral border-neutral/20'
    }
  }

  const getStatusIcon = (status: PredictiveTask['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-success" />
      case 'in_progress':
        return <Clock className="h-4 w-4 text-primary animate-pulse" />
      default:
        return <AlertTriangle className="h-4 w-4 text-warning" />
    }
  }

  const getStatusText = (status: PredictiveTask['status']) => {
    switch (status) {
      case 'pending':
        return 'Pendente'
      case 'in_progress':
        return 'Em Andamento'
      case 'completed':
        return 'Concluido'
      default:
        return status
    }
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Tarefas Preditivas</h3>
      <div className="space-y-4">
        {tasks.map((task) => (
          <div key={task.id} className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3 flex-1">
                <div className={`p-2 rounded-full ${getPriorityColor(task.priority)}`}>
                  {task.priority === 'high' ? (
                    <AlertTriangle className="h-5 w-5" />
                  ) : task.priority === 'medium' ? (
                    <Clock className="h-5 w-5" />
                  ) : (
                    <CheckCircle className="h-5 w-5" />
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-medium text-gray-900">{task.title}</h4>
                    <span className={`text-xs px-2 py-0.5 rounded-full border ${getPriorityColor(task.priority)}`}>
                      {task.priority === 'high' ? 'Alta' : task.priority === 'medium' ? 'Media' : 'Baixa'}
                    </span>
                    <span className="text-xs text-gray-500 flex items-center gap-1">
                      {getStatusIcon(task.status)}
                      {getStatusText(task.status)}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">{task.description}</p>
                  <div className="flex items-center gap-4 mt-2">
                    <p className="text-xs text-gray-500 flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      Vencimento: {task.dueDate}
                    </p>
                    <p className="text-xs text-gray-500 flex items-center gap-1">
                      <DollarSign className="h-3 w-3" />
                      Custo estimado: R${task.estimatedCost}
                    </p>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-gray-900">{task.riskScore}</div>
                <div className="text-xs text-gray-500">Score de Risco</div>
              </div>
            </div>
            <div className="mt-3 flex items-center gap-2 justify-end">
              <button className="px-3 py-1.5 border border-gray-300 text-gray-700 text-sm rounded-lg hover:bg-gray-50 transition-colors">
                Detalhes
              </button>
              <button className="px-3 py-1.5 bg-primary text-white text-sm rounded-lg hover:bg-primary/90 transition-colors">
                Acao
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
