-- IMMEDIATE FIX: Run this in your Supabase SQL Editor
-- This will disable the problematic trigger and allow signups to work

-- 1. Drop the problematic trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- 2. Drop the problematic function
DROP FUNCTION IF EXISTS public.handle_new_user();

-- 3. Verify the trigger is gone
SELECT 
  trigger_name, 
  event_manipulation, 
  event_object_table 
FROM information_schema.triggers 
WHERE trigger_name = 'on_auth_user_created';

-- This should return no rows, confirming the trigger is removed
