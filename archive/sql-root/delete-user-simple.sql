-- Simple script to delete user 9aa4584b-5e92-4050-969e-f9afeef92742 and all related data
-- Run this in Supabase SQL Editor

-- First, let's see what data this user has
SELECT 'contacts' as table_name, COUNT(*) as count FROM contacts WHERE user_id = '9aa4584b-5e92-4050-969e-f9afeef92742'
UNION ALL
SELECT 'events' as table_name, COUNT(*) as count FROM events WHERE user_id = '9aa4584b-5e92-4050-969e-f9afeef92742'
UNION ALL
SELECT 'user_balances' as table_name, COUNT(*) as count FROM user_balances WHERE user_id = '9aa4584b-5e92-4050-969e-f9afeef92742'
UNION ALL
SELECT 'user_subscriptions' as table_name, COUNT(*) as count FROM user_subscriptions WHERE user_id = '9aa4584b-5e92-4050-969e-f9afeef92742'
UNION ALL
SELECT 'transactions' as table_name, COUNT(*) as count FROM transactions WHERE user_id = '9aa4584b-5e92-4050-969e-f9afeef92742'
UNION ALL
SELECT 'onboarding_links' as table_name, COUNT(*) as count FROM onboarding_links WHERE user_id = '9aa4584b-5e92-4050-969e-f9afeef92742';

-- Now delete in the correct order
BEGIN;

-- Delete email logs for user's events
DELETE FROM email_logs 
WHERE event_id IN (
  SELECT id FROM events WHERE user_id = '9aa4584b-5e92-4050-969e-f9afeef92742'
);

-- Delete telegram logs for user's events  
DELETE FROM telegram_logs 
WHERE event_id IN (
  SELECT id FROM events WHERE user_id = '9aa4584b-5e92-4050-969e-f9afeef92742'
);

-- Delete event contacts for user's events
DELETE FROM event_contacts 
WHERE event_id IN (
  SELECT id FROM events WHERE user_id = '9aa4584b-5e92-4050-969e-f9afeef92742'
);

-- Delete events
DELETE FROM events WHERE user_id = '9aa4584b-5e92-4050-969e-f9afeef92742';

-- Delete contacts
DELETE FROM contacts WHERE user_id = '9aa4584b-5e92-4050-969e-f9afeef92742';

-- Delete transactions
DELETE FROM transactions WHERE user_id = '9aa4584b-5e92-4050-969e-f9afeef92742';

-- Delete user balances
DELETE FROM user_balances WHERE user_id = '9aa4584b-5e92-4050-969e-f9afeef92742';

-- Delete user subscriptions
DELETE FROM user_subscriptions WHERE user_id = '9aa4584b-5e92-4050-969e-f9afeef92742';

-- Delete onboarding links
DELETE FROM onboarding_links WHERE user_id = '9aa4584b-5e92-4050-969e-f9afeef92742';

COMMIT;

-- Verify deletion
SELECT 'contacts' as table_name, COUNT(*) as remaining FROM contacts WHERE user_id = '9aa4584b-5e92-4050-969e-f9afeef92742'
UNION ALL
SELECT 'events' as table_name, COUNT(*) as remaining FROM events WHERE user_id = '9aa4584b-5e92-4050-969e-f9afeef92742'
UNION ALL
SELECT 'user_balances' as table_name, COUNT(*) as remaining FROM user_balances WHERE user_id = '9aa4584b-5e92-4050-969e-f9afeef92742'
UNION ALL
SELECT 'user_subscriptions' as table_name, COUNT(*) as remaining FROM user_subscriptions WHERE user_id = '9aa4584b-5e92-4050-969e-f9afeef92742'
UNION ALL
SELECT 'transactions' as table_name, COUNT(*) as remaining FROM transactions WHERE user_id = '9aa4584b-5e92-4050-969e-f9afeef92742'
UNION ALL
SELECT 'onboarding_links' as table_name, COUNT(*) as remaining FROM onboarding_links WHERE user_id = '9aa4584b-5e92-4050-969e-f9afeef92742';
