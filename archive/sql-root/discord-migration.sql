-- Discord Integration Migration
-- Add Discord webhook URL field to users table

-- Add discord_webhook_url column to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS discord_webhook_url TEXT;

-- Create discord_logs table for tracking Discord messages
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

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_discord_logs_user_id ON discord_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_discord_logs_created_at ON discord_logs(created_at);

-- Add RLS policies for discord_logs table
ALTER TABLE discord_logs ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own Discord logs
CREATE POLICY "Users can view own discord logs" ON discord_logs
    FOR SELECT USING (auth.uid() = user_id);

-- Policy: Users can insert their own Discord logs
CREATE POLICY "Users can insert own discord logs" ON discord_logs
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own Discord logs
CREATE POLICY "Users can update own discord logs" ON discord_logs
    FOR UPDATE USING (auth.uid() = user_id);

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_discord_logs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_discord_logs_updated_at
    BEFORE UPDATE ON discord_logs
    FOR EACH ROW
    EXECUTE FUNCTION update_discord_logs_updated_at();

-- Add Discord fields to events table
ALTER TABLE events ADD COLUMN IF NOT EXISTS discord_template TEXT;
ALTER TABLE events ADD COLUMN IF NOT EXISTS send_discord BOOLEAN DEFAULT FALSE;

-- Update types/supabase.ts to include new fields
-- Note: This is a reminder to update the TypeScript types 
