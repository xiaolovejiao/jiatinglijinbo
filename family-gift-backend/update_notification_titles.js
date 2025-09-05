const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./family_gift.db');

// 更新所有记录消息的标题格式
console.log('开始更新记录消息标题格式...');

// 获取所有记录消息
db.all(`
  SELECT id, title, content
  FROM notifications 
  WHERE category = 'records'
  ORDER BY created_at DESC
`, (err, rows) => {
  if (err) {
    console.error('查询错误:', err);
    return;
  }
  
  console.log(`找到 ${rows.length} 条记录消息`);
  
  if (rows.length === 0) {
    console.log('没有找到记录消息');
    db.close();
    return;
  }
  
  let completed = 0;
  
  rows.forEach((row, index) => {
    try {
      // 解析JSON内容
      const content = JSON.parse(row.content);
      
      // 构建新标题
      const transactionType = content.transaction_type;
      const amount = content.amount || 0;
      
      // 处理旧数据中可能存在的中文transaction_type
      let isIncome = false;
      if (transactionType === 'income' || transactionType === '收入') {
        isIncome = true;
      } else if (transactionType === 'expense' || transactionType === '支出') {
        isIncome = false;
      }
      
      const newTitle = `您已成功创建${isIncome ? '收入' : '支出'}记录，金额：${isIncome ? '+' : '-'}${amount}元`;
      
      // 更新content中的message字段
      content.message = newTitle;
      const newContent = JSON.stringify(content);
      
      // 更新数据库
      db.run(`
        UPDATE notifications 
        SET title = ?, content = ?
        WHERE id = ?
      `, [newTitle, newContent, row.id], function(updateErr) {
        if (updateErr) {
          console.error(`更新消息 ${row.id} 失败:`, updateErr);
        } else {
          console.log(`✓ 已更新消息 ${row.id}: ${newTitle}`);
        }
        
        completed++;
        if (completed === rows.length) {
          console.log(`\n更新完成！共更新了 ${completed} 条消息标题`);
          db.close();
        }
      });
      
    } catch (parseErr) {
      console.error(`解析消息 ${row.id} 内容失败:`, parseErr);
      completed++;
      if (completed === rows.length) {
        console.log(`\n更新完成！共更新了 ${completed - 1} 条消息标题`);
        db.close();
      }
    }
  });
});