import { Alarm, EquipmentMonthlySnapshot, MonthlySummary, SiteMonthlySnapshot } from '@/types'
import {
  WELLNESSTEC_CLIENT,
  WELLNESSTEC_SITE_ID,
  WELLNESSTEC_SITE_NAME,
  wellnesstecSite,
  wellnesstecSystems,
} from './wellnesstecData'
import { getHealthStatusText } from './utils'

export interface WellnesstecUnitHealthRollup {
  id: string
  unitName: string
  systemId: string
  systemName: string
  unitType: 'ODU' | 'IDU' | 'SYSTEM'
  totalAlerts: number
  health: number
  availability: number
  mttr: number
  status: 'Verde' | 'Amarelo' | 'Vermelho'
  lastAlertAt: string
}

type WellnesstecRawIncident = {
  timestamp: string
  dateKey: string
  isoDate: string
  equipmentName: string
  systemLabel: string
  error: string
  errorCode: string
  errorCategory: string
  severity: 'High' | 'Medium'
}

const RAW_INCIDENTS: WellnesstecRawIncident[] = [
  { timestamp: '31/07/26 22:17', dateKey: '2026-07-31', isoDate: '2026-07-31T22:17:00', equipmentName: 'UC-04T/P1.000', systemLabel: 'UC-04T / P1 - DUTO TERREO', error: 'Outdoor Error', errorCode: '291', errorCategory: 'Outdoor error', severity: 'High' },
  { timestamp: '31/07/26 21:54', dateKey: '2026-07-31', isoDate: '2026-07-31T21:54:00', equipmentName: 'UC-04T/P1.000', systemLabel: 'UC-04T / P1 - DUTO TERREO', error: 'Outdoor Error', errorCode: '291', errorCategory: 'Outdoor error', severity: 'High' },
  { timestamp: '31/07/26 21:29', dateKey: '2026-07-31', isoDate: '2026-07-31T21:29:00', equipmentName: 'UC-04T/P1.000', systemLabel: 'UC-04T / P1 - DUTO TERREO', error: 'Outdoor Error', errorCode: '291', errorCategory: 'Outdoor error', severity: 'High' },
  { timestamp: '31/07/26 21:03', dateKey: '2026-07-31', isoDate: '2026-07-31T21:03:00', equipmentName: 'UC-04T/P1.000', systemLabel: 'UC-04T / P1 - DUTO TERREO', error: 'Outdoor Error', errorCode: '211', errorCategory: 'Outdoor error', severity: 'High' },
  { timestamp: '31/07/26 20:40', dateKey: '2026-07-31', isoDate: '2026-07-31T20:40:00', equipmentName: 'UC-04T/P1.000', systemLabel: 'UC-04T / P1 - DUTO TERREO', error: 'Outdoor Error', errorCode: '291', errorCategory: 'Outdoor error', severity: 'High' },
  { timestamp: '31/07/26 20:20', dateKey: '2026-07-31', isoDate: '2026-07-31T20:20:00', equipmentName: 'UC-04T/P1.000', systemLabel: 'UC-04T / P1 - DUTO TERREO', error: 'Outdoor Error', errorCode: '211', errorCategory: 'Outdoor error', severity: 'High' },
  { timestamp: '31/07/26 19:58', dateKey: '2026-07-31', isoDate: '2026-07-31T19:58:00', equipmentName: 'UC-04T/P1.000', systemLabel: 'UC-04T / P1 - DUTO TERREO', error: 'Outdoor Error', errorCode: '291', errorCategory: 'Outdoor error', severity: 'High' },
  { timestamp: '31/07/26 19:42', dateKey: '2026-07-31', isoDate: '2026-07-31T19:42:00', equipmentName: 'UC-04T/P1.000', systemLabel: 'UC-04T / P1 - DUTO TERREO', error: 'Outdoor Error', errorCode: '291', errorCategory: 'Outdoor error', severity: 'High' },
  { timestamp: '31/07/26 19:27', dateKey: '2026-07-31', isoDate: '2026-07-31T19:27:00', equipmentName: 'UC-04T/P1.000', systemLabel: 'UC-04T / P1 - DUTO TERREO', error: 'Outdoor Error', errorCode: '211', errorCategory: 'Outdoor error', severity: 'High' },
  { timestamp: '31/07/26 19:13', dateKey: '2026-07-31', isoDate: '2026-07-31T19:13:00', equipmentName: 'UC-04T/P1.000', systemLabel: 'UC-04T / P1 - DUTO TERREO', error: 'Outdoor Error', errorCode: '212', errorCategory: 'Outdoor error', severity: 'High' },
  { timestamp: '31/07/26 12:38', dateKey: '2026-07-31', isoDate: '2026-07-31T12:38:00', equipmentName: 'UC-04T/P1.000', systemLabel: 'UC-04T / P1 - DUTO TERREO', error: 'Outdoor Error', errorCode: '291', errorCategory: 'Outdoor error', severity: 'High' },
  { timestamp: '31/07/26 12:37', dateKey: '2026-07-31', isoDate: '2026-07-31T12:37:00', equipmentName: 'UC-04T/P1.000', systemLabel: 'UC-04T / P1 - DUTO TERREO', error: 'Outdoor Error', errorCode: '290', errorCategory: 'Outdoor error', severity: 'High' },
  { timestamp: '31/07/26 12:16', dateKey: '2026-07-31', isoDate: '2026-07-31T12:16:00', equipmentName: 'UC-04T/P1.000', systemLabel: 'UC-04T / P1 - DUTO TERREO', error: 'Outdoor Error', errorCode: '291', errorCategory: 'Outdoor error', severity: 'High' },
  { timestamp: '31/07/26 12:00', dateKey: '2026-07-31', isoDate: '2026-07-31T12:00:00', equipmentName: 'UC-04T/P1.000', systemLabel: 'UC-04T / P1 - DUTO TERREO', error: 'Outdoor Error', errorCode: '291', errorCategory: 'Outdoor error', severity: 'High' },
  { timestamp: '31/07/26 11:46', dateKey: '2026-07-31', isoDate: '2026-07-31T11:46:00', equipmentName: 'UC-04T/P1.000', systemLabel: 'UC-04T / P1 - DUTO TERREO', error: 'Outdoor Error', errorCode: '291', errorCategory: 'Outdoor error', severity: 'High' },
  { timestamp: '31/07/26 11:31', dateKey: '2026-07-31', isoDate: '2026-07-31T11:31:00', equipmentName: 'UC-04T/P1.000', systemLabel: 'UC-04T / P1 - DUTO TERREO', error: 'Outdoor Error', errorCode: '292', errorCategory: 'Outdoor error', severity: 'High' },
  { timestamp: '31/07/26 06:38', dateKey: '2026-07-31', isoDate: '2026-07-31T06:38:00', equipmentName: 'UC-04T/P1.000', systemLabel: 'UC-04T / P1 - DUTO TERREO', error: 'Outdoor Error', errorCode: '291', errorCategory: 'Outdoor error', severity: 'High' },
  { timestamp: '31/07/26 06:29', dateKey: '2026-07-31', isoDate: '2026-07-31T06:29:00', equipmentName: 'UC-04T/P1.000', systemLabel: 'UC-04T / P1 - DUTO TERREO', error: 'Outdoor Error', errorCode: '291', errorCategory: 'Outdoor error', severity: 'High' },
  { timestamp: '31/07/26 06:21', dateKey: '2026-07-31', isoDate: '2026-07-31T06:21:00', equipmentName: 'UC-04T/P1.000', systemLabel: 'UC-04T / P1 - DUTO TERREO', error: 'Outdoor Error', errorCode: '211', errorCategory: 'Outdoor error', severity: 'High' },
  { timestamp: '30/07/26 20:27', dateKey: '2026-07-30', isoDate: '2026-07-30T20:27:00', equipmentName: 'UC-04T/P1.000', systemLabel: 'UC-04T / P1 - DUTO TERREO', error: 'Outdoor Error', errorCode: '291', errorCategory: 'Outdoor error', severity: 'High' },
  { timestamp: '30/07/26 19:54', dateKey: '2026-07-30', isoDate: '2026-07-30T19:54:00', equipmentName: 'UC-04T/P1.000', systemLabel: 'UC-04T / P1 - DUTO TERREO', error: 'Outdoor Error', errorCode: '291', errorCategory: 'Outdoor error', severity: 'High' },
  { timestamp: '30/07/26 19:23', dateKey: '2026-07-30', isoDate: '2026-07-30T19:23:00', equipmentName: 'UC-04T/P1.000', systemLabel: 'UC-04T / P1 - DUTO TERREO', error: 'Outdoor Error', errorCode: '211', errorCategory: 'Outdoor error', severity: 'High' },
  { timestamp: '30/07/26 18:59', dateKey: '2026-07-30', isoDate: '2026-07-30T18:59:00', equipmentName: 'UC-04T/P1.000', systemLabel: 'UC-04T / P1 - DUTO TERREO', error: 'Outdoor Error', errorCode: '291', errorCategory: 'Outdoor error', severity: 'High' },
  { timestamp: '30/07/26 18:37', dateKey: '2026-07-30', isoDate: '2026-07-30T18:37:00', equipmentName: 'UC-04T/P1.000', systemLabel: 'UC-04T / P1 - DUTO TERREO', error: 'Outdoor Error', errorCode: '291', errorCategory: 'Outdoor error', severity: 'High' },
  { timestamp: '30/07/26 18:16', dateKey: '2026-07-30', isoDate: '2026-07-30T18:16:00', equipmentName: 'UC-04T/P1.000', systemLabel: 'UC-04T / P1 - DUTO TERREO', error: 'Outdoor Error', errorCode: '291', errorCategory: 'Outdoor error', severity: 'High' },
  { timestamp: '30/07/26 17:57', dateKey: '2026-07-30', isoDate: '2026-07-30T17:57:00', equipmentName: 'UC-04T/P1.000', systemLabel: 'UC-04T / P1 - DUTO TERREO', error: 'Outdoor Error', errorCode: '291', errorCategory: 'Outdoor error', severity: 'High' },
  { timestamp: '30/07/26 17:38', dateKey: '2026-07-30', isoDate: '2026-07-30T17:38:00', equipmentName: 'UC-04T/P1.000', systemLabel: 'UC-04T / P1 - DUTO TERREO', error: 'Outdoor Error', errorCode: '291', errorCategory: 'Outdoor error', severity: 'High' },
  { timestamp: '30/07/26 17:14', dateKey: '2026-07-30', isoDate: '2026-07-30T17:14:00', equipmentName: 'UC-04T/P1.000', systemLabel: 'UC-04T / P1 - DUTO TERREO', error: 'Outdoor Error', errorCode: '291', errorCategory: 'Outdoor error', severity: 'High' },
  { timestamp: '30/07/26 16:41', dateKey: '2026-07-30', isoDate: '2026-07-30T16:41:00', equipmentName: 'UC-04T/P1.000', systemLabel: 'UC-04T / P1 - DUTO TERREO', error: 'Outdoor Error', errorCode: '342', errorCategory: 'Outdoor error', severity: 'High' },
  { timestamp: '30/07/26 06:09', dateKey: '2026-07-30', isoDate: '2026-07-30T06:09:00', equipmentName: 'UC-04T/P1.000', systemLabel: 'UC-04T / P1 - DUTO TERREO', error: 'Outdoor Error', errorCode: '352', errorCategory: 'Outdoor error', severity: 'High' },
  { timestamp: '29/07/26 18:46', dateKey: '2026-07-29', isoDate: '2026-07-29T18:46:00', equipmentName: 'UC-04T/P1.000', systemLabel: 'UC-04T / P1 - DUTO TERREO', error: 'Outdoor Error', errorCode: '292', errorCategory: 'Outdoor error', severity: 'High' },
  { timestamp: '29/07/26 18:32', dateKey: '2026-07-29', isoDate: '2026-07-29T18:32:00', equipmentName: 'UC-04T/P1.000', systemLabel: 'UC-04T / P1 - DUTO TERREO', error: 'Outdoor Error', errorCode: '242', errorCategory: 'Outdoor error', severity: 'High' },
  { timestamp: '29/07/26 18:14', dateKey: '2026-07-29', isoDate: '2026-07-29T18:14:00', equipmentName: 'UC-04T/P1.000', systemLabel: 'UC-04T / P1 - DUTO TERREO', error: 'Outdoor Error', errorCode: '1', errorCategory: 'Outdoor error', severity: 'High' },
  { timestamp: '29/07/26 18:13', dateKey: '2026-07-29', isoDate: '2026-07-29T18:13:00', equipmentName: 'UC-04T/P1.000', systemLabel: 'UC-04T / P1 - DUTO TERREO', error: 'Outdoor Error', errorCode: '291', errorCategory: 'Outdoor error', severity: 'High' },
  { timestamp: '29/07/26 17:37', dateKey: '2026-07-29', isoDate: '2026-07-29T17:37:00', equipmentName: 'UC-04T/P1.000', systemLabel: 'UC-04T / P1 - DUTO TERREO', error: 'Outdoor Error', errorCode: '291', errorCategory: 'Outdoor error', severity: 'High' },
  { timestamp: '29/07/26 09:39', dateKey: '2026-07-29', isoDate: '2026-07-29T09:39:00', equipmentName: 'UC-04T/P1.000', systemLabel: 'UC-04T / P1 - DUTO TERREO', error: 'Outdoor Error', errorCode: '342', errorCategory: 'Outdoor error', severity: 'High' },
  { timestamp: '29/07/26 09:07', dateKey: '2026-07-29', isoDate: '2026-07-29T09:07:00', equipmentName: 'UC-04T/P1.000', systemLabel: 'UC-04T / P1 - DUTO TERREO', error: 'Outdoor Error', errorCode: '291', errorCategory: 'Outdoor error', severity: 'High' },
  { timestamp: '29/07/26 08:46', dateKey: '2026-07-29', isoDate: '2026-07-29T08:46:00', equipmentName: 'UC-04T/P1.000', systemLabel: 'UC-04T / P1 - DUTO TERREO', error: 'Outdoor Error', errorCode: '211', errorCategory: 'Outdoor error', severity: 'High' },
  { timestamp: '29/07/26 08:34', dateKey: '2026-07-29', isoDate: '2026-07-29T08:34:00', equipmentName: 'UC-04T/P1.000', systemLabel: 'UC-04T / P1 - DUTO TERREO', error: 'Outdoor Error', errorCode: '292', errorCategory: 'Outdoor error', severity: 'High' },
  { timestamp: '29/07/26 07:54', dateKey: '2026-07-29', isoDate: '2026-07-29T07:54:00', equipmentName: 'UC-04T/P1.000', systemLabel: 'UC-04T / P1 - DUTO TERREO', error: 'Outdoor Error', errorCode: '212', errorCategory: 'Outdoor error', severity: 'High' },
  { timestamp: '29/07/26 07:35', dateKey: '2026-07-29', isoDate: '2026-07-29T07:35:00', equipmentName: 'UC-04T/P1.000', systemLabel: 'UC-04T / P1 - DUTO TERREO', error: 'Outdoor Error', errorCode: '292', errorCategory: 'Outdoor error', severity: 'High' },
  { timestamp: '29/07/26 07:15', dateKey: '2026-07-29', isoDate: '2026-07-29T07:15:00', equipmentName: 'UC-04T/P1.000', systemLabel: 'UC-04T / P1 - DUTO TERREO', error: 'Outdoor Error', errorCode: '212', errorCategory: 'Outdoor error', severity: 'High' },
  { timestamp: '29/07/26 06:56', dateKey: '2026-07-29', isoDate: '2026-07-29T06:56:00', equipmentName: 'UC-04T/P1.000', systemLabel: 'UC-04T / P1 - DUTO TERREO', error: 'Outdoor Error', errorCode: '211', errorCategory: 'Outdoor error', severity: 'High' },
  { timestamp: '28/07/26 22:04', dateKey: '2026-07-28', isoDate: '2026-07-28T22:04:00', equipmentName: 'UC-04T/P1.000', systemLabel: 'UC-04T / P1 - DUTO TERREO', error: 'Outdoor Error', errorCode: '291', errorCategory: 'Outdoor error', severity: 'High' },
  { timestamp: '28/07/26 21:40', dateKey: '2026-07-28', isoDate: '2026-07-28T21:40:00', equipmentName: 'UC-04T/P1.000', systemLabel: 'UC-04T / P1 - DUTO TERREO', error: 'Outdoor Error', errorCode: '291', errorCategory: 'Outdoor error', severity: 'High' },
  { timestamp: '28/07/26 21:13', dateKey: '2026-07-28', isoDate: '2026-07-28T21:13:00', equipmentName: 'UC-04T/P1.000', systemLabel: 'UC-04T / P1 - DUTO TERREO', error: 'Outdoor Error', errorCode: '242', errorCategory: 'Outdoor error', severity: 'High' },
  { timestamp: '28/07/26 20:32', dateKey: '2026-07-28', isoDate: '2026-07-28T20:32:00', equipmentName: 'UC-04T/P1.000', systemLabel: 'UC-04T / P1 - DUTO TERREO', error: 'Outdoor Error', errorCode: '291', errorCategory: 'Outdoor error', severity: 'High' },
  { timestamp: '28/07/26 20:10', dateKey: '2026-07-28', isoDate: '2026-07-28T20:10:00', equipmentName: 'UC-04T/P1.000', systemLabel: 'UC-04T / P1 - DUTO TERREO', error: 'Outdoor Error', errorCode: '292', errorCategory: 'Outdoor error', severity: 'High' },
  { timestamp: '28/07/26 19:12', dateKey: '2026-07-28', isoDate: '2026-07-28T19:12:00', equipmentName: 'UC-04T/P1.000', systemLabel: 'UC-04T / P1 - DUTO TERREO', error: 'Outdoor Error', errorCode: '242', errorCategory: 'Outdoor error', severity: 'High' },
  { timestamp: '28/07/26 12:42', dateKey: '2026-07-28', isoDate: '2026-07-28T12:42:00', equipmentName: 'UC-04T/P1.000', systemLabel: 'UC-04T / P1 - DUTO TERREO', error: 'Outdoor Error', errorCode: '211', errorCategory: 'Outdoor error', severity: 'High' },
  { timestamp: '28/07/26 07:02', dateKey: '2026-07-28', isoDate: '2026-07-28T07:02:00', equipmentName: 'UC-04T/P1.000', systemLabel: 'UC-04T / P1 - DUTO TERREO', error: 'Outdoor Error', errorCode: '291', errorCategory: 'Outdoor error', severity: 'High' },
  { timestamp: '28/07/26 06:42', dateKey: '2026-07-28', isoDate: '2026-07-28T06:42:00', equipmentName: 'UC-04T/P1.000', systemLabel: 'UC-04T / P1 - DUTO TERREO', error: 'Outdoor Error', errorCode: '291', errorCategory: 'Outdoor error', severity: 'High' },
  { timestamp: '28/07/26 06:24', dateKey: '2026-07-28', isoDate: '2026-07-28T06:24:00', equipmentName: 'UC-04T/P1.000', systemLabel: 'UC-04T / P1 - DUTO TERREO', error: 'Outdoor Error', errorCode: '242', errorCategory: 'Outdoor error', severity: 'High' },
  { timestamp: '27/07/26 20:36', dateKey: '2026-07-27', isoDate: '2026-07-27T20:36:00', equipmentName: 'UC-04T/P1.000', systemLabel: 'UC-04T / P1 - DUTO TERREO', error: 'Outdoor Error', errorCode: '211', errorCategory: 'Outdoor error', severity: 'High' },
  { timestamp: '27/07/26 20:11', dateKey: '2026-07-27', isoDate: '2026-07-27T20:11:00', equipmentName: 'UC-04T/P1.000', systemLabel: 'UC-04T / P1 - DUTO TERREO', error: 'Outdoor Error', errorCode: '292', errorCategory: 'Outdoor error', severity: 'High' },
  { timestamp: '27/07/26 19:36', dateKey: '2026-07-27', isoDate: '2026-07-27T19:36:00', equipmentName: 'UC-04T/P1.000', systemLabel: 'UC-04T / P1 - DUTO TERREO', error: 'Outdoor Error', errorCode: '212', errorCategory: 'Outdoor error', severity: 'High' },
  { timestamp: '27/07/26 19:01', dateKey: '2026-07-27', isoDate: '2026-07-27T19:01:00', equipmentName: 'UC-04T/P1.000', systemLabel: 'UC-04T / P1 - DUTO TERREO', error: 'Outdoor Error', errorCode: '291', errorCategory: 'Outdoor error', severity: 'High' },
  { timestamp: '27/07/26 14:47', dateKey: '2026-07-27', isoDate: '2026-07-27T14:47:00', equipmentName: 'UC-04T/P1.000', systemLabel: 'UC-04T / P1 - DUTO TERREO', error: 'Outdoor Error', errorCode: '212', errorCategory: 'Outdoor error', severity: 'High' },
  { timestamp: '27/07/26 14:04', dateKey: '2026-07-27', isoDate: '2026-07-27T14:04:00', equipmentName: 'UC-04T/P1.000', systemLabel: 'UC-04T / P1 - DUTO TERREO', error: 'Outdoor Error', errorCode: '291', errorCategory: 'Outdoor error', severity: 'High' },
  { timestamp: '24/07/26 08:34', dateKey: '2026-07-24', isoDate: '2026-07-24T08:34:00', equipmentName: 'UC-04T/P1.000', systemLabel: 'UC-04T / P1 - DUTO TERREO', error: 'Outdoor Error', errorCode: '531', errorCategory: 'Outdoor error', severity: 'High' },
  { timestamp: '22/07/26 13:02', dateKey: '2026-07-22', isoDate: '2026-07-22T13:02:00', equipmentName: 'UC-04T/P1.000', systemLabel: 'UC-04T / P1 - DUTO TERREO', error: 'Outdoor Error', errorCode: '292', errorCategory: 'Outdoor error', severity: 'High' },
  { timestamp: '22/07/26 12:31', dateKey: '2026-07-22', isoDate: '2026-07-22T12:31:00', equipmentName: 'UC-04T/P1.000', systemLabel: 'UC-04T / P1 - DUTO TERREO', error: 'Outdoor Error', errorCode: '292', errorCategory: 'Outdoor error', severity: 'High' },
  { timestamp: '22/07/26 12:07', dateKey: '2026-07-22', isoDate: '2026-07-22T12:07:00', equipmentName: 'UC-04T/P1.000', systemLabel: 'UC-04T / P1 - DUTO TERREO', error: 'Outdoor Error', errorCode: '1', errorCategory: 'Outdoor error', severity: 'High' },
  { timestamp: '22/07/26 12:06', dateKey: '2026-07-22', isoDate: '2026-07-22T12:06:00', equipmentName: 'UC-04T/P1.000', systemLabel: 'UC-04T / P1 - DUTO TERREO', error: 'Outdoor Error', errorCode: '291', errorCategory: 'Outdoor error', severity: 'High' },
  { timestamp: '22/07/26 11:11', dateKey: '2026-07-22', isoDate: '2026-07-22T11:11:00', equipmentName: 'UC-04T/P1.000', systemLabel: 'UC-04T / P1 - DUTO TERREO', error: 'Outdoor Error', errorCode: '211', errorCategory: 'Outdoor error', severity: 'High' },
  { timestamp: '22/07/26 10:41', dateKey: '2026-07-22', isoDate: '2026-07-22T10:41:00', equipmentName: 'UC-04T/P1.000', systemLabel: 'UC-04T / P1 - DUTO TERREO', error: 'Outdoor Error', errorCode: '292', errorCategory: 'Outdoor error', severity: 'High' },
  { timestamp: '22/07/26 10:09', dateKey: '2026-07-22', isoDate: '2026-07-22T10:09:00', equipmentName: 'UC-04T/P1.000', systemLabel: 'UC-04T / P1 - DUTO TERREO', error: 'Outdoor Error', errorCode: '291', errorCategory: 'Outdoor error', severity: 'High' },
  { timestamp: '22/07/26 09:43', dateKey: '2026-07-22', isoDate: '2026-07-22T09:43:00', equipmentName: 'UC-04T/P1.000', systemLabel: 'UC-04T / P1 - DUTO TERREO', error: 'Outdoor Error', errorCode: '211', errorCategory: 'Outdoor error', severity: 'High' },
  { timestamp: '22/07/26 09:21', dateKey: '2026-07-22', isoDate: '2026-07-22T09:21:00', equipmentName: 'UC-04T/P1.000', systemLabel: 'UC-04T / P1 - DUTO TERREO', error: 'Outdoor Error', errorCode: '242', errorCategory: 'Outdoor error', severity: 'High' },
  { timestamp: '22/07/26 07:02', dateKey: '2026-07-22', isoDate: '2026-07-22T07:02:00', equipmentName: 'UC-04T/P1.000', systemLabel: 'UC-04T / P1 - DUTO TERREO', error: 'Outdoor Error', errorCode: '212', errorCategory: 'Outdoor error', severity: 'High' },
  { timestamp: '21/07/26 15:53', dateKey: '2026-07-21', isoDate: '2026-07-21T15:53:00', equipmentName: 'UC-04T/P1.000', systemLabel: 'UC-04T / P1 - DUTO TERREO', error: 'Outdoor Error', errorCode: '342', errorCategory: 'Outdoor error', severity: 'High' },
  { timestamp: '21/07/26 12:44', dateKey: '2026-07-21', isoDate: '2026-07-21T12:44:00', equipmentName: 'UC-04T/P1.000', systemLabel: 'UC-04T / P1 - DUTO TERREO', error: 'Outdoor Error', errorCode: '211', errorCategory: 'Outdoor error', severity: 'High' },
  { timestamp: '20/07/26 21:44', dateKey: '2026-07-20', isoDate: '2026-07-20T21:44:00', equipmentName: 'UC-04T/P1.000', systemLabel: 'UC-04T / P1 - DUTO TERREO', error: 'Outdoor Error', errorCode: '291', errorCategory: 'Outdoor error', severity: 'High' },
  { timestamp: '20/07/26 21:18', dateKey: '2026-07-20', isoDate: '2026-07-20T21:18:00', equipmentName: 'UC-04T/P1.000', systemLabel: 'UC-04T / P1 - DUTO TERREO', error: 'Outdoor Error', errorCode: '291', errorCategory: 'Outdoor error', severity: 'High' },
  { timestamp: '20/07/26 20:55', dateKey: '2026-07-20', isoDate: '2026-07-20T20:55:00', equipmentName: 'UC-04T/P1.000', systemLabel: 'UC-04T / P1 - DUTO TERREO', error: 'Outdoor Error', errorCode: '291', errorCategory: 'Outdoor error', severity: 'High' },
  { timestamp: '20/07/26 20:33', dateKey: '2026-07-20', isoDate: '2026-07-20T20:33:00', equipmentName: 'UC-04T/P1.000', systemLabel: 'UC-04T / P1 - DUTO TERREO', error: 'Outdoor Error', errorCode: '291', errorCategory: 'Outdoor error', severity: 'High' },
  { timestamp: '20/07/26 20:12', dateKey: '2026-07-20', isoDate: '2026-07-20T20:12:00', equipmentName: 'UC-04T/P1.000', systemLabel: 'UC-04T / P1 - DUTO TERREO', error: 'Outdoor Error', errorCode: '291', errorCategory: 'Outdoor error', severity: 'High' },
  { timestamp: '20/07/26 19:50', dateKey: '2026-07-20', isoDate: '2026-07-20T19:50:00', equipmentName: 'UC-04T/P1.000', systemLabel: 'UC-04T / P1 - DUTO TERREO', error: 'Outdoor Error', errorCode: '211', errorCategory: 'Outdoor error', severity: 'High' },
  { timestamp: '20/07/26 19:30', dateKey: '2026-07-20', isoDate: '2026-07-20T19:30:00', equipmentName: 'UC-04T/P1.000', systemLabel: 'UC-04T / P1 - DUTO TERREO', error: 'Outdoor Error', errorCode: '211', errorCategory: 'Outdoor error', severity: 'High' },
  { timestamp: '20/07/26 19:11', dateKey: '2026-07-20', isoDate: '2026-07-20T19:11:00', equipmentName: 'UC-04T/P1.000', systemLabel: 'UC-04T / P1 - DUTO TERREO', error: 'Outdoor Error', errorCode: '291', errorCategory: 'Outdoor error', severity: 'High' },
  { timestamp: '20/07/26 05:32', dateKey: '2026-07-20', isoDate: '2026-07-20T05:32:00', equipmentName: 'UC-04T/P1.000', systemLabel: 'UC-04T / P1 - DUTO TERREO', error: 'Outdoor Error', errorCode: '291', errorCategory: 'Outdoor error', severity: 'High' },
  { timestamp: '20/07/26 05:11', dateKey: '2026-07-20', isoDate: '2026-07-20T05:11:00', equipmentName: 'UC-04T/P1.000', systemLabel: 'UC-04T / P1 - DUTO TERREO', error: 'Outdoor Error', errorCode: '292', errorCategory: 'Outdoor error', severity: 'High' },
  { timestamp: '20/07/26 04:41', dateKey: '2026-07-20', isoDate: '2026-07-20T04:41:00', equipmentName: 'UC-04T/P1.000', systemLabel: 'UC-04T / P1 - DUTO TERREO', error: 'Outdoor Error', errorCode: '211', errorCategory: 'Outdoor error', severity: 'High' },
  { timestamp: '20/07/26 04:20', dateKey: '2026-07-20', isoDate: '2026-07-20T04:20:00', equipmentName: 'UC-04T/P1.000', systemLabel: 'UC-04T / P1 - DUTO TERREO', error: 'Outdoor Error', errorCode: '342', errorCategory: 'Outdoor error', severity: 'High' },
  { timestamp: '20/07/26 03:49', dateKey: '2026-07-20', isoDate: '2026-07-20T03:49:00', equipmentName: 'UC-04T/P1.000', systemLabel: 'UC-04T / P1 - DUTO TERREO', error: 'Outdoor Error', errorCode: '291', errorCategory: 'Outdoor error', severity: 'High' },
  { timestamp: '20/07/26 03:22', dateKey: '2026-07-20', isoDate: '2026-07-20T03:22:00', equipmentName: 'UC-04T/P1.000', systemLabel: 'UC-04T / P1 - DUTO TERREO', error: 'Outdoor Error', errorCode: '292', errorCategory: 'Outdoor error', severity: 'High' },
  { timestamp: '20/07/26 02:51', dateKey: '2026-07-20', isoDate: '2026-07-20T02:51:00', equipmentName: 'UC-04T/P1.000', systemLabel: 'UC-04T / P1 - DUTO TERREO', error: 'Outdoor Error', errorCode: '352', errorCategory: 'Outdoor error', severity: 'High' },
  { timestamp: '20/07/26 02:33', dateKey: '2026-07-20', isoDate: '2026-07-20T02:33:00', equipmentName: 'UC-04T/P1.000', systemLabel: 'UC-04T / P1 - DUTO TERREO', error: 'Outdoor Error', errorCode: '291', errorCategory: 'Outdoor error', severity: 'High' },
  { timestamp: '20/07/26 01:54', dateKey: '2026-07-20', isoDate: '2026-07-20T01:54:00', equipmentName: 'UC-04T/P1.000', systemLabel: 'UC-04T / P1 - DUTO TERREO', error: 'Outdoor Error', errorCode: '211', errorCategory: 'Outdoor error', severity: 'High' },
  { timestamp: '20/07/26 01:30', dateKey: '2026-07-20', isoDate: '2026-07-20T01:30:00', equipmentName: 'UC-04T/P1.000', systemLabel: 'UC-04T / P1 - DUTO TERREO', error: 'Outdoor Error', errorCode: '212', errorCategory: 'Outdoor error', severity: 'High' },
  { timestamp: '20/07/26 00:52', dateKey: '2026-07-20', isoDate: '2026-07-20T00:52:00', equipmentName: 'UC-04T/P1.000', systemLabel: 'UC-04T / P1 - DUTO TERREO', error: 'Outdoor Error', errorCode: '291', errorCategory: 'Outdoor error', severity: 'High' },
  { timestamp: '20/07/26 00:25', dateKey: '2026-07-20', isoDate: '2026-07-20T00:25:00', equipmentName: 'UC-04T/P1.000', systemLabel: 'UC-04T / P1 - DUTO TERREO', error: 'Outdoor Error', errorCode: '292', errorCategory: 'Outdoor error', severity: 'High' },
  { timestamp: '19/07/26 23:58', dateKey: '2026-07-19', isoDate: '2026-07-19T23:58:00', equipmentName: 'UC-04T/P1.000', systemLabel: 'UC-04T / P1 - DUTO TERREO', error: 'Outdoor Error', errorCode: '291', errorCategory: 'Outdoor error', severity: 'High' },
  { timestamp: '19/07/26 23:31', dateKey: '2026-07-19', isoDate: '2026-07-19T23:31:00', equipmentName: 'UC-04T/P1.000', systemLabel: 'UC-04T / P1 - DUTO TERREO', error: 'Outdoor Error', errorCode: '291', errorCategory: 'Outdoor error', severity: 'High' },
  { timestamp: '19/07/26 23:07', dateKey: '2026-07-19', isoDate: '2026-07-19T23:07:00', equipmentName: 'UC-04T/P1.000', systemLabel: 'UC-04T / P1 - DUTO TERREO', error: 'Outdoor Error', errorCode: '292', errorCategory: 'Outdoor error', severity: 'High' },
  { timestamp: '19/07/26 22:29', dateKey: '2026-07-19', isoDate: '2026-07-19T22:29:00', equipmentName: 'UC-04T/P1.000', systemLabel: 'UC-04T / P1 - DUTO TERREO', error: 'Outdoor Error', errorCode: '291', errorCategory: 'Outdoor error', severity: 'High' },
  { timestamp: '19/07/26 22:06', dateKey: '2026-07-19', isoDate: '2026-07-19T22:06:00', equipmentName: 'UC-04T/P1.000', systemLabel: 'UC-04T / P1 - DUTO TERREO', error: 'Outdoor Error', errorCode: '212', errorCategory: 'Outdoor error', severity: 'High' },
  { timestamp: '19/07/26 21:25', dateKey: '2026-07-19', isoDate: '2026-07-19T21:25:00', equipmentName: 'UC-04T/P1.000', systemLabel: 'UC-04T / P1 - DUTO TERREO', error: 'Outdoor Error', errorCode: '291', errorCategory: 'Outdoor error', severity: 'High' },
  { timestamp: '19/07/26 20:23', dateKey: '2026-07-19', isoDate: '2026-07-19T20:23:00', equipmentName: 'UC-04T/P1.000', systemLabel: 'UC-04T / P1 - DUTO TERREO', error: 'Outdoor Error', errorCode: '292', errorCategory: 'Outdoor error', severity: 'High' },
  { timestamp: '19/07/26 19:45', dateKey: '2026-07-19', isoDate: '2026-07-19T19:45:00', equipmentName: 'UC-04T/P1.000', systemLabel: 'UC-04T / P1 - DUTO TERREO', error: 'Outdoor Error', errorCode: '292', errorCategory: 'Outdoor error', severity: 'High' },
  { timestamp: '19/07/26 18:32', dateKey: '2026-07-19', isoDate: '2026-07-19T18:32:00', equipmentName: 'UC-04T/P1.000', systemLabel: 'UC-04T / P1 - DUTO TERREO', error: 'Outdoor Error', errorCode: '212', errorCategory: 'Outdoor error', severity: 'High' },
  { timestamp: '19/07/26 18:06', dateKey: '2026-07-19', isoDate: '2026-07-19T18:06:00', equipmentName: 'UC-04T/P1.000', systemLabel: 'UC-04T / P1 - DUTO TERREO', error: 'Outdoor Error', errorCode: '211', errorCategory: 'Outdoor error', severity: 'High' },
  { timestamp: '17/07/26 19:00', dateKey: '2026-07-17', isoDate: '2026-07-17T19:00:00', equipmentName: 'UC-04T/P1.000', systemLabel: 'UC-04T / P1 - DUTO TERREO', error: 'Outdoor Error', errorCode: '212', errorCategory: 'Outdoor error', severity: 'High' },
  { timestamp: '17/07/26 18:22', dateKey: '2026-07-17', isoDate: '2026-07-17T18:22:00', equipmentName: 'UC-04T/P1.000', systemLabel: 'UC-04T / P1 - DUTO TERREO', error: 'Outdoor Error', errorCode: '292', errorCategory: 'Outdoor error', severity: 'High' },
  { timestamp: '17/07/26 17:50', dateKey: '2026-07-17', isoDate: '2026-07-17T17:50:00', equipmentName: 'UC-04T/P1.000', systemLabel: 'UC-04T / P1 - DUTO TERREO', error: 'Outdoor Error', errorCode: '292', errorCategory: 'Outdoor error', severity: 'High' },
  { timestamp: '17/07/26 17:11', dateKey: '2026-07-17', isoDate: '2026-07-17T17:11:00', equipmentName: 'UC-04T/P1.000', systemLabel: 'UC-04T / P1 - DUTO TERREO', error: 'Outdoor Error', errorCode: '291', errorCategory: 'Outdoor error', severity: 'High' },
  { timestamp: '16/07/26 22:55', dateKey: '2026-07-16', isoDate: '2026-07-16T22:55:00', equipmentName: 'UC-04T/P1.000', systemLabel: 'UC-04T / P1 - DUTO TERREO', error: 'Outdoor Error', errorCode: '291', errorCategory: 'Outdoor error', severity: 'High' },
  { timestamp: '16/07/26 22:41', dateKey: '2026-07-16', isoDate: '2026-07-16T22:41:00', equipmentName: 'UC-04T/P1.000', systemLabel: 'UC-04T / P1 - DUTO TERREO', error: 'Outdoor Error', errorCode: '292', errorCategory: 'Outdoor error', severity: 'High' },
  { timestamp: '16/07/26 22:17', dateKey: '2026-07-16', isoDate: '2026-07-16T22:17:00', equipmentName: 'UC-04T/P1.000', systemLabel: 'UC-04T / P1 - DUTO TERREO', error: 'Outdoor Error', errorCode: '292', errorCategory: 'Outdoor error', severity: 'High' },
  { timestamp: '16/07/26 21:18', dateKey: '2026-07-16', isoDate: '2026-07-16T21:18:00', equipmentName: 'UC-04T/P1.000', systemLabel: 'UC-04T / P1 - DUTO TERREO', error: 'Outdoor Error', errorCode: '292', errorCategory: 'Outdoor error', severity: 'High' },
  { timestamp: '16/07/26 20:18', dateKey: '2026-07-16', isoDate: '2026-07-16T20:18:00', equipmentName: 'UC-04T/P1.000', systemLabel: 'UC-04T / P1 - DUTO TERREO', error: 'Outdoor Error', errorCode: '292', errorCategory: 'Outdoor error', severity: 'High' },
  { timestamp: '16/07/26 19:52', dateKey: '2026-07-16', isoDate: '2026-07-16T19:52:00', equipmentName: 'UC-04T/P1.000', systemLabel: 'UC-04T / P1 - DUTO TERREO', error: 'Outdoor Error', errorCode: '212', errorCategory: 'Outdoor error', severity: 'High' },
  { timestamp: '16/07/26 19:17', dateKey: '2026-07-16', isoDate: '2026-07-16T19:17:00', equipmentName: 'UC-04T/P1.000', systemLabel: 'UC-04T / P1 - DUTO TERREO', error: 'Outdoor Error', errorCode: '292', errorCategory: 'Outdoor error', severity: 'High' },
  { timestamp: '16/07/26 18:54', dateKey: '2026-07-16', isoDate: '2026-07-16T18:54:00', equipmentName: 'UC-04T/P1.000', systemLabel: 'UC-04T / P1 - DUTO TERREO', error: 'Outdoor Error', errorCode: '292', errorCategory: 'Outdoor error', severity: 'High' },
  { timestamp: '16/07/26 18:32', dateKey: '2026-07-16', isoDate: '2026-07-16T18:32:00', equipmentName: 'UC-04T/P1.000', systemLabel: 'UC-04T / P1 - DUTO TERREO', error: 'Outdoor Error', errorCode: '291', errorCategory: 'Outdoor error', severity: 'High' },
  { timestamp: '15/07/26 07:06', dateKey: '2026-07-15', isoDate: '2026-07-15T07:06:00', equipmentName: 'UC-05T-AUD.000', systemLabel: 'UC-05 T / AUDITORIO', error: 'Temperatura Externa Muito Baixa', errorCode: '', errorCategory: 'Anomaly', severity: 'Medium' },
  { timestamp: '13/07/26 23:27', dateKey: '2026-07-13', isoDate: '2026-07-13T23:27:00', equipmentName: 'UC-05T-AUD.000', systemLabel: 'UC-05 T / AUDITORIO', error: 'Temperatura Externa Muito Baixa', errorCode: '', errorCategory: 'Anomaly', severity: 'Medium' },
  { timestamp: '13/07/26 02:01', dateKey: '2026-07-13', isoDate: '2026-07-13T02:01:00', equipmentName: 'UC-05T-AUD.000', systemLabel: 'UC-05 T / AUDITORIO', error: 'Temperatura Externa Muito Baixa', errorCode: '', errorCategory: 'Anomaly', severity: 'Medium' },
  { timestamp: '11/7/2026 12:53', dateKey: '2026-07-11', isoDate: '2026-07-11T12:53:00', equipmentName: 'UC-01T-NB/ATM', systemLabel: 'UC-01T NB / ATM', error: 'Outdoor Error', errorCode: '291', errorCategory: 'Outdoor error', severity: 'High' },
  { timestamp: '9/7/2026 18:40', dateKey: '2026-07-09', isoDate: '2026-07-09T18:40:00', equipmentName: 'UE05/06P2S-MONITORAMENTO (1D)', systemLabel: 'UC-06 P1N-DIRETORIA / P2S', error: 'Indoor Error', errorCode: '53', errorCategory: 'Indoor error', severity: 'High' },
  { timestamp: '9/7/2026 18:40', dateKey: '2026-07-09', isoDate: '2026-07-09T18:40:00', equipmentName: 'UC-06S-P1/P2.600', systemLabel: 'UC-06 P1N-DIRETORIA / P2S', error: 'Outdoor Error', errorCode: '53', errorCategory: 'Outdoor error', severity: 'High' },
  { timestamp: '9/7/2026 6:30', dateKey: '2026-07-09', isoDate: '2026-07-09T06:30:00', equipmentName: 'UC-02S-P1/P2.M.200', systemLabel: 'UC-02 S-P1/P2', error: 'Outdoor Error', errorCode: '29', errorCategory: 'Outdoor error', severity: 'High' },
  { timestamp: '9/7/2026 0:27', dateKey: '2026-07-09', isoDate: '2026-07-09T00:27:00', equipmentName: 'UC-05T-AUD.000', systemLabel: 'UC-05 T / AUDITORIO', error: 'Temperatura Externa Muito Baixa', errorCode: '', errorCategory: 'Anomaly', severity: 'Medium' },
  { timestamp: '8/7/2026 15:29', dateKey: '2026-07-08', isoDate: '2026-07-08T15:29:00', equipmentName: 'UC-04T/P1.000', systemLabel: 'UC-04T / P1 - DUTO TERREO', error: 'Outdoor Error', errorCode: '211', errorCategory: 'Outdoor error', severity: 'High' },
  { timestamp: '8/7/2026 5:43', dateKey: '2026-07-08', isoDate: '2026-07-08T05:43:00', equipmentName: 'UC-01T-NB/ATM', systemLabel: 'UC-01T NB / ATM', error: 'Temperatura Externa Muito Baixa', errorCode: '', errorCategory: 'Anomaly', severity: 'Medium' },
  { timestamp: '8/7/2026 3:57', dateKey: '2026-07-08', isoDate: '2026-07-08T03:57:00', equipmentName: 'UC-01T-NB/ATM', systemLabel: 'UC-01T NB / ATM', error: 'Temperatura Externa Muito Baixa', errorCode: '', errorCategory: 'Anomaly', severity: 'Medium' },
  { timestamp: '7/7/2026 22:48', dateKey: '2026-07-07', isoDate: '2026-07-07T22:48:00', equipmentName: 'UC-05T-AUD.000', systemLabel: 'UC-05 T / AUDITORIO', error: 'Temperatura Externa Muito Baixa', errorCode: '', errorCategory: 'Anomaly', severity: 'Medium' },
  { timestamp: '7/7/2026 19:40', dateKey: '2026-07-07', isoDate: '2026-07-07T19:40:00', equipmentName: 'UE05/02P1S-ESCRITORIO (24)', systemLabel: 'UC-03 P1N/P2N', error: 'Indoor Error', errorCode: '53', errorCategory: 'Indoor error', severity: 'High' },
  { timestamp: '7/7/2026 19:25', dateKey: '2026-07-07', isoDate: '2026-07-07T19:25:00', equipmentName: 'UE02/02P1S-ESCRITORIO (21)', systemLabel: 'UC-03 P1N/P2N', error: 'Indoor Error', errorCode: '53', errorCategory: 'Indoor error', severity: 'High' },
  { timestamp: '7/7/2026 19:20', dateKey: '2026-07-07', isoDate: '2026-07-07T19:20:00', equipmentName: 'UE04/02P1S-ESCRITORIO (23)', systemLabel: 'UC-03 P1N/P2N', error: 'Indoor Error', errorCode: '53', errorCategory: 'Indoor error', severity: 'High' },
  { timestamp: '7/7/2026 19:20', dateKey: '2026-07-07', isoDate: '2026-07-07T19:20:00', equipmentName: 'UC-02S-P1/P2.M.200', systemLabel: 'UC-02 S-P1/P2', error: 'Outdoor Error', errorCode: '53', errorCategory: 'Outdoor error', severity: 'High' },
  { timestamp: '7/7/2026 9:25', dateKey: '2026-07-07', isoDate: '2026-07-07T09:25:00', equipmentName: 'UC-04T/P1.000', systemLabel: 'UC-04T / P1 - DUTO TERREO', error: 'Outdoor Error', errorCode: '531', errorCategory: 'Outdoor error', severity: 'High' },
  { timestamp: '7/7/2026 1:51', dateKey: '2026-07-07', isoDate: '2026-07-07T01:51:00', equipmentName: 'UC-05T-AUD.000', systemLabel: 'UC-05 T / AUDITORIO', error: 'Temperatura Externa Muito Baixa', errorCode: '', errorCategory: 'Anomaly', severity: 'Medium' },
  { timestamp: '6/7/2026 19:45', dateKey: '2026-07-06', isoDate: '2026-07-06T19:45:00', equipmentName: 'UE33/03P1N-ESCRITORIO (5A)', systemLabel: 'UC-03 P1N/P2N', error: 'Indoor Error', errorCode: '53', errorCategory: 'Indoor error', severity: 'High' },
  { timestamp: '6/7/2026 19:40', dateKey: '2026-07-06', isoDate: '2026-07-06T19:40:00', equipmentName: 'UE34/03P1N-ESCRITORIO (5B)', systemLabel: 'UC-03 P1N/P2N', error: 'Indoor Error', errorCode: '53', errorCategory: 'Indoor error', severity: 'High' },
  { timestamp: '6/7/2026 19:25', dateKey: '2026-07-06', isoDate: '2026-07-06T19:25:00', equipmentName: 'UE29/03P1N-ESCRITORIO (56)', systemLabel: 'UC-03 P1N/P2N', error: 'Indoor Error', errorCode: '53', errorCategory: 'Indoor error', severity: 'High' },
  { timestamp: '6/7/2026 19:11', dateKey: '2026-07-06', isoDate: '2026-07-06T19:11:00', equipmentName: 'UE17/03P1N-ESCRITORIO (4A)', systemLabel: 'UC-03 P1N/P2N', error: 'Indoor Error', errorCode: '53', errorCategory: 'Indoor error', severity: 'High' },
  { timestamp: '6/7/2026 18:55', dateKey: '2026-07-06', isoDate: '2026-07-06T18:55:00', equipmentName: 'UE16/03P1N-ESCRITORIO (49)', systemLabel: 'UC-03 P1N/P2N', error: 'Indoor Error', errorCode: '53', errorCategory: 'Indoor error', severity: 'High' },
  { timestamp: '6/7/2026 18:53', dateKey: '2026-07-06', isoDate: '2026-07-06T18:53:00', equipmentName: 'UC-03N-P1P2.M.300', systemLabel: 'UC-03 P1N/P2N', error: 'Outdoor Error', errorCode: '53', errorCategory: 'Outdoor error', severity: 'High' },
  { timestamp: '4/7/2026 4:44', dateKey: '2026-07-04', isoDate: '2026-07-04T04:44:00', equipmentName: 'UC-05T-AUD.000', systemLabel: 'UC-05 T / AUDITORIO', error: 'Temperatura Externa Muito Baixa', errorCode: '', errorCategory: 'Anomaly', severity: 'Medium' },
  { timestamp: '2/7/2026 17:35', dateKey: '2026-07-02', isoDate: '2026-07-02T17:35:00', equipmentName: 'UE18/02P2S-ESCRITORIO (31)', systemLabel: 'UC-02 S-P1/P2', error: 'Indoor Error', errorCode: '53', errorCategory: 'Indoor error', severity: 'High' },
  { timestamp: '2/7/2026 17:34', dateKey: '2026-07-02', isoDate: '2026-07-02T17:34:00', equipmentName: 'UC-02S-P1/P2.M.200', systemLabel: 'UC-02 S-P1/P2', error: 'Outdoor Error', errorCode: '53', errorCategory: 'Outdoor error', severity: 'High' },
  { timestamp: '2/7/2026 17:25', dateKey: '2026-07-02', isoDate: '2026-07-02T17:25:00', equipmentName: 'UE18/02P2S-ESCRITORIO (31)', systemLabel: 'UC-02 S-P1/P2', error: 'Indoor Error', errorCode: '4', errorCategory: 'Indoor error', severity: 'High' },
  { timestamp: '2/7/2026 17:22', dateKey: '2026-07-02', isoDate: '2026-07-02T17:22:00', equipmentName: 'UC-02S-P1/P2.M.200', systemLabel: 'UC-02 S-P1/P2', error: 'Outdoor Error', errorCode: '53', errorCategory: 'Outdoor error', severity: 'High' },
  { timestamp: '2/7/2026 13:18', dateKey: '2026-07-02', isoDate: '2026-07-02T13:18:00', equipmentName: 'UC-01T-NB/ATM', systemLabel: 'UC-01T NB / ATM', error: 'Outdoor Error', errorCode: '531', errorCategory: 'Outdoor error', severity: 'High' },
  { timestamp: '2/7/2026 9:15', dateKey: '2026-07-02', isoDate: '2026-07-02T09:15:00', equipmentName: 'UE18/02P2S-ESCRITORIO (31)', systemLabel: 'UC-02 S-P1/P2', error: 'Indoor Error', errorCode: '4', errorCategory: 'Indoor error', severity: 'High' },
  { timestamp: '1/7/2026 14:25', dateKey: '2026-07-01', isoDate: '2026-07-01T14:25:00', equipmentName: 'UE18/02P2S-ESCRITORIO (31)', systemLabel: 'UC-02 S-P1/P2', error: 'Indoor Error', errorCode: '4', errorCategory: 'Indoor error', severity: 'High' },
  { timestamp: '1/7/2026 10:05', dateKey: '2026-07-01', isoDate: '2026-07-01T10:05:00', equipmentName: 'UC-10P3.M.A00', systemLabel: 'UC-10 P3', error: 'Outdoor Error', errorCode: '53', errorCategory: 'Outdoor error', severity: 'High' },
  { timestamp: '1/7/2026 10:05', dateKey: '2026-07-01', isoDate: '2026-07-01T10:05:00', equipmentName: 'UE02/10P3S-CONSELHO (6B)', systemLabel: 'UC-10 P3', error: 'Indoor Error', errorCode: '53', errorCategory: 'Indoor error', severity: 'High' },
]

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max)
}

