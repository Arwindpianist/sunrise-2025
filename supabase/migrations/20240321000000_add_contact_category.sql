-- Add category column to contacts table if it doesn't exist
do $$ 
begin
  if not exists (
    select 1 
    from information_schema.columns 
    where table_schema = 'public' 
    and table_name = 'contacts' 
    and column_name = 'category'
  ) then
    alter table public.contacts
    add column category text default 'other';
  end if;
end $$;

-- Drop existing constraint if it exists
do $$ 
begin
  if exists (
    select 1 
    from information_schema.table_constraints 
    where constraint_name = 'valid_category'
  ) then
    alter table public.contacts
    drop constraint valid_category;
  end if;
end $$;

-- Add check constraint for valid categories
alter table public.contacts
add constraint valid_category
check (category in ('family', 'friend', 'guest', 'other'));

-- Drop existing policies if they exist
drop policy if exists "Users can view their own contacts" on public.contacts;
drop policy if exists "Users can insert their own contacts" on public.contacts;
drop policy if exists "Users can update their own contacts" on public.contacts;
drop policy if exists "Users can delete their own contacts" on public.contacts;

-- Create new policies
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