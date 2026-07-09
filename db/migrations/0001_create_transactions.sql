-- Token and billing ledger (Neon / Postgres).
-- Apply: psql "$DATABASE_URL" -f db/migrations/0001_create_transactions.sql

create table if not exists public.transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  type text not null,
  amount double precision not null,
  description text,
  status text not null default 'completed',
  created_at timestamptz not null default now()
);

create index if not exists transactions_user_created_idx
  on public.transactions (user_id, created_at desc nulls last);

create index if not exists transactions_user_status_idx
  on public.transactions (user_id, status);
