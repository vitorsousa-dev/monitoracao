export type MonitoringRecordType =
  | 'current-state'
  | 'fault-code'
  | 'alarm-event'
  | 'normalization-event'

export interface MonitoringRecord {
  id: string
  deviceSerialNumber: string
  client?: string
  site?: string
  systemId?: string
  unitUid: string
  type: MonitoringRecordType
  faultCode?: string | null
  faultDescription?: string | null
  operationalState?: string
  setpointTemperature?: number | null
  roomTemperature?: number | null
  mode?: string | null
  fanSpeed?: string | null
  collectedAt: string
  originalEventAt?: string | null
  eventStatus?: string | null
  rawPayload: Record<string, unknown>
  updatedAt: string
}

export function buildMonitoringRecord(
  params: Omit<MonitoringRecord, 'id' | 'collectedAt' | 'updatedAt' | 'rawPayload'> & {
    rawPayload?: Record<string, unknown>
  }
): MonitoringRecord {
  const now = new Date().toISOString()
  return {
    id: `mon-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`,
    collectedAt: now,
    updatedAt: now,
    rawPayload: params.rawPayload ?? {},
    ...params,
  }
}

export function deduplicateRecords(records: MonitoringRecord[]): MonitoringRecord[] {
  const seen = new Map<string, MonitoringRecord>()
  for (const record of records) {
    const key = `${record.deviceSerialNumber}:${record.unitUid}:${record.type}:${record.collectedAt}`
    const existing = seen.get(key)
    if (!existing || new Date(record.updatedAt) > new Date(existing.updatedAt)) {
      seen.set(key, record)
    }
  }
  return Array.from(seen.values())
}
