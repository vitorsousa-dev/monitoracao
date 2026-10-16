// Armazenamento dos dados ao vivo enviados pelo Diagnóstico Plus.
// Produção: Upstash Redis (Vercel → Storage → Upstash Redis), via API REST — variáveis
// KV_REST_API_URL / KV_REST_API_TOKEN (ou UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN).
// Desenvolvimento local: memória do processo.

const URL_ = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL || ''
const TOKEN = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN || ''
const memory = globalThis.__mdLiveMemory || (globalThis.__mdLiveMemory = new Map())

export const storeKind = () => (URL_ && TOKEN ? 'upstash' : 'memory')

async function redis(commands) {
  const r = await fetch(`${URL_}/pipeline`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(commands),
  })
  if (!r.ok) throw new Error(`Upstash HTTP ${r.status}: ${(await r.text()).slice(0, 200)}`)
  const out = await r.json()
  const err = out.find((x) => x.error)
  if (err) throw new Error(`Upstash: ${err.error}`)
  return out.map((x) => x.result)
}

export async function setMany(entries) {
  if (storeKind() === 'memory') { for (const [k, v] of entries) memory.set(k, v); return }
  await redis(entries.map(([k, v]) => ['SET', k, v]))
}

export async function getMany(keys) {
  if (!keys.length) return []
  if (storeKind() === 'memory') return keys.map((k) => memory.get(k) ?? null)
  return redis(keys.map((k) => ['GET', k]))
}
