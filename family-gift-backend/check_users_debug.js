const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./family_gift.db');

console.log('=== 检查用户信息 ===');
db.all('SELECT id, username, password, security_question, security_answer FROM users ORDER BY id', (err, users) => {
  if (err) {
    console.error('查询用户错误:', err);
    db.close();
    return;
  }
  
  console.log('用户列表:');
  users.forEach(user => {
    console.log(`\n用户 ${user.id}:`);
    console.log('- 用户名:', user.username);
    console.log('- 密码哈希:', user.password ? user.password.substring(0, 20) + '...' : '无');
    console.log('- 密保问题:', user.security_question || '无');
    console.log('- 密保答案哈希:', user.security_answer ? user.security_answer.substring(0, 20) + '...' : '无');
  });
  
  db.close();
});