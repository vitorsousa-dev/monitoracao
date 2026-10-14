import { describe, it, expect } from 'vitest'
import {
  isReadCommand,
  validateWriteCommand,
  validateUrl,
  validateConfig,
  sanitizeForLog,
} from '../security'

describe('isReadCommand', () => {
  it('accepts documented read commands', () => {
    expect(isReadCommand('ls')).toBe(true)
    expect(isReadCommand('ls2')).toBe(true)
    expect(isReadCommand('stat')).toBe(true)
    expect(isReadCommand('ver')).toBe(true)
    expect(isReadCommand('id')).toBe(true)
  })

  it('rejects write commands', () => {
    expect(isReadCommand('on 1.1')).toBe(false)
    expect(isReadCommand('off 1.1')).toBe(false)
    expect(isReadCommand('set 1.1 st 24')).toBe(false)
    expect(isReadCommand('mode 1.1 cool')).toBe(false)
    expect(isReadCommand('fspeed 1.1 high')).toBe(false)
    expect(isReadCommand('reset 1.1')).toBe(false)
  })

  it('is case-insensitive', () => {
    expect(isReadCommand('LS2')).toBe(true)
    expect(isReadCommand('ON 1.1')).toBe(false)
  })
})

describe('validateWriteCommand', () => {
  it('allows read commands', () => {
    expect(() => validateWriteCommand('ls2')).not.toThrow()
    expect(() => validateWriteCommand('stat')).not.toThrow()
  })

  it('blocks write commands with WRITE_COMMAND_BLOCKED error', () => {
    expect(() => validateWriteCommand('on 1.1')).toThrow(/bloqueado/i)
    expect(() => validateWriteCommand('set 1.1 st 24')).toThrow(/bloqueado/i)
  })
})

describe('validateUrl', () => {
  it('accepts http and https URLs', () => {
    expect(() => validateUrl('http://192.168.1.100:10103')).not.toThrow()
    expect(() => validateUrl('https://api.coolautomation.com')).not.toThrow()
  })

  it('rejects invalid URLs', () => {
    expect(() => validateUrl('not-a-url')).toThrow(/URL inválida/i)
    expect(() => validateUrl('ftp://example.com')).toThrow(/Protocolo não permitido/i)
  })
})

describe('validateConfig', () => {
  it('returns valid when all fields are present', () => {
    const config = {
      baseUrl: 'http://192.168.1.100:10103',
      deviceSerialNumber: 'CM-12345',
      apiVersion: 'v2.0' as const,
      timeoutMs: 10000,
      enabled: true,
    }
    const result = validateConfig(config)
    expect(result.valid).toBe(true)
    expect(result.missing).toHaveLength(0)
  })

  it('returns invalid with missing fields', () => {
    const result = validateConfig({ baseUrl: '', deviceSerialNumber: '' })
    expect(result.valid).toBe(false)
    expect(result.missing).toContain('baseUrl')
    expect(result.missing).toContain('deviceSerialNumber')
  })
})

describe('sanitizeForLog', () => {
  it('removes credentials from URLs', () => {
    const url = 'http://user:password@192.168.1.100:10103/path'
    const sanitized = sanitizeForLog(url)
    expect(sanitized).not.toContain('user')
    expect(sanitized).not.toContain('password')
  })

  it('returns a placeholder for invalid URLs', () => {
    expect(sanitizeForLog('not-a-url')).toBe('[url-invalida]')
  })
})
