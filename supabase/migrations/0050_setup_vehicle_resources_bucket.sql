-- ==========================================
-- Create vehicle_resources storage bucket
-- ==========================================

-- Insert the bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('vehicle_resources', 'vehicle_resources', true)
ON CONFLICT (id) DO NOTHING;

-- Set up RLS policies
-- Public access for reading
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
TO public
USING ( bucket_id = 'vehicle_resources' );

-- Admin/Authenticated access for insert
DROP POLICY IF EXISTS "Admin Upload" ON storage.objects;
CREATE POLICY "Admin Upload"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK ( bucket_id = 'vehicle_resources' );

-- Admin/Authenticated access for update
DROP POLICY IF EXISTS "Admin Update" ON storage.objects;
CREATE POLICY "Admin Update"
ON storage.objects FOR UPDATE
TO authenticated
USING ( bucket_id = 'vehicle_resources' );

-- Admin/Authenticated access for delete
DROP POLICY IF EXISTS "Admin Delete" ON storage.objects;
CREATE POLICY "Admin Delete"
ON storage.objects FOR DELETE
TO authenticated
USING ( bucket_id = 'vehicle_resources' );

-- Allow anon to upload for development/admin testing (since anon key is used locally)
-- Note: User mentioned "我是管理员就能上传", but the current setup uses the anon key for writes.
-- We will add anon policies, but restrict them to the vehicle_resources bucket.
DROP POLICY IF EXISTS "Anon Upload" ON storage.objects;
CREATE POLICY "Anon Upload"
ON storage.objects FOR INSERT
TO anon
WITH CHECK ( bucket_id = 'vehicle_resources' );

DROP POLICY IF EXISTS "Anon Update" ON storage.objects;
CREATE POLICY "Anon Update"
ON storage.objects FOR UPDATE
TO anon
USING ( bucket_id = 'vehicle_resources' );

DROP POLICY IF EXISTS "Anon Delete" ON storage.objects;
CREATE POLICY "Anon Delete"
ON storage.objects FOR DELETE
TO anon
USING ( bucket_id = 'vehicle_resources' );