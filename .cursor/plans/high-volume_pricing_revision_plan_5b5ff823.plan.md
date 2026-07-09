---
name: High-Volume Pricing Revision Plan
overview: ""
todos:
  - id: define-bulk-hybrid-pricing
    content: Define bulk committed bundles and overage tiers with 45% margin floor formulas
    status: completed
  - id: implement-bulk-pricing-helpers
    content: Add bulk pricing computation and margin validation helpers in pricing/financial model libs
    status: completed
  - id: wire-subscription-and-limits
    content: Integrate bulk model flags and messaging in subscription and token limits logic
    status: completed
  - id: update-public-pricing-ux-bulk
    content: Revise public pricing page to explain bulk commit + overage model with calculator support
    status: completed
  - id: align-stripe-bulk-metadata
    content: Tag checkout/subscription metadata for bulk pricing program tracking
    status: completed
  - id: document-bulk-operating-rules
    content: Update financial operating doc with bulk pricing governance and review cadence
    status: completed
isProject: false
---

# High-Volume Pricing Revision Plan

## Objective
Revise pricing for high-volume senders so effective usage cost does not scale too aggressively, while preserving healthy economics with a 45% minimum margin floor for bulk cohorts.

## Model Changes
- Introduce a hybrid bulk model:
  - committed monthly token bundle (discounted base)
  - overage tiers (progressively discounted token rates by volume band)
- Keep standard plans intact for non-bulk users; apply bulk logic only when users opt into bulk programs.
- Preserve channel-weighted multipliers (email/WhatsApp utility/WhatsApp marketing), but apply discounted token value via bulk contract tier.

## Economic Rules
- Add dual margin floors:
  - standard cohorts: keep current floor
  - bulk cohorts: 45% floor
- Compute bulk token rates per channel using:
  - `requiredRevenue = providerCost / (1 - 0.45)`
  - apply plan/overage discount bands while never crossing floor.
- Define guardrails for overage discounting to avoid margin leakage on high-WhatsApp mixes.

## Implementation Steps
1. Extend pricing constants and helpers in [C:/Users/arwin/Desktop/ADPMC/sunrise-2025/lib/pricing.ts](C:/Users/arwin/Desktop/ADPMC/sunrise-2025/lib/pricing.ts):
   - bulk program definitions
   - commit bundles
   - overage band rates
2. Extend financial calculators in [C:/Users/arwin/Desktop/ADPMC/sunrise-2025/lib/financial-model.ts](C:/Users/arwin/Desktop/ADPMC/sunrise-2025/lib/financial-model.ts):
   - bulk scenario simulation
   - margin validation by channel mix under bulk pricing
3. Update subscription/product metadata in [C:/Users/arwin/Desktop/ADPMC/sunrise-2025/lib/subscription.ts](C:/Users/arwin/Desktop/ADPMC/sunrise-2025/lib/subscription.ts):
   - expose bulk eligibility and enterprise/bulk feature flags
4. Add bulk-safe purchase/limit messaging in [C:/Users/arwin/Desktop/ADPMC/sunrise-2025/lib/token-limits.ts](C:/Users/arwin/Desktop/ADPMC/sunrise-2025/lib/token-limits.ts):
   - overage and commit-bundle prompts
5. Update public pricing UX in:
   - [C:/Users/arwin/Desktop/ADPMC/sunrise-2025/components/public/pricing-redesign.tsx](C:/Users/arwin/Desktop/ADPMC/sunrise-2025/components/public/pricing-redesign.tsx)
   - [C:/Users/arwin/Desktop/ADPMC/sunrise-2025/app/pricing/page.tsx](C:/Users/arwin/Desktop/ADPMC/sunrise-2025/app/pricing/page.tsx)
   Focus on functional clarity: commit bundle + overage behavior + channel multiplier calculator, no internal margin/forecast disclosure.
6. Align Stripe/subscription metadata in [C:/Users/arwin/Desktop/ADPMC/sunrise-2025/app/api/subscription/create/route.ts](C:/Users/arwin/Desktop/ADPMC/sunrise-2025/app/api/subscription/create/route.ts) to tag bulk pricing model selection for downstream accounting.
7. Document operating rules in [C:/Users/arwin/Desktop/ADPMC/sunrise-2025/docs/financial-pricing-operating-model.md](C:/Users/arwin/Desktop/ADPMC/sunrise-2025/docs/financial-pricing-operating-model.md):
   - bulk commit structure
   - overage tiers
   - 45% bulk margin governance and review cadence.

## Proposed Bulk Structure (Initial Draft)
- Bulk Commit S (e.g. 2k tokens/mo): discounted token value + standard overage tier.
- Bulk Commit M (e.g. 10k tokens/mo): deeper discount + lower overage tier.
- Bulk Commit L (e.g. 50k+ tokens/mo): best discount + custom overage contract.
- Overage tiers: 0-5k, 5k-20k, 20k+ incremental usage with descending per-token price.

## Validation and Rollout
- Validate with three usage-mix simulations:
  - email-heavy
  - mixed email/WhatsApp
  - WhatsApp-heavy
- Ensure all three remain at or above 45% margin floor for bulk paths.
- Roll out behind a bulk pricing toggle first, then make public once KPI checks pass for one billing cycle.