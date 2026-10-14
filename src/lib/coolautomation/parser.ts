import { createCoolAutomationError } from './errors'
import type { CoolAutomationRawResponse, CoolAutomationUnitState, CoolAutomationLs2Result } from './types'

const FIELD_MAP: Record<string, keyof CoolAutomationUnitState> = {
  uid: 'uid',
  onoff: 'onoff',
  st: 'setpointTemperature',
  rt: 'roomTemperature',
  fspeed: 'fanSpeed',
  mode: 'mode',
  fls: 'faultCode',
  flr: 'faultCode',
  filt: 'filter',
  dmnd: 'demand',
}

function toNumber(value: unknown): number | undefined {
  if (typeof value === 'number' && !Number.isNaN(value)) return value
  if (typeof value === 'string') {
    const parsed = parseFloat(value)
    if (!Number.isNaN(parsed)) return parsed
  }
  return undefined
}

function toStringOrNull(value: unknown): string | null {
  if (value === null || value === undefined) return null
  return String(value)
}

export function parseLs2Response(raw: unknown): CoolAutomationLs2Result {
  if (raw === null || typeof raw !== 'object') {
    throw createCoolAutomationError('INVALID_JSON', 'Resposta não é um objeto JSON válido.')
  }

  const response = raw as Partial<CoolAutomationRawResponse>

  if (response.command === undefined || response.rc === undefined || response.data === undefined) {
    throw createCoolAutomationError(
      'INCOMPLETE_RESPONSE',
      'Resposta incompleta: campos obrigatórios (command, rc, data) ausentes.'
    )
  }

  if (response.rc !== 'OK') {
    throw createCoolAutomationError(
      'RC_NOT_OK',
      `Campo rc diferente de OK: "${response.rc}".`,
      { responseBody: JSON.stringify(response) }
    )
  }

  const data = response.data
  if (!Array.isArray(data)) {
    throw createCoolAutomationError('INVALID_JSON', 'Campo data não é um array de unidades.')
  }

  const units: CoolAutomationUnitState[] = []
  const allFields = new Set<string>()

  for (const item of data) {
    if (item === null || typeof item !== 'object') continue
    const rawUnit = item as Record<string, unknown>
    const unit: CoolAutomationUnitState = {
      uid: String(rawUnit.uid ?? ''),
      raw: rawUnit,
    }

    for (const [key, value] of Object.entries(rawUnit)) {
      allFields.add(key)
      const mapped = FIELD_MAP[key]
      if (!mapped) continue
      switch (mapped) {
        case 'setpointTemperature':
        case 'roomTemperature':
          unit[mapped] = toNumber(value)
          break
        case 'faultCode':
        case 'filter':
        case 'demand':
        case 'onoff':
        case 'fanSpeed':
        case 'mode':
          ;(unit as unknown as Record<string, unknown>)[mapped] = toStringOrNull(value)
          break
      }
    }

    if (unit.uid) units.push(unit)
  }

  if (units.length === 0) {
    throw createCoolAutomationError('NO_UNITS', 'Nenhuma unidade retornada na consulta ls2.')
  }

  return {
    command: response.command,
    rc: response.rc,
    units,
    availableFields: Array.from(allFields).sort(),
  }
}

export function extractFaultCodes(units: CoolAutomationUnitState[]): Array<{ uid: string; faultCode: string | null }> {
  return units.map((u) => ({ uid: u.uid, faultCode: u.faultCode ?? null }))
}

export function parseSingleUnitResponse(raw: unknown): CoolAutomationUnitState {
  if (raw === null || typeof raw !== 'object') {
    throw createCoolAutomationError('INVALID_JSON', 'Resposta de unidade não é um objeto JSON válido.')
  }
  const response = raw as Partial<CoolAutomationRawResponse>
  if (response.rc !== 'OK') {
    throw createCoolAutomationError('RC_NOT_OK', `rc diferente de OK: "${response.rc ?? 'undefined'}"`)
  }
  const data = response.data
  if (data === null || typeof data !== 'object' || Array.isArray(data)) {
    throw createCoolAutomationError('INVALID_JSON', 'Campo data não é um objeto de unidade.')
  }
  const parsed = parseLs2Response({ ...response, data: [data] })
  return parsed.units[0]
}
