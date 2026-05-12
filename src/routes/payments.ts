import { Hono } from 'hono'
import { createModels } from '../../utils/tables'

type Bindings = { DB: D1Database }

const app = new Hono<{ Bindings: Bindings }>()

// Liste des méthodes de paiement actives (publique)
app.get('/methods', async (c) => {
  const { PaymentMethods } = createModels(c.env.DB)
  const results = await PaymentMethods.findAll({
    where:   { active: 1 },
    select:  ['id', 'name', 'type'],
    orderBy: { column: 'name', direction: 'ASC' },
  })
  return c.json(results)
})

// Créer une demande de paiement (publique)
app.post('/', async (c) => {
  const { Payments } = createModels(c.env.DB)
  const body = await c.req.json<{
    entity_type: 'magazine' | 'audio'
    entity_id:   string
    amount:      number
    currency?:   string
    name:        string
    email:       string
    phone?:      string
    payment_method_id?: string
  }>()

  if (!body.entity_type || !body.entity_id || !body.amount || !body.name || !body.email) {
    return c.json({ error: 'Champs obligatoires manquants' }, 400)
  }

  const payment = await Payments.create({
    entity_type:       body.entity_type,
    entity_id:         body.entity_id,
    amount:            body.amount,
    currency:          body.currency ?? 'XAF',
    status:            'pending',
    payment_method_id: body.payment_method_id ?? null,
    reference:         `${body.entity_type.toUpperCase()}-${Date.now()}`,
    created_at:        new Date().toISOString(),
  })

  return c.json({ id: payment.id, reference: payment.reference }, 201)
})

export default app
