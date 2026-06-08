import { Hono } from 'hono'
import { createModels } from '../../utils/tables'

type Bindings = { DB: D1Database; MEDIA: R2Bucket }

const app = new Hono<{ Bindings: Bindings }>()

function validateWaveform<T extends { waveform?: string | null }>(row: T): T {
  if (!row.waveform) return row
  try {
    const bars = JSON.parse(row.waveform)
    if (!Array.isArray(bars) || bars.length < 2000) return { ...row, waveform: null }
  } catch {
    return { ...row, waveform: null }
  }
  return row
}

app.get('/', async (c) => {
  const { orm } = createModels(c.env.DB)
  const results = await orm.query<any>(
    `SELECT * FROM audios WHERE type IS NULL OR type = 'musique' ORDER BY created_at DESC`,
  )
  return c.json(results.map(validateWaveform))
})

app.get('/:id', async (c) => {
  const { Audios } = createModels(c.env.DB)
  const row = await Audios.findById(c.req.param('id'))
  if (!row) return c.json({ error: 'Introuvable' }, 404)
  return c.json(validateWaveform(row))
})

// Album contenant cet audio avec toutes ses pistes
app.get('/:id/album', async (c) => {
  const { AlbumTracks, Albums, Audios } = createModels(c.env.DB)
  const audioId = c.req.param('id')

  const entry = await AlbumTracks.findOne({ where: { audio_id: audioId } })
  if (!entry) return c.json(null)

  const album = await Albums.findById(entry.album_id)
  if (!album) return c.json(null)

  const trackEntries = await AlbumTracks.findAll({
    where: { album_id: album.id },
    orderBy: { column: 'track_order', direction: 'ASC' },
  })

  const tracks = (
    await Promise.all(trackEntries.map((t) => Audios.findById(t.audio_id)))
  ).filter(Boolean)

  return c.json({ id: album.id, title: album.title, cover: album.cover, tracks })
})

export default app
