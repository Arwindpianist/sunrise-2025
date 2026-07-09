# Financial Pricing Operating Model

This document operationalizes the approved pricing plan into implementation-ready formulas and operating checkpoints.

## 1. Core Economic Targets

- Token model: channel-weighted burn
- Margin floor: 55% minimum on usage
- Bulk margin floor: 45% for committed high-volume programs
- Shared platform: Sunrise and Sunset share one wallet, one subscription, and one accounting model

## 2. Baseline Cost Assumptions (RM)

| Cost Bucket | Unit | Baseline |
| --- | --- | --- |
| Neon infra (compute/storage/backup) | monthly fixed | 450 |
| Ops and monitoring | monthly fixed | 120 |
| Domain renewals (2 domains) | annual fixed | 140 |
| Email delivery | per message | 0.012 |
| Twilio delivery | per message | 0.180 |
| Stripe processing | % of gross revenue | 4.2% |

## 3. Token Economics Formulas

```text
required_revenue_per_message = provider_cost_per_message / (1 - margin_floor)
token_burn = ceil(required_revenue_per_message / tier_token_value)
```

Margin floor denominator is `0.45` at 55% target.

## 4. Tier Token Value and Burn Matrix

| Tier | Token Value |
| --- | --- |
| Basic | RM0.22 |
| Pro | RM0.18 |
| Enterprise | RM0.14 |

| Channel | Default Burn |
| --- | --- |
| Email | 1 token |
| Telegram / Discord / Slack | 1 token |
| WhatsApp Utility | 2 tokens |
| WhatsApp Marketing | 3 tokens |

## 5. Subscription and Pack Structure

| Tier | Monthly Fee | Included Tokens | Top-up Rate |
| --- | --- | --- | --- |
| Free | RM0.00 | 15 trial | not available |
| Basic | RM12.90 | 20 / month | RM0.22 |
| Pro | RM39.90 | 100 / month | RM0.18 |
| Enterprise | RM129.00 | 400 / month | RM0.14 |

Packs: 50, 150, 400, 1200 tokens with tier-adjusted per-token pricing.

## 6. Bulk Hybrid Program (Commit + Overage)

| Program | Monthly Commit Tokens | Monthly Commit Price | Best For |
| --- | --- | --- | --- |
| Bulk Commit S | 2,000 | RM360 | Teams entering recurring bulk sends |
| Bulk Commit M | 10,000 | RM1,600 | Established high-volume operations |
| Bulk Commit L | 50,000 | RM7,000 | Agency and campaign-scale delivery |

Overage tiers (above commit):

| Additional Monthly Tokens | Overage Rate |
| --- | --- |
| 0 - 5,000 | RM0.17/token |
| 5,001 - 20,000 | RM0.15/token |
| 20,001+ | RM0.13/token |

Operating rule:
- Bulk pricing uses same channel multipliers; commit and overage rates must satisfy the 45% floor under expected channel mix.

## 7. 12-Month Forecast Operating View

Base scenario planning assumptions:

- Starting paying subscribers: 60
- Monthly growth: 7%
- Blended gross ARPU: RM37.90
- Variable cost rate: 28%

Track monthly:

- Gross revenue
- Stripe cost
- Net revenue
- Variable cost
- Fixed cost
- Contribution

## 8. KPI Governance

Weekly checks:

- Blended contribution margin
- Channel-level effective margin
- WhatsApp share of total volume
- Top-up conversion rate
- Bulk commit utilization ratio
- Bulk overage concentration by cohort

Alerts:

- Any channel margin below 45% for 2 weeks
- Blended margin below 55% for one billing cycle
- Bulk cohort margin below 45% for one full cycle

Cadence:

- Monthly operating review
- Quarterly repricing with latest vendor invoices
