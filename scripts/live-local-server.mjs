// Servidor local que imita a Vercel para testar a integração ao vivo:
// serve o build (dist/) e as funções de /api (ingest, snapshot) com armazenamento em memória.
// Uso: npm run build && INGEST_TOKEN=... node scripts/live-local-server.mjs   (porta 4173)
import http from 'node:http'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)))
const dist = path.join(root, 'dist')
const PORT = Number(process.env.PORT || 4173)
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.png': 'image/png', '.json': 'application/json', '.ico': 'image/x-icon' }

http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`)
  if (url.pathname.startsWith('/api/')) {
    const name = url.pathname.slice(5).replace(/[^a-z0-9-]/gi, '')
    const file = path.join(root, 'api', name + '.js')
    if (!fs.existsSync(file)) { res.writeHead(404); return res.end('{}') }
    let raw = ''
    for await (const chunk of req) raw += chunk
    const vreq = { method: req.method, headers: req.headers, query: Object.fromEntries(url.searchParams), body: raw ? JSON.parse(raw) : undefined }
    const vres = {
      code: 200, headers: { 'Content-Type': 'application/json' },
      status(c) { this.code = c; return this },
      setHeader(k, v) { this.headers[k] = v },
      json(o) { res.writeHead(this.code, this.headers); res.end(JSON.stringify(o)) },
    }
    try { await (await import(pathToFileURL(file).href)).default(vreq, vres) } catch (e) { res.writeHead(500); res.end(JSON.stringify({ error: e.message })) }
    return
  }
  let p = path.join(dist, decodeURIComponent(url.pathname))
  if (!p.startsWith(dist) || !fs.existsSync(p) || fs.statSync(p).isDirectory()) p = path.join(dist, 'index.html')
  res.writeHead(200, { 'Content-Type': TYPES[path.extname(p)] || 'application/octet-stream' })
  fs.createReadStream(p).pipe(res)
}).listen(PORT, '127.0.0.1', () => console.log(`meudashboard local (teste da integração) em http://127.0.0.1:${PORT}`))
