# PWA Push Notification Setup Guide

This guide explains how to set up push notifications for the Sunrise PWA (Progressive Web App).

## Overview

The Sunrise PWA now supports browser push notifications that will appear on mobile phones when users have installed the app. This includes:

- **SOS Emergency Alerts**: Urgent notifications when someone triggers an SOS
- **Event Updates**: Notifications for event changes and reminders
- **General Notifications**: System and user notifications

## Prerequisites

1. **VAPID Keys**: You need to generate VAPID (Voluntary Application Server Identification) keys for push notifications
2. **HTTPS**: Push notifications require HTTPS (handled by Vercel/Netlify)
3. **Service Worker**: Already implemented in `/public/sw.js`

## Setup Steps

### 1. Generate VAPID Keys

You can generate VAPID keys using the `web-push` library:

```bash
npx web-push generate-vapid-keys
```

This will output something like:
```
=======================================
Public Key:
BEl62iUYgUivxIkv69yViEuiBIa1lQ...

Private Key:
VkYpKzIxSGR1ZUZpTzZVRGRR...
=======================================
```

### 2. Environment Variables

Add these environment variables to your `.env.local` file:

```env
# VAPID Keys for Push Notifications
NEXT_PUBLIC_VAPID_PUBLIC_KEY=your_public_key_here
VAPID_PRIVATE_KEY=your_private_key_here

# Site URL (for push notification API calls)
NEXT_PUBLIC_SITE_URL=https://your-domain.com
```

### 3. Update VAPID Email

In `/app/api/push/send/route.ts`, update the email address:

```typescript
webpush.setVapidDetails(
  'mailto:your-email@example.com', // Replace with your email
  vapidKeys.publicKey,
  vapidKeys.privateKey
)
```

### 4. Database Migration

Run the database migration to create the push_subscriptions table:

```sql
-- This is already included in supabase/migrations/20250101000001_create_push_subscriptions.sql
```

## How It Works

### 1. User Permission Request

When users visit the app, they'll see a notification permission request in the Settings page. The `NotificationPermission` component handles:

- Checking browser support
- Requesting notification permissions
- Subscribing to push notifications
- Saving subscription to database

### 2. Service Worker

The service worker (`/public/sw.js`) handles:

- Receiving push notifications
- Displaying notifications with custom styling
- Handling notification clicks
- Special handling for SOS alerts (urgent vibration patterns)

### 3. Push Notification Flow

1. **SOS Triggered**: User presses and holds SOS button
2. **Location Fetched**: Gets user's current location
3. **Emergency Contacts**: Identifies Sunrise users in emergency contacts
4. **In-App Notification**: Creates notification in database
5. **Push Notification**: Sends browser push notification to emergency contacts
6. **Mobile Alert**: Emergency contacts receive notification on their phones

### 4. Notification Types

#### SOS Alerts
- **Priority**: Urgent
- **Vibration**: Special pattern (500ms, 200ms, 500ms, 200ms, 500ms)
- **Actions**: "View Details" and "Dismiss"
- **Requires Interaction**: Yes (won't auto-dismiss)

#### Regular Notifications
- **Priority**: Normal
- **Vibration**: Standard pattern (200ms, 100ms, 200ms)
- **Actions**: None (auto-dismissible)

## Testing

### 1. Local Development

For local testing, you can use:

```bash
# Generate test VAPID keys
npx web-push generate-vapid-keys

# Use localhost for testing
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

### 2. Browser Testing

1. Open Chrome DevTools
2. Go to Application tab
3. Check Service Workers section
4. Verify push subscription in Application > Storage > IndexedDB

### 3. Mobile Testing

1. Install the PWA on your phone
2. Enable notifications
3. Test SOS functionality
4. Verify notifications appear

## Troubleshooting

### Common Issues

1. **"Push notifications not supported"**
   - Check if browser supports Service Workers and Push API
   - Ensure HTTPS is enabled

2. **"VAPID keys not configured"**
   - Verify environment variables are set
   - Check that keys are properly formatted

3. **"Permission denied"**
   - User must manually enable notifications in browser settings
   - Guide users to browser notification settings

4. **"Service worker not registered"**
   - Check if `/public/sw.js` exists
   - Verify service worker registration in browser

### Debug Commands

```bash
# Check service worker status
navigator.serviceWorker.getRegistrations()

# Check push subscription
navigator.serviceWorker.ready.then(reg => reg.pushManager.getSubscription())

# Test push notification
curl -X POST https://your-domain.com/api/push/send \
  -H "Content-Type: application/json" \
  -d '{"subscription": {...}, "payload": {...}}'
```

## Security Considerations

1. **VAPID Keys**: Keep private key secure, never expose in client-side code
2. **User Consent**: Always request permission before subscribing
3. **Subscription Management**: Allow users to unsubscribe
4. **Rate Limiting**: Implement rate limiting for push notification API
5. **Data Privacy**: Only send necessary data in notifications

## Performance Optimization

1. **Subscription Cleanup**: Automatically mark invalid subscriptions as inactive
2. **Batch Notifications**: Send multiple notifications in batches when possible
3. **Caching**: Cache service worker resources for offline functionality
4. **Error Handling**: Gracefully handle push notification failures

## Browser Support

- ✅ Chrome (Android & Desktop)
- ✅ Firefox (Android & Desktop)
- ✅ Safari (iOS 16.4+ & macOS)
- ✅ Edge (Desktop)
- ❌ Internet Explorer (not supported)

## Next Steps

1. **Analytics**: Track notification engagement
2. **Customization**: Allow users to customize notification preferences
3. **Rich Notifications**: Add images and more interactive elements
4. **Scheduled Notifications**: Support for delayed notifications
5. **Cross-Platform**: Consider native app notifications for better reliability
