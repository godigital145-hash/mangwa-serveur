import { Hono } from 'hono'
import { createModels, type PaymentMethod } from '../../../utils/tables'

type Bindings = { DB: D1Database }

const app = new Hono<{ Bindings: Bindings }>()

app.get('/', async (c) => {
  const { PaymentMethods } = createModels(c.env.DB)
  const results = await PaymentMethods.findAll({
    select:  ['id', 'name', 'type', 'active', 'created_at'],
    orderBy: { column: 'name', direction: 'ASC' },
  })
  return c.json(results)
})

app.post('/', async (c) => {
  const { PaymentMethods } = createModels(c.env.DB)
  const body = await c.req.json<{ name: string; type?: string }>()
  const created = await PaymentMethods.create({
    name:       body.name,
    type:       body.type ?? 'mobile_money',
    active:     1,
    created_at: new Date().toISOString(),
  })
  return c.json({ id: created.id }, 201)
})

app.put('/:id', async (c) => {
  const { PaymentMethods } = createModels(c.env.DB)
  const id   = Number(c.req.param('id'))
  const body = await c.req.json<{ name?: string; type?: string; active?: number }>()

  const data: Partial<PaymentMethod> = {}
  if (body.name   != null) data.name   = body.name
  if (body.type   != null) data.type   = body.type
  if (body.active != null) data.active = body.active

  await PaymentMethods.update(id, data)
  return c.json({ success: true })
})

app.delete('/:id', async (c) => {
  const { PaymentMethods } = createModels(c.env.DB)
  const id = Number(c.req.param('id'))
  await PaymentMethods.delete(id)
  return c.json({ success: true })
})

export default app
