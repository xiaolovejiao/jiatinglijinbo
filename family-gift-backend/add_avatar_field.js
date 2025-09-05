const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'family_gift.db');
const db = new sqlite3.Database(dbPath);

console.log('添加avatar字段到users表:');

// 添加avatar字段
db.run('ALTER TABLE users ADD COLUMN avatar TEXT', (err) => {
  if (err) {
    if (err.message.includes('duplicate column name')) {
      console.log('avatar字段已存在');
    } else {
      console.error('添加avatar字段错误:', err);
    }
  } else {
    console.log('avatar字段添加成功');
  }
  
  // 验证字段是否添加成功
  db.all('PRAGMA table_info(users)', (err, columns) => {
    if (err) {
      console.error('查询表结构错误:', err);
    } else {
      console.log('\nusers表结构:');
      columns.forEach(col => {
        console.log(`${col.name}: ${col.type}`);
      });
    }
    
    db.close();
  });
});