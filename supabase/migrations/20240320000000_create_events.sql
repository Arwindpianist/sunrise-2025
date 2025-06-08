-- Create events table
create table if not exists public.events (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  title text not null,
  description text,
  event_date timestamp with time zone not null,
  location text,
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null,
  status text default 'draft' check (status in ('draft', 'scheduled', 'sent', 'cancelled')),
  email_template text,
  email_subject text,
  scheduled_send_time timestamp with time zone
);

-- Create event_contacts table for managing event recipients
create table if not exists public.event_contacts (
  id uuid default gen_random_uuid() primary key,
  event_id uuid references public.events(id) on delete cascade not null,
  contact_id uuid references public.contacts(id) on delete cascade not null,
  status text default 'pending' check (status in ('pending', 'sent', 'failed', 'opened')),
  sent_at timestamp with time zone,
  opened_at timestamp with time zone,
  created_at timestamp with time zone default now() not null,
  unique(event_id, contact_id)
);

-- Create email_logs table for tracking email sends
create table if not exists public.email_logs (
  id uuid default gen_random_uuid() primary key,
  event_id uuid references public.events(id) on delete cascade not null,
  contact_id uuid references public.contacts(id) on delete cascade not null,
  status text not null check (status in ('sent', 'failed', 'opened')),
  error_message text,
  sent_at timestamp with time zone default now() not null,
  opened_at timestamp with time zone
);

-- Add RLS policies
alter table public.events enable row level security;
alter table public.event_contacts enable row level security;
alter table public.email_logs enable row level security;

-- Events policies
create policy "Users can view their own events"
  on public.events for select
  using (auth.uid() = user_id);

create policy "Users can insert their own events"
  on public.events for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own events"
  on public.events for update
  using (auth.uid() = user_id);

create policy "Users can delete their own events"
  on public.events for delete
  using (auth.uid() = user_id);

-- Event contacts policies
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

-- Email logs policies
create policy "Users can view their email logs"
  on public.email_logs for select
  using (
    exists (
      select 1 from public.events
      where events.id = email_logs.event_id
      and events.user_id = auth.uid()
    )
  );

create policy "Users can insert their email logs"
  on public.email_logs for insert
  with check (
    exists (
      select 1 from public.events
      where events.id = email_logs.event_id
      and events.user_id = auth.uid()
    )
  );

-- Create function to update updated_at timestamp
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Create trigger for events table
create trigger handle_events_updated_at
  before update on public.events
  for each row
  execute procedure public.handle_updated_at(); 