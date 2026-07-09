-- Quick sync script to update users.subscription_plan based on user_subscriptions.tier
-- Run this script to sync all users immediately

-- =====================================================
-- STEP 1: Update users with active subscriptions
-- =====================================================

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
-- STEP 2: Set users without active subscriptions to 'free'
-- =====================================================

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
-- STEP 3: Verify the sync worked
-- =====================================================

-- Check the results
SELECT 
    u.id,
    u.email,
    u.subscription_plan as user_plan,
    us.tier as subscription_tier,
    us.status as subscription_status
FROM users u
LEFT JOIN (
    SELECT DISTINCT ON (user_id) 
        user_id, 
        tier, 
        status
    FROM user_subscriptions 
    WHERE status = 'active'
    ORDER BY user_id, created_at DESC
) us ON u.id = us.user_id
ORDER BY u.created_at DESC;

-- =====================================================
-- STEP 4: Count by subscription plan
-- =====================================================

SELECT 
    subscription_plan,
    COUNT(*) as user_count
FROM users 
GROUP BY subscription_plan 
ORDER BY user_count DESC;
