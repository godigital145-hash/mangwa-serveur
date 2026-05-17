import { Hono } from 'hono'
import { createModels } from '../../utils/tables'

type Bindings = { DB: D1Database }

const app = new Hono<{ Bindings: Bindings }>()

app.get('/', async (c) => {
  const { BigHeroSlides } = createModels(c.env.DB)
  const rows = await BigHeroSlides.findAll()
  const active = rows
    .filter((s) => s.active === 1)
    .sort((a, b) => a.slide_order - b.slide_order)
  return c.json(active)
})

export default app
