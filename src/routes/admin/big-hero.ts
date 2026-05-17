import { Hono } from 'hono'
import { createModels, type BigHeroSlide } from '../../../utils/tables'

type Bindings = { DB: D1Database }

const app = new Hono<{ Bindings: Bindings }>()

app.get('/', async (c) => {
  const { BigHeroSlides } = createModels(c.env.DB)
  const rows = await BigHeroSlides.findAll()
  return c.json(rows.sort((a, b) => a.slide_order - b.slide_order))
})

app.post('/', async (c) => {
  const { BigHeroSlides } = createModels(c.env.DB)
  const form = await c.req.formData()
  const now  = new Date().toISOString()

  const created = await BigHeroSlides.create({
    title:         (form.get('title') as string) || '',
    cta_label:     (form.get('cta_label') as string) || null,
    cta_url:       (form.get('cta_url') as string) || null,
    image_desktop: (form.get('image_desktop') as string) || null,
    image_mobile:  (form.get('image_mobile') as string) || null,
    slide_order:   form.get('slide_order') ? Number(form.get('slide_order')) : 0,
    active:        form.get('active') === 'false' ? 0 : 1,
    created_at:    now,
    updated_at:    now,
  })

  return c.json({ id: created.id }, 201)
})

app.put('/:id', async (c) => {
  const { BigHeroSlides } = createModels(c.env.DB)
  const id   = c.req.param('id')
  const form = await c.req.formData()
  const desktopKey = (form.get('image_desktop') as string) || null
  const mobileKey  = (form.get('image_mobile') as string) || null

  const data: Partial<BigHeroSlide> = {
    title:       (form.get('title') as string) || '',
    cta_label:   (form.get('cta_label') as string) || null,
    cta_url:     (form.get('cta_url') as string) || null,
    slide_order: form.get('slide_order') ? Number(form.get('slide_order')) : 0,
    active:      form.get('active') === 'false' ? 0 : 1,
    updated_at:  new Date().toISOString(),
  }
  if (desktopKey !== null) data.image_desktop = desktopKey
  if (mobileKey  !== null) data.image_mobile  = mobileKey

  await BigHeroSlides.update(id, data)
  return c.json({ success: true })
})

app.delete('/:id', async (c) => {
  const { BigHeroSlides } = createModels(c.env.DB)
  await BigHeroSlides.delete(c.req.param('id'))
  return c.json({ success: true })
})

export default app
