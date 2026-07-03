import { useMemo, useState } from 'react'
import { Alarm } from '../../types'
import { AlertTriangle, AlertCircle, Info, CheckCircle, Clock, ChevronDown, ChevronUp } from 'lucide-react'

interface AlarmsListProps {
  alarms: Alarm[]
  selectedEquipmentId?: string
  selectedEquipmentName?: string
}

export function AlarmsList({ alarms, selectedEquipmentId, selectedEquipmentName }: AlarmsListProps) {
  const [showAll, setShowAll] = useState(false)
  const [expandedAlarmIds, setExpandedAlarmIds] = useState<string[]>([])

  const filteredAlarms = useMemo(() => {
    if (!selectedEquipmentId) {
      return alarms
    }

    return alarms.filter((alarm) => alarm.equipmentId === selectedEquipmentId)
  }, [alarms, selectedEquipmentId])

  const visibleAlarms = useMemo(() => {
    if (showAll || selectedEquipmentId) {
      return filteredAlarms
    }

    return filteredAlarms.slice(0, 8)
  }, [filteredAlarms, selectedEquipmentId, showAll])

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

  const toggleAlarmDetails = (alarmId: string) => {
    setExpandedAlarmIds((current) =>
      current.includes(alarmId)
        ? current.filter((id) => id !== alarmId)
        : [...current, alarmId]
    )
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Todos os Alarmes</h3>
          <p className="mt-1 text-sm text-gray-500">
            {filteredAlarms.length} registros no periodo
          </p>
        </div>
        {selectedEquipmentId && (
          <p className="text-sm text-gray-500 mt-1">
            Exibindo detalhes de alarme para {selectedEquipmentName}
          </p>
        )}
      </div>
      <div className="space-y-3">
        {visibleAlarms.map((alarm) => {
          const isExpanded = expandedAlarmIds.includes(alarm.id)

          return (
          <div key={alarm.id} className={`rounded-lg border p-3 transition-colors ${getTypeColor(alarm.type)}`}>
            <div className="flex items-start justify-between gap-3">
              <div className="flex min-w-0 items-start gap-3">
                {getTypeIcon(alarm.type)}
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h4 className="truncate font-medium text-gray-900">{alarm.equipmentName}</h4>
                    <span className={`rounded-full px-2 py-0.5 text-xs ${
                      alarm.status === 'pending_followup' ? 'bg-warning text-warning-foreground' :
                      alarm.status === 'resolved' ? 'bg-success text-success-foreground' :
                      'bg-primary text-primary-foreground'
                    }`}>
                      {getStatusText(alarm.status)}
                    </span>
                  </div>
                  <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-gray-500">
                    <span>{alarm.clientName}</span>
                    <span>•</span>
                    <span>{alarm.areaName}</span>
                    <span>•</span>
                    <span>{alarm.createdAt}</span>
                  </div>
                  {isExpanded && (
                    <div className="mt-3 rounded-lg bg-white/70 p-3 text-sm text-gray-600">
                      <p>{alarm.message}</p>
                      <div className="mt-2 grid grid-cols-1 gap-2 text-xs text-gray-500 sm:grid-cols-2">
                        <span>Status: {getStatusText(alarm.status)}</span>
                        <span>Prioridade: {alarm.priority}</span>
                        <span>Criado em: {alarm.createdAt}</span>
                        <span>Atualizado em: {alarm.updatedAt}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              <div className="flex shrink-0 flex-col items-end gap-2">
                {getStatusIcon(alarm.status)}
                <span className="text-xs text-gray-500">Prio: {alarm.priority}</span>
                <button
                  type="button"
                  onClick={() => toggleAlarmDetails(alarm.id)}
                  className="inline-flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-50"
                >
                  {isExpanded ? (
                    <>
                      <ChevronUp className="h-3.5 w-3.5" />
                      Ocultar
                    </>
                  ) : (
                    <>
                      <ChevronDown className="h-3.5 w-3.5" />
                      Detalhes
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )})}
        {filteredAlarms.length === 0 && (
          <div className="p-6 rounded-lg border border-dashed border-gray-200 text-center text-sm text-gray-500">
            Nenhum alarme encontrado para o equipamento selecionado.
          </div>
        )}
      </div>
      {!selectedEquipmentId && filteredAlarms.length > 8 && (
        <div className="mt-4 border-t border-gray-100 pt-4">
          <button
            type="button"
            onClick={() => setShowAll((current) => !current)}
            className="inline-flex items-center gap-2 rounded-lg border border-primary/20 bg-primary/5 px-4 py-2 text-sm font-medium text-primary transition-colors hover:bg-primary/10"
          >
            {showAll ? 'Mostrar menos alarmes' : `Mostrar todos os alarmes (${filteredAlarms.length})`}
          </button>
        </div>
      )}
    </div>
  )
}
