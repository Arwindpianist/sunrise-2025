-- Safe Discord Integration Migration
-- This script handles existing objects gracefully

-- Add discord_webhook_url column to users table (if not exists)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'users' AND column_name = 'discord_webhook_url') THEN
        ALTER TABLE users ADD COLUMN discord_webhook_url TEXT;
    END IF;
END $$;

-- Create discord_logs table (if not exists)
CREATE TABLE IF NOT EXISTS discord_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    webhook_url TEXT NOT NULL,
    message_content TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'sent',
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes (if not exist)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_discord_logs_user_id') THEN
        CREATE INDEX idx_discord_logs_user_id ON discord_logs(user_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_discord_logs_created_at') THEN
        CREATE INDEX idx_discord_logs_created_at ON discord_logs(created_at);
    END IF;
END $$;

-- Enable RLS (if not already enabled)
ALTER TABLE discord_logs ENABLE ROW LEVEL SECURITY;

-- Create or replace the function
CREATE OR REPLACE FUNCTION update_discord_logs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger if exists, then create it
DROP TRIGGER IF EXISTS update_discord_logs_updated_at ON discord_logs;
CREATE TRIGGER update_discord_logs_updated_at
    BEFORE UPDATE ON discord_logs
    FOR EACH ROW
    EXECUTE FUNCTION update_discord_logs_updated_at();

-- Create RLS policies (if not exist)
DO $$ 
BEGIN
    -- Policy: Users can only see their own Discord logs
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'discord_logs' AND policyname = 'Users can view own discord logs') THEN
        CREATE POLICY "Users can view own discord logs" ON discord_logs
            FOR SELECT USING (auth.uid() = user_id);
    END IF;
    
    -- Policy: Users can insert their own Discord logs
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'discord_logs' AND policyname = 'Users can insert own discord logs') THEN
        CREATE POLICY "Users can insert own discord logs" ON discord_logs
            FOR INSERT WITH CHECK (auth.uid() = user_id);
    END IF;
    
    -- Policy: Users can update their own Discord logs
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'discord_logs' AND policyname = 'Users can update own discord logs') THEN
        CREATE POLICY "Users can update own discord logs" ON discord_logs
            FOR UPDATE USING (auth.uid() = user_id);
    END IF;
END $$;

-- Add Discord fields to events table (if not exist)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'events' AND column_name = 'discord_template') THEN
        ALTER TABLE events ADD COLUMN discord_template TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'events' AND column_name = 'send_discord') THEN
        ALTER TABLE events ADD COLUMN send_discord BOOLEAN DEFAULT FALSE;
    END IF;
END $$;

-- Verification query
SELECT 
    'Migration completed successfully!' as status,
    (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = 'events' AND column_name IN ('discord_template', 'send_discord')) as events_columns_added,
    (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'discord_webhook_url') as users_columns_added,
    (SELECT COUNT(*) FROM information_schema.tables WHERE table_name = 'discord_logs') as discord_logs_table_created;
