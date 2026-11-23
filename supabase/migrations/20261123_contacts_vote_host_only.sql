-- Vote: only a vote's hosts and its participants become each other's contacts; participants don't become contacts of one another.
-- Entente players still all become each other's contacts.
create or replace function public.site_contacts()
returns table (user_id uuid, name text, shared int, last_at timestamptz)
language sql stable security definer set search_path = public, auth as $$
  with met as (
    select p2.user_id as u, g.created_at as at
      from dip_players p1
      join dip_players p2 on p2.game_id = p1.game_id and p2.user_id <> p1.user_id
      join dip_games g on g.id = p1.game_id
     where p1.user_id = auth.uid()
    union all
    select m.user_id, m.joined_at
      from dipsgiving_event_hosts h
      join dipsgiving_members m on m.event_id = h.event_id and m.user_id <> h.user_id
     where h.user_id = auth.uid()
    union all
    select h.user_id, m.joined_at
      from dipsgiving_members m
      join dipsgiving_event_hosts h on h.event_id = m.event_id and h.user_id <> m.user_id
     where m.user_id = auth.uid()
  )
  select m.u,
         coalesce(nullif(btrim(au.raw_user_meta_data->>'display_name'), ''),
                  (select p.display_name from dip_players p where p.user_id = m.u order by p.joined_at desc limit 1),
                  (select d.display_name from dipsgiving_profiles d where d.id = m.u),
                  'Someone'),
         count(*)::int, max(m.at)
    from met m join auth.users au on au.id = m.u
   group by m.u, au.raw_user_meta_data
   order by max(m.at) desc;
$$;
