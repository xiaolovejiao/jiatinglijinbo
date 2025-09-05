const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./family_gift.db');

console.log('查看剩余未更新的通知内容...');

db.all(`
  SELECT id, content 
  FROM notifications 
  WHERE title = '成员注销退出家庭' 
    AND content NOT LIKE '%<span%'
  ORDER BY id
`, [], (err, rows) => {
  if (err) {
    console.error('查询失败:', err);
    return;
  }

  console.log(`剩余未更新的通知数量: ${rows.length}`);
  
  rows.forEach((row, index) => {
    console.log(`\n第 ${index + 1} 条 (ID: ${row.id}):`);
    console.log('内容:', row.content);
  });

  db.close();
});