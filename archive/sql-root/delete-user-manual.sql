-- Manual SQL script to delete user and all related data
-- Replace '9aa4584b-5e92-4050-969e-f9afeef92742' with the actual user ID
-- Run this in Supabase SQL Editor

DO $$
DECLARE
    user_id_to_delete UUID := '9aa4584b-5e92-4050-969e-f9afeef92742';
    event_ids UUID[];
BEGIN
    -- Get all event IDs for this user
    SELECT array_agg(id) INTO event_ids 
    FROM events 
    WHERE user_id = user_id_to_delete;
    
    -- Delete email logs for user's events
    IF array_length(event_ids, 1) > 0 THEN
        DELETE FROM email_logs 
        WHERE event_id = ANY(event_ids);
        RAISE NOTICE 'Deleted email logs for % events', array_length(event_ids, 1);
    END IF;
    
    -- Delete telegram logs for user's events
    IF array_length(event_ids, 1) > 0 THEN
        DELETE FROM telegram_logs 
        WHERE event_id = ANY(event_ids);
        RAISE NOTICE 'Deleted telegram logs for % events', array_length(event_ids, 1);
    END IF;
    
    -- Delete event contacts for user's events
    IF array_length(event_ids, 1) > 0 THEN
        DELETE FROM event_contacts 
        WHERE event_id = ANY(event_ids);
        RAISE NOTICE 'Deleted event contacts for % events', array_length(event_ids, 1);
    END IF;
    
    -- Delete events
    DELETE FROM events WHERE user_id = user_id_to_delete;
    RAISE NOTICE 'Deleted events for user';
    
    -- Delete contacts
    DELETE FROM contacts WHERE user_id = user_id_to_delete;
    RAISE NOTICE 'Deleted contacts for user';
    
    -- Delete transactions
    DELETE FROM transactions WHERE user_id = user_id_to_delete;
    RAISE NOTICE 'Deleted transactions for user';
    
    -- Delete user balances
    DELETE FROM user_balances WHERE user_id = user_id_to_delete;
    RAISE NOTICE 'Deleted user balances for user';
    
    -- Delete user subscriptions
    DELETE FROM user_subscriptions WHERE user_id = user_id_to_delete;
    RAISE NOTICE 'Deleted user subscriptions for user';
    
    -- Delete onboarding links
    DELETE FROM onboarding_links WHERE user_id = user_id_to_delete;
    RAISE NOTICE 'Deleted onboarding links for user';
    
    -- Note: You'll need to manually delete from auth.users via Supabase Dashboard
    -- or use the admin API
    RAISE NOTICE 'User data deleted successfully. Remember to delete from auth.users manually.';
    
END $$;
