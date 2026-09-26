-- OStock Database Schema
-- Run this in Supabase SQL Editor if not already initialized

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- 1. Warehouses
create table if not exists public.warehouses (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  address text default '',
  created_at timestamptz default now()
);

-- 2. Locations (nested under warehouses, referenced by stock_moves)
create table if not exists public.locations (
  id uuid primary key default gen_random_uuid(),
  warehouse_id uuid references public.warehouses(id) on delete cascade,
  name text not null,
  created_at timestamptz default now()
);

-- 3. Product Categories
create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  description text default '',
  created_at timestamptz default now()
);

-- 4. Products
create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  sku text not null unique,
  category_id uuid references public.categories(id) on delete set null,
  uom text not null default 'Units',
  qty_on_hand numeric not null default 0,
  reorder_point numeric not null default 10,
  created_at timestamptz default now()
);

-- 5. Stock Moves
create table if not exists public.stock_moves (
  id uuid primary key default gen_random_uuid(),
  product_id uuid references public.products(id) on delete cascade,
  move_type text not null check (move_type in ('receipt', 'delivery', 'internal', 'adjustment')),
  status text not null check (status in ('draft', 'waiting', 'ready', 'done', 'canceled')),
  from_location text,
  to_location text,
  quantity numeric not null default 1,
  reference text,
  created_at timestamptz default now()
);

-- Turn on Row Level Security (RLS) but allow authenticated & public demo access
alter table public.warehouses enable row level security;
alter table public.locations enable row level security;
alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.stock_moves enable row level security;

-- Policies for full access to authenticated & anon users
drop policy if exists "Allow all on warehouses" on public.warehouses;
create policy "Allow all on warehouses" on public.warehouses for all using (true) with check (true);

drop policy if exists "Allow all on locations" on public.locations;
create policy "Allow all on locations" on public.locations for all using (true) with check (true);

drop policy if exists "Allow all on categories" on public.categories;
create policy "Allow all on categories" on public.categories for all using (true) with check (true);

drop policy if exists "Allow all on products" on public.products;
create policy "Allow all on products" on public.products for all using (true) with check (true);

drop policy if exists "Allow all on stock_moves" on public.stock_moves;
create policy "Allow all on stock_moves" on public.stock_moves for all using (true) with check (true);
