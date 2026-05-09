# 数据库表清单 - 最终版

## ✅ 保留的表（必需）

### 前端展示使用
1. **models** - 车型主表
2. **model_images** - 车型图表
3. **model_translations** - 车型翻译表

### 管理后台使用（聚美数据）
4. **brands** - 品牌表
5. **series** - 车系表
6. **models_jumdata** - 车型表（聚美数据）
7. **model_details** - 车型详情表

### 管理后台使用（新方案V2）
8. **car_pictures** - 车型图片表（新方案V2）

### 核心业务表
9. **inquiries** - 询盘表
10. **inquiry_items** - 询盘项目表
11. **admin_users** - 管理员用户表
12. **site_config** - 网站配置表
13. **country_sales** - 国家销售数据表

---

## ❌ 已删除的表

1. ~~model_resources~~ - 旧版本资源表
2. ~~brand_logos~~ - 品牌Logo表（未使用）

---

## 📦 Storage存储桶

1. **car-images** - 新方案使用（保留）
2. **model-images** - 旧方案使用（需要在 Supabase Dashboard 中手动删除）

---

## 📝 说明

- **models / model_images / model_translations** 是前端页面展示用的核心表
- **brands / series / models_jumdata / model_details** 是管理后台用于数据管理的表
- **car_pictures** 是新方案V2用于图片管理的表
- 其他表都是业务必需表
