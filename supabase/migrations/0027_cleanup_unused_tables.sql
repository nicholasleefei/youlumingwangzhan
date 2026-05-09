-- ==========================================
-- 清理不需要的表
-- ==========================================

-- 删除 brand_logos 表（看起来没有在使用）
DROP TABLE IF EXISTS brand_logos CASCADE;

-- 删除 car_pictures 表（这个我们正在使用，暂时不删）
-- DROP TABLE IF EXISTS car_pictures CASCADE;

-- 显示清理结果
SELECT '数据库清理完成' AS status;

-- ==========================================
-- 当前数据库表清单（保留的表）
-- ==========================================
-- 1. brands - 品牌表（必需）
-- 2. series - 车系表（必需）
-- 3. models_jumdata - 车型表（聚美数据，管理后台用）
-- 4. model_details - 车型详情表（管理后台用）
-- 5. models - 车型表（前端展示用）
-- 6. model_images - 车型图表（前端展示用）
-- 7. model_translations - 车型翻译表（前端展示用）
-- 8. inquiries - 询盘表（必需）
-- 9. inquiry_items - 询盘项目表（必需）
-- 10. admin_users - 管理员用户表（必需）
-- 11. site_config - 网站配置表（必需）
-- 12. country_sales - 国家销售数据表（必需）
-- 13. car_pictures - 车型图片表（新方案V2使用）
