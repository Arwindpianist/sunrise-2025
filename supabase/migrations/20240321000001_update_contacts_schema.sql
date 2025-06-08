-- Drop dependent tables first
drop table if exists public.email_logs;
drop table if exists public.event_contacts;

-- Drop contacts table with cascade
drop table if exists public.contacts cascade;

-- Create contacts table with correct schema
create table public.contacts (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  first_name text not null,
  last_name text not null,
  email text not null,
  phone text,
  category text default 'other',
  notes text,
  created_at timestamp with time zone default now() not null,
  unique(user_id, email)
);

-- Recreate event_contacts table
create table public.event_contacts (
  id uuid default gen_random_uuid() primary key,
  event_id uuid references public.events(id) on delete cascade not null,
  contact_id uuid references public.contacts(id) on delete cascade not null,
  status text default 'pending' check (status in ('pending', 'sent', 'failed', 'opened')),
  sent_at timestamp with time zone,
  opened_at timestamp with time zone,
  created_at timestamp with time zone default now() not null,
  unique(event_id, contact_id)
);

-- Recreate email_logs table
create table public.email_logs (
  id uuid default gen_random_uuid() primary key,
  event_id uuid references public.events(id) on delete cascade not null,
  contact_id uuid references public.contacts(id) on delete cascade not null,
  status text not null check (status in ('sent', 'failed', 'opened')),
  error_message text,
  sent_at timestamp with time zone default now() not null,
  opened_at timestamp with time zone
);

-- Add RLS policies for contacts
alter table public.contacts enable row level security;

create policy "Users can view their own contacts"
  on public.contacts for select
  using (auth.uid() = user_id);

create policy "Users can insert their own contacts"
  on public.contacts for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own contacts"
  on public.contacts for update
  using (auth.uid() = user_id);

create policy "Users can delete their own contacts"
  on public.contacts for delete
  using (auth.uid() = user_id);

-- Add RLS policies for event_contacts
alter table public.event_contacts enable row level security;

create policy "Users can view their event contacts"
  on public.event_contacts for select
  using (
    exists (
      select 1 from public.events
      where events.id = event_contacts.event_id
      and events.user_id = auth.uid()
    )
  );

create policy "Users can insert their event contacts"
  on public.event_contacts for insert
  with check (
    exists (
      select 1 from public.events
      where events.id = event_contacts.event_id
      and events.user_id = auth.uid()
    )
  );

create policy "Users can update their event contacts"
  on public.event_contacts for update
  using (
    exists (
      select 1 from public.events
      where events.id = event_contacts.event_id
      and events.user_id = auth.uid()
    )
  );

create policy "Users can delete their event contacts"
  on public.event_contacts for delete
  using (
    exists (
      select 1 from public.events
      where events.id = event_contacts.event_id
      and events.user_id = auth.uid()
    )
  );

-- Add RLS policies for email_logs
alter table public.email_logs enable row level security;

create policy "Users can view their email logs"
  on public.email_logs for select
  using (
    exists (
      select 1 from public.events
      where events.id = email_logs.event_id
      and events.user_id = auth.uid()
    )
  );

-- Add check constraint for valid categories
alter table public.contacts
add constraint valid_category
check (category in ('family', 'friend', 'guest', 'other')); 