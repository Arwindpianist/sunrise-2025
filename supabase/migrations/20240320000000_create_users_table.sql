-- Create users table
create table if not exists public.users (
  id uuid references auth.users on delete cascade not null primary key,
  email text not null,
  full_name text,
  subscription_plan text default 'free' not null,
  token_balance integer default 0 not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable Row Level Security
alter table public.users enable row level security;

-- Create policies
create policy "Users can view their own data" on public.users
  for select using (auth.uid() = id);

create policy "Users can update their own data" on public.users
  for update using (auth.uid() = id);

-- Drop existing trigger and function if they exist
drop trigger if exists on_auth_user_created on auth.users;
drop function if exists public.handle_new_user();

-- Create function to handle user creation
create or replace function public.handle_new_user()
returns trigger as $$
begin
  -- Insert into users table
  insert into public.users (id, email, full_name, subscription_plan, token_balance)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name',
    'free',
    0
  );

  -- Insert into profiles table
  insert into public.profiles (id, full_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', '')
  )
  on conflict (id) do nothing;
  
  -- Insert into user_balances table
  insert into public.user_balances (user_id, balance)
  values (new.id, 0)
  on conflict (user_id) do nothing;

  return new;
end;
$$ language plpgsql security definer;

-- Create trigger for new user creation
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Insert missing users for existing profiles
insert into public.users (id, email, full_name, subscription_plan, token_balance)
select 
  u.id,
  u.email,
  coalesce(u.raw_user_meta_data->>'full_name', ''),
  'free',
  0
from auth.users u
where u.id not in (select id from public.users)
on conflict (id) do nothing; 