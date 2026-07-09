# SOS Emergency System Feature Guide

## Overview

The SOS Emergency System is a critical safety feature that allows users to quickly alert their emergency contacts in case of an emergency. The system includes a press-and-hold SOS button with haptic feedback, location sharing, and multi-channel notifications.

## Features

### 🚨 SOS Button
- **Press and Hold**: Users must press and hold the SOS button for 2 seconds to trigger an alert
- **Visual Progress**: Circular progress indicator shows countdown to activation
- **Haptic Feedback**: Vibration feedback on mobile devices during press and hold
- **SOS Pattern**: Special vibration pattern (SOS Morse code) when alert is triggered

### 📍 Location Sharing
- **GPS Location**: Automatically captures user's current GPS coordinates
- **Address Resolution**: Converts coordinates to human-readable address using Google Maps API
- **Location Privacy**: Location is only shared with emergency contacts

### 📱 Multi-Channel Notifications
- **Telegram**: Instant messaging via Telegram bot (if contact has Telegram Chat ID)
- **Email**: Emergency email notifications with detailed information
- **Future**: Support for SMS and push notifications planned

### 👥 Emergency Contact Management
- **Contact Selection**: Add existing contacts as emergency contacts
- **Priority Levels**: Set priority levels (1-3) for contact notification order
- **Sunrise User Detection**: Identifies which contacts have Sunrise accounts
- **Active/Inactive**: Toggle emergency contacts on/off

## Database Schema

### Emergency Contacts Table
```sql
CREATE TABLE emergency_contacts (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  contact_id UUID REFERENCES contacts(id),
  is_active BOOLEAN DEFAULT true,
  priority INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### SOS Alerts Table
```sql
CREATE TABLE sos_alerts (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  status TEXT DEFAULT 'active',
  location_lat DECIMAL(10, 8),
  location_lng DECIMAL(11, 8),
  location_address TEXT,
  triggered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  resolved_at TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### SOS Alert Notifications Table
```sql
CREATE TABLE sos_alert_notifications (
  id UUID PRIMARY KEY,
  sos_alert_id UUID REFERENCES sos_alerts(id),
  emergency_contact_id UUID REFERENCES emergency_contacts(id),
  notification_type TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  sent_at TIMESTAMP WITH TIME ZONE,
  delivered_at TIMESTAMP WITH TIME ZONE,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## API Endpoints

### `/api/telegram/send-sos`
Sends SOS alerts via Telegram bot
- **Method**: POST
- **Body**: `{ chat_id, message, sos_alert_id, notification_id }`
- **Response**: Success/failure status with notification tracking

### `/api/email/send-sos`
Sends SOS alerts via email
- **Method**: POST
- **Body**: `{ to, contact_name, user_name, location, sos_alert_id, notification_id }`
- **Response**: Success/failure status with notification tracking

### `/api/contacts/check-sunrise-user`
Checks if a contact email is associated with a Sunrise account
- **Method**: POST
- **Body**: `{ email }`
- **Response**: `{ isSunriseUser, userId, email }`

## User Interface

### Dashboard SOS Page (`/dashboard/sos`)
- **SOS Button**: Large red button with press-and-hold functionality
- **Emergency Contacts**: List of configured emergency contacts with priority levels
- **Recent Alerts**: History of SOS alerts with status and location
- **Contact Management**: Add/remove emergency contacts and set priorities

### Contact Form Enhancement
- **Account Creation Prompt**: Encourages users to create Sunrise accounts for SOS functionality
- **Visual Indicator**: Shows which contacts are Sunrise users
- **Emergency Contact Benefits**: Explains the value of having Sunrise accounts

## Haptic Feedback

### Supported Patterns
- **Light**: 10ms vibration
- **Medium**: 50ms vibration
- **Heavy**: 100ms vibration
- **Success**: [50, 100, 50] pattern
- **Warning**: [100, 50, 100] pattern
- **Error**: [200, 100, 200, 100, 200] pattern
- **SOS**: [100, 100, 100, 100, 100, 100, 300, 100, 300, 100, 300, 100, 100, 100, 100, 100, 100] (SOS Morse code)

### Implementation
```typescript
import haptics from '@/lib/haptics'

// Trigger haptic feedback
haptics.trigger('medium')
haptics.triggerSOS()
haptics.startContinuous()
haptics.stopContinuous()
```

## Security & Privacy

### Row Level Security (RLS)
- Users can only access their own emergency contacts and SOS alerts
- Emergency contacts are private to each user
- Location data is only shared with designated emergency contacts

### Data Protection
- Location data is encrypted in transit and at rest
- Emergency contact information is protected by RLS policies
- Notification logs are maintained for audit purposes

## Setup Requirements

### Environment Variables
```env
# Telegram Bot
TELEGRAM_BOT_TOKEN=your_telegram_bot_token

# Email Service
RESEND_API_KEY=your_resend_api_key
FROM_EMAIL=noreply@yourdomain.com

# Google Maps (for address resolution)
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_google_maps_api_key
```

### Database Migration
Run the migration to create SOS tables:
```bash
npx supabase db push
```

## Usage Flow

1. **Setup Emergency Contacts**
   - User adds contacts to their emergency contact list
   - Sets priority levels for notification order
   - System identifies which contacts are Sunrise users

2. **Trigger SOS Alert**
   - User presses and holds SOS button for 2 seconds
   - System captures current location
   - Haptic feedback provides tactile confirmation

3. **Send Notifications**
   - System sends Telegram messages to contacts with Chat IDs
   - System sends email notifications to all emergency contacts
   - Notification status is tracked in database

4. **Alert Resolution**
   - User can mark SOS alerts as resolved
   - System maintains alert history for reference

## Future Enhancements

### Planned Features
- **SMS Notifications**: Direct SMS alerts to emergency contacts
- **Push Notifications**: Mobile app push notifications
- **Emergency Services Integration**: Direct integration with emergency services
- **Voice Alerts**: Voice-activated SOS triggers
- **Geofencing**: Automatic alerts based on location boundaries
- **Medical Information**: Emergency medical information sharing
- **Real-time Tracking**: Live location sharing during emergency

### Mobile App Features
- **Offline Support**: SOS functionality works without internet
- **Background Location**: Continuous location monitoring
- **Emergency Contacts App**: Dedicated app for emergency contacts
- **Panic Mode**: Quick access to SOS from lock screen

## Troubleshooting

### Common Issues
1. **Location Not Available**: Check GPS permissions and internet connection
2. **Telegram Notifications Fail**: Verify Telegram bot token and chat IDs
3. **Email Notifications Fail**: Check Resend API key and email configuration
4. **Haptic Feedback Not Working**: Ensure device supports vibration API

### Debug Information
- Check browser console for error messages
- Verify API endpoints are accessible
- Confirm database tables are created correctly
- Test haptic feedback on supported devices

## Support

For technical support or feature requests related to the SOS system, please contact the development team or create an issue in the project repository.
