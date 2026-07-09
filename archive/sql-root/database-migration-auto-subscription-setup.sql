-- =====================================================
-- AUTO-SUBSCRIPTION SETUP FOR NEW USERS
-- Sunrise 2025 - Automatic Subscription Management
-- =====================================================

-- =====================================================
-- 1. CREATE TRIGGER FUNCTION FOR NEW USER SUBSCRIPTIONS
-- =====================================================

CREATE OR REPLACE FUNCTION handle_new_user_subscription()
RETURNS TRIGGER AS $$
BEGIN
    -- Insert default subscription for new user
    INSERT INTO public.user_subscriptions (
        user_id,
        plan_id,
        tier,
        status,
        total_tokens_purchased,
        created_at,
        updated_at
    ) VALUES (
        NEW.id,
        'free',
        'free',
        'active',
        0,
        NOW(),
        NOW()
    );
    
    -- Insert default user balance
    INSERT INTO public.user_balances (
        user_id,
        balance,
        created_at,
        updated_at
    ) VALUES (
        NEW.id,
        15, -- Free users get 15 trial tokens
        NOW(),
        NOW()
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 2. CREATE TRIGGER ON AUTH.USERS
-- =====================================================

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS trigger_new_user_subscription ON auth.users;

-- Create trigger for new user registration
CREATE TRIGGER trigger_new_user_subscription
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION handle_new_user_subscription();

-- =====================================================
-- 3. CREATE TRIGGER FUNCTION FOR USERS TABLE SYNC
-- =====================================================

CREATE OR REPLACE FUNCTION sync_users_table()
RETURNS TRIGGER AS $$
BEGIN
    -- Insert or update user record in public.users table
    INSERT INTO public.users (
        id,
        email,
        full_name,
        subscription_plan,
        token_balance,
        created_at,
        updated_at
    ) VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
        'free', -- Default to free plan
        15, -- Default trial tokens
        NEW.created_at,
        NOW()
    )
    ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        full_name = EXCLUDED.full_name,
        updated_at = NOW();
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 4. CREATE TRIGGER ON AUTH.USERS FOR USERS TABLE SYNC
-- =====================================================

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS trigger_sync_users_table ON auth.users;

-- Create trigger for syncing to public.users table
CREATE TRIGGER trigger_sync_users_table
    AFTER INSERT OR UPDATE ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION sync_users_table();

-- =====================================================
-- 5. UPDATE EXISTING AUTH FUNCTIONS (IF THEY EXIST)
-- =====================================================

