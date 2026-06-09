-- 彻底重建翻译表：每个翻译表复制对应原表的所有列
-- 原表列结构（从 information_schema.columns 查询得到）

-- brands: id, jm_id, name, initial, logo_url, parent_id, depth, created_at, updated_at, activity_status, fullname
-- series: id, jm_id, brand_jm_id, brand_id, name, fullname, initial, logo_url, salestate, depth, subcompany_name, subcompany_jm_id, created_at, updated_at, activity_status, activity_status_manual, brand_name
-- models_jumdata: id, jm_id, series_jm_id, series_id, brand_jm_id, brand_id, name, groupid, groupname, sizetype, displacement2, displacement, geartype, geartype2, logo_url, yeartype, listdate, price, productionstate, salestate, depth, created_at, updated_at, activity_status, activity_status_manual, brand_name, series_name
-- model_details: id, jm_id, model_jm_id, model_id, series_jm_id, series_id, brand_jm_id, brand_id, name, brandname, parentname, parentid, groupid, groupname, environmentalstandards, environmentalstandards2, displacement, displacement2, drivemode, drivemode2, sizetype, price, logo_url, initial, productionstate, salestate, yeartype, listdate, seatnum, depth, geartype, geartype2, gearnum, compartnum, created_at, updated_at, activity_status, activity_status_manual, raw, hot_sale, hot_card_cover_url

-- 建表语句：用 CREATE TABLE ... (LIKE source_table) 直接复制表结构
-- 翻译表名: brands_en, brands_ar, brands_ru, brands_th, brands_ur, brands_tr, brands_pt_br 等

-- Step 1: 删除旧翻译表
DO $$ BEGIN
  DROP TABLE IF EXISTS public.brands_en, public.brands_ar, public.brands_ru, public.brands_th, public.brands_ur, public.brands_tr, public.brands_pt_br CASCADE;
  DROP TABLE IF EXISTS public.series_en, public.series_ar, public.series_ru, public.series_th, public.series_ur, public.series_tr, public.series_pt_br CASCADE;
  DROP TABLE IF EXISTS public.models_jumdata_en, public.models_jumdata_ar, public.models_jumdata_ru, public.models_jumdata_th, public.models_jumdata_ur, public.models_jumdata_tr, public.models_jumdata_pt_br CASCADE;
  DROP TABLE IF EXISTS public.model_details_en, public.model_details_ar, public.model_details_ru, public.model_details_th, public.model_details_ur, public.model_details_tr, public.model_details_pt_br CASCADE;
END$$;

-- Step 2: 用 LIKE 复制原表结构创建翻译表
CREATE TABLE public.brands_en (LIKE public.brands INCLUDING ALL);
CREATE TABLE public.brands_ar (LIKE public.brands INCLUDING ALL);
CREATE TABLE public.brands_ru (LIKE public.brands INCLUDING ALL);
CREATE TABLE public.brands_th (LIKE public.brands INCLUDING ALL);
CREATE TABLE public.brands_ur (LIKE public.brands INCLUDING ALL);
CREATE TABLE public.brands_tr (LIKE public.brands INCLUDING ALL);
CREATE TABLE public.brands_pt_br (LIKE public.brands INCLUDING ALL);

CREATE TABLE public.series_en (LIKE public.series INCLUDING ALL);
CREATE TABLE public.series_ar (LIKE public.series INCLUDING ALL);
CREATE TABLE public.series_ru (LIKE public.series INCLUDING ALL);
CREATE TABLE public.series_th (LIKE public.series INCLUDING ALL);
CREATE TABLE public.series_ur (LIKE public.series INCLUDING ALL);
CREATE TABLE public.series_tr (LIKE public.series INCLUDING ALL);
CREATE TABLE public.series_pt_br (LIKE public.series INCLUDING ALL);

CREATE TABLE public.models_jumdata_en (LIKE public.models_jumdata INCLUDING ALL);
CREATE TABLE public.models_jumdata_ar (LIKE public.models_jumdata INCLUDING ALL);
CREATE TABLE public.models_jumdata_ru (LIKE public.models_jumdata INCLUDING ALL);
CREATE TABLE public.models_jumdata_th (LIKE public.models_jumdata INCLUDING ALL);
CREATE TABLE public.models_jumdata_ur (LIKE public.models_jumdata INCLUDING ALL);
CREATE TABLE public.models_jumdata_tr (LIKE public.models_jumdata INCLUDING ALL);
CREATE TABLE public.models_jumdata_pt_br (LIKE public.models_jumdata INCLUDING ALL);

CREATE TABLE public.model_details_en (LIKE public.model_details INCLUDING ALL);
CREATE TABLE public.model_details_ar (LIKE public.model_details INCLUDING ALL);
CREATE TABLE public.model_details_ru (LIKE public.model_details INCLUDING ALL);
CREATE TABLE public.model_details_th (LIKE public.model_details INCLUDING ALL);
CREATE TABLE public.model_details_ur (LIKE public.model_details INCLUDING ALL);
CREATE TABLE public.model_details_tr (LIKE public.model_details INCLUDING ALL);
CREATE TABLE public.model_details_pt_br (LIKE public.model_details INCLUDING ALL);

-- Step 3: RLS
DO $$ DECLARE tbl text; loc text; locales text[] := ARRAY['en','ar','ru','th','ur','tr','pt_br'];
  prefixes text[] := ARRAY['brands','series','models_jumdata','model_details'];
BEGIN
  FOR tbl IN SELECT unnest(prefixes) LOOP
    FOR loc IN SELECT unnest(locales) LOOP
      EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', tbl||'_'||loc);
      EXECUTE format('CREATE POLICY %I ON public.%I FOR SELECT TO anon USING (true)', tbl||'_'||loc||'_sel', tbl||'_'||loc);
      EXECUTE format('CREATE POLICY %I ON public.%I FOR ALL TO authenticated USING (exists(select 1 from admin_users where id=auth.uid() and is_approved))', tbl||'_'||loc||'_admin', tbl||'_'||loc);
    END LOOP;
  END LOOP;
END$$;

-- Step 4: 清空并重新入队
DELETE FROM translation_jobs;
SELECT sync_translation_changes();