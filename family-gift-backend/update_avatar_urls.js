const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// 连接数据库
const dbPath = path.join(__dirname, 'family_gift.db');
const db = new sqlite3.Database(dbPath);

console.log('更新头像URL...');

// 查询所有有头像但是使用相对路径的用户
db.all('SELECT id, avatar FROM users WHERE avatar IS NOT NULL AND avatar LIKE "/uploads/%"', (err, users) => {
  if (err) {
    console.error('查询用户错误:', err);
    db.close();
    return;
  }

  if (users.length === 0) {
    console.log('没有需要更新的头像URL');
    db.close();
    return;
  }

  console.log(`找到 ${users.length} 个需要更新的头像URL:`);
  
  let updateCount = 0;
  
  users.forEach(user => {
    const newAvatarUrl = `http://localhost:5000${user.avatar}`;
    console.log(`用户ID ${user.id}: ${user.avatar} -> ${newAvatarUrl}`);
    
    db.run('UPDATE users SET avatar = ? WHERE id = ?', [newAvatarUrl, user.id], function(updateErr) {
      if (updateErr) {
        console.error(`更新用户ID ${user.id} 头像失败:`, updateErr);
      } else {
        console.log(`用户ID ${user.id} 头像URL更新成功`);
      }
      
      updateCount++;
      if (updateCount === users.length) {
        console.log('\n所有头像URL更新完成');
        db.close();
      }
    });
  });
});