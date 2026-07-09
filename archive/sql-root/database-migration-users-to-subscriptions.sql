-- =====================================================
-- MIGRATE SUBSCRIPTION DATA FROM USERS TO USER_SUBSCRIPTIONS
-- Sunrise 2025 - Data Migration Script
-- =====================================================

-- =====================================================
-- 1. BACKUP EXISTING DATA
-- =====================================================

-- Create backup of users table
CREATE TABLE IF NOT EXISTS users_backup AS 
SELECT * FROM public.users;

-- Create backup of user_subscriptions table
CREATE TABLE IF NOT EXISTS user_subscriptions_backup AS 
SELECT * FROM public.user_subscriptions;

-- =====================================================
-- 2. MIGRATE DATA FROM USERS TO USER_SUBSCRIPTIONS
-- =====================================================

-- Insert subscription data from users table to user_subscriptions table
INSERT INTO public.user_subscriptions (
    user_id,
    plan_id,
    tier,
    status,
    total_tokens_purchased,
    created_at,
    updated_at
)
SELECT 
    u.id as user_id,
    u.subscription_plan as plan_id, -- Use the original subscription_plan as plan_id
    CASE 
        WHEN u.subscription_plan = 'free' OR u.subscription_plan IS NULL THEN 'free'
        WHEN u.subscription_plan = 'basic' THEN 'basic'
        WHEN u.subscription_plan = 'pro' THEN 'pro'
        WHEN u.subscription_plan = 'enterprise' THEN 'enterprise'
        WHEN u.subscription_plan = 'admin' THEN 'enterprise' -- Map admin to enterprise
        ELSE 'free' -- Default fallback
    END as tier,
    'active' as status, -- Assume all existing users have active subscriptions
    0 as total_tokens_purchased, -- Start with 0, will be calculated from transactions
    u.created_at,
    u.updated_at
FROM public.users u
WHERE u.id NOT IN (
    SELECT user_id FROM public.user_subscriptions WHERE status = 'active'
)
ON CONFLICT (user_id, status) DO NOTHING;

-- =====================================================
-- 3. CALCULATE TOTAL TOKENS PURCHASED FROM TRANSACTIONS
-- =====================================================

-- Update total_tokens_purchased based on transaction history
UPDATE public.user_subscriptions 
SET total_tokens_purchased = COALESCE(
    (
        SELECT SUM(amount)
        FROM public.transactions
        WHERE user_id = user_subscriptions.user_id
        AND type = 'purchase'
        AND status = 'completed'
    ), 0
)
WHERE status = 'active';

-- =====================================================
-- 4. UPDATE USER BALANCES
-- =====================================================

-- Ensure user_balances table has records for all users
INSERT INTO public.user_balances (user_id, balance, created_at, updated_at)
SELECT 
    u.id as user_id,
    u.token_balance as balance,
    u.created_at,
    u.updated_at
FROM public.users u
WHERE u.id NOT IN (
    SELECT user_id FROM public.user_balances
)
ON CONFLICT (user_id) DO UPDATE SET
    balance = EXCLUDED.balance,
    updated_at = NOW();

-- =====================================================
-- 5. ADD CONSTRAINTS TO USER_SUBSCRIPTIONS
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
-- 6. CREATE INDEXES FOR PERFORMANCE
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
-- 7. ENABLE ROW LEVEL SECURITY
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
-- 8. CREATE HELPER FUNCTIONS
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
-- 9. CREATE TRIGGERS
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

-- Check migration results
SELECT 
    'Users migrated to subscriptions' as check_type,
    COUNT(*) as count
FROM public.user_subscriptions
WHERE status = 'active'

UNION ALL

SELECT 
    'Users with token balance' as check_type,
    COUNT(*) as count
FROM public.user_balances
WHERE balance > 0

UNION ALL

SELECT 
    'Subscription tiers distribution' as check_type,
    COUNT(*) as count
FROM public.user_subscriptions
WHERE status = 'active' AND tier = 'free'

UNION ALL

SELECT 
    'Basic tier users' as check_type,
    COUNT(*) as count
FROM public.user_subscriptions
WHERE status = 'active' AND tier = 'basic'

UNION ALL

SELECT 
    'Pro tier users' as check_type,
    COUNT(*) as count
FROM public.user_subscriptions
WHERE status = 'active' AND tier = 'pro'

UNION ALL

SELECT 
    'Enterprise tier users' as check_type,
    COUNT(*) as count
FROM public.user_subscriptions
WHERE status = 'active' AND tier = 'enterprise';

-- Check sample data
SELECT 
    us.user_id,
    u.email,
    u.subscription_plan as old_plan,
    us.tier as new_tier,
    us.status,
    us.total_tokens_purchased,
    ub.balance as token_balance
FROM public.user_subscriptions us
JOIN public.users u ON us.user_id = u.id
LEFT JOIN public.user_balances ub ON us.user_id = ub.user_id
WHERE us.status = 'active'
LIMIT 10;

-- =====================================================
-- MIGRATION COMPLETE!
-- =====================================================

-- Your subscription data has been successfully migrated from the users table
-- to the user_subscriptions table. The system is now ready to use the new
-- subscription structure while maintaining all existing user data and balances. 
