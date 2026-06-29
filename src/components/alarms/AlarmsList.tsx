import { Alarm } from '../../types'
import { AlertTriangle, AlertCircle, Info, CheckCircle, Clock } from 'lucide-react'

interface AlarmsListProps {
  alarms: Alarm[]
}

export function AlarmsList({ alarms }: AlarmsListProps) {
  const getStatusIcon = (status: Alarm['status']) => {
    switch (status) {
      case 'resolved':
        return <CheckCircle className="h-4 w-4 text-success" />
      case 'acknowledged':
        return <Clock className="h-4 w-4 text-primary" />
      case 'pending_followup':
        return <AlertTriangle className="h-4 w-4 text-warning" />
      default:
        return <AlertCircle className="h-4 w-4 text-neutral" />
    }
  }

  const getTypeIcon = (type: Alarm['type']) => {
    switch (type) {
      case 'critical':
        return <AlertCircle className="h-5 w-5 text-danger" />
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-warning" />
      default:
        return <Info className="h-5 w-5 text-primary" />
    }
  }

  const getTypeColor = (type: Alarm['type']) => {
    switch (type) {
      case 'critical':
        return 'bg-danger/10 border-danger/20'
      case 'warning':
        return 'bg-warning/10 border-warning/20'
      default:
        return 'bg-primary/10 border-primary/20'
    }
  }

  const getStatusText = (status: Alarm['status']) => {
    switch (status) {
      case 'open':
        return 'Aberto'
      case 'acknowledged':
        return 'Reconhecido'
      case 'resolved':
        return 'Resolvido'
      case 'pending_followup':
        return 'Follow-up Pendente'
      default:
        return status
    }
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Todos os Alarmes</h3>
      <div className="space-y-3">
        {alarms.map((alarm) => (
          <div key={alarm.id} className={`p-4 rounded-lg border transition-colors ${getTypeColor(alarm.type)}`}>
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3">
                {getTypeIcon(alarm.type)}
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-medium text-gray-900">{alarm.equipmentName}</h4>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      alarm.status === 'pending_followup' ? 'bg-warning text-warning-foreground' :
                      alarm.status === 'resolved' ? 'bg-success text-success-foreground' :
                      'bg-primary text-primary-foreground'
                    }`}>
                      {getStatusText(alarm.status)}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">{alarm.message}</p>
                  <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                    <span>{alarm.clientName} • {alarm.areaName}</span>
                    <span>•</span>
                    <span>{alarm.createdAt}</span>
                  </div>
                </div>
              </div>
              <div className="text-right flex flex-col items-end gap-1">
                {getStatusIcon(alarm.status)}
                <span className="text-xs text-gray-500">Prio: {alarm.priority}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
