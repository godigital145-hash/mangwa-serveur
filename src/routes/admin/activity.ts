import { Hono } from 'hono'
import { createModels } from '../../../utils/tables'

type Bindings = { DB: D1Database }

const app = new Hono<{ Bindings: Bindings }>()

app.get('/', async (c) => {
  const { ActivityLogs } = createModels(c.env.DB)
  const limit   = Math.min(Number(c.req.query('limit') ?? '30'), 100)
  const results = await ActivityLogs.findAll({
    select:  ['id', 'action', 'entity_type', 'entity_id', 'entity_name', 'entity_image', 'created_at'],
    orderBy: { column: 'created_at', direction: 'DESC' },
    limit,
  })
  return c.json(results)
})

export default app
