import { useMemo } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { DashboardLayout } from '../components/layout/DashboardLayout'
import { AlarmsList } from '../components/alarms/AlarmsList'
import { RecurringAlarms } from '../components/alarms/RecurringAlarms'
import { equipmentCatalog, findEquipmentCatalogItem } from '@/lib/equipmentCatalog'
import { mockAlarms } from '../lib/mockData'
import { sbaTorresBrasilSystems } from '@/lib/sbaTorresBrasilData'
import { sbaTorresBrasilAlarms } from '@/lib/sbaTorresBrasilOperationalData'
import { wellnesstecSystems } from '@/lib/wellnesstecData'
import { wellnesstecAlarms } from '@/lib/wellnesstecOperationalData'
import { westCorpSystems } from '@/lib/westCorpData'
import { westCorpAlarms } from '@/lib/westCorpOperationalData'
import { useScope } from '@/hooks/useScope'
import { Alarm, SiteSystemCatalog } from '@/types'

const ALL_STRUCTURED_SYSTEMS_FOR_ALARMS: SiteSystemCatalog[] = [
  ...westCorpSystems,
  ...sbaTorresBrasilSystems,
  ...wellnesstecSystems,
]

function normalize(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
}

function slugifyValue(value: string) {
  return normalize(value)
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function findSystemForAlarmEntry(alarm: Alarm): SiteSystemCatalog | null {
  const alarmEquipment = findEquipmentCatalogItem(alarm.equipmentId)
  const normalizedArea = normalize(alarm.areaName ?? '')
  const normalizedEquipName = normalize(alarmEquipment?.name ?? '')

  for (const system of ALL_STRUCTURED_SYSTEMS_FOR_ALARMS) {
    const normalizedSystemName = normalize(system.systemName)
    if (alarmEquipment?.client && alarmEquipment.client !== system.client) continue
    if (alarmEquipment?.siteId && alarmEquipment.siteId !== system.siteId) continue
    if (normalizedArea && normalizedArea.includes(normalizedSystemName.slice(0, 8))) return system
    if (normalizedEquipName.includes(normalizedSystemName.slice(0, 8))) return system
    if (system.id === alarm.equipmentId) return system
    if (system.outdoorUnits.some((odu) => normalize(odu).includes(normalizedEquipName.slice(0, 8)))) return system
    if (system.id.includes(slugifyValue(alarm.equipmentId))) return system
    if (normalizedSystemName === normalizedArea) return system
  }
  return null
}

function findUnitCatalogEntryForAlarm(system: SiteSystemCatalog, unitName: string) {
  const normalizedUnitName = normalize(unitName)
  const direct = equipmentCatalog.find((entry) => {
    if (entry.siteId !== system.siteId) return false
    return normalize(entry.name).includes(normalizedUnitName.slice(0, 8)) || normalizedUnitName.includes(normalize(entry.name).slice(0, 8))
  })
  if (direct) return direct
  return equipmentCatalog.find((entry) => entry.id === `${system.id}-${slugifyValue(unitName)}`)
}

export function Alarms() {
  const { selectedClient, selectedSite } = useScope()
  const [searchParams] = useSearchParams()
  const selectedEquipmentId = searchParams.get('equipmentId') ?? ''
  const selectedEquipmentName = searchParams.get('equipmentName') ?? ''
  const scopedAlarms = useMemo(() => {
    const baseAlarms = [
      ...mockAlarms,
      ...westCorpAlarms,
      ...sbaTorresBrasilAlarms,
      ...wellnesstecAlarms
    ].filter((alarm) => {
      const alarmEquipment = findEquipmentCatalogItem(alarm.equipmentId);
      const matchesClient = selectedClient === 'all-clients' || alarm.clientName === selectedClient;
      const matchesSite = selectedSite === 'all-sites' || (alarmEquipment?.siteId === selectedSite);
      return matchesClient && matchesSite;
    });

    const expanded: Alarm[] = [];
    baseAlarms.forEach((alarm) => {
      expanded.push(alarm);
      const alarmEquipment = findEquipmentCatalogItem(alarm.equipmentId);
      if (alarmEquipment && (alarmEquipment.source === 'equipment' || alarmEquipment.source.endsWith('-unit'))) {
        return;
      }
      const system = findSystemForAlarmEntry(alarm);
      if (!system) return;
      const systemMatchesClient = selectedClient === 'all-clients' || system.client === selectedClient;
      const systemMatchesSite = selectedSite === 'all-sites' || system.siteId === selectedSite;
      if (!systemMatchesClient || !systemMatchesSite) return;

      system.internalUnits.forEach((unitName) => {
        const unitEntry = findUnitCatalogEntryForAlarm(system, unitName);
        if (!unitEntry) return;
        expanded.push({
          ...alarm,
          id: `${alarm.id}--${unitEntry.id}`,
          equipmentId: unitEntry.id,
          equipmentName: unitEntry.name,
          areaName: system.systemName
        });
      });
    });

    return expanded;
  }, [selectedClient, selectedSite])

  const filteredRecurringAlarms = useMemo(() => {
    if (!selectedEquipmentId) {
      return scopedAlarms
    }

    return scopedAlarms.filter((alarm) => alarm.equipmentId === selectedEquipmentId)
  }, [scopedAlarms, selectedEquipmentId])

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Alarmes</h1>
          <p className="text-gray-500">Monitoramento e gestao de alarmes do sistema</p>
        </div>

        {selectedEquipmentId && (
          <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-gray-900">Detalhes do alarme por equipamento</p>
              <p className="text-sm text-gray-600">{selectedEquipmentName}</p>
            </div>
            <Link
              to="/alarms"
              className="px-3 py-2 rounded-lg border border-gray-200 bg-white text-sm text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Limpar filtro
            </Link>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <AlarmsList
              alarms={scopedAlarms}
              selectedEquipmentId={selectedEquipmentId}
              selectedEquipmentName={selectedEquipmentName}
            />
          </div>
          <div className="lg:col-span-1">
            <RecurringAlarms alarms={filteredRecurringAlarms} />
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
