import type { Context, Next } from 'hono'

type Bindings = { ADMIN_SECRET: string }

const ADMIN_PASSWORD = "admin1234";

export async function adminAuth(c: Context<{ Bindings: Bindings }>, next: Next) {
  const auth = c.req.header('Authorization')
  const secret = ADMIN_PASSWORD

  if (!secret) return c.json({ error: 'Serveur mal configuré' }, 500)
  if (!auth || auth !== `Bearer ${secret}`) {
    return c.json({ error: 'Non autorisé' }, 401)
  }

  await next()
}
