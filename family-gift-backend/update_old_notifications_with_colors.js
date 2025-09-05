const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./family_gift.db');

console.log('开始更新旧的通知数据，添加颜色格式...');

// 查找所有包含"因注销账号已退出家庭"的通知，但不包含颜色格式的
db.all(`
  SELECT id, content 
  FROM notifications 
  WHERE content LIKE '%因注销账号已退出家庭%' 
    AND content NOT LIKE '%<span%'
`, [], (err, rows) => {
  if (err) {
    console.error('查询失败:', err);
    return;
  }

  console.log(`找到 ${rows.length} 条需要更新的通知`);

  if (rows.length === 0) {
    console.log('没有需要更新的通知');
    db.close();
    return;
  }

  let updatedCount = 0;

  rows.forEach((row, index) => {
    const originalContent = row.content;
    console.log(`\n处理第 ${index + 1} 条通知 (ID: ${row.id}):`);
    console.log('原内容:', originalContent);

    let newContent = '';
    let matched = false;

    // 模式1: "用户名 因注销账号已退出家庭 "家庭名"，退出时间：时间"
    const regex1 = /^(.+?)\s因注销账号已退出家庭\s"(.+?)"，退出时间：(.+)$/;
    const match1 = originalContent.match(regex1);
    
    if (match1) {
      const [, username, familyName, exitTime] = match1;
      newContent = `<span style="color: #2563eb; font-weight: 600;">${username}</span> 因注销账号已退出家庭 <span style="color: #dc2626; font-weight: 600;">"${familyName}"</span>，退出时间：<span style="color: #059669; font-weight: 500;">${exitTime}</span>`;
      matched = true;
    } else {
      // 模式2: "用户名 因注销账号已退出家庭"家庭名"，退出时间：时间" (没有空格)
      const regex2 = /^(.+?)\s因注销账号已退出家庭"(.+?)"，退出时间：(.+)$/;
      const match2 = originalContent.match(regex2);
      
      if (match2) {
        const [, username, familyName, exitTime] = match2;
        newContent = `<span style="color: #2563eb; font-weight: 600;">${username}</span> 因注销账号已退出家庭<span style="color: #dc2626; font-weight: 600;">"${familyName}"</span>，退出时间：<span style="color: #059669; font-weight: 500;">${exitTime}</span>`;
        matched = true;
      } else {
        // 模式3: 更宽松的匹配
        const regex3 = /^(.+?)\s*因注销账号已退出家庭.*?"(.+?)".*?时间[：:](.+)$/;
        const match3 = originalContent.match(regex3);
        
        if (match3) {
          const [, username, familyName, exitTime] = match3;
          newContent = `<span style="color: #2563eb; font-weight: 600;">${username}</span> 因注销账号已退出家庭 <span style="color: #dc2626; font-weight: 600;">"${familyName}"</span>，退出时间：<span style="color: #059669; font-weight: 500;">${exitTime}</span>`;
          matched = true;
        }
      }
    }

    if (matched) {
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
          console.log(`总共处理了 ${rows.length} 条通知`);
          db.close();
        }
      });
    } else {
      console.log('❌ 内容格式不匹配，跳过此条通知');
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