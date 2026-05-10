CREATE TABLE IF NOT EXISTS albums (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  title        TEXT NOT NULL,
  artist       TEXT,
  cover        TEXT,
  description  TEXT,
  genre        TEXT,
  published_at TEXT,
  featured     INTEGER NOT NULL DEFAULT 0,
  price        REAL,
  free         INTEGER NOT NULL DEFAULT 1,
  created_at   DATETIME NOT NULL,
  updated_at   DATETIME NOT NULL
);

CREATE TABLE IF NOT EXISTS album_tracks (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  album_id    INTEGER NOT NULL REFERENCES albums(id) ON DELETE CASCADE,
  audio_id    INTEGER NOT NULL REFERENCES audios(id) ON DELETE CASCADE,
  track_order INTEGER NOT NULL DEFAULT 0,
  UNIQUE(album_id, audio_id)
);
