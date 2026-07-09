# Deployment

This monorepo deploys **one Next.js app** (`apps/sunrise-web`) that powers **both Sunrise and Sunset** brands.

## Quick links

- **Dual-brand Vercel guide:** [docs/VERCEL_SUNRISE_SUNSET.md](docs/VERCEL_SUNRISE_SUNSET.md)
- **Neon migration:** [docs/neon-migration-runbook.md](docs/neon-migration-runbook.md)
- **DB migrations:** [db/migrations/README.md](db/migrations/README.md)
- **Contributor layout:** [AGENTS.md](AGENTS.md)

## Vercel settings

| Setting | Value |
|---------|--------|
| Root Directory | `apps/sunrise-web` |
| Framework | Next.js |
| Install Command | `cd ../.. && pnpm install --frozen-lockfile` |
| Build Command | `cd ../.. && pnpm exec turbo run build --filter=sunrise-web` |
| Production branch | `main` (see `apps/sunrise-web/vercel.json`) |

## Build locally before push

```powershell
cd c:\Users\arwin\Desktop\ADPMC\sunrise-2025
pnpm install
pnpm exec turbo run build --filter=sunrise-web
```

## Two domains, one codebase

You do **not** need `apps/sunset-web` (stub only). Either:

1. **One Vercel project** + `NEXT_PUBLIC_SUNRISE_HOSTS` / `NEXT_PUBLIC_SUNSET_HOSTS` (recommended), or  
2. **Two Vercel projects** + `NEXT_PUBLIC_BRAND_ID` per project.

Full steps: [docs/VERCEL_SUNRISE_SUNSET.md](docs/VERCEL_SUNRISE_SUNSET.md).

## Branch workflow

- **`main`** → production deploys (when enabled in Vercel)
- **`beta`** → development; disable auto-deploy in Vercel Git settings if you use a beta branch

```bash
npm run release   # merge beta → main when ready
```

## Pre-production checklist

See the checklist in [docs/VERCEL_SUNRISE_SUNSET.md](docs/VERCEL_SUNRISE_SUNSET.md#pre-push-checklist).
