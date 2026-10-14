export interface CoolAutomationConfig {
  baseUrl: string
  deviceSerialNumber: string
  apiVersion: 'v1.0' | 'v2.0'
  timeoutMs: number
  enabled: boolean
}

export interface CoolAutomationRawResponse {
  command: string
  data: unknown
  rc: string
}

export interface CoolAutomationUnitState {
  uid: string
  onoff?: 'on' | 'off' | string
  setpointTemperature?: number
  roomTemperature?: number
  fanSpeed?: string
  mode?: string
  faultCode?: string | null
  filter?: string | null
  demand?: string | null
  raw: Record<string, unknown>
}

export interface CoolAutomationLs2Result {
  command: string
  rc: string
  units: CoolAutomationUnitState[]
  availableFields: string[]
}

export type CoolAutomationConnectionSource = 'local-device' | 'cloud-api' | 'unknown'

export interface DiagnosticStep {
  name: string
  status: 'passed' | 'failed' | 'skipped' | 'pending'
  message: string
  responseTimeMs?: number
  httpStatus?: number
  details?: Record<string, unknown>
}

export interface DiagnosticResult {
  configStatus: DiagnosticStep
  connectivityStatus: DiagnosticStep
  ls2QueryStatus: DiagnosticStep
  unitQueryStatus: DiagnosticStep
  unitsFound: number
  fieldsReturned: string[]
  lastTestAt: string | null
  source: CoolAutomationConnectionSource
  testedResources: string[]
  hasAlarmHistory: boolean | null
  alarmHistoryNote: string | null
}

export type CoolAutomationErrorCode =
  | 'CONFIG_MISSING'
  | 'INVALID_URL'
  | 'HTTP_ERROR'
  | 'TIMEOUT'
  | 'DNS_FAILURE'
  | 'INVALID_JSON'
  | 'INCOMPLETE_RESPONSE'
  | 'RC_NOT_OK'
  | 'NO_UNITS'
  | 'MISSING_FAULT_FIELD'
  | 'WRITE_COMMAND_BLOCKED'
  | 'UNAUTHORIZED'
  | 'UNKNOWN'

export interface CoolAutomationError extends Error {
  code: CoolAutomationErrorCode
  httpStatus?: number
  responseBody?: string
}

export type CoolAutomationSeverity = 'Critical' | 'High' | 'Medium' | 'Low' | 'Info'

export interface CoolAutomationFaultCode {
  code: string
  description: string
  severity: CoolAutomationSeverity
}