function slugify(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function normalizeEquipmentName(value: string) {
  return value.replace(/\s+\([A-Z0-9]+\)$/i, '').trim()
}

function getMonthLabel(monthKey: string) {
  const [, month] = monthKey.split('-')
  const labels: Record<string, string> = {
    '01': 'Jan', '02': 'Fev', '03': 'Mar', '04': 'Abr',
    '05': 'Mai', '06': 'Jun', '07': 'Jul', '08': 'Ago',
    '09': 'Set', '10': 'Out', '11': 'Nov', '12': 'Dez',
  }
  return `${labels[month] ?? month}/${monthKey.slice(2, 4)}`
}

function buildAlarmType(category: string) {
  if (category.toLowerCase().includes('anomaly')) return 'warning'
  if (category.toLowerCase().includes('indoor error')) return 'critical'
  if (category.toLowerCase().includes('outdoor error')) return 'critical'
  return 'warning'
}

function resolveSystemConfig(systemLabel: string) {
  const matched = wellnesstecSystems.find((system) => {
    const target = systemLabel.toLowerCase()
    const name = system.systemName.toLowerCase()
    if (target.includes(systemLabel) || name === target) return true
    if (target.includes('duto terreo') && name.includes('duto terreo')) return true
    if (target.includes('auditorio') && name.includes('auditorio')) return true
    if (target.includes('nb/atm') && name.includes('nb / atm')) return true
    if (target.includes('diretoria') && name.includes('diretoria')) return true
    if (target.includes('03 p1n/p2n') && name.includes('03 p1n/p2n')) return true
    if (target.includes('02 s-p1/p2') || target.includes('02-p1s/p2s')) return name.includes('02 s-p1/p2')
    if (target.includes('10p3') && name.includes('10 p3')) return true
    return false
  })
  return matched ?? wellnesstecSystems[0]
}

type SystemMonthlyMetric = {
  monthKey: string
  systemName: string
  systemId: string
  totalAlerts: number
  affectedEquipmentIds: Set<string>
  issueCount: number
  outdoorAlerts: number
  indoorAlerts: number
  anomalyAlerts: number
  highSeverityCount: number
  mediumSeverityCount: number
  lastIncidentAt: string
}

const SYSTEM_METRIC_KEY = '2026-07'

const groupedMetrics = RAW_INCIDENTS.reduce<Map<string, SystemMonthlyMetric>>((acc, incident) => {
  const systemConfig = resolveSystemConfig(incident.systemLabel)
  const key = `${SYSTEM_METRIC_KEY}|${systemConfig.id}`
  const current = acc.get(key) ?? {
    monthKey: SYSTEM_METRIC_KEY,
    systemName: systemConfig.systemName,
    systemId: systemConfig.id,
    totalAlerts: 0,
    affectedEquipmentIds: new Set<string>(),
    issueCount: 0,
    outdoorAlerts: 0,
    indoorAlerts: 0,
    anomalyAlerts: 0,
    highSeverityCount: 0,
    mediumSeverityCount: 0,
    lastIncidentAt: incident.isoDate,
  }

  current.totalAlerts += 1
  current.affectedEquipmentIds.add(incident.equipmentName)
  current.issueCount += 1
  if (incident.errorCategory.toLowerCase().includes('outdoor')) current.outdoorAlerts += 1
  if (incident.errorCategory.toLowerCase().includes('indoor')) current.indoorAlerts += 1
  if (incident.errorCategory.toLowerCase().includes('anomaly')) current.anomalyAlerts += 1
  if (incident.severity === 'High') current.highSeverityCount += 1
  if (incident.severity === 'Medium') current.mediumSeverityCount += 1
  if (incident.isoDate > current.lastIncidentAt) current.lastIncidentAt = incident.isoDate

  acc.set(key, current)
  return acc
}, new Map())

function buildSystemSnapshot(metric: SystemMonthlyMetric): EquipmentMonthlySnapshot {
  const affectedMachines = metric.affectedEquipmentIds.size
  const healthPenalty =
    metric.totalAlerts * 0.09 +
    affectedMachines * 2.1 +
    metric.outdoorAlerts * 0.05 +
    metric.indoorAlerts * 0.05 +
    metric.anomalyAlerts * 0.03 +
    metric.highSeverityCount * 0.02
  const availabilityPenalty =
    metric.totalAlerts * 0.08 +
    affectedMachines * 1.7 +
    metric.outdoorAlerts * 0.04 +
    metric.indoorAlerts * 0.04 +
    metric.highSeverityCount * 0.02
  const comfortPenalty =
    metric.totalAlerts * 0.07 +
    affectedMachines * 1.4 +
    metric.anomalyAlerts * 0.04 +
    metric.indoorAlerts * 0.03
  const performancePenalty =
    metric.totalAlerts * 0.08 +
    metric.outdoorAlerts * 0.06 +
    affectedMachines * 1.5
  const mttr = Number(clamp(2.4 + metric.issueCount * 0.55 + affectedMachines * 0.12, 2.4, 18).toFixed(2))
  const lastUpdated = '2026-07-31'
  const startDate = '2026-07-01'
  const endDate = '2026-07-31'

  const health = Number(clamp(98 - healthPenalty, 42, 99).toFixed(2))
  const availability = Number(clamp(99 - availabilityPenalty, 45, 99).toFixed(2))
  const comfort = Number(clamp(97 - comfortPenalty, 46, 99).toFixed(2))
  const performance = Number(clamp(97 - performancePenalty, 44, 99).toFixed(2))

  return {
    id: `wellnesstec-system-${metric.systemId}`,
    name: metric.systemName,
    type: 'VRV',
    area: WELLNESSTEC_SITE_NAME,
    client: WELLNESSTEC_CLIENT,
    siteId: WELLNESSTEC_SITE_ID,
    health,
    availability,
    comfort,
    performance,
    status: getHealthStatusText(health) as EquipmentMonthlySnapshot['status'],
    mttr,
    totalOccurrences: metric.totalAlerts,
    criticalOccurrences: metric.highSeverityCount,
    moderateOccurrences: metric.mediumSeverityCount,
    informativeOccurrences: 0,
    lastUpdated,
    monthKey: metric.monthKey,
    month: getMonthLabel(metric.monthKey),
    startDate,
    endDate,
  }
}

export const wellnesstecMonthlyEquipmentSnapshots: EquipmentMonthlySnapshot[] = Array.from(groupedMetrics.values())
  .map(buildSystemSnapshot)
  .sort((a, b) => b.totalOccurrences - a.totalOccurrences)

export const wellnesstecMonthlySummaries: MonthlySummary[] = (() => {
  const snapshots = wellnesstecMonthlyEquipmentSnapshots
  if (snapshots.length === 0) return []
  const monthKey = snapshots[0].monthKey
  const count = snapshots.length
  return [
    {
      monthKey,
      month: getMonthLabel(monthKey),
      startDate: snapshots[0].startDate,
      endDate: snapshots[count - 1].endDate,
      health: Number((snapshots.reduce((sum, s) => sum + s.health, 0) / count).toFixed(2)),
      target: 90,
      availability: Number((snapshots.reduce((sum, s) => sum + s.availability, 0) / count).toFixed(2)),
      mttr: Number((snapshots.reduce((sum, s) => sum + s.mttr, 0) / count).toFixed(2)),
      totalOccurrences: snapshots.reduce((sum, s) => sum + s.totalOccurrences, 0),
      affectedEquipment: count,
    },
  ]
})()

export const wellnesstecSiteMonthlySnapshots: SiteMonthlySnapshot[] = wellnesstecMonthlySummaries.map((summary) => ({
  ...wellnesstecSite,
  saudeGeral: summary.health,
  disponibilidade: summary.availability,
  conforto: Number(clamp(summary.health + 1.2, 0, 100).toFixed(2)),
  performance: Number(clamp(summary.availability + 0.7, 0, 100).toFixed(2)),
  ocorrenciasCriticas: summary.totalOccurrences,
  ultimaAtualizacao: summary.endDate.split('-').reverse().join('/'),
  monthKey: summary.monthKey,
  month: summary.month,
}))

export const wellnesstecAlarms: Alarm[] = RAW_INCIDENTS.map((incident, index) => {
  const systemConfig = resolveSystemConfig(incident.systemLabel)
  const isAggregatedErrorCode = !incident.errorCode || incident.errorCode.length === 0
  const codeText = isAggregatedErrorCode ? '' : ` (cod. ${incident.errorCode})`
  const message = `${incident.error}${codeText} em ${incident.timestamp}.`
  const type = buildAlarmType(incident.errorCategory)
  const priority = incident.severity === 'High' ? 1 : 2
  return {
    id: `wellnesstec-jul-${index + 1}`,
    equipmentId: `wellnesstec-system-${systemConfig.id}`,
    equipmentName: incident.equipmentName,
    type,
    message,
    status: index < RAW_INCIDENTS.length * 0.35 ? 'pending_followup' : 'open',
    priority,
    createdAt: incident.isoDate,
    updatedAt: incident.isoDate,
    clientName: WELLNESSTEC_CLIENT,
    areaName: systemConfig.systemName,
    hasFollowup: index < RAW_INCIDENTS.length * 0.35,
    followupCount: 1,
  }
})

const unitRollupMap = RAW_INCIDENTS.reduce<Map<string, WellnesstecUnitHealthRollup>>((acc, incident) => {
  const systemConfig = resolveSystemConfig(incident.systemLabel)
  const unitNameRaw = normalizeEquipmentName(incident.equipmentName)
  const unitType: WellnesstecUnitHealthRollup['unitType'] =
    systemConfig.outdoorUnits.some((odu) => odu.toLowerCase().includes(unitNameRaw.toLowerCase()) || unitNameRaw.toLowerCase().includes('uc-')) ? 'ODU' : 'IDU'
  const id = `${systemConfig.id}-${slugify(unitNameRaw)}`
  const current = acc.get(id) ?? {
    id,
    unitName: incident.equipmentName,
    systemId: systemConfig.id,
    systemName: systemConfig.systemName,
    unitType,
    totalAlerts: 0,
    health: 98,
    availability: 99,
    mttr: 1.2,
    status: 'Verde' as const,
    lastAlertAt: incident.isoDate,
  }

  current.totalAlerts += 1
  if (incident.isoDate > current.lastAlertAt) current.lastAlertAt = incident.isoDate
  acc.set(id, current)
  return acc
}, new Map())

export const wellnesstecUnitHealthRollups: WellnesstecUnitHealthRollup[] = Array.from(unitRollupMap.values())
  .map((unit) => {
    const penalty = unit.totalAlerts * (unit.unitType === 'ODU' ? 0.22 : 0.18)
    const health = clamp(98 - penalty, 38, 99)
    const availability = clamp(99 - unit.totalAlerts * (unit.unitType === 'ODU' ? 0.17 : 0.14), 42, 99)
    const mttr = clamp(1.8 + unit.totalAlerts * (unit.unitType === 'ODU' ? 0.05 : 0.04), 1.8, 16)
    return {
      ...unit,
      health: Number(health.toFixed(2)),
      availability: Number(availability.toFixed(2)),
      mttr: Number(mttr.toFixed(2)),
      status: getHealthStatusText(health) as WellnesstecUnitHealthRollup['status'],
    }
  })
  .sort((a, b) => b.totalAlerts - a.totalAlerts || a.unitName.localeCompare(b.unitName))

export const wellnesstecSystemsWithOccurrences = new Set(
  wellnesstecMonthlyEquipmentSnapshots
    .map((snapshot) => snapshot.name)
    .filter((systemName) => wellnesstecSystems.some((system) => system.systemName === systemName))
)
