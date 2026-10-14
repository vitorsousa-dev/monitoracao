import type { CoolAutomationErrorCode, CoolAutomationError } from './types'

export function createCoolAutomationError(
  code: CoolAutomationErrorCode,
  message: string,
  options?: { httpStatus?: number; responseBody?: string }
): CoolAutomationError {
  const error = new Error(message) as CoolAutomationError
  error.name = 'CoolAutomationError'
  error.code = code
  if (options?.httpStatus !== undefined) error.httpStatus = options.httpStatus
  if (options?.responseBody !== undefined) error.responseBody = options.responseBody
  return error
}

export function isCoolAutomationError(error: unknown): error is CoolAutomationError {
  return error instanceof Error && error.name === 'CoolAutomationError'
}

export function safeErrorMessage(error: unknown): string {
  if (isCoolAutomationError(error)) return `[${error.code}] ${error.message}`
  if (error instanceof Error) return error.message
  return String(error)
}
