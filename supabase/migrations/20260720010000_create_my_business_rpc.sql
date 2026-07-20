-- Lets a newly signed-up auth user create their own business + membership
-- row without an insert policy on businesses/users (those tables intentionally
-- have none, per the multi-tenant migration, since creation is meant to go
-- through a controlled flow rather than arbitrary client inserts). This
-- function is that controlled flow: SECURITY DEFINER, callable by any
-- authenticated user, but only ever creates a business/membership for the
-- caller themselves and only if they don't already have one.

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

  return new_business_id;
end;
$$;

grant execute on function public.create_my_business(text) to authenticated;
