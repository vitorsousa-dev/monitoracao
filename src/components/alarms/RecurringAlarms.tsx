import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Alarm } from '../../types'
import { Clock, AlertTriangle, PhoneCall } from 'lucide-react'

interface RecurringAlarmsProps {
  alarms: Alarm[]
}

export function RecurringAlarms({ alarms }: RecurringAlarmsProps) {
  const [showAll, setShowAll] = useState(false)
  const pendingFollowup = alarms.filter(a => a.status === 'pending_followup')
  const visibleAlarms = useMemo(
    () => (showAll ? pendingFollowup : pendingFollowup.slice(0, 3)),
    [pendingFollowup, showAll]
  )

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Alarmes Requerem Follow-up</h3>
        <span className="bg-danger/10 text-danger px-3 py-1 rounded-full text-sm font-medium">
          {pendingFollowup.length} pendentes
        </span>
      </div>

      <div className="space-y-3">
        {visibleAlarms.map((alarm) => (
          <div key={alarm.id} className="p-4 border border-danger/20 bg-danger/5 rounded-lg">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3">
                <div className="mt-1">
                  <AlertTriangle className="h-5 w-5 text-danger" />
                </div>
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900">{alarm.equipmentName}</h4>
                  <p className="text-sm text-gray-600">{alarm.message}</p>
                  <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                    <span>{alarm.clientName} • {alarm.areaName}</span>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <span className="text-danger font-bold">{alarm.followupCount}x</span>
                <p className="text-xs text-gray-500">notificacoes</p>
              </div>
            </div>
            <div className="mt-3 flex items-center gap-2">
              <Link
                to="/alert-management"
                className="flex items-center gap-1 px-3 py-1.5 bg-primary text-white text-sm rounded-lg hover:bg-primary/90 transition-colors"
              >
                <PhoneCall className="h-4 w-4" />
                Acao Imediata
              </Link>
              <Link
                to={`/equipment/${encodeURIComponent(alarm.equipmentId)}?tab=scheduling`}
                className="flex items-center gap-1 px-3 py-1.5 border border-gray-300 text-gray-700 text-sm rounded-lg hover:bg-gray-50 transition-colors"
              >
                <Clock className="h-4 w-4" />
                Agendar
              </Link>
            </div>
          </div>
        ))}
      </div>

      {pendingFollowup.length > 3 && (
        <div className="mt-4 flex justify-center">
          <button
            type="button"
            onClick={() => setShowAll((current) => !current)}
            className="inline-flex items-center rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
          >
            {showAll ? 'Ver menos' : `Ver mais ${pendingFollowup.length - 3} alarmes`}
          </button>
        </div>
      )}
    </div>
  )
}
