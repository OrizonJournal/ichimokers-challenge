-- ============================================================
-- Ichimokers Challenge - Supabase Schema
-- Challenge: July 1, 2026 → December 31, 2026 (184 days)
-- ============================================================

-- Enable UUID extension (should be available by default in Supabase)
create extension if not exists "pgcrypto";

-- ============================================================
-- TABLES
-- ============================================================

-- Users table: one row per Circle community member
create table if not exists public.users (
  id               uuid primary key default gen_random_uuid(),
  circle_member_id text unique not null,
  name             text not null,
  avatar_url       text,
  email            text,
  bonus_points     integer not null default 0 check (bonus_points >= 0),
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

-- Check-ins table: one row per user per day they checked in
create table if not exists public.check_ins (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references public.users(id) on delete cascade,
  checked_date date not null,
  created_at   timestamptz not null default now(),
  -- A user can only check in once per day
  unique(user_id, checked_date)
);

-- ============================================================
-- INDEXES
-- ============================================================

create index if not exists idx_check_ins_user_id
  on public.check_ins(user_id);

create index if not exists idx_check_ins_checked_date
  on public.check_ins(checked_date);

create index if not exists idx_check_ins_user_date
  on public.check_ins(user_id, checked_date);

create index if not exists idx_users_circle_member_id
  on public.users(circle_member_id);

-- ============================================================
-- UPDATED_AT TRIGGER
-- ============================================================

create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger users_updated_at
  before update on public.users
  for each row
  execute function public.handle_updated_at();

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================

-- Enable RLS on both tables
alter table public.users enable row level security;
alter table public.check_ins enable row level security;

-- ============================================================
-- RLS POLICIES FOR USERS TABLE
-- ============================================================

-- Service role bypass (used by our server-side admin client)
-- Note: service role key bypasses RLS automatically in Supabase

-- Allow anyone to read basic user info (for leaderboard)
-- In production you may want to restrict this further
create policy "Public read access for leaderboard"
  on public.users
  for select
  using (true);

-- Only service role (via admin client) can insert/update users
-- Regular users go through our API which uses the service role key
create policy "Service role can manage users"
  on public.users
  for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

-- ============================================================
-- RLS POLICIES FOR CHECK_INS TABLE
-- ============================================================

-- Allow reading all check-ins (needed for leaderboard counts)
create policy "Public read access for check_ins"
  on public.check_ins
  for select
  using (true);

-- Only service role can insert/update/delete check-ins
create policy "Service role can manage check_ins"
  on public.check_ins
  for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

-- ============================================================
-- HELPFUL VIEWS
-- ============================================================

-- Leaderboard view with all computed stats
create or replace view public.leaderboard_view as
select
  u.id,
  u.circle_member_id,
  u.name,
  u.avatar_url,
  u.email,
  u.bonus_points,
  count(ci.id) as days_checked,
  (count(ci.id) * 2 + u.bonus_points) as total_points,
  u.created_at
from public.users u
left join public.check_ins ci on ci.user_id = u.id
group by u.id
order by total_points desc, days_checked desc;

-- ============================================================
-- FUNCTIONS
-- ============================================================

-- Get check-in count for a specific user
create or replace function public.get_user_checkin_count(p_user_id uuid)
returns integer as $$
  select count(*)::integer
  from public.check_ins
  where user_id = p_user_id;
$$ language sql stable;

-- Calculate total points for a user
create or replace function public.get_user_total_points(p_user_id uuid)
returns integer as $$
  select (count(ci.id) * 2 + u.bonus_points)::integer
  from public.users u
  left join public.check_ins ci on ci.user_id = u.id
  where u.id = p_user_id
  group by u.bonus_points;
$$ language sql stable;

-- ============================================================
-- NEW COLUMNS (added for profile + check-in pairs features)
-- ============================================================

-- Add trading profile columns to users
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS trading_pairs text[] DEFAULT '{}';
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS trading_style text CHECK (trading_style IN ('pro-trend', 'counter-trend'));
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS bio text;

-- Add pairs + notes to check-ins
ALTER TABLE public.check_ins ADD COLUMN IF NOT EXISTS pairs_traded text[] DEFAULT '{}';
ALTER TABLE public.check_ins ADD COLUMN IF NOT EXISTS notes text;

-- Index for feed queries (recent check-ins across all users)
CREATE INDEX IF NOT EXISTS idx_check_ins_created_at
  ON public.check_ins(created_at DESC);

-- ============================================================
-- SAMPLE DATA (for local development only — remove for prod)
-- ============================================================

-- Uncomment to add test data:
-- insert into public.users (circle_member_id, name, email, bonus_points)
-- values
--   ('circle_test_1', 'Alice Johnson', 'alice@example.com', 10),
--   ('circle_test_2', 'Bob Smith', 'bob@example.com', 0),
--   ('circle_test_3', 'Carol White', 'carol@example.com', 5);
