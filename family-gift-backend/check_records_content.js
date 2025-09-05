const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./family_gift.db');

db.all('SELECT id, user_id, category, title, content, created_at FROM notifications WHERE category = "records" ORDER BY created_at DESC LIMIT 5', (err, rows) => {
  if (err) {
    console.error('查询失败:', err);
  } else {
    console.log('最近5条records通知:');
    rows.forEach(row => {
      console.log('ID:', row.id, '| 用户:', row.user_id, '| 标题:', row.title);
      console.log('内容:', row.content);
      console.log('时间:', row.created_at);
      console.log('---');
    });
  }
  db.close();
});