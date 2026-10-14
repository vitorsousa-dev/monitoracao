import { coolAutomationHttpRequest } from './client'
import { parseLs2Response, parseSingleUnitResponse } from './parser'
import type { CoolAutomationConfig, CoolAutomationLs2Result, CoolAutomationUnitState } from './types'

export interface CoolAutomationApi {
  listUnits(): Promise<CoolAutomationLs2Result>
  getUnit(uid: string): Promise<CoolAutomationUnitState>
  getConfig(): CoolAutomationConfig
}

export function createCoolAutomationApi(config: CoolAutomationConfig): CoolAutomationApi {
  return {
    getConfig: () => config,

    async listUnits() {
      const path = `/${config.apiVersion}/device/${config.deviceSerialNumber}/ls2`
      const response = await coolAutomationHttpRequest(config, { path, method: 'GET' })
      return parseLs2Response(response.json)
    },

    async getUnit(uid: string) {
      const safeUid = encodeURIComponent(uid)
      const path = `/${config.apiVersion}/device/${config.deviceSerialNumber}/ls2&${safeUid}`
      const response = await coolAutomationHttpRequest(config, { path, method: 'GET' })
      return parseSingleUnitResponse(response.json)
    },
  }
}
