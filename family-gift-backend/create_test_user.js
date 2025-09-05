const fetch = require('node-fetch');

// 创建测试用户并测试修改密码
async function createTestUserAndChangePassword() {
  try {
    console.log('=== 创建测试用户并测试修改密码 ===');
    
    // 1. 注册新用户
    console.log('1. 注册新用户...');
    const registerResponse = await fetch('http://localhost:5000/api/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        username: 'testpassword456',
        password: '123456',
        securityQuestion: '你的宠物叫什么？',
        securityAnswer: 'xiaomao'
      })
    });
    
    console.log('注册响应状态:', registerResponse.status);
    const registerData = await registerResponse.text();
    console.log('注册响应:', registerData);
    
    if (!registerResponse.ok) {
      console.log('注册失败，可能用户已存在，继续测试登录...');
    }
    
    // 2. 登录
    console.log('\n2. 登录测试用户...');
    const loginResponse = await fetch('http://localhost:5000/api/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
          username: 'testpassword456',
          password: '654321'
        })
    });
    
    console.log('登录响应状态:', loginResponse.status);
    if (!loginResponse.ok) {
      console.error('登录失败:', await loginResponse.text());
      return;
    }
    
    const loginData = await loginResponse.json();
    console.log('登录成功:', loginData.message);
    
    // 获取cookie
    const cookies = loginResponse.headers.get('set-cookie');
    console.log('获取到的cookies:', cookies);
    
    // 3. 修改密码
    console.log('\n3. 测试修改密码...');
    const changePasswordResponse = await fetch('http://localhost:5000/api/change-password', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': cookies || ''
      },
      body: JSON.stringify({
        old_password: '654321',
        new_password: '123456',
        security_answer: 'xiaomao'
      })
    });
    
    console.log('修改密码响应状态:', changePasswordResponse.status);
    const changePasswordData = await changePasswordResponse.text();
    console.log('修改密码响应:', changePasswordData);
    
    // 4. 检查通知
    console.log('\n4. 检查系统通知...');
    const notificationsResponse = await fetch('http://localhost:5000/api/notifications', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': cookies || ''
      }
    });
    
    if (notificationsResponse.ok) {
      const notifications = await notificationsResponse.json();
      console.log('系统通知数量:', notifications.system.messages.length);
      console.log('最新的系统通知:');
      notifications.system.messages.slice(0, 3).forEach((msg, index) => {
        console.log(`  ${index + 1}. ${msg.title} - ${msg.timestamp}`);
        console.log(`     内容: ${msg.content}`);
      });
    } else {
      console.error('获取通知失败:', notificationsResponse.status, await notificationsResponse.text());
    }
    
  } catch (error) {
    console.error('测试过程中出错:', error);
  }
}

createTestUserAndChangePassword();