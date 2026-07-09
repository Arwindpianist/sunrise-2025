-- Complete SOS Notifications Fix - Run this single script
-- This creates all necessary tables and fixes the notification issue

-- 1. Create notifications table if it doesn't exist
CREATE TABLE IF NOT EXISTS notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL, -- 'sos_alert', 'event_reminder', 'system', etc.
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  data JSONB, -- Additional data for the notification
  is_read BOOLEAN DEFAULT false,
  priority TEXT DEFAULT 'normal', -- 'low', 'normal', 'high', 'urgent'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  read_at TIMESTAMP WITH TIME ZONE
);

-- 2. Create emergency_contacts table if it doesn't exist
CREATE TABLE IF NOT EXISTS emergency_contacts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  contact_id UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
  priority INTEGER DEFAULT 1, -- 1 = highest priority
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, contact_id)
);

-- 3. Create sos_alerts table if it doesn't exist
CREATE TABLE IF NOT EXISTS sos_alerts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  location JSONB, -- GPS coordinates and address
  triggered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  status TEXT DEFAULT 'active', -- 'active', 'resolved', 'cancelled'
  resolved_at TIMESTAMP WITH TIME ZONE,
  notes TEXT
);

-- 4. Create sos_alert_notifications table if it doesn't exist
CREATE TABLE IF NOT EXISTS sos_alert_notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  sos_alert_id UUID NOT NULL REFERENCES sos_alerts(id) ON DELETE CASCADE,
  emergency_contact_id UUID NOT NULL REFERENCES emergency_contacts(id) ON DELETE CASCADE,
  notification_type TEXT DEFAULT 'in_app', -- 'in_app', 'push', 'email', 'sms'
  status TEXT DEFAULT 'pending', -- 'pending', 'sent', 'delivered', 'failed'
  sent_at TIMESTAMP WITH TIME ZONE,
  delivered_at TIMESTAMP WITH TIME ZONE,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Create push_subscriptions table if it doesn't exist
CREATE TABLE IF NOT EXISTS push_subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL,
  p256dh_key TEXT NOT NULL,
  auth_key TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, endpoint)
);

-- 6. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_emergency_contacts_user_id ON emergency_contacts(user_id);
CREATE INDEX IF NOT EXISTS idx_emergency_contacts_contact_id ON emergency_contacts(contact_id);
CREATE INDEX IF NOT EXISTS idx_emergency_contacts_active ON emergency_contacts(is_active);

CREATE INDEX IF NOT EXISTS idx_sos_alerts_user_id ON sos_alerts(user_id);
CREATE INDEX IF NOT EXISTS idx_sos_alerts_status ON sos_alerts(status);
CREATE INDEX IF NOT EXISTS idx_sos_alerts_triggered_at ON sos_alerts(triggered_at);

CREATE INDEX IF NOT EXISTS idx_sos_alert_notifications_sos_alert_id ON sos_alert_notifications(sos_alert_id);
CREATE INDEX IF NOT EXISTS idx_sos_alert_notifications_status ON sos_alert_notifications(status);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at);

CREATE INDEX IF NOT EXISTS idx_push_subscriptions_user_id ON push_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_active ON push_subscriptions(is_active);

-- 7. Enable RLS on all tables
ALTER TABLE emergency_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE sos_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE sos_alert_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;

-- 8. Create RLS policies (drop existing ones first)
-- Emergency contacts policies
DROP POLICY IF EXISTS "Users can view their own emergency contacts" ON emergency_contacts;
DROP POLICY IF EXISTS "Users can insert their own emergency contacts" ON emergency_contacts;
DROP POLICY IF EXISTS "Users can update their own emergency contacts" ON emergency_contacts;
DROP POLICY IF EXISTS "Users can delete their own emergency contacts" ON emergency_contacts;

CREATE POLICY "Users can view their own emergency contacts" ON emergency_contacts
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own emergency contacts" ON emergency_contacts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own emergency contacts" ON emergency_contacts
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own emergency contacts" ON emergency_contacts
  FOR DELETE USING (auth.uid() = user_id);

-- SOS alerts policies
DROP POLICY IF EXISTS "Users can view their own SOS alerts" ON sos_alerts;
DROP POLICY IF EXISTS "Users can insert their own SOS alerts" ON sos_alerts;
DROP POLICY IF EXISTS "Users can update their own SOS alerts" ON sos_alerts;

CREATE POLICY "Users can view their own SOS alerts" ON sos_alerts
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own SOS alerts" ON sos_alerts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own SOS alerts" ON sos_alerts
  FOR UPDATE USING (auth.uid() = user_id);

-- SOS alert notifications policies
DROP POLICY IF EXISTS "Users can view SOS notifications for their alerts" ON sos_alert_notifications;
DROP POLICY IF EXISTS "Users can insert SOS notifications for their alerts" ON sos_alert_notifications;
DROP POLICY IF EXISTS "Users can update SOS notifications for their alerts" ON sos_alert_notifications;

