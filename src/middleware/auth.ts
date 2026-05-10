import type { Context, Next } from 'hono'

type Bindings = { ADMIN_SECRET: string }

export async function adminAuth(c: Context<{ Bindings: Bindings }>, next: Next) {
  const auth = c.req.header('Authorization')
  const secret = c.env.ADMIN_SECRET

  if (!secret) return c.json({ error: 'Serveur mal configuré' }, 500)
  if (!auth || auth !== `Bearer ${secret}`) {
    return c.json({ error: 'Non autorisé' }, 401)
  }

  await next()
}
