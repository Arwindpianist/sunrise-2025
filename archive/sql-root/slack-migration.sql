-- Safe Slack Integration Migration
-- This script handles existing objects gracefully

-- Add slack_webhook_url and slack_channel columns to users table (if not exists)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'users' AND column_name = 'slack_webhook_url') THEN
        ALTER TABLE users ADD COLUMN slack_webhook_url TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'users' AND column_name = 'slack_channel') THEN
        ALTER TABLE users ADD COLUMN slack_channel TEXT;
    END IF;
END $$;

-- Create slack_logs table (if not exists)
CREATE TABLE IF NOT EXISTS slack_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    webhook_url TEXT NOT NULL,
    channel TEXT,
    message_content TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'sent',
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes (if not exist)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_slack_logs_user_id') THEN
        CREATE INDEX idx_slack_logs_user_id ON slack_logs(user_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_slack_logs_created_at') THEN
        CREATE INDEX idx_slack_logs_created_at ON slack_logs(created_at);
    END IF;
END $$;

-- Enable RLS (if not already enabled)
ALTER TABLE slack_logs ENABLE ROW LEVEL SECURITY;

-- Create or replace the function
CREATE OR REPLACE FUNCTION update_slack_logs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger if exists, then create it
DROP TRIGGER IF EXISTS update_slack_logs_updated_at ON slack_logs;
CREATE TRIGGER update_slack_logs_updated_at
    BEFORE UPDATE ON slack_logs
    FOR EACH ROW
    EXECUTE FUNCTION update_slack_logs_updated_at();

-- Create RLS policies (if not exist)
DO $$ 
BEGIN
    -- Policy: Users can only see their own Slack logs
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'slack_logs' AND policyname = 'Users can view own slack logs') THEN
        CREATE POLICY "Users can view own slack logs" ON slack_logs
            FOR SELECT USING (auth.uid() = user_id);
    END IF;
    
    -- Policy: Users can insert their own Slack logs
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'slack_logs' AND policyname = 'Users can insert own slack logs') THEN
        CREATE POLICY "Users can insert own slack logs" ON slack_logs
            FOR INSERT WITH CHECK (auth.uid() = user_id);
    END IF;
    
    -- Policy: Users can update their own Slack logs
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'slack_logs' AND policyname = 'Users can update own slack logs') THEN
        CREATE POLICY "Users can update own slack logs" ON slack_logs
            FOR UPDATE USING (auth.uid() = user_id);
    END IF;
END $$;

-- Add Slack fields to events table (if not exist)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'events' AND column_name = 'slack_template') THEN
        ALTER TABLE events ADD COLUMN slack_template TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'events' AND column_name = 'send_slack') THEN
        ALTER TABLE events ADD COLUMN send_slack BOOLEAN DEFAULT FALSE;
    END IF;
END $$;

-- Verification query
SELECT 
    'Migration completed successfully!' as status,
    (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = 'events' AND column_name IN ('slack_template', 'send_slack')) as events_columns_added,
    (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = 'users' AND column_name IN ('slack_webhook_url', 'slack_channel')) as users_columns_added,
    (SELECT COUNT(*) FROM information_schema.tables WHERE table_name = 'slack_logs') as slack_logs_table_created;
