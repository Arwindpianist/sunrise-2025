-- =====================================================
-- COMPLETE THE SUBSCRIPTION MIGRATION
-- Sunrise 2025 - Final Migration Steps
-- =====================================================

-- =====================================================
-- 1. MIGRATE DATA FROM PLAN_ID TO TIER
-- =====================================================

-- Update tier column based on existing plan_id values
UPDATE public.user_subscriptions 
SET tier = CASE 
    WHEN plan_id = 'free' OR plan_id IS NULL THEN 'free'
    WHEN plan_id = 'basic' THEN 'basic'
    WHEN plan_id = 'pro' THEN 'pro'
    WHEN plan_id = 'enterprise' THEN 'enterprise'
    WHEN plan_id = 'admin' THEN 'enterprise' -- Map admin to enterprise
    ELSE 'free' -- Default fallback for any unknown plan_id values
END
WHERE tier IS NULL;

-- =====================================================
-- 2. ADD CONSTRAINTS
-- =====================================================

-- Add check constraint for tier values (drop first if exists)
ALTER TABLE public.user_subscriptions 
DROP CONSTRAINT IF EXISTS check_tier_values;

ALTER TABLE public.user_subscriptions 
ADD CONSTRAINT check_tier_values 
CHECK (tier IN ('free', 'basic', 'pro', 'enterprise'));

-- Add check constraint for status values (drop first if exists)
ALTER TABLE public.user_subscriptions 
DROP CONSTRAINT IF EXISTS check_status_values;

ALTER TABLE public.user_subscriptions 
ADD CONSTRAINT check_status_values 
CHECK (status IN ('inactive', 'active', 'trial', 'cancelled', 'past_due'));

-- =====================================================
-- 3. CREATE INDEXES FOR PERFORMANCE
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
-- 4. ENABLE ROW LEVEL SECURITY
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
-- 5. CREATE HELPER FUNCTIONS
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

-- Function to check contact limits
CREATE OR REPLACE FUNCTION check_contact_limit(user_uuid UUID)
RETURNS TABLE(can_add BOOLEAN, current_count BIGINT, max_count INTEGER) AS $$
DECLARE
    user_tier TEXT;
    current_contacts BIGINT;
    max_contacts INTEGER;
BEGIN
    user_tier := get_user_subscription_tier(user_uuid);
    
    -- Get current contact count
    SELECT COUNT(*) INTO current_contacts
    FROM public.contacts
    WHERE user_id = user_uuid;
    
    -- Set max contacts based on tier
    CASE user_tier
        WHEN 'free' THEN max_contacts := 50;
        WHEN 'basic' THEN max_contacts := 200;
        WHEN 'pro' THEN max_contacts := 1000;
        WHEN 'enterprise' THEN max_contacts := -1; -- Unlimited
        ELSE max_contacts := 50;
    END CASE;
    
    -- Check if can add more
    can_add := max_contacts = -1 OR current_contacts < max_contacts;
    
    RETURN QUERY SELECT can_add, current_contacts, max_contacts;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check event limits
CREATE OR REPLACE FUNCTION check_event_limit(user_uuid UUID)
RETURNS TABLE(can_add BOOLEAN, current_count BIGINT, max_count INTEGER) AS $$
DECLARE
    user_tier TEXT;
    current_events BIGINT;
    max_events INTEGER;
BEGIN
    user_tier := get_user_subscription_tier(user_uuid);
    
    -- Get current event count
    SELECT COUNT(*) INTO current_events
    FROM public.events
    WHERE user_id = user_uuid;
    
    -- Set max events based on tier
    CASE user_tier
        WHEN 'free' THEN max_events := 10;
        WHEN 'basic' THEN max_events := 50;
        WHEN 'pro' THEN max_events := 200;
        WHEN 'enterprise' THEN max_events := -1; -- Unlimited
        ELSE max_events := 10;
    END CASE;
    
    -- Check if can add more
    can_add := max_events = -1 OR current_events < max_events;
    
    RETURN QUERY SELECT can_add, current_events, max_events;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 6. CREATE TRIGGERS
-- =====================================================

-- Trigger function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
DROP TRIGGER IF EXISTS update_user_subscriptions_updated_at ON public.user_subscriptions;
CREATE TRIGGER update_user_subscriptions_updated_at
    BEFORE UPDATE ON public.user_subscriptions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 7. GRANT PERMISSIONS
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
GRANT EXECUTE ON FUNCTION check_contact_limit(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION check_event_limit(UUID) TO authenticated;

-- =====================================================
-- 8. VERIFICATION QUERIES
-- =====================================================

-- Check the final table structure
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'user_subscriptions'
ORDER BY ordinal_position;

-- Check if data was migrated correctly
SELECT user_id, plan_id, tier, status, total_tokens_purchased
FROM public.user_subscriptions
LIMIT 10;

-- Check if constraints are in place
SELECT constraint_name, constraint_type
FROM information_schema.table_constraints
WHERE table_name = 'user_subscriptions';

-- Check if indexes are created
SELECT indexname, indexdef 
FROM pg_indexes 
WHERE tablename = 'user_subscriptions';

-- Test the helper functions (uncomment to test)
-- SELECT get_user_subscription_tier(auth.uid());
-- SELECT can_buy_tokens(auth.uid());
-- SELECT get_remaining_token_allowance(auth.uid());

-- =====================================================
-- MIGRATION COMPLETE!
-- =====================================================

-- Your subscription system is now fully set up and ready to use!
-- The application should work without any "column tier does not exist" errors.
-- All subscription features, limits, and status displays should be functional.
