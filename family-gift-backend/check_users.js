const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'family_gift.db');
const db = new sqlite3.Database(dbPath);

console.log('查询用户数据:');

// 查询所有用户信息
db.all('SELECT id, username, nickname, avatar, created_at FROM users ORDER BY id', (err, users) => {
  if (err) {
    console.error('查询用户错误:', err);
  } else {
    console.log('\n所有用户数据:');
    users.forEach(user => {
      console.log(`ID: ${user.id}, 用户名: ${user.username || '空'}, 昵称: ${user.nickname || '空'}, 头像: ${user.avatar || '空'}, 注册时间: ${user.created_at}`);
    });
  }
  
  db.close();
});