import { Hono } from 'hono'
import { logActivity } from '../../lib/activity'
import { createModels, type Album } from '../../../utils/tables'

type Bindings = { DB: D1Database }

const app = new Hono<{ Bindings: Bindings }>()

// ── Liste des albums ──────────────────────────────────────────────────────────
app.get('/', async (c) => {
  const { Albums } = createModels(c.env.DB)
  await Albums.createTable()
  const results = await Albums.findAll({
    select:  ['id', 'title', 'artist', 'cover', 'genre', 'featured', 'free', 'created_at'],
    orderBy: { column: 'created_at', direction: 'DESC' },
  })
  return c.json(results)
})

// ── Pistes d'un album ─────────────────────────────────────────────────────────
app.get('/:id/tracks', async (c) => {
  const { orm } = createModels(c.env.DB)
  const id = c.req.param('id')
  const tracks = await orm.query<{
    audio_id: string; track_order: number;
    title: string; artist: string | null; cover: string | null; duration: number | null;
  }>(
    `SELECT id as audio_id, 0 as track_order,
            title, artist, cover, duration
     FROM audios
     WHERE album_id = ?
     ORDER BY created_at ASC`,
    [id],
  )
  return c.json(tracks)
})

// ── Créer un album ────────────────────────────────────────────────────────────
app.post('/', async (c) => {
  const { Albums } = createModels(c.env.DB)
  const form     = await c.req.formData()
  const title    = form.get('title') as string
  const coverKey = (form.get('cover') as string) || null
  const now      = new Date().toISOString()

  const created = await Albums.create({
    title,
    artist:       (form.get('artist') as string) || null,
    cover:        coverKey,
    description:  (form.get('description') as string) || null,
    genre:        (form.get('genre') as string) || null,
    published_at: (form.get('published_at') as string) || null,
    featured:     form.get('featured') === 'true' ? 1 : 0,
    price:        form.get('price') ? Number(form.get('price')) : null,
    free:         form.get('free') === 'false' ? 0 : 1,
    created_at:   now,
    updated_at:   now,
  })

  await logActivity(c.env.DB, 'create', 'album', created.id, title, coverKey)
  return c.json({ id: created.id }, 201)
})

// ── Modifier un album ─────────────────────────────────────────────────────────
app.put('/:id', async (c) => {
  const { Albums } = createModels(c.env.DB)
  const id       = c.req.param('id')
  const form     = await c.req.formData()
  const title    = form.get('title') as string
  const coverKey = (form.get('cover') as string) || null

  const data: Partial<Album> = {
    title,
    artist:       (form.get('artist') as string) || null,
    description:  (form.get('description') as string) || null,
    genre:        (form.get('genre') as string) || null,
    published_at: (form.get('published_at') as string) || null,
    featured:     form.get('featured') === 'true' ? 1 : 0,
    price:        form.get('price') ? Number(form.get('price')) : null,
    free:         form.get('free') === 'false' ? 0 : 1,
    updated_at:   new Date().toISOString(),
  }
  if (coverKey !== null) data.cover = coverKey

  await Albums.update(id, data)
  await logActivity(c.env.DB, 'update', 'album', id, title, coverKey)
  return c.json({ success: true })
})

// ── Remplacer les pistes d'un album ──────────────────────────────────────────
// Body JSON : { tracks: [{ audio_id: string, track_order: number }] }
app.put('/:id/tracks', async (c) => {
  const { AlbumTracks, orm } = createModels(c.env.DB)
  const id   = c.req.param('id')
  const body = await c.req.json<{ tracks: { audio_id: string; track_order: number }[] }>()

  await AlbumTracks.deleteWhere({ album_id: id })

  // Sync album_id on each audio to match
  for (const t of body.tracks) {
    await AlbumTracks.create({ album_id: id, audio_id: t.audio_id, track_order: t.track_order })
    await orm.run(`UPDATE audios SET album_id = ? WHERE id = ?`, [id, t.audio_id])
  }

  return c.json({ success: true })
})

// ── Supprimer un album ────────────────────────────────────────────────────────
app.delete('/:id', async (c) => {
  const { Albums, orm } = createModels(c.env.DB)
  const id     = c.req.param('id')
  const entity = await Albums.findById(id)
  // Detach audios from this album before deleting
  await orm.run(`UPDATE audios SET album_id = NULL, album = NULL WHERE album_id = ?`, [id])
  await orm.run(`DELETE FROM album_tracks WHERE album_id = ?`, [id])
  await Albums.delete(id)
  await logActivity(c.env.DB, 'delete', 'album', id, entity?.title ?? null, entity?.cover ?? null)
  return c.json({ success: true })
})

export default app
