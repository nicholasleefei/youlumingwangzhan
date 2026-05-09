# 技术方案：汽车之家车型物料爬虫工具（Web + 后端任务）

## 1. 总体架构

- 前端：React + Tailwind
  - 首页：搜索/输入车系 ID
  - 进度页：订阅任务进度（SSE 或轮询）
  - 结果页：展示统计 + 下载 ZIP
- 后端：Node.js（Express）
  - 对外提供 API：搜索、创建任务、查询进度、下载 ZIP
  - 任务执行：爬取链接 → 下载资源 → 组织目录 → 打 ZIP
  - 任务存储：内存（V1）+ 磁盘临时目录（输出文件）

## 2. 关键数据结构

### 2.1 任务状态（Job）

- `id`: string
- `seriesId`: number
- `seriesName`: string（可为空，解析失败时仅保留 ID）
- `status`: queued | running | succeeded | failed | canceled
- `stage`: string（当前阶段，例如 `fetch_gallery_links` / `download_exterior`）
- `progress`: 
  - `total`: number（预估文件数或步骤数）
  - `done`: number
  - `success`: number
  - `failed`: number
- `errors`: { at: string; message: string }[]（最多保留 N 条）
- `artifactPath`: string（ZIP 文件路径，成功后存在）
- `createdAt` / `startedAt` / `finishedAt`

### 2.2 搜索结果（SeriesSearchItem）

- `seriesId`: number
- `name`: string
- `brand`: string（若可解析）
- `factory`: string（若可解析）
- `url`: string

## 3. API 设计（V1）

### 3.1 搜索车系

- `GET /api/series/search?q=特斯拉%20Model%20Y`
- Response：`SeriesSearchItem[]`

说明：

- 优先使用汽车之家公开可访问的搜索入口/接口。
- 若搜索不可用或被限制，前端仍可走“直接输入车系 ID”。

### 3.2 创建下载任务

- `POST /api/jobs`
- Body：`{ seriesId: number }`
- Response：`{ jobId: string }`

### 3.3 获取任务状态（轮询）

- `GET /api/jobs/:jobId`
- Response：Job（含 progress、stage、status）

### 3.4 订阅任务状态（SSE，可选但推荐）

- `GET /api/jobs/:jobId/events`
- `text/event-stream`
- 事件：`job_update`（payload 为 Job 的精简版）

### 3.5 下载 ZIP

- `GET /api/jobs/:jobId/download`

## 4. 爬取与下载策略

## 4.1 物料分类

按 PRD 输出目录：

- `01_外观图`：从图库外观分类获取原图链接
- `02_内饰图`：从图库内饰分类获取原图链接
- `03_细节图`：从图库细节分类获取原图链接
- `06_外观360VR`：从全景看车（pano）获取外观 360 序列
- `07_内饰360VR`：从全景看车（pano）获取内饰 360 序列
- `08_品牌官方图`：从品牌官方图分类获取原图链接

## 4.2 原图链接优先级

- 优先寻找 JSON 数据或接口返回中的原图地址（通常包含更高分辨率）。
- 若仅能拿到缩略图/中图，则尝试从页面脚本数据反推原图字段。

## 4.3 反爬与可靠性

- 并发限制：对单站点下载并发 3~8。
- 重试：对单个文件下载失败重试 2 次（指数退避）。
- User-Agent：固定 UA（V1）或简单轮换（后续）。
- 超时：下载超时 30s，页面请求超时 15s。

## 4.4 360VR 颜色与色号

- 全景页面存在“个性配色”切换。
- 解析策略：从页面 DOM 或内嵌数据中提取颜色名与色号；若 V1 无法稳定提取色号，降级为 `颜色名_#UNKNOWN` 并在结果页提示。

## 5. 文件组织与 ZIP

- 每个任务创建独立临时工作目录：`./data/jobs/{jobId}/work/`
- 下载到固定目录结构后，将根目录打包为 `./data/jobs/{jobId}/artifact/{seriesId}_{seriesName}.zip`
- 成功后提供下载；失败时保留日志并清理部分临时文件（V1 可保留 24h 供排查）。

## 6. 部署与运行（V1）

- 本地/内网服务器运行 Node 服务；同一进程承载 API 与任务执行。
- 后续如需水平扩展：可将 Job 状态写入 Redis，并将任务执行拆分为 worker。

## 7. 风险与应对

- 网站结构变化：将解析逻辑集中在 `providers/autohome` 目录，关键选择器/正则集中管理。
- 搜索入口变化：提供“直接输入车系 ID”兜底。
- 图片量大耗时：清晰进度反馈；并发控制 + 断点续传（后续）。

