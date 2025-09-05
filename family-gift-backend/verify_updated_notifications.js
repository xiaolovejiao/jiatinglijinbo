const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./family_gift.db');

console.log('=== 验证更新后的通知内容 ===');

// 查看最近的成员注销通知
db.all(`
  SELECT id, title, content, created_at 
  FROM notifications 
  WHERE title = '成员注销退出家庭' 
  ORDER BY created_at DESC 
  LIMIT 5
`, (err, rows) => {
  if (err) {
    console.error('查询错误:', err);
  } else {
    console.log(`找到 ${rows.length} 条成员注销通知:`);
    
    rows.forEach((row, index) => {
      console.log(`\n通知 ${index + 1}:`);
      console.log('ID:', row.id);
      console.log('标题:', row.title);
      console.log('内容:', row.content);
      console.log('创建时间:', row.created_at);
      
      // 检查是否还包含HTML标签
      if (row.content.includes('<span')) {
        console.log('⚠️  警告: 此通知仍包含HTML标签');
      } else {
        console.log('✅ 通知内容已清理为纯文本');
      }
    });
  }
  
  // 检查总体情况
  db.get(`
    SELECT COUNT(*) as total_count
    FROM notifications
  `, (err, totalRow) => {
    if (err) {
      console.error('查询总数错误:', err);
    } else {
      console.log(`\n=== 总体统计 ===`);
      console.log('通知总数:', totalRow.total_count);
    }
    
    db.get(`
      SELECT COUNT(*) as html_count
      FROM notifications
      WHERE content LIKE '%<span%'
    `, (err, htmlRow) => {
      if (err) {
        console.error('查询HTML标签数量错误:', err);
      } else {
        console.log('包含HTML标签的通知数量:', htmlRow.html_count);
        
        if (htmlRow.html_count === 0) {
          console.log('🎉 所有通知都已成功更新为纯文本格式！');
        } else {
          console.log('⚠️  仍有通知包含HTML标签，需要进一步处理');
        }
      }
      
      db.close();
    });
  });
});