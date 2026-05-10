import { Hono } from 'hono'
import { createModels } from '../../../utils/tables'

type Bindings = { DB: D1Database }

type PaymentRow = {
  id: number
  amount: number
  currency: string
  status: string
  reference: string | null
  entity_type: string | null
  entity_id: number | null
  created_at: string
  user_name: string | null
  user_email: string | null
  method_name: string | null
}

const app = new Hono<{ Bindings: Bindings }>()

app.get('/', async (c) => {
  const { orm } = createModels(c.env.DB)
  const page   = Math.max(1, Number(c.req.query('page') ?? '1'))
  const limit  = 50
  const offset = (page - 1) * limit

  const results = await orm.query<PaymentRow>(
    `SELECT p.id, p.amount, p.currency, p.status, p.reference, p.entity_type, p.entity_id, p.created_at,
            u.name AS user_name, u.email AS user_email,
            pm.name AS method_name
     FROM payments p
     LEFT JOIN users u ON u.id = p.user_id
     LEFT JOIN payment_methods pm ON pm.id = p.payment_method_id
     ORDER BY p.created_at DESC
     LIMIT ? OFFSET ?`,
    [limit, offset],
  )
  return c.json(results)
})

app.put('/:id', async (c) => {
  const { Payments } = createModels(c.env.DB)
  const id   = Number(c.req.param('id'))
  const body = await c.req.json<{ status: string }>()
  await Payments.update(id, { status: body.status })
  return c.json({ success: true })
})

app.delete('/:id', async (c) => {
  const { Payments } = createModels(c.env.DB)
  const id = Number(c.req.param('id'))
  await Payments.delete(id)
  return c.json({ success: true })
})

export default app
