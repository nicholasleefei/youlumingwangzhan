-- 禁用关键表的 RLS 策略，确保可以正常读写
-- 这些表需要在后台管理中频繁操作

-- 1. 禁用 car_pictures 表的 RLS
ALTER TABLE car_pictures DISABLE ROW LEVEL SECURITY;

-- 2. 禁用 model_resources 表的 RLS（如果还没禁用）
ALTER TABLE model_resources DISABLE ROW LEVEL SECURITY;

-- 3. 禁用 models 表的 RLS（如果还没禁用）
ALTER TABLE models DISABLE ROW LEVEL SECURITY;

-- 4. 禁用 brands 表的 RLS（如果还没禁用）
ALTER TABLE brands DISABLE ROW LEVEL SECURITY;

-- 5. 禁用 series 表的 RLS（如果还没禁用）
ALTER TABLE series DISABLE ROW LEVEL SECURITY;

-- 6. 禁用 model_details 表的 RLS
ALTER TABLE model_details DISABLE ROW LEVEL SECURITY;

-- 7. 禁用 models_jumdata 表的 RLS
ALTER TABLE models_jumdata DISABLE ROW LEVEL SECURITY;

-- 8. 禁用 inquiries 表的 RLS
ALTER TABLE inquiries DISABLE ROW LEVEL SECURITY;

-- 9. 禁用 inquiry_items 表的 RLS
ALTER TABLE inquiry_items DISABLE ROW LEVEL SECURITY;

-- 10. 禁用 model_images 表的 RLS
ALTER TABLE model_images DISABLE ROW LEVEL SECURITY;

-- 11. 禁用 model_translations 表的 RLS
ALTER TABLE model_translations DISABLE ROW LEVEL SECURITY;

-- 12. 禁用 site_config 表的 RLS
ALTER TABLE site_config DISABLE ROW LEVEL SECURITY;

-- 13. 禁用 country_sales 表的 RLS
ALTER TABLE country_sales DISABLE ROW LEVEL SECURITY;

-- 14. 禁用 brand_logos 表的 RLS
ALTER TABLE brand_logos DISABLE ROW LEVEL SECURITY;

-- 再次确认权限
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
