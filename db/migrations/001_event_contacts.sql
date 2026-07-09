-- Run once on Neon if `event_contacts` was not migrated from Supabase.
-- Required for send/prepare-dispatch to attach audiences per event.

CREATE TABLE IF NOT EXISTS event_contacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  contact_id uuid NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending',
  sent_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (event_id, contact_id)
);

CREATE INDEX IF NOT EXISTS idx_event_contacts_event_id ON event_contacts(event_id);
CREATE INDEX IF NOT EXISTS idx_event_contacts_contact_id ON event_contacts(contact_id);
