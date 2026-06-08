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
    `SELECT * FROM audios WHERE type = 'podcast' ORDER BY created_at DESC`,
  )
  return c.json(results.map(validateWaveform))
})

app.get('/:id', async (c) => {
  const { Audios } = createModels(c.env.DB)
  const row = await Audios.findById(c.req.param('id'))
  if (!row || (row.type && row.type !== 'podcast')) return c.json({ error: 'Introuvable' }, 404)
  return c.json(validateWaveform(row))
})

export default app
