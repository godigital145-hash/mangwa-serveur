import { SimpleORM } from '../../utils/simpleorm'

export async function logActivity(
  db: D1Database,
  action: 'create' | 'update' | 'delete',
  entityType: string,
  entityId: string | null,
  entityName: string | null,
  entityImage: string | null,
) {
  try {
    const orm = new SimpleORM(db)
    await orm.run(
      `INSERT INTO activity_log (action, entity_type, entity_id, entity_name, entity_image, created_at)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [action, entityType, entityId, entityName, entityImage, new Date().toISOString()],
    )
  } catch (_) {}
}
