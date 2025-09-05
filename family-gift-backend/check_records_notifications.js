const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./family_gift.db');

db.all('SELECT id, category, title, content, created_at FROM notifications WHERE category = "records" ORDER BY created_at DESC LIMIT 5', (err, rows) => {
  if (err) {
    console.error('查询错误:', err);
  } else {
    console.log('记录消息数量:', rows.length);
    rows.forEach((row, index) => {
      console.log(`\n消息 ${index + 1}:`);
      console.log('ID:', row.id);
      console.log('标题:', row.title);
      console.log('内容:', row.content);
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
  db.close();
});
