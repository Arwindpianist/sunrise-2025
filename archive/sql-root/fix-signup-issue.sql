-- Fix for user signup issue - Run this in your Supabase SQL editor
-- This script addresses the "unexpected_failure" error during signup

-- 1. Create a trigger to automatically create a user record when a new user signs up
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert a new record into the users table
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
    'free',
    0,
    NEW.created_at,
    NEW.created_at
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the trigger on auth.users table
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- 2. Create missing tables

-- Create referrals table
CREATE TABLE IF NOT EXISTS public.referrals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  referrer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  referred_email TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'cancelled')),
  tokens_awarded INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user_enquiries table
CREATE TABLE IF NOT EXISTS public.user_enquiries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  category TEXT NOT NULL,
  priority TEXT NOT NULL CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'info' CHECK (type IN ('info', 'success', 'warning', 'error')),
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user_balances table
CREATE TABLE IF NOT EXISTS public.user_balances (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  balance INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_referrals_referrer_id ON referrals(referrer_id);
CREATE INDEX IF NOT EXISTS idx_referrals_referred_email ON referrals(referred_email);
CREATE INDEX IF NOT EXISTS idx_referrals_status ON referrals(status);

CREATE INDEX IF NOT EXISTS idx_user_enquiries_user_id ON user_enquiries(user_id);
CREATE INDEX IF NOT EXISTS idx_user_enquiries_status ON user_enquiries(status);
CREATE INDEX IF NOT EXISTS idx_user_enquiries_priority ON user_enquiries(priority);

-- Add missing columns to notifications table if they don't exist
DO $$
BEGIN
  -- Add read column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'notifications' AND column_name = 'read') THEN
    ALTER TABLE notifications ADD COLUMN read BOOLEAN DEFAULT FALSE;
  END IF;
  
  -- Add updated_at column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'notifications' AND column_name = 'updated_at') THEN
    ALTER TABLE notifications ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
  END IF;
END $$;

-- Create indexes for notifications table (only if columns exist)
DO $$
BEGIN
  -- Create index on user_id if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_notifications_user_id') THEN
    CREATE INDEX idx_notifications_user_id ON notifications(user_id);
  END IF;
  
  -- Create index on read if the column exists
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'notifications' AND column_name = 'read') THEN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_notifications_read') THEN
      CREATE INDEX idx_notifications_read ON notifications(read);
    END IF;
  END IF;
  
  -- Create index on created_at if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_notifications_created_at') THEN
    CREATE INDEX idx_notifications_created_at ON notifications(created_at);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_user_balances_user_id ON user_balances(user_id);

-- 4. Add RLS policies

-- Referrals table policies
ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view their own referrals" ON referrals;
CREATE POLICY "Users can view their own referrals" ON referrals
  FOR SELECT USING (referrer_id = auth.uid());
DROP POLICY IF EXISTS "Users can insert their own referrals" ON referrals;
CREATE POLICY "Users can insert their own referrals" ON referrals
  FOR INSERT WITH CHECK (referrer_id = auth.uid());
DROP POLICY IF EXISTS "Users can update their own referrals" ON referrals;
CREATE POLICY "Users can update their own referrals" ON referrals
  FOR UPDATE USING (referrer_id = auth.uid());

-- User enquiries table policies
ALTER TABLE user_enquiries ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view their own enquiries" ON user_enquiries;
CREATE POLICY "Users can view their own enquiries" ON user_enquiries
  FOR SELECT USING (user_id = auth.uid());
DROP POLICY IF EXISTS "Users can insert their own enquiries" ON user_enquiries;
CREATE POLICY "Users can insert their own enquiries" ON user_enquiries
  FOR INSERT WITH CHECK (user_id = auth.uid());
DROP POLICY IF EXISTS "Users can update their own enquiries" ON user_enquiries;
CREATE POLICY "Users can update their own enquiries" ON user_enquiries
  FOR UPDATE USING (user_id = auth.uid());

-- Notifications table policies
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view their own notifications" ON notifications;
CREATE POLICY "Users can view their own notifications" ON notifications
  FOR SELECT USING (user_id = auth.uid());
DROP POLICY IF EXISTS "Users can insert their own notifications" ON notifications;
CREATE POLICY "Users can insert their own notifications" ON notifications
  FOR INSERT WITH CHECK (user_id = auth.uid());
DROP POLICY IF EXISTS "Users can update their own notifications" ON notifications;
CREATE POLICY "Users can update their own notifications" ON notifications
  FOR UPDATE USING (user_id = auth.uid());

-- User balances table policies
ALTER TABLE user_balances ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view their own balance" ON user_balances;
CREATE POLICY "Users can view their own balance" ON user_balances
  FOR SELECT USING (user_id = auth.uid());
DROP POLICY IF EXISTS "Users can update their own balance" ON user_balances;
CREATE POLICY "Users can update their own balance" ON user_balances
  FOR UPDATE USING (user_id = auth.uid());

-- 5. Create the increment_balance function
CREATE OR REPLACE FUNCTION increment_balance(user_id UUID, amount INTEGER)
RETURNS VOID AS $$
BEGIN
  -- Insert or update user_balance record
  INSERT INTO public.user_balances (user_id, balance)
  VALUES (user_id, amount)
  ON CONFLICT (user_id)
  DO UPDATE SET 
    balance = user_balances.balance + amount,
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Create update_updated_at_column function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- 7. Create triggers for updated_at columns
DROP TRIGGER IF EXISTS update_referrals_updated_at ON referrals;
CREATE TRIGGER update_referrals_updated_at 
  BEFORE UPDATE ON referrals 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_enquiries_updated_at ON user_enquiries;
CREATE TRIGGER update_user_enquiries_updated_at 
  BEFORE UPDATE ON user_enquiries 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Only create trigger for notifications if updated_at column exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'notifications' AND column_name = 'updated_at') THEN
    DROP TRIGGER IF EXISTS update_notifications_updated_at ON notifications;
    CREATE TRIGGER update_notifications_updated_at 
      BEFORE UPDATE ON notifications 
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

DROP TRIGGER IF EXISTS update_user_balances_updated_at ON user_balances;
CREATE TRIGGER update_user_balances_updated_at 
  BEFORE UPDATE ON user_balances 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 8. Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON public.users TO authenticated;
GRANT ALL ON public.referrals TO authenticated;
GRANT ALL ON public.user_enquiries TO authenticated;
GRANT ALL ON public.notifications TO authenticated;
GRANT ALL ON public.user_balances TO authenticated;
GRANT EXECUTE ON FUNCTION increment_balance(UUID, INTEGER) TO authenticated;

-- 9. Create any missing users records for existing auth users
INSERT INTO public.users (id, email, full_name, subscription_plan, token_balance, created_at, updated_at)
SELECT 
  au.id,
  au.email,
  COALESCE(au.raw_user_meta_data->>'full_name', ''),
  'free',
  0,
  au.created_at,
  au.created_at
FROM auth.users au
LEFT JOIN public.users u ON u.id = au.id
WHERE u.id IS NULL;

-- Success message
SELECT 'Signup fix applied successfully! New users should now be able to sign up without errors.' as status;
