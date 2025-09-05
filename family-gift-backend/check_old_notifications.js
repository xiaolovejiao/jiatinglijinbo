const sqlite3 = require('sqlite3').verbose();

// 连接数据库
const db = new sqlite3.Database('./family_gift.db');

console.log('检查数据库中的成员注销退出家庭通知...');

// 查询最近的成员注销退出家庭通知
db.all(`SELECT id, title, content, created_at FROM notifications 
        WHERE title = '成员注销退出家庭' 
        ORDER BY created_at DESC 
        LIMIT 10`, (err, rows) => {
    if (err) {
        console.error('查询错误:', err);
        return;
    }
    
    console.log(`\n找到 ${rows.length} 条成员注销退出家庭通知:\n`);
    
    rows.forEach((row, index) => {
        console.log(`${index + 1}. 通知ID: ${row.id}`);
        console.log(`   标题: ${row.title}`);
        console.log(`   内容: ${row.content}`);
        console.log(`   创建时间: ${row.created_at}`);
        
        // 检查内容是否包含HTML标签
        const hasHtmlTags = row.content.includes('<span') || row.content.includes('</span>');
        console.log(`   包含HTML标签: ${hasHtmlTags ? '是' : '否'}`);
        console.log('---\n');
    });
    
    // 统计包含HTML标签的通知数量
    const htmlNotifications = rows.filter(row => 
        row.content.includes('<span') || row.content.includes('</span>')
    );
    
    console.log(`\n统计结果:`);
    console.log(`总通知数: ${rows.length}`);
    console.log(`包含HTML标签的通知: ${htmlNotifications.length}`);
    console.log(`纯文本通知: ${rows.length - htmlNotifications.length}`);
    
    if (htmlNotifications.length > 0) {
        console.log('\n⚠️  发现包含HTML标签的旧通知，需要转换为纯文本格式');
    } else {
        console.log('\n✅ 所有通知都已是纯文本格式');
    }
    
    db.close();
});