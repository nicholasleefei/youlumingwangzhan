-- 创建 models 存储桶
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'models',
  'models',
  true,
  10485760,
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif']::text[]
)
on conflict (id) do nothing;

-- 为 authenticated (admin) 开启上传权限
create policy "Allow authenticated upload to models"
on storage.objects
for insert
to authenticated
with check (bucket_id = 'models');

-- 为 authenticated (admin) 开启更新权限
create policy "Allow authenticated update to models"
on storage.objects
for update
to authenticated
using (bucket_id = 'models');

-- 为 authenticated (admin) 开启删除权限
create policy "Allow authenticated delete from models"
on storage.objects
for delete
to authenticated
using (bucket_id = 'models');

-- 公开访问
create policy "Give public access to models"
on storage.objects
for select
to public
using (bucket_id = 'models');
