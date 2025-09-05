const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./family_gift.db');

console.log('最近注册的用户:');
db.all('SELECT id, username, nickname, created_at FROM users ORDER BY id DESC LIMIT 5', (err, users) => {
  if (err) {
    console.error('查询错误:', err);
  } else {
    users.forEach(user => {
      console.log(`ID: ${user.id}, 用户名: ${user.username}, 昵称: ${user.nickname}, 注册时间: ${user.created_at}`);
    });
  }
  db.close();
});