const sqlite3 = require('sqlite3').verbose();

// 连接数据库
const db = new sqlite3.Database('./family_gift.db');

console.log('查找有成员注销退出家庭通知的用户...');

// 查找有成员注销退出家庭通知的用户
db.all(`
    SELECT DISTINCT n.user_id, u.username 
    FROM notifications n 
    JOIN users u ON n.user_id = u.id 
    WHERE n.title = '成员注销退出家庭' 
    LIMIT 5
`, (err, rows) => {
    if (err) {
        console.error('查询错误:', err);
        db.close();
        return;
    }
    
    if (rows.length === 0) {
        console.log('没有找到有成员注销退出家庭通知的用户');
        db.close();
        return;
    }
    
    console.log(`找到 ${rows.length} 个有成员注销退出家庭通知的用户:`);
    
    rows.forEach((row, index) => {
        console.log(`${index + 1}. 用户ID: ${row.user_id}, 用户名: ${row.username}`);
    });
    
    // 获取第一个用户的详细通知信息
    const firstUser = rows[0];
    console.log(`\n获取用户 ${firstUser.username} 的成员注销退出家庭通知详情:`);
    
    db.all(`
        SELECT id, title, content, created_at 
        FROM notifications 
        WHERE user_id = ? AND title = '成员注销退出家庭' 
        ORDER BY created_at DESC 
        LIMIT 3
    `, [firstUser.user_id], (err, notifications) => {
        if (err) {
            console.error('查询通知详情错误:', err);
        } else {
            notifications.forEach((notification, index) => {
                console.log(`\n通知 ${index + 1}:`);
                console.log(`  ID: ${notification.id}`);
                console.log(`  标题: ${notification.title}`);
                console.log(`  内容: ${notification.content}`);
                console.log(`  创建时间: ${notification.created_at}`);
                
                // 检查是否为纯文本格式
                const hasHtmlTags = notification.content.includes('<span') || notification.content.includes('</span>');
                console.log(`  格式: ${hasHtmlTags ? 'HTML格式' : '纯文本格式'}`);
                
                // 如果是纯文本，测试前端解析逻辑
                if (!hasHtmlTags) {
                    const content = notification.content;
                    const match = content.match(/^(.+?)\s因注销账号已退出家庭\s\"(.+?)\"，退出时间：(.+)$/);
                    if (match) {
                        const [, username, familyName, exitTime] = match;
                        console.log(`  解析结果:`);
                        console.log(`    - 用户名: "${username}" (前端将显示为蓝色)`);
                        console.log(`    - 家庭名: "${familyName}" (前端将显示为红色)`);
                        console.log(`    - 退出时间: "${exitTime}" (前端将显示为绿色)`);
                    } else {
                        console.log(`  ⚠️  内容格式不匹配，可能无法正确应用颜色格式化`);
                    }
                }
            });
        }
        
        db.close();
    });
});