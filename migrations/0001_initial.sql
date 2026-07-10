PRAGMA foreign_keys = ON;

CREATE TABLE users (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  name TEXT,
  avatar_object_key TEXT,
  site_role TEXT NOT NULL DEFAULT 'member' CHECK (site_role IN ('member', 'site_admin')),
  status TEXT NOT NULL DEFAULT 'invited' CHECK (status IN ('invited', 'active', 'suspended')),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  last_seen_at TEXT
);

CREATE TABLE sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  revoked_at TEXT
);

CREATE TABLE organizations (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  summary TEXT,
  description TEXT,
  website_url TEXT,
  contact_email TEXT,
  logo_object_key TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'archived')),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE organization_memberships (
  organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'viewer' CHECK (role IN ('viewer', 'contributor', 'org_admin')),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (organization_id, user_id)
);

CREATE TABLE invitations (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL,
  organization_id TEXT REFERENCES organizations(id) ON DELETE SET NULL,
  invited_role TEXT NOT NULL DEFAULT 'viewer' CHECK (invited_role IN ('viewer', 'contributor', 'org_admin')),
  token_hash TEXT NOT NULL UNIQUE,
  invited_by_user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  expires_at TEXT NOT NULL,
  accepted_at TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE posts (
  id TEXT PRIMARY KEY,
  organization_id TEXT REFERENCES organizations(id) ON DELETE SET NULL,
  author_user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  section TEXT NOT NULL CHECK (section IN ('legislation', 'event', 'project', 'update')),
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  visibility TEXT NOT NULL DEFAULT 'members' CHECK (visibility IN ('members', 'organization')),
  status TEXT NOT NULL DEFAULT 'published' CHECK (status IN ('draft', 'published', 'archived')),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  archived_at TEXT
);

CREATE TABLE post_tags (
  post_id TEXT NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  tag TEXT NOT NULL,
  PRIMARY KEY (post_id, tag)
);

CREATE TABLE comments (
  id TEXT PRIMARY KEY,
  post_id TEXT NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  parent_comment_id TEXT REFERENCES comments(id) ON DELETE CASCADE,
  author_user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  body TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'published' CHECK (status IN ('published', 'hidden', 'archived')),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE events (
  post_id TEXT PRIMARY KEY REFERENCES posts(id) ON DELETE CASCADE,
  starts_at TEXT NOT NULL,
  ends_at TEXT,
  location_name TEXT,
  location_url TEXT,
  registration_url TEXT
);

CREATE TABLE projects (
  post_id TEXT PRIMARY KEY REFERENCES posts(id) ON DELETE CASCADE,
  project_status TEXT NOT NULL DEFAULT 'planning' CHECK (project_status IN ('planning', 'active', 'paused', 'completed')),
  lead_organization_id TEXT REFERENCES organizations(id) ON DELETE SET NULL,
  target_date TEXT
);

CREATE TABLE attachments (
  id TEXT PRIMARY KEY,
  post_id TEXT REFERENCES posts(id) ON DELETE CASCADE,
  comment_id TEXT REFERENCES comments(id) ON DELETE CASCADE,
  uploaded_by_user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  object_key TEXT NOT NULL UNIQUE,
  filename TEXT NOT NULL,
  content_type TEXT NOT NULL,
  byte_size INTEGER NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CHECK (
    (post_id IS NOT NULL AND comment_id IS NULL)
    OR (post_id IS NULL AND comment_id IS NOT NULL)
  )
);

CREATE TABLE audit_log (
  id TEXT PRIMARY KEY,
  actor_user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  metadata_json TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_sessions_user_id ON sessions(user_id);
CREATE INDEX idx_sessions_expires_at ON sessions(expires_at);
CREATE INDEX idx_memberships_user_id ON organization_memberships(user_id);
CREATE INDEX idx_posts_section_created_at ON posts(section, created_at DESC);
CREATE INDEX idx_posts_organization_id ON posts(organization_id);
CREATE INDEX idx_comments_post_id_created_at ON comments(post_id, created_at);
CREATE INDEX idx_attachments_post_id ON attachments(post_id);
CREATE INDEX idx_audit_log_entity ON audit_log(entity_type, entity_id);
