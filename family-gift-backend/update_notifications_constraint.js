const sqlite3 = require('sqlite3').verbose();

// 连接数据库
const db = new sqlite3.Database('./family_gift.db');

console.log('开始更新 notifications 表约束...');

db.serialize(() => {
  // 1. 创建新的临时表，包含更新的约束
  db.run(`CREATE TABLE notifications_new (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    category TEXT NOT NULL CHECK(category IN ('system', 'family', 'records', 'delete_request')),
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    is_read BOOLEAN DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users (id)
  )`, (err) => {
    if (err) {
      console.error('创建新表失败:', err);
      return;
    }
    console.log('✓ 创建新表成功');
  });

  // 2. 复制现有数据到新表
  db.run(`INSERT INTO notifications_new (id, user_id, category, title, content, is_read, created_at)
          SELECT id, user_id, category, title, content, is_read, created_at FROM notifications`, (err) => {
    if (err) {
      console.error('复制数据失败:', err);
      return;
    }
    console.log('✓ 复制数据成功');
  });

  // 3. 删除旧表
  db.run(`DROP TABLE notifications`, (err) => {
    if (err) {
      console.error('删除旧表失败:', err);
      return;
    }
    console.log('✓ 删除旧表成功');
  });

  // 4. 重命名新表
  db.run(`ALTER TABLE notifications_new RENAME TO notifications`, (err) => {
    if (err) {
      console.error('重命名表失败:', err);
      return;
    }
    console.log('✓ 重命名表成功');
    console.log('🎉 notifications 表约束更新完成！');
    
    // 关闭数据库连接
    db.close((err) => {
      if (err) {
        console.error('关闭数据库失败:', err);
      } else {
        console.log('✓ 数据库连接已关闭');
      }
    });
  });
});