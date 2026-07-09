---
name: Sunset dashboard theme audit
overview: The authorized dashboard and shared dashboard chrome still use hardcoded Sunrise palettes (orange/rose gradients, translucent white cards) and some Sunrise-only copy. Because `[data-brand="sunset"]` already maps semantic tokens (`primary`, `card`, `border`, etc.) in [packages/ui/src/themes/sunset.css](packages/ui/src/themes/sunset.css), the fix is to migrate dashboard UI to those tokens (and brand-aware strings where needed), not to fork duplicate Sunset pages.
todos:
  - id: chrome-shared
    content: Tokenize dashboard-nav, floating-help-button, pwa-install-banner, upgrade-notice-banner (primary + brand copy)
    status: completed
  - id: dashboard-core
    content: Migrate dashboard/page, balance, contacts, events (list/detail/create) off bg-white/orange to semantic tokens
    status: completed
  - id: dashboard-rest
    content: Migrate messages, referrals, notifications, sos, data-management, logs, integration settings, admin, smaller pages
    status: completed
  - id: notification-permission
    content: Grep notification-permission and SOS-adjacent components for Sunrise strings + light cards; align with token pattern
    status: completed
  - id: verify-both-brands
    content: "Visual pass: Sunset dark surfaces + Sunrise light; fix any contrast regressions"
    status: completed
isProject: false
---

# Sunset dashboard and related components theme pass

## Why the dashboard still looks like Sunrise

- Root layout sets `data-brand` from `getEffectiveBrandId` in [apps/sunrise-web/app/layout.tsx](apps/sunrise-web/app/layout.tsx), so Sunset CSS variables are active.
- Many dashboard routes and widgets use **literal Tailwind colors** (`orange-*`, `rose-*`, `bg-white/50`, `gray-50`, pastel `*-50` callouts). Those **do not** read `--color-primary` or `--color-card`, so Sunset stays visually “wrong” (light glass, orange accents).

Marketing and playground already branch with `useBrand()` or use tokens; **dashboard largely does not**.

## Recommended approach (single codebase)

**Prefer semantic tokens** so one class string works for both brands:

| Pattern today | Target |
|---------------|--------|
| `bg-white/50 backdrop-blur-sm` cards | `bg-card/80 border border-border/80 backdrop-blur-sm` (or `Card` defaults + light border) |
| `DialogContent ... bg-white/95` | Remove override; use [packages/ui `DialogContent`](packages/ui/src/components/dialog.tsx) defaults, or `bg-popover text-popover-foreground border-border` |
| `text-orange-500`, `border-orange-*`, `hover:bg-orange-50` | `text-primary`, `border-primary/40`, `hover:bg-primary/10` |
| `bg-gradient-to-r from-orange-500 to-rose-500` (CTAs, headings) | `bg-primary text-primary-foreground hover:bg-primary/90` for buttons; for “hero” text use `text-primary` or a short gradient using `from-primary to-primary` / existing `.sunset-wordmark` patterns only where you truly need gradient |
| Page shells `min-h-screen bg-gradient-to-br from-orange-50 ...` (e.g. balance) | `bg-background` or a **subtle** `bg-gradient-to-b from-background to-card/40` that relies on CSS variables (no orange literals) |
| Pastel callouts `bg-blue-50 border-blue-200` | Same pattern as SOS/PWA work: `border-primary/35 bg-primary/10` + `text-foreground` / `text-muted-foreground` (or `destructive` / `amber` **with opacity**, not `*-50` paper backgrounds) |

Optional: add `sunset-panel` from [packages/ui/src/themes/sunset.css](packages/ui/src/themes/sunset.css) on select surfaces for extra depth on Sunset only (class is inert when `data-brand` is not `sunset`).

**Copy / icons:** Use `useBrand()` from `@repo/ui/brand-provider` only where the user sees a product name or you must swap the Lucide `Sunrise` icon (pattern already in [apps/sunrise-web/app/login/page.tsx](apps/sunrise-web/app/login/page.tsx)).

## Scope: files to touch (inventory from repo search)

### Dashboard routes (`apps/sunrise-web/app/dashboard/`)

High density of hardcoded light/orange styling:

