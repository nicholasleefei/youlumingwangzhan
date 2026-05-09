#!/usr/bin/env node
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('请设置 VITE_SUPABASE_URL 和 SUPABASE_SERVICE_ROLE_KEY 环境变量');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
});

const migrationPath = path.join(__dirname, '../supabase/migrations/0018_model_details_complete.sql');
const sql = fs.readFileSync(migrationPath, 'utf-8');

async function applyMigration() {
  console.log('开始应用迁移 0018_model_details_complete.sql...');
  
  try {
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    console.log(`找到 ${statements.length} 条语句`);

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      console.log(`执行语句 ${i + 1}/${statements.length}...`);
      
      try {
        const { error } = await supabase.rpc('exec_sql', { sql_query: statement });
        if (error) {
          console.error(`语句 ${i + 1} 执行失败:`, error.message);
        } else {
          console.log(`语句 ${i + 1} 执行成功`);
        }
      } catch (e) {
        console.error(`语句 ${i + 1} 执行出错:`, e);
      }
    }

    console.log('迁移应用完成！');
  } catch (e) {
    console.error('迁移应用失败:', e);
    process.exit(1);
  }
}

applyMigration();
