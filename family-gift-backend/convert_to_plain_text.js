const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./family_gift.db');

console.log('开始将所有通知转换为纯文本格式...');

// 查找所有包含HTML标签的"成员注销退出家庭"通知
db.all(`
  SELECT id, content 
  FROM notifications 
  WHERE title = '成员注销退出家庭' 
    AND content LIKE '%<span%'
`, [], (err, rows) => {
  if (err) {
    console.error('查询失败:', err);
    return;
  }

  console.log(`找到 ${rows.length} 条包含HTML标签的通知需要转换`);

  if (rows.length === 0) {
    console.log('没有需要转换的通知');
    db.close();
    return;
  }

  let updatedCount = 0;

  rows.forEach((row, index) => {
    const originalContent = row.content;
    console.log(`\n处理第 ${index + 1} 条通知 (ID: ${row.id}):`);
    console.log('原内容:', originalContent);

    // 移除所有HTML标签，提取纯文本内容
    let plainTextContent = originalContent
      .replace(/<span[^>]*>/g, '') // 移除开始标签
      .replace(/<\/span>/g, '')   // 移除结束标签
      .trim();

    console.log('转换后内容:', plainTextContent);

    // 更新数据库
    db.run(`UPDATE notifications SET content = ? WHERE id = ?`, [plainTextContent, row.id], function(err) {
      if (err) {
        console.error(`更新通知 ${row.id} 失败:`, err);
      } else {
        console.log(`✅ 通知 ${row.id} 转换成功`);
      }
      
      updatedCount++;
      
      // 如果是最后一条记录，关闭数据库
      if (updatedCount === rows.length) {
        console.log(`\n=== 转换完成 ===`);
        console.log(`总共转换了 ${rows.length} 条通知为纯文本格式`);
        db.close();
      }
    });
  });
});