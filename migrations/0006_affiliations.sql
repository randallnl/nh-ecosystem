CREATE TABLE affiliations (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE organization_affiliations (
  organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  affiliation_id TEXT NOT NULL REFERENCES affiliations(id) ON DELETE CASCADE,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (organization_id, affiliation_id)
);

CREATE TABLE user_affiliations (
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  affiliation_id TEXT NOT NULL REFERENCES affiliations(id) ON DELETE CASCADE,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, affiliation_id)
);

INSERT INTO affiliations (id, name, slug) VALUES
  ('affiliation:progressive-legislative-coalition', 'Progressive Legislative Coalition', 'progressive-legislative-coalition'),
  ('affiliation:nh-progressive-power-convening', 'NH Progressive Power Convening', 'nh-progressive-power-convening'),
  ('affiliation:nh-queer-consortium', 'NH Queer Consortium', 'nh-queer-consortium');

CREATE INDEX idx_organization_affiliations_affiliation_id ON organization_affiliations(affiliation_id);
CREATE INDEX idx_user_affiliations_affiliation_id ON user_affiliations(affiliation_id);
