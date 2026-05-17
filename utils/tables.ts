import { SimpleORM, UUIDModelFactory } from './simpleorm'

// ─── Types ──────────────────────────────────────────────────────────────────

export type Magazine = {
  id: string
  title: string
  subtitle: string | null
  cover: string | null
  description: string | null
  issue_number: number | null
  category: string | null
  published_at: string | null
  featured: number
  price: number | null
  pdf_file: string | null
  pdf_preview: string | null
  preview_start_page: number | null
  pages: number | null
  created_at: string
  updated_at: string
}

export type Audio = {
  id: string
  title: string
  artist: string | null
  cover: string | null
  audio_file: string | null
  description: string | null
  genre: string | null
  duration: number | null
  published_at: string | null
  featured: number
  price: number | null
  free: number
  album: string | null
  album_id: string | null
  lyrics: string | null
  waveform: string | null
  preview_start: number | null
  preview_end: number | null
  created_at: string
  updated_at: string
}

export type Video = {
  id: string
  title: string
  thumbnail: string | null
  video_url: string | null
  video_file: string | null
  description: string | null
  category: string | null
  duration: number | null
  published_at: string | null
  featured: number
  free: number
  created_at: string
  updated_at: string
}

export type HeroSection = {
  id: string
  page: string
  title: string
  subtitle: string | null
  image_desktop: string | null
  image_tablet: string | null
  image_mobile: string | null
  cta_label: string | null
  cta_url: string | null
  active: number
  display_order: number
  created_at: string
  updated_at: string
}

export type MediaFile = {
  id: string
  key: string
  filename: string
  content_type: string
  size: number
  folder: string
  created_at: string
}

export type ActivityLog = {
  id: string
  action: string
  entity_type: string
  entity_id: string | null
  entity_name: string | null
  entity_image: string | null
  created_at: string
}

export type User = {
  id: string
  name: string
  email: string
  role: string
  active: number
  created_at: string
  updated_at: string
}

export type Newsletter = {
  id: string
  email: string
  name: string | null
  active: number
  subscribed_at: string
}

export type PaymentMethod = {
  id: string
  name: string
  type: string
  active: number
  created_at: string
}

export type Album = {
  id: string
  title: string
  artist: string | null
  cover: string | null
  description: string | null
  genre: string | null
  published_at: string | null
  featured: number
  price: number | null
  free: number
  created_at: string
  updated_at: string
}

export type AlbumTrack = {
  id: string
  album_id: string
  audio_id: string
  track_order: number
}

export type Payment = {
  id: string
  user_id: string | null
  entity_type: string | null
  entity_id: string | null
  amount: number
  currency: string
  status: string
  payment_method_id: string | null
  reference: string | null
  created_at: string
}

// ─── Schémas SQL ─────────────────────────────────────────────────────────────

const magazineSchema = {
  id: 'TEXT PRIMARY KEY',
  title: 'TEXT NOT NULL',
  subtitle: 'TEXT',
  cover: 'TEXT',
  description: 'TEXT',
  issue_number: 'INTEGER',
  category: 'TEXT',
  published_at: 'TEXT',
  featured: 'INTEGER NOT NULL',
  price: 'REAL',
  pdf_file: 'TEXT',
  pdf_preview: 'TEXT',
  preview_start_page: 'INTEGER',
  pages: 'INTEGER',
  created_at: 'DATETIME NOT NULL',
  updated_at: 'DATETIME NOT NULL',
}

const audioSchema = {
  id: 'TEXT PRIMARY KEY',
  title: 'TEXT NOT NULL',
  artist: 'TEXT',
  cover: 'TEXT',
  audio_file: 'TEXT',
  description: 'TEXT',
  genre: 'TEXT',
  duration: 'INTEGER',
  published_at: 'TEXT',
  featured: 'INTEGER NOT NULL',
  price: 'REAL',
  free: 'INTEGER NOT NULL',
  album: 'TEXT',
  album_id: 'TEXT',
  lyrics: 'TEXT',
  waveform: 'TEXT',
  preview_start: 'REAL',
  preview_end: 'REAL',
  created_at: 'DATETIME NOT NULL',
  updated_at: 'DATETIME NOT NULL',
}

const videoSchema = {
  id: 'TEXT PRIMARY KEY',
  title: 'TEXT NOT NULL',
  thumbnail: 'TEXT',
  video_url: 'TEXT',
  video_file: 'TEXT',
  description: 'TEXT',
  category: 'TEXT',
  duration: 'INTEGER',
  published_at: 'TEXT',
  featured: 'INTEGER NOT NULL',
  free: 'INTEGER NOT NULL',
  created_at: 'DATETIME NOT NULL',
  updated_at: 'DATETIME NOT NULL',
}

const heroSchema = {
  id: 'TEXT PRIMARY KEY',
  page: 'TEXT NOT NULL',
  title: 'TEXT NOT NULL',
  subtitle: 'TEXT',
  image_desktop: 'TEXT',
  image_tablet: 'TEXT',
  image_mobile: 'TEXT',
  cta_label: 'TEXT',
  cta_url: 'TEXT',
  active: 'INTEGER NOT NULL',
  display_order: 'INTEGER NOT NULL',
  created_at: 'DATETIME NOT NULL',
  updated_at: 'DATETIME NOT NULL',
}

