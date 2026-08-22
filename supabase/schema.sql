-- ShareShare Supabase schema
create extension if not exists pgcrypto;

-- Shared API state. A single JSON document keeps room updates compatible with
-- the serverless API while allowing every device to read the same room.
create table if not exists public.shared_rooms (
  id text primary key,
  data jsonb not null,
  updated_at timestamptz not null default now()
);

alter table public.shared_rooms enable row level security;
create policy "public can read shared rooms" on public.shared_rooms for select using (true);
create policy "public can create shared rooms" on public.shared_rooms for insert with check (true);
create policy "public can update shared rooms" on public.shared_rooms for update using (true) with check (true);

do $$ begin
  create type public.split_mode as enum ('items', 'parts', 'equal');
exception when duplicate_object then null;
end $$;

create table if not exists public.rooms (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 120),
  mode text not null default 'restaurant' check (mode in ('cafe', 'restaurant')),
  creator_name text not null check (char_length(creator_name) between 1 and 60),
  split_mode public.split_mode not null default 'items',
  split_parts integer not null default 1 check (split_parts > 0),
  duitnow_id text,
  bank_account text,
  payment_qr_url text,
  is_closed boolean not null default false,
  created_at timestamptz not null default now(),
  closed_at timestamptz
);

create table if not exists public.room_members (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.rooms(id) on delete cascade,
  nickname text not null check (char_length(nickname) between 1 and 60),
  created_at timestamptz not null default now(),
  unique (room_id, nickname)
);

create table if not exists public.items (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.rooms(id) on delete cascade,
  member_id uuid not null references public.room_members(id) on delete restrict,
  name text not null,
  unit_price numeric(12,2) not null check (unit_price >= 0),
  quantity integer not null default 1 check (quantity > 0),
  options jsonb not null default '{}'::jsonb,
  note text,
  created_at timestamptz not null default now()
);

create table if not exists public.item_shares (
  item_id uuid not null references public.items(id) on delete cascade,
  member_id uuid not null references public.room_members(id) on delete cascade,
  share_count numeric(12,4) not null default 1 check (share_count > 0),
  primary key (item_id, member_id)
);

create index if not exists room_members_room_id_idx on public.room_members(room_id);
create index if not exists items_room_id_idx on public.items(room_id);

alter table public.rooms enable row level security;
alter table public.room_members enable row level security;
alter table public.items enable row level security;
alter table public.item_shares enable row level security;

-- Anonymous room sharing: the application limits writes to the room API.
create policy "public can read rooms" on public.rooms for select using (true);
create policy "public can create rooms" on public.rooms for insert with check (true);
create policy "public can update rooms" on public.rooms for update using (true) with check (true);
create policy "public can read members" on public.room_members for select using (true);
create policy "public can manage members" on public.room_members for all using (true) with check (true);
create policy "public can read items" on public.items for select using (true);
create policy "public can manage items" on public.items for all using (true) with check (true);
create policy "public can read item shares" on public.item_shares for select using (true);
create policy "public can manage item shares" on public.item_shares for all using (true) with check (true);

-- Enable Realtime publication for cross-device room updates.
alter publication supabase_realtime add table public.rooms;
alter publication supabase_realtime add table public.room_members;
alter publication supabase_realtime add table public.items;
alter publication supabase_realtime add table public.item_shares;
