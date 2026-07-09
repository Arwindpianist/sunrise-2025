# Subscription Proration System

This document describes the implementation of prorated billing and token allocation for subscription plan changes.

## Overview

The proration system ensures that users are charged fairly when upgrading or downgrading their subscription plans mid-billing cycle. It also handles token allocation appropriately based on the remaining days in the billing period.

## Key Features

### 1. Prorated Billing
- **Upgrades**: Users are charged only the difference between plans for the remaining billing period
- **Downgrades**: Users receive credits for the unused portion of their current plan
- **Token Allocation**: Tokens are allocated proportionally based on the remaining days

### 2. Plan Change Handling
- **Seamless Upgrades**: Users can upgrade instantly without waiting for the next billing cycle
- **Immediate Token Access**: Upgraded users receive prorated tokens immediately
- **Transparent Pricing**: Clear display of proration calculations before purchase

## Implementation Details

### Core Functions

#### `calculateProration()`
Calculates the proration ratio based on remaining days in the billing period.

```typescript
const prorationInfo = calculateProration(
  currentPeriodStart,
  currentPeriodEnd,
  changeDate
)
```

#### `calculateProratedTokens()`
Calculates the token difference when changing plans.

```typescript
const tokenDifference = calculateProratedTokens(
  fromTier,
  toTier,
  prorationInfo
)
```

#### `calculateProratedAmount()`
Calculates the billing amount difference for plan changes.

```typescript
const amountDifference = calculateProratedAmount(
  fromTier,
  toTier,
  prorationInfo
)
```

### API Endpoints

#### `/api/subscription/upgrade`
Handles subscription upgrades with proration:
- Updates Stripe subscription with proration
- Calculates and allocates prorated tokens
- Records transaction history

#### `/api/webhooks/stripe`
Enhanced webhook handler:
- Detects plan changes from Stripe events
- Handles prorated token allocation
- Updates subscription metadata

### Database Changes

The system uses existing tables with enhanced metadata:
- `user_subscriptions`: Tracks current plan and billing period
- `user_balances`: Stores token balance
- `transactions`: Records prorated token allocations

## Token Allocation by Plan

| Plan | Monthly Tokens | Token Price |
|------|----------------|-------------|
| Free | 0 (15 trial) | RM0.50 |
| Basic | 10 | RM0.45 |
| Pro | 30 | RM0.40 |
| Enterprise | 100 | RM0.35 |

## Proration Examples

### Example 1: Basic to Pro Upgrade (Mid-month)
- **Current Plan**: Basic (10 tokens/month, RM9.90)
- **New Plan**: Pro (30 tokens/month, RM29.90)
- **Days Remaining**: 15 out of 30
- **Proration Ratio**: 50%

**Calculation**:
- Pro tokens for remaining period: 30 × 0.5 = 15 tokens
- Basic tokens for remaining period: 10 × 0.5 = 5 tokens
- **Token Difference**: +10 tokens
- **Billing Difference**: RM10.00

### Example 2: Pro to Enterprise Upgrade (End of month)
- **Current Plan**: Pro (30 tokens/month, RM29.90)
- **New Plan**: Enterprise (100 tokens/month, RM79.90)
- **Days Remaining**: 3 out of 30
- **Proration Ratio**: 10%

**Calculation**:
- Enterprise tokens for remaining period: 100 × 0.1 = 10 tokens
- Pro tokens for remaining period: 30 × 0.1 = 3 tokens
- **Token Difference**: +7 tokens
- **Billing Difference**: RM5.00

## User Experience

### Pricing Page
- Shows proration information for upgrades
- Displays token allocation for remaining period
- Clear upgrade/downgrade buttons

### Balance Page
- Upgrade recommendations with proration details
- Transaction history showing prorated allocations
- Current plan status and benefits

### Transaction Records
- `upgrade_credit`: Tokens added from plan upgrade
- `downgrade_debit`: Tokens removed from plan downgrade
- `subscription_credit`: Regular monthly token allocation

## Error Handling

The system includes comprehensive error handling:
- Invalid plan changes are rejected
- Failed Stripe operations are logged
- Database transaction rollbacks on errors
- User-friendly error messages

## Testing

Run the test suite to verify proration calculations:

```bash
npm test lib/billing-utils.test.ts
```

## Configuration

Ensure the following environment variables are set:
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `STRIPE_BASIC_PRICE_ID`
- `STRIPE_PRO_PRICE_ID`
- `STRIPE_ENTERPRISE_PRICE_ID`

## Future Enhancements

1. **Downgrade Handling**: Implement graceful downgrade flow
2. **Billing Credits**: Store unused plan credits for future use
3. **Advanced Proration**: Support for custom billing cycles
4. **Analytics**: Track proration patterns and user behavior 