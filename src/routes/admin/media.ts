import { Hono } from 'hono'
import { logActivity } from '../../lib/activity'
import { createModels } from '../../../utils/tables'

const FOLDERS = [
  'magazines/covers', 'magazines/pdf', 'magazines/previews',
  'audios/covers', 'audios/files',
  'videos/thumbnails', 'videos/files',
  'hero',
] as const

type Bindings = { DB: D1Database; MEDIA: R2Bucket }

const app = new Hono<{ Bindings: Bindings }>()

app.post('/', async (c) => {
  const { MediaFiles } = createModels(c.env.DB)
  const form   = await c.req.formData()
  const file   = form.get('file') as File | null
  const folder = (form.get('folder') as string) || 'misc'

  if (!file || file.size === 0) return c.json({ error: 'Aucun fichier sélectionné' }, 400)
  if (!FOLDERS.includes(folder as any)) return c.json({ error: 'Dossier invalide' }, 400)

  const safeName = file.name.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9._-]/g, '')
  const key = `${folder}/${Date.now()}-${safeName}`

  await c.env.MEDIA.put(key, await file.arrayBuffer(), {
    httpMetadata: { contentType: file.type },
  })

  const created = await MediaFiles.create({
    key,
    filename:     file.name,
    content_type: file.type,
    size:         file.size,
    folder,
    created_at:   new Date().toISOString(),
  })

  await logActivity(c.env.DB, 'create', 'media', created.id, file.name, key)
  return c.json({ key }, 201)
})

app.delete('/:key{.+}', async (c) => {
  const { MediaFiles } = createModels(c.env.DB)
  const key    = c.req.param('key')
  const entity = await MediaFiles.findOne({ where: { key } })
  try { await c.env.MEDIA.delete(key) } catch (_) {}
  await MediaFiles.deleteWhere({ key })
  await logActivity(c.env.DB, 'delete', 'media', null, entity?.filename ?? key, key)
  return c.json({ success: true })
})

export default app
