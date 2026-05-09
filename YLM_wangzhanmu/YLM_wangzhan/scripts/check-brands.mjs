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

async function main() {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    console.error("请配置 VITE_SUPABASE_URL 和 SUPABASE_SERVICE_ROLE_KEY");
    process.exit(1);
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  console.log("=== 检查 brands 表 ===");

  console.log("\n1. 查询 brands 表所有数据...");
  const { data: brands, error: brandsError } = await supabase
    .from('brands')
    .select('*')
    .order('jm_id', { ascending: true });

  if (brandsError) {
    console.error("查询错误:", brandsError);
  } else {
    console.log(`找到 ${brands?.length || 0} 条品牌记录`);
    if (brands && brands.length > 0) {
      console.log("\n品牌列表:");
      brands.forEach((b, i) => {
        console.log(`  ${i + 1}. [${b.jm_id}] ${b.name} (${b.initial || '-'})`);
      });
    }
  }

  console.log("\n=== 检查完成 ===");
}

main().catch(console.error);
