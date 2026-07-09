---
name: Dashboard perf and UX refresh
overview: Improve perceived performance and interaction smoothness on `/dashboard/**` and `/onboarding/[token]` by introducing a dedicated dashboard shell, code-splitting heavy client islands, incremental Server Components where feasible, and aligning `@repo/ui` (shadcn) primitives with a consistent motion and layout system. Sunrise and Sunset stay one codebase via semantic tokens (`primary`, `card`, etc.).
todos:
  - id: baseline-metrics
    content: Establish Lighthouse/INP + optional bundle analyzer baseline on dashboard home, contacts, admin
    status: completed
  - id: dashboard-shell
    content: Add app/dashboard/layout.tsx + DashboardShell (SidebarProvider, integrate dashboard-nav or sidebar menu); adjust Header for /dashboard to reduce marketing chrome duplication
    status: completed
  - id: loading-dynamic
    content: Add dashboard/loading.tsx (+ onboarding optional); dynamic-import PhoneImport, admin Recharts, heavy dialogs
    status: completed
  - id: data-dedupe
    content: Subscription/dashboard data dedupe (context or SWR); extend overview API where widgets fan out
    status: completed
  - id: split-mega-pages
    content: Extract contacts/admin/sos into feature components; memoize rows; virtualize lists if needed
    status: completed
  - id: rsc-incremental
    content: Migrate read-heavy dashboard routes + optional onboarding wrapper to RSC + client islands
    status: completed
  - id: shadcn-sync
    content: Refresh packages/ui via shadcn CLI; unify Radix versions; PageHeader + motion conventions; consolidate Sonner vs Radix toaster
    status: completed
  - id: verify-brands
    content: QA Sunrise + Sunset; perf spot-check INP on key flows
    status: completed
isProject: false
---

# Authorized-area performance and shadcn UX refresh

## Scope (confirmed)

- **[`apps/sunrise-web/app/dashboard/`](apps/sunrise-web/app/dashboard/)** (all nested routes).
- **[`apps/sunrise-web/app/onboarding/[token]/page.tsx`](apps/sunrise-web/app/onboarding/[token]/page.tsx)** (public token flow; same UI tokens as rest of app).

Sunrise vs Sunset: no forked pages. Continue using **`data-brand`** and semantic Tailwind tokens so both themes stay correct ([`packages/ui/src/themes/sunset.css`](packages/ui/src/themes/sunset.css), Sunrise defaults).

## Current constraints (why it feels laggy)

- **Entire dashboard routes are `"use client"`** ([e.g. dashboard home](apps/sunrise-web/app/dashboard/page.tsx), [contacts](apps/sunrise-web/app/dashboard/contacts/page.tsx)): large JS bundles hydrate on every navigation; little use of streaming or server-first data.
- **Very large page files** (contacts ~1700+ lines): hard for the bundler to tree-shake and for React to reconcile cheaply.
- **Global chrome**: [`app/layout.tsx`](apps/sunrise-web/app/layout.tsx) always mounts marketing [`Header`](apps/sunrise-web/components/header.tsx) + `Footer` for dashboard users; no nested dashboard layout yet.
- **Heavy imports**: e.g. **Recharts** only on [`app/dashboard/admin/page.tsx`](apps/sunrise-web/app/dashboard/admin/page.tsx) still pulls chart code into the admin route bundle.
- **Orphan nav**: [`components/dashboard-nav.tsx`](apps/sunrise-web/components/dashboard-nav.tsx) is **not imported anywhere** (grep shows no consumers); dashboard relies on the marketing header for primary navigation instead of the existing [**shadcn Sidebar** implementation](apps/sunrise-web/components/ui/sidebar.tsx).

UI primitives: **`@/components/ui/*` resolves to [`packages/ui/src/*`](packages/ui)** ([`apps/sunrise-web/tsconfig.json`](apps/sunrise-web/tsconfig.json)); [`components.json`](apps/sunrise-web/components.json) targets New York style. Updates belong in **`@repo/ui`** so every consumer stays aligned.

---

## Phase A: Measurement (short)

- Pick 3 routes: dashboard home, contacts, admin. Record **LCP / INP** (Lighthouse or Web Vitals in dev) and a quick **React Profiler** interaction trace (open dialog, scroll list).
- Optional: enable **bundle analyzer** (`@next/bundle-analyzer`) for one build to confirm largest chunks (Recharts, mega route files).

---

