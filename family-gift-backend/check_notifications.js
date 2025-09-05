const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// 连接数据库
const dbPath = path.join(__dirname, 'family_gift.db');
const db = new sqlite3.Database(dbPath);

console.log('检查notifications表结构和最近的通知记录...');

// 检查表结构
db.get("SELECT sql FROM sqlite_master WHERE type='table' AND name='notifications'", (err, row) => {
  if (err) {
    console.error('查询表结构失败:', err);
  } else if (row) {
    console.log('\nnotifications表结构:');
    console.log(row.sql);
  } else {
    console.log('notifications表不存在');
  }
  
  // 检查最近的通知记录
  db.all(`
    SELECT id, user_id, category, title, content, is_read, created_at 
    FROM notifications 
    WHERE category = 'delete_request' 
    ORDER BY created_at DESC 
    LIMIT 10
  `, (err, rows) => {
    if (err) {
      console.error('查询通知记录失败:', err);
    } else {
      console.log('\n最近的删除请求通知:');
      if (rows.length === 0) {
        console.log('没有找到删除请求通知');
      } else {
        rows.forEach(row => {
          console.log(`ID: ${row.id}, 用户ID: ${row.user_id}, 标题: ${row.title}, 已读: ${row.is_read}, 时间: ${row.created_at}`);
        });
      }
    }
    
    // 检查所有最近的通知
    db.all(`
      SELECT id, user_id, category, title, is_read, created_at 
      FROM notifications 
      ORDER BY created_at DESC 
      LIMIT 20
    `, (err, rows) => {
      if (err) {
        console.error('查询所有通知失败:', err);
      } else {
        console.log('\n最近的所有通知:');
        if (rows.length === 0) {
          console.log('没有找到任何通知');
        } else {
          rows.forEach(row => {
            console.log(`ID: ${row.id}, 用户ID: ${row.user_id}, 类别: ${row.category}, 标题: ${row.title}, 已读: ${row.is_read}, 时间: ${row.created_at}`);
          });
        }
      }
      
      db.close();
    });
  });
});