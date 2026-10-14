import { createCoolAutomationError } from './errors'
import { sanitizeForLog, validateUrl, validateWriteCommand } from './security'
import type { CoolAutomationConfig } from './types'

export interface CoolAutomationHttpRequestOptions {
  path: string
  query?: Record<string, string>
  method?: 'GET' | 'POST'
  signal?: AbortSignal
}

export interface CoolAutomationHttpResponse {
  status: number
  body: string
  json: unknown
}

function buildUrl(config: CoolAutomationConfig, path: string, query?: Record<string, string>): string {
  const base = config.baseUrl.replace(/\/$/, '')
  const cleanPath = path.startsWith('/') ? path : `/${path}`
  const url = new URL(base + cleanPath)
  if (query) {
    for (const [key, value] of Object.entries(query)) {
      url.searchParams.set(key, value)
    }
  }
  return url.toString()
}

function mapHttpError(status: number, body: string): never {
  const codeMap: Record<number, string> = {
    400: 'Rota ou versão inválida (HTTP 400).',
    403: 'Dispositivo incorreto ou não autorizado (HTTP 403).',
    404: 'URI incorreta (HTTP 404).',
    405: 'Método HTTP incorreto (HTTP 405).',
    413: 'Cabeçalho fragmentado ou payload muito grande (HTTP 413).',
    501: 'Comando V2 não implementado (HTTP 501).',
  }
  const message = codeMap[status] ?? `Erro HTTP ${status}.`
  throw createCoolAutomationError('HTTP_ERROR', message, { httpStatus: status, responseBody: body })
}

export async function coolAutomationHttpRequest(
  config: CoolAutomationConfig,
  options: CoolAutomationHttpRequestOptions
): Promise<CoolAutomationHttpResponse> {
  const { path, query, method = 'GET' } = options

  const url = buildUrl(config, path, query)
  validateUrl(url)

  if (method === 'POST') {
    validateWriteCommand(query?.command ?? '')
  }

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), config.timeoutMs)

  const startedAt = Date.now()
  try {
    const response = await fetch(url, {
      method,
      signal: controller.signal,
      headers: { Accept: 'application/json' },
    })

    const body = await response.text()
    const responseTimeMs = Date.now() - startedAt

    console.log(
      `[CoolAutomation] ${method} ${sanitizeForLog(url)} -> ${response.status} (${responseTimeMs}ms)`
    )

    if (!response.ok) {
      mapHttpError(response.status, body)
    }

    let json: unknown = null
    try {
      json = body ? JSON.parse(body) : null
    } catch {
      throw createCoolAutomationError('INVALID_JSON', 'Resposta não é um JSON válido.', {
        httpStatus: response.status,
        responseBody: body,
      })
    }

    return { status: response.status, body, json }
  } catch (err) {
    if (err instanceof Error && err.name === 'AbortError') {
      throw createCoolAutomationError('TIMEOUT', `Timeout após ${config.timeoutMs}ms.`)
    }
    if (err instanceof Error && err.name === 'CoolAutomationError') {
      throw err
    }
    if (err instanceof TypeError && err.message.includes('fetch')) {
      throw createCoolAutomationError('DNS_FAILURE', `Falha de DNS ou conexão: ${err.message}`)
    }
    throw createCoolAutomationError('UNKNOWN', `Erro inesperado: ${(err as Error).message}`)
  } finally {
    clearTimeout(timeoutId)
  }
}
