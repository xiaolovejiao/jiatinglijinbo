# 家庭礼金簿 - Vercel 部署指南

本项目是一个全栈应用，包含 React 前端和 Node.js Express 后端，可以部署到 Vercel 平台。

## 项目结构

```
家庭礼金薄2.0.1/
├── family-gift-frontend/     # React 前端应用
├── family-gift-backend/      # Node.js Express 后端
├── vercel.json              # Vercel 配置文件
├── .env.example             # 环境变量示例
└── DEPLOYMENT.md            # 部署指南（本文件）
```

## 部署步骤

### 1. 准备工作

确保你的项目已经推送到 GitHub 仓库。

### 2. 在 Vercel 上部署

1. 访问 [Vercel](https://vercel.com) 并登录
2. 点击 "New Project"
3. 导入你的 GitHub 仓库 `https://github.com/xiaolovejiao/jiatinglijinbo.git`
4. Vercel 会自动检测到这是一个全栈应用

### 3. 配置环境变量

在 Vercel 项目设置中添加以下环境变量：

```
JWT_SECRET=your-super-secret-jwt-key-here
NODE_ENV=production
VERCEL_ENV=production
```

**重要**: 请将 `JWT_SECRET` 替换为一个强密码！

### 4. 部署配置说明

项目包含 `vercel.json` 配置文件，定义了：

- **前端构建**: 使用 `@vercel/static-build` 构建 React 应用
- **后端函数**: 使用 `@vercel/node` 运行 Express 服务器
- **路由规则**: 
  - `/api/*` 路由到后端 serverless 函数
  - 其他请求路由到前端静态文件

### 5. 数据库说明

- 项目使用 SQLite 数据库
- 在 Vercel 的 serverless 环境中，数据库会在每次函数调用时重新初始化
- 生产环境建议迁移到云数据库（如 PlanetScale、Supabase 等）

### 6. 文件上传说明

- 当前文件上传到本地 `uploads` 目录
- Vercel serverless 函数是无状态的，建议使用云存储服务（如 Cloudinary、AWS S3 等）

## 本地开发

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

## 技术栈

### 前端
- React 18
- Vite
- Tailwind CSS
- Radix UI
- React Router

### 后端
- Node.js
- Express.js
- SQLite3
- JWT 认证
- Multer (文件上传)
- bcryptjs (密码加密)

## 注意事项

1. **CORS 配置**: 后端已配置支持 Vercel 域名的 CORS
2. **环境变量**: 生产环境必须设置 `JWT_SECRET`
3. **数据持久化**: 考虑使用云数据库替代 SQLite
4. **文件存储**: 考虑使用云存储服务
5. **性能优化**: Vercel 函数有执行时间限制（30秒）

## 故障排除

### 常见问题

1. **API 请求失败**
   - 检查 CORS 配置
   - 确认环境变量设置正确

2. **数据库连接问题**
   - 检查 SQLite 文件路径
   - 考虑数据库初始化逻辑

3. **文件上传失败**
   - Vercel 函数文件系统是只读的
   - 需要使用云存储服务

### 查看日志

在 Vercel 控制台的 "Functions" 标签页可以查看服务器日志。

## 后续优化建议

1. **数据库迁移**: 迁移到 PlanetScale 或 Supabase
2. **文件存储**: 集成 Cloudinary 或 AWS S3
3. **缓存优化**: 添加 Redis 缓存
4. **监控**: 集成错误监控服务
5. **CDN**: 优化静态资源加载

## 支持

如果遇到部署问题，请检查：
1. Vercel 部署日志
2. 浏览器开发者工具的网络和控制台
3. 确认所有环境变量设置正确
