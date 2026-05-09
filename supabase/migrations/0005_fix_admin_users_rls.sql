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
