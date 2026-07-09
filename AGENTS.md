# Agent and contributor notes

## Monorepo layout

This repository uses **pnpm workspaces** and **Turborepo**.

- **Sunrise** is **`apps/sunrise-web`** (Next.js App Router). Imports use `@/*` inside that app. Shared libraries use **`@repo/*`**.
- **Sunset** is the **same codebase** as Sunrise (`apps/sunrise-web`). Only **theme** (`data-brand="sunset"` / `sunset.css`), **wording** (registry + `useBrand()`), and **templates** differ. The folder **`apps/sunset-web`** is a stub with README only; do not add a second Next app there.
- **`packages/*`** holds shared libraries. Apps may depend on packages; packages must not import from apps.

### First-time folder migration (Windows)

If `app/`, `components/`, and `lib/` still live at the repo root, run the migration script once **from native PowerShell** (avoid Git Bash if it routes through a broken WSL install):

```powershell
cd c:\Users\arwin\Desktop\ADPMC\sunrise-2025
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass -Force
.\scripts\restructure-sunrise-to-apps.ps1
pnpm install
pnpm dev
```

At the repo root, **`pnpm dev`** runs Sunrise and **restarts Next** when root or `apps/sunrise-web` **`.env` / `.env.local`** change (so `IS_SUNSET` toggles reload). Use **`pnpm dev:no-watch`** if you want plain `next dev` without that watcher.

**Swap brands locally:** `pnpm brand` toggles Sunrise/Sunset in `.env.local` (`pnpm brand:sunrise`, `pnpm brand:sunset`, `pnpm brand:status`). Production uses host lists or per-project `NEXT_PUBLIC_BRAND_ID`, not these toggles.

The script moves Sunrise into `apps/sunrise-web`, rewrites Tailwind `../packages/` paths in `app/globals.css` to `../../../packages/`, copies `.env.local` into the app folder, and removes duplicate root configs (`next.config.ts`, `middleware.ts`, root `tsconfig.json`, `vercel.json`, etc.) after the app exists under `apps/sunrise-web`.

**Vercel:** set project **Root Directory** to `apps/sunrise-web`. Use `apps/sunrise-web/vercel.json` (`installCommand` / `buildCommand` assume the monorepo root is two levels up).

### Package boundaries

| Package               | Role |
|-----------------------|------|
| `@repo/shared-types`  | `BrandId` and cross-cutting types. |
| `@repo/config`        | Brand registry, `getEffectiveBrandId`, subscription referer allowlist helpers. |
| `@repo/ui`            | Primitives, `BrandProvider`, Tailwind-sourced components. |
| `@repo/db`            | Neon `pg` `Pool` singleton. |
| `@repo/auth`          | NextAuth options and password verification. |
| `@repo/billing`       | Subscription tiers and billing helpers. |
| `@repo/email`         | Zoho / nodemailer helpers. |
| `@repo/notifications` | Push notification helpers. |
| `@repo/core`          | Domain services (incremental). |

### Imports

- Prefer **`@repo/*`** for new code in apps and packages.
- Inside **`apps/sunrise-web`**, **`@/*`** maps to that app’s tree.
- **`@/components/ui/*`** resolves to **`packages/ui/src/*`**, except **`@/components/ui/sidebar`**, which may stay at **`apps/sunrise-web/components/ui/sidebar.tsx`** until migrated.

### Brand resolution (`getEffectiveBrandId`)

Production uses **`NEXT_PUBLIC_SUNSET_HOSTS`** / **`NEXT_PUBLIC_SUNRISE_HOSTS`** (comma-separated hostnames) and/or **`NEXT_PUBLIC_BRAND_ID`** (`sunset` | `sunrise`). For local and Vercel **preview** only, `IS_SUNSET` / `NEXT_PUBLIC_IS_SUNSET` can force Sunset theming; **`VERCEL_ENV === "production"` never honors those toggles.**

### Cleanup (artifacts and legacy root files)

- **`pnpm clean`**: deletes workspace **`node_modules`**, **`apps/sunrise-web/.next`**, **`.turbo`**, package **`dist`**, stub **`apps/sunset-web/node_modules`**, and legacy **`db_cluster*`** dump folders. Run **`pnpm install`** afterward.
- **`pnpm archive:sql`**: moves **`*.sql`** from the **repository root only** into **`archive/sql-root/`** (does not touch `db/migrations/`, `scripts/`, or `supabase/`).
- Remove local CSV exports and `.env*.backup` files from the root if present; they belong in `.gitignore`, not in git.

### Production deploy

- **Vercel Root Directory:** `apps/sunrise-web`
- **Dual-brand guide:** `docs/VERCEL_SUNRISE_SUNSET.md`
- **Build:** `pnpm exec turbo run build --filter=sunrise-web` (uses webpack for production)
- **DB:** apply `db/migrations/*.sql` on Neon before shipping wallet/billing changes
