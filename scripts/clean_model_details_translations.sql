-- Clean all corrupted model_detail translation rows and re-queue
DO $$
DECLARE
  locales text[] := ARRAY['en', 'ar', 'ru', 'th', 'ur', 'tr', 'pt_br'];
  loc text;
  tablename text;
  deleted_count integer;
  total_deleted integer := 0;
BEGIN
  FOREACH loc IN ARRAY locales
  LOOP
    tablename := 'model_details_' || loc;
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = tablename) THEN
      EXECUTE format('DELETE FROM public.%I', tablename);
      GET DIAGNOSTICS deleted_count = ROW_COUNT;
      total_deleted := total_deleted + deleted_count;
      RAISE NOTICE 'Cleaned %: % rows deleted', tablename, deleted_count;
    END IF;
  END LOOP;
  RAISE NOTICE 'Total deleted across all model_details_* tables: %', total_deleted;
END $$;

-- Delete done/error model_detail translation jobs
DELETE FROM public.translation_jobs
WHERE entity_type = 'model_detail'
  AND status IN ('done', 'error');

-- Re-sync to enqueue fresh jobs
SELECT public.sync_translation_changes();

-- Verify
SELECT 'model_details_en' as tbl, count(*) as cnt FROM model_details_en
UNION ALL SELECT 'model_details_ar', count(*) FROM model_details_ar
UNION ALL SELECT 'model_details_ru', count(*) FROM model_details_ru
UNION ALL SELECT 'model_details_th', count(*) FROM model_details_th
UNION ALL SELECT 'model_details_ur', count(*) FROM model_details_ur
UNION ALL SELECT 'model_details_tr', count(*) FROM model_details_tr
UNION ALL SELECT 'model_details_pt_br', count(*) FROM model_details_pt_br
UNION ALL SELECT 'pending_jobs', count(*) FROM translation_jobs WHERE entity_type='model_detail' AND status='pending'
UNION ALL SELECT 'total_jobs', count(*) FROM translation_jobs WHERE entity_type='model_detail';
