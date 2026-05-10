import { Hono } from 'hono'
import { adminAuth } from '../../middleware/auth'
import magazines from './magazines'
import audios from './audios'
import videos from './videos'
import hero from './hero'
import media from './media'
import activity from './activity'
import users from './users'
import newsletter from './newsletter'
import paymentMethods from './payment-methods'
import payments from './payments'
import albums from './albums'

type Bindings = { DB: D1Database; MEDIA: R2Bucket; ADMIN_SECRET: string }

const admin = new Hono<{ Bindings: Bindings }>()

admin.use('*', adminAuth)

admin.route('/magazines', magazines)
admin.route('/audios', audios)
admin.route('/videos', videos)
admin.route('/hero', hero)
admin.route('/media', media)
admin.route('/activity', activity)
admin.route('/users', users)
admin.route('/newsletter', newsletter)
admin.route('/payment-methods', paymentMethods)
admin.route('/payments', payments)
admin.route('/albums', albums)

export default admin
