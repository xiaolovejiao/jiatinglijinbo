const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./family_gift.db');

console.log('=== 查找包含HTML标签的旧通知数据 ===');

// 查找包含HTML标签的通知
db.all(`
  SELECT id, title, content, created_at 
  FROM notifications 
  WHERE content LIKE '%<span%' 
  ORDER BY created_at DESC
`, (err, rows) => {
  if (err) {
    console.error('查询错误:', err);
    db.close();
    return;
  }
  
  console.log(`找到包含HTML标签的通知数量: ${rows.length}`);
  
  if (rows.length === 0) {
    console.log('没有找到包含HTML标签的通知');
    db.close();
    return;
  }
  
  console.log('\n=== 开始更新通知内容 ===');
  
  let completed = 0;
  
  rows.forEach((row, index) => {
    console.log(`\n处理通知 ${index + 1}:`);
    console.log('ID:', row.id);
    console.log('标题:', row.title);
    console.log('原内容:', row.content);
    
    // 移除HTML标签，保留纯文本内容
    let cleanContent = row.content;
    
    // 移除所有HTML标签，保留文本内容
    cleanContent = cleanContent.replace(/<span[^>]*>/g, '');
    cleanContent = cleanContent.replace(/<\/span>/g, '');
    
    console.log('清理后内容:', cleanContent);
    
    // 更新数据库
    db.run(`
      UPDATE notifications 
      SET content = ?
      WHERE id = ?
    `, [cleanContent, row.id], function(updateErr) {
      if (updateErr) {
        console.error(`更新通知 ${row.id} 失败:`, updateErr);
      } else {
        console.log(`✅ 已更新通知 ${row.id}`);
      }
      
      completed++;
      if (completed === rows.length) {
        console.log(`\n=== 更新完成 ===`);
        console.log(`共更新了 ${completed} 条通知`);
        db.close();
      }
    });
  });
});