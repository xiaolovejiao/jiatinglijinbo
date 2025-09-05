const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./family_gift.db');

console.log('开始更新JSON格式的通知数据，添加颜色格式...');

// 查找所有JSON格式的"成员注销退出家庭"通知
db.all(`
  SELECT id, content 
  FROM notifications 
  WHERE title = '成员注销退出家庭' 
    AND content LIKE '{%}'
    AND content NOT LIKE '%<span%'
`, [], (err, rows) => {
  if (err) {
    console.error('查询失败:', err);
    return;
  }

  console.log(`找到 ${rows.length} 条JSON格式的通知需要更新`);

  if (rows.length === 0) {
    console.log('没有需要更新的JSON格式通知');
    db.close();
    return;
  }

  let updatedCount = 0;

  rows.forEach((row, index) => {
    const originalContent = row.content;
    console.log(`\n处理第 ${index + 1} 条通知 (ID: ${row.id}):`);
    console.log('原内容:', originalContent);

    try {
      // 解析JSON内容
      const jsonData = JSON.parse(originalContent);
      
      if (jsonData.member_name && jsonData.family_name && jsonData.leave_time) {
        // 创建带颜色的新内容
        const newContent = `<span style="color: #2563eb; font-weight: 600;">${jsonData.member_name}</span> 因注销账号已退出家庭 <span style="color: #dc2626; font-weight: 600;">"${jsonData.family_name}"</span>，退出时间：<span style="color: #059669; font-weight: 500;">${jsonData.leave_time}</span>`;
        
        console.log('新内容:', newContent);

        // 更新数据库
        db.run(`UPDATE notifications SET content = ? WHERE id = ?`, [newContent, row.id], function(err) {
          if (err) {
            console.error(`更新通知 ${row.id} 失败:`, err);
          } else {
            console.log(`✅ 通知 ${row.id} 更新成功`);
          }
          
          updatedCount++;
          
          // 如果是最后一条记录，关闭数据库
          if (updatedCount === rows.length) {
            console.log(`\n=== 更新完成 ===`);
            console.log(`总共处理了 ${rows.length} 条JSON格式通知`);
            db.close();
          }
        });
      } else {
        console.log('❌ JSON数据缺少必要字段，跳过此条通知');
        updatedCount++;
        
        // 如果是最后一条记录，关闭数据库
        if (updatedCount === rows.length) {
          console.log(`\n=== 更新完成 ===`);
          console.log(`总共处理了 ${rows.length} 条通知`);
          db.close();
        }
      }
    } catch (parseError) {
      console.log('❌ JSON解析失败，跳过此条通知:', parseError.message);
      updatedCount++;
      
      // 如果是最后一条记录，关闭数据库
      if (updatedCount === rows.length) {
        console.log(`\n=== 更新完成 ===`);
        console.log(`总共处理了 ${rows.length} 条通知`);
        db.close();
      }
    }
  });
});