const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// 连接数据库
const dbPath = path.join(__dirname, 'family_gift.db');
const db = new sqlite3.Database(dbPath);

console.log('移除用户表中的手机号和邮箱字段...');

// SQLite不支持直接删除列，需要重建表
db.serialize(() => {
  console.log('1. 创建新的用户表结构（不包含phone和email字段）...');
  
  // 创建新的用户表
  db.run(`CREATE TABLE users_new (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    nickname TEXT,
    bio TEXT,
    avatar TEXT,
    security_question TEXT,
    security_answer TEXT,
    is_admin BOOLEAN DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`, (err) => {
    if (err) {
      console.error('创建新表失败:', err);
      db.close();
      return;
    }
    console.log('新用户表创建成功');
  });
  
  console.log('2. 复制数据到新表（排除phone和email字段）...');
  
  // 复制数据到新表
  db.run(`INSERT INTO users_new (id, username, password, nickname, bio, avatar, security_question, security_answer, is_admin, created_at)
    SELECT id, username, password, nickname, bio, avatar, security_question, security_answer, is_admin, created_at
    FROM users`, (err) => {
    if (err) {
      console.error('数据复制失败:', err);
      db.close();
      return;
    }
    console.log('数据复制成功');
  });
  
  console.log('3. 删除旧表...');
  
  // 删除旧表
  db.run('DROP TABLE users', (err) => {
    if (err) {
      console.error('删除旧表失败:', err);
      db.close();
      return;
    }
    console.log('旧表删除成功');
  });
  
  console.log('4. 重命名新表...');
  
  // 重命名新表
  db.run('ALTER TABLE users_new RENAME TO users', (err) => {
    if (err) {
      console.error('重命名表失败:', err);
      db.close();
      return;
    }
    console.log('表重命名成功');
    
    // 验证新表结构
    console.log('5. 验证新表结构...');
    db.all('PRAGMA table_info(users)', (err, columns) => {
      if (err) {
        console.error('查询表结构错误:', err);
      } else {
        console.log('\n新的users表结构:');
        columns.forEach(col => {
          console.log(`${col.name}: ${col.type}`);
        });
        console.log('\n手机号和邮箱字段移除完成！');
      }
      
      db.close();
    });
  });
});