import { Hono } from 'hono'
import { cors } from 'hono/cors'
import media from './routes/media'
import magazines from './routes/magazines'
import ebooks from './routes/ebooks'
import audios from './routes/audios'
import videos from './routes/videos'
import hero from './routes/hero'
import bigHero from './routes/big-hero'
import albums from './routes/albums'
import payments from './routes/payments'
import paypal from './routes/paypal'
import monetbil from './routes/monetbil'
import admin from './routes/admin/index'
import { initDatabase } from '../utils/tables'

type Bindings = {
  DB: D1Database
  MEDIA: R2Bucket
  CACHE: KVNamespace
  ADMIN_SECRET: string
  PAYPAL_CLIENT_ID: string
  PAYPAL_SECRET: string
  PAYPAL_ENV: string
  PAYPAL_XAF_TO_EUR: string
  MONETBIL_SERVICE_KEY: string
  MONETBIL_RETURN_URL: string
  MONETBIL_NOTIFY_URL: string
}

const app = new Hono<{ Bindings: Bindings }>()

app.use('*', cors({ origin: '*' }))

// Initialise toutes les tables une seule fois par instance Worker
let dbReady = false
app.use('*', async (c, next) => {
  if (!dbReady) {
    await initDatabase(c.env.DB)
    dbReady = true
  }
  await next()
})

app.onError((err, c) => {
  console.error('[Hono error]', err.message)
  return c.json({ error: err.message }, 500)
})

app.route('/api/media', media)
app.route('/api/magazines', magazines)
app.route('/api/ebooks', ebooks)
app.route('/api/audios', audios)
app.route('/api/videos', videos)
app.route('/api/hero', hero)
app.route('/api/big-hero', bigHero)
app.route('/api/albums', albums)
app.route('/api/payments', payments)
app.route('/api/paypal', paypal)
app.route('/api/monetbil', monetbil)
app.route('/admin', admin)

app.get('/', (c) => c.json({ status: 'ok' }))

export default app
