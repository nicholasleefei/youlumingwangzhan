---
name: translations-model-vs-model-detail-tables
description: The real translation data for text fields lives in models_jumdata_en, NOT model_details_en
metadata:
  type: project
---

翻译数据存在两张表里，不能只读 model_details_en：

- `models_jumdata_en` (1033 rows): **文本字段翻译全部在这里** — name, sizetype, price, salestate, yeartype, displacement, geartype, listdate 等全部有数据。这是真正的翻译镜像表。
- `model_details_en` (112 rows): **只有 `raw` JSONB 有数据**，name/sizetype/price 等文本字段全是 NULL。这个表只有 raw JSON 深度翻译。

每次调用 `fetchEntityTranslations()` 时，如果是车型数据（需要展示 sizetype/price 等字段），必须用 `"model"` entity type（查 `models_jumdata_en`），而不是 `"model_detail"`（查 `model_details_en`）。大多数情况下两者都需要查询，然后合并：文本字段用 model，raw JSONB 用 model_detail。

**Why:** 之前所有页面都用 `fetchEntityTranslations("model_detail", ...)`，只能拿到 raw JSONB，所以切换语言后 text 字段完全不翻译。

**How to apply:** 用 `Promise.all([fetchEntityTranslations("model", ...), fetchEntityTranslations("model_detail", ...)])` 同时查两张表，以 model 的文本字段为主，以 model_detail 的 raw 为辅。

Related: [[translations-32-table-system]]