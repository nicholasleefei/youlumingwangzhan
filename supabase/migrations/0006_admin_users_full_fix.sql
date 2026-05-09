drop policy if exists admin_users_select_approved on public.admin_users;
create policy admin_users_select_approved
on public.admin_users
for select
to authenticated
using (true);
