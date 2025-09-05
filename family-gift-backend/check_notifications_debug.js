const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./family_gift.db');

console.log('=== 检查notifications表结构 ===');
db.all("PRAGMA table_info(notifications)", (err, rows) => {
  if (err) {
    console.error('查询表结构错误:', err);
  } else {
    console.log('notifications表结构:');
    rows.forEach(row => {
      console.log(`- ${row.name}: ${row.type} ${row.notnull ? 'NOT NULL' : ''} ${row.pk ? 'PRIMARY KEY' : ''}`);
    });
  }
  
  console.log('\n=== 检查最近的系统通知 ===');
  db.all(`
    SELECT id, user_id, category, title, content, is_read, created_at 
    FROM notifications 
    WHERE category = 'system' 
    ORDER BY created_at DESC 
    LIMIT 10
  `, (err, rows) => {
    if (err) {
      console.error('查询系统通知错误:', err);
    } else {
      console.log(`找到 ${rows.length} 条系统通知:`);
      rows.forEach((row, index) => {
        console.log(`\n通知 ${index + 1}:`);
        console.log('ID:', row.id);
        console.log('用户ID:', row.user_id);
        console.log('类别:', row.category);
        console.log('标题:', row.title);
        console.log('内容:', row.content);
        console.log('已读:', row.is_read ? '是' : '否');
        console.log('创建时间:', row.created_at);
        
        // 尝试解析JSON内容
        try {
          const parsed = JSON.parse(row.content);
          console.log('解析后的内容:', JSON.stringify(parsed, null, 2));
        } catch (e) {
          console.log('内容不是JSON格式');
        }
      });
    }
    
    console.log('\n=== 检查用户表 ===');
    db.all('SELECT id, username FROM users ORDER BY id', (err, users) => {
      if (err) {
        console.error('查询用户错误:', err);
      } else {
        console.log('用户列表:');
        users.forEach(user => {
          console.log(`- ID: ${user.id}, 用户名: ${user.username}`);
        });
      }
      
      db.close();
    });
  });
});