# 数据库迁移执行指南

## 📌 当前状态

✅ 迁移文件已创建：`supabase/migrations/0030_complete_model_details_fields.sql`
⏳ **等待执行**

---

## 🚀 执行方法（推荐）

### 方法1：通过 Supabase Dashboard（最简单）

1. **打开 Supabase Dashboard**
   - 访问：https://supabase.com/dashboard
   - 选择您的项目：`xpksqkhgfqekysbebznv`

2. **进入 SQL Editor**
   - 左侧菜单点击 "SQL Editor"
   - 点击 "New query"

3. **打开迁移文件**
   - 在您的电脑上打开文件：
     `d:\fei's_project_cc2026\YLM\Yolumi\YLM_wangzhan\supabase\migrations\0030_complete_model_details_fields.sql`

4. **复制并执行**
   - 全选文件内容 (Ctrl+A)
   - 复制 (Ctrl+C)
   - 粘贴到 SQL Editor (Ctrl+V)
   - 点击 "Run" 或按 (Ctrl+Enter)

5. **验证结果**
   - 查看执行结果，应该显示 "Success"
   - 没有错误的话，迁移就完成了！

---

### 方法2：检查是否有 Service Role Key

如果您有 `SUPABASE_SERVICE_ROLE_KEY`，可以通过脚本执行。

**检查 .env 文件**：
```env
# 当前的 .env 只有：
VITE_SUPABASE_URL=https://xpksqkhgfqekysbebznv.supabase.co
VITE_SUPABASE_ANON_KEY=...

# 缺少：
SUPABASE_SERVICE_ROLE_KEY=...
```

**获取 Service Role Key**：
1. 在 Supabase Dashboard 中
2. 点击左侧 "Settings" -> "API"
3. 找到 "service_role" secret
4. 添加到 .env 文件

---

## ✅ 验证迁移是否成功

执行完迁移后，运行以下验证：

### 1. 检查表结构
在 SQL Editor 中运行：
```sql
-- 检查 model_details 表的字段数量
select count(*) 
from information_schema.columns 
where table_name = 'model_details';

-- 应该返回 400+ 个字段
```

### 2. 检查新字段
```sql
-- 检查是否有新增字段
select column_name 
from information_schema.columns 
where table_name = 'model_details'
and column_name like 'basic_%'
or column_name like 'body_%'
or column_name like 'engine_%'
or column_name like 'seat_%'
order by column_name;
```

### 3. 运行完整性检查
```bash
cd d:\fei's_project_cc2026\YLM\Yolumi\YLM_wangzhan
node scripts/jumdata_integrity_check.js
```

---

## 📋 迁移内容概览

此次迁移添加了：

| 类别 | 字段数 | 示例 |
|------|--------|------|
| basic (基本信息) | 14 | basic_price, basic_gearbox |
| body (车身) | 20 | body_len, body_weight |
| engine (发动机) | 40 | engine_maxpower, engine_batterycapacity |
| seat (座椅) | 24 | seat_seatmaterial, seat_seatheating |
| light (灯光) | 18 | light_headlighttype |
| safe (安全) | 26 | safe_airbagdrivingposition |
| 其他 | 200+ | incarcharge, drivingfunction, etc. |

**总计**: 400+ 个字段

---

## 🎯 执行后的下一步

迁移完成后：

1. ✅ **验证表结构** - 按上面的SQL检查
2. 🔍 **运行完整性检查** - `node scripts/jumdata_integrity_check.js`
3. 📝 **测试导入** - 在Admin后台导入一个车型详情
4. 👀 **验证字段** - 检查数据库中是否有所有字段的值

---

## ⚠️ 注意事项

1. **备份数据** - 在执行前建议先备份重要数据
2. **字段已存在** - 脚本使用 `IF NOT EXISTS`，所以重复执行没问题
3. **执行时间** - 由于字段较多，可能需要几分钟
4. **权限问题** - 确保您有足够的数据库权限

---

## ❓ 遇到问题？

如果执行中遇到错误，请提供：
1. 错误信息截图
2. SQL Editor 中的错误提示
3. 您尝试的步骤

---

## 📞 快速开始

**现在就开始**：
1. 打开 Supabase Dashboard
2. 进入 SQL Editor
3. 打开文件：`supabase/migrations/0030_complete_model_details_fields.sql`
4. 复制并运行！

有任何问题随时告诉我！
