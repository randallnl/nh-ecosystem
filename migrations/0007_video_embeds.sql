CREATE TABLE video_embeds (
  post_id TEXT PRIMARY KEY REFERENCES posts(id) ON DELETE CASCADE,
  provider TEXT NOT NULL CHECK (provider IN ('tiktok')),
  source_url TEXT NOT NULL,
  video_id TEXT,
  title TEXT,
  author_name TEXT,
  author_url TEXT,
  thumbnail_url TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_video_embeds_provider_created_at ON video_embeds(provider, created_at DESC);
