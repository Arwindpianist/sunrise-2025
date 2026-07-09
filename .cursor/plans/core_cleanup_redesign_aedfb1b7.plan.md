---
name: Core Cleanup Redesign
overview: Perform a focused sitewide cleanup that reduces runtime bloat while fully redesigning Event Creation, Email Sending, and Templates, and feature-flagging PWA/SOS for temporary pause.
todos:
  - id: flags-pause-noncore
    content: Add and wire feature flags to pause PWA/SOS/global widgets with safe fallbacks
    status: completed
  - id: redesign-event-creation
    content: Refactor event creation into modular step-based architecture and remove duplicated send logic
    status: completed
  - id: unify-email-pipeline
    content: Consolidate duplicate email APIs into one canonical Zoho-backed send pipeline
    status: completed
  - id: redesign-templates
    content: Create unified template engine/editor/preview replacing per-channel duplication
    status: completed
  - id: perf-hardening
    content: Trim background fan-out/debug overhead and clean remaining legacy paths
    status: completed
  - id: public-surface-alignment
    content: Apply redesign and cleanup to public-facing pages, shared copy, and project context docs
    status: completed
  - id: upgrade-banner-reset-guidance
    content: Add temporary upgrade banner/notices including login password-reset guidance across key touchpoints
    status: completed
isProject: false
---

# Core Cleanup + Full Redesign Plan

## Goals
- Reduce runtime bloat and lag by disabling non-core global features via flags.
- Fully redesign the three core modules: Event Creation, Email Sending, and Templates.
- Consolidate duplicate/legacy flows to a single maintainable architecture.
- Ensure updates are reflected in both authenticated dashboard and public-facing pages/content.
- Communicate upgrade status to users with clear temporary messaging and password-reset guidance.

## Phase 1: Stabilize Runtime and Pause Non-Core Features
- Add feature flags and gate global mounts in [`C:/Users/arwin/Desktop/ADPMC/sunrise-2025/app/layout.tsx`](C:/Users/arwin/Desktop/ADPMC/sunrise-2025/app/layout.tsx):
  - `NEXT_PUBLIC_ENABLE_PWA_GLOBAL`
  - `NEXT_PUBLIC_ENABLE_GLOBAL_FLOATING_SOS`
  - `NEXT_PUBLIC_ENABLE_GLOBAL_HELP`
  - `NEXT_PUBLIC_ENABLE_GA`
- Disable PWA + service worker registration when flag is off in:
  - [`C:/Users/arwin/Desktop/ADPMC/sunrise-2025/components/service-worker-register.tsx`](C:/Users/arwin/Desktop/ADPMC/sunrise-2025/components/service-worker-register.tsx)
  - [`C:/Users/arwin/Desktop/ADPMC/sunrise-2025/components/pwa-install-banner.tsx`](C:/Users/arwin/Desktop/ADPMC/sunrise-2025/components/pwa-install-banner.tsx)
- Pause SOS safely with feature flag guards in:
  - [`C:/Users/arwin/Desktop/ADPMC/sunrise-2025/app/dashboard/sos/page.tsx`](C:/Users/arwin/Desktop/ADPMC/sunrise-2025/app/dashboard/sos/page.tsx)
  - [`C:/Users/arwin/Desktop/ADPMC/sunrise-2025/components/floating-sos-button.tsx`](C:/Users/arwin/Desktop/ADPMC/sunrise-2025/components/floating-sos-button.tsx)
  - SOS API entry points under [`C:/Users/arwin/Desktop/ADPMC/sunrise-2025/app/api/sos/`](C:/Users/arwin/Desktop/ADPMC/sunrise-2025/app/api/sos/)

## Phase 2: Event Creation Full Redesign
- Replace monolithic create flow in [`C:/Users/arwin/Desktop/ADPMC/sunrise-2025/app/dashboard/events/create/page.tsx`](C:/Users/arwin/Desktop/ADPMC/sunrise-2025/app/dashboard/events/create/page.tsx) with a modular architecture:
  - step-based flow (Event details → Audience → Channel/Template → Review/Send)
  - extracted components per step
  - shared typed state + validation schema
- Remove duplicate send logic from:
  - [`C:/Users/arwin/Desktop/ADPMC/sunrise-2025/app/dashboard/events/page.tsx`](C:/Users/arwin/Desktop/ADPMC/sunrise-2025/app/dashboard/events/page.tsx)
  - [`C:/Users/arwin/Desktop/ADPMC/sunrise-2025/app/dashboard/events/[id]/page.tsx`](C:/Users/arwin/Desktop/ADPMC/sunrise-2025/app/dashboard/events/[id]/page.tsx)
- Keep event send actions routed through one canonical API path.

## Phase 3: Email Sending Full Redesign
- Consolidate duplicate email send APIs into one canonical route and remove legacy divergence:
  - current duplicates:
    - [`C:/Users/arwin/Desktop/ADPMC/sunrise-2025/app/api/email/send/route.ts`](C:/Users/arwin/Desktop/ADPMC/sunrise-2025/app/api/email/send/route.ts)
    - [`C:/Users/arwin/Desktop/ADPMC/sunrise-2025/app/api/messages/email/send/route.ts`](C:/Users/arwin/Desktop/ADPMC/sunrise-2025/app/api/messages/email/send/route.ts)
