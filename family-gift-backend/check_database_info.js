const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'family_gift.db');
const db = new sqlite3.Database(dbPath);

console.log('=== 数据库信息扫描 ===\n');

// 获取所有表信息
db.all("SELECT name FROM sqlite_master WHERE type='table'", [], (err, tables) => {
  if (err) {
    console.error('获取表列表失败:', err.message);
    return;
  }
  
  console.log('数据库表列表:');
  tables.forEach((table, index) => {
    console.log(`${index + 1}. ${table.name}`);
  });
  console.log('');
  
  // 获取每个表的详细信息
  let processedTables = 0;
  tables.forEach((table) => {
    // 获取表结构
    db.all(`PRAGMA table_info(${table.name})`, [], (err, columns) => {
      if (err) {
        console.error(`获取表 ${table.name} 结构失败:`, err.message);
        return;
      }
      
      console.log(`=== 表: ${table.name} ===`);
      console.log('字段结构:');
      columns.forEach((col) => {
        console.log(`  ${col.name} (${col.type}) ${col.pk ? '[主键]' : ''} ${col.notnull ? '[非空]' : ''}`);
      });
      
      // 获取记录数量
      db.get(`SELECT COUNT(*) as count FROM ${table.name}`, [], (err, result) => {
        if (err) {
          console.error(`获取表 ${table.name} 记录数失败:`, err.message);
        } else {
          console.log(`记录数量: ${result.count}`);
        }
        
        // 如果记录数不为0，显示前几条记录
        if (result.count > 0) {
          db.all(`SELECT * FROM ${table.name} LIMIT 3`, [], (err, rows) => {
            if (err) {
              console.error(`获取表 ${table.name} 示例数据失败:`, err.message);
            } else {
              console.log('示例数据:');
              rows.forEach((row, index) => {
                console.log(`  记录 ${index + 1}:`, JSON.stringify(row, null, 2));
              });
            }
            console.log('');
            
            processedTables++;
            if (processedTables === tables.length) {
              // 获取数据库文件大小
              const fs = require('fs');
              try {
                const stats = fs.statSync(dbPath);
                const fileSizeInBytes = stats.size;
                const fileSizeInMB = (fileSizeInBytes / (1024 * 1024)).toFixed(2);
                console.log(`=== 数据库文件信息 ===`);
                console.log(`文件路径: ${dbPath}`);
                console.log(`文件大小: ${fileSizeInMB} MB`);
                console.log(`最后修改: ${stats.mtime.toLocaleString()}`);
              } catch (error) {
                console.error('获取文件信息失败:', error.message);
              }
              
              db.close();
            }
          });
        } else {
          console.log('该表为空');
          console.log('');
          
          processedTables++;
          if (processedTables === tables.length) {
            db.close();
          }
        }
      });
    });
  });
});