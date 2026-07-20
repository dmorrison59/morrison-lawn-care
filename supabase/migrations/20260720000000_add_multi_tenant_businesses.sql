-- Multi-tenant support: introduce businesses + users(auth link), add business_id
-- to all tenant tables, backfill from existing user_id data, and re-scope RLS
-- policies to business_id. user_id columns are left in place as a legacy
-- reference and are NOT dropped or backfilled away.

create extension if not exists pgcrypto;

-- 1. businesses table
-- ---------------------------------------------------------------------------

create table if not exists public.businesses (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  industry_type text not null default 'lawn_care',
  created_at timestamptz not null default now()
);

-- 2. users table: links auth.users to a business
-- ---------------------------------------------------------------------------
-- Created before the backfill runs, so it can double as the record of which
-- user_ids have already been migrated (making this script safe to re-run).

create table if not exists public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  business_id uuid not null references public.businesses(id) on delete cascade,
  role text not null default 'owner' check (role in ('owner', 'admin', 'staff')),
  created_at timestamptz not null default now()
);

create index if not exists users_business_id_idx on public.users(business_id);

-- 3. Backfill: one business per distinct existing user_id not yet migrated
-- ---------------------------------------------------------------------------

-- Plain temp table (no ON COMMIT DROP): if this migration runs with each
-- statement auto-committing individually rather than as one transaction,
-- ON COMMIT DROP would clear the table before it's used. It's dropped
-- explicitly once the backfill is done instead.
create temporary table _user_business_map (
  user_id uuid primary key,
  business_id uuid not null default gen_random_uuid()
);

insert into _user_business_map (user_id)
select distinct all_user_ids.user_id from (
  select user_id from public.customers
  union
  select user_id from public.properties
  union
  select user_id from public.quotes
  union
  select user_id from public.quote_items
  union
  select user_id from public.jobs
  union
  select user_id from public.pricing_tiers
  union
  select user_id from public.settings
) all_user_ids
where all_user_ids.user_id is not null
  and not exists (
    select 1 from public.users pu where pu.id = all_user_ids.user_id
  );

-- Prefer settings.business_name when present (a user_id may have more than
-- one settings row historically, so pick a single non-null value per user).
insert into public.businesses (id, name, industry_type, created_at)
select
  m.business_id,
  coalesce(names.business_name, 'Business ' || left(m.user_id::text, 8)),
  'lawn_care',
  now()
from _user_business_map m
left join (
  select user_id, (array_agg(business_name) filter (where business_name is not null))[1] as business_name
  from public.settings
  group by user_id
) names on names.user_id = m.user_id;

insert into public.users (id, business_id, role)
select m.user_id, m.business_id, 'owner'
from _user_business_map m
where exists (select 1 from auth.users u where u.id = m.user_id)
on conflict (id) do nothing;

drop table if exists _user_business_map;

-- 4. business_id column on every tenant table, populated via public.users
-- ---------------------------------------------------------------------------
-- Backfilling from public.users (rather than the temp map above) keeps this
-- idempotent and also covers any tenant rows added between migration runs.

alter table public.customers add column if not exists business_id uuid references public.businesses(id) on delete cascade;
alter table public.properties add column if not exists business_id uuid references public.businesses(id) on delete cascade;
alter table public.quotes add column if not exists business_id uuid references public.businesses(id) on delete cascade;
alter table public.quote_items add column if not exists business_id uuid references public.businesses(id) on delete cascade;
alter table public.jobs add column if not exists business_id uuid references public.businesses(id) on delete cascade;
alter table public.pricing_tiers add column if not exists business_id uuid references public.businesses(id) on delete cascade;
alter table public.settings add column if not exists business_id uuid references public.businesses(id) on delete cascade;

