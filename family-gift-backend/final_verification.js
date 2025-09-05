const sqlite3 = require('sqlite3').verbose();

// 连接数据库
const db = new sqlite3.Database('./family_gift.db');

console.log('🔍 最终验证：旧数据颜色格式化功能');
console.log('=' .repeat(50));

// 1. 检查所有成员注销退出家庭通知的格式
db.all(`
    SELECT COUNT(*) as total_count,
           SUM(CASE WHEN content LIKE '%<span%' OR content LIKE '%</span%' THEN 1 ELSE 0 END) as html_count,
           SUM(CASE WHEN content NOT LIKE '%<span%' AND content NOT LIKE '%</span%' THEN 1 ELSE 0 END) as plain_text_count
    FROM notifications 
    WHERE title = '成员注销退出家庭'
`, (err, result) => {
    if (err) {
        console.error('❌ 查询统计数据失败:', err);
        db.close();
        return;
    }
    
    const stats = result[0];
    console.log('📊 数据库统计:');
    console.log(`   总通知数: ${stats.total_count}`);
    console.log(`   HTML格式通知: ${stats.html_count}`);
    console.log(`   纯文本格式通知: ${stats.plain_text_count}`);
    
    if (stats.html_count === 0) {
        console.log('✅ 所有旧数据已成功转换为纯文本格式');
    } else {
        console.log('⚠️  仍有HTML格式的旧数据需要处理');
    }
    
    // 2. 测试前端解析逻辑
    console.log('\n🎨 前端颜色格式化测试:');
    
    db.all(`
        SELECT content 
        FROM notifications 
        WHERE title = '成员注销退出家庭' 
        AND content NOT LIKE '%<span%' 
        AND content NOT LIKE '%</span%'
        LIMIT 5
    `, (err, notifications) => {
        if (err) {
            console.error('❌ 查询通知内容失败:', err);
            db.close();
            return;
        }
        
        let successCount = 0;
        let failCount = 0;
        
        notifications.forEach((notification, index) => {
            console.log(`\n测试样本 ${index + 1}:`);
            console.log(`原始内容: ${notification.content}`);
            
            // 模拟前端formatMemberDeregistrationNotification函数
            const content = notification.content;
            const match = content.match(/^(.+?)\s因注销账号已退出家庭\s\"(.+?)\"，退出时间：(.+)$/);
            
            if (match) {
                const [, username, familyName, exitTime] = match;
                console.log('✅ 解析成功:');
                console.log(`   用户名: "${username}" → 蓝色 (#60a5fa)`);
                console.log(`   家庭名: "${familyName}" → 红色 (#f87171)`);
                console.log(`   退出时间: "${exitTime}" → 绿色 (#34d399)`);
                successCount++;
            } else {
                console.log('❌ 解析失败: 格式不匹配');
                failCount++;
            }
        });
        
        console.log('\n📈 解析结果统计:');
        console.log(`   成功解析: ${successCount}`);
        console.log(`   解析失败: ${failCount}`);
        console.log(`   成功率: ${notifications.length > 0 ? ((successCount / notifications.length) * 100).toFixed(1) : 0}%`);
        
        // 3. 总结
        console.log('\n🎯 功能验证总结:');
        console.log('=' .repeat(30));
        
        if (stats.html_count === 0 && failCount === 0) {
            console.log('🎉 完美！旧数据颜色格式化功能已完全就绪:');
            console.log('   ✅ 所有旧通知已转换为纯文本格式');
            console.log('   ✅ 前端能够正确解析并应用颜色格式化');
            console.log('   ✅ 用户名显示为蓝色');
            console.log('   ✅ 家庭名显示为红色');
            console.log('   ✅ 退出时间显示为绿色');
        } else {
            console.log('⚠️  功能部分就绪，存在以下问题:');
            if (stats.html_count > 0) {
                console.log(`   - 仍有 ${stats.html_count} 条HTML格式的旧通知`);
            }
            if (failCount > 0) {
                console.log(`   - 有 ${failCount} 条通知无法正确解析`);
            }
        }
        
        console.log('\n💡 使用说明:');
        console.log('   1. 用户在前端查看家庭管理消息时');
        console.log('   2. "成员注销退出家庭"通知会自动应用颜色格式化');
        console.log('   3. 无需手动操作，前端会自动解析纯文本并添加颜色');
        
        db.close();
    });
});