- [apps/sunrise-web/app/dashboard/page.tsx](apps/sunrise-web/app/dashboard/page.tsx)
- [apps/sunrise-web/app/dashboard/balance/page.tsx](apps/sunrise-web/app/dashboard/balance/page.tsx) (full-page orange gradient + many CTAs)
- [apps/sunrise-web/app/dashboard/contacts/page.tsx](apps/sunrise-web/app/dashboard/contacts/page.tsx) (dialogs, import panels, orange selection ring)
- [apps/sunrise-web/app/dashboard/events/create/page.tsx](apps/sunrise-web/app/dashboard/events/create/page.tsx)
- [apps/sunrise-web/app/dashboard/events/page.tsx](apps/sunrise-web/app/dashboard/events/page.tsx), [apps/sunrise-web/app/dashboard/events/[id]/page.tsx](apps/sunrise-web/app/dashboard/events/[id]/page.tsx)
- [apps/sunrise-web/app/dashboard/messages/page.tsx](apps/sunrise-web/app/dashboard/messages/page.tsx)
- [apps/sunrise-web/app/dashboard/referrals/page.tsx](apps/sunrise-web/app/dashboard/referrals/page.tsx)
- [apps/sunrise-web/app/dashboard/notifications/page.tsx](apps/sunrise-web/app/dashboard/notifications/page.tsx)
- [apps/sunrise-web/app/dashboard/sos/page.tsx](apps/sunrise-web/app/dashboard/sos/page.tsx) (many outline buttons with `*-50` hovers)
- [apps/sunrise-web/app/dashboard/data-management/page.tsx](apps/sunrise-web/app/dashboard/data-management/page.tsx)
- Log / integration UIs: [email-logs](apps/sunrise-web/app/dashboard/email-logs/page.tsx), [telegram-logs](apps/sunrise-web/app/dashboard/telegram-logs/page.tsx), [slack-logs](apps/sunrise-web/app/dashboard/slack-logs/page.tsx), [discord-logs](apps/sunrise-web/app/dashboard/discord-logs/page.tsx), [slack-settings](apps/sunrise-web/app/dashboard/slack-settings/page.tsx), [discord-settings](apps/sunrise-web/app/dashboard/discord-settings/page.tsx)
- Admin: [admin/page.tsx](apps/sunrise-web/app/dashboard/admin/page.tsx), [admin/manage-users/page.tsx](apps/sunrise-web/app/dashboard/admin/manage-users/page.tsx)
- Smaller: [settings/page.tsx](apps/sunrise-web/app/dashboard/settings/page.tsx), [export-contacts/page.tsx](apps/sunrise-web/app/dashboard/export-contacts/page.tsx), [emergency-alerts/page.tsx](apps/sunrise-web/app/dashboard/emergency-alerts/page.tsx) (spinner `border-orange-500` → `border-primary`)

### Shared components used inside authenticated app

- [apps/sunrise-web/components/dashboard-nav.tsx](apps/sunrise-web/components/dashboard-nav.tsx): Pro tier `text-orange-500`, `bg-orange-100` badge → `text-primary` / `bg-primary/15`
- [apps/sunrise-web/components/floating-help-button.tsx](apps/sunrise-web/components/floating-help-button.tsx): orange–rose gradient → `bg-primary` (or `bg-gradient-to-r from-primary to-primary` if you want a single gradient token later)
- [apps/sunrise-web/components/pwa-install-banner.tsx](apps/sunrise-web/components/pwa-install-banner.tsx): “Install Sunrise App” strings → `useBrand()` + `appName` (mirror [pwa-install-guide.tsx](apps/sunrise-web/components/pwa-install-guide.tsx))
- [apps/sunrise-web/components/upgrade-notice-banner.tsx](apps/sunrise-web/components/upgrade-notice-banner.tsx): “upgrading Sunrise” → brand-aware wording when `brand === "sunset"`
- [apps/sunrise-web/components/notification-permission.tsx](apps/sunrise-web/components/notification-permission.tsx): toast “Sunrise has been installed” + any light cards if present (quick grep after dashboard pass)

**Out of scope unless you want a second phase:** public marketing [home-redesign.tsx](apps/sunrise-web/components/public/home-redesign.tsx) / [features-redesign.tsx](apps/sunrise-web/components/public/features-redesign.tsx) (Sunset uses [sunset-home-marketing.tsx](apps/sunrise-web/components/public/sunset-home-marketing.tsx)); API templates mentioning “Sunrise Emergency System”.

## Implementation order

1. **Shared chrome** (nav, floating help, PWA banner, upgrade banner) so every dashboard route improves immediately.
2. **Largest surfaces:** `balance/page.tsx`, `contacts/page.tsx`, main `dashboard/page.tsx`, `events/create/page.tsx`.
3. **Remaining dashboard pages** in batches (messages, referrals, logs, settings, admin, sos).
4. **Verification:** Load Sunset host or `IS_SUNSET` locally; spot-check contrast on dialogs, tables, and primary buttons; keep Sunrise host check so orange identity still reads as warm (via `--color-primary` on Sunrise theme, not hardcoded `orange-500` where avoidable).

## Notes

- No second Next app: Sunset remains the same [apps/sunrise-web](apps/sunrise-web) tree with `data-brand="sunset"` per [AGENTS.md](AGENTS.md).
- Avoid markdown tables in PR descriptions; use short bullet lists.
- User rule: avoid em dash in customer-facing strings when editing copy.
