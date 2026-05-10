import { Hono } from 'hono'
import { createModels, type User } from '../../../utils/tables'

type Bindings = { DB: D1Database }

const app = new Hono<{ Bindings: Bindings }>()

app.get('/', async (c) => {
  const { Users } = createModels(c.env.DB)
  const results = await Users.findAll({
    select:  ['id', 'name', 'email', 'role', 'active', 'created_at'],
    orderBy: { column: 'created_at', direction: 'DESC' },
  })
  return c.json(results)
})

app.post('/', async (c) => {
  const { Users } = createModels(c.env.DB)
  const body = await c.req.json<{ name: string; email: string; role?: string }>()
  const now  = new Date().toISOString()
  const created = await Users.create({
    name:       body.name,
    email:      body.email,
    role:       body.role ?? 'user',
    active:     1,
    created_at: now,
    updated_at: now,
  })
  return c.json({ id: created.id }, 201)
})

app.put('/:id', async (c) => {
  const { Users } = createModels(c.env.DB)
  const id   = c.req.param('id')
  const body = await c.req.json<{ name?: string; email?: string; role?: string; active?: number }>()

  const data: Partial<User> = { updated_at: new Date().toISOString() }
  if (body.name   != null) data.name   = body.name
  if (body.email  != null) data.email  = body.email
  if (body.role   != null) data.role   = body.role
  if (body.active != null) data.active = body.active

  await Users.update(id, data)
  return c.json({ success: true })
})

app.delete('/:id', async (c) => {
  const { Users } = createModels(c.env.DB)
  const id = Number(c.req.param('id'))
  await Users.delete(id)
  return c.json({ success: true })
})

export default app
