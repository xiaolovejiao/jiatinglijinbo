const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'family_gift.db');
const db = new sqlite3.Database(dbPath);

console.log('检查数据库一致性问题:');

// 检查family_id为2的家庭是否存在
db.get('SELECT * FROM families WHERE id = 2', (err, family) => {
  if (err) {
    console.error('查询family错误:', err);
  } else {
    console.log('\nfamily_id为2的家庭数据:');
    console.log(family);
  }
  
  // 检查所有孤立的family_members记录
  db.all(`
    SELECT fm.*, f.id as family_exists 
    FROM family_members fm 
    LEFT JOIN families f ON fm.family_id = f.id 
    WHERE f.id IS NULL
  `, (err, orphanMembers) => {
    if (err) {
      console.error('查询孤立成员错误:', err);
    } else {
      console.log('\n孤立的family_members记录（没有对应家庭）:');
      console.log(orphanMembers);
    }
    
    // 清理孤立的记录
    if (orphanMembers.length > 0) {
      console.log('\n清理孤立的family_members记录...');
      db.run(`
        DELETE FROM family_members 
        WHERE family_id NOT IN (SELECT id FROM families)
      `, function(err) {
        if (err) {
          console.error('清理错误:', err);
        } else {
          console.log(`已清理 ${this.changes} 条孤立记录`);
        }
        db.close();
      });
    } else {
      console.log('\n没有发现孤立记录');
      db.close();
    }
  });
});
