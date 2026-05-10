import { Hono } from 'hono'
import { logActivity } from '../../lib/activity'
import { createModels, type Audio } from '../../../utils/tables'

type Bindings = { DB: D1Database }

const app = new Hono<{ Bindings: Bindings }>()

app.post('/', async (c) => {
  const { Audios, AlbumTracks, orm } = createModels(c.env.DB)
  const form      = await c.req.formData()
  const title     = form.get('title') as string
  const coverKey  = (form.get('cover') as string) || null
  const audioKey  = (form.get('audio_file') as string) || null
  const lyricsKey = (form.get('lyrics') as string) || null
  const albumId   = (form.get('album_id') as string) || null
  const now       = new Date().toISOString()

  const created = await Audios.create({
    title,
    artist:       (form.get('artist') as string) || null,
    cover:        coverKey,
    audio_file:   audioKey,
    description:  (form.get('description') as string) || null,
    genre:        (form.get('genre') as string) || null,
    duration:     form.get('duration') ? Number(form.get('duration')) : null,
    published_at: (form.get('published_at') as string) || null,
    featured:     form.get('featured') === 'true' ? 1 : 0,
    price:        form.get('price') ? Number(form.get('price')) : null,
    free:         form.get('free') === 'true' ? 1 : 0,
    album:        (form.get('album') as string) || null,
    album_id:     albumId,
    lyrics:       lyricsKey,
    created_at:   now,
    updated_at:   now,
  })

  if (albumId) {
    const rows = await orm.query<{ max_order: number | null }>(
      `SELECT MAX(track_order) as max_order FROM album_tracks WHERE album_id = ?`,
      [albumId],
    )
    const nextOrder = (rows[0]?.max_order ?? 0) + 1
    await AlbumTracks.create({ album_id: albumId, audio_id: created.id, track_order: nextOrder })
  }

  await logActivity(c.env.DB, 'create', 'audio', created.id, title, coverKey)
  return c.json({ id: created.id }, 201)
})

app.put('/:id', async (c) => {
  const { Audios, AlbumTracks, orm } = createModels(c.env.DB)
  const id        = c.req.param('id')
  const form      = await c.req.formData()
  const title     = form.get('title') as string
  const coverKey  = (form.get('cover') as string) || null
  const audioKey  = (form.get('audio_file') as string) || null
  const lyricsKey = (form.get('lyrics') as string) || null
  const newAlbumId = (form.get('album_id') as string) || null

  const existing = await Audios.findById(id)
  const oldAlbumId = existing?.album_id ?? null

  const data: Partial<Audio> = {
    title,
    artist:       (form.get('artist') as string) || null,
    description:  (form.get('description') as string) || null,
    genre:        (form.get('genre') as string) || null,
    duration:     form.get('duration') ? Number(form.get('duration')) : null,
    published_at: (form.get('published_at') as string) || null,
    featured:     form.get('featured') === 'true' ? 1 : 0,
    price:        form.get('price') ? Number(form.get('price')) : null,
    free:         form.get('free') === 'true' ? 1 : 0,
    album:        (form.get('album') as string) || null,
    album_id:     newAlbumId,
    updated_at:   new Date().toISOString(),
  }
  if (coverKey !== null)  data.cover      = coverKey
  if (audioKey !== null)  data.audio_file = audioKey
  if (lyricsKey !== null) data.lyrics     = lyricsKey

  await Audios.update(id, data)

  if (oldAlbumId !== newAlbumId) {
    if (oldAlbumId) {
      await orm.run(`DELETE FROM album_tracks WHERE audio_id = ? AND album_id = ?`, [id, oldAlbumId])
    }
    if (newAlbumId) {
      const rows = await orm.query<{ max_order: number | null }>(
        `SELECT MAX(track_order) as max_order FROM album_tracks WHERE album_id = ?`,
        [newAlbumId],
      )
      const nextOrder = (rows[0]?.max_order ?? 0) + 1
      await AlbumTracks.create({ album_id: newAlbumId, audio_id: id, track_order: nextOrder })
    }
  }

  await logActivity(c.env.DB, 'update', 'audio', id, title, coverKey)
  return c.json({ success: true })
})

app.delete('/:id', async (c) => {
  const { Audios, orm } = createModels(c.env.DB)
  const id     = c.req.param('id')
  const entity = await Audios.findById(id)
  if (entity?.album_id) {
    await orm.run(`DELETE FROM album_tracks WHERE audio_id = ?`, [id])
  }
  await Audios.delete(id)
  await logActivity(c.env.DB, 'delete', 'audio', id, entity?.title ?? null, entity?.cover ?? null)
  return c.json({ success: true })
})

export default app
