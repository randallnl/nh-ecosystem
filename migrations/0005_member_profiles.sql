ALTER TABLE users ADD COLUMN profile_title TEXT;
ALTER TABLE users ADD COLUMN pronouns TEXT;
ALTER TABLE users ADD COLUMN bio TEXT;
ALTER TABLE users ADD COLUMN location TEXT;
ALTER TABLE users ADD COLUMN website_url TEXT;
ALTER TABLE users ADD COLUMN profile_visibility TEXT NOT NULL DEFAULT 'members' CHECK (profile_visibility IN ('members', 'hidden'));

CREATE INDEX idx_users_profile_visibility ON users(profile_visibility, name);
