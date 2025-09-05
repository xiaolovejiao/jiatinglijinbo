# 后端部署指南 - Railway/Render/Heroku

由于Vercel的多项目构建存在兼容性问题，建议将前端和后端分开部署：
- **前端**：继续使用Vercel部署
- **后端**：使用Railway、Render或Heroku等专门的后端托管平台

## 推荐平台

### 1. Railway (推荐)
- 免费额度：每月$5额度
- 支持Node.js和数据库
- 部署简单，自动从GitHub部署

### 2. Render
- 免费额度：有限制但够用
- 支持PostgreSQL数据库
- 自动SSL证书

### 3. Heroku
- 免费计划已取消，但稳定可靠
- 丰富的插件生态

## Railway部署步骤

### 准备工作：
✅ 后端代码已优化适配Railway环境
✅ 已创建 `railway.toml` 配置文件
✅ 已创建 `.env.railway` 环境变量模板

### 详细部署步骤：

#### 第一步：创建Railway项目
1. 访问 [Railway.app](https://railway.app)
2. 使用GitHub账号登录
3. 点击 "New Project"
4. 选择 "Deploy from GitHub repo"
5. 授权Railway访问你的GitHub仓库
6. 选择 `jiatinglijinbo` 仓库

#### 第二步：配置项目设置
1. Railway检测到项目后，点击项目进入控制台
2. 在 "Settings" 中设置：
   - **Root Directory**: `family-gift-backend`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`

#### 第三步：设置环境变量
在Railway控制台的 "Variables" 标签页中添加：
```
JWT_SECRET=your-super-secret-jwt-key-change-this
NODE_ENV=production
MAX_FILE_SIZE=5242880
UPLOADS_DIR=uploads
ADMIN_USERNAME=admin
ADMIN_PASSWORD=change-this-password
```

#### 第四步：部署和获取URL
1. 点击 "Deploy" 开始部署
2. 等待构建完成（通常2-3分钟）
3. 在 "Settings" → "Domains" 中获取分配的URL
4. URL格式类似：`https://your-app-name.up.railway.app`

### 添加数据库（可选）

如果需要持久化数据库：
1. 在Railway项目中添加PostgreSQL服务
2. 修改后端代码使用PostgreSQL而不是SQLite

## 更新前端配置

### 第五步：更新前端API配置

部署后端成功后，需要更新前端的API配置：

#### 1. 找到API配置文件
检查以下位置的API配置：
- `family-gift-frontend/src/config/api.js`
- `family-gift-frontend/src/utils/api.js`
- `family-gift-frontend/src/lib/api.js`
- 或搜索代码中的 `localhost:5000`

#### 2. 更新API基础URL
将所有的 `http://localhost:5000` 替换为Railway提供的URL：

```javascript
// 修改前
const API_BASE_URL = 'http://localhost:5000';

// 修改后
const API_BASE_URL = 'https://your-app-name.up.railway.app';

// 或者使用环境变量配置
const getApiBaseUrl = () => {
  if (import.meta.env.PROD) {
    // 使用Railway后端URL
    return 'https://your-app-name.up.railway.app';
  }
  // 开发环境使用本地后端
  return 'http://localhost:5000';
};
```

#### 3. 重新部署前端
更新API配置后，需要重新部署前端到Vercel：

```bash
# 提交更改
git add .
git commit -m "Update API URL to Railway backend"
git push
```

Vercel会自动重新部署前端。

#### 4. 测试连接
部署完成后，访问前端网站测试：
- 用户注册/登录功能
- 数据加载和保存
- 文件上传功能

## 本地开发配置

### 前端开发

```bash
cd family-gift-frontend
npm install
npm run dev
```

### 后端开发

```bash
cd family-gift-backend
npm install
npm run dev
```

## 数据库迁移建议

### 从SQLite迁移到PostgreSQL

1. **安装PostgreSQL依赖**：
   ```bash
   npm install pg
   ```

2. **修改数据库连接**：
   ```javascript
   // 替换SQLite代码
   const { Pool } = require('pg');
   const pool = new Pool({
     connectionString: process.env.DATABASE_URL,
     ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
   });
   ```

3. **更新SQL语法**：
   - SQLite的 `INTEGER PRIMARY KEY AUTOINCREMENT` → PostgreSQL的 `SERIAL PRIMARY KEY`
   - SQLite的 `DATETIME DEFAULT CURRENT_TIMESTAMP` → PostgreSQL的 `TIMESTAMP DEFAULT NOW()`

## 故障排除

### 常见问题

1. **CORS错误**
   - 确保后端CORS配置包含前端域名
   - 检查Railway部署的URL是否正确

2. **数据库连接失败**
   - 检查环境变量设置
   - 确认数据库服务正在运行

3. **API请求失败**
   - 检查前端API配置中的URL
   - 确认后端服务正常启动

### 查看日志

在Railway控制台的 "Deployments" 标签页可以查看部署日志和运行时日志。

## 成本估算

- **Railway**: 免费$5/月额度，超出后按使用量计费
- **Render**: 免费计划有限制，付费计划$7/月起
- **前端Vercel**: 免费计划足够个人使用

## 总结

这种分离部署的方案具有以下优势：
- 前端和后端独立部署，避免冲突
- 可以选择最适合的平台
- 更好的可扩展性
- 更容易调试和维护

部署完成后，你将拥有：
- 前端：`https://your-frontend.vercel.app`
- 后端：`https://your-backend.up.railway.app`