update public.customers c set business_id = pu.business_id from public.users pu where c.user_id = pu.id and c.business_id is null;
update public.properties p set business_id = pu.business_id from public.users pu where p.user_id = pu.id and p.business_id is null;
update public.quotes q set business_id = pu.business_id from public.users pu where q.user_id = pu.id and q.business_id is null;
update public.quote_items qi set business_id = pu.business_id from public.users pu where qi.user_id = pu.id and qi.business_id is null;
update public.jobs j set business_id = pu.business_id from public.users pu where j.user_id = pu.id and j.business_id is null;
update public.pricing_tiers pt set business_id = pu.business_id from public.users pu where pt.user_id = pu.id and pt.business_id is null;
update public.settings s set business_id = pu.business_id from public.users pu where s.user_id = pu.id and s.business_id is null;

create index if not exists customers_business_id_idx on public.customers(business_id);
create index if not exists properties_business_id_idx on public.properties(business_id);
create index if not exists quotes_business_id_idx on public.quotes(business_id);
create index if not exists quote_items_business_id_idx on public.quote_items(business_id);
create index if not exists jobs_business_id_idx on public.jobs(business_id);
create index if not exists pricing_tiers_business_id_idx on public.pricing_tiers(business_id);
create index if not exists settings_business_id_idx on public.settings(business_id);

-- 5. RLS: scope every table by business_id, looked up via public.users
-- ---------------------------------------------------------------------------

create or replace function public.current_business_id()
returns uuid
language sql
security definer
stable
set search_path = public, pg_temp
as $$
  select business_id from public.users where id = auth.uid()
$$;

-- Drop any pre-existing policies on the tenant tables (their exact prior
-- names are unknown) so the business_id-scoped policies below are the only
-- ones in effect.
do $$
declare
  tbl text;
  pol record;
begin
  foreach tbl in array array[
    'customers', 'properties', 'quotes', 'quote_items',
    'jobs', 'pricing_tiers', 'settings'
  ]
  loop
    for pol in
      select policyname from pg_policies
      where schemaname = 'public' and tablename = tbl
    loop
      execute format('drop policy if exists %I on public.%I', pol.policyname, tbl);
    end loop;
  end loop;
end $$;

alter table public.customers enable row level security;
alter table public.properties enable row level security;
alter table public.quotes enable row level security;
alter table public.quote_items enable row level security;
alter table public.jobs enable row level security;
alter table public.pricing_tiers enable row level security;
alter table public.settings enable row level security;

create policy "customers_business_isolation" on public.customers
  for all
  using (business_id = public.current_business_id())
  with check (business_id = public.current_business_id());

create policy "properties_business_isolation" on public.properties
  for all
  using (business_id = public.current_business_id())
  with check (business_id = public.current_business_id());

create policy "quotes_business_isolation" on public.quotes
  for all
  using (business_id = public.current_business_id())
  with check (business_id = public.current_business_id());

create policy "quote_items_business_isolation" on public.quote_items
  for all
  using (business_id = public.current_business_id())
  with check (business_id = public.current_business_id());

create policy "jobs_business_isolation" on public.jobs
  for all
  using (business_id = public.current_business_id())
  with check (business_id = public.current_business_id());

create policy "pricing_tiers_business_isolation" on public.pricing_tiers
  for all
  using (business_id = public.current_business_id())
  with check (business_id = public.current_business_id());

create policy "settings_business_isolation" on public.settings
  for all
  using (business_id = public.current_business_id())
  with check (business_id = public.current_business_id());

-- businesses: members can see and update their own business row. Creation is
-- expected to happen via a service-role signup flow, so no insert policy.
alter table public.businesses enable row level security;

drop policy if exists "businesses_select_own" on public.businesses;
drop policy if exists "businesses_update_own" on public.businesses;

create policy "businesses_select_own" on public.businesses
  for select
  using (id = public.current_business_id());

create policy "businesses_update_own" on public.businesses
  for update
  using (id = public.current_business_id())
  with check (id = public.current_business_id());

-- users: members can see other members of their own business, and update
-- their own row. Creation/role changes beyond self are expected to go
-- through a service-role admin flow, so no insert/delete policy here.
alter table public.users enable row level security;

drop policy if exists "users_select_same_business" on public.users;
drop policy if exists "users_update_self" on public.users;

create policy "users_select_same_business" on public.users
  for select
  using (business_id = public.current_business_id());

create policy "users_update_self" on public.users
  for update
  using (id = auth.uid())
  with check (id = auth.uid());