CREATE POLICY "Users can view SOS notifications for their alerts" ON sos_alert_notifications
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM sos_alerts 
      WHERE sos_alerts.id = sos_alert_notifications.sos_alert_id 
      AND sos_alerts.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert SOS notifications for their alerts" ON sos_alert_notifications
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM sos_alerts 
      WHERE sos_alerts.id = sos_alert_notifications.sos_alert_id 
      AND sos_alerts.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update SOS notifications for their alerts" ON sos_alert_notifications
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM sos_alerts 
      WHERE sos_alerts.id = sos_alert_notifications.sos_alert_id 
      AND sos_alerts.user_id = auth.uid()
    )
  );

-- Notifications policies (drop ALL existing policies first)
DROP POLICY IF EXISTS "Users can view their own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can insert their own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can insert notifications for emergency contacts" ON notifications;
DROP POLICY IF EXISTS "Users can update their own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can delete their own notifications" ON notifications;

CREATE POLICY "Users can view their own notifications" ON notifications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert notifications for emergency contacts" ON notifications
  FOR INSERT WITH CHECK (
    -- Allow users to insert notifications for themselves
    auth.uid() = user_id
    OR
    -- Allow users to insert notifications for their emergency contacts
    EXISTS (
      SELECT 1 FROM emergency_contacts ec
      JOIN contacts c ON c.id = ec.contact_id
      WHERE ec.user_id = auth.uid() 
      AND c.user_id = notifications.user_id
      AND ec.is_active = true
    )
  );

CREATE POLICY "Users can update their own notifications" ON notifications
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own notifications" ON notifications
  FOR DELETE USING (auth.uid() = user_id);

-- Push subscriptions policies
DROP POLICY IF EXISTS "Users can view their own push subscriptions" ON push_subscriptions;
DROP POLICY IF EXISTS "Users can insert their own push subscriptions" ON push_subscriptions;
DROP POLICY IF EXISTS "Users can update their own push subscriptions" ON push_subscriptions;
DROP POLICY IF EXISTS "Users can delete their own push subscriptions" ON push_subscriptions;

CREATE POLICY "Users can view their own push subscriptions" ON push_subscriptions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own push subscriptions" ON push_subscriptions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own push subscriptions" ON push_subscriptions
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own push subscriptions" ON push_subscriptions
  FOR DELETE USING (auth.uid() = user_id);

-- 9. Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 10. Create triggers for updated_at
DROP TRIGGER IF EXISTS update_emergency_contacts_updated_at ON emergency_contacts;
DROP TRIGGER IF EXISTS update_push_subscriptions_updated_at ON push_subscriptions;

CREATE TRIGGER update_emergency_contacts_updated_at 
  BEFORE UPDATE ON emergency_contacts 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_push_subscriptions_updated_at 
  BEFORE UPDATE ON push_subscriptions 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 11. Create function to check if user exists
CREATE OR REPLACE FUNCTION check_user_exists(user_email TEXT)
RETURNS TABLE(
  user_exists BOOLEAN,
  user_id UUID
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    CASE WHEN au.id IS NOT NULL THEN true ELSE false END as user_exists,
    au.id as user_id
  FROM auth.users au
  WHERE au.email = user_email;
END;
$$;

GRANT EXECUTE ON FUNCTION check_user_exists(TEXT) TO authenticated;

-- 12. Create function to create SOS notifications that bypasses RLS
CREATE OR REPLACE FUNCTION create_sos_notification(
  recipient_user_id UUID,
  sos_alert_id UUID,
  notification_id UUID,
  user_name TEXT,
  location_data JSONB,
  triggered_at TIMESTAMP WITH TIME ZONE
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_notification_id UUID;
BEGIN
  -- Insert the notification directly (bypasses RLS)
  INSERT INTO notifications (
    user_id,
    type,
    title,
    message,
    data,
    is_read,
    priority
  ) VALUES (
    recipient_user_id,
    'sos_alert',
    '🚨 SOS Alert - Immediate Assistance Required',
    user_name || ' has triggered an SOS alert and needs immediate assistance.',
    jsonb_build_object(
      'sos_alert_id', sos_alert_id,
      'user_name', user_name,
      'location', location_data,
      'triggered_at', triggered_at,
      'notification_id', notification_id
    ),
    false,
    'urgent'
  ) RETURNING id INTO new_notification_id;

  -- Update the sos_alert_notifications status
  UPDATE sos_alert_notifications 
  SET status = 'sent', sent_at = NOW()
  WHERE id = notification_id;

  RETURN new_notification_id;
END;
$$;

GRANT EXECUTE ON FUNCTION create_sos_notification(UUID, UUID, UUID, TEXT, JSONB, TIMESTAMP WITH TIME ZONE) TO authenticated;

-- 13. Clean up any existing failed notifications
DELETE FROM notifications 
WHERE type = 'sos_alert' 
AND created_at >= '2025-09-01 03:20:00';

UPDATE sos_alert_notifications 
SET status = 'pending', 
    error_message = NULL, 
    sent_at = NULL, 
    delivered_at = NULL
WHERE status = 'failed' 
AND created_at >= '2025-09-01 03:20:00';

-- 14. Show summary
SELECT 'Tables created/updated successfully' as status;
