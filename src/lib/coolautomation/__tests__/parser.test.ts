import { describe, it, expect } from 'vitest'
import { parseLs2Response, parseSingleUnitResponse, extractFaultCodes } from '../parser'

const validLs2Response = {
  command: 'ls2',
  rc: 'OK',
  data: [
    { uid: '1.1', onoff: 'on', st: '24', rt: '22.5', fspeed: 'auto', mode: 'cool', fls: 'E1', filt: '0', dmnd: '50' },
    { uid: '1.2', onoff: 'off', st: '26', rt: '25', fspeed: 'low', mode: 'heat', fls: null, filt: '1' },
  ],
}

describe('parseLs2Response', () => {
  it('parses a valid ls2 response with units', () => {
    const result = parseLs2Response(validLs2Response)
    expect(result.command).toBe('ls2')
    expect(result.rc).toBe('OK')
    expect(result.units).toHaveLength(2)
    expect(result.units[0].uid).toBe('1.1')
    expect(result.units[0].onoff).toBe('on')
    expect(result.units[0].setpointTemperature).toBe(24)
    expect(result.units[0].roomTemperature).toBe(22.5)
    expect(result.units[0].faultCode).toBe('E1')
    expect(result.units[1].faultCode).toBeNull()
    expect(result.availableFields).toContain('uid')
    expect(result.availableFields).toContain('fls')
  })

  it('accepts both fls and flr as fault code fields', () => {
    const response = {
      command: 'ls2',
      rc: 'OK',
      data: [{ uid: '2.1', flr: 'E5' }],
    }
    const result = parseLs2Response(response)
    expect(result.units[0].faultCode).toBe('E5')
  })

  it('handles missing optional fields gracefully', () => {
    const response = {
      command: 'ls2',
      rc: 'OK',
      data: [{ uid: '3.1' }],
    }
    const result = parseLs2Response(response)
    expect(result.units[0].uid).toBe('3.1')
    expect(result.units[0].setpointTemperature).toBeUndefined()
    expect(result.units[0].faultCode).toBeUndefined()
  })

  it('throws INCOMPLETE_RESPONSE when required fields are missing', () => {
    expect(() => parseLs2Response({ command: 'ls2' })).toThrow(/incompleta/i)
    expect(() => parseLs2Response({ rc: 'OK' })).toThrow(/incompleta/i)
    expect(() => parseLs2Response({ data: [] })).toThrow(/incompleta/i)
  })

  it('throws RC_NOT_OK when rc is not OK', () => {
    expect(() =>
      parseLs2Response({ command: 'ls2', rc: 'ERR', data: [] })
    ).toThrow(/rc diferente de OK/i)
  })

  it('throws INVALID_JSON when data is not an array', () => {
    expect(() =>
      parseLs2Response({ command: 'ls2', rc: 'OK', data: 'not-an-array' })
    ).toThrow(/não é um array/i)
  })

  it('throws NO_UNITS when data array is empty', () => {
    expect(() =>
      parseLs2Response({ command: 'ls2', rc: 'OK', data: [] })
    ).toThrow(/Nenhuma unidade/i)
  })

  it('throws INVALID_JSON when response is not an object', () => {
    expect(() => parseLs2Response(null)).toThrow(/não é um objeto/i)
    expect(() => parseLs2Response('string')).toThrow(/não é um objeto/i)
  })

  it('preserves the original payload in raw field', () => {
    const result = parseLs2Response(validLs2Response)
    expect(result.units[0].raw).toEqual(validLs2Response.data[0])
  })
})

describe('parseSingleUnitResponse', () => {
  it('parses a single unit response', () => {
    const response = {
      command: 'ls2&1.1',
      rc: 'OK',
      data: { uid: '1.1', onoff: 'on', st: '22', fls: 'E3' },
    }
    const unit = parseSingleUnitResponse(response)
    expect(unit.uid).toBe('1.1')
    expect(unit.onoff).toBe('on')
    expect(unit.faultCode).toBe('E3')
  })

  it('throws when data is not an object', () => {
    expect(() =>
      parseSingleUnitResponse({ command: 'ls2', rc: 'OK', data: [] })
    ).toThrow(/não é um objeto de unidade/i)
  })
})

describe('extractFaultCodes', () => {
  it('extracts fault codes from units', () => {
    const result = parseLs2Response(validLs2Response)
    const faults = extractFaultCodes(result.units)
    expect(faults).toEqual([
      { uid: '1.1', faultCode: 'E1' },
      { uid: '1.2', faultCode: null },
    ])
  })
})
