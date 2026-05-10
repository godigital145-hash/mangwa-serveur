import { Hono } from 'hono'
import { logActivity } from '../../lib/activity'
import { createModels, type HeroSection } from '../../../utils/tables'

type Bindings = { DB: D1Database }

const app = new Hono<{ Bindings: Bindings }>()

app.post('/', async (c) => {
  const { HeroSections } = createModels(c.env.DB)
  const form  = await c.req.formData()
  const title = form.get('title') as string
  const desktopKey = (form.get('image_desktop') as string) || null
  const tabletKey  = (form.get('image_tablet')  as string) || null
  const mobileKey  = (form.get('image_mobile')  as string) || null
  const now   = new Date().toISOString()

  const created = await HeroSections.create({
    page:          (form.get('page') as string) || '',
    title,
    subtitle:      (form.get('subtitle') as string) || null,
    image_desktop: desktopKey,
    image_tablet:  tabletKey,
    image_mobile:  mobileKey,
    cta_label:     (form.get('cta_label') as string) || null,
    cta_url:       (form.get('cta_url')   as string) || null,
    active:        form.get('active') === 'false' ? 0 : 1,
    display_order: form.get('display_order') ? Number(form.get('display_order')) : 0,
    created_at:    now,
    updated_at:    now,
  })

  await logActivity(c.env.DB, 'create', 'hero', created.id, title, desktopKey)
  return c.json({ id: created.id }, 201)
})

app.put('/:id', async (c) => {
  const { HeroSections } = createModels(c.env.DB)
  const id    = c.req.param('id')
  const form  = await c.req.formData()
  const title = form.get('title') as string
  const desktopKey = (form.get('image_desktop') as string) || null
  const tabletKey  = (form.get('image_tablet')  as string) || null
  const mobileKey  = (form.get('image_mobile')  as string) || null

  const data: Partial<HeroSection> = {
    page:          (form.get('page') as string) || '',
    title,
    subtitle:      (form.get('subtitle') as string) || null,
    cta_label:     (form.get('cta_label') as string) || null,
    cta_url:       (form.get('cta_url')   as string) || null,
    active:        form.get('active') === 'false' ? 0 : 1,
    display_order: form.get('display_order') ? Number(form.get('display_order')) : 0,
    updated_at:    new Date().toISOString(),
  }
  if (desktopKey !== null) data.image_desktop = desktopKey
  if (tabletKey  !== null) data.image_tablet  = tabletKey
  if (mobileKey  !== null) data.image_mobile  = mobileKey

  await HeroSections.update(id, data)
  await logActivity(c.env.DB, 'update', 'hero', id, title, desktopKey)
  return c.json({ success: true })
})

app.delete('/:id', async (c) => {
  const { HeroSections } = createModels(c.env.DB)
  const id     = c.req.param('id')
  const entity = await HeroSections.findById(id)
  await HeroSections.delete(id)
  await logActivity(c.env.DB, 'delete', 'hero', id, entity?.title ?? null, entity?.image_desktop ?? null)
  return c.json({ success: true })
})

export default app
