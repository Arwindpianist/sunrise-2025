-- Test script to verify signup fix is working
-- Run this after applying the fix-signup-issue.sql

-- 1. Check if the trigger exists
SELECT 
  trigger_name,
  event_manipulation,
  action_statement
FROM information_schema.triggers 
WHERE trigger_name = 'on_auth_user_created';

-- 2. Check if the handle_new_user function exists
SELECT 
  routine_name,
  routine_type,
  data_type
FROM information_schema.routines 
WHERE routine_name = 'handle_new_user';

-- 3. Check if all required tables exist
SELECT 
  table_name,
  table_type
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('users', 'referrals', 'user_enquiries', 'notifications', 'user_balances')
ORDER BY table_name;

-- 4. Check if the increment_balance function exists
SELECT 
  routine_name,
  routine_type,
  data_type
FROM information_schema.routines 
WHERE routine_name = 'increment_balance';

-- 5. Check RLS policies
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename IN ('users', 'referrals', 'user_enquiries', 'notifications', 'user_balances')
ORDER BY tablename, policyname;

-- 6. Check permissions
SELECT 
  grantee,
  table_name,
  privilege_type
FROM information_schema.role_table_grants 
WHERE table_schema = 'public' 
AND table_name IN ('users', 'referrals', 'user_enquiries', 'notifications', 'user_balances')
AND grantee = 'authenticated'
ORDER BY table_name, privilege_type;

-- 7. Test the trigger function (this won't actually create a user, just test the function)
DO $$
DECLARE
  test_user_id UUID := gen_random_uuid();
  test_email TEXT := 'test@example.com';
  test_full_name TEXT := 'Test User';
  test_created_at TIMESTAMPTZ := NOW();
BEGIN
  -- Test the function with dummy data
  PERFORM handle_new_user();
  
  RAISE NOTICE 'Trigger function test completed successfully';
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Trigger function test failed: %', SQLERRM;
END $$;

-- 8. Check if there are any existing users without corresponding records
SELECT 
  au.id,
  au.email,
  au.created_at
FROM auth.users au
LEFT JOIN public.users u ON u.id = au.id
WHERE u.id IS NULL
LIMIT 10;

-- Summary
SELECT 
  'Database setup verification complete' as status,
  (SELECT COUNT(*) FROM information_schema.triggers WHERE trigger_name = 'on_auth_user_created') as trigger_exists,
  (SELECT COUNT(*) FROM information_schema.routines WHERE routine_name = 'handle_new_user') as function_exists,
  (SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public' AND table_name IN ('users', 'referrals', 'user_enquiries', 'notifications', 'user_balances')) as tables_exist;


