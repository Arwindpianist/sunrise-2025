-- SQL to sync users.subscription_plan with user_subscriptions.tier
-- user_subscriptions table is the source of truth

-- =====================================================
-- 1. UPDATE USERS WITH ACTIVE SUBSCRIPTIONS
-- =====================================================

-- Update users who have active subscriptions in user_subscriptions table
UPDATE users 
SET subscription_plan = COALESCE(
    (
        SELECT tier 
        FROM user_subscriptions 
        WHERE user_subscriptions.user_id = users.id 
        AND user_subscriptions.status = 'active'
        AND user_subscriptions.tier IS NOT NULL
        AND user_subscriptions.tier != 'free'
        ORDER BY user_subscriptions.created_at DESC
        LIMIT 1
    ),
    'free'
)
WHERE EXISTS (
    SELECT 1 
    FROM user_subscriptions 
    WHERE user_subscriptions.user_id = users.id
);

-- =====================================================
-- 2. UPDATE USERS WITHOUT SUBSCRIPTIONS TO 'free'
-- =====================================================

-- Set users to 'free' if they have no active subscriptions or only free subscriptions
UPDATE users 
SET subscription_plan = 'free'
WHERE NOT EXISTS (
    SELECT 1 
    FROM user_subscriptions 
    WHERE user_subscriptions.user_id = users.id 
    AND user_subscriptions.status = 'active'
    AND user_subscriptions.tier IS NOT NULL
    AND user_subscriptions.tier != 'free'
);

-- =====================================================
-- 3. CREATE A FUNCTION FOR AUTOMATIC SYNCING
-- =====================================================

-- Function to sync a single user's subscription plan
CREATE OR REPLACE FUNCTION sync_user_subscription_plan(user_uuid UUID)
RETURNS TEXT AS $$
DECLARE
    new_plan TEXT;
BEGIN
    -- Get the most recent active non-free subscription tier
    SELECT tier INTO new_plan
    FROM user_subscriptions 
    WHERE user_id = user_uuid 
    AND status = 'active'
    AND tier IS NOT NULL
    AND tier != 'free'
    ORDER BY created_at DESC
    LIMIT 1;
    
    -- If no active subscription found, set to 'free'
    IF new_plan IS NULL THEN
        new_plan := 'free';
    END IF;
    
    -- Update the user's subscription plan
    UPDATE users 
    SET subscription_plan = new_plan,
        updated_at = NOW()
    WHERE id = user_uuid;
    
    RETURN new_plan;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 4. CREATE TRIGGER FOR AUTOMATIC SYNCING
-- =====================================================

-- Function to handle subscription changes
CREATE OR REPLACE FUNCTION handle_subscription_change()
RETURNS TRIGGER AS $$
BEGIN
    -- Sync the user's subscription plan when subscription changes
    PERFORM sync_user_subscription_plan(NEW.user_id);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger on user_subscriptions table
DROP TRIGGER IF EXISTS sync_subscription_plan_trigger ON user_subscriptions;
CREATE TRIGGER sync_subscription_plan_trigger
    AFTER INSERT OR UPDATE OR DELETE ON user_subscriptions
    FOR EACH ROW
    EXECUTE FUNCTION handle_subscription_change();

-- =====================================================
-- 5. ONE-TIME FULL SYNC SCRIPT
-- =====================================================

-- Complete sync script to run once
DO $$
DECLARE
    user_record RECORD;
BEGIN
    -- Loop through all users and sync their subscription plans
    FOR user_record IN SELECT id FROM users LOOP
        PERFORM sync_user_subscription_plan(user_record.id);
    END LOOP;
END $$;

-- =====================================================
-- 6. VERIFICATION QUERIES
-- =====================================================

-- Check for mismatches between users and user_subscriptions
SELECT 
    u.id,
    u.email,
    u.subscription_plan as user_plan,
    us.tier as subscription_tier,
    us.status as subscription_status,
    us.created_at as subscription_created
FROM users u
LEFT JOIN (
    SELECT DISTINCT ON (user_id) 
        user_id, 
        tier, 
        status, 
        created_at
    FROM user_subscriptions 
    WHERE status = 'active'
    ORDER BY user_id, created_at DESC
) us ON u.id = us.user_id
WHERE u.subscription_plan != COALESCE(us.tier, 'free')
   OR (us.tier IS NULL AND u.subscription_plan != 'free')
ORDER BY u.created_at DESC;

-- =====================================================
-- 7. MANUAL SYNC COMMANDS
-- =====================================================

-- Sync all users (run this periodically or after major changes)
-- SELECT sync_user_subscription_plan(id) FROM users;

-- Sync specific user
-- SELECT sync_user_subscription_plan('dadb0e29-078f-47aa-9639-41c115153d31'::UUID);

-- =====================================================
-- 8. CLEANUP (if needed)
-- =====================================================

-- To remove the trigger and function (if needed):
-- DROP TRIGGER IF EXISTS sync_subscription_plan_trigger ON user_subscriptions;
-- DROP FUNCTION IF EXISTS handle_subscription_change();
-- DROP FUNCTION IF EXISTS sync_user_subscription_plan(UUID);
