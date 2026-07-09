-- =====================================================
-- COMPLETE SUBSCRIPTION SYSTEM MIGRATION SCRIPT
-- Sunrise 2025 - Subscription Management
-- =====================================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- 1. CREATE USER_SUBSCRIPTIONS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS public.user_subscriptions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    tier TEXT NOT NULL CHECK (tier IN ('free', 'basic', 'pro', 'enterprise')),
    status TEXT NOT NULL DEFAULT 'inactive' CHECK (status IN ('inactive', 'active', 'trial', 'cancelled', 'past_due')),
    current_period_start TIMESTAMP WITH TIME ZONE,
    current_period_end TIMESTAMP WITH TIME ZONE,
    total_tokens_purchased INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure one active subscription per user
    UNIQUE(user_id, status)
);

-- =====================================================
-- 2. CREATE INDEXES FOR PERFORMANCE
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
-- 3. ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Enable RLS on user_subscriptions table
ALTER TABLE public.user_subscriptions ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own subscriptions
CREATE POLICY "Users can view own subscriptions" ON public.user_subscriptions
    FOR SELECT USING (auth.uid() = user_id);

-- Policy: Users can insert their own subscriptions
CREATE POLICY "Users can insert own subscriptions" ON public.user_subscriptions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own subscriptions
CREATE POLICY "Users can update own subscriptions" ON public.user_subscriptions
    FOR UPDATE USING (auth.uid() = user_id);

-- Policy: Users can delete their own subscriptions
CREATE POLICY "Users can delete own subscriptions" ON public.user_subscriptions
    FOR DELETE USING (auth.uid() = user_id);

-- =====================================================
-- 4. HELPER FUNCTIONS FOR SUBSCRIPTION LOGIC
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
-- 5. TRIGGERS FOR AUTOMATIC UPDATES
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
CREATE TRIGGER update_user_subscriptions_updated_at
    BEFORE UPDATE ON public.user_subscriptions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 6. INITIAL DATA SETUP (OPTIONAL)
-- =====================================================

-- Insert default subscription for existing users (if needed)
-- This can be run manually or as part of a data migration script
/*
INSERT INTO public.user_subscriptions (user_id, tier, status, total_tokens_purchased)
SELECT 
    id as user_id,
    'free' as tier,
    'active' as status,
    0 as total_tokens_purchased
FROM auth.users
WHERE id NOT IN (SELECT user_id FROM public.user_subscriptions WHERE status = 'active')
ON CONFLICT (user_id, status) DO NOTHING;
*/

-- =====================================================
-- 7. VIEWS FOR ADMIN DASHBOARD
-- =====================================================

-- View for admin user statistics
CREATE OR REPLACE VIEW admin_user_stats AS
SELECT 
    u.id,
    u.email,
    u.raw_user_meta_data->>'full_name' as full_name,
    COALESCE(us.tier, 'free') as subscription_plan,
    COALESCE(ub.balance, 0) as token_balance,
    u.created_at,
    u.last_sign_in_at,
    COALESCE(contact_counts.contacts_count, 0) as contacts_count,
    COALESCE(event_counts.events_count, 0) as events_count,
    COALESCE(email_counts.emails_sent, 0) as emails_sent,
    COALESCE(spent_amounts.total_spent, 0) as total_spent
FROM auth.users u
LEFT JOIN public.user_subscriptions us ON u.id = us.user_id AND us.status = 'active'
LEFT JOIN public.user_balances ub ON u.id = ub.user_id
LEFT JOIN (
    SELECT user_id, COUNT(*) as contacts_count
    FROM public.contacts
    GROUP BY user_id
) contact_counts ON u.id = contact_counts.user_id
LEFT JOIN (
    SELECT user_id, COUNT(*) as events_count
    FROM public.events
    GROUP BY user_id
) event_counts ON u.id = event_counts.user_id
LEFT JOIN (
    SELECT user_id, COUNT(*) as emails_sent
    FROM public.transactions
    WHERE type = 'usage' AND status = 'completed'
    GROUP BY user_id
) email_counts ON u.id = email_counts.user_id
LEFT JOIN (
    SELECT user_id, SUM(amount) as total_spent
    FROM public.transactions
    WHERE type = 'purchase' AND status = 'completed'
    GROUP BY user_id
) spent_amounts ON u.id = spent_amounts.user_id;

-- =====================================================
-- 8. ADMIN STATISTICS FUNCTION
-- =====================================================