const mediaSchema = {
  id: 'TEXT PRIMARY KEY',
  key: 'TEXT NOT NULL',
  filename: 'TEXT NOT NULL',
  content_type: 'TEXT NOT NULL',
  size: 'INTEGER NOT NULL',
  folder: 'TEXT NOT NULL',
  created_at: 'DATETIME NOT NULL',
}

const activitySchema = {
  id: 'TEXT PRIMARY KEY',
  action: 'TEXT NOT NULL',
  entity_type: 'TEXT NOT NULL',
  entity_id: 'TEXT',
  entity_name: 'TEXT',
  entity_image: 'TEXT',
  created_at: 'DATETIME NOT NULL',
}

const userSchema = {
  id: 'TEXT PRIMARY KEY',
  name: 'TEXT NOT NULL',
  email: 'TEXT NOT NULL',
  role: 'TEXT NOT NULL',
  active: 'INTEGER NOT NULL',
  created_at: 'DATETIME NOT NULL',
  updated_at: 'DATETIME NOT NULL',
}

const newsletterSchema = {
  id: 'TEXT PRIMARY KEY',
  email: 'TEXT NOT NULL',
  name: 'TEXT',
  active: 'INTEGER NOT NULL',
  subscribed_at: 'DATETIME NOT NULL',
}

const paymentMethodSchema = {
  id: 'TEXT PRIMARY KEY',
  name: 'TEXT NOT NULL',
  type: 'TEXT NOT NULL',
  active: 'INTEGER NOT NULL',
  created_at: 'DATETIME NOT NULL',
}

const albumSchema = {
  id:           'TEXT PRIMARY KEY',
  title:        'TEXT NOT NULL',
  artist:       'TEXT',
  cover:        'TEXT',
  description:  'TEXT',
  genre:        'TEXT',
  published_at: 'TEXT',
  featured:     'INTEGER NOT NULL',
  price:        'REAL',
  free:         'INTEGER NOT NULL',
  created_at:   'DATETIME NOT NULL',
  updated_at:   'DATETIME NOT NULL',
}

const albumTrackSchema = {
  id:          'TEXT PRIMARY KEY',
  album_id:    'TEXT NOT NULL',
  audio_id:    'TEXT NOT NULL',
  track_order: 'INTEGER NOT NULL',
}

const paymentSchema = {
  id: 'TEXT PRIMARY KEY',
  user_id: 'TEXT',
  entity_type: 'TEXT',
  entity_id: 'TEXT',
  amount: 'REAL NOT NULL',
  currency: 'TEXT NOT NULL',
  status: 'TEXT NOT NULL',
  payment_method_id: 'TEXT',
  reference: 'TEXT',
  created_at: 'DATETIME NOT NULL',
}

// ─── Factory ─────────────────────────────────────────────────────────────────

export function createModels(db: D1Database) {
  const orm = new SimpleORM(db)
  const factory = new UUIDModelFactory(orm)

  return {
    orm,
    Magazines:      factory.createUUIDModel<Magazine>('magazines', magazineSchema as any),
    Audios:         factory.createUUIDModel<Audio>('audios', audioSchema as any),
    Videos:         factory.createUUIDModel<Video>('videos', videoSchema as any),
    HeroSections:   factory.createUUIDModel<HeroSection>('hero_sections', heroSchema as any),
    MediaFiles:     factory.createUUIDModel<MediaFile>('media_files', mediaSchema as any),
    ActivityLogs:   factory.createUUIDModel<ActivityLog>('activity_log', activitySchema as any),
    Users:          factory.createUUIDModel<User>('users', userSchema as any),
    Newsletters:    factory.createUUIDModel<Newsletter>('newsletter', newsletterSchema as any),
    PaymentMethods: factory.createUUIDModel<PaymentMethod>('payment_methods', paymentMethodSchema as any),
    Payments:       factory.createUUIDModel<Payment>('payments', paymentSchema as any),
    Albums:         factory.createUUIDModel<Album>('albums', albumSchema as any),
    AlbumTracks:    factory.createUUIDModel<AlbumTrack>('album_tracks', albumTrackSchema as any),
  }
}

// ─── Initialisation des tables ────────────────────────────────────────────────

export async function initDatabase(db: D1Database): Promise<void> {
  const models = createModels(db)

  await models.Magazines.createTable()
  await models.Audios.createTable()
  await models.Videos.createTable()
  await models.HeroSections.createTable()
  await models.MediaFiles.createTable()
  await models.ActivityLogs.createTable()
  await models.Users.createTable()
  await models.Newsletters.createTable()
  await models.PaymentMethods.createTable()
  await models.Payments.createTable()
  await models.Albums.createTable()
  await models.AlbumTracks.createTable()

  // Migrations: colonnes ajoutées après la création initiale des tables
  await models.orm.addColumnIfNotExists('audios', 'waveform', 'TEXT')
  await models.orm.addColumnIfNotExists('audios', 'preview_start', 'REAL')
  await models.orm.addColumnIfNotExists('audios', 'preview_end', 'REAL')
  await models.orm.addColumnIfNotExists('magazines', 'preview_start_page', 'INTEGER')
}
