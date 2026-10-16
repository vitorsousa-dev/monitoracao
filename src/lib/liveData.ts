// Dados ao vivo publicados pelo Diagnóstico Plus (GET /api/snapshot).
// Ao abrir o app (e a cada atualização), os clientes com dados ao vivo são encaixados nas mesmas
// listas que as telas já usam (mockSites, mockAlarms, catálogos da West Corp), sem mudar os imports delas.
// Clientes sem dados ao vivo continuam com os dados estáticos.
import type { Alarm, SiteLocation, SiteSystemCatalog } from '@/types'
import { mockSites, mockAlarms } from '@/lib/mockData'
import { WEST_CORP_SITE_ID, westCorpSystems } from '@/lib/westCorpData'
import { westCorpAlarms, westCorpUnitHealthRollups } from '@/lib/westCorpOperationalData'

export interface LiveUnitRollup {
  id: string
  unitName: string
  systemId: string
  systemName: string
  unitType: 'ODU' | 'IDU' | 'SYSTEM'
  totalAlerts: number
  health: number
  availability: number
  mttr: number
  status: 'Verde' | 'Amarelo' | 'Vermelho'
  lastAlertAt: string
  activeError?: string | null
  activeErrorDescription?: string | null
  lastReadingAt?: string | null
}

export interface LiveClient {
  client: string
  siteId: string
  site: SiteLocation
  systems: SiteSystemCatalog[]
  unitRollups: LiveUnitRollup[]
  alarms: Alarm[]
  generatedAt: string
  receivedAt: string
  summary?: { equipment: number; openAlarms: number; activeErrors: number }
}

export interface LiveSnapshot {
  updatedAt: string | null
  clients: LiveClient[]
}

let current: LiveSnapshot = { updatedAt: null, clients: [] }
const LIVE_PREFIX = 'dp-'

export const getLiveSnapshot = (): LiveSnapshot => current
export const getLiveClient = (siteId: string): LiveClient | undefined => current.clients.find((c) => c.siteId === siteId)
export const isLiveSite = (siteId: string): boolean => Boolean(getLiveClient(siteId))

// substitui o conteúdo de um array exportado mantendo a mesma referência (todas as telas veem a mudança)
function replaceInPlace<T>(target: T[], items: T[]) {
  target.splice(0, target.length, ...items)
}

// remove alarmes ao vivo anteriores (prefixo dp-) e acrescenta os novos; o histórico estático é mantido
function mergeAlarms(target: Alarm[], live: Alarm[], client: string) {
  for (let i = target.length - 1; i >= 0; i--) {
    if (target[i].id.startsWith(LIVE_PREFIX) && target[i].clientName === client) target.splice(i, 1)
  }
  target.push(...live)
}

const nonEmpty = (site: SiteLocation): Partial<SiteLocation> =>
  Object.fromEntries(Object.entries(site).filter(([, v]) => v !== '' && v !== null && v !== undefined)) as Partial<SiteLocation>

function applySnapshot(snapshot: LiveSnapshot) {
  for (const c of snapshot.clients) {
    // local: atualiza os indicadores mantendo endereço/coordenadas cadastrados
    const existing = mockSites.find((s) => s.siteId === c.siteId)
    if (existing) Object.assign(existing, nonEmpty(c.site))
    else mockSites.push({ ...c.site })

    if (c.siteId === WEST_CORP_SITE_ID) {
      // West Corp já tem tela estruturada: troca sistemas e consolidados pelo vivo
      replaceInPlace(westCorpSystems, c.systems)
      replaceInPlace(westCorpUnitHealthRollups as LiveUnitRollup[], c.unitRollups)
      mergeAlarms(westCorpAlarms, c.alarms, c.client)
    } else {
      mergeAlarms(mockAlarms, c.alarms, c.client)
    }
  }
  current = snapshot
}

// carrega o retrato ao vivo; devolve true se havia dados. Falha silenciosa: o app segue com os dados estáticos.
export async function loadLiveData(timeoutMs = 5000): Promise<boolean> {
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), timeoutMs)
  try {
    const r = await fetch('/api/snapshot', { signal: ctrl.signal, headers: { Accept: 'application/json' } })
    if (!r.ok) return false
    const snap = (await r.json()) as LiveSnapshot
    if (!snap || !Array.isArray(snap.clients) || !snap.clients.length) return false
    applySnapshot(snap)
    return true
  } catch {
    return false
  } finally {
    clearTimeout(timer)
  }
}

// configuração da tela "Saúde dos equipamentos" para clientes ao vivo que ainda não têm tela estruturada
export interface LiveStructuredSiteConfig {
  client: string
  siteId: string
  siteName: string
  systems: SiteSystemCatalog[]
  description: string
  telemetryBadge: string
  emptyTelemetryMessage: string
  unitRollups: LiveUnitRollup[]
}

export function getLiveSiteConfigs(excludeSiteIds: string[]): LiveStructuredSiteConfig[] {
  return current.clients
    .filter((c) => !excludeSiteIds.includes(c.siteId))
    .map((c) => ({
      client: c.client,
      siteId: c.siteId,
      siteName: c.site.nome,
      systems: c.systems,
      description: 'Telemetria ao vivo da CoolAutomation, atualizada automaticamente a cada poucos minutos.',
      telemetryBadge: `Dados ao vivo · atualizado em ${c.site.ultimaAtualizacao}`,
      emptyTelemetryMessage: 'Sem unidades com telemetria neste sistema.',
      unitRollups: c.unitRollups,
    }))
}
