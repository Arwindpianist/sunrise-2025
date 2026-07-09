-- =====================================================
-- MIGRATION TO UPDATE EXISTING USER_SUBSCRIPTIONS TABLE
-- Sunrise 2025 - Update Existing Subscription Structure
-- =====================================================

-- =====================================================
-- 1. BACKUP EXISTING DATA (OPTIONAL)
-- =====================================================

-- Create a backup of existing subscription data
CREATE TABLE IF NOT EXISTS user_subscriptions_backup AS 
SELECT * FROM public.user_subscriptions;

-- =====================================================
-- 2. ADD MISSING COLUMNS
-- =====================================================

-- Add tier column (rename plan_id to tier)
ALTER TABLE public.user_subscriptions 
ADD COLUMN IF NOT EXISTS tier TEXT;

-- Add total_tokens_purchased column
ALTER TABLE public.user_subscriptions 
ADD COLUMN IF NOT EXISTS total_tokens_purchased INTEGER NOT NULL DEFAULT 0;

-- =====================================================
-- 3. MIGRATE EXISTING DATA
-- =====================================================

-- Update tier column based on existing plan_id values
-- You may need to adjust this mapping based on your existing plan_id values
UPDATE public.user_subscriptions 
SET tier = CASE 
    WHEN plan_id = 'free' OR plan_id IS NULL THEN 'free'
    WHEN plan_id = 'basic' THEN 'basic'
    WHEN plan_id = 'pro' THEN 'pro'
    WHEN plan_id = 'enterprise' THEN 'enterprise'
    ELSE 'free' -- Default fallback
END
WHERE tier IS NULL;

-- =====================================================
-- 4. ADD CONSTRAINTS
-- =====================================================

-- Add check constraint for tier values
ALTER TABLE public.user_subscriptions 
ADD CONSTRAINT check_tier_values 
CHECK (tier IN ('free', 'basic', 'pro', 'enterprise'));

-- Add check constraint for status values
ALTER TABLE public.user_subscriptions 
ADD CONSTRAINT check_status_values 
CHECK (status IN ('inactive', 'active', 'trial', 'cancelled', 'past_due'));

-- =====================================================
-- 5. UPDATE FOREIGN KEY CONSTRAINT
-- =====================================================

-- Make sure user_id has proper foreign key constraint
-- (This should already exist, but let's ensure it)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'user_subscriptions_user_id_fkey'
    ) THEN
        ALTER TABLE public.user_subscriptions 
        ADD CONSTRAINT user_subscriptions_user_id_fkey 
        FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
    END IF;
END $$;

-- =====================================================
-- 6. ADD UNIQUE CONSTRAINT
-- =====================================================

-- Add unique constraint for one active subscription per user
-- Drop existing constraint if it exists
ALTER TABLE public.user_subscriptions 
DROP CONSTRAINT IF EXISTS user_subscriptions_user_id_status_key;

-- Add new unique constraint
ALTER TABLE public.user_subscriptions 
ADD CONSTRAINT user_subscriptions_user_id_status_key 
UNIQUE (user_id, status);

-- =====================================================
-- 7. CREATE INDEXES FOR PERFORMANCE
-- =====================================================

-- Index for user lookups
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_user_id ON public.user_subscriptions(user_id);

-- Index for active subscriptions
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_status ON public.user_subscriptions(status);

-- Index for tier-based queries
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_tier ON public.user_subscriptions(tier);

-- Composite index for common queries
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_user_status ON public.user_subscriptions(user_id, status);

-- Index for period-based queries
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_period ON public.user_subscriptions(current_period_start, current_period_end);

-- =====================================================
-- 8. ENABLE ROW LEVEL SECURITY
-- =====================================================

-- Enable RLS on user_subscriptions table
ALTER TABLE public.user_subscriptions ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own subscriptions" ON public.user_subscriptions;
DROP POLICY IF EXISTS "Users can insert own subscriptions" ON public.user_subscriptions;
DROP POLICY IF EXISTS "Users can update own subscriptions" ON public.user_subscriptions;
DROP POLICY IF EXISTS "Users can delete own subscriptions" ON public.user_subscriptions;

-- Create new RLS policies
CREATE POLICY "Users can view own subscriptions" ON public.user_subscriptions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own subscriptions" ON public.user_subscriptions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own subscriptions" ON public.user_subscriptions
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own subscriptions" ON public.user_subscriptions
    FOR DELETE USING (auth.uid() = user_id);

-- =====================================================
-- 9. CREATE HELPER FUNCTIONS
-- =====================================================

-- Function to get user's current subscription tier
CREATE OR REPLACE FUNCTION get_user_subscription_tier(user_uuid UUID)
RETURNS TEXT AS $$
DECLARE
    user_tier TEXT;
