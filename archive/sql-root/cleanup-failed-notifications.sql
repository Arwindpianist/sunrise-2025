-- Clean up failed SOS notifications
-- This script will delete all failed notifications and reset the sos_alert_notifications table

-- Delete all failed notifications
DELETE FROM notifications 
WHERE type = 'sos_alert' 
AND created_at >= '2025-09-01 03:20:00';

-- Reset all failed sos_alert_notifications to pending
UPDATE sos_alert_notifications 
SET status = 'pending', 
    error_message = NULL, 
    sent_at = NULL, 
    delivered_at = NULL
WHERE status = 'failed' 
AND created_at >= '2025-09-01 03:20:00';

-- Show the count of cleaned up records
SELECT 
    'Deleted notifications' as action,
    COUNT(*) as count
FROM notifications 
WHERE type = 'sos_alert' 
AND created_at >= '2025-09-01 03:20:00'
UNION ALL
SELECT 
    'Reset sos_alert_notifications' as action,
    COUNT(*) as count
FROM sos_alert_notifications 
WHERE status = 'failed' 
AND created_at >= '2025-09-01 03:20:00';
