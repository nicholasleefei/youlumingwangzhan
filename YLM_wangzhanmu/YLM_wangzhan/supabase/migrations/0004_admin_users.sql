create table if not exists public.admin_users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text unique not null,
  is_super_admin boolean not null default false,
  is_approved boolean not null default false,
  approved_by uuid references public.admin_users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_admin_users_email on public.admin_users(email);
create index if not exists idx_admin_users_is_approved on public.admin_users(is_approved);
create index if not exists idx_admin_users_is_super_admin on public.admin_users(is_super_admin);

drop trigger if exists trg_admin_users_updated_at on public.admin_users;
create trigger trg_admin_users_updated_at
before update on public.admin_users
for each row execute function public.set_updated_at();

alter table public.admin_users enable row level security;

grant all privileges on public.admin_users to authenticated;

drop policy if exists admin_users_select_approved on public.admin_users;
create policy admin_users_select_approved
on public.admin_users
for select
to authenticated
using (
  is_approved = true or
  id = auth.uid()
);

drop policy if exists admin_users_manage_super_admin on public.admin_users;
create policy admin_users_manage_super_admin
on public.admin_users
for all
to authenticated
using (
  exists (
    select 1 from public.admin_users
    where id = auth.uid() and is_super_admin = true and is_approved = true
  )
)
with check (
  exists (
    select 1 from public.admin_users
    where id = auth.uid() and is_super_admin = true and is_approved = true
  )
);

drop policy if exists admin_users_insert_self on public.admin_users;
create policy admin_users_insert_self
on public.admin_users
for insert
to authenticated
with check (
  id = auth.uid()
);