CREATE OR REPLACE FUNCTION get_admin_stats()
RETURNS JSON AS $$
DECLARE
    result JSON;
BEGIN
    SELECT json_build_object(
        'totalUsers', (SELECT COUNT(*) FROM auth.users),
        'activeUsers', (SELECT COUNT(*) FROM auth.users WHERE last_sign_in_at > NOW() - INTERVAL '30 days'),
        'totalEvents', (SELECT COUNT(*) FROM public.events),
        'totalContacts', (SELECT COUNT(*) FROM public.contacts),
        'totalEmailsSent', (SELECT COUNT(*) FROM public.transactions WHERE type = 'usage' AND status = 'completed'),
        'totalRevenue', (SELECT COALESCE(SUM(amount), 0) FROM public.transactions WHERE type = 'purchase' AND status = 'completed'),
        'averageRevenuePerUser', (
            SELECT COALESCE(AVG(total_spent), 0) 
            FROM admin_user_stats 
            WHERE total_spent > 0
        ),
        'subscriptionsByPlan', (
            SELECT json_object_agg(subscription_plan, count)
            FROM (
                SELECT subscription_plan, COUNT(*) as count
                FROM admin_user_stats
                GROUP BY subscription_plan
            ) sub_counts
        ),
        'eventsByStatus', (
            SELECT json_build_object(
                'draft', COUNT(*) FILTER (WHERE status = 'draft'),
                'scheduled', COUNT(*) FILTER (WHERE status = 'scheduled'),
                'sending', COUNT(*) FILTER (WHERE status = 'sending'),
                'sent', COUNT(*) FILTER (WHERE status = 'sent'),
                'failed', COUNT(*) FILTER (WHERE status = 'failed'),
                'partial', COUNT(*) FILTER (WHERE status = 'partial'),
                'cancelled', COUNT(*) FILTER (WHERE status = 'cancelled')
            )
            FROM public.events
        ),
        'emailsByStatus', (
            SELECT json_build_object(
                'sent', COUNT(*) FILTER (WHERE status = 'sent'),
                'failed', COUNT(*) FILTER (WHERE status = 'failed'),
                'opened', COUNT(*) FILTER (WHERE status = 'opened')
            )
            FROM public.email_logs
        ),
        'recentTransactions', (
            SELECT json_agg(
                json_build_object(
                    'id', t.id,
                    'user_id', t.user_id,
                    'type', t.type,
                    'amount', t.amount,
                    'status', t.status,
                    'created_at', t.created_at
                )
            )
            FROM (
                SELECT * FROM public.transactions
                ORDER BY created_at DESC
                LIMIT 10
            ) t
        ),
        'eventDateStats', (
            SELECT json_agg(
                json_build_object(
                    'date', date_trunc('month', created_at)::date,
                    'count', COUNT(*)
                )
            )
            FROM (
                SELECT date_trunc('month', created_at) as created_at
                FROM public.events
                WHERE created_at > NOW() - INTERVAL '12 months'
            ) monthly_events
            GROUP BY date_trunc('month', created_at)
            ORDER BY date_trunc('month', created_at)
        )
    ) INTO result;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 9. GRANT PERMISSIONS
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
GRANT EXECUTE ON FUNCTION get_admin_stats() TO authenticated;

-- Grant permissions on views
GRANT SELECT ON admin_user_stats TO authenticated;

-- =====================================================
-- 10. VERIFICATION QUERIES
-- =====================================================

-- Uncomment these queries to verify the migration was successful

/*
-- Check if table exists
SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'user_subscriptions'
);

-- Check if indexes exist
SELECT indexname, indexdef 
FROM pg_indexes 
WHERE tablename = 'user_subscriptions';

-- Check if RLS is enabled
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'user_subscriptions';

-- Check if functions exist
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name LIKE '%subscription%';

-- Test subscription tier function
SELECT get_user_subscription_tier(auth.uid());

-- Test admin stats function
SELECT get_admin_stats();
*/

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================

-- This script creates a complete subscription system with:
-- 1. User subscriptions table with proper constraints
-- 2. Performance indexes for fast queries
-- 3. Row Level Security for data protection
-- 4. Helper functions for subscription logic
-- 5. Triggers for automatic updates
-- 6. Admin views and statistics
-- 7. Proper permissions for authenticated users

-- Run this script in your Supabase SQL editor to set up the complete subscription system. 
