-- Create user_subscriptions table
CREATE TABLE IF NOT EXISTS user_subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  tier TEXT NOT NULL CHECK (tier IN ('free', 'basic', 'pro', 'enterprise')),
  status TEXT NOT NULL CHECK (status IN ('active', 'inactive', 'cancelled', 'trial')) DEFAULT 'inactive',
  current_period_start TIMESTAMP WITH TIME ZONE,
  current_period_end TIMESTAMP WITH TIME ZONE,
  total_tokens_purchased INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create unique index on user_id to ensure one active subscription per user
CREATE UNIQUE INDEX IF NOT EXISTS idx_user_subscriptions_user_id_active 
ON user_subscriptions(user_id) 
WHERE status = 'active';

-- Create index on tier for quick lookups
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_tier 
ON user_subscriptions(tier);

-- Create index on status for filtering
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_status 
ON user_subscriptions(status);

-- Add RLS policies
ALTER TABLE user_subscriptions ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own subscriptions
CREATE POLICY "Users can view own subscriptions" ON user_subscriptions
  FOR SELECT USING (auth.uid() = user_id);

-- Policy: Users can only insert their own subscriptions
CREATE POLICY "Users can insert own subscriptions" ON user_subscriptions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policy: Users can only update their own subscriptions
CREATE POLICY "Users can update own subscriptions" ON user_subscriptions
  FOR UPDATE USING (auth.uid() = user_id);

-- Policy: Users can only delete their own subscriptions
CREATE POLICY "Users can delete own subscriptions" ON user_subscriptions
  FOR DELETE USING (auth.uid() = user_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to automatically update updated_at
CREATE TRIGGER update_user_subscriptions_updated_at 
  BEFORE UPDATE ON user_subscriptions 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- Function to check if user can perform action based on subscription
CREATE OR REPLACE FUNCTION can_perform_action(
  user_id UUID,
  action TEXT
) RETURNS BOOLEAN AS $$
DECLARE
  user_tier TEXT;
  total_purchased INTEGER;
BEGIN
  -- Get user's subscription tier
  SELECT tier INTO user_tier
  FROM user_subscriptions
  WHERE user_subscriptions.user_id = can_perform_action.user_id
    AND status = 'active';
  
  -- If no subscription, user is on free tier
  IF user_tier IS NULL THEN
    user_tier := 'free';
  END IF;
  
  -- Get total tokens purchased for basic tier limit
  SELECT total_tokens_purchased INTO total_purchased
  FROM user_subscriptions
  WHERE user_subscriptions.user_id = can_perform_action.user_id
    AND status = 'active';
  
  IF total_purchased IS NULL THEN
    total_purchased := 0;
  END IF;
  
  -- Check permissions based on tier
  CASE action
    WHEN 'use_telegram' THEN
      RETURN user_tier IN ('pro', 'enterprise');
    WHEN 'customize_templates' THEN
      RETURN user_tier IN ('pro', 'enterprise');
    WHEN 'custom_branding' THEN
      RETURN user_tier IN ('pro', 'enterprise');
    WHEN 'use_api' THEN
      RETURN user_tier = 'enterprise';
    WHEN 'buy_tokens' THEN
      IF user_tier = 'free' THEN
        RETURN FALSE;
      ELSIF user_tier = 'basic' THEN
        RETURN total_purchased < 100; -- Basic tier lifetime limit
      ELSE
        RETURN TRUE; -- Pro and Enterprise have unlimited
      END IF;
    ELSE
      RETURN FALSE;
  END CASE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check contact limits
CREATE OR REPLACE FUNCTION check_contact_limit(
  user_id UUID
) RETURNS TABLE(can_add BOOLEAN, current_count BIGINT, max_count INTEGER) AS $$
DECLARE
  user_tier TEXT;
  contact_count BIGINT;
  max_contacts INTEGER;
BEGIN
  -- Get user's subscription tier
  SELECT tier INTO user_tier
  FROM user_subscriptions
  WHERE user_subscriptions.user_id = check_contact_limit.user_id
    AND status = 'active';
  
  -- If no subscription, user is on free tier
  IF user_tier IS NULL THEN
    user_tier := 'free';
  END IF;
  
  -- Get current contact count
  SELECT COUNT(*) INTO contact_count
  FROM contacts
  WHERE contacts.user_id = check_contact_limit.user_id;
  
  -- Set max contacts based on tier
  CASE user_tier
    WHEN 'free' THEN max_contacts := 50;
    WHEN 'basic' THEN max_contacts := 200;
    WHEN 'pro' THEN max_contacts := 1000;
    WHEN 'enterprise' THEN max_contacts := -1; -- Unlimited
    ELSE max_contacts := 50;
  END CASE;
  
  -- Return result
  RETURN QUERY SELECT 
    CASE 
      WHEN max_contacts = -1 THEN TRUE -- Unlimited
      ELSE contact_count < max_contacts
    END,
    contact_count,
    max_contacts;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check event limits
CREATE OR REPLACE FUNCTION check_event_limit(
  user_id UUID
) RETURNS TABLE(can_add BOOLEAN, current_count BIGINT, max_count INTEGER) AS $$
DECLARE
  user_tier TEXT;
  event_count BIGINT;
  max_events INTEGER;
BEGIN
  -- Get user's subscription tier
  SELECT tier INTO user_tier
  FROM user_subscriptions
  WHERE user_subscriptions.user_id = check_event_limit.user_id
    AND status = 'active';
  
  -- If no subscription, user is on free tier
  IF user_tier IS NULL THEN
    user_tier := 'free';
  END IF;
  
  -- Get current event count
  SELECT COUNT(*) INTO event_count
  FROM events
  WHERE events.user_id = check_event_limit.user_id;
  
  -- Set max events based on tier
  CASE user_tier
    WHEN 'free' THEN max_events := 5;
    WHEN 'basic' THEN max_events := 20;
    WHEN 'pro' THEN max_events := 100;
    WHEN 'enterprise' THEN max_events := -1; -- Unlimited
    ELSE max_events := 5;
  END CASE;
  
  -- Return result
  RETURN QUERY SELECT 
    CASE 
      WHEN max_events = -1 THEN TRUE -- Unlimited
      ELSE event_count < max_events
    END,
    event_count,
    max_events;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to increment total tokens purchased
CREATE OR REPLACE FUNCTION increment_tokens_purchased(
  user_id UUID,
  tokens INTEGER
) RETURNS VOID AS $$
BEGIN
  UPDATE user_subscriptions
  SET total_tokens_purchased = total_tokens_purchased + tokens
  WHERE user_subscriptions.user_id = increment_tokens_purchased.user_id
    AND status = 'active';
  
  -- If no subscription exists, create one with the purchase
  IF NOT FOUND THEN
    INSERT INTO user_subscriptions (user_id, tier, status, total_tokens_purchased)
    VALUES (increment_tokens_purchased.user_id, 'basic', 'active', tokens);
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON user_subscriptions TO authenticated;
GRANT EXECUTE ON FUNCTION can_perform_action(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION check_contact_limit(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION check_event_limit(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION increment_tokens_purchased(UUID, INTEGER) TO authenticated;
