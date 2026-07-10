ALTER TABLE organizations ADD COLUMN event_source_url TEXT;
ALTER TABLE organizations ADD COLUMN event_parser TEXT;
ALTER TABLE organizations ADD COLUMN event_scraping_enabled INTEGER NOT NULL DEFAULT 0 CHECK (event_scraping_enabled IN (0, 1));

ALTER TABLE events ADD COLUMN source_url TEXT;
ALTER TABLE events ADD COLUMN external_url TEXT;
ALTER TABLE events ADD COLUMN external_id TEXT;
ALTER TABLE events ADD COLUMN scraped_at TEXT;

CREATE UNIQUE INDEX idx_events_external_id ON events(external_id) WHERE external_id IS NOT NULL;
CREATE INDEX idx_events_starts_at ON events(starts_at);

-- Imported posts need a stable author to satisfy the posts foreign key.
INSERT INTO users (id, email, name, site_role, status)
VALUES ('system:event-scraper', 'event-scraper@nhsolidarityecosystem.invalid', 'Event scraper', 'member', 'active');
