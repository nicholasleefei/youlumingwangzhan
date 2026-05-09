# 数据库表分析

## 📊 代码中实际使用的表

### ✅ 必需表（正在使用）
1. **brands** - 品牌表，管理后台和前端都在使用
2. **series** - 车系表，管理后台和前端都在使用
3. **models_jumdata** - 车型表（聚美数据），管理后台使用
4. **model_details** - 车型详情表，管理后台使用
5. **inquiries** - 询盘表，前端和管理后台都在使用
6. **inquiry_items** - 询盘项目表，前端和管理后台都在使用
7. **admin_users** - 管理员用户表，管理后台使用
8. **site_config** - 网站配置表
9. **country_sales** - 国家销售数据表
10. **car_pictures** - 车型图片表（新方案V2），管理后台使用

### ⚠️ 架构中定义但需要确认的表
11. **models** - 车型表（架构定义），前端db.ts在使用
12. **model_images** - 车型图表（架构定义），前端db.ts在使用
13. **model_translations** - 车型翻译表（架构定义），前端db.ts在使用

### ❌ 已删除的表
- ~~model_resources~~ - 旧版本资源表（已删除）
- ~~model_images~~ - 旧版本图片表（已删除）

### 📦 Storage存储桶
- car-images - 新方案使用
- model-images - 旧方案使用（可以删除）

---

## 🔍 分析建议

### 保留的表
- brands, series, models_jumdata, model_details（管理后台完整数据）
- inquiries, inquiry_items, admin_users, site_config, country_sales（核心业务）
- car_pictures（新方案正在使用）

### 需要确认的表
- models, model_images, model_translations - 这些是前端db.ts中定义并使用的表，
  但是看起来新方案使用的是 models_jumdata + car_pictures。
  需要确认是否还需要保留这三个表。

### 可以删除的
- 旧的 model-images 存储桶（如果确认不再需要）
