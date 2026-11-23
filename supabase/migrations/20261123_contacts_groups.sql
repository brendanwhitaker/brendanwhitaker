-- Contacts and groups for the brendanwhitaker.com account.
-- Contacts aren't stored: they're everyone you've shared an Entente game or a Vote event with, worked out when asked.
-- Only names come back, never email addresses. Groups are your own named lists of contacts; nobody else can see
-- them, including the people in them. Hosts use them to bring the same people into the next game or vote.

create table public.site_groups (
  id uuid primary key default gen_random_uuid(),
  owner uuid not null references auth.users on delete cascade,
  name text not null check (char_length(btrim(name)) between 1 and 60),
  created_at timestamptz not null default now()
);
create table public.site_group_members (
  group_id uuid not null references public.site_groups on delete cascade,
  user_id uuid not null references auth.users on delete cascade,
  added_at timestamptz not null default now(),
  primary key (group_id, user_id)
);
create index on public.site_groups (owner);
alter table public.site_groups enable row level security;
alter table public.site_group_members enable row level security;
create policy "owners read their groups" on public.site_groups for select using (owner = auth.uid());
create policy "owners read their groups' members" on public.site_group_members for select
  using (exists (select 1 from public.site_groups g where g.id = group_id and g.owner = auth.uid()));
-- Writes go through site_group_save / site_group_delete, which check that everyone added is a contact.

-- Everyone you've shared a game or a vote with, most recent first.
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
    select m2.user_id, greatest(m1.joined_at, m2.joined_at)
      from dipsgiving_members m1
      join dipsgiving_members m2 on m2.event_id = m1.event_id and m2.user_id <> m1.user_id
     where m1.user_id = auth.uid()
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

create or replace function public.site_is_contact(target uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.site_contacts() c where c.user_id = target);
$$;

-- Your groups with their members: [{ id, name, members: [user_id, …] }, …]
create or replace function public.site_groups_list()
returns jsonb language sql stable security definer set search_path = public as $$
  select coalesce(jsonb_agg(jsonb_build_object('id', g.id, 'name', g.name,
           'members', coalesce((select jsonb_agg(m.user_id order by m.added_at) from site_group_members m where m.group_id = g.id), '[]'::jsonb))
         order by g.created_at), '[]'::jsonb)
    from site_groups g where g.owner = auth.uid();
$$;

-- Create (gid null) or update a group: its name and exactly these members. Anyone who isn't a contact is skipped.
create or replace function public.site_group_save(gid uuid, gname text, members uuid[])
returns uuid language plpgsql security definer set search_path = public as $$
declare id_ uuid := gid;
begin
  if auth.uid() is null then raise exception 'Sign in first'; end if;
  if coalesce(btrim(gname), '') = '' then raise exception 'Give the group a name'; end if;
  if id_ is null then
    if (select count(*) from site_groups where owner = auth.uid()) >= 50 then raise exception 'That''s a lot of groups. Delete one first.'; end if;
    insert into site_groups (owner, name) values (auth.uid(), left(btrim(gname), 60)) returning id into id_;
  else
    update site_groups set name = left(btrim(gname), 60) where id = id_ and owner = auth.uid();
    if not found then raise exception 'Couldn''t find that group'; end if;
  end if;
  delete from site_group_members where group_id = id_ and not (user_id = any(coalesce(members, '{}')));
  insert into site_group_members (group_id, user_id)
    select id_, c.user_id from site_contacts() c where c.user_id = any(coalesce(members, '{}'))
    on conflict do nothing;
  return id_;
end $$;

create or replace function public.site_group_delete(gid uuid)
returns void language sql security definer set search_path = public as $$
  delete from site_groups where id = gid and owner = auth.uid();
$$;

revoke execute on function public.site_contacts(), public.site_is_contact(uuid), public.site_groups_list(),
  public.site_group_save(uuid, text, uuid[]), public.site_group_delete(uuid) from public, anon;
grant execute on function public.site_contacts(), public.site_is_contact(uuid), public.site_groups_list(),
  public.site_group_save(uuid, text, uuid[]), public.site_group_delete(uuid) to authenticated;