-- Function to handle user signup with automatic subscription setup
CREATE OR REPLACE FUNCTION handle_user_signup(
    user_email TEXT,
    user_password TEXT,
    user_full_name TEXT DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
    new_user_id UUID;
    result JSON;
BEGIN
    -- Create user in auth.users (this will trigger our subscription setup)
    INSERT INTO auth.users (
        email,
        encrypted_password,
        raw_user_meta_data
    ) VALUES (
        user_email,
        crypt(user_password, gen_salt('bf')),
        json_build_object('full_name', user_full_name)
    ) RETURNING id INTO new_user_id;
    
    -- Return success response
    result := json_build_object(
        'success', true,
        'user_id', new_user_id,
        'message', 'User created with free subscription and 15 trial tokens'
    );
    
    RETURN result;
    
EXCEPTION WHEN OTHERS THEN
    -- Return error response
    result := json_build_object(
        'success', false,
        'error', SQLERRM,
        'message', 'Failed to create user'
    );
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 6. CREATE FUNCTION TO UPGRADE USER SUBSCRIPTION
-- =====================================================

CREATE OR REPLACE FUNCTION upgrade_user_subscription(
    user_uuid UUID,
    new_tier TEXT,
    stripe_subscription_id TEXT DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
    result JSON;
    current_tier TEXT;
BEGIN
    -- Get current tier
    SELECT tier INTO current_tier
    FROM public.user_subscriptions
    WHERE user_id = user_uuid AND status = 'active'
    LIMIT 1;
    
    -- Update subscription
    UPDATE public.user_subscriptions
    SET 
        tier = new_tier,
        plan_id = new_tier, -- Keep plan_id in sync
        stripe_subscription_id = COALESCE(stripe_subscription_id, stripe_subscription_id),
        updated_at = NOW()
    WHERE user_id = user_uuid AND status = 'active';
    
    -- Update users table to keep in sync
    UPDATE public.users
    SET 
        subscription_plan = new_tier,
        updated_at = NOW()
    WHERE id = user_uuid;
    
    -- Return success response
    result := json_build_object(
        'success', true,
        'user_id', user_uuid,
        'old_tier', current_tier,
        'new_tier', new_tier,
        'message', 'Subscription upgraded successfully'
    );
    
    RETURN result;
    
EXCEPTION WHEN OTHERS THEN
    -- Return error response
    result := json_build_object(
        'success', false,
        'error', SQLERRM,
        'message', 'Failed to upgrade subscription'
    );
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 7. CREATE FUNCTION TO UPDATE TOKEN BALANCE
-- =====================================================

CREATE OR REPLACE FUNCTION update_user_token_balance(
    user_uuid UUID,
    token_amount INTEGER,
    operation TEXT DEFAULT 'add' -- 'add' or 'subtract'
)
RETURNS JSON AS $$
DECLARE
    result JSON;
    current_balance INTEGER;
    new_balance INTEGER;
BEGIN
    -- Get current balance
    SELECT balance INTO current_balance
    FROM public.user_balances
    WHERE user_id = user_uuid;
    
    -- Calculate new balance
    IF operation = 'add' THEN
        new_balance := COALESCE(current_balance, 0) + token_amount;
    ELSE
        new_balance := GREATEST(0, COALESCE(current_balance, 0) - token_amount);
    END IF;
    
    -- Update balance
    INSERT INTO public.user_balances (user_id, balance, created_at, updated_at)
    VALUES (user_uuid, new_balance, NOW(), NOW())
    ON CONFLICT (user_id) DO UPDATE SET
        balance = new_balance,
        updated_at = NOW();
    
    -- Update users table to keep in sync
    UPDATE public.users
    SET 
        token_balance = new_balance,
        updated_at = NOW()
    WHERE id = user_uuid;
    
    -- Return success response
    result := json_build_object(
        'success', true,
        'user_id', user_uuid,
        'old_balance', current_balance,
        'new_balance', new_balance,
        'operation', operation,
        'amount', token_amount
    );
    
    RETURN result;
    
EXCEPTION WHEN OTHERS THEN
    -- Return error response
    result := json_build_object(
        'success', false,
        'error', SQLERRM,
        'message', 'Failed to update token balance'
    );
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 8. CREATE FUNCTION TO PURCHASE TOKENS
-- =====================================================

CREATE OR REPLACE FUNCTION purchase_tokens(
    user_uuid UUID,
    token_amount INTEGER,
    payment_amount DECIMAL(10,2)
)
RETURNS JSON AS $$
DECLARE
    result JSON;
    user_tier TEXT;
    can_buy BOOLEAN;
    current_purchased INTEGER;
BEGIN
    -- Check if user can buy tokens
    user_tier := get_user_subscription_tier(user_uuid);
    can_buy := can_buy_tokens(user_uuid);
    
    IF NOT can_buy THEN
        result := json_build_object(
            'success', false,
            'error', 'User cannot purchase tokens',
            'tier', user_tier,
            'message', 'Upgrade your subscription to purchase tokens'
        );
        RETURN result;
    END IF;
    
    -- Get current purchased amount
    SELECT total_tokens_purchased INTO current_purchased
    FROM public.user_subscriptions
    WHERE user_id = user_uuid AND status = 'active'
    LIMIT 1;
    
    -- Update total tokens purchased
    UPDATE public.user_subscriptions
    SET 
        total_tokens_purchased = COALESCE(current_purchased, 0) + token_amount,
        updated_at = NOW()
    WHERE user_id = user_uuid AND status = 'active';
    
    -- Add tokens to balance
    PERFORM update_user_token_balance(user_uuid, token_amount, 'add');
    
    -- Record transaction
    INSERT INTO public.transactions (
        user_id,
        type,
        amount,
        description,
        status
    ) VALUES (
        user_uuid,
        'purchase',
        token_amount,
        'Token purchase - ' || token_amount || ' tokens for RM' || payment_amount,
        'completed'
    );
    
    -- Return success response
    result := json_build_object(
        'success', true,
        'user_id', user_uuid,
        'tokens_purchased', token_amount,
        'payment_amount', payment_amount,
        'total_purchased', COALESCE(current_purchased, 0) + token_amount
    );
    
    RETURN result;
    
EXCEPTION WHEN OTHERS THEN
    -- Return error response
    result := json_build_object(
        'success', false,
        'error', SQLERRM,
        'message', 'Failed to purchase tokens'
    );
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 9. GRANT PERMISSIONS
-- =====================================================

-- Grant permissions on functions
GRANT EXECUTE ON FUNCTION handle_user_signup(TEXT, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION upgrade_user_subscription(UUID, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION update_user_token_balance(UUID, INTEGER, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION purchase_tokens(UUID, INTEGER, DECIMAL) TO authenticated;

-- Grant permissions on trigger functions
GRANT EXECUTE ON FUNCTION handle_new_user_subscription() TO service_role;
GRANT EXECUTE ON FUNCTION sync_users_table() TO service_role;

-- =====================================================
-- 10. VERIFICATION QUERIES
-- =====================================================

-- Check if triggers are created
SELECT 
    trigger_name,
    event_manipulation,
    action_statement
FROM information_schema.triggers
WHERE trigger_name IN ('trigger_new_user_subscription', 'trigger_sync_users_table');

-- Check if functions are created
SELECT routine_name, routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name IN (
    'handle_new_user_subscription',
    'sync_users_table',
    'handle_user_signup',
    'upgrade_user_subscription',
    'update_user_token_balance',
    'purchase_tokens'
);

-- =====================================================
-- AUTO-SUBSCRIPTION SETUP COMPLETE!
-- =====================================================

-- Now all new users will automatically:
-- 1. Get a free subscription record in user_subscriptions table
-- 2. Get 15 trial tokens in user_balances table
-- 3. Get a record in the users table with proper defaults
-- 4. Have their subscription data kept in sync across all tables

-- The system will handle:
-- - Automatic subscription creation for new users
-- - Subscription upgrades
-- - Token purchases and balance updates
-- - Data synchronization between tables 
