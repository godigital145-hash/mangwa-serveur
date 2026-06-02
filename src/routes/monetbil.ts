import { Hono } from 'hono'
import { createModels } from '../../utils/tables'

type Bindings = {
  DB: D1Database
  MONETBIL_SERVICE_KEY: string
  MONETBIL_RETURN_URL: string
  MONETBIL_NOTIFY_URL: string
}

const app = new Hono<{ Bindings: Bindings }>()

app.get('/config', (c) => {
  return c.json({
    configured: Boolean(c.env.MONETBIL_SERVICE_KEY),
  })
})

const COUNTRY_CURRENCY: Record<string, string> = {
  CM: 'XAF',
  CD: 'CDF',
  SN: 'XOF',
  CG: 'XAF',
  BJ: 'XOF',
  LR: 'LRD',
  UG: 'UGX',
  GA: 'XAF',
}

app.post('/create-payment', async (c) => {
  const body = await c.req.json<{
    entity_type: string
    entity_id: string
    amount: number
    name: string
    email: string
    phone?: string
    country?: string
  }>()

  if (!body.entity_type || !body.entity_id || !body.amount || !body.name || !body.email) {
    return c.json({ error: 'Champs obligatoires manquants' }, 400)
  }

  const country = (body.country ?? 'CM').toUpperCase()
  const currency = COUNTRY_CURRENCY[country]
  if (!currency) {
    return c.json({ error: `Pays non supporté : ${country}` }, 400)
  }

  if (!c.env.MONETBIL_SERVICE_KEY) {
    return c.json({ error: 'Monetbil non configuré côté serveur' }, 500)
  }

  const reference = `MB-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`

  const { Payments } = createModels(c.env.DB)
  const payment = await Payments.create({
    entity_type: body.entity_type,
    entity_id: body.entity_id,
    amount: body.amount,
    currency,
    status: 'pending',
    payment_method_id: null,
    reference,
    paypal_order_id: null,
    monetbil_payment_ref: reference,
    monetbil_transaction_id: null,
    customer_name: body.name,
    customer_email: body.email,
    customer_phone: body.phone ?? null,
    created_at: new Date().toISOString(),
  })

  const monetbilBody: Record<string, unknown> = {
    amount: body.amount,
    currency,
    country,
    locale: 'fr',
    payment_ref: reference,
    item_ref: `${body.entity_type}-${body.entity_id}`,
    user: body.email,
    first_name: body.name,
    email: body.email,
    return_url: c.env.MONETBIL_RETURN_URL,
    notify_url: c.env.MONETBIL_NOTIFY_URL,
  }
  if (body.phone) {
    monetbilBody.phone = body.phone
    monetbilBody.phone_lock = true
  }

  const res = await fetch(
    `https://api.monetbil.com/widget/v2.1/${c.env.MONETBIL_SERVICE_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(monetbilBody),
    }
  )

  const data = await res.json() as any
  if (!res.ok || !data?.payment_url) {
    await Payments.update(payment.id, { status: 'failed' })
    return c.json({ error: data?.message ?? 'Monetbil widget failed', details: data }, 500)
  }

  return c.json({
    payment_url: data.payment_url,
    reference,
    payment_id: payment.id,
  })
})

async function handleWebhook(c: any) {
  const contentType = c.req.header('content-type') || ''
  let payload: Record<string, any> = {}

  if (contentType.includes('application/json')) {
    payload = await c.req.json().catch(() => ({}))
  } else {
    const form = await c.req.parseBody().catch(() => ({}))
    payload = form as Record<string, any>
  }

  const paymentRef = String(payload.payment_ref ?? payload.paymentRef ?? '')
  const status = String(payload.status ?? '')
  const transactionId = String(payload.transaction_id ?? payload.transactionId ?? '') || null
  const message = String(payload.message ?? '')

  if (!paymentRef) {
    return c.json({ error: 'payment_ref manquant' }, 400)
  }

  const { Payments } = createModels(c.env.DB)
  const matches = await Payments.findAll({ where: { monetbil_payment_ref: paymentRef }, limit: 1 })
  const payment = matches[0]
  if (!payment) {
    return c.json({ error: 'Paiement introuvable', payment_ref: paymentRef }, 404)
  }

  // Monetbil success: status === '1' or 'success' or message includes 'success'
  const isSuccess = status === '1' || status.toLowerCase() === 'success' || message.toLowerCase() === 'success'
  const newStatus = isSuccess ? 'paid' : 'failed'

  await Payments.update(payment.id, {
    status: newStatus,
    monetbil_transaction_id: transactionId,
  })

  return c.json({ ok: true, status: newStatus })
}

app.post('/webhook', handleWebhook)
app.get('/webhook', handleWebhook)

app.get('/status/:reference', async (c) => {
  const reference = c.req.param('reference')
  const { Payments } = createModels(c.env.DB)
  const matches = await Payments.findAll({ where: { monetbil_payment_ref: reference }, limit: 1 })
  const payment = matches[0]
  if (!payment) return c.json({ error: 'Paiement introuvable' }, 404)
  return c.json({
    status: payment.status,
    reference: payment.reference,
    amount: payment.amount,
  })
})

export default app
