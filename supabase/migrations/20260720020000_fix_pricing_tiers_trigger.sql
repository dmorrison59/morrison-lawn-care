-- Fixes signup failing with "relation \"pricing_tiers\" does not exist".
--
-- A pre-existing trigger (created directly in the Supabase dashboard for the
-- original LawnPro Manager app, never tracked in this repo) fires
-- AFTER INSERT ON auth.users and calls create_default_pricing_tiers(). That
-- function had no search_path set, so its unqualified reference to
-- pricing_tiers failed to resolve — pricing_tiers does exist, it just wasn't
-- found under whatever search_path the trigger ran with.
--
-- Fixing search_path alone isn't enough, though: this trigger fires the
-- instant auth.signUp() succeeds, before create_my_business() has ever run.
-- At that point there is no public.users row and no public.businesses row
-- for this person yet, so there is no business_id to assign — not "hard to
-- look up", genuinely doesn't exist yet. Any pricing_tiers rows inserted
-- here would have to be business_id = null, which then become permanently
-- invisible under our business_id-scoped RLS (null never equals
-- current_business_id()), since nothing backfills rows created by future
-- signups the way the original multi-tenant migration backfilled historical
-- ones. And with email confirmation on, the gap between auth.users existing
-- and a business existing can be arbitrarily long.
--
-- Fix: drop the auth.users trigger entirely, and seed default pricing tiers
-- from inside create_my_business() instead, right after it creates the
-- business — the one point where business_id is actually known.
--
-- NOTE: the original body of create_default_pricing_tiers() (whatever
-- default tiers/columns it seeded) was never shared with this migration's
-- author and isn't available anywhere in this repo, so it could not be
-- ported over here. This migration fixes the crash and wires the call into
-- the right point in the signup flow, but the function itself is a
-- placeholder that seeds nothing yet — replace its body with the real
-- default-tier logic in a follow-up migration once that's available.

drop trigger if exists on_auth_user_created_create_pricing_tiers on auth.users;

-- The old function has a trigger signature (no args, returns trigger).
-- create or replace can't change a function's argument list or return type,
-- so the old one has to be dropped before the new one is created.
drop function if exists public.create_default_pricing_tiers();

create or replace function public.create_default_pricing_tiers(business_id uuid)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  -- Placeholder: intentionally does not insert anything yet (see note
  -- above). Replace with the real seed logic, e.g.:
  --   insert into public.pricing_tiers (business_id, name, ...)
  --   values (business_id, 'Basic', ...), (business_id, 'Standard', ...);
  null;
end;
$$;

grant execute on function public.create_default_pricing_tiers(uuid) to authenticated;

-- Re-create create_my_business to call the above once the business exists.
create or replace function public.create_my_business(business_name text)
returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  new_business_id uuid;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  if exists (select 1 from public.users where id = auth.uid()) then
    raise exception 'User already belongs to a business';
  end if;

  insert into public.businesses (name)
  values (business_name)
  returning id into new_business_id;

  insert into public.users (id, business_id, role)
  values (auth.uid(), new_business_id, 'owner');

  perform public.create_default_pricing_tiers(new_business_id);

  return new_business_id;
end;
$$;

grant execute on function public.create_my_business(text) to authenticated;
