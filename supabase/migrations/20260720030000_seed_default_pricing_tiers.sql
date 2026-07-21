-- Fills in create_default_pricing_tiers(business_id uuid), left as a
-- no-op placeholder by 20260720020000_fix_pricing_tiers_trigger.sql, with
-- the original seed logic from the pre-existing (now-removed)
-- create_default_pricing_tiers() trigger function.
--
-- auth.uid() is used for user_id rather than adding a second parameter,
-- consistent with create_my_business() and current_business_id() — this
-- function is only ever called from within create_my_business() during
-- that user's own signup, so auth.uid() is the new user's id throughout.

create or replace function public.create_default_pricing_tiers(business_id uuid)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  insert into public.pricing_tiers
    (business_id, user_id, name, min_sqft, max_sqft, base_price, price_per_sqft)
  values
    (business_id, auth.uid(), 'Small', 0, 5000, 35.00, 0.0100),
    (business_id, auth.uid(), 'Medium', 5001, 10000, 50.00, 0.0080),
    (business_id, auth.uid(), 'Large', 10001, 20000, 80.00, 0.0060),
    (business_id, auth.uid(), 'XL', 20001, 999999, 120.00, 0.0050);
end;
$$;

grant execute on function public.create_default_pricing_tiers(uuid) to authenticated;
