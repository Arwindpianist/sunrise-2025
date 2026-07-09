 # Telegram Integration Setup Guide

This guide will help you set up Telegram integration for sending event invitations via Telegram messages.

## Prerequisites

1. A Telegram account
2. A Telegram Bot Token (we'll create this)
3. Access to your Supabase project

## Step 1: Create a Telegram Bot

1. Open Telegram and search for "@BotFather"
2. Start a conversation with BotFather
3. Send the command `/newbot`
4. Follow the instructions to create your bot:
   - Choose a name for your bot (e.g., "Sunrise Event Bot")
   - Choose a username for your bot (must end with "bot", e.g., "sunrise_event_bot")
5. BotFather will give you a bot token. Save this token securely.

## Step 2: Get Your Chat ID

There are several ways to get your chat ID:

### Method 1: Using the Bot
1. Start a conversation with your bot by clicking the link BotFather provided
2. Send any message to the bot
3. Visit: `https://api.telegram.org/bot<YOUR_BOT_TOKEN>/getUpdates`
4. Look for the "chat" object and note the "id" field

### Method 2: Using @userinfobot
1. Search for "@userinfobot" in Telegram
2. Start a conversation and send any message
3. The bot will reply with your chat ID

## Step 3: Configure Environment Variables

Add the following environment variables to your `.env.local` file:

```env
TELEGRAM_BOT_TOKEN=your_bot_token_here
TELEGRAM_CHAT_ID=your_chat_id_here
```

## Step 4: Run Database Migration

1. Go to your Supabase project dashboard
2. Navigate to the SQL Editor
3. Copy and paste the contents of `database-migration.sql`
4. Run the migration

## Step 5: Test the Integration

1. Create a new event in your application
2. Enable "Send Telegram" option
3. Select a Telegram template or create a custom message
4. Send the event to test the integration

## How It Works

### For Recipients
- Recipients must have a phone number saved in their contact information
- The system will only send Telegram messages to contacts with valid phone numbers
- Messages are sent using the Telegram Bot API

### Message Format
- Messages support HTML formatting (bold, italic, etc.)
- You can use placeholders like `{{firstName}}`, `{{eventTitle}}`, `{{eventDate}}`, `{{eventLocation}}`
- Messages are optimized for Telegram's text format

### Cost Calculation
- Each Telegram message costs 1 token (same as email)
- The system counts only contacts with phone numbers for Telegram costs
- You can send both email and Telegram messages for the same event

## Troubleshooting

### Common Issues

1. **"Bot token not configured" error**
   - Make sure `TELEGRAM_BOT_TOKEN` is set in your environment variables
   - Restart your development server after adding the variable

2. **"Chat not found" error**
   - Ensure the recipient has started a conversation with your bot
   - Verify the phone number format is correct

3. **Messages not sending**
   - Check that contacts have phone numbers saved
   - Verify your bot token is correct
   - Check the Telegram logs page for error details

### Security Notes

- Never commit your bot token to version control
- Use environment variables for sensitive configuration
- The bot can only send messages to users who have started a conversation with it

## Features

- **Template System**: Pre-built templates for different event types
- **Custom Messages**: Create custom Telegram messages with placeholders
- **Delivery Tracking**: View delivery status in the Telegram logs page
- **Error Handling**: Failed messages are logged with error details
- **Cost Management**: Integrated with the existing token system

## Limitations

- Recipients must have phone numbers saved in contacts
- Recipients must start a conversation with your bot to receive messages
- Telegram has rate limits (30 messages per second)
- Messages are limited to 4096 characters

## Support

If you encounter issues:
1. Check the Telegram logs page for error details
2. Verify your bot configuration
3. Test with a simple message first
4. Check that recipients have valid phone numbers