import { Hono } from 'hono'
import { logActivity } from '../../lib/activity'
import { createModels, type Video } from '../../../utils/tables'

type Bindings = { DB: D1Database }

const app = new Hono<{ Bindings: Bindings }>()

app.post('/', async (c) => {
  const { Videos } = createModels(c.env.DB)
  const form         = await c.req.formData()
  const title        = form.get('title') as string
  const thumbnailKey = (form.get('thumbnail') as string) || null
  const videoKey     = (form.get('video_file') as string) || null
  const now          = new Date().toISOString()

  const created = await Videos.create({
    title,
    thumbnail:    thumbnailKey,
    video_url:    (form.get('video_url') as string) || null,
    video_file:   videoKey,
    description:  (form.get('description') as string) || null,
    category:     (form.get('category') as string) || null,
    duration:     form.get('duration') ? Number(form.get('duration')) : null,
    published_at: (form.get('published_at') as string) || null,
    featured:     form.get('featured') === 'true' ? 1 : 0,
    free:         form.get('free') === 'true' ? 1 : 0,
    created_at:   now,
    updated_at:   now,
  })

  await logActivity(c.env.DB, 'create', 'video', created.id, title, thumbnailKey)
  return c.json({ id: created.id }, 201)
})

app.put('/:id', async (c) => {
  const { Videos } = createModels(c.env.DB)
  const id           = c.req.param('id')
  const form         = await c.req.formData()
  const title        = form.get('title') as string
  const thumbnailKey = (form.get('thumbnail') as string) || null
  const videoKey     = (form.get('video_file') as string) || null

  const data: Partial<Video> = {
    title,
    video_url:    (form.get('video_url') as string) || null,
    description:  (form.get('description') as string) || null,
    category:     (form.get('category') as string) || null,
    duration:     form.get('duration') ? Number(form.get('duration')) : null,
    published_at: (form.get('published_at') as string) || null,
    featured:     form.get('featured') === 'true' ? 1 : 0,
    free:         form.get('free') === 'true' ? 1 : 0,
    updated_at:   new Date().toISOString(),
  }
  if (thumbnailKey !== null) data.thumbnail  = thumbnailKey
  if (videoKey !== null)     data.video_file = videoKey

  await Videos.update(id, data)
  await logActivity(c.env.DB, 'update', 'video', id, title, thumbnailKey)
  return c.json({ success: true })
})

app.delete('/:id', async (c) => {
  const { Videos } = createModels(c.env.DB)
  const id     = c.req.param('id')
  const entity = await Videos.findById(id)
  await Videos.delete(id)
  await logActivity(c.env.DB, 'delete', 'video', id, entity?.title ?? null, entity?.thumbnail ?? null)
  return c.json({ success: true })
})

export default app
