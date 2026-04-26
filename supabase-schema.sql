-- TROPA RANK - Supabase schema
-- Cole este SQL no Supabase > SQL Editor > Run

create extension if not exists "pgcrypto";

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null,
  email text not null unique,
  created_at timestamptz not null default now()
);

create table if not exists public.bets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  event text not null,
  stake numeric(12,2) not null check (stake >= 0),
  odd numeric(8,2) not null check (odd >= 1),
  result text not null check (result in ('green','red','pending')),
  ticket text not null check (ticket in ('single','multiple')),
  markets text[] not null default '{}',
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
alter table public.bets enable row level security;

create policy "Todos podem ver perfis" on public.profiles
for select using (true);

create policy "Usuario cria seu perfil" on public.profiles
for insert with check (auth.uid() = id);

create policy "Usuario atualiza seu perfil" on public.profiles
for update using (auth.uid() = id) with check (auth.uid() = id);

create policy "Todos podem ver bets para ranking" on public.bets
for select using (true);

create policy "Usuario cria suas bets" on public.bets
for insert with check (auth.uid() = user_id);

create policy "Usuario edita suas bets" on public.bets
for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "Usuario apaga suas bets" on public.bets
for delete using (auth.uid() = user_id);

-- Para atualização rápida em tempo real:
alter publication supabase_realtime add table public.bets;
alter publication supabase_realtime add table public.profiles;
