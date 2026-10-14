import { describe, it, expect } from 'vitest'
import { buildMonitoringRecord, deduplicateRecords, type MonitoringRecord } from '../dataModel'

function makeRecord(overrides: Partial<MonitoringRecord>): MonitoringRecord {
  return buildMonitoringRecord({
    deviceSerialNumber: 'CM-12345',
    unitUid: '1.1',
    type: 'current-state',
    collectedAt: '2026-10-14T10:00:00.000Z',
    ...overrides,
  })
}

describe('buildMonitoringRecord', () => {
  it('generates an id and timestamps', () => {
    const record = buildMonitoringRecord({
      deviceSerialNumber: 'CM-12345',
      unitUid: '1.1',
      type: 'fault-code',
      faultCode: 'E1',
      faultDescription: 'Erro de sensor',
    })
    expect(record.id).toMatch(/^mon-/)
    expect(record.collectedAt).toBeTruthy()
    expect(record.updatedAt).toBeTruthy()
    expect(record.faultCode).toBe('E1')
    expect(record.rawPayload).toEqual({})
  })

  it('preserves the original payload', () => {
    const payload = { uid: '1.1', fls: 'E1' }
    const record = buildMonitoringRecord({
      deviceSerialNumber: 'CM-12345',
      unitUid: '1.1',
      type: 'current-state',
      rawPayload: payload,
    })
    expect(record.rawPayload).toEqual(payload)
  })
})

describe('deduplicateRecords', () => {
  it('removes duplicate records keeping the most recent', () => {
    const older = makeRecord({ updatedAt: '2026-10-14T10:00:00.000Z' })
    const newer = makeRecord({ updatedAt: '2026-10-14T11:00:00.000Z', roomTemperature: 23 })
    const deduped = deduplicateRecords([older, newer])
    expect(deduped).toHaveLength(1)
    expect(deduped[0].roomTemperature).toBe(23)
  })

  it('keeps records with different keys', () => {
    const r1 = makeRecord({ unitUid: '1.1' })
    const r2 = makeRecord({ unitUid: '1.2' })
    const deduped = deduplicateRecords([r1, r2])
    expect(deduped).toHaveLength(2)
  })
})
