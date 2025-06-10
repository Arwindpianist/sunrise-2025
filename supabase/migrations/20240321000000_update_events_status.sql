-- Update the events table to support new status values and metadata
ALTER TABLE events
  DROP CONSTRAINT IF EXISTS events_status_check,
  ADD CONSTRAINT events_status_check 
    CHECK (status IN ('draft', 'scheduled', 'sending', 'sent', 'failed', 'partial', 'cancelled')),
  ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

-- Update existing events to have empty metadata
UPDATE events SET metadata = '{}'::jsonb WHERE metadata IS NULL;

-- Add an index on the metadata column for better query performance
CREATE INDEX IF NOT EXISTS events_metadata_idx ON events USING gin (metadata); 