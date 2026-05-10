import { Hono } from 'hono'
import { createModels } from '../../utils/tables'

type Bindings = { DB: D1Database }

const app = new Hono<{ Bindings: Bindings }>()

app.get('/', async (c) => {
  const { Albums } = createModels(c.env.DB)
  const results = await Albums.findAll({
    orderBy: { column: 'created_at', direction: 'DESC' },
  })
  return c.json(results)
})

app.get('/:id', async (c) => {
  const { Albums, orm } = createModels(c.env.DB)
  const id  = Number(c.req.param('id'))
  const row = await Albums.findById(id)
  if (!row) return c.json({ error: 'Introuvable' }, 404)

  const tracks = await orm.query<{
    audio_id: number; track_order: number;
    title: string; artist: string | null; cover: string | null;
    audio_file: string | null; duration: number | null; free: number;
  }>(
    `SELECT at.audio_id, at.track_order,
            a.title, a.artist, a.cover, a.audio_file, a.duration, a.free
     FROM album_tracks at
     JOIN audios a ON a.id = at.audio_id
     WHERE at.album_id = ?
     ORDER BY at.track_order ASC`,
    [id],
  )

  return c.json({ ...row, tracks })
})

export default app
