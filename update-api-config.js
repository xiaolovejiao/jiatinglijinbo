#!/usr/bin/env node

/**
 * 更新前端API配置脚本
 * 用于将API地址从localhost更新为Railway部署的URL
 */

const fs = require('fs');
const path = require('path');

// 获取命令行参数中的Railway URL
const railwayUrl = process.argv[2];

if (!railwayUrl) {
  console.error('❌ 请提供Railway部署的URL');
  console.log('使用方法: node update-api-config.js https://your-app-name.up.railway.app');
  process.exit(1);
}

// 验证URL格式
if (!railwayUrl.startsWith('https://') || !railwayUrl.includes('railway.app')) {
  console.error('❌ 请提供有效的Railway URL (格式: https://your-app-name.up.railway.app)');
  process.exit(1);
}

console.log(`🚀 开始更新API配置为: ${railwayUrl}`);

// 需要更新的文件列表
const filesToUpdate = [
  {
    path: 'family-gift-frontend/src/config/api.js',
    description: 'API配置文件'
  },
  {
    path: 'family-gift-frontend/vite.config.js',
    description: 'Vite代理配置'
  }
];

let updatedFiles = 0;

filesToUpdate.forEach(file => {
  const filePath = path.join(__dirname, file.path);
  
  if (!fs.existsSync(filePath)) {
    console.log(`⚠️  文件不存在: ${file.path}`);
    return;
  }
  
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;
    
    if (file.path.includes('api.js')) {
      // 更新API配置文件
      const oldPattern = /return import\.meta\.env\.VITE_API_BASE_URL \|\| '[^']*';/;
      const newValue = `return import.meta.env.VITE_API_BASE_URL || '${railwayUrl}';`;
      
      if (oldPattern.test(content)) {
        content = content.replace(oldPattern, newValue);
        modified = true;
      }
    } else if (file.path.includes('vite.config.js')) {
      // 更新Vite代理配置（开发环境仍使用localhost）
      const oldPattern = /target: 'http:\/\/localhost:5000'/;
      const newValue = `target: 'http://localhost:5000'`; // 开发环境保持不变
      
      // 这里不需要修改vite.config.js，因为开发环境仍然使用本地后端
      console.log(`ℹ️  ${file.description}: 开发环境配置保持不变`);
      return;
    }
    
    if (modified) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`✅ 已更新: ${file.description}`);
      updatedFiles++;
    } else {
      console.log(`ℹ️  无需更新: ${file.description}`);
    }
    
  } catch (error) {
    console.error(`❌ 更新失败 ${file.path}:`, error.message);
  }
});

// 创建环境变量文件
const envContent = `# 生产环境API配置
VITE_API_BASE_URL=${railwayUrl}
`;

const envPath = path.join(__dirname, 'family-gift-frontend/.env.production');
try {
  fs.writeFileSync(envPath, envContent, 'utf8');
  console.log('✅ 已创建: .env.production');
  updatedFiles++;
} catch (error) {
  console.error('❌ 创建.env.production失败:', error.message);
}

console.log(`\n🎉 配置更新完成! 共更新了 ${updatedFiles} 个文件`);
console.log('\n📋 下一步操作:');
console.log('1. git add .');
console.log('2. git commit -m "Update API URL to Railway backend"');
console.log('3. git push');
console.log('\n⏳ Vercel将自动重新部署前端...');
