-- Rode este SQL se sua tabela bets/profiles ja existe e esta dando erro de coluna ausente.
create extension if not exists "pgcrypto";

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text,
  email text,
  created_at timestamptz not null default now()
);

alter table public.bets add column if not exists event text;
alter table public.bets add column if not exists stake numeric;
alter table public.bets add column if not exists odd numeric;
alter table public.bets add column if not exists result text;
alter table public.bets add column if not exists ticket text;
alter table public.bets add column if not exists markets text[] default '{}';
alter table public.bets add column if not exists created_at timestamptz not null default now();

alter table public.profiles enable row level security;
alter table public.bets enable row level security;

drop policy if exists "Todos podem ver perfis" on public.profiles;
drop policy if exists "Usuario cria seu perfil" on public.profiles;
drop policy if exists "Usuario atualiza seu perfil" on public.profiles;
drop policy if exists "Todos podem ver bets para ranking" on public.bets;
drop policy if exists "Usuario cria suas bets" on public.bets;
drop policy if exists "Usuario edita suas bets" on public.bets;
drop policy if exists "Usuario apaga suas bets" on public.bets;

create policy "Todos podem ver perfis" on public.profiles for select using (true);
create policy "Usuario cria seu perfil" on public.profiles for insert with check (auth.uid() = id);
create policy "Usuario atualiza seu perfil" on public.profiles for update using (auth.uid() = id) with check (auth.uid() = id);
create policy "Todos podem ver bets para ranking" on public.bets for select using (true);
create policy "Usuario cria suas bets" on public.bets for insert with check (auth.uid() = user_id);
create policy "Usuario edita suas bets" on public.bets for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Usuario apaga suas bets" on public.bets for delete using (auth.uid() = user_id);

insert into public.profiles (id, name, email)
select id, coalesce(raw_user_meta_data->>'name', split_part(email, '@', 1)), email
from auth.users
on conflict (id) do update set
  name = coalesce(excluded.name, profiles.name),
  email = coalesce(excluded.email, profiles.email);
