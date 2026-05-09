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

const ADMIN_EMAIL = "1398234769@qq.com";

async function main() {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    console.error("请配置 VITE_SUPABASE_URL 和 SUPABASE_SERVICE_ROLE_KEY");
    process.exit(1);
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  console.log("查找 auth 用户...");
  let { data: existing, error: listErr } = await supabase.auth.admin.listUsers();
  if (listErr) {
    console.error("列出用户失败:", listErr);
    process.exit(1);
  }

  let adminUser = null;
  for (const user of existing.users) {
    if (user.email === ADMIN_EMAIL) {
      adminUser = user;
      console.log(`找到 auth 用户: ${adminUser.id} - ${adminUser.email}`);
      break;
    }
  }

  if (!adminUser) {
    console.error("未找到 auth 用户");
    process.exit(1);
  }

  console.log("\n查询 admin_users 表...");
  const { data, error } = await supabase
    .from("admin_users")
    .select("*")
    .eq("id", adminUser.id)
    .maybeSingle();

  console.log("查询结果 error:", error);
  console.log("查询结果 data:", JSON.stringify(data, null, 2));
}

main().catch(console.error);
