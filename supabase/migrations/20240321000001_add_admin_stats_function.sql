-- Create a function to get admin statistics
create or replace function get_admin_stats()
returns json
language plpgsql
security definer
as $$
declare
  stats json;
begin
  with stats as (
    -- Get total users
    select count(*) as total_users
    from profiles,
    
    -- Get active users (last 30 days)
    (
      select count(*) as active_users
      from auth.users
      where last_sign_in_at > now() - interval '30 days'
    ) active,
    
    -- Get total events
    (
      select count(*) as total_events
      from events
    ) events,
    
    -- Get total contacts
    (
      select count(*) as total_contacts
      from contacts
    ) contacts,
    
    -- Get total emails sent
    (
      select count(*) as total_emails_sent
      from transactions
      where type = 'usage'
        and status = 'completed'
    ) emails,
    
    -- Get total revenue
    (
      select coalesce(sum(amount), 0) as total_revenue
      from transactions
      where type = 'purchase'
        and status = 'completed'
    ) revenue
  )
  select json_build_object(
    'totalUsers', total_users,
    'activeUsers', active_users,
    'totalEvents', total_events,
    'totalContacts', total_contacts,
    'totalEmailsSent', total_emails_sent,
    'totalRevenue', total_revenue,
    'averageRevenuePerUser', case 
      when total_users > 0 then total_revenue / total_users::float
      else 0
    end
  ) into stats
  from stats;

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