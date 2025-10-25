-- Supabase schema for Mrazota
-- Run this in Supabase SQL editor to create tables and basic RLS policies

-- Enable pgcrypto for uuid generation
create extension if not exists "pgcrypto";

-- profiles table (Supabase auth user profiles)
create table if not exists profiles (
  id uuid primary key default auth.uid(),
  email text,
  full_name text,
  username text,
  avatar_url text,
  created_at timestamp with time zone default now()
);

-- posts table: user posts with optional media (stored in Storage)
create table if not exists posts (
  id uuid primary key default gen_random_uuid(),
  author uuid references profiles(id) on delete cascade,
  content text,
  media_url text,
  media_type text,
  likes int default 0,
  created_at timestamp with time zone default now()
);

-- products table
create table if not exists products (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  price numeric(10,2) not null default 0,
  category text,
  image_url text,
  stock int default 0,
  created_at timestamp with time zone default now()
);

-- messages (direct messages)
create table if not exists messages (
  id uuid primary key default gen_random_uuid(),
  from_user uuid references profiles(id) on delete cascade,
  to_user uuid references profiles(id) on delete cascade,
  body text,
  created_at timestamp with time zone default now()
);

-- friends table
create table if not exists friends (
  id uuid primary key default gen_random_uuid(),
  user_a uuid references profiles(id) on delete cascade,
  user_b uuid references profiles(id) on delete cascade,
  status text default 'pending', -- pending, accepted, blocked
  created_at timestamp with time zone default now()
);

-- orders table (basic)
create table if not exists orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade,
  total numeric(10,2) not null default 0,
  status text default 'pending',
  created_at timestamp with time zone default now()
);

-- Basic Row Level Security example: allow logged-in users to insert/select their own posts
-- Enable RLS on posts
alter table posts enable row level security;

-- policy: allow insert for authenticated users
-- For INSERT policies Postgres requires a WITH CHECK expression (not USING).
-- Allow authenticated users to insert posts (check that the role is authenticated).
-- Remove existing post policies if present so this script can be re-run safely
drop policy if exists "Insert own posts" on posts;
drop policy if exists "Select posts" on posts;
drop policy if exists "Update own posts" on posts;
drop policy if exists "Delete own posts" on posts;

create policy "Insert own posts" on posts for insert with check (auth.role() = 'authenticated');

-- policy: allow select for all (public feed)
create policy "Select posts" on posts for select using (true);
-- Allow updates and deletes only by the author (owner) of the post.
-- For UPDATE policies we include both USING (check current row) and WITH CHECK (check new row payload).
create policy "Update own posts" on posts for update
  using (author = auth.uid())
  with check (author = auth.uid());

create policy "Delete own posts" on posts for delete using (author = auth.uid());

-- Messages: enable RLS and only allow participants to read/send messages.
alter table messages enable row level security;

-- Allow authenticated users to insert messages where they are the sender (from_user must match auth.uid())
-- Remove existing message policies if present so this script can be re-run safely
drop policy if exists "Insert messages (sender only)" on messages;
drop policy if exists "Select messages (participants)" on messages;
drop policy if exists "Update messages (sender only)" on messages;
drop policy if exists "Delete messages (sender only)" on messages;

create policy "Insert messages (sender only)" on messages for insert with check (
  auth.role() = 'authenticated' AND from_user = auth.uid()
);

-- Allow participants (sender or recipient) to select messages
create policy "Select messages (participants)" on messages for select using (
  from_user = auth.uid() OR to_user = auth.uid()
);

-- Allow sender to update their message (e.g., edit) and only if from_user stays the same
create policy "Update messages (sender only)" on messages for update
  using (from_user = auth.uid())
  with check (from_user = auth.uid());

-- Allow sender to delete their messages
create policy "Delete messages (sender only)" on messages for delete using (from_user = auth.uid());

-- Note: Admin/backend operations using the Supabase service_role key bypass RLS and can manage products/orders/messages as needed.

-- Indexes
create index if not exists posts_created_at_idx on posts(created_at desc);
create index if not exists products_category_idx on products(category);

-- Enable RLS for orders and products and add safe policies so script is re-runnable
alter table orders enable row level security;
alter table products enable row level security;

-- Products: allow public SELECT (browsing the store). Mutations (INSERT/UPDATE/DELETE)
-- should be performed by the backend using the service_role key (which bypasses RLS).
drop policy if exists "Select products" on products;
create policy "Select products" on products for select using (true);

-- Orders: allow authenticated users to create orders for themselves and to SELECT their own orders.
-- Updates/deletes of orders should be performed by the backend (service role) to change status.
drop policy if exists "Insert orders (owner)" on orders;
drop policy if exists "Select orders (owner)" on orders;
create policy "Insert orders (owner)" on orders for insert with check (
  auth.role() = 'authenticated' AND user_id = auth.uid()
);
create policy "Select orders (owner)" on orders for select using (user_id = auth.uid());


-- End of schema
