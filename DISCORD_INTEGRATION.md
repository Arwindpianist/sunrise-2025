# Discord Integration for Sunrise

## Overview

The Discord integration allows users to send event invitations and notifications directly to Discord channels using webhooks. This provides a cost-effective way to reach large audiences with a single message.

## Key Benefits

### 🎯 **Cost Efficiency**
- **Telegram/Email**: 100 contacts = 100 tokens
- **Discord**: 100 contacts = 1 token
- **Savings**: Up to 99% cost reduction for large events

### 🚀 **Easy Setup**
- One-time webhook configuration
- No need to collect individual Discord IDs
- Simple channel-based messaging

### 🎨 **Rich Formatting**
- Discord embeds with colors and fields
- Professional event invitations
- Real-time notifications

## Features

### 1. Discord Templates
- **Birthday Party**: Coral red theme with birthday emojis
- **Open House**: Turquoise theme with house emojis
- **Wedding**: Hot pink theme with wedding emojis
- **Business Meeting**: Blue theme with professional styling
- **Baby Shower**: Green theme with baby emojis
- **Generic Event**: Orange theme for any event type

### 2. Webhook Management
- Save Discord webhook URL in user settings
- Test webhook connection
- View webhook status and history

### 3. Message Logging
- Track all Discord messages sent
- View success/failure status
- Monitor webhook performance

## Technical Implementation

### Database Schema

#### Users Table
```sql
ALTER TABLE users ADD COLUMN discord_webhook_url TEXT;
```

#### Events Table
```sql
ALTER TABLE events ADD COLUMN discord_template TEXT;
ALTER TABLE events ADD COLUMN send_discord BOOLEAN DEFAULT FALSE;
```

#### Discord Logs Table
```sql
CREATE TABLE discord_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    webhook_url TEXT NOT NULL,
    message_content TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'sent',
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### API Endpoints

#### `/api/discord/send`
- **Method**: POST
- **Purpose**: Send Discord message using webhook
- **Body**: `{ webhookUrl, templateKey, templateVars, customMessage }`

#### `/api/discord/test`
- **Method**: POST
- **Purpose**: Test Discord webhook connection
- **Body**: `{ webhookUrl }`

### Components

#### `components/discord-templates.tsx`
- Discord embed templates for different event types
- Rich formatting with colors, fields, and emojis
- TypeScript interfaces for template variables

#### `components/discord-setup.tsx`
- Webhook URL configuration
- Connection testing
- Status indicators

## User Experience

### Setup Process
1. **Create Discord Server**: User creates a Discord server for their events
2. **Create Channel**: User creates a channel for event notifications
3. **Setup Webhook**: User creates a webhook for the channel
4. **Configure Sunrise**: User pastes webhook URL in Sunrise settings
5. **Test Connection**: User tests the webhook connection
6. **Share Invite**: User shares Discord server invite with contacts

### Event Flow
1. **Create Event**: User creates event in Sunrise
2. **Select Discord**: User enables Discord as communication method
3. **Choose Template**: User selects appropriate Discord template
4. **Send Message**: Sunrise sends one message to Discord webhook
5. **All Contacts See**: All contacts see the message in Discord channel

## Message Format

### Discord Embed Structure
```typescript
{
  embeds: [{
    title: "🎉 Birthday Invitation for John!",
    description: "You're invited to celebrate with us!",
    color: 0xFF6B6B, // Coral red
    fields: [
      { name: "🎂 Event", value: "Birthday Party", inline: true },
      { name: "📅 Date", value: "December 25, 2024", inline: true },
      { name: "📍 Location", value: "123 Main Street", inline: true }
    ],
    footer: { text: "Best regards, The Host" },
    timestamp: "2024-12-25T00:00:00.000Z"
  }]
}
```

## Security Considerations

### Webhook URL Protection
- Webhook URLs are stored encrypted in the database
- URLs are validated before use
- Access is restricted to authenticated users

### Rate Limiting
- Discord webhooks have rate limits
- Messages are queued if rate limit is exceeded
- Error handling for failed deliveries

### Privacy
- Only webhook URLs are stored, not Discord user data
- Users control their own Discord server access
- No personal Discord information is collected

## Cost Calculation

### Token Usage
```typescript
const calculateEventCost = (recipients: number, methods: string[]) => {
  let cost = 0;
  
  methods.forEach(method => {
    switch(method) {
      case 'email':
        cost += recipients; // 1 token per email
        break;
      case 'telegram':
        cost += recipients; // 1 token per telegram message
        break;
      case 'discord':
        cost += 1; // 1 token per Discord message (regardless of recipients)
        break;
    }
  });
  
  return cost;
}
```

## Future Enhancements

### Phase 2 Features
1. **Multiple Channels**: Support for multiple Discord channels
2. **Server Integration**: Direct Discord server integration
3. **Reactions**: Support for Discord reactions and responses
4. **Scheduling**: Advanced Discord message scheduling
5. **Analytics**: Discord message engagement tracking

### Advanced Templates
1. **Custom Colors**: User-defined embed colors
2. **Rich Media**: Support for images and attachments
3. **Interactive Elements**: Buttons and select menus
4. **Multi-language**: Internationalization support

## Troubleshooting

### Common Issues

#### Webhook URL Invalid
- Ensure URL starts with `https://discord.com/api/webhooks/` or `https://ptb.discord.com/api/webhooks/`
- Check that webhook is still active in Discord
- Verify webhook permissions

#### Message Not Sending
- Check Discord server permissions
- Verify channel permissions
- Ensure webhook is not rate limited

#### Embed Not Displaying
- Check Discord embed permissions
- Verify template format is correct
- Ensure webhook has embed permissions

### Debug Tools
- `/api/discord/test` endpoint for testing
- Discord logs page for message history
- Webhook validation in setup component

## Migration Guide

### Database Migration
Run the SQL migration script:
```sql
-- Add Discord fields to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS discord_webhook_url TEXT;

-- Create discord_logs table
CREATE TABLE IF NOT EXISTS discord_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    webhook_url TEXT NOT NULL,
    message_content TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'sent',
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add Discord fields to events table
ALTER TABLE events ADD COLUMN IF NOT EXISTS discord_template TEXT;
ALTER TABLE events ADD COLUMN IF NOT EXISTS send_discord BOOLEAN DEFAULT FALSE;
```

### TypeScript Types
Update `types/supabase.ts` to include Discord fields in the database interface.

## Support

For issues with Discord integration:
1. Check the Discord logs page for error messages
2. Test webhook connection using the test endpoint
3. Verify Discord server and channel permissions
4. Contact support with error details and logs 