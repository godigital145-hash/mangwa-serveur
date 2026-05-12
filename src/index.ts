import { Hono } from 'hono'
import { cors } from 'hono/cors'
import media from './routes/media'
import magazines from './routes/magazines'
import audios from './routes/audios'
import videos from './routes/videos'
import hero from './routes/hero'
import albums from './routes/albums'
import payments from './routes/payments'
import admin from './routes/admin/index'
import { initDatabase } from '../utils/tables'

type Bindings = {
  DB: D1Database
  MEDIA: R2Bucket
  CACHE: KVNamespace
  ADMIN_SECRET: string
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
app.route('/api/audios', audios)
app.route('/api/videos', videos)
app.route('/api/hero', hero)
app.route('/api/albums', albums)
app.route('/api/payments', payments)
app.route('/admin', admin)

app.get('/', (c) => c.json({ status: 'ok' }))

export default app
