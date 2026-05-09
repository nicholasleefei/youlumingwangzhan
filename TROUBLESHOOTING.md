# 故障排除指南

## 图片加载失败问题

### 问题描述
看到大量 `net::ERR_FAILED` 错误，来自 `vehicle-pic.jumdata.com` 域名。

### 错误示例
```
[error] net::ERR_FAILED https://vehicle-pic.jumdata.com/car/static/images/logo/300/193776.jpg
```

### 原因分析
1. **CORS 限制** - 外部域名可能不允许跨域访问
2. **网络问题** - 该域名可能无法访问
3. **图片失效** - 这些图片 URL 可能已经失效
4. **管理员页面专用** - 这些图片主要在管理员页面使用

### 解决方案

#### 方案 1：忽略这些错误（推荐）
这些错误主要影响管理员页面的图片显示，不影响主网站功能，可以暂时忽略。

#### 方案 2：检查网络连接
确保可以访问 `vehicle-pic.jumdata.com` 域名。

#### 方案 3：使用本地图片
将需要的图片下载到本地，放在 `public/` 或 `logo/` 目录中。

#### 方案 4：添加图片错误处理
在代码中添加图片加载失败的处理：

```tsx
<img 
  src={imageUrl} 
  alt={name}
  onError={(e) => {
    e.currentTarget.style.display = 'none';
    // 或者显示占位图
  }}
/>
```

---

## 其他常见问题

### 问题：看到"服务不可用"
**解决方案**：使用 Python HTTP 服务器方式启动，不要使用开发服务器。
参考 [STARTUP_GUIDE.md](./STARTUP_GUIDE.md)

### 问题：端口被占用
**解决方案**：使用其他端口
```bash
python -m http.server 3000
```

### 问题：修改代码后不更新
**解决方案**：
1. 停止服务器
2. 重新构建：`npm run build`
3. 重新启动服务器

---

## 管理员界面

### 访问地址
http://localhost:5173/admin

### 默认账号
- **邮箱**：1398234769@qq.com
- **密码**：在 Supabase 中设置

### 功能
- 品牌管理
- 车系管理
- 车型管理
- 车型详情
- 询价管理
- 国家销量
- 管理员审批

---

**最后更新**：2026-04-17
