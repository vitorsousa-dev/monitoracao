import { DashboardLayout } from '../components/layout/DashboardLayout'
import { AlarmsList } from '../components/alarms/AlarmsList'
import { RecurringAlarms } from '../components/alarms/RecurringAlarms'
import { mockAlarms } from '../lib/mockData'

export function Alarms() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Alarmes</h1>
          <p className="text-gray-500">Monitoramento e gestao de alarmes do sistema</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <AlarmsList alarms={mockAlarms} />
          </div>
          <div className="lg:col-span-1">
            <RecurringAlarms alarms={mockAlarms} />
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
