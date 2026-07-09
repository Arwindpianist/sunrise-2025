-- Add credential auth fields to existing users table
alter table if exists users
  add column if not exists password_hash text,
  add column if not exists deleted boolean default false;

create unique index if not exists users_email_unique_idx on users (lower(email));

-- NextAuth adapter-compatible tables
create table if not exists accounts (
  id text primary key,
  "userId" uuid not null references users(id) on delete cascade,
  type text not null,
  provider text not null,
  "providerAccountId" text not null,
  refresh_token text,
  access_token text,
  expires_at bigint,
  token_type text,
  scope text,
  id_token text,
  session_state text
);

create unique index if not exists accounts_provider_provider_account_idx
  on accounts(provider, "providerAccountId");

create table if not exists sessions (
  id text primary key,
  "sessionToken" text not null unique,
  "userId" uuid not null references users(id) on delete cascade,
  expires timestamptz not null
);

create table if not exists verification_tokens (
  identifier text not null,
  token text not null unique,
  expires timestamptz not null,
  primary key (identifier, token)
);
