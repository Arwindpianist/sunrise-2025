# Vercel deployment: Sunrise and Sunset

Sunrise and Sunset are **not two separate codebases**. Both brands run from **`apps/sunrise-web`** in this monorepo. Brand is chosen at runtime from the request hostname (or env on single-brand projects).

## Architecture recap

| Item | Value |
|------|--------|
| App root for Vercel | `apps/sunrise-web` |
| Install | `cd ../.. && pnpm install --frozen-lockfile` |
| Build | `cd ../.. && pnpm exec turbo run build --filter=sunrise-web` |
| Database | Shared Neon Postgres (`DATABASE_URL`) |
| Auth | NextAuth + Neon (`NEXTAUTH_URL`, `NEXTAUTH_SECRET`) |
| Legacy Supabase client | Compat shim over Neon (`lib/compat/supabase-js.ts`) |

---

## Choose a deployment model

### Option A — One Vercel project, two custom domains (recommended)

One production deployment serves **both** `sunrise-2025.com` and `sunset-2025.com`. Brand resolves from hostname.

**Pros:** One env set, one Stripe webhook URL, one Neon connection, simplest ops.  
**Cons:** `NEXT_PUBLIC_SITE_URL` is a single canonical origin (metadata/emails); per-request host still drives UI brand.

**Steps**

1. Create or use one Vercel project linked to this repo.
2. **Settings → General → Root Directory:** `apps/sunrise-web`
3. **Settings → Domains:** add both production domains (and `www` variants).
4. **Environment variables (Production):**

```env
# Core
DATABASE_URL=postgresql://...
NEXTAUTH_SECRET=<long-random>
NEXTAUTH_URL=https://sunrise-2025.com

# Canonical site URL (emails, Stripe return URLs default here)
NEXT_PUBLIC_SITE_URL=https://sunrise-2025.com

# Hostname → brand (required for dual-domain on one project)
NEXT_PUBLIC_SUNRISE_HOSTS=sunrise-2025.com,www.sunrise-2025.com
NEXT_PUBLIC_SUNSET_HOSTS=sunset-2025.com,www.sunset-2025.com

# Subscription API referer allowlist (auto-includes host lists above; optional extra)
ALLOWED_APP_HOSTS=sunrise-2025.com,www.sunrise-2025.com,sunset-2025.com,www.sunset-2025.com

# Do NOT set NEXT_PUBLIC_BRAND_ID when using host lists
```

5. Deploy from `main` (see `apps/sunrise-web/vercel.json`).
6. Verify:
   - `https://sunrise-2025.com` → warm Sunrise home
   - `https://sunset-2025.com` → dark Sunset home (`data-brand="sunset"`)

**Stripe:** One webhook endpoint is enough if both domains hit the same deployment. Return URLs use `NEXT_PUBLIC_SITE_URL`; users on Sunset domain still complete checkout on that host’s session.

---

### Option B — Two Vercel projects, one domain each

Same git repo, **two** Vercel projects, both with Root Directory `apps/sunrise-web`.

| Project | Domain | Key env difference |
|---------|--------|-------------------|
| `sunrise-2025` | `sunrise-2025.com` | `NEXT_PUBLIC_BRAND_ID=sunrise`, `NEXT_PUBLIC_SITE_URL=https://sunrise-2025.com`, `NEXTAUTH_URL=https://sunrise-2025.com` |
| `sunset-2025` | `sunset-2025.com` | `NEXT_PUBLIC_BRAND_ID=sunset`, `NEXT_PUBLIC_SITE_URL=https://sunset-2025.com`, `NEXTAUTH_URL=https://sunset-2025.com` |

**Shared across both projects (same values):**

- `DATABASE_URL` (same Neon database)
- `NEXTAUTH_SECRET` (must match if users should share sessions across domains — usually **use one secret**)
- Stripe keys, Zoho SMTP, Telegram, etc.

**Per-project only:**

- `NEXT_PUBLIC_SITE_URL`
- `NEXTAUTH_URL`
- `NEXT_PUBLIC_BRAND_ID`
- `OUTGOING_EMAIL_FROM` / copy if brand-specific

**Steps for each project**

