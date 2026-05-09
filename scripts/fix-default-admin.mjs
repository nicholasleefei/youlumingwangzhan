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

  console.log("正在查找用户...");
  let { data: existing, error: listErr } = await supabase.auth.admin.listUsers();
  if (listErr) {
    console.error("列出用户失败:", listErr);
    process.exit(1);
  }

  let adminUserId = null;
  for (const user of existing.users) {
    if (user.email === ADMIN_EMAIL) {
      adminUserId = user.id;
      console.log(`找到用户: ${ADMIN_EMAIL} (${adminUserId})`);
      break;
    }
  }

  if (!adminUserId) {
    console.error("未找到用户");
    process.exit(1);
  }

  console.log("更新权限: is_super_admin = true, is_approved = true...");
  const { error: upsertErr } = await supabase
    .from("admin_users")
    .upsert({
      id: adminUserId,
      email: ADMIN_EMAIL,
      is_super_admin: true,
      is_approved: true,
    })
    .select();

  if (upsertErr) {
    console.error("更新失败:", upsertErr);
    process.exit(1);
  }

  console.log("");
  console.log("✅ 已修复默认管理员权限:");
  console.log(`   邮箱: ${ADMIN_EMAIL}`);
  console.log(`   超级管理员: 是`);
  console.log(`   已批准: 是`);
  console.log("");
}

main().catch(console.error);
