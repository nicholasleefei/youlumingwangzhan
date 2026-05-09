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

  console.log("=== 尝试直接创建 brands 表 ===");
  
  console.log("\n由于 Supabase JS 客户端的限制，我需要分步执行。");
  console.log("让我尝试一些简单的操作来验证连接...\n");

  console.log("1. 先检查是否可以查询现有表...");
  try {
    const { data, error } = await supabase
      .from('models')
      .select('count', { count: 'exact', head: true });
    
    if (error) {
      console.log("   查询 models 表失败:", error.message);
    } else {
      console.log("   ✅ 连接成功！models 表中有", data, "条记录");
    }
  } catch (e) {
    console.log("   连接验证出错:", e.message);
  }

  console.log("\n" + "=".repeat(80));
  console.log("很抱歉，Supabase JS 客户端无法直接执行 CREATE TABLE 这样的 DDL 语句。");
  console.log("\n请按以下步骤操作：");
  console.log("\n1. 打开：https://supabase.com/dashboard/project/xpksqkhgfqekysbebznv/sql/new");
  console.log("2. 复制粘贴完整的 SQL（我之前已经给你了）");
  console.log("3. 点击 'Run' 按钮");
  console.log("\n执行完后告诉我，我会帮你验证！");
  console.log("=".repeat(80));
}

main().catch(console.error);
