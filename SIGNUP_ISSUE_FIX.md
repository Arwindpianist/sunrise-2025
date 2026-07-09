# User Signup Issue Fix

## Problem Description

Users were experiencing a 500 error with "unexpected_failure" when trying to sign up for new accounts. The error was occurring during the Supabase Auth signup process.

## Root Cause Analysis

The issue was caused by missing database components:

1. **Missing Trigger**: No automatic creation of user records in the `users` table when new users sign up through Supabase Auth
2. **Missing Tables**: Several tables referenced in the application code didn't exist in the database:
   - `referrals` table
   - `user_enquiries` table  
   - `notifications` table
   - `user_balances` table
3. **Missing Functions**: The `increment_balance` function was referenced but didn't exist
4. **Missing RLS Policies**: Row Level Security policies were not properly configured

## Solution

### Files Created

1. **`fix-signup-issue.sql`** - Main fix script that addresses all issues
2. **`test-signup-fix.sql`** - Verification script to test the fix
3. **Migration files** in `supabase/migrations/`:
   - `20250101000005_create_user_trigger.sql`
   - `20250101000006_create_missing_tables.sql`
   - `20250101000007_create_increment_balance_function.sql`

### What the Fix Does

1. **Creates a Database Trigger**: Automatically creates a user record in the `users` table when a new user signs up through Supabase Auth
2. **Creates Missing Tables**: Adds all referenced tables with proper structure and constraints
3. **Adds RLS Policies**: Configures proper Row Level Security for all tables
4. **Creates Missing Functions**: Adds the `increment_balance` function for referral rewards
5. **Sets Up Indexes**: Creates performance indexes for better query performance
6. **Grants Permissions**: Ensures authenticated users have proper access to tables and functions

## How to Apply the Fix

### Option 1: Run the Complete Fix Script

1. Go to your Supabase Dashboard
2. Navigate to the SQL Editor
3. Copy and paste the contents of `fix-signup-issue.sql`
4. Run the script
5. Verify the fix by running `test-signup-fix.sql`

### Option 2: Run Individual Migration Files

If you prefer to run migrations individually:

1. Run `supabase/migrations/20250101000005_create_user_trigger.sql`
2. Run `supabase/migrations/20250101000006_create_missing_tables.sql`
3. Run `supabase/migrations/20250101000007_create_increment_balance_function.sql`

## Verification

After applying the fix, you can verify it's working by:

1. **Running the test script**: Execute `test-signup-fix.sql` to check all components
2. **Testing signup**: Try creating a new user account
3. **Checking logs**: Monitor for any remaining errors

## Expected Behavior After Fix

- New users should be able to sign up without errors
- User records should be automatically created in the `users` table
- Referral system should work properly
- All application features should function normally

## Troubleshooting

If issues persist after applying the fix:

1. **Check Supabase Logs**: Look for any remaining error messages
2. **Verify Permissions**: Ensure all tables and functions have proper permissions
3. **Test Database Functions**: Run the test script to verify all components are working
4. **Check Environment Variables**: Ensure all Supabase environment variables are correctly configured

## Files Modified/Created

- `fix-signup-issue.sql` - Main fix script
- `test-signup-fix.sql` - Verification script
- `supabase/migrations/20250101000005_create_user_trigger.sql` - User trigger migration
- `supabase/migrations/20250101000006_create_missing_tables.sql` - Missing tables migration
- `supabase/migrations/20250101000007_create_increment_balance_function.sql` - Function migration
- `SIGNUP_ISSUE_FIX.md` - This documentation file

## Notes

- The fix is backward compatible and won't affect existing users
- All existing data will be preserved
- The trigger will automatically create user records for any existing auth users that don't have corresponding records
- RLS policies ensure proper security for all tables


