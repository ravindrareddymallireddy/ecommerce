-- Monuments — Supabase schema for the admin panel
-- Run this once in the Supabase dashboard → SQL Editor.
-- Order matters: tables first, then the SQL functions that reference them.

-- ============================================================
-- 1. Staff users (admin gate)
-- ============================================================
create table if not exists public.staff_users (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  role text not null default 'admin',
  created_at timestamptz not null default now()
);

alter table public.staff_users enable row level security;

-- ============================================================
-- 2. Staff helper
-- am I staff? (created after the table it references)
-- ============================================================
create or replace function public.is_staff()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (select 1 from public.staff_users where id = auth.uid());
$$;

drop policy if exists "staff can read own row" on public.staff_users;
create policy "staff can read own row"
  on public.staff_users for select
  to authenticated
  using (auth.uid() = id);

drop policy if exists "staff can add more staff" on public.staff_users;
create policy "staff can add more staff"
  on public.staff_users for insert
  to authenticated
  with check (public.is_staff());

drop policy if exists "staff can remove other staff" on public.staff_users;
create policy "staff can remove other staff"
  on public.staff_users for delete
  to authenticated
  using (public.is_staff() and id <> auth.uid());

-- ============================================================
-- 3. Products
-- ============================================================
create table if not exists public.products (
  id bigint generated always as identity primary key,
  slug text unique not null,
  name text not null,
  category text not null default 'Dresses',
  price numeric(10,2) not null default 0,
  color text not null default '',
  tag text,
  image_url text not null default '',
  image_alt text,
  description text not null default '',
  sizes text[] not null default '{XS,S,M,L,XL}',
  inventory int not null default 0,
  is_published boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.products enable row level security;

drop policy if exists "anyone can read published products" on public.products;
create policy "anyone can read published products"
  on public.products for select
  using (is_published or public.is_staff());

drop policy if exists "staff can insert products" on public.products;
create policy "staff can insert products"
  on public.products for insert
  to authenticated
  with check (public.is_staff());

drop policy if exists "staff can update products" on public.products;
create policy "staff can update products"
  on public.products for update
  to authenticated
  using (public.is_staff());

drop policy if exists "staff can delete products" on public.products;
create policy "staff can delete products"
  on public.products for delete
  to authenticated
  using (public.is_staff());

-- ============================================================
-- 4. Orders + order items
-- ============================================================
create table if not exists public.orders (
  id bigint generated always as identity primary key,
  order_number text not null,
  user_id uuid references auth.users (id) on delete set null,
  email text not null,
  status text not null default 'pending',
  subtotal numeric(10,2) not null default 0,
  shipping numeric(10,2) not null default 0,
  total numeric(10,2) not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.order_items (
  id bigint generated always as identity primary key,
  order_id bigint not null references public.orders (id) on delete cascade,
  product_id bigint,
  name text not null,
  color text not null default '',
  size text not null default '',
  unit_price numeric(10,2) not null default 0,
  quantity int not null default 1
);

alter table public.orders enable row level security;
alter table public.order_items enable row level security;

drop policy if exists "customers read own orders, staff read all" on public.orders;
create policy "customers read own orders, staff read all"
  on public.orders for select
  using (auth.uid() = user_id or public.is_staff());

drop policy if exists "customers create own orders" on public.orders;
create policy "customers create own orders"
  on public.orders for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "staff can update orders" on public.orders;
create policy "staff can update orders"
  on public.orders for update
  to authenticated
  using (public.is_staff());

drop policy if exists "customers read own order items, staff read all" on public.order_items;
create policy "customers read own order items, staff read all"
  on public.order_items for select
  using (
    exists (
      select 1 from public.orders o
      where o.id = order_id and (o.user_id = auth.uid() or public.is_staff())
    )
  );

drop policy if exists "customers create items on own orders" on public.order_items;
create policy "customers create items on own orders"
  on public.order_items for insert
  to authenticated
  with check (
    exists (
      select 1 from public.orders o
      where o.id = order_id and o.user_id = auth.uid()
    )
  );

drop policy if exists "staff can update order items" on public.order_items;
create policy "staff can update order items"
  on public.order_items for update
  to authenticated
  using (public.is_staff());

drop policy if exists "staff can delete order items" on public.order_items;
create policy "staff can delete order items"
  on public.order_items for delete
  to authenticated
  using (public.is_staff());

-- ============================================================
-- 5. Bootstrap the first admin
-- Create your admin user first (Authentication → Users → Add user,
-- tick "Auto Confirm User"), then run in the SQL editor:
--
--   select public.bootstrap_first_staff('you@example.com');
--
-- Equivalent manual insert (also fine):
--
--   insert into public.staff_users (id, email)
--   select id, email from auth.users where email = 'you@example.com';
--
-- The function is callable ONLY from the dashboard SQL editor
-- (execute is revoked from anon/authenticated), so app users can
-- never grant themselves staff access.
-- ============================================================
drop function if exists public.bootstrap_first_staff();

create or replace function public.bootstrap_first_staff(target_email text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if exists (select 1 from public.staff_users) then
    raise exception 'staff_users is not empty — add further staff as an existing admin';
  end if;
  insert into public.staff_users (id, email)
  select u.id, u.email from auth.users u where u.email = target_email;
  if not found then
    raise exception 'No auth user with email % — create it under Authentication → Users first', target_email;
  end if;
end;
$$;

revoke execute on function public.bootstrap_first_staff(text) from public;
revoke execute on function public.bootstrap_first_staff(text) from anon;
revoke execute on function public.bootstrap_first_staff(text) from authenticated;
