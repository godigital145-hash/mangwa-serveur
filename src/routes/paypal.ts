import { Hono } from 'hono'
import { createModels } from '../../utils/tables'

type Bindings = {
  DB: D1Database
  PAYPAL_CLIENT_ID: string
  PAYPAL_SECRET: string
  PAYPAL_ENV: string
  PAYPAL_XAF_TO_EUR: string
  PAYPAL_WEBHOOK_ID?: string
}

const app = new Hono<{ Bindings: Bindings }>()

function paypalBase(env: Bindings) {
  return env.PAYPAL_ENV === 'live'
    ? 'https://api-m.paypal.com'
    : 'https://api-m.sandbox.paypal.com'
}

async function paypalAccessToken(env: Bindings): Promise<string> {
  const auth = btoa(`${env.PAYPAL_CLIENT_ID}:${env.PAYPAL_SECRET}`)
  const res = await fetch(`${paypalBase(env)}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  })
  if (!res.ok) throw new Error(`PayPal auth failed: ${res.status}`)
  const data = await res.json() as { access_token: string }
  return data.access_token
}

function xafToEur(amountXaf: number, env: Bindings): string {
  const rate = parseFloat(env.PAYPAL_XAF_TO_EUR || '0.00152')
  return (amountXaf * rate).toFixed(2)
}

app.get('/config', (c) => {
  return c.json({
    client_id: c.env.PAYPAL_CLIENT_ID || null,
    env: c.env.PAYPAL_ENV || 'sandbox',
    currency: 'EUR',
    xaf_to_eur: parseFloat(c.env.PAYPAL_XAF_TO_EUR || '0.00152'),
  })
})

app.post('/create-order', async (c) => {
  const body = await c.req.json<{
    entity_type: string
    entity_id: string
    amount: number
    name: string
    email: string
    phone?: string
  }>()

  if (!body.entity_type || !body.entity_id || !body.amount || !body.name || !body.email) {
    return c.json({ error: 'Champs obligatoires manquants' }, 400)
  }

  if (!c.env.PAYPAL_CLIENT_ID || !c.env.PAYPAL_SECRET) {
    return c.json({ error: 'PayPal non configuré côté serveur' }, 500)
  }

  const eurAmount = xafToEur(body.amount, c.env)

  const token = await paypalAccessToken(c.env)
  const orderRes = await fetch(`${paypalBase(c.env)}/v2/checkout/orders`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      intent: 'CAPTURE',
      purchase_units: [{
        reference_id: `${body.entity_type}-${body.entity_id}`,
        amount: { currency_code: 'EUR', value: eurAmount },
      }],
    }),
  })

  const orderData = await orderRes.json() as any
  if (!orderRes.ok || !orderData.id) {
    return c.json({ error: orderData?.message ?? 'PayPal create order failed' }, 500)
  }

  const { Payments } = createModels(c.env.DB)
  const payment = await Payments.create({
    entity_type: body.entity_type,
    entity_id: body.entity_id,
    amount: body.amount,
    currency: 'XAF',
    status: 'pending',
    payment_method_id: null,
    reference: `PAYPAL-${Date.now()}`,
    paypal_order_id: orderData.id,
    created_at: new Date().toISOString(),
  })

  return c.json({ order_id: orderData.id, payment_id: payment.id, eur_amount: eurAmount })
})

app.post('/capture-order', async (c) => {
  const body = await c.req.json<{ order_id: string }>()
  if (!body.order_id) return c.json({ error: 'order_id manquant' }, 400)

  if (!c.env.PAYPAL_CLIENT_ID || !c.env.PAYPAL_SECRET) {
    return c.json({ error: 'PayPal non configuré côté serveur' }, 500)
  }

  const token = await paypalAccessToken(c.env)
  const captureRes = await fetch(`${paypalBase(c.env)}/v2/checkout/orders/${body.order_id}/capture`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  })

  const captureData = await captureRes.json() as any
  if (!captureRes.ok || captureData?.status !== 'COMPLETED') {
    return c.json({ error: captureData?.message ?? 'PayPal capture failed', details: captureData }, 500)
  }

  const { Payments } = createModels(c.env.DB)
  const matches = await Payments.findAll({ where: { paypal_order_id: body.order_id }, limit: 1 })
  const payment = matches[0]
  if (payment) {
    await Payments.update(payment.id, { status: 'paid' })
  }

  return c.json({
    status: 'paid',
    reference: payment?.reference ?? body.order_id,
    payment_id: payment?.id ?? null,
  })
})

async function verifyWebhookSignature(c: any, rawBody: string, headers: Record<string, string>): Promise<boolean> {
  const webhookId = c.env.PAYPAL_WEBHOOK_ID
  if (!webhookId) return true
  try {
    const token = await paypalAccessToken(c.env)
    const res = await fetch(`${paypalBase(c.env)}/v1/notifications/verify-webhook-signature`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        auth_algo: headers['paypal-auth-algo'],
        cert_url: headers['paypal-cert-url'],
        transmission_id: headers['paypal-transmission-id'],
        transmission_sig: headers['paypal-transmission-sig'],
        transmission_time: headers['paypal-transmission-time'],
        webhook_id: webhookId,
        webhook_event: JSON.parse(rawBody),
      }),
    })
    const data = await res.json() as { verification_status?: string }
    return data.verification_status === 'SUCCESS'
  } catch {
    return false
  }
}

app.post('/webhook', async (c) => {
  const rawBody = await c.req.text()
  const headers: Record<string, string> = {}
  c.req.raw.headers.forEach((v, k) => { headers[k.toLowerCase()] = v })

  const ok = await verifyWebhookSignature(c, rawBody, headers)
  if (!ok) {
    return c.json({ error: 'Signature invalide' }, 401)
  }

  let event: any
  try { event = JSON.parse(rawBody) } catch { return c.json({ error: 'JSON invalide' }, 400) }

  const eventType = String(event?.event_type ?? '')
  const resource = event?.resource ?? {}
  const orderId =
    resource?.supplementary_data?.related_ids?.order_id ??
    (eventType.startsWith('CHECKOUT.ORDER.') ? resource?.id : null)

  if (!orderId) {
    return c.json({ ok: true, ignored: true, event_type: eventType })
  }

  const { Payments } = createModels(c.env.DB)
  const matches = await Payments.findAll({ where: { paypal_order_id: orderId }, limit: 1 })
  const payment = matches[0]
  if (!payment) {
    return c.json({ ok: true, ignored: true, reason: 'payment introuvable', order_id: orderId })
  }

  let newStatus: string | null = null
  if (eventType === 'PAYMENT.CAPTURE.COMPLETED' || eventType === 'CHECKOUT.ORDER.APPROVED') {
    newStatus = 'paid'
  } else if (
    eventType === 'PAYMENT.CAPTURE.DENIED' ||
    eventType === 'PAYMENT.CAPTURE.DECLINED' ||
    eventType === 'PAYMENT.CAPTURE.REVERSED' ||
    eventType === 'CHECKOUT.ORDER.VOIDED'
  ) {
    newStatus = 'failed'
  } else if (eventType === 'PAYMENT.CAPTURE.REFUNDED') {
    newStatus = 'refunded'
  }

  if (newStatus) {
    await Payments.update(payment.id, { status: newStatus })
  }

  return c.json({ ok: true, event_type: eventType, status: newStatus ?? payment.status })
})

export default app
