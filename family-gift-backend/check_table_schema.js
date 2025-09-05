const sqlite3 = require('sqlite3').verbose();

// 数据库连接
const db = new sqlite3.Database('./family_gift.db');

// 检查users表结构
function checkTableSchema() {
  console.log('检查users表结构...');
  
  db.get(
    "SELECT sql FROM sqlite_master WHERE type='table' AND name='users'",
    [],
    (err, row) => {
      if (err) {
        console.error('❌ 查询表结构错误:', err);
        db.close();
        return;
      }
      
      if (row) {
        console.log('users表结构:');
        console.log(row.sql);
      } else {
        console.log('❌ 未找到users表');
      }
      
      db.close();
    }
  );
}

// 运行检查
checkTableSchema();