BEGIN
    -- Check for active subscription
    SELECT tier INTO user_tier
    FROM public.user_subscriptions
    WHERE user_id = user_uuid AND status = 'active'
    LIMIT 1;
    
    -- If no active subscription, check trial period
    IF user_tier IS NULL THEN
        -- Check if user is within 30 days of signup (trial period)
        SELECT 
            CASE 
                WHEN EXTRACT(EPOCH FROM (NOW() - created_at)) / 86400 <= 30 
                THEN 'free' 
                ELSE 'free' 
            END INTO user_tier
        FROM auth.users
        WHERE id = user_uuid;
    END IF;
    
    RETURN COALESCE(user_tier, 'free');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user can perform specific actions
CREATE OR REPLACE FUNCTION can_perform_action(user_uuid UUID, action_name TEXT)
RETURNS BOOLEAN AS $$
DECLARE
    user_tier TEXT;
    can_do BOOLEAN := FALSE;
BEGIN
    user_tier := get_user_subscription_tier(user_uuid);
    
    CASE action_name
        WHEN 'telegram' THEN
            can_do := user_tier IN ('pro', 'enterprise');
        WHEN 'custom_templates' THEN
            can_do := user_tier IN ('pro', 'enterprise');
        WHEN 'custom_branding' THEN
            can_do := user_tier IN ('pro', 'enterprise');
        WHEN 'api' THEN
            can_do := user_tier IN ('enterprise');
        WHEN 'buy_tokens' THEN
            can_do := user_tier IN ('basic', 'pro', 'enterprise');
        ELSE
            can_do := FALSE;
    END CASE;
    
    RETURN can_do;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user can buy tokens (with basic tier limits)
CREATE OR REPLACE FUNCTION can_buy_tokens(user_uuid UUID)
RETURNS BOOLEAN AS $$
DECLARE
    user_tier TEXT;
    total_purchased INTEGER;
    max_tokens INTEGER;
BEGIN
    user_tier := get_user_subscription_tier(user_uuid);
    
    -- Free users cannot buy tokens
    IF user_tier = 'free' THEN
        RETURN FALSE;
    END IF;
    
    -- Basic tier has lifetime limit
    IF user_tier = 'basic' THEN
        SELECT total_tokens_purchased INTO total_purchased
        FROM public.user_subscriptions
        WHERE user_id = user_uuid AND status = 'active'
        LIMIT 1;
        
        max_tokens := 100; -- Basic tier limit
        
        RETURN COALESCE(total_purchased, 0) < max_tokens;
    END IF;
    
    -- Pro and Enterprise can buy unlimited tokens
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user's remaining token allowance
CREATE OR REPLACE FUNCTION get_remaining_token_allowance(user_uuid UUID)
RETURNS INTEGER AS $$
DECLARE
    user_tier TEXT;
    total_purchased INTEGER;
    max_tokens INTEGER;
BEGIN
    user_tier := get_user_subscription_tier(user_uuid);
    
    -- Free users have no allowance
    IF user_tier = 'free' THEN
        RETURN 0;
    END IF;
    
    -- Basic tier has lifetime limit
    IF user_tier = 'basic' THEN
        SELECT total_tokens_purchased INTO total_purchased
        FROM public.user_subscriptions
        WHERE user_id = user_uuid AND status = 'active'
        LIMIT 1;
        
        max_tokens := 100; -- Basic tier limit
        
        RETURN GREATEST(0, max_tokens - COALESCE(total_purchased, 0));
    END IF;
    
    -- Pro and Enterprise have unlimited allowance
    RETURN -1; -- -1 indicates unlimited
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 10. GRANT PERMISSIONS
-- =====================================================

-- Grant permissions to authenticated users
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_subscriptions TO authenticated;

-- Grant permissions to service role (if using service role)
GRANT ALL ON public.user_subscriptions TO service_role;

-- Grant permissions on functions
GRANT EXECUTE ON FUNCTION get_user_subscription_tier(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION can_perform_action(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION can_buy_tokens(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_remaining_token_allowance(UUID) TO authenticated;

-- =====================================================
-- 11. VERIFICATION QUERIES
-- =====================================================

-- Check the updated table structure
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'user_subscriptions'
ORDER BY ordinal_position;

-- Check if constraints are in place
SELECT constraint_name, constraint_type
FROM information_schema.table_constraints
WHERE table_name = 'user_subscriptions';

-- Check if indexes are created
SELECT indexname, indexdef 
FROM pg_indexes 
WHERE tablename = 'user_subscriptions';

-- Test the helper functions
-- SELECT get_user_subscription_tier(auth.uid());

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================

-- This migration script updates your existing user_subscriptions table to:
-- 1. Add the missing 'tier' column (mapped from existing 'plan_id')
-- 2. Add 'total_tokens_purchased' column for tracking
-- 3. Add proper constraints and indexes
-- 4. Enable Row Level Security
-- 5. Create helper functions for subscription logic
-- 6. Grant proper permissions

-- Your existing data is preserved and the table structure now matches
-- the subscription system requirements.
