-- Fills out `jobs` beyond its current minimal shape
-- (status/scheduled_date/notes/created_at/user_id/business_id, left over
-- from adapting the pre-existing prototype table in
-- 20260715000000_create_base_schema.sql) with the columns the new Jobs
-- feature needs: which customer/property/quote it's for, a title, pricing,
-- and a completion timestamp.

alter table public.jobs add column if not exists customer_id uuid references public.customers(id) on delete cascade;
alter table public.jobs add column if not exists property_id uuid references public.properties(id) on delete set null;
alter table public.jobs add column if not exists quote_id uuid references public.quotes(id) on delete set null;
alter table public.jobs add column if not exists title text not null default '';
alter table public.jobs add column if not exists estimated_price numeric;
alter table public.jobs add column if not exists final_price numeric;
alter table public.jobs add column if not exists completed_at timestamptz;
alter table public.jobs add column if not exists updated_at timestamptz not null default now();

-- Widen the status check (previously implicit/unconstrained) to the values
-- the Jobs screens actually use.
alter table public.jobs drop constraint if exists jobs_status_check;
alter table public.jobs add constraint jobs_status_check
  check (status in ('scheduled', 'in_progress', 'completed', 'cancelled'));
