# Database migrations (Neon)

Apply migrations in order against the **production** `DATABASE_URL` before deploying app changes that depend on new tables.

## Apply

```bash
psql "$DATABASE_URL" -f db/migrations/0001_create_transactions.sql
```

On Windows PowerShell:

```powershell
psql $env:DATABASE_URL -f db/migrations/0001_create_transactions.sql
```

Or use the Neon MCP / SQL editor in the Neon console.

## Migrations

| File | Purpose |
|------|---------|
| `0001_create_transactions.sql` | Token/billing ledger (`transactions` table) for wallet, Stripe, and usage history |

## Verify

```sql
select to_regclass('public.transactions');
select column_name, data_type
from information_schema.columns
where table_schema = 'public' and table_name = 'transactions'
order by ordinal_position;
```
