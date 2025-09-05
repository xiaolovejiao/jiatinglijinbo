const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./family_gift.db');

// 数据迁移脚本：更新旧的记录管理消息格式
console.log('开始迁移记录管理消息格式...');

// 获取所有非JSON格式的记录管理消息
db.all(`
  SELECT n.id, n.user_id, n.title, n.content, n.created_at,
         r.type, r.amount, r.description, r.event_date, r.related_person
  FROM notifications n
  LEFT JOIN records r ON (
    r.user_id = n.user_id AND 
    datetime(r.created_at) = datetime(n.created_at)
  )
  WHERE n.category = 'records' 
    AND n.content NOT LIKE '{%'
  ORDER BY n.created_at DESC
`, (err, rows) => {
  if (err) {
    console.error('查询错误:', err);
    return;
  }
  
  console.log(`找到 ${rows.length} 条需要迁移的消息`);
  
  if (rows.length === 0) {
    console.log('没有需要迁移的消息');
    db.close();
    return;
  }
  
  let completed = 0;
  
  rows.forEach((row, index) => {
    // 解析旧格式的消息内容
    const oldContent = row.content;
    let transactionType = 'expense';
    let amount = 0;
    let personName = '未知';
    
    // 从旧消息中提取信息
    if (oldContent.includes('收入记录')) {
      transactionType = 'income';
    }
    
    // 提取金额
    const amountMatch = oldContent.match(/金额：([+-]?\d+(?:\.\d+)?)元/);
    if (amountMatch) {
      amount = Math.abs(parseFloat(amountMatch[1]));
    }
    
    // 如果有关联的records记录，使用records中的数据
    if (row.type && row.amount !== null) {
      amount = Math.abs(row.amount);
      transactionType = row.amount >= 0 ? 'income' : 'expense';
      
      // 从description中提取人名和备注
      if (row.description) {
        const parts = row.description.split(' - ');
        personName = parts[0] || '未知';
      }
    }
    
    // 构建新的标题和JSON格式内容
    const newTitle = `您已成功创建${transactionType === 'income' ? '收入' : '支出'}记录，金额：${transactionType === 'income' ? '+' : '-'}${amount}元`;
    const newContent = JSON.stringify({
      message: newTitle,
      person_name: personName,
      event_type: row.type || 'other',
      relation_type: row.related_person || '',
      transaction_type: transactionType,
      amount: amount,
      event_date: row.event_date || new Date().toISOString().split('T')[0],
      remarks: row.description && row.description.includes(' - ') ? row.description.split(' - ')[1] : ''
    });
    
    // 更新数据库中的消息内容
    db.run(`
      UPDATE notifications 
      SET content = ?, title = ?
      WHERE id = ?
    `, [newContent, newTitle, row.id], function(updateErr) {
      if (updateErr) {
        console.error(`更新消息 ${row.id} 失败:`, updateErr);
      } else {
        console.log(`✓ 已更新消息 ${row.id}: ${oldContent.substring(0, 50)}...`);
      }
      
      completed++;
      if (completed === rows.length) {
        console.log(`\n迁移完成！共更新了 ${completed} 条消息`);
        db.close();
      }
    });
  });
});