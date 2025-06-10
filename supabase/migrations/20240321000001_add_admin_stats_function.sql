-- Create a function to get admin statistics
create or replace function get_admin_stats()
returns json
language plpgsql
security definer
as $$
declare
  stats json;
begin
  with user_stats as (
    select count(*) as total_users
    from profiles
  ),
  active_stats as (
    select count(*) as active_users
    from auth.users
    where last_sign_in_at > now() - interval '30 days'
  ),
  event_stats as (
    select count(*) as total_events
    from events
  ),
  contact_stats as (
    select count(*) as total_contacts
    from contacts
  ),
  email_stats as (
    select count(*) as total_emails_sent
    from transactions
    where type = 'usage'
      and status = 'completed'
  ),
  revenue_stats as (
    select coalesce(sum(amount), 0) as total_revenue
    from transactions
    where type = 'purchase'
      and status = 'completed'
  )
  select json_build_object(
    'totalUsers', us.total_users,
    'activeUsers', ac.active_users,
    'totalEvents', es.total_events,
    'totalContacts', cs.total_contacts,
    'totalEmailsSent', ems.total_emails_sent,
    'totalRevenue', rs.total_revenue,
    'averageRevenuePerUser', case 
      when us.total_users > 0 then rs.total_revenue / us.total_users::float
      else 0
    end
  ) into stats
  from user_stats us
  cross join active_stats ac
  cross join event_stats es
  cross join contact_stats cs
  cross join email_stats ems
  cross join revenue_stats rs;

  return stats;
end;
$$;

-- Grant execute permission to authenticated users
grant execute on function get_admin_stats() to authenticated;

-- Create a view for auth users to get last sign in times
create or replace view auth_users as
select 
  id,
  last_sign_in_at
from auth.users;

-- Grant select permission to authenticated users
grant select on auth_users to authenticated; 