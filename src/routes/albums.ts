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
  const id  = c.req.param('id')
  const row = await Albums.findById(id)
  if (!row) return c.json({ error: 'Introuvable' }, 404)

  const tracks = await orm.query<{
    audio_id: string; track_order: number;
    title: string; artist: string | null; cover: string | null;
    audio_file: string | null; duration: number | null; free: number; waveform: string | null;
  }>(
    `SELECT id as audio_id, 0 as track_order,
            title, artist, cover, audio_file, duration, free, waveform
     FROM audios
     WHERE album_id = ?
     ORDER BY created_at ASC`,
    [id],
  )

  return c.json({ ...row, tracks })
})

export default app
