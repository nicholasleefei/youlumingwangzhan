#!/usr/bin/env node
import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function loadEnv() {
  const envPath = path.join(__dirname, "..", ".env");
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
  console.log("=== 应用 activity_status 列迁移 ===");

  // 首先检查环境变量
  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    console.error("❌ 缺少环境变量！");
    if (!SUPABASE_SERVICE_KEY) {
      console.error("  请在 .env 文件中添加 SUPABASE_SERVICE_ROLE_KEY。");
      console.error("  可以从 Supabase 控制台获取此密钥。");
      console.error("  访问: https://supabase.com/dashboard/project/xpksqkhgfqekysbebznv/settings/api");
    }
    console.error("\n  当前 .env 文件内容:");
    Object.entries(env).forEach(([k, v]) =>
      console.error(`    ${k} = ${v}`)
    );
    return;
  }

  // 连接到 Supabase
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  console.log("✅ 连接到 Supabase 成功");

  // 读取 SQL 文件
  const sqlFile = path.join(__dirname, "..", "migrations", "add_activity_status_columns.sql");

  if (!fs.existsSync(sqlFile)) {
    console.error(`❌ 未找到 SQL 文件: ${sqlFile}`);
    return;
  }

  const sql = fs.readFileSync(sqlFile, "utf8");
  console.log("✅ 读取 SQL 迁移文件成功");

  try {
    // 首先检查是否可以访问数据库
    console.log("\n1. 检查是否可以查询现有的表结构...");
    const { data: testData, error: testError } = await supabase
      .from('models')
      .select('id')
      .limit(1);

    if (testError) {
      console.error(`  ❌ 查询失败: ${testError.message}`);
      return;
    }

    console.log(`  ✅ 查询成功，找到 ${testData ? testData.length : 0} 条记录`);

    // 检查 RPC 函数 exec_sql 是否存在
    console.log("\n2. 检查 exec_sql RPC 函数是否可用...");
    try {
      const { data: rpcResult, error: rpcError } = await supabase.rpc('exec_sql', {
        sql_text: "SELECT 1 as test"
      });

      if (rpcError) {
        console.warn(`  ⚠️ RPC 函数不可用: ${rpcError.message}`);
        console.warn("  需要先在 Supabase 控制台中创建此函数。");
      } else {
        console.log(`  ✅ RPC 函数可用，返回结果:`, rpcResult);
      }
    } catch (e) {
      console.warn(`  ⚠️ RPC 函数调用错误: ${e.message}`);
    }

    console.log("\n" + "=".repeat(80));
    console.log("需要在 Supabase 控制台中执行以下 SQL 迁移：");
    console.log("=".repeat(80));
    console.log("\n" + sql);
    console.log("\n" + "=".repeat(80));

    console.log("\n⏰ 执行步骤:");
    console.log("1. 访问: https://supabase.com/dashboard/project/xpksqkhgfqekysbebznv/sql");
    console.log("2. 复制上面的 SQL");
    console.log("3. 粘贴到 SQL 编辑器中");
    console.log("4. 点击 'Run' 按钮");
    console.log("5. 等待执行完成");

    console.log("\n✅ 执行完成后，你的批量更新功能就可以正常工作了！");
    console.log("然后你可以尝试使用 /bulk_update 功能测试一下。");

  } catch (error) {
    console.error("\n❌ 迁移过程中出错:");
    console.error(error);
    if (error.code === 'PGRST301') {
      console.error("\n  这是一个常见的 Supabase RPC 函数错误。");
      console.error("  请按照上面的步骤在 Supabase 控制台执行 SQL。");
    }
  }
}

main().catch(console.error);