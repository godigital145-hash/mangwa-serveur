import { Hono } from 'hono'
import { createModels } from '../../utils/tables'

type Bindings = { DB: D1Database; MEDIA: R2Bucket }

const app = new Hono<{ Bindings: Bindings }>()

app.get('/', async (c) => {
  const { Magazines } = createModels(c.env.DB)
  const results = await Magazines.findAll({ orderBy: { column: 'created_at', direction: 'DESC' } })
  return c.json(results)
})

app.get('/:id', async (c) => {
  const { Magazines } = createModels(c.env.DB)
  const row = await Magazines.findById(c.req.param('id'))
  if (!row) return c.json({ error: 'Introuvable' }, 404)
  return c.json(row)
})

export default app
