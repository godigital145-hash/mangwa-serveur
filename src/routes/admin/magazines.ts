import { Hono } from 'hono'
import { logActivity } from '../../lib/activity'
import { createModels, type Magazine } from '../../../utils/tables'

type Bindings = { DB: D1Database }

const app = new Hono<{ Bindings: Bindings }>()

app.post('/', async (c) => {
  const { Magazines } = createModels(c.env.DB)
  const form      = await c.req.formData()
  const title     = form.get('title') as string
  const coverKey  = (form.get('cover') as string) || null
  const pdfKey    = (form.get('pdf_file') as string) || null
  const previewKey = (form.get('pdf_preview') as string) || null
  const now       = new Date().toISOString()

  const created = await Magazines.create({
    title,
    subtitle:            (form.get('subtitle') as string) || null,
    cover:               coverKey,
    description:         (form.get('description') as string) || null,
    issue_number:        form.get('issue_number') ? Number(form.get('issue_number')) : null,
    category:            (form.get('category') as string) || null,
    published_at:        (form.get('published_at') as string) || null,
    featured:            form.get('featured') === 'true' ? 1 : 0,
    price:               form.get('price') ? Number(form.get('price')) : null,
    pdf_file:            pdfKey,
    pdf_preview:         previewKey,
    preview_start_page:  form.get('preview_start_page') ? Number(form.get('preview_start_page')) : null,
    pages:               form.get('pages') ? Number(form.get('pages')) : null,
    created_at:          now,
    updated_at:          now,
  })

  await logActivity(c.env.DB, 'create', 'magazine', created.id, title, coverKey)
  return c.json({ id: created.id }, 201)
})

app.put('/:id', async (c) => {
  const { Magazines } = createModels(c.env.DB)
  const id        = c.req.param('id')
  const form      = await c.req.formData()
  const title     = form.get('title') as string
  const coverKey  = (form.get('cover') as string) || null
  const pdfKey    = (form.get('pdf_file') as string) || null
  const previewKey = (form.get('pdf_preview') as string) || null

  const data: Partial<Magazine> = {
    title,
    subtitle:     (form.get('subtitle') as string) || null,
    description:  (form.get('description') as string) || null,
    issue_number: form.get('issue_number') ? Number(form.get('issue_number')) : null,
    category:     (form.get('category') as string) || null,
    published_at: (form.get('published_at') as string) || null,
    featured:     form.get('featured') === 'true' ? 1 : 0,
    price:        form.get('price') ? Number(form.get('price')) : null,
    pages:        form.get('pages') ? Number(form.get('pages')) : null,
    updated_at:   new Date().toISOString(),
  }
  if (coverKey !== null)   data.cover              = coverKey
  if (pdfKey !== null)     data.pdf_file           = pdfKey
  if (previewKey !== null) data.pdf_preview        = previewKey
  data.preview_start_page = form.get('preview_start_page') ? Number(form.get('preview_start_page')) : null

  await Magazines.update(id, data)
  await logActivity(c.env.DB, 'update', 'magazine', id, title, coverKey)
  return c.json({ success: true })
})

app.delete('/:id', async (c) => {
  const { Magazines } = createModels(c.env.DB)
  const id     = c.req.param('id')
  const entity = await Magazines.findById(id)
  await Magazines.delete(id)
  await logActivity(c.env.DB, 'delete', 'magazine', id, entity?.title ?? null, entity?.cover ?? null)
  return c.json({ success: true })
})

export default app
