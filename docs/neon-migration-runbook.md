# Neon Migration Runbook

## 1) Export from Supabase

Use Supabase dashboard backup export or MCP SQL export flow.

Expected artifacts:
- `schema.sql`
- `data.sql` (or one consolidated `backup.sql`)

## 2) Import to Neon

Run against your Neon `DATABASE_URL`:

```sql
\i db/migrations/0001_neon_auth_foundation.sql
```

Then import backup SQL files in this order:
1. schema
2. data

If your source is the checked-in dump file, run:

`node scripts/import-backup-to-neon.mjs`

## 3) Set Environment Variables

Required:
- `DATABASE_URL`
- `NEXTAUTH_URL`
- `NEXTAUTH_SECRET`
- `ZOHO_SMTP_HOST`
- `ZOHO_SMTP_PORT`
- `ZOHO_EMAIL_USER`
- `ZOHO_EMAIL_PASSWORD`
- `OUTGOING_EMAIL_FROM` (set to `marketing@sunrise-2025.com`)

Upgrade-phase toggles:
- `NEXT_PUBLIC_ENABLE_PWA_GLOBAL=false`
- `NEXT_PUBLIC_ENABLE_GLOBAL_FLOATING_SOS=false`
- `NEXT_PUBLIC_ENABLE_SOS=false`
- `NEXT_PUBLIC_SHOW_UPGRADE_NOTICE=true`
- `ENABLE_EMAIL_CRON=false`

Legacy Supabase variables can be removed after all Supabase code paths are migrated:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

## 4) Verify

Run:

```sql
select count(*) from users;
select count(*) from events;
select count(*) from contacts;
select to_regclass('public.transactions');
```

Confirm auth columns exist:

```sql
select column_name
from information_schema.columns
where table_name='users' and column_name in ('password_hash','deleted');
```

Apply app migrations after import (see `db/migrations/README.md`):

```bash
psql "$DATABASE_URL" -f db/migrations/0001_create_transactions.sql
```

## 5) Customer Messaging During Upgrade

- Keep upgrade notice banner enabled (`NEXT_PUBLIC_SHOW_UPGRADE_NOTICE=true`).
- Keep login and forgot-password pages visible with password reset guidance.
- If existing users cannot log in, direct them to `/forgot-password` to establish a new Neon-backed password hash.
