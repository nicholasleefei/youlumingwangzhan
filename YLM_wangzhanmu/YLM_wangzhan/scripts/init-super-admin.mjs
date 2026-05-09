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
const ADMIN_PASSWORD = "cxks2011";

async function main() {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    console.error("请配置 VITE_SUPABASE_URL 和 SUPABASE_SERVICE_ROLE_KEY");
    process.exit(1);
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  console.log("正在检查或创建管理员...");

  let { data: existing, error: listErr } = await supabase.auth.admin.listUsers();
  if (listErr) {
    console.error("列出用户失败:", listErr);
    process.exit(1);
  }

  let adminUserId = null;

  for (const user of existing.users) {
    if (user.email === ADMIN_EMAIL) {
      adminUserId = user.id;
      console.log(`找到已存在的管理员用户: ${ADMIN_EMAIL} (${adminUserId})`);
      break;
    }
  }

  if (!adminUserId) {
    console.log("创建新的管理员用户...");
    const { data, error } = await supabase.auth.admin.createUser({
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
      email_confirm: true,
    });
    if (error) {
      console.error("创建用户失败:", error);
      process.exit(1);
    }
    adminUserId = data.user.id;
    console.log(`创建成功: ${adminUserId}`);
  }

  console.log("写入 admin_users 表...");
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
    console.error("写入 admin_users 失败:", upsertErr);
    process.exit(1);
  }

  console.log("");
  console.log("✅ 默认超级管理员已配置:");
  console.log(`   邮箱: ${ADMIN_EMAIL}`);
  console.log(`   密码: ${ADMIN_PASSWORD}`);
  console.log("");
}

main().catch(console.error);