## Phase B: Architecture and perceived performance (high ROI)

1. **Add [`app/dashboard/layout.tsx`](apps/sunrise-web/app/dashboard/layout.tsx)**  
   - Introduce a **`DashboardShell`** client component: wrap with **`SidebarProvider`** from [`components/ui/sidebar.tsx`](apps/sunrise-web/components/ui/sidebar.tsx), render **sidebar + main** with consistent padding and optional compact top bar.  
   - **Merge or slim header behavior**: either (preferred) **hide marketing nav links** when `pathname.startsWith('/dashboard')` inside [`Header`](apps/sunrise-web/components/header.tsx), or render a **minimal dashboard header** only inside the shell so users are not scrolling past duplicate marketing chrome. Decision should match product (keep logo + account vs full marketing links).

2. **Wire [`dashboard-nav.tsx`](apps/sunrise-web/components/dashboard-nav.tsx)** into the shell (or fold its links into Sidebar groups) and replace **`return null`** loading with **[`Skeleton`](packages/ui/src/skeleton.tsx)** placeholders to avoid layout jump.

3. **Route-level `loading.tsx`** under `app/dashboard/` (and optionally `app/onboarding/`) using skeleton patterns aligned with the shell so navigations feel instant.

4. **Code splitting**  
   - **`next/dynamic`** for [PhoneImport](apps/sunrise-web/components/phone-import.tsx), admin chart module, and other multi-KB dialogs.  
   - Lazy-load large feature sections inside contacts / admin / SOS after extracting subcomponents.

5. **Data-fetch efficiency**  
   - Introduce a small **Dashboard or Subscription provider** (or **SWR**) so `useSubscription` and repeated `/api/*` calls are **deduped** across `SubscriptionStatus`, nav badges, and tier-gated UI.  
   - Prefer **one overview endpoint** where multiple widgets today fan out (dashboard home already uses `/api/dashboard/overview`; extend pattern).

6. **Lists**  
   - After baseline, if lists are large: **virtualize** contact/admin tables (e.g. `@tanstack/react-virtual`) behind a stable row component.

---

## Phase C: Incremental Server Components (where safe)

- Convert **read-mostly** dashboard pages to **async Server Components** that fetch on the server (cookies/session via existing auth patterns), passing serializable props into **small client islands** (filters, dialogs, Supabase-heavy interactions stay client).  
- Keep **Supabase realtime**, **file upload**, and **clipboard** flows as client components.

Onboarding: optionally split **`fetchLink`** into a server loader or RSC wrapper so the client bundle only handles the form.

---

## Phase D: shadcn / UX refresh (both brands)

1. **Registry alignment**  
   - Run the **shadcn CLI** against **`packages/ui`** (adjust working directory or `components.json` copy so generated files land under [`packages/ui/src`](packages/ui/src)).  
   - Align **Radix** versions across root and `@repo/ui` [`package.json`](packages/ui/package.json) / [`apps/sunrise-web/package.json`](apps/sunrise-web/package.json) to avoid duplicates.

2. **Consistency**  
   - Add a thin **`PageHeader`** (title, description, actions) and **section spacing** conventions for dashboard + onboarding.  
   - Reuse **Card**, **Button**, **Tabs**, **Sheet** patterns from `@repo/ui`; refresh destructive/muted variants for dark Sunset surfaces.

3. **Motion**  
   - Prefer **`tw-animate-css`** (already [devDependency](apps/sunrise-web/package.json)) + Tailwind transitions; gate with **`motion-safe:`** and **`prefers-reduced-motion`**.  
   - Avoid adding **framer-motion** unless profiling shows CSS is insufficient (keeps bundle smaller).

4. **Toasts**  
   - **Sonner** is already a dependency; **`Toaster`** from Radix exists in UI package. Pick **one** primary toast path and deprecate the other to reduce duplication and subtle styling drift.

---

## Phase E: Verification

- **Functional**: login, dashboard nav, SOS, contacts import dialog, admin charts.  
- **Both brands**: Sunrise host / Sunset host or local `IS_SUNSET` preview per [AGENTS.md](AGENTS.md).  
- **Perf**: compare INP before/after on contacts and admin; confirm no regression on marketing routes.

---

## Risk notes

- **Nested layout + Header**: avoid double navigation and wasted vertical space; explicit UX decision when implementing the shell.  
- **SOS page** is huge and sensitive; refactor with **extract-only** steps and keep behavior unchanged.
