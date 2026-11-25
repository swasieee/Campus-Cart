-- Optional free cloud database & image storage setup on Supabase (https://supabase.com)
-- Run this in Supabase SQL Editor, then add SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in Vercel env vars.

create table if not exists campus_users (
  id bigint generated always as identity primary key,
  name text not null,
  email text unique not null,
  password_hash text not null,
  department text not null default 'CSE',
  semester int not null default 3,
  phone text not null default '',
  created_at timestamptz not null default now()
);

create table if not exists campus_listings (
  id bigint generated always as identity primary key,
  title text not null,
  description text not null,
  price numeric not null default 0,
  price_min numeric not null default 0,
  price_max numeric not null default 0,
  listing_type text not null default 'SELL',
  category text not null default 'Books',
  semester int not null default 3,
  department text not null default 'CSE',
  image_urls jsonb not null default '[]'::jsonb,
  seller_name text not null,
  seller_email text not null,
  seller_phone text not null default '',
  status text not null default 'AVAILABLE',
  created_at timestamptz not null default now()
);

create table if not exists campus_messages (
  id bigint generated always as identity primary key,
  listing_id bigint not null references campus_listings(id) on delete cascade,
  sender_name text not null,
  sender_email text not null,
  text text not null,
  offer_amount numeric,
  offer_status text default 'PENDING',
  created_at timestamptz not null default now()
);

-- Create a public storage bucket named "listing-images" in Supabase Storage UI (or via SQL):
insert into storage.buckets (id, name, public)
values ('listing-images', 'listing-images', true)
on conflict (id) do nothing;
