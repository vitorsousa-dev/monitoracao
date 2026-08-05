import { mockEquipment } from '@/lib/mockData'
import { SBA_TORRES_BRASIL_SITE_NAME } from '@/lib/sbaTorresBrasilData'
import { sbaTorresBrasilMonthlyEquipmentSnapshots } from '@/lib/sbaTorresBrasilOperationalData'
import { WELLNESSTEC_SITE_NAME } from '@/lib/wellnesstecData'
import { wellnesstecMonthlyEquipmentSnapshots, wellnesstecUnitHealthRollups } from '@/lib/wellnesstecOperationalData'
import { WEST_CORP_SITE_NAME } from '@/lib/westCorpData'
import { westCorpMonthlyEquipmentSnapshots, westCorpUnitHealthRollups } from '@/lib/westCorpOperationalData'
import { EquipmentHistoryTarget } from '@/types'

export const SERASA_SITE_ID = 'serasa-pdc'
export const SERASA_SITE_NAME = 'Serasa Experian - PDC'

function toTitleCaseLabel(value: string) {
  return value
    .replace(/_/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

const latestWestCorpSystems = Array.from(
  westCorpMonthlyEquipmentSnapshots.reduce<Map<string, EquipmentHistoryTarget>>((accumulator, snapshot) => {
    const current = accumulator.get(snapshot.id)
    if (!current || snapshot.endDate > current.lastUpdated) {
      accumulator.set(snapshot.id, {
        id: snapshot.id,
        name: snapshot.name,
        type: snapshot.type,
        area: snapshot.area,
        client: snapshot.client,
        siteId: snapshot.siteId,
        siteName: WEST_CORP_SITE_NAME,
        health: snapshot.health,
        availability: snapshot.availability,
        comfort: snapshot.comfort,
        performance: snapshot.performance,
        status: snapshot.status,
        mttr: snapshot.mttr,
        totalOccurrences: snapshot.totalOccurrences,
        criticalOccurrences: snapshot.criticalOccurrences,
        moderateOccurrences: snapshot.moderateOccurrences,
        informativeOccurrences: snapshot.informativeOccurrences,
        lastUpdated: snapshot.endDate,
        source: 'west-system',
      })
    }
    return accumulator
  }, new Map()).values()
)

const westCorpUnits: EquipmentHistoryTarget[] = westCorpUnitHealthRollups.map((unit) => ({
  id: unit.id,
  name: toTitleCaseLabel(unit.unitName),
  type: unit.unitType === 'ODU' ? 'ODU' : unit.unitType === 'SYSTEM' ? 'Sistema' : 'IDU',
  area: unit.systemName,
  client: 'West Corp',
  siteId: 'west-corp-alameda-tocantins',
  siteName: WEST_CORP_SITE_NAME,
  health: unit.health,
  availability: unit.availability,
  comfort: unit.health,
  performance: unit.availability,
  status: unit.status,
  mttr: unit.mttr,
  totalOccurrences: unit.totalAlerts,
  criticalOccurrences: unit.totalAlerts,
  moderateOccurrences: 0,
  informativeOccurrences: 0,
  lastUpdated: unit.lastAlertAt.split(' ')[0].split('/').reverse().join('-'),
  source: 'west-unit',
}))

const latestSbaSystems = Array.from(
  sbaTorresBrasilMonthlyEquipmentSnapshots.reduce<Map<string, EquipmentHistoryTarget>>((accumulator, snapshot) => {
    const current = accumulator.get(snapshot.id)
    if (!current || snapshot.endDate > current.lastUpdated) {
      accumulator.set(snapshot.id, {
        id: snapshot.id,
        name: snapshot.name,
        type: snapshot.type,
        area: snapshot.area,
        client: snapshot.client,
        siteId: snapshot.siteId,
        siteName: SBA_TORRES_BRASIL_SITE_NAME,
        health: snapshot.health,
        availability: snapshot.availability,
        comfort: snapshot.comfort,
        performance: snapshot.performance,
        status: snapshot.status,
        mttr: snapshot.mttr,
        totalOccurrences: snapshot.totalOccurrences,
        criticalOccurrences: snapshot.criticalOccurrences,
        moderateOccurrences: snapshot.moderateOccurrences,
        informativeOccurrences: snapshot.informativeOccurrences,
        lastUpdated: snapshot.endDate,
        source: 'sba-system',
      })
    }
    return accumulator
  }, new Map()).values()
)

const latestWellnesstecSystems = Array.from(
  wellnesstecMonthlyEquipmentSnapshots.reduce<Map<string, EquipmentHistoryTarget>>((accumulator, snapshot) => {
    const current = accumulator.get(snapshot.id)
    if (!current || snapshot.endDate > current.lastUpdated) {
      accumulator.set(snapshot.id, {
        id: snapshot.id,
        name: snapshot.name,
        type: snapshot.type,
        area: snapshot.area,
        client: snapshot.client,
        siteId: snapshot.siteId,
        siteName: WELLNESSTEC_SITE_NAME,
        health: snapshot.health,
        availability: snapshot.availability,
        comfort: snapshot.comfort,
        performance: snapshot.performance,
        status: snapshot.status,
        mttr: snapshot.mttr,
        totalOccurrences: snapshot.totalOccurrences,
        criticalOccurrences: snapshot.criticalOccurrences,
        moderateOccurrences: snapshot.moderateOccurrences,
        informativeOccurrences: snapshot.informativeOccurrences,
        lastUpdated: snapshot.endDate,
        source: 'wellnesstec-system',
      })
    }
    return accumulator
  }, new Map()).values()
)

const wellnesstecUnits: EquipmentHistoryTarget[] = wellnesstecUnitHealthRollups.map((unit) => ({
  id: unit.id,
  name: toTitleCaseLabel(unit.unitName),
  type: unit.unitType === 'ODU' ? 'ODU' : unit.unitType === 'SYSTEM' ? 'Sistema' : 'IDU',
  area: unit.systemName,
  client: 'Wellnesstec Tecnologia',
  siteId: 'cresol-baser-01',
  siteName: WELLNESSTEC_SITE_NAME,
  health: unit.health,
  availability: unit.availability,
  comfort: unit.health,
  performance: unit.availability,
  status: unit.status,
  mttr: unit.mttr,
  totalOccurrences: unit.totalAlerts,
  criticalOccurrences: unit.totalAlerts,
  moderateOccurrences: 0,
  informativeOccurrences: 0,
  lastUpdated: unit.lastAlertAt.slice(0, 10),
  source: 'wellnesstec-unit',
}))

const serasaEquipment: EquipmentHistoryTarget[] = mockEquipment.map((equipment) => ({
  ...equipment,
  siteId: equipment.siteId ?? (equipment.client === 'Serasa Experian' ? SERASA_SITE_ID : equipment.siteId),
  siteName:
    equipment.siteId === SERASA_SITE_ID || equipment.client === 'Serasa Experian'
      ? SERASA_SITE_NAME
      : equipment.client,
  source: 'equipment',
}))

export const equipmentCatalog: EquipmentHistoryTarget[] = [
  ...serasaEquipment,
  ...latestWestCorpSystems,
  ...westCorpUnits,
  ...latestSbaSystems,
  ...latestWellnesstecSystems,
  ...wellnesstecUnits,
]

export function findEquipmentCatalogItem(id: string) {
  return equipmentCatalog.find((equipment) => equipment.id === id)
}
