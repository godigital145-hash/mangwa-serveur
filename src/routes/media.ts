import { Hono } from 'hono'
import { createModels } from '../../utils/tables'

type Bindings = { DB: D1Database; MEDIA: R2Bucket }

const app = new Hono<{ Bindings: Bindings }>()

app.get('/', async (c) => {
  const { MediaFiles } = createModels(c.env.DB)
  const results = await MediaFiles.findAll({
    orderBy: { column: 'created_at', direction: 'DESC' },
    limit: 100,
  })
  return c.json(results)
})

// Sert un fichier depuis R2 avec support Range Requests (streaming audio/vidéo)
app.get('/*', async (c) => {
  const key = c.req.path.replace('/api/media/', '')
  if (!key) return c.text('Clé manquante', 400)

  const rangeHeader = c.req.header('range')

  const object = rangeHeader
    ? await c.env.MEDIA.get(key, { range: c.req.raw.headers })
    : await c.env.MEDIA.get(key)

  if (!object) return c.text('Fichier introuvable', 404)

  const headers = new Headers()
  object.writeHttpMetadata(headers)
  headers.set('etag', object.httpEtag)
  headers.set('accept-ranges', 'bytes')

  if (rangeHeader && object.range) {
    const range = object.range as { offset: number; length: number }
    const start = range.offset
    const end = start + range.length - 1
    headers.set('content-range', `bytes ${start}-${end}/${object.size}`)
    headers.set('content-length', String(range.length))
    return new Response(object.body, { status: 206, headers })
  }

  headers.set('content-length', String(object.size))
  headers.set('cache-control', 'public, max-age=31536000, immutable')
  return new Response(object.body, { headers })
})

export default app
