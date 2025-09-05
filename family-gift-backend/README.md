# 家庭礼金簿后端服务

## 项目简介

家庭礼金簿后端服务，提供用户认证、数据管理等API接口。

## 技术栈

- **Node.js** - 运行环境
- **Express.js** - Web框架
- **SQLite** - 数据库
- **JWT** - 身份验证
- **bcryptjs** - 密码加密

## 快速启动

### 方法一：使用启动脚本（推荐）

```bash
# Windows系统
双击运行 start.bat
```

### 方法二：手动启动

```bash
# 1. 安装依赖
npm install

# 2. 启动服务
npm start

# 或开发模式（自动重启）
npm run dev
```

## 服务信息

- **服务地址**: http://localhost:5000
- **健康检查**: http://localhost:5000/api/health
- **数据库**: SQLite (family_gift.db)

## API接口

### 用户认证

- `POST /api/register` - 用户注册
- `POST /api/login` - 用户登录
- `POST /api/logout` - 用户登出
- `GET /api/me` - 获取当前用户信息

### 密码重置

- `POST /api/forgot-password` - 获取密保问题
- `POST /api/reset-password` - 重置密码

### 管理员接口

- `GET /api/admin/stats` - 获取统计数据
- `GET /api/admin/users` - 获取用户列表
- `GET /api/admin/families` - 获取家庭列表

## 环境配置

编辑 `.env` 文件配置服务参数：

```env
PORT=5000
JWT_SECRET=your-secret-key
FRONTEND_URL=http://localhost:5174
```

## 数据库

系统使用SQLite数据库，首次启动会自动创建以下表：

- `users` - 用户表
- `families` - 家庭表
- `gift_records` - 礼金记录表

## 部署说明

1. 确保服务器已安装Node.js
2. 上传项目文件到服务器
3. 运行 `npm install` 安装依赖
4. 配置 `.env` 文件
5. 运行 `npm start` 启动服务

## 注意事项

- 首次启动会自动创建数据库文件
- 请妥善保管JWT密钥
- 生产环境建议使用PM2等进程管理工具
- 定期备份数据库文件

## 故障排除

### 端口占用

如果5000端口被占用，可以修改 `.env` 文件中的 `PORT` 配置。

### 数据库错误

删除 `family_gift.db` 文件，重启服务会自动重新创建。

### 依赖安装失败

尝试清除缓存后重新安装：

```bash
npm cache clean --force
npm install
```