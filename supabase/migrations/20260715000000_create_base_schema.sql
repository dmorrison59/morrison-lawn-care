-- Establishes the base single-tenant schema that
-- 20260720000000_add_multi_tenant_businesses.sql (and the migrations after it)
-- assume already exists. Per that migration's own comments, this base schema
-- was originally created directly in the Supabase dashboard for "the original
-- LawnPro Manager app" and was never captured as a migration in this repo —
-- this project's database never actually had it, so the multi-tenant
-- migration fails here with "relation does not exist" on
-- properties/quotes/quote_items/pricing_tiers/settings.
--
-- This project already had a `customers` table and a `jobs` table left over
-- from an earlier, unrelated prototype (alongside estimates/payments/
-- estimate_items, none of which this app's code or later migrations
-- reference). customers/jobs are adapted in place — extra columns added,
-- unrelated existing ones left alone — since their shapes already mostly
-- matched what this app needs. estimates/payments/estimate_items are dropped.

drop table if exists public.estimate_items cascade;
drop table if exists public.payments cascade;
drop table if exists public.estimates cascade;

-- customers: add the columns lib/customers.ts and the multi-tenant backfill
-- (which unions user_id across every tenant table) need.
alter table public.customers add column if not exists user_id uuid references auth.users(id) on delete cascade;
alter table public.customers add column if not exists notes text;
alter table public.customers add column if not exists updated_at timestamptz not null default now();

-- jobs: drop the now-orphaned link to the dropped estimates table, add
-- user_id for the same backfill.
alter table public.jobs drop column if exists estimate_id;
alter table public.jobs add column if not exists user_id uuid references auth.users(id) on delete cascade;

-- properties: used directly by lib/customers.ts; did not exist in this
-- project at all.
create table if not exists public.properties (
  id uuid primary key default extensions.uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade,
  customer_id uuid references public.customers(id) on delete cascade,
  address text not null,
  square_footage numeric,
  latitude double precision,
  longitude double precision,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- quotes, quote_items, pricing_tiers, settings: not queried by any current
-- app code, but the multi-tenant migration and the pricing-tier-seeding
-- migration both assume they exist. Minimal shape for now — extend these
-- once the app actually grows quoting/pricing/settings features.
create table if not exists public.quotes (
  id uuid primary key default extensions.uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade,
  customer_id uuid references public.customers(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists public.quote_items (
  id uuid primary key default extensions.uuid_generate_v4(),
  quote_id uuid references public.quotes(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists public.pricing_tiers (
  id uuid primary key default extensions.uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade,
  name text not null,
  min_sqft numeric,
  max_sqft numeric,
  base_price numeric,
  price_per_sqft numeric,
  created_at timestamptz not null default now()
);

create table if not exists public.settings (
  id uuid primary key default extensions.uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade,
  business_name text,
  created_at timestamptz not null default now()
);
