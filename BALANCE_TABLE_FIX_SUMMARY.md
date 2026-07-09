# User Balance Table Fix Summary

## Issues Fixed

### 1. **Missing user_balances Table** ✅
**Problem**: 406 Not Acceptable error when trying to fetch user balance
**Root Cause**: The `user_balances` table didn't exist in the database
**Fix**: Created migration `20250110000002_create_user_balances.sql` to create the table

### 2. **Missing Balance Records for New Users** ✅
**Problem**: New users didn't have balance records, causing 406 errors
**Root Cause**: Signup process wasn't creating balance records
**Fix**: Updated `signup-server` API to create balance records for new users

### 3. **Permissions-Policy Header Warning** ✅
**Problem**: Browser warning about unrecognized 'vibrate' feature
**Root Cause**: Outdated Permissions-Policy header configuration
**Fix**: Removed 'vibrate' from Permissions-Policy header

## Files Created/Modified

### New Migration: `supabase/migrations/20250110000002_create_user_balances.sql`
- ✅ Creates `user_balances` table with proper structure
- ✅ Sets up RLS policies for security
- ✅ Creates balance records for existing users (15 tokens each)
- ✅ Adds proper indexes and triggers

### Updated: `app/api/signup-server/route.ts`
- ✅ Added Step 3: Create user balance record
- ✅ New users get 15 tokens by default
- ✅ Handles duplicate balance records gracefully
- ✅ Enhanced error handling and logging

### Updated: `next.config.js`
- ✅ Removed 'vibrate' from Permissions-Policy header
- ✅ Eliminates browser warning

## Database Schema

### user_balances Table
```sql
CREATE TABLE public.user_balances (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  balance INTEGER DEFAULT 15, -- Free users start with 15 tokens
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);
```

## Expected Behavior After Fix

### ✅ **New User Registration**
1. User account created in `auth.users`
2. User profile created in `public.users`
3. **Balance record created in `user_balances`** (15 tokens)
4. No more 406 errors when fetching balance

### ✅ **Existing Users**
- Migration automatically creates balance records for existing users
- All users get 15 tokens by default

### ✅ **Dashboard Loading**
- Balance queries will work correctly
- Token usage calculations will be accurate
- No more 406 Not Acceptable errors

## Migration Steps

1. **Apply the migration** in Supabase Dashboard:
   ```sql
   -- Copy and run: supabase/migrations/20250110000002_create_user_balances.sql
   ```

2. **Redeploy the application** to get the updated signup-server API

3. **Test registration** - new users should work without 406 errors

## Testing

After applying the migration:
- ✅ New user registration should work without 406 errors
- ✅ Dashboard should load balance correctly
- ✅ Token usage should display properly
- ✅ No more Permissions-Policy warnings

The balance system should now work perfectly! 🎉
