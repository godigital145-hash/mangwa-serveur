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

// Sert un fichier depuis R2
app.get('/*', async (c) => {
  const key = c.req.path.replace('/api/media/', '')
  if (!key) return c.text('Clé manquante', 400)

  const object = await c.env.MEDIA.get(key)
  if (!object) return c.text('Fichier introuvable', 404)

  const headers = new Headers()
  object.writeHttpMetadata(headers)
  headers.set('etag', object.httpEtag)
  headers.set('cache-control', 'public, max-age=31536000, immutable')

  return new Response(object.body, { headers })
})

export default app
