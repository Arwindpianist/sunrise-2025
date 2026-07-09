-- Run once on Neon if these tables were not created during Supabase export.
-- Fixes: contact_categories, contact_category_assignments, onboarding_links (42P01).

-- Per-user named categories (multi-select on contacts)
CREATE TABLE IF NOT EXISTS contact_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name text NOT NULL,
  color text NOT NULL DEFAULT '#6B7280',
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT contact_categories_user_name_unique UNIQUE (user_id, name)
);

CREATE INDEX IF NOT EXISTS idx_contact_categories_user_id ON contact_categories(user_id);

-- Junction: contacts <-> contact_categories
CREATE TABLE IF NOT EXISTS contact_category_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id uuid NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
  category_id uuid NOT NULL REFERENCES contact_categories(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT contact_category_assignments_contact_category_unique UNIQUE (contact_id, category_id)
);

CREATE INDEX IF NOT EXISTS idx_cca_contact_id ON contact_category_assignments(contact_id);
CREATE INDEX IF NOT EXISTS idx_cca_category_id ON contact_category_assignments(category_id);

-- Shareable onboarding links (dashboard contacts)
CREATE TABLE IF NOT EXISTS onboarding_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token text NOT NULL,
  title text,
  description text,
  expires_at timestamptz,
  max_uses integer NOT NULL DEFAULT 100,
  current_uses integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT onboarding_links_token_unique UNIQUE (token)
);

CREATE INDEX IF NOT EXISTS idx_onboarding_links_user_id ON onboarding_links(user_id);
