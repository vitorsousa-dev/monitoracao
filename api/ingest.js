// POST /api/ingest — recebe o retrato ao vivo enviado pelo Diagnóstico Plus.
// Autenticação: header "Authorization: Bearer <INGEST_TOKEN>" (variável de ambiente na Vercel).
// Corpo: { source, generatedAt, clients: [{ client, siteId, site, systems, unitRollups, alarms }] }
import crypto from 'node:crypto'
import { setMany, getMany, storeKind } from './_store.js'

const INDEX_KEY = 'md:live:index'
const siteKey = (siteId) => `md:live:site:${siteId}`
const MAX_ALARMS = 1500

function authorized(req) {
  const expected = process.env.INGEST_TOKEN || ''
  const got = String(req.headers.authorization || '').replace(/^Bearer\s+/i, '')
  if (!expected || !got) return false
  const a = crypto.createHash('sha256').update(got).digest(), b = crypto.createHash('sha256').update(expected).digest()
  return crypto.timingSafeEqual(a, b)
}

const isStr = (v) => typeof v === 'string' && v.length > 0
function validClient(c) {
  return c && isStr(c.client) && isStr(c.siteId) && /^[a-z0-9-]{2,80}$/.test(c.siteId) && c.site && typeof c.site === 'object' &&
    Array.isArray(c.systems) && Array.isArray(c.unitRollups) && Array.isArray(c.alarms)
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Use POST' })
  if (!process.env.INGEST_TOKEN) return res.status(503).json({ error: 'INGEST_TOKEN não configurado no servidor' })
  if (!authorized(req)) return res.status(401).json({ error: 'Token inválido' })

  const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {})
  const clients = Array.isArray(body.clients) ? body.clients : []
  const bad = clients.filter((c) => !validClient(c)).map((c) => c && c.siteId)
  if (!clients.length || bad.length) return res.status(400).json({ error: 'Formato inválido', invalid: bad })

  const receivedAt = new Date().toISOString()
  const [prevIndex] = await getMany([INDEX_KEY])
  const index = new Map((prevIndex ? JSON.parse(prevIndex).sites : []).map((s) => [s.siteId, s]))
  const writes = []
  for (const c of clients) {
    const payload = { ...c, alarms: c.alarms.slice(0, MAX_ALARMS), generatedAt: body.generatedAt || receivedAt, receivedAt, source: body.source || 'diagnostico-plus' }
    writes.push([siteKey(c.siteId), JSON.stringify(payload)])
    index.set(c.siteId, { siteId: c.siteId, client: c.client, updatedAt: receivedAt, units: c.unitRollups.length, alarms: payload.alarms.length })
  }
  writes.push([INDEX_KEY, JSON.stringify({ updatedAt: receivedAt, sites: [...index.values()] })])
  await setMany(writes)
  res.status(200).json({ ok: true, store: storeKind(), sites: clients.length, receivedAt })
}