1. **Add New Project** → import same GitHub repo.
2. Root Directory: `apps/sunrise-web`
3. Set env vars for that brand (table above).
4. Attach the matching custom domain.
5. **Stripe:** add a second webhook URL for the Sunset project if you want isolated webhook logs, or point both domains to one project (Option A).

---

## Environment variable checklist (production)

Copy from `.env.example` and set in Vercel **Production** (and Preview if needed).

### Required

| Variable | Notes |
|----------|--------|
| `DATABASE_URL` | Neon pooled connection string |
| `NEXTAUTH_SECRET` | `openssl rand -base64 32` |
| `NEXTAUTH_URL` | `https://<primary-domain>` |
| `NEXT_PUBLIC_SITE_URL` | Same as primary marketing origin |
| `ZOHO_SMTP_*` / `OUTGOING_EMAIL_FROM` | Outbound email |
| `STRIPE_SECRET_KEY` | Server |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Client |
| `STRIPE_WEBHOOK_SECRET` | From Stripe dashboard |

### Brand (pick one strategy)

- **Option A:** `NEXT_PUBLIC_SUNRISE_HOSTS` + `NEXT_PUBLIC_SUNSET_HOSTS`
- **Option B:** `NEXT_PUBLIC_BRAND_ID=sunrise` or `sunset`

### Upgrade-phase flags (current defaults)

```env
NEXT_PUBLIC_ENABLE_PWA_GLOBAL=false
NEXT_PUBLIC_ENABLE_GLOBAL_FLOATING_SOS=false
NEXT_PUBLIC_ENABLE_SOS=false
NEXT_PUBLIC_SHOW_UPGRADE_NOTICE=true
ENABLE_EMAIL_CRON=false
```

### Legacy Supabase (optional)

Leave **empty** if using Neon only. The compat layer talks to Postgres directly; old variable names are not required for prod.

---

## Database before first prod deploy

1. Neon project provisioned (see `docs/neon-migration-runbook.md`).
2. Apply pending SQL migrations:

```bash
psql "$DATABASE_URL" -f db/migrations/0001_create_transactions.sql
```

3. Smoke test:

```sql
select count(*) from users;
select count(*) from transactions;
```

---

## Local parity

```powershell
# Sunrise (port 3000)
pnpm dev

# Sunset preview (port 3001, sets IS_SUNSET)
pnpm dev:sunset
```

Production **ignores** `IS_SUNSET`; use host lists or `NEXT_PUBLIC_BRAND_ID` on Vercel.

---

## Pre-push checklist

- [ ] `pnpm exec turbo run build --filter=sunrise-web` succeeds locally
- [ ] `DATABASE_URL` migrations applied on prod Neon
- [ ] Vercel Root Directory = `apps/sunrise-web`
- [ ] Brand env configured (Option A or B)
- [ ] `NEXTAUTH_URL` matches the domain users sign in on
- [ ] Stripe webhook points to `https://<domain>/api/webhooks/stripe`
- [ ] Remove or disable debug API routes in prod if desired (`/api/test-*`, `/api/debug-*`)
- [ ] Turn off `NEXT_PUBLIC_SHOW_UPGRADE_NOTICE` when migration messaging is no longer needed

---

## Troubleshooting

| Symptom | Fix |
|---------|-----|
| Sunset shows Sunrise theme on prod | Set `NEXT_PUBLIC_SUNSET_HOSTS` or deploy with `NEXT_PUBLIC_BRAND_ID=sunset` |
| Subscription upgrade 403 | Add domain to `ALLOWED_APP_HOSTS` or host lists |
| Wallet 500 / missing `transactions` | Run `db/migrations/0001_create_transactions.sql` on Neon |
| Build fails on Turbopack | Build uses `next build --webpack` in `apps/sunrise-web/package.json` |
| Login redirect loop | `NEXTAUTH_URL` must match the live origin exactly |

---

## CLI quick reference

```bash
# Link monorepo (from repo root)
vercel link

# Pull env from Vercel (into apps/sunrise-web or root per your setup)
vercel env pull apps/sunrise-web/.env.local

# Preview deploy
vercel --cwd apps/sunrise-web

# Production (after linking)
vercel --cwd apps/sunrise-web --prod
```

For two-project setup, run `vercel link` separately in each Vercel project and use distinct `.env.local` files or Vercel env scopes.
