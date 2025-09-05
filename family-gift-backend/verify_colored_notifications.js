const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./family_gift.db');

console.log('验证通知颜色格式更新结果...');

// 查询所有"成员注销退出家庭"通知
db.all(`
  SELECT id, content, created_at 
  FROM notifications 
  WHERE title = '成员注销退出家庭'
  ORDER BY created_at DESC
  LIMIT 10
`, [], (err, rows) => {
  if (err) {
    console.error('查询失败:', err);
    return;
  }

  console.log(`\n找到 ${rows.length} 条"成员注销退出家庭"通知:`);
  
  rows.forEach((row, index) => {
    console.log(`\n第 ${index + 1} 条通知 (ID: ${row.id}):`);
    console.log('创建时间:', row.created_at);
    console.log('内容:', row.content);
    
    // 检查是否包含颜色格式
    if (row.content.includes('<span style="color:')) {
      console.log('✅ 包含颜色格式');
    } else {
      console.log('❌ 不包含颜色格式');
    }
  });

  // 统计总体情况
  db.get(`
    SELECT 
      COUNT(*) as total,
      SUM(CASE WHEN content LIKE '%<span style="color:%' THEN 1 ELSE 0 END) as with_colors,
      SUM(CASE WHEN content NOT LIKE '%<span style="color:%' THEN 1 ELSE 0 END) as without_colors
    FROM notifications 
    WHERE title = '成员注销退出家庭'
  `, [], (err, result) => {
    if (err) {
      console.error('统计查询失败:', err);
    } else {
      console.log(`\n=== 统计结果 ===`);
      console.log(`总通知数: ${result.total}`);
      console.log(`带颜色格式: ${result.with_colors}`);
      console.log(`不带颜色格式: ${result.without_colors}`);
      
      if (result.without_colors === 0) {
        console.log('🎉 所有通知都已成功更新为带颜色的格式！');
      } else {
        console.log(`⚠️  还有 ${result.without_colors} 条通知未更新颜色格式`);
      }
    }
    
    db.close();
  });
});