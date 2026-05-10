import { Hono } from 'hono'
import { createModels } from '../../../utils/tables'

type Bindings = { DB: D1Database }

const app = new Hono<{ Bindings: Bindings }>()

app.get('/', async (c) => {
  const { Newsletters } = createModels(c.env.DB)
  const results = await Newsletters.findAll({
    select:  ['id', 'email', 'name', 'active', 'subscribed_at'],
    orderBy: { column: 'subscribed_at', direction: 'DESC' },
  })
  return c.json(results)
})

app.put('/:id', async (c) => {
  const { Newsletters } = createModels(c.env.DB)
  const id   = Number(c.req.param('id'))
  const body = await c.req.json<{ active: number }>()
  await Newsletters.update(id, { active: body.active })
  return c.json({ success: true })
})

app.delete('/:id', async (c) => {
  const { Newsletters } = createModels(c.env.DB)
  const id = Number(c.req.param('id'))
  await Newsletters.delete(id)
  return c.json({ success: true })
})

export default app
