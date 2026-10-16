// GET /api/snapshot — devolve o último retrato ao vivo de cada local (lido pelo painel ao abrir).
// ?site=<siteId> filtra um local.
import { getMany, storeKind } from './_store.js'

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Use GET' })
  res.setHeader('Cache-Control', 'no-store')
  const [indexRaw] = await getMany(['md:live:index'])
  if (!indexRaw) return res.status(200).json({ updatedAt: null, store: storeKind(), clients: [] })
  const index = JSON.parse(indexRaw)
  const wanted = String(req.query?.site || '')
  const sites = index.sites.filter((s) => !wanted || s.siteId === wanted)
  const raws = await getMany(sites.map((s) => `md:live:site:${s.siteId}`))
  const clients = raws.filter(Boolean).map((r) => JSON.parse(r))
  res.status(200).json({ updatedAt: index.updatedAt, store: storeKind(), clients })
}
