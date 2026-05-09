# 页面设计：品牌页（Desktop-first，全新改版，视觉对齐车系/车型详情页）

## 全局设计规范（与新版车系/车型详情页一致）

### Layout
- 桌面优先：内容容器 `max-width: 1200px`（或 1280px），左右留白随视口扩展。
- 主布局：站点顶部导航（沿用现有） + 主内容区（Stacked Sections） + 页脚（沿用现有）。
- 响应策略：
  - ≥1200：轮播为大幅 Hero；信息区双列（文案/控制在左，图在右或覆盖）。
  - 768–1199：轮播比例缩小；内容区由双列改为单列。
  - <768：轮播与卡片改为纵向堆叠；交互按钮全宽。

### Meta Information
- Title：`品牌与车系 - 官方图轮播`
- Description：`浏览品牌与车系，查看官方图并跳转到车系详情页。`
- Open Graph：
  - `og:title` 同 Title
  - `og:description` 同 Description
  - `og:image` 使用当前轮播卡片的官方图（或兜底图）

### Global Styles（Design Tokens）
> 目标：与新版车系/车型详情页同一套视觉语言；不沿用旧品牌页的深色背景/星空等风格。
- 色彩
  - `--bg`: #F7F8FA
  - `--surface`: #FFFFFF
  - `--text-primary`: #111827
  - `--text-secondary`: #4B5563
  - `--border`: #E5E7EB
  - `--accent`: #2563EB（主按钮/高亮）
  - `--danger`: #DC2626
- 字体与排版
  - 字体：系统字体栈（中英兼容）
  - 排版等级：H1 40/48，H2 24/32，Body 14/22
- 按钮
  - Primary：`--accent` 实底；hover 加深；focus 有明显 outline
  - Secondary：白底描边；hover 轻底色
- 卡片
  - `border: 1px solid --border` + `border-radius: 16px` + 轻阴影；hover 抬升 2–4px
- 动效
  - hover/active 统一 150–200ms ease
  - 轮播切换：200–300ms 淡入淡出/位移（与车系/车型页图集切换节奏保持一致）

---

## 页面：品牌页（Brands）

### Page Structure
1) 顶部轮播 Hero（官方图 + 品牌/车系信息 + 跳转）
2) 内容承接区（为后续品牌/车系浏览内容预留，结构与视觉统一；本次重点为轮播与整体视觉框架）

### Sections & Components

#### 1) 顶部轮播 Hero（核心）
- 布局：
  - Desktop：全宽卡片式 Hero（容器内居中），使用 CSS Grid（12列）
    - 图片层：占 12列（背景图/主图），保持 21:9 或 16:9 比例，`object-fit: cover`
    - 文案层：覆盖在图片上（左下/左中），使用半透明渐变遮罩保证可读性
  - Tablet/Mobile：图片在上，文案与按钮在下（Stack）
- 元素：
  - 主标题：`品牌名`（优先 fullname）
  - 副标题：`车系名`（优先 fullname）
  - CTA：`查看车系`（Primary 按钮）
  - 控制：左右箭头 + 圆点指示器（dots）
- 交互：
  - 自动轮播（如现有已支持则沿用节奏，例如 5s 一次）
  - hover 时暂停自动轮播；键盘左右方向键可切换（可访问性）
  - 点击卡片或 CTA：跳转到该车系详情页
- 状态：
  - Loading：Hero 使用骨架屏（大图块 + 两行文字 + 按钮占位）
  - Empty：展示“暂无可用官方图”与兜底图（不阻断页面访问）
  - Error：展示轻量错误提示与“重试”入口

#### 2) 内容承接区（保持整体一致性）
- 布局：容器内纵向堆叠，卡片化分区（与车系/车型页的 Surface/Card 体系一致）
- 说明：本区用于承接品牌页除轮播外的既有内容模块；本次改版以“统一视觉语言与组件风格”为目标，不改变业务逻辑。
