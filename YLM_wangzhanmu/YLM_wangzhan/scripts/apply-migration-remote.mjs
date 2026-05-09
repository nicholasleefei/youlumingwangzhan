#!/usr/bin/env node
import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function loadEnv() {
  const envPath = path.join(__dirname, "..", ".env.local");
  if (!fs.existsSync(envPath)) return {};
  const content = fs.readFileSync(envPath, "utf8");
  const env = {};
  for (const line of content.split("\n")) {
    const [key, ...valueParts] = line.split("=");
    if (key && key.trim()) {
      env[key.trim()] = valueParts.join("=").trim();
    }
  }
  return env;
}

const env = loadEnv();
const SUPABASE_URL = env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = env.SUPABASE_SERVICE_ROLE_KEY;

async function executeSql(supabase, sql) {
  const { data, error } = await supabase.rpc('exec_sql', { sql_text: sql });
  if (error) {
    console.error('执行错误:', error);
    return false;
  }
  return true;
}

async function main() {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    console.error("请配置 VITE_SUPABASE_URL 和 SUPABASE_SERVICE_ROLE_KEY");
    process.exit(1);
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  console.log("=== 尝试应用 brands 迁移 ===");
  console.log("\n注意：Supabase JS 客户端不支持直接执行多语句 SQL。");
  console.log("\n让我尝试创建一个简单的 SQL 执行函数...");

  const migrationFile = path.join(__dirname, "..", "supabase", "migrations", "0012_brands_logo_storage.sql");
  const migrationSql = fs.readFileSync(migrationFile, "utf8");

  console.log("\n" + "=".repeat(80));
  console.log("请复制以下 SQL 并在 Supabase 控制台执行：");
  console.log("=".repeat(80));
  console.log("\n" + migrationSql);
  console.log("\n" + "=".repeat(80));

  console.log("\n或者访问：");
  console.log(`https://supabase.com/dashboard/project/${SUPABASE_URL.split('.')[0].replace('https://', '')}/sql/new`);
  console.log("\n粘贴上面的 SQL 并点击 'Run' 按钮。");
  console.log("\n执行完成后，回来告诉我，我会帮你验证！");
}

main().catch(console.error);