- Standardize on Zoho SMTP service only using [`C:/Users/arwin/Desktop/ADPMC/sunrise-2025/lib/zoho-email.ts`](C:/Users/arwin/Desktop/ADPMC/sunrise-2025/lib/zoho-email.ts) with `marketing@sunrise-2025.com` sender.
- Add structured send pipeline stages (validate event/contacts → render template → send → persist logs/status) and shared error model.

## Phase 4: Templates Full Redesign
- Build a single template engine and schema for variables/placeholders to replace per-channel duplication:
  - [`C:/Users/arwin/Desktop/ADPMC/sunrise-2025/components/email-templates.tsx`](C:/Users/arwin/Desktop/ADPMC/sunrise-2025/components/email-templates.tsx)
  - [`C:/Users/arwin/Desktop/ADPMC/sunrise-2025/components/telegram-templates.tsx`](C:/Users/arwin/Desktop/ADPMC/sunrise-2025/components/telegram-templates.tsx)
  - [`C:/Users/arwin/Desktop/ADPMC/sunrise-2025/components/discord-templates.tsx`](C:/Users/arwin/Desktop/ADPMC/sunrise-2025/components/discord-templates.tsx)
  - [`C:/Users/arwin/Desktop/ADPMC/sunrise-2025/components/slack-templates.tsx`](C:/Users/arwin/Desktop/ADPMC/sunrise-2025/components/slack-templates.tsx)
- Create one template picker/editor/preview experience and map channels through adapters.
- Preserve SOS templates but keep disabled behind flags while paused.

## Phase 5: Background Work and Performance Hardening
- Defer non-essential background fan-out and diagnostics by default:
  - [`C:/Users/arwin/Desktop/ADPMC/sunrise-2025/app/api/cron/send-scheduled-emails/route.ts`](C:/Users/arwin/Desktop/ADPMC/sunrise-2025/app/api/cron/send-scheduled-emails/route.ts)
  - [`C:/Users/arwin/Desktop/ADPMC/sunrise-2025/app/api/sos/send-multi-channel-emergency/route.ts`](C:/Users/arwin/Desktop/ADPMC/sunrise-2025/app/api/sos/send-multi-channel-emergency/route.ts)
- Minimize dashboard churn by reducing unnecessary global refresh behavior in [`C:/Users/arwin/Desktop/ADPMC/sunrise-2025/components/providers/supabase-provider.tsx`](C:/Users/arwin/Desktop/ADPMC/sunrise-2025/components/providers/supabase-provider.tsx).
- Remove/retire dead routes and debug endpoints after migration is complete.

## Phase 6: Public-Facing Alignment and Project Context
- Audit and update public pages so redesign language/visual direction is consistent beyond dashboard:
  - [`C:/Users/arwin/Desktop/ADPMC/sunrise-2025/app/page.tsx`](C:/Users/arwin/Desktop/ADPMC/sunrise-2025/app/page.tsx)
  - [`C:/Users/arwin/Desktop/ADPMC/sunrise-2025/app/pricing/page.tsx`](C:/Users/arwin/Desktop/ADPMC/sunrise-2025/app/pricing/page.tsx)
  - [`C:/Users/arwin/Desktop/ADPMC/sunrise-2025/app/features/page.tsx`](C:/Users/arwin/Desktop/ADPMC/sunrise-2025/app/features/page.tsx)
  - shared header/footer and contact/support surfaces.
- Update project context artifacts to match the temporary operating mode and architecture direction:
  - [`C:/Users/arwin/Desktop/ADPMC/sunrise-2025/docs/neon-migration-runbook.md`](C:/Users/arwin/Desktop/ADPMC/sunrise-2025/docs/neon-migration-runbook.md)
  - environment/template docs and migration notes.

## Phase 7: Upgrade Notice + Password Reset Guidance
- Add a temporary global upgrade banner (feature-flagged) on key public and auth routes:
  - [`C:/Users/arwin/Desktop/ADPMC/sunrise-2025/app/layout.tsx`](C:/Users/arwin/Desktop/ADPMC/sunrise-2025/app/layout.tsx)
  - [`C:/Users/arwin/Desktop/ADPMC/sunrise-2025/app/login/page.tsx`](C:/Users/arwin/Desktop/ADPMC/sunrise-2025/app/login/page.tsx)
  - [`C:/Users/arwin/Desktop/ADPMC/sunrise-2025/app/forgot-password/page.tsx`](C:/Users/arwin/Desktop/ADPMC/sunrise-2025/app/forgot-password/page.tsx)
- Include explicit customer messaging:
  - service is currently being upgraded,
  - existing users may need to reset passwords,
  - direct CTA to password reset flow.
- Add a dedicated flag (for example `NEXT_PUBLIC_SHOW_UPGRADE_NOTICE`) so notice can be turned off without code churn.

## Deliverables
- Feature-flagged pause for PWA/SOS and optional global widgets.
- New modular Event Creation flow.
- Single canonical Email Sending architecture (Zoho-only).
- Unified Template system with shared editor/preview.
- Reduced background overhead and cleaner runtime profile.
- Public-facing pages and project docs aligned with the new architecture and temporary paused features.
- Visible upgrade/reset communication in login and public surfaces with controlled feature-flag rollout.