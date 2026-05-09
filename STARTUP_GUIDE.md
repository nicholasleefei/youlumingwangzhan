# 项目启动指南

## 启动方式

### 使用 Python HTTP 服务器（推荐）

这是当前使用的启动方式，用于服务构建好的静态文件。

#### 前置条件
- ✅ Node.js 已安装（用于构建）
- ✅ Python 已安装（用于启动服务器）
- ✅ 项目已构建（dist 目录存在）

#### 启动步骤

1. **构建项目**（如果还没有构建）
   ```bash
   npm run build
   ```

2. **进入 dist 目录并启动服务器**
   ```bash
   cd dist
   python -m http.server 5173
   ```

3. **访问网站**
   - 主页：http://localhost:5173/
   - 测试页：http://localhost:5173/test.html
   - 管理员：http://localhost:5173/admin

#### 停止服务器
在终端按 `Ctrl + C` 停止服务器。

---

## 访问地址

### 主要页面
| 页面 | 地址 | 说明 |
|------|------|------|
| 主页 | http://localhost:5173/ | 网站首页 |
| 测试页 | http://localhost:5173/test.html | 简单测试页面 |
| 管理员 | http://localhost:5173/admin | 管理后台 |

### 管理员登录
- **默认邮箱**：1398234769@qq.com
- **密码**：在 Supabase 中设置

---

## 其他启动方式

### 开发服务器（已废弃）
⚠️ **不推荐使用**，之前使用此方式时出现"服务不可用"问题。

```bash
npm run dev
```

### Vite 预览服务器
```bash
npm run preview
```

---

## 构建说明

### 重新构建项目
如果修改了源代码，需要重新构建：

```bash
npm run build
```

构建输出目录：`dist/`

---

## 常见问题

### Q: 看到"服务不可用"怎么办？
A: 使用 Python HTTP 服务器方式，不要使用开发服务器。

### Q: 如何修改代码后重新启动？
A: 
1. 修改源代码
2. 运行 `npm run build` 重新构建
3. 重启 Python HTTP 服务器

### Q: 端口 5173 被占用怎么办？
A: 可以使用其他端口：
```bash
python -m http.server 3000
```
然后访问 http://localhost:3000/

---

## 项目结构

```
YLM_wangzhan/
├── dist/                    # 构建输出目录（用于启动）
│   ├── index.html          # 主页
│   ├── test.html           # 测试页
│   ├── admin/              # 管理员页面
│   └── assets/             # 静态资源
├── src/                     # 源代码
├── package.json             # 项目配置
└── STARTUP_GUIDE.md        # 本文档
```

---

**最后更新**：2026-04-17
