import { describe, it, expect, vi, afterEach } from 'vitest'
import { loadLiveData, getLiveSiteConfigs, getLiveSnapshot } from '@/lib/liveData'
import { mockSites, mockAlarms } from '@/lib/mockData'
import { WEST_CORP_SITE_ID, westCorpSystems } from '@/lib/westCorpData'
import { westCorpAlarms, westCorpUnitHealthRollups } from '@/lib/westCorpOperationalData'

const liveSnapshot = {
  updatedAt: '2026-10-16T18:00:00.000Z',
  clients: [
    {
      client: 'West Corp', siteId: WEST_CORP_SITE_ID, generatedAt: '', receivedAt: '',
      site: { siteId: WEST_CORP_SITE_ID, nome: 'CONDOMÍNIO WEST CORP - EMS', cliente: 'West Corp', endereco: '', cidade: '', estado: '', latitude: null, longitude: null, saudeGeral: 77, disponibilidade: 80, conforto: 90, performance: 85, ocorrenciasCriticas: 12, ultimaAtualizacao: '16/10/2026 15:00' },
      systems: [{ id: 'sys-1', client: 'West Corp', siteId: WEST_CORP_SITE_ID, systemName: 'SYS-1', outdoorUnits: ['UE-1'], internalUnits: ['UI-1'], status: 'active' }],
      unitRollups: [{ id: 'u1', unitName: 'UE-1', systemId: 'sys-1', systemName: 'SYS-1', unitType: 'ODU', totalAlerts: 1, health: 60, availability: 100, mttr: 0, status: 'Amarelo', lastAlertAt: '' }],
      alarms: [{ id: 'dp-DP-1', equipmentId: 'u1', equipmentName: 'UE-1', type: 'critical', message: 'Erro 53', status: 'open', priority: 4, createdAt: '2026-10-16T17:00:00.000Z', updatedAt: '2026-10-16T17:00:00.000Z', clientName: 'West Corp', areaName: 'SYS-1', hasFollowup: false, followupCount: 0, errorCode: '53' }],
    },
    {
      client: 'Cliente Novo', siteId: 'cliente-novo', generatedAt: '', receivedAt: '',
      site: { siteId: 'cliente-novo', nome: 'Cliente Novo', cliente: 'Cliente Novo', endereco: '', cidade: '', estado: '', latitude: null, longitude: null, saudeGeral: 99, disponibilidade: 100, conforto: 100, performance: 99, ocorrenciasCriticas: 0, ultimaAtualizacao: '16/10/2026 15:00' },
      systems: [], unitRollups: [], alarms: [{ id: 'dp-DP-2', equipmentId: 'x', equipmentName: 'UI-X', type: 'warning', message: 'Setpoint', status: 'open', priority: 2, createdAt: '', updatedAt: '', clientName: 'Cliente Novo', areaName: '—', hasFollowup: false, followupCount: 0 }],
    },
  ],
}

afterEach(() => vi.unstubAllGlobals())

describe('dados ao vivo do Diagnóstico Plus', () => {
  it('encaixa os clientes ao vivo nas listas usadas pelas telas', async () => {
    const addressBefore = mockSites.find((s) => s.siteId === WEST_CORP_SITE_ID)!.endereco
    vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify(liveSnapshot), { status: 200 })))
    expect(await loadLiveData()).toBe(true)

    const wc = mockSites.find((s) => s.siteId === WEST_CORP_SITE_ID)!
    expect(wc.saudeGeral).toBe(77)
    expect(wc.ocorrenciasCriticas).toBe(12)
    expect(wc.endereco).toBe(addressBefore) // endereço cadastrado é mantido
    expect(westCorpSystems).toHaveLength(1)
    expect(westCorpUnitHealthRollups[0].unitName).toBe('UE-1')
    expect(westCorpAlarms.some((a) => a.id === 'dp-DP-1')).toBe(true)

    expect(mockSites.some((s) => s.siteId === 'cliente-novo')).toBe(true) // cliente novo aparece
    expect(mockAlarms.some((a) => a.id === 'dp-DP-2')).toBe(true)
    expect(getLiveSiteConfigs([WEST_CORP_SITE_ID]).map((c) => c.siteId)).toEqual(['cliente-novo'])
    expect(getLiveSnapshot().updatedAt).toBe(liveSnapshot.updatedAt)
  })

  it('nova atualização substitui os alarmes ao vivo anteriores sem duplicar', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify(liveSnapshot), { status: 200 })))
    await loadLiveData()
    await loadLiveData()
    expect(westCorpAlarms.filter((a) => a.id === 'dp-DP-1')).toHaveLength(1)
  })

  it('sem resposta da nuvem, segue com os dados estáticos', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => { throw new TypeError('fetch failed') }))
    expect(await loadLiveData()).toBe(false)
  })
})
