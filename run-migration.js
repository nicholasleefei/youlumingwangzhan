import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";

const __dirname = path.dirname(new URL(import.meta.url).pathname);

// 环境变量
const SUPABASE_URL = "https://xpksqkhgfqekysbebznv.supabase.co";
const SUPABASE_SERVICE_KEY = "feifaguo2010"; // 临时存储

async function main() {
  console.log("=== 开始执行数据库迁移 ===");

  // 连接到 Supabase
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  console.log("✅ 连接成功");

  // 读取 SQL 文件
  const sqlPath = path.join(__dirname, "migrations", "add_activity_status_columns.sql");
  const sqlContent = fs.readFileSync(sqlPath, "utf8");

  console.log("✅ SQL 文件读取成功");

  // 尝试直接执行 SQL
  try {
    // 注意：Supabase JS 客户端不支持直接执行多个语句
    // 需要使用 RPC 函数
    console.log("\n尝试使用 RPC 函数 exec_sql...");
    const { data, error } = await supabase.rpc('exec_sql', {
      sql_text: sqlContent
    });

    if (error) {
      console.error("❌ RPC 执行失败:", error);

      // 如果 RPC 不可用，显示手动执行步骤
      console.log("\n" + "=".repeat(80));
      console.log("需要在 Supabase 控制台手动执行 SQL：");
      console.log("=".repeat(80));
      console.log(sqlContent);
      console.log("\n" + "=".repeat(80));
      console.log("\n访问：https://supabase.com/dashboard/project/xpksqkhgfqekysbebznv/sql");
      console.log("粘贴以上 SQL 并点击 Run 按钮。");
    } else {
      console.log("✅ SQL 执行成功：", data);
    }

  } catch (e) {
    console.error("❌ 执行过程中出错:", e);

    // 显示手动执行步骤
    console.log("\n" + "=".repeat(80));
    console.log("需要在 Supabase 控制台手动执行 SQL：");
    console.log("=".repeat(80));
    console.log(sqlContent);
    console.log("\n" + "=".repeat(80));
    console.log("\n访问：https://supabase.com/dashboard/project/xpksqkhgfqekysbebznv/sql");
    console.log("粘贴以上 SQL 并点击 Run 按钮。");
  }

  console.log("\n" + "=".repeat(80));
  console.log("迁移完成！");
}

main().catch(err => {
  console.error("❌ 程序错误：", err);
  process.exit(1);
});