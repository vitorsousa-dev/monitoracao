import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { coolAutomationHttpRequest } from '../client'
import type { CoolAutomationConfig } from '../types'

const config: CoolAutomationConfig = {
  baseUrl: 'http://192.168.1.100:10103',
  deviceSerialNumber: 'CM-12345',
  apiVersion: 'v2.0',
  timeoutMs: 5000,
  enabled: true,
}

describe('coolAutomationHttpRequest', () => {
  const originalFetch = globalThis.fetch

  afterEach(() => {
    vi.restoreAllMocks()
    globalThis.fetch = originalFetch
  })

  it('returns parsed JSON on success', async () => {
    const responseBody = JSON.stringify({ command: 'ls2', rc: 'OK', data: [] })
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: () => Promise.resolve(responseBody),
    }) as unknown as typeof fetch

    const response = await coolAutomationHttpRequest(config, { path: '/v2.0/device/CM-12345/ls2' })
    expect(response.status).toBe(200)
    expect(response.json).toEqual({ command: 'ls2', rc: 'OK', data: [] })
  })

  it('maps HTTP 400 to error', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 400,
      text: () => Promise.resolve('bad request'),
    }) as unknown as typeof fetch

    await expect(
      coolAutomationHttpRequest(config, { path: '/v2.0/device/CM-12345/ls2' })
    ).rejects.toThrow(/rota ou versão inválida/i)
  })

  it('maps HTTP 403 to error', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 403,
      text: () => Promise.resolve('forbidden'),
    }) as unknown as typeof fetch

    await expect(
      coolAutomationHttpRequest(config, { path: '/v2.0/device/CM-12345/ls2' })
    ).rejects.toThrow(/não autorizado/i)
  })

  it('maps HTTP 404 to error', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 404,
      text: () => Promise.resolve('not found'),
    }) as unknown as typeof fetch

    await expect(
      coolAutomationHttpRequest(config, { path: '/v2.0/device/CM-12345/ls2' })
    ).rejects.toThrow(/URI incorreta/i)
  })

  it('maps HTTP 501 to error', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 501,
      text: () => Promise.resolve('not implemented'),
    }) as unknown as typeof fetch

    await expect(
      coolAutomationHttpRequest(config, { path: '/v2.0/device/CM-12345/ls2' })
    ).rejects.toThrow(/não implementado/i)
  })

  it('throws TIMEOUT on abort', async () => {
    globalThis.fetch = vi.fn().mockImplementation((_url: string, init?: { signal?: AbortSignal }) => {
      return new Promise((_resolve, reject) => {
        if (init?.signal) {
          if (init.signal.aborted) {
            reject(new DOMException('Aborted', 'AbortError'))
            return
          }
          init.signal.addEventListener('abort', () => {
            reject(new DOMException('Aborted', 'AbortError'))
          })
        }
      })
    }) as unknown as typeof fetch
    const timeoutConfig = { ...config, timeoutMs: 50 }

    await expect(
      coolAutomationHttpRequest(timeoutConfig, { path: '/v2.0/device/CM-12345/ls2' })
    ).rejects.toThrow(/Timeout/i)
  })

  it('throws DNS_FAILURE on network error', async () => {
    globalThis.fetch = vi.fn().mockRejectedValue(new TypeError('fetch failed')) as unknown as typeof fetch

    await expect(
      coolAutomationHttpRequest(config, { path: '/v2.0/device/CM-12345/ls2' })
    ).rejects.toThrow(/DNS ou conexão/i)
  })

  it('throws INVALID_JSON on non-JSON response', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: () => Promise.resolve('<html>not json</html>'),
    }) as unknown as typeof fetch

    await expect(
      coolAutomationHttpRequest(config, { path: '/v2.0/device/CM-12345/ls2' })
    ).rejects.toThrow(/não é um JSON/i)
  })

  it('blocks write commands on POST', async () => {
    await expect(
      coolAutomationHttpRequest(config, {
        path: '/v1.0/device/CM-12345/raw',
        method: 'POST',
        query: { command: 'on 1.1' },
      })
    ).rejects.toThrow(/bloqueado/i)
  })
})
