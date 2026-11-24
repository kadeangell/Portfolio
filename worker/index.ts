/// <reference types="@cloudflare/workers-types" />

// Static assets are served by the platform; this Worker only runs first for /api/*.
// Virtual filesystem API, backed by R2:  users/<user>/<path>

interface Env {
  ASSETS: Fetcher
  VFS: R2Bucket
}

const GUEST = 'guest@kadeangell.com'
// No auth yet, so only the shared guest account exists. Everyone is guest.
const ALLOWED_USERS = new Set([GUEST])

const MAX_FILE_BYTES = 256 * 1024
const MAX_FILES = 200
const MAX_PATH = 200

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json', 'cache-control': 'no-store' } })

/** Normalize to an absolute path; null if it escapes or is malformed. */
function cleanPath(raw: string): string | null {
  if (!raw || raw.length > MAX_PATH || raw.includes('\0')) return null
  const parts = raw.split('/').filter((p) => p && p !== '.')
  if (parts.some((p) => p === '..')) return null
  return '/' + parts.join('/')
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url)
    const m = url.pathname.match(/^\/api\/fs\/([^/]+)(\/.*)?$/)
    if (!m) return env.ASSETS.fetch(request)

    const user = decodeURIComponent(m[1])
    if (!ALLOWED_USERS.has(user)) return json({ error: 'unknown user' }, 403)
    const prefix = `users/${user}`

    // GET /api/fs/<user>  -> { files: { "/path": "content" } }
    if (!m[2] || m[2] === '/') {
      if (request.method !== 'GET') return json({ error: 'method not allowed' }, 405)
      const listed = await env.VFS.list({ prefix: prefix + '/', limit: MAX_FILES })
      const entries = await Promise.all(
        listed.objects.map(async (o) => {
          const obj = await env.VFS.get(o.key)
          return [o.key.slice(prefix.length), obj ? await obj.text() : null] as const
        }),
      )
      return json({ files: Object.fromEntries(entries.filter(([, c]) => c !== null)) })
    }

    const path = cleanPath(decodeURIComponent(m[2]))
    if (!path || path === '/') return json({ error: 'bad path' }, 400)
    const key = prefix + path

    if (request.method === 'PUT') {
      const declared = Number(request.headers.get('content-length') ?? 0)
      if (declared > MAX_FILE_BYTES) return json({ error: 'file too large' }, 413)
      const body = await request.text()
      if (new TextEncoder().encode(body).length > MAX_FILE_BYTES) return json({ error: 'file too large' }, 413)
      if (!(await env.VFS.head(key))) {
        const existing = await env.VFS.list({ prefix: prefix + '/', limit: MAX_FILES })
        if (existing.objects.length >= MAX_FILES) return json({ error: 'file limit reached' }, 507)
      }
      await env.VFS.put(key, body)
      return json({ ok: true })
    }
    if (request.method === 'DELETE') {
      await env.VFS.delete(key)
      return json({ ok: true })
    }
    return json({ error: 'method not allowed' }, 405)
  },
}
