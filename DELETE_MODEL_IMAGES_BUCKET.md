# 删除 model-images 存储桶指南

## 📋 操作步骤

由于 Supabase Storage 存储桶需要特殊权限，请在 Supabase Dashboard 中手动操作：

### 1. 登录 Supabase Dashboard
访问: https://supabase.com/dashboard

### 2. 选择你的项目
选择项目: `xpksqkhgfqekysbebznv`

### 3. 进入 Storage 管理
- 左侧菜单点击 **Storage**
- 你会看到两个存储桶:
  - `car-images` (保留)
  - `model-images` (删除)

### 4. 删除 model-images 存储桶
1. 点击 `model-images` 存储桶右侧的 **...** (更多) 按钮
2. 选择 **Delete bucket** 或 **删除存储桶**
3. 确认删除操作

---

## ⚠️ 注意事项

- `car-images` 是新版本正在使用的存储桶，**不要删除！**
- `model-images` 是旧版本遗留的，可以安全删除

---

## ✅ 验证

删除后，你的 Storage 应该只保留一个存储桶：
- `car-images`
