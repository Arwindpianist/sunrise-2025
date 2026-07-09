-- SQL query to check user subscription status
-- Run this in your Supabase SQL Editor

-- Check user subscriptions
SELECT 
  id,
  user_id,
  tier,
  status,
  stripe_customer_id,
  stripe_subscription_id,
  current_period_start,
  current_period_end,
  total_tokens_purchased,
  created_at,
  updated_at
FROM user_subscriptions 
WHERE user_id = '9aa4584b-5e92-4050-969e-f9afeef92742'
ORDER BY created_at DESC;

-- Check user profile
SELECT 
  id,
  email,
  full_name,
  created_at,
  updated_at
FROM profiles 
WHERE id = '9aa4584b-5e92-4050-969e-f9afeef92742';

-- Check auth.users (if you have access)
SELECT 
  id,
  email,
  created_at,
  last_sign_in_at
FROM auth.users 
WHERE id = '9aa4584b-5e92-4050-969e-f9afeef92742';

-- Check if user has any balance
SELECT 
  user_id,
  balance,
  created_at,
  updated_at
FROM user_balances 
WHERE user_id = '9aa4584b-5e92-4050-969e-f9afeef92742';

-- Count user's events
SELECT 
  COUNT(*) as total_events
FROM events 
WHERE user_id = '9aa4584b-5e92-4050-969e-f9afeef92742';

-- Count user's contacts
SELECT 
  COUNT(*) as total_contacts
FROM contacts 
WHERE user_id = '9aa4584b-5e92-4050-969e-f9afeef92742';
