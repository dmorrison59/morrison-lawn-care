-- Fills out `quotes` and `quote_items`, left as minimal stubs by
-- 20260715000000_create_base_schema.sql (id/customer_id/created_at only --
-- just enough for the multi-tenant migration to run), with the columns the
-- new Quotes feature actually needs.

alter table public.quotes add column if not exists property_id uuid references public.properties(id) on delete set null;
alter table public.quotes add column if not exists status text not null default 'draft' check (status in ('draft', 'sent', 'approved', 'declined'));
alter table public.quotes add column if not exists notes text;
alter table public.quotes add column if not exists valid_until date;
alter table public.quotes add column if not exists total_amount numeric not null default 0;
alter table public.quotes add column if not exists updated_at timestamptz not null default now();

alter table public.quote_items add column if not exists description text not null default '';
alter table public.quote_items add column if not exists quantity numeric not null default 1;
alter table public.quote_items add column if not exists unit_price numeric not null default 0;
alter table public.quote_items add column if not exists line_total numeric not null default 0;

-- Note: quote_items already has its own business_id column and a
-- business_id-scoped RLS policy from the multi-tenant migration (its
-- business_id was backfilled from the parent quote there, since quote_items
-- has no user_id of its own to backfill from directly) -- nothing to change
-- here. New rows must set business_id explicitly on insert, same as every
-- other tenant table.
