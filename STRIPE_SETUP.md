# Stripe Integration Setup Guide

## Environment Variables Required

Add these environment variables to your `.env.local` file:

```bash
# Stripe Keys
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_publishable_key_here
STRIPE_SECRET_KEY=sk_test_your_secret_key_here

# Stripe Price IDs (create these in your Stripe dashboard)
STRIPE_BASIC_PRICE_ID=price_your_basic_price_id_here
STRIPE_PRO_PRICE_ID=price_your_pro_price_id_here
STRIPE_ENTERPRISE_PRICE_ID=price_your_enterprise_price_id_here
```

## Setting Up Stripe Products and Prices

### 1. Create Products in Stripe Dashboard

1. Go to your Stripe Dashboard → Products
2. Create three products:
   - **Basic Plan** - RM 9.90/month
   - **Pro Plan** - RM 29.90/month  
   - **Enterprise Plan** - RM 79.90/month

### 2. Create Recurring Prices

For each product, create a recurring price:

1. Click on each product
2. Click "Add pricing"
3. Set pricing type to "Recurring"
4. Set billing period to "Monthly"
5. Set the price in MYR (Malaysian Ringgit)
6. Copy the price ID (starts with `price_`)

### 3. Update Environment Variables

Replace the placeholder price IDs in your `.env.local` with the actual price IDs from Stripe.

## Database Schema Requirements

Make sure your `user_subscriptions` table has these columns:

```sql
CREATE TABLE user_subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  tier TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  current_period_start TIMESTAMP WITH TIME ZONE,
  current_period_end TIMESTAMP WITH TIME ZONE,
  total_tokens_purchased INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## Testing the Integration

1. **Test with Stripe Test Cards:**
   - Success: `4242 4242 4242 4242`
   - Decline: `4000 0000 0000 0002`

2. **Test the Upgrade Flow:**
   - Go to pricing page
   - Click "Upgrade Now" on any plan
   - Should redirect to payment form
   - Complete payment with test card
   - Verify subscription is created in both Stripe and database

## Webhook Setup (Optional but Recommended)

For production, set up webhooks to handle subscription lifecycle events:

1. Go to Stripe Dashboard → Webhooks
2. Add endpoint: `https://yourdomain.com/api/stripe/webhook`
3. Select events:
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`

## Troubleshooting

### Common Issues:

1. **"Price not configured" error:**
   - Check that all price IDs are set in environment variables
   - Verify price IDs exist in your Stripe dashboard

2. **"User email not found" error:**
   - Ensure user has a profile with email in the `profiles` table
   - Check that user authentication is working properly

3. **Payment fails:**
   - Verify Stripe keys are correct
   - Check that you're using test keys for development
   - Ensure price IDs match the currency (MYR)

### Debug Mode:

Add this to see detailed error messages:

```bash
NODE_ENV=development
```

## Security Notes

- Never commit your `.env.local` file to version control
- Use test keys for development
- Switch to live keys only for production
- Regularly rotate your Stripe keys
- Monitor webhook events for security 