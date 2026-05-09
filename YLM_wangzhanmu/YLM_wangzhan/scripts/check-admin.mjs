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

  console.log("查询 admin_users 表...");
  const { data, error } = await supabase.from("admin_users").select("*");
  if (error) {
    console.error("查询失败:", error);
    process.exit(1);
  }

  console.log("");
  console.log("当前 admin_users 数据:");
  console.log(JSON.stringify(data, null, 2));
  console.log("");
}

main().catch(console.error);
