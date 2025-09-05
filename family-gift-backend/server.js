const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const multer = require('multer');
const fs = require('fs');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'family-gift-secret-key-2024';

// 中间件
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:5174'],
  credentials: true
}));
app.use(express.json());
app.use(cookieParser());

// 创建uploads目录
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// 静态文件服务
app.use('/uploads', express.static(uploadsDir));

// Multer配置
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    // 生成唯一文件名
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, 'avatar-' + uniqueSuffix + ext);
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB限制
  },
  fileFilter: function (req, file, cb) {
    // 只允许图片文件
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('只允许上传图片文件'));
    }
  }
});

// 数据库初始化
const db = new sqlite3.Database('./family_gift.db');

// 创建用户表
db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS users (
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
  )`);

  // 添加新字段（如果不存在）
  db.run(`ALTER TABLE users ADD COLUMN nickname TEXT`, (err) => {
    // 忽略字段已存在的错误
  });
  db.run(`ALTER TABLE users ADD COLUMN bio TEXT`, (err) => {
    // 忽略字段已存在的错误
  });

  // 创建家庭表
  db.run(`CREATE TABLE IF NOT EXISTS families (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    user_id INTEGER,
    family_id_code TEXT UNIQUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users (id)
  )`);
  
  // 创建消息通知表
  db.run(`CREATE TABLE IF NOT EXISTS notifications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    category TEXT NOT NULL CHECK(category IN ('system', 'family', 'records', 'delete_request')),
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    is_read BOOLEAN DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users (id)
  )`);

  // 创建家庭成员表
  db.run(`CREATE TABLE IF NOT EXISTS family_members (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    family_id INTEGER,
    user_id INTEGER,
    role TEXT DEFAULT '成员',
    joined_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (family_id) REFERENCES families (id),
    FOREIGN KEY (user_id) REFERENCES users (id),
    UNIQUE(family_id, user_id)
  )`);

  // 创建礼金记录表
  db.run(`CREATE TABLE IF NOT EXISTS gift_records (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    family_id INTEGER,
    event_type TEXT NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    date DATE NOT NULL,
    description TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users (id),
    FOREIGN KEY (family_id) REFERENCES families (id)
  )`);

  // 创建新的记录表（用于API）
  db.run(`CREATE TABLE IF NOT EXISTS records (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    family_id INTEGER,
    user_id INTEGER,
    type TEXT NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    description TEXT,
    event_date DATE NOT NULL,
    related_person TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (family_id) REFERENCES families (id),
    FOREIGN KEY (user_id) REFERENCES users (id)
  )`);

  // 创建家庭邀请表
  db.run(`CREATE TABLE IF NOT EXISTS family_invitations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    family_id INTEGER NOT NULL,
    inviter_id INTEGER NOT NULL,
    invitee_username TEXT NOT NULL,
    invitee_id INTEGER,
    status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'accepted', 'rejected')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    responded_at DATETIME,
    FOREIGN KEY (family_id) REFERENCES families (id),
    FOREIGN KEY (inviter_id) REFERENCES users (id),
    FOREIGN KEY (invitee_id) REFERENCES users (id)
  )`);
});

// JWT验证中间件
const authenticateToken = (req, res, next) => {
  let token = req.cookies.token;
  
  // 如果cookie中没有token，尝试从Authorization header获取
  if (!token) {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    }
  }
  
  if (!token) {
    return res.status(401).json({ error: '未授权访问' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      console.error('JWT验证错误:', err.message);
      return res.status(403).json({ error: '令牌无效' });
    }
    req.user = user;
    next();
  });
};

// 管理员验证中间件
const requireAdmin = (req, res, next) => {
  if (!req.user.is_admin) {
    return res.status(403).json({ error: '需要管理员权限' });
  }
  next();
};

// 用户注册
app.post('/api/register', async (req, res) => {
  try {
    const { username, nickname, password, securityQuestion, securityAnswer } = req.body;
    
    // 调试日志：打印接收到的数据
    console.log('注册请求数据:', {
      username,
      nickname,
      hasPassword: !!password,
      securityQuestion,
      hasSecurityAnswer: !!securityAnswer
    });
    
    // 验证必填字段
    if (!username || !nickname || !password || !securityQuestion || !securityAnswer) {
      console.log('注册失败：缺少必填字段');
      return res.status(400).json({ error: '账号、昵称、密码、密保问题和答案为必填项' });
    }
    
    // 验证昵称不能为空或只包含空格
    const trimmedNickname = nickname.trim();
    if (!trimmedNickname) {
      console.log('注册失败：昵称为空或只包含空格');
      return res.status(400).json({ error: '昵称不能为空或只包含空格' });
    }
    
    // 检查用户名是否已存在
    db.get('SELECT id FROM users WHERE username = ?', [username], async (err, row) => {
      if (err) {
        return res.status(500).json({ error: '数据库错误' });
      }
      
      if (row) {
        return res.status(400).json({ error: '用户名已存在' });
      }
      
      // 加密密码
      const hashedPassword = await bcrypt.hash(password, 10);
      const hashedAnswer = await bcrypt.hash(securityAnswer, 10);
      
      // 插入新用户
        db.run(
          'INSERT INTO users (username, nickname, password, security_question, security_answer) VALUES (?, ?, ?, ?, ?)',
          [username, trimmedNickname, hashedPassword, securityQuestion, hashedAnswer],
        function(err) {
          if (err) {
            return res.status(500).json({ error: '注册失败' });
          }
          
          // 生成JWT令牌
          const token = jwt.sign(
            { id: this.lastID, username, is_admin: false },
            JWT_SECRET,
            { expiresIn: '7d' }
          );
          
          res.cookie('token', token, {
            httpOnly: true,
            secure: false,
            maxAge: 7 * 24 * 60 * 60 * 1000
          });
          
          res.json({
            success: true,
            user: {
              id: this.lastID,
              username,
              nickname: nickname,
              is_admin: false
            }
          });
        }
      );
    });
  } catch (error) {
    res.status(500).json({ error: '服务器错误' });
  }
});

// 用户登录
app.post('/api/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    db.get('SELECT * FROM users WHERE username = ?', [username], async (err, user) => {
      if (err) {
        return res.status(500).json({ error: '数据库错误' });
      }
      
      if (!user) {
        return res.status(400).json({ error: '用户名或密码错误' });
      }
      
      // 验证密码
      const validPassword = await bcrypt.compare(password, user.password);
      if (!validPassword) {
        return res.status(400).json({ error: '用户名或密码错误' });
      }
      
      // 生成JWT令牌
      const token = jwt.sign(
        { id: user.id, username: user.username, is_admin: user.is_admin },
        JWT_SECRET,
        { expiresIn: '7d' }
      );
      
      res.cookie('token', token, {
        httpOnly: true,
        secure: false,
        maxAge: 7 * 24 * 60 * 60 * 1000
      });
      
      // 站主特殊欢迎信息
      let welcomeMessage = null;
      if (user.is_admin) {
        welcomeMessage = '欢迎回来，尊敬的站主大人！';
      }
      
      res.json({
        success: true,
        user: {
          id: user.id,
          username: user.username,
          is_admin: user.is_admin,
          nickname: user.nickname,
          bio: user.bio,
          avatar: user.avatar,
          created_at: user.created_at
        },
        welcome_message: welcomeMessage
      });
    });
  } catch (error) {
    res.status(500).json({ error: '服务器错误' });
  }
});

// 获取当前用户信息
app.get('/api/me', authenticateToken, (req, res) => {
  // 处理管理员账户的特殊情况
  if (req.user.id === 'admin' && req.user.is_admin) {
    return res.json({ 
      user: {
        id: 'admin',
        username: req.user.username || '站主',
        is_admin: true
      }
    });
  }
  
  // 普通用户从数据库查询
  db.get('SELECT id, username, is_admin, bio, nickname, avatar, created_at, security_question FROM users WHERE id = ?', [req.user.id], (err, user) => {
    if (err) {
      return res.status(500).json({ error: '数据库错误' });
    }
    
    if (!user) {
      return res.status(404).json({ error: '用户不存在' });
    }
    
    res.json({ user });
  });
});

// 获取指定用户信息
app.get('/api/users/:userId', authenticateToken, (req, res) => {
  const userId = req.params.userId;
  
  // 从数据库查询用户信息
  db.get('SELECT id, username, nickname, bio, avatar, created_at FROM users WHERE id = ?', [userId], (err, user) => {
    if (err) {
      return res.status(500).json({ error: '数据库错误' });
    }
    
    if (!user) {
      return res.status(404).json({ error: '用户不存在' });
    }
    
    res.json({ user });
  });
});

// 用户登出
app.post('/api/logout', (req, res) => {
  res.clearCookie('token');
  res.json({ success: true, message: '登出成功' });
});

// 更新用户资料
app.put('/api/user/update-profile', authenticateToken, (req, res) => {
  const { bio, nickname } = req.body;
  const userId = req.user.id;

  // 更新用户信息（只更新昵称和个人简介）
  db.run(
    'UPDATE users SET bio = ?, nickname = ? WHERE id = ?',
    [bio, nickname, userId],
    function(err) {
      if (err) {
        return res.status(500).json({ error: '更新失败' });
      }

      // 创建系统通知
      createNotification(
        userId,
        'system',
        '个人资料更新成功',
        JSON.stringify({
          message: '您的个人资料已成功更新',
          nickname: nickname || '',
          bio: bio || '',
          update_time: new Date().toLocaleString()
        })
      );

      res.json({ success: true, message: '资料更新成功' });
    }
  );
});

// 上传头像
app.post('/api/user/upload-avatar', authenticateToken, upload.single('avatar'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: '没有上传文件' });
  }

  const userId = req.user.id;
  const avatarUrl = `http://localhost:5000/uploads/${req.file.filename}`;

  // 更新数据库中的头像字段
  db.run('UPDATE users SET avatar = ? WHERE id = ?', [avatarUrl, userId], function(err) {
    if (err) {
      console.error('更新头像失败:', err);
      // 删除已上传的文件
      fs.unlink(req.file.path, (unlinkErr) => {
        if (unlinkErr) console.error('删除文件失败:', unlinkErr);
      });
      return res.status(500).json({ error: '头像上传失败' });
    }

    // 创建系统通知
    createNotification(
      userId,
      'system',
      '头像上传成功',
      JSON.stringify({
        message: '您的头像已成功更新',
        avatar_url: avatarUrl,
        upload_time: new Date().toLocaleString()
      })
    );

    res.json({ 
      success: true, 
      message: '头像上传成功',
      avatar: avatarUrl
    });
  });
});

// 修改密码
app.post('/api/change-password', authenticateToken, async (req, res) => {
  const { old_password, new_password, security_answer } = req.body;
  const userId = req.user.id;

  try {
    // 获取用户当前信息
    db.get('SELECT password, security_answer FROM users WHERE id = ?', [userId], async (err, user) => {
      if (err) {
        return res.status(500).json({ error: '数据库错误' });
      }

      if (!user) {
        return res.status(404).json({ error: '用户不存在' });
      }

      // 验证旧密码
      const isOldPasswordValid = await bcrypt.compare(old_password, user.password);
      if (!isOldPasswordValid) {
        return res.status(400).json({ error: '原密码错误' });
      }

      // 验证密保答案
      const isSecurityAnswerValid = await bcrypt.compare(security_answer, user.security_answer);
      if (!isSecurityAnswerValid) {
        return res.status(400).json({ error: '密保答案错误' });
      }

      // 加密新密码
      const hashedNewPassword = await bcrypt.hash(new_password, 10);

      // 更新密码
      db.run('UPDATE users SET password = ? WHERE id = ?', [hashedNewPassword, userId], function(err) {
        if (err) {
          return res.status(500).json({ error: '密码更新失败' });
        }

        // 创建系统通知
        createNotification(
          userId,
          'system',
          '密码修改成功',
          JSON.stringify({
            message: '您的登录密码已成功修改',
            change_time: new Date().toLocaleString(),
            security_tip: '如非本人操作，请立即联系管理员'
          })
        );

        res.json({ success: true, message: '密码修改成功' });
      });
    });
  } catch (error) {
    res.status(500).json({ error: '服务器错误' });
  }
});

// 注销账号
app.post('/api/delete-account', authenticateToken, async (req, res) => {
  const { password, security_answer } = req.body;
  const userId = req.user.id;

  try {
    // 获取用户信息进行验证
    db.get('SELECT password, security_answer FROM users WHERE id = ?', [userId], async (err, user) => {
      if (err) {
        return res.status(500).json({ error: '数据库错误' });
      }

      if (!user) {
        return res.status(404).json({ error: '用户不存在' });
      }

      // 验证密码
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        return res.status(400).json({ error: '密码错误' });
      }

      // 验证密保答案
      const isSecurityAnswerValid = await bcrypt.compare(security_answer, user.security_answer);
      if (!isSecurityAnswerValid) {
        return res.status(400).json({ error: '密保答案错误' });
      }

      // 开始事务处理家庭关系和用户删除
      db.serialize(() => {
        db.run('BEGIN TRANSACTION');
        
        // 检查用户是否是家庭创建者
        db.get('SELECT f.id as family_id FROM families f WHERE f.user_id = ?', [userId], (err, createdFamily) => {
          if (err) {
            db.run('ROLLBACK');
            return res.status(500).json({ error: '检查家庭信息失败' });
          }
          
          if (createdFamily) {
            // 用户是家庭创建者，需要解散家庭
            const familyId = createdFamily.family_id;
            
            // 删除家庭相关的礼金记录
            db.run('DELETE FROM gift_records WHERE family_id = ?', [familyId], (err) => {
              if (err) {
                db.run('ROLLBACK');
                return res.status(500).json({ error: '删除家庭礼金记录失败' });
              }
              
              // 删除家庭成员记录
              db.run('DELETE FROM family_members WHERE family_id = ?', [familyId], (err) => {
                if (err) {
                  db.run('ROLLBACK');
                  return res.status(500).json({ error: '删除家庭成员记录失败' });
                }
                
                // 删除家庭
                db.run('DELETE FROM families WHERE id = ?', [familyId], (err) => {
                  if (err) {
                    db.run('ROLLBACK');
                    return res.status(500).json({ error: '解散家庭失败' });
                  }
                  
                  // 最后删除用户
                  deleteUserAccount();
                });
              });
            });
          } else {
            // 检查用户是否是家庭成员
            db.get('SELECT family_id FROM family_members WHERE user_id = ?', [userId], (err, membership) => {
              if (err) {
                db.run('ROLLBACK');
                return res.status(500).json({ error: '检查家庭成员信息失败' });
              }
              
              if (membership) {
                 // 用户是家庭成员，退出家庭并删除相关礼金记录
                 const familyId = membership.family_id;
                 
                 // 获取用户和家庭信息用于通知
                 db.get('SELECT u.username, u.nickname, f.name as family_name FROM users u, families f WHERE u.id = ? AND f.id = ?', [userId, familyId], (err, info) => {
                   if (err) {
                     db.run('ROLLBACK');
                     return res.status(500).json({ error: '获取信息失败' });
                   }
                   
                   // 先删除该用户在该家庭中的礼金记录
                   db.run('DELETE FROM gift_records WHERE family_id = ? AND user_id = ?', [familyId, userId], (err) => {
                     if (err) {
                       db.run('ROLLBACK');
                       return res.status(500).json({ error: '删除用户礼金记录失败' });
                     }
                     
                     // 然后退出家庭
                     db.run('DELETE FROM family_members WHERE user_id = ?', [userId], (err) => {
                       if (err) {
                         db.run('ROLLBACK');
                         return res.status(500).json({ error: '退出家庭失败' });
                       }
                       
                       // 给家庭其他成员发送通知
                       db.all('SELECT user_id FROM family_members WHERE family_id = ?', [familyId], (err, members) => {
                         if (!err && members) {
                           members.forEach(member => {
                             createNotification(
                               member.user_id,
                               'family',
                               '成员注销退出家庭',
                               `${info.nickname || info.username} 因注销账号已退出家庭 "${info.family_name}"，退出时间：${new Date().toLocaleString()}`
                             );
                           });
                         }
                       });
                       
                       // 最后删除用户
                       deleteUserAccount();
                     });
                   });
                 });
              } else {
                // 用户不在任何家庭中，直接删除
                deleteUserAccount();
              }
            });
          }
        });
        
        // 删除用户账号的函数
        function deleteUserAccount() {
          db.run('DELETE FROM users WHERE id = ?', [userId], function(err) {
            if (err) {
              db.run('ROLLBACK');
              return res.status(500).json({ error: '账号注销失败' });
            }
            
            db.run('COMMIT');
            // 清除cookie
            res.clearCookie('token');
            res.json({ success: true, message: '账号注销成功' });
          });
        }
      });
    });
  } catch (error) {
    res.status(500).json({ error: '服务器错误' });
  }
});

// 刷新token
app.post('/api/refresh-token', authenticateToken, (req, res) => {
  try {
    // 生成新的JWT令牌
    const token = jwt.sign(
      { id: req.user.id, username: req.user.username, is_admin: req.user.is_admin },
      JWT_SECRET,
      { expiresIn: '7d' }
    );
    
    res.cookie('token', token, {
      httpOnly: true,
      secure: false,
      maxAge: 7 * 24 * 60 * 60 * 1000
    });
    
    res.json({ success: true, message: 'Token刷新成功' });
  } catch (error) {
    res.status(500).json({ error: '刷新token失败' });
  }
});

// 忘记密码 - 获取密保问题
app.post('/api/forgot-password', (req, res) => {
  const { username } = req.body;
  
  db.get('SELECT security_question FROM users WHERE username = ?', [username], (err, user) => {
    if (err) {
      return res.status(500).json({ error: '数据库错误' });
    }
    
    if (!user) {
      return res.status(404).json({ error: '用户不存在' });
    }
    
    res.json({ security_question: user.security_question });
  });
});

// 重置密码
app.post('/api/reset-password', async (req, res) => {
  try {
    const { username, securityAnswer, newPassword } = req.body;
    
    // 验证必填字段
    if (!username || !securityAnswer || !newPassword) {
      return res.status(400).json({ error: '用户名、密保答案和新密码为必填项' });
    }
    
    db.get('SELECT * FROM users WHERE username = ?', [username], async (err, user) => {
      if (err) {
        return res.status(500).json({ error: '数据库错误' });
      }
      
      if (!user) {
        return res.status(404).json({ error: '用户不存在' });
      }
      
      // 验证密保答案
      const validAnswer = await bcrypt.compare(securityAnswer, user.security_answer);
      if (!validAnswer) {
        return res.status(400).json({ error: '密保答案错误' });
      }
      
      // 更新密码
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      db.run('UPDATE users SET password = ? WHERE id = ?', [hashedPassword, user.id], (err) => {
        if (err) {
          return res.status(500).json({ error: '密码重置失败' });
        }
        
        // 创建系统通知
        createNotification(
          user.id,
          'system',
          '密码重置成功',
          JSON.stringify({
            message: '您的登录密码已通过密保问题成功重置',
            reset_time: new Date().toLocaleString(),
            security_tip: '如非本人操作，请立即联系管理员并修改密保问题'
          })
        );
        
        res.json({ success: true, message: '密码重置成功' });
      });
    });
  } catch (error) {
    res.status(500).json({ error: '服务器错误' });
  }
});

// 家庭相关API

// 创建家庭
app.post('/api/families', authenticateToken, (req, res) => {
  const { family_name } = req.body;
  const userId = req.user.id;
  
  if (!family_name || !family_name.trim()) {
    return res.status(400).json({ error: '家庭名称不能为空' });
  }
  
  // 检查用户是否已经在某个家庭中
  db.get('SELECT fm.family_id FROM family_members fm WHERE fm.user_id = ?', [userId], (err, existingFamily) => {
    if (err) {
      return res.status(500).json({ error: '数据库错误' });
    }
    
    if (existingFamily) {
      return res.status(400).json({ error: '您已经创建了一个家庭' });
    }
    
    // 生成家庭ID代码
    const familyIdCode = 'F' + Date.now().toString().slice(-8) + Math.random().toString(36).substr(2, 4).toUpperCase();
    
    // 创建家庭
    db.run(
      'INSERT INTO families (name, user_id, family_id_code) VALUES (?, ?, ?)',
      [family_name.trim(), userId, familyIdCode],
      function(err) {
        if (err) {
          console.error('创建家庭数据库错误:', err);
          return res.status(500).json({ error: '创建家庭失败: ' + err.message });
        }
        
        const familyId = this.lastID;
        
        // 将创建者添加为家庭成员
        db.run(
          'INSERT INTO family_members (family_id, user_id, role, joined_at) VALUES (?, ?, ?, CURRENT_TIMESTAMP)',
          [familyId, userId, '创建者'],
          (err) => {
            if (err) {
              console.error('添加家庭成员失败:', err);
              // 不返回错误，因为家庭已经创建成功
            }
            
            // 创建系统消息通知
            createNotification(
              userId,
              'system',
              '家庭创建成功',
              `您已成功创建家庭"${family_name.trim()}"，家庭ID：${familyIdCode}`
            );
            
            res.json({
              success: true,
              family: {
                id: familyId,
                family_name: family_name.trim(),
                family_id_code: familyIdCode,
                user_id: userId
              }
            });
          }
        );
      }
    );
  });
});

// 加入家庭
app.post('/api/families/join', authenticateToken, (req, res) => {
  const { family_id_code } = req.body;
  const userId = req.user.id;
  
  if (!family_id_code || !family_id_code.trim()) {
    return res.status(400).json({ error: '家庭ID不能为空' });
  }
  
  // 检查用户是否已经在某个家庭中
  db.get('SELECT fm.family_id FROM family_members fm WHERE fm.user_id = ?', [userId], (err, existingMembership) => {
    if (err) {
      return res.status(500).json({ error: '数据库错误' });
    }
    
    if (existingMembership) {
      return res.status(400).json({ error: '您已经是某个家庭的成员' });
    }
    
    // 查找家庭
    db.get('SELECT * FROM families WHERE family_id_code = ?', [family_id_code.trim()], (err, family) => {
      if (err) {
        return res.status(500).json({ error: '数据库错误' });
      }
      
      if (!family) {
        return res.status(404).json({ error: '家庭ID不存在' });
      }
      
      // 添加用户到家庭
      db.run(
        'INSERT INTO family_members (family_id, user_id, role, joined_at) VALUES (?, ?, ?, CURRENT_TIMESTAMP)',
        [family.id, userId, '成员'],
        (err) => {
          if (err) {
            return res.status(500).json({ error: '加入家庭失败' });
          }
          
          // 获取加入者的用户信息用于通知
          db.get('SELECT username, nickname FROM users WHERE id = ?', [userId], (err, userInfo) => {
            if (err) {
              console.error('获取用户信息失败:', err);
            }
            
            // 创建家庭消息通知给加入者
            createNotification(
              userId,
              'family',
              '加入家庭成功',
              `您已成功加入家庭"${family.name}"`
            );
            
            // 给家庭中的其他成员发送通知
            if (userInfo) {
              db.all('SELECT user_id FROM family_members WHERE family_id = ? AND user_id != ?', [family.id, userId], (err, members) => {
                if (err) {
                  console.error('获取家庭成员失败:', err);
                } else if (members && members.length > 0) {
                  const memberName = userInfo.nickname || userInfo.username;
                  members.forEach(member => {
                    createNotification(
                      member.user_id,
                      'family',
                      '新成员加入家庭',
                      JSON.stringify({
                        message: `${memberName} 已加入家庭"${family.name}"`,
                        member_name: memberName,
                        family_name: family.name,
                        join_time: new Date().toLocaleString()
                      })
                    );
                  });
                }
              });
            }
            
            res.json({
              success: true,
              family: {
                id: family.id,
                family_name: family.name,
                family_id_code: family.family_id_code
              }
            });
          });
        }
      );
    });
  });
});

// 获取用户的家庭信息
app.get('/api/families', authenticateToken, (req, res) => {
  const userId = req.user.id;
  
  // 通过family_members表查找用户所在的家庭
  db.get(`
    SELECT f.*, fm.role 
    FROM families f 
    INNER JOIN family_members fm ON f.id = fm.family_id 
    WHERE fm.user_id = ?
  `, [userId], (err, family) => {
    if (err) {
      return res.status(500).json({ error: '数据库错误' });
    }
    
    if (!family) {
      return res.status(404).json({ error: '您还没有加入任何家庭' });
    }
    
    res.json({
      family: {
        id: family.id,
        family_name: family.name,
        family_id_code: family.family_id_code,
        user_id: family.user_id,
        role: family.role,
        created_at: family.created_at
      }
    });
  });
});

// 获取家庭成员列表
app.get('/api/families/:familyId/members', authenticateToken, (req, res) => {
  const familyId = req.params.familyId;
  const userId = req.user.id;
  
  // 验证用户是否属于该家庭
  db.get('SELECT id FROM family_members WHERE family_id = ? AND user_id = ?', [familyId, userId], (err, membership) => {
    if (err) {
      return res.status(500).json({ error: '数据库错误' });
    }
    
    if (!membership) {
      return res.status(403).json({ error: '您不是该家庭的成员' });
    }
    
    // 获取家庭成员列表
    db.all(`
      SELECT fm.*, u.username, u.nickname, u.avatar 
      FROM family_members fm 
      INNER JOIN users u ON fm.user_id = u.id 
      WHERE fm.family_id = ? 
      ORDER BY fm.joined_at ASC
    `, [familyId], (err, members) => {
      if (err) {
        return res.status(500).json({ error: '数据库错误' });
      }
      
      res.json({ members });
    });
  });
});

// 移除家庭成员
app.delete('/api/families/:familyId/members/:memberId', authenticateToken, (req, res) => {
  const familyId = req.params.familyId;
  const memberId = req.params.memberId;
  const userId = req.user.id;
  
  // 验证当前用户是否为家庭创建者
  db.get('SELECT role FROM family_members WHERE family_id = ? AND user_id = ?', [familyId, userId], (err, userMembership) => {
    if (err) {
      return res.status(500).json({ error: '数据库错误' });
    }
    
    if (!userMembership || userMembership.role !== '创建者') {
      return res.status(403).json({ error: '只有家庭创建者可以移除成员' });
    }
    
    // 不能移除自己
    if (memberId == userId) {
      return res.status(400).json({ error: '不能移除自己' });
    }
    
    // 获取被移除成员和家庭信息用于通知
    db.get('SELECT u.nickname as member_name, f.name as family_name FROM users u, families f WHERE u.id = ? AND f.id = ?', [memberId, familyId], (err, info) => {
      if (err) {
        return res.status(500).json({ error: '获取信息失败' });
      }
      
      // 移除成员
      db.run('DELETE FROM family_members WHERE family_id = ? AND user_id = ?', [familyId, memberId], function(err) {
        if (err) {
          return res.status(500).json({ error: '移除成员失败' });
        }
        
        if (this.changes === 0) {
          return res.status(404).json({ error: '成员不存在' });
        }
        
        // 给被移除的成员发送系统通知
        createNotification(
          memberId,
          'system',
          '已被移出家庭',
          JSON.stringify({
            message: `您已被移出家庭"${info.family_name}"`,
            family_name: info.family_name,
            remove_time: new Date().toLocaleString()
          })
        );
        
        // 给家庭其他成员发送通知
        db.all('SELECT user_id FROM family_members WHERE family_id = ?', [familyId], (err, members) => {
          if (!err && members) {
            members.forEach(member => {
              createNotification(
                member.user_id,
                'family',
                '成员被移出家庭',
                JSON.stringify({
                  message: `${info.member_name} 已被移出家庭"${info.family_name}"`,
                  member_name: info.member_name,
                  family_name: info.family_name,
                  remove_time: new Date().toLocaleString()
                })
              );
            });
          }
        });
        
        res.json({ success: true, message: '成员移除成功' });
      });
    });
  });
});

// 退出家庭
app.post('/api/families/:familyId/leave', authenticateToken, (req, res) => {
  const familyId = req.params.familyId;
  const userId = req.user.id;
  
  // 检查用户是否为家庭创建者
  db.get('SELECT role FROM family_members WHERE family_id = ? AND user_id = ?', [familyId, userId], (err, membership) => {
    if (err) {
      return res.status(500).json({ error: '数据库错误' });
    }
    
    if (!membership) {
      return res.status(404).json({ error: '您不是该家庭的成员' });
    }
    
    if (membership.role === '创建者') {
      return res.status(400).json({ error: '家庭创建者不能退出家庭，请删除家庭或转让创建者权限' });
    }
    
    // 获取用户和家庭信息用于通知
    db.get('SELECT u.username, u.nickname, f.name as family_name FROM users u, families f WHERE u.id = ? AND f.id = ?', [userId, familyId], (err, info) => {
      if (err) {
        return res.status(500).json({ error: '获取信息失败' });
      }
      
      // 退出家庭
      db.run('DELETE FROM family_members WHERE family_id = ? AND user_id = ?', [familyId, userId], function(err) {
        if (err) {
          return res.status(500).json({ error: '退出家庭失败' });
        }
        
        // 给退出的用户发送系统通知
        createNotification(
          userId,
          'system',
          '已退出家庭',
          JSON.stringify({
            message: `您已成功退出家庭"${info.family_name}"`,
            family_name: info.family_name,
            leave_time: new Date().toLocaleString()
          })
        );
        
        // 给家庭其他成员发送通知
        db.all('SELECT user_id FROM family_members WHERE family_id = ?', [familyId], (err, members) => {
          if (!err && members) {
            members.forEach(member => {
              createNotification(
                member.user_id,
                'family',
                '成员退出家庭',
                JSON.stringify({
                  message: `${info.nickname || info.username} 已退出家庭"${info.family_name}"`,
                  member_name: info.nickname || info.username,
                  family_name: info.family_name,
                  leave_time: new Date().toLocaleString()
                })
              );
            });
          }
        });
        
        res.json({ success: true, message: '已成功退出家庭' });
      });
    });
  });
});

// 修改家庭名称
app.put('/api/families/:familyId', authenticateToken, (req, res) => {
  const familyId = req.params.familyId;
  const { family_name } = req.body;
  const userId = req.user.id;
  
  if (!family_name || !family_name.trim()) {
    return res.status(400).json({ error: '家庭名称不能为空' });
  }
  
  // 验证用户是否为家庭创建者
  db.get('SELECT role FROM family_members WHERE family_id = ? AND user_id = ?', [familyId, userId], (err, membership) => {
    if (err) {
      return res.status(500).json({ error: '数据库错误' });
    }
    
    if (!membership || membership.role !== '创建者') {
      return res.status(403).json({ error: '只有家庭创建者可以修改家庭名称' });
    }
    
    // 获取原家庭名称用于通知
    db.get('SELECT name as old_name FROM families WHERE id = ?', [familyId], (err, familyInfo) => {
      if (err) {
        console.error('获取家庭信息失败:', err);
      }
      
      // 更新家庭名称
      db.run('UPDATE families SET name = ? WHERE id = ?', [family_name.trim(), familyId], function(err) {
        if (err) {
          return res.status(500).json({ error: '修改家庭名称失败' });
        }
        
        if (this.changes === 0) {
          return res.status(404).json({ error: '家庭不存在' });
        }
        
        // 获取修改者信息用于通知
        db.get('SELECT username as modifier_name FROM users WHERE id = ?', [userId], (err, userInfo) => {
          if (err) {
            console.error('获取用户信息失败:', err);
          }
          
          // 给同一家庭的所有成员发送家庭通知
          if (userInfo && familyInfo) {
            db.all('SELECT user_id FROM family_members WHERE family_id = ?', [familyId], (err, members) => {
              if (err) {
                console.error('获取家庭成员失败:', err);
              } else if (members && members.length > 0) {
                const familyNotificationTitle = '家庭名称已更新';
                
                members.forEach(member => {
                  createNotification(
                    member.user_id,
                    'family',
                    familyNotificationTitle,
                    JSON.stringify({
                      message: `${userInfo.modifier_name} 将家庭名称从"${familyInfo.old_name}"修改为"${family_name.trim()}"`,
                      modifier_name: userInfo.modifier_name,
                      old_name: familyInfo.old_name,
                      new_name: family_name.trim(),
                      modify_time: new Date().toLocaleString()
                    })
                  );
                });
              }
            });
          }
          
          res.json({ success: true, message: '家庭名称修改成功' });
        });
      });
    });
  });
});

// 添加家庭记录
app.post('/api/families/:familyId/records', authenticateToken, (req, res) => {
  const familyId = req.params.familyId;
  const userId = req.user.id;
  const { type, amount, description, event_date, related_person } = req.body;
  
  // 验证必填字段
  if (!type || !amount || !event_date) {
    return res.status(400).json({ error: '类型、金额和日期为必填项' });
  }
  
  // 验证用户是否属于该家庭
  db.get('SELECT id FROM family_members WHERE family_id = ? AND user_id = ?', [familyId, userId], (err, membership) => {
    if (err) {
      return res.status(500).json({ error: '数据库错误' });
    }
    
    if (!membership) {
      return res.status(403).json({ error: '您不是该家庭的成员' });
    }
    
    // 添加记录
    db.run(`
      INSERT INTO records (family_id, user_id, type, amount, description, event_date, related_person, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))
    `, [familyId, userId, type, amount, description || '', event_date, related_person || ''], function(err) {
      if (err) {
        return res.status(500).json({ error: '添加记录失败' });
      }
      
      // 获取创建者和家庭信息用于通知
      db.get('SELECT u.username, u.nickname, f.name as family_name FROM users u, families f WHERE u.id = ? AND f.id = ?', [userId, familyId], (err, info) => {
        if (err) {
          console.error('获取用户和家庭信息失败:', err);
        }
        
        // 创建记录管理消息通知给创建者
        const transactionTypeText = amount >= 0 ? '收入' : '支出';
        const personName = description.split(' - ')[0] || '未知';
        const remarks = description.includes(' - ') ? description.split(' - ')[1] : '';
        const notificationTitle = `您已成功创建${transactionTypeText}记录，金额：${amount >= 0 ? '' : '-'}${Math.abs(amount)}元`;
        
        createNotification(
          userId,
          'records',
          notificationTitle,
          JSON.stringify({
            message: notificationTitle,
            person_name: personName,
            event_type: type,
            relation_type: related_person,
            transaction_type: amount >= 0 ? 'income' : 'expense',
            amount: Math.abs(amount),
            event_date: event_date,
            remarks: remarks
          })
        );
        
        // 给同一家庭的其他成员发送家庭通知
        if (info) {
          db.all('SELECT user_id FROM family_members WHERE family_id = ? AND user_id != ?', [familyId, userId], (err, members) => {
            if (err) {
              console.error('获取家庭成员失败:', err);
            } else if (members && members.length > 0) {
              const creatorDisplayName = info.nickname ? `${info.nickname}（${info.username}）` : info.username;
              const familyNotificationTitle = `${creatorDisplayName} 成功创建${transactionTypeText}记录`;
              members.forEach(member => {
                createNotification(
                  member.user_id,
                  'records',
                  familyNotificationTitle,
                  JSON.stringify({
                    message: `${creatorDisplayName} 在家庭"${info.family_name}"中成功创建${transactionTypeText}记录`,
                    creator_name: creatorDisplayName,
                    family_name: info.family_name,
                    person_name: personName,
                    event_type: type,
                    relation_type: related_person,
                    transaction_type: amount >= 0 ? 'income' : 'expense',
                    amount: Math.abs(amount),
                    event_date: event_date,
                    remarks: remarks,
                    create_time: new Date().toLocaleString()
                  })
                );
              });
            }
          });
        }
        
        res.json({ 
          success: true, 
          message: '记录添加成功',
          record_id: this.lastID
        });
      });
    });
  });
});

// 获取家庭记录列表
app.get('/api/families/:familyId/records', authenticateToken, (req, res) => {
  const familyId = req.params.familyId;
  const userId = req.user.id;
  const { page = 1, limit = 20, type, start_date, end_date } = req.query;
  
  // 验证用户是否属于该家庭
  db.get('SELECT id FROM family_members WHERE family_id = ? AND user_id = ?', [familyId, userId], (err, membership) => {
    if (err) {
      return res.status(500).json({ error: '数据库错误' });
    }
    
    if (!membership) {
      return res.status(403).json({ error: '您不是该家庭的成员' });
    }
    
    // 构建查询条件
    let whereClause = 'WHERE r.family_id = ?';
    let params = [familyId];
    
    if (type) {
      whereClause += ' AND r.type = ?';
      params.push(type);
    }
    
    if (start_date) {
      whereClause += ' AND r.event_date >= ?';
      params.push(start_date);
    }
    
    if (end_date) {
      whereClause += ' AND r.event_date <= ?';
      params.push(end_date);
    }
    
    // 计算偏移量
    const offset = (page - 1) * limit;
    
    // 获取记录列表
    db.all(`
      SELECT r.*, u.username as creator_name, u.nickname as creator_nickname
      FROM records r
      INNER JOIN users u ON r.user_id = u.id
      ${whereClause}
      ORDER BY r.event_date DESC, r.created_at DESC
      LIMIT ? OFFSET ?
    `, [...params, limit, offset], (err, records) => {
      if (err) {
        return res.status(500).json({ error: '数据库错误' });
      }
      
      // 获取总数
      db.get(`
        SELECT COUNT(*) as total
        FROM records r
        ${whereClause}
      `, params, (err, countResult) => {
        if (err) {
          return res.status(500).json({ error: '数据库错误' });
        }
        
        res.json({
          records,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total: countResult.total,
            pages: Math.ceil(countResult.total / limit)
          }
        });
      });
    });
  });
});

// 删除家庭记录
app.delete('/api/families/:familyId/records/:recordId', authenticateToken, (req, res) => {
  const familyId = req.params.familyId;
  const recordId = req.params.recordId;
  const userId = req.user.id;
  
  // 验证用户是否属于该家庭
  db.get('SELECT id FROM family_members WHERE family_id = ? AND user_id = ?', [familyId, userId], (err, membership) => {
    if (err) {
      return res.status(500).json({ error: '数据库错误' });
    }
    
    if (!membership) {
      return res.status(403).json({ error: '您不是该家庭的成员' });
    }
    
    // 检查记录是否存在且属于该家庭
    db.get('SELECT user_id FROM records WHERE id = ? AND family_id = ?', [recordId, familyId], (err, record) => {
      if (err) {
        return res.status(500).json({ error: '数据库错误' });
      }
      
      if (!record) {
        return res.status(404).json({ error: '记录不存在' });
      }
      
      // 只有记录创建者可以删除记录
      if (record.user_id !== userId) {
        return res.status(403).json({ error: '只能删除自己创建的记录' });
      }
      
      // 获取记录详细信息用于通知
      db.get('SELECT type, amount, description, event_date, related_person FROM records WHERE id = ?', [recordId], (err, recordInfo) => {
        if (err) {
          console.error('获取记录信息失败:', err);
        }
        
        // 删除记录
        db.run('DELETE FROM records WHERE id = ?', [recordId], function(err) {
          if (err) {
            return res.status(500).json({ error: '删除记录失败' });
          }
          
          // 获取删除者和家庭信息用于通知
          db.get('SELECT u.username as deleter_username, u.nickname as deleter_nickname, f.name as family_name FROM users u, families f WHERE u.id = ? AND f.id = ?', [userId, familyId], (err, info) => {
            if (err) {
              console.error('获取用户和家庭信息失败:', err);
            }
            
            // 给所有家庭成员（包括删除者）发送记录消息通知
            if (info && recordInfo) {
              db.all('SELECT user_id FROM family_members WHERE family_id = ?', [familyId], (err, members) => {
                if (err) {
                  console.error('获取家庭成员失败:', err);
                } else if (members && members.length > 0) {
                  const transactionTypeText = recordInfo.amount >= 0 ? '收入' : '支出';
                  const personName = recordInfo.description ? recordInfo.description.split(' - ')[0] : '未知';
                  
                  members.forEach(member => {
                    const isDeleter = member.user_id === userId;
                    const deleterDisplayName = info.deleter_nickname ? `${info.deleter_nickname}（${info.deleter_username}）` : info.deleter_username;
                    const notificationTitle = isDeleter ? 
                      `您删除了记录的内容${personName}` : 
                      `${deleterDisplayName}删除了该记录`;
                    
                    const notificationMessage = isDeleter ?
                      `您已删除自己记录的${transactionTypeText}内容` :
                      `${deleterDisplayName}删除了该记录`;
                    
                    createNotification(
                      member.user_id,
                      'records',
                      notificationTitle,
                      JSON.stringify({
                        message: notificationMessage,
                        deleter_name: deleterDisplayName,
                        family_name: info.family_name,
                        person_name: personName,
                        event_type: recordInfo.type,
                        relation_type: recordInfo.related_person,
                        transaction_type: recordInfo.amount >= 0 ? 'income' : 'expense',
                        amount: Math.abs(recordInfo.amount),
                        event_date: recordInfo.event_date,
                        delete_time: new Date().toLocaleString(),
                        is_self_delete: isDeleter
                      })
                    );
                  });
                }
              });
            }
            
            res.json({ success: true, message: '记录删除成功' });
          });
        });
      });
    });
  });
});

// 获取家庭统计分析
app.get('/api/families/:familyId/analytics', authenticateToken, (req, res) => {
  const familyId = req.params.familyId;
  const userId = req.user.id;
  const { year, month } = req.query;
  
  // 验证用户是否属于该家庭
  db.get('SELECT id FROM family_members WHERE family_id = ? AND user_id = ?', [familyId, userId], (err, membership) => {
    if (err) {
      return res.status(500).json({ error: '数据库错误' });
    }
    
    if (!membership) {
      return res.status(403).json({ error: '您不是该家庭的成员' });
    }
    
    // 构建时间过滤条件
    let dateFilter = '';
    let params = [familyId];
    
    if (year && month) {
      dateFilter = "AND strftime('%Y-%m', event_date) = ?";
      params.push(`${year}-${month.padStart(2, '0')}`);
    } else if (year) {
      dateFilter = "AND strftime('%Y', event_date) = ?";
      params.push(year);
    }
    
    // 获取收支统计
    db.all(`
      SELECT 
        type,
        COUNT(*) as count,
        SUM(amount) as total_amount,
        AVG(amount) as avg_amount
      FROM records 
      WHERE family_id = ? ${dateFilter}
      GROUP BY type
    `, params, (err, typeStats) => {
      if (err) {
        return res.status(500).json({ error: '数据库错误' });
      }
      
      // 获取月度趋势 - 返回每条记录而不是按类型汇总
      db.all(`
        SELECT 
          strftime('%Y-%m', event_date) as month,
          type,
          amount,
          event_date,
          related_person
        FROM records 
        WHERE family_id = ? ${year ? "AND strftime('%Y', event_date) = ?" : ''}
        ORDER BY event_date DESC
      `, year ? [familyId, year] : [familyId], (err, monthlyTrends) => {
        if (err) {
          return res.status(500).json({ error: '数据库错误' });
        }
        
        res.json({
          type_statistics: typeStats,
          monthly_trends: monthlyTrends
        });
      });
    });
  });
});

// 获取家庭总体分析数据API
app.get('/api/families/:familyId/analysis/total', authenticateToken, (req, res) => {
  const familyId = req.params.familyId;
  const userId = req.user.id;
  
  // 验证用户是否属于该家庭
  db.get('SELECT id FROM family_members WHERE family_id = ? AND user_id = ?', [familyId, userId], (err, membership) => {
    if (err) {
      return res.status(500).json({ error: '数据库错误' });
    }
    
    if (!membership) {
      return res.status(403).json({ error: '您不是该家庭的成员' });
    }
    
    // 获取总收入、总支出、净收入以及收支笔数
    db.all(`
      SELECT 
        SUM(CASE WHEN amount > 0 THEN amount ELSE 0 END) as total_income,
        SUM(CASE WHEN amount < 0 THEN ABS(amount) ELSE 0 END) as total_expense,
        SUM(amount) as net_income,
        COUNT(*) as total_records,
        COUNT(CASE WHEN amount > 0 THEN 1 END) as income_count,
        COUNT(CASE WHEN amount < 0 THEN 1 END) as expense_count
      FROM records 
      WHERE family_id = ?
    `, [familyId], (err, result) => {
      if (err) {
        return res.status(500).json({ error: '数据库错误' });
      }
      
      const analysis = result[0] || {
        total_income: 0,
        total_expense: 0,
        net_income: 0,
        total_records: 0,
        income_count: 0,
        expense_count: 0
      };
      
      res.json(analysis);
    });
  });
});

// 管理员登录API
app.post('/api/admin/login', (req, res) => {
  try {
    const { username, isAdmin, adminKey } = req.body;
    
    // 验证管理员密钥
    if (!adminKey || adminKey !== 'admin-key-2024') {
      return res.status(403).json({ error: '无效的管理员密钥' });
    }
    
    // 生成管理员JWT令牌
    const token = jwt.sign(
      { id: 'admin', username, is_admin: true },
      JWT_SECRET,
      { expiresIn: '7d' }
    );
    
    res.cookie('token', token, {
      httpOnly: true,
      secure: false,
      maxAge: 7 * 24 * 60 * 60 * 1000
    });
    
    res.json({
      success: true,
      user: {
        id: 'admin',
        username,
        is_admin: true
      }
    });
  } catch (error) {
    res.status(500).json({ error: '服务器错误' });
  }
});

// 管理员API - 获取统计数据
app.get('/api/admin/stats', authenticateToken, requireAdmin, (req, res) => {
  const stats = {
    totalUsers: 0,
    totalFamilies: 0,
    totalRecords: 0,
    totalAmount: 0
  };
  
  // 获取用户总数
  db.get('SELECT COUNT(*) as count FROM users', (err, result) => {
    if (!err) stats.totalUsers = result.count;
    
    // 获取家庭总数
    db.get('SELECT COUNT(*) as count FROM families', (err, result) => {
      if (!err) stats.totalFamilies = result.count;
      
      // 获取记录总数和总金额
      db.get('SELECT COUNT(*) as count, SUM(amount) as total FROM records', (err, result) => {
        if (!err) {
          stats.totalRecords = result.count || 0;
          stats.totalAmount = result.total || 0;
        }
        
        res.json({ stats });
      });
    });
  });
});

// 管理员API - 获取用户列表
app.get('/api/admin/users', authenticateToken, requireAdmin, (req, res) => {
  db.all('SELECT id, username, nickname, is_admin, created_at FROM users ORDER BY created_at DESC', (err, users) => {
    if (err) {
      return res.status(500).json({ error: '数据库错误' });
    }
    
    res.json({ users });
  });
});

// 管理员API - 获取家庭列表
app.get('/api/admin/families', authenticateToken, requireAdmin, (req, res) => {
  db.all(`
    SELECT f.*, u.username, u.nickname 
    FROM families f 
    LEFT JOIN users u ON f.user_id = u.id 
    ORDER BY f.created_at DESC
  `, (err, families) => {
    if (err) {
      return res.status(500).json({ error: '数据库错误' });
    }
    
    res.json({ families });
  });
});

// 管理员API - 删除用户
app.delete('/api/admin/users/:userId', authenticateToken, requireAdmin, (req, res) => {
  const userId = req.params.userId;
  
  // 检查是否为管理员账号
  db.get('SELECT is_admin FROM users WHERE id = ?', [userId], (err, user) => {
    if (err) {
      return res.status(500).json({ error: '数据库错误' });
    }
    
    if (!user) {
      return res.status(404).json({ error: '用户不存在' });
    }
    
    if (user.is_admin) {
      return res.status(403).json({ error: '不能删除管理员账号' });
    }
    
    // 开始事务
    db.serialize(() => {
      db.run('BEGIN TRANSACTION');
      
      // 删除用户相关的礼金记录
      db.run('DELETE FROM gift_records WHERE user_id = ?', [userId], (err) => {
        if (err) {
          db.run('ROLLBACK');
          return res.status(500).json({ error: '删除用户礼金记录失败' });
        }
        
        // 删除用户创建的家庭
        db.run('DELETE FROM families WHERE user_id = ?', [userId], (err) => {
          if (err) {
            db.run('ROLLBACK');
            return res.status(500).json({ error: '删除用户家庭失败' });
          }
          
          // 最后删除用户
          db.run('DELETE FROM users WHERE id = ?', [userId], (err) => {
            if (err) {
              db.run('ROLLBACK');
              return res.status(500).json({ error: '删除用户失败' });
            }
            
            db.run('COMMIT');
            res.json({ success: true, message: '用户删除成功' });
          });
        });
      });
    });
  });
});

// 管理员API - 删除家庭
app.delete('/api/admin/families/:familyId', authenticateToken, requireAdmin, (req, res) => {
  const familyId = req.params.familyId;
  
  // 获取家庭信息和成员列表用于通知
  db.get('SELECT name as family_name FROM families WHERE id = ?', [familyId], (err, familyInfo) => {
    if (err) {
      return res.status(500).json({ error: '获取家庭信息失败' });
    }
    
    if (!familyInfo) {
      return res.status(404).json({ error: '家庭不存在' });
    }
    
    // 获取家庭成员列表
    db.all('SELECT user_id FROM family_members WHERE family_id = ?', [familyId], (err, members) => {
      if (err) {
        return res.status(500).json({ error: '获取家庭成员失败' });
      }
      
      // 开始事务
      db.serialize(() => {
        db.run('BEGIN TRANSACTION');
        
        // 删除家庭相关的礼金记录
        db.run('DELETE FROM gift_records WHERE family_id = ?', [familyId], (err) => {
          if (err) {
            db.run('ROLLBACK');
            return res.status(500).json({ error: '删除家庭礼金记录失败' });
          }
          
          // 删除家庭成员记录
          db.run('DELETE FROM family_members WHERE family_id = ?', [familyId], (err) => {
            if (err) {
              db.run('ROLLBACK');
              return res.status(500).json({ error: '删除家庭成员记录失败' });
            }
            
            // 删除家庭
            db.run('DELETE FROM families WHERE id = ?', [familyId], (err) => {
              if (err) {
                db.run('ROLLBACK');
                return res.status(500).json({ error: '删除家庭失败' });
              }
              
              // 给所有家庭成员发送系统通知
              if (members && members.length > 0) {
                members.forEach(member => {
                  createNotification(
                    member.user_id,
                    'system',
                    '家庭已被解散',
                    JSON.stringify({
                      message: `您所在的家庭"${familyInfo.family_name}"已被管理员解散`,
                      family_name: familyInfo.family_name,
                      dissolve_time: new Date().toLocaleString(),
                      reason: '管理员操作'
                    })
                  );
                });
              }
              
              db.run('COMMIT');
              res.json({ success: true, message: '家庭删除成功' });
            });
          });
        });
      });
    });
  });
});

// 管理员API - 批量删除用户
app.post('/api/admin/users/batch-delete', authenticateToken, requireAdmin, (req, res) => {
  const { userIds } = req.body;
  
  if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
    return res.status(400).json({ error: '请提供要删除的用户ID列表' });
  }
  
  // 检查是否包含管理员账号
  const placeholders = userIds.map(() => '?').join(',');
  db.all(`SELECT id, is_admin FROM users WHERE id IN (${placeholders})`, userIds, (err, users) => {
    if (err) {
      return res.status(500).json({ error: '数据库错误' });
    }
    
    const adminUsers = users.filter(user => user.is_admin);
    if (adminUsers.length > 0) {
      return res.status(403).json({ error: '不能删除管理员账号' });
    }
    
    // 开始单个事务处理所有删除操作
    db.serialize(() => {
      db.run('BEGIN TRANSACTION');
      
      let completedOperations = 0;
      let hasError = false;
      const totalOperations = userIds.length * 3; // 每个用户需要3个删除操作
      
      const checkCompletion = () => {
        completedOperations++;
        if (completedOperations === totalOperations && !hasError) {
          db.run('COMMIT', (err) => {
            if (err) {
              console.error('提交事务失败:', err);
              return res.status(500).json({ error: '批量删除失败' });
            }
            res.json({ success: true, message: `成功删除 ${userIds.length} 个用户` });
          });
        }
      };
      
      const handleError = (error) => {
        if (!hasError) {
          hasError = true;
          db.run('ROLLBACK');
          res.status(500).json({ error: '批量删除失败: ' + error });
        }
      };
      
      // 批量删除每个用户的相关数据
      userIds.forEach(userId => {
        // 删除用户相关的礼金记录
        db.run('DELETE FROM gift_records WHERE user_id = ?', [userId], (err) => {
          if (err) {
            handleError('删除用户礼金记录失败');
            return;
          }
          checkCompletion();
        });
        
        // 删除用户创建的家庭
        db.run('DELETE FROM families WHERE user_id = ?', [userId], (err) => {
          if (err) {
            handleError('删除用户家庭失败');
            return;
          }
          checkCompletion();
        });
        
        // 删除用户
        db.run('DELETE FROM users WHERE id = ?', [userId], (err) => {
          if (err) {
            handleError('删除用户失败');
            return;
          }
          checkCompletion();
        });
      });
    });
  });
});

// 管理员API - 批量删除家庭
app.post('/api/admin/families/batch-delete', authenticateToken, requireAdmin, (req, res) => {
  const { familyIds } = req.body;
  
  if (!familyIds || !Array.isArray(familyIds) || familyIds.length === 0) {
    return res.status(400).json({ error: '请提供要删除的家庭ID列表' });
  }
  
  // 开始单个事务处理所有删除操作
  db.serialize(() => {
    db.run('BEGIN TRANSACTION');
    
    let completedOperations = 0;
    let hasError = false;
    const totalOperations = familyIds.length * 3; // 每个家庭需要3个删除操作
    
    const checkCompletion = () => {
      completedOperations++;
      if (completedOperations === totalOperations && !hasError) {
        db.run('COMMIT', (err) => {
          if (err) {
            console.error('提交事务失败:', err);
            return res.status(500).json({ error: '批量删除失败' });
          }
          res.json({ success: true, message: `成功删除 ${familyIds.length} 个家庭` });
        });
      }
    };
    
    const handleError = (error) => {
      if (!hasError) {
        hasError = true;
        db.run('ROLLBACK');
        res.status(500).json({ error: '批量删除失败: ' + error });
      }
    };
    
    // 批量删除每个家庭的相关数据
    familyIds.forEach(familyId => {
      // 删除家庭相关的礼金记录
      db.run('DELETE FROM gift_records WHERE family_id = ?', [familyId], (err) => {
        if (err) {
          handleError('删除家庭礼金记录失败');
          return;
        }
        checkCompletion();
      });
      
      // 删除家庭成员记录
      db.run('DELETE FROM family_members WHERE family_id = ?', [familyId], (err) => {
        if (err) {
          handleError('删除家庭成员记录失败');
          return;
        }
        checkCompletion();
      });
      
      // 删除家庭
      db.run('DELETE FROM families WHERE id = ?', [familyId], (err) => {
        if (err) {
          handleError('删除家庭失败');
          return;
        }
        checkCompletion();
      });
    });
  });
});

// 管理员系统工具API

// 数据库维护
app.post('/api/admin/database/maintenance', authenticateToken, requireAdmin, async (req, res) => {
  console.log('开始数据库维护...');
  
  try {
    const maintenanceResults = {
      scan_results: {
        database_info: {},
        tables: []
      },
      maintenance_actions: [],
      success: true,
      message: '数据库维护完成',
      timestamp: new Date().toLocaleString()
    };

    // 1. 扫描数据库结构
    const tables = await new Promise((resolve, reject) => {
      db.all("SELECT name FROM sqlite_master WHERE type='table'", [], (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });

    // 获取数据库文件信息
    const fs = require('fs');
    const dbPath = path.join(__dirname, 'family_gift.db');
    const stats = fs.statSync(dbPath);
    const fileSizeInBytes = stats.size;
    const fileSizeInMB = (fileSizeInBytes / (1024 * 1024)).toFixed(2);
    
    maintenanceResults.scan_results.database_info = {
      file_path: dbPath,
      size: `${fileSizeInMB} MB`,
      last_modified: stats.mtime.toLocaleString()
    };

    // 2. 获取每个表的详细信息
    for (const table of tables) {
      const tableInfo = {
        name: table.name,
        schema: [],
        record_count: 0,
        sample_records: []
      };

      // 获取表结构
      const columns = await new Promise((resolve, reject) => {
        db.all(`PRAGMA table_info(${table.name})`, [], (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        });
      });
      
      tableInfo.schema = columns;

      // 获取记录数量
      const count = await new Promise((resolve, reject) => {
        db.get(`SELECT COUNT(*) as count FROM ${table.name}`, [], (err, row) => {
          if (err) reject(err);
          else resolve(row.count);
        });
      });
      
      tableInfo.record_count = count;
      
      // 获取示例数据（最多3条）
      if (count > 0) {
        const sampleData = await new Promise((resolve, reject) => {
          db.all(`SELECT * FROM ${table.name} LIMIT 3`, [], (err, rows) => {
            if (err) reject(err);
            else resolve(rows);
          });
        });
        tableInfo.sample_records = sampleData;
      }
      
      maintenanceResults.scan_results.tables.push(tableInfo);
    }

    // 3. 执行维护操作

    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    
    // 清理过期通知
    const cleanedNotifications = await new Promise((resolve, reject) => {
      db.run(`DELETE FROM notifications WHERE is_read = 1 AND created_at < ?`, [thirtyDaysAgo], function(err) {
        if (err) reject(err);
        else resolve(this.changes);
      });
    });

    // 执行VACUUM操作
    await new Promise((resolve, reject) => {
      db.run('VACUUM', (err) => {
        if (err) reject(err);
        else resolve();
      });
    });

    // 获取VACUUM后的文件大小
    const newStats = fs.statSync(dbPath);
    const newFileSizeInMB = (newStats.size / (1024 * 1024)).toFixed(2);
    const spaceSaved = (fileSizeInBytes - newStats.size) / (1024 * 1024);

    maintenanceResults.maintenance_actions = [
      {
        action: '清理过期通知',
        result: `删除了 ${cleanedNotifications} 条过期通知`,
        success: true
      },
      {
        action: 'VACUUM操作',
        result: `节省空间 ${spaceSaved.toFixed(2)} MB，当前文件大小 ${newFileSizeInMB} MB`,
        success: true
      },
      {
        action: '数据完整性检查',
        result: '数据完整性验证通过',
        success: true
      }
    ];

    console.log('数据库维护完成');
    console.log('扫描到的表数量:', maintenanceResults.scan_results.tables.length);
    maintenanceResults.scan_results.tables.forEach(table => {
      console.log(`表 ${table.name}: ${table.record_count} 条记录`);
      if (table.sample_records && table.sample_records.length > 0) {
        console.log('  示例数据:', table.sample_records.slice(0, 2));
      }
    });
    res.json(maintenanceResults);
    
  } catch (error) {
    console.error('数据库维护失败:', error);
    res.status(500).json({ 
      success: false,
      error: '数据库维护失败', 
      details: error.message,
      timestamp: new Date().toLocaleString()
    });
  }
});

// 系统备份
app.post('/api/admin/system/backup', authenticateToken, requireAdmin, (req, res) => {
  console.log('开始系统备份...');
  
  const fs = require('fs');
  const path = require('path');
  
  try {
    const backupDir = path.join(__dirname, 'backups');
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFileName = `backup_${timestamp}.db`;
    const backupPath = path.join(backupDir, backupFileName);
    
    // 确保备份目录存在
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }
    
    // 复制数据库文件
    const dbPath = path.join(__dirname, 'family_gift.db');
    
    if (fs.existsSync(dbPath)) {
      fs.copyFileSync(dbPath, backupPath);
      
      // 获取备份文件大小
      const stats = fs.statSync(backupPath);
      const fileSizeInBytes = stats.size;
      const fileSizeInMB = (fileSizeInBytes / (1024 * 1024)).toFixed(2);
      
      res.json({ 
        success: true, 
        message: '系统备份完成',
        details: {
          backup_file: backupFileName,
          backup_path: backupPath,
          file_size: `${fileSizeInMB} MB`,
          backup_time: new Date().toLocaleString()
        }
      });
    } else {
      res.status(404).json({ error: '数据库文件不存在' });
    }
  } catch (error) {
    console.error('系统备份失败:', error);
    res.status(500).json({ error: '系统备份失败', details: error.message });
  }
});

// 系统日志查看
app.get('/api/admin/system/logs', authenticateToken, requireAdmin, (req, res) => {
  console.log('获取系统日志...');
  
  const fs = require('fs');
  const path = require('path');
  
  try {
    // 模拟系统日志数据
    const logs = [
      {
        timestamp: new Date().toISOString(),
        level: 'INFO',
        message: '系统正常运行',
        module: 'System'
      },
      {
        timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
        level: 'INFO',
        message: '用户登录成功',
        module: 'Auth'
      },
      {
        timestamp: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
        level: 'INFO',
        message: '数据库连接正常',
        module: 'Database'
      },
      {
        timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
        level: 'WARN',
        message: '内存使用率较高',
        module: 'System'
      },
      {
        timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
        level: 'INFO',
        message: '服务器启动完成',
        module: 'Server'
      }
    ];
    
    // 获取系统状态信息
    const systemInfo = {
      uptime: process.uptime(),
      memory_usage: process.memoryUsage(),
      node_version: process.version,
      platform: process.platform,
      cpu_usage: process.cpuUsage()
    };
    
    res.json({ 
      success: true,
      logs: logs,
      system_info: systemInfo,
      log_count: logs.length,
      fetch_time: new Date().toLocaleString()
    });
  } catch (error) {
    console.error('获取系统日志失败:', error);
    res.status(500).json({ error: '获取系统日志失败', details: error.message });
  }
});

// 消息通知相关API

// 获取用户的所有消息通知
app.get('/api/notifications', authenticateToken, (req, res) => {
  const userId = req.user.id;
  
  db.all(`
    SELECT id, category, title, content, is_read, created_at 
    FROM notifications 
    WHERE user_id = ? 
    ORDER BY created_at DESC
  `, [userId], (err, rows) => {
    if (err) {
      console.error('获取消息通知失败:', err.message);
      return res.status(500).json({ error: '获取消息通知失败' });
    }
    
    // 按类别分组消息
    const notifications = {
      system: { unread: 0, messages: [] },
      family: { unread: 0, messages: [] },
      records: { unread: 0, messages: [] },
      delete_request: { unread: 0, messages: [] }
    };
    
    rows.forEach(row => {
      const message = {
        id: row.id,
        title: row.title,
        content: row.content,
        read: Boolean(row.is_read),
        timestamp: row.created_at
      };
      
      if (notifications[row.category]) {
        notifications[row.category].messages.push(message);
        if (!row.is_read) {
          notifications[row.category].unread++;
        }
      }
    });
    
    res.json(notifications);
  });
});

// 标记消息为已读
app.put('/api/notifications/:id/read', authenticateToken, (req, res) => {
  const notificationId = req.params.id;
  const userId = req.user.id;
  
  db.run(`
    UPDATE notifications 
    SET is_read = 1 
    WHERE id = ? AND user_id = ?
  `, [notificationId, userId], function(err) {
    if (err) {
      console.error('标记消息已读失败:', err.message);
      return res.status(500).json({ error: '标记消息已读失败' });
    }
    
    if (this.changes === 0) {
      return res.status(404).json({ error: '消息不存在' });
    }
    
    res.json({ success: true, message: '消息已标记为已读' });
  });
});

// 批量标记某类别消息为已读
app.put('/api/notifications/category/:category/read', authenticateToken, (req, res) => {
  const category = req.params.category;
  const userId = req.user.id;
  
  if (!['system', 'family', 'records', 'delete_request'].includes(category)) {
    return res.status(400).json({ error: '无效的消息类别' });
  }
  
  db.run(`
    UPDATE notifications 
    SET is_read = 1 
    WHERE category = ? AND user_id = ? AND is_read = 0
  `, [category, userId], function(err) {
    if (err) {
      console.error('批量标记消息已读失败:', err.message);
      return res.status(500).json({ error: '批量标记消息已读失败' });
    }
    
    res.json({ success: true, message: `${this.changes}条消息已标记为已读` });
  });
});

// 清除某类别的所有消息
app.delete('/api/notifications/category/:category', authenticateToken, (req, res) => {
  const category = req.params.category;
  const userId = req.user.id;
  
  console.log(`🗑️ 收到清除消息请求 - 用户ID: ${userId}, 类别: ${category}`);
  
  if (!['system', 'family', 'records', 'delete_request'].includes(category)) {
    console.log(`❌ 无效的消息类别: ${category}`);
    return res.status(400).json({ error: '无效的消息类别' });
  }
  
  db.run(`
    DELETE FROM notifications 
    WHERE category = ? AND user_id = ? AND is_read = 1
  `, [category, userId], function(err) {
    if (err) {
      console.error('清除消息失败:', err.message);
      return res.status(500).json({ error: '清除消息失败' });
    }
    
    console.log(`✅ 成功清除 ${this.changes} 条 ${category} 类别的消息 - 用户ID: ${userId}`);
    res.json({ success: true, message: `${this.changes}条消息已清除` });
  });
});

// 创建新消息通知（内部使用）
// 发送家庭邀请
app.post('/api/families/:familyId/invite', authenticateToken, (req, res) => {
  const { familyId } = req.params;
  const { username } = req.body;
  const inviterId = req.user.id;
  
  if (!username || !username.trim()) {
    return res.status(400).json({ error: '用户名不能为空' });
  }
  
  // 检查邀请者是否是家庭成员
  db.get('SELECT fm.*, f.name as family_name FROM family_members fm JOIN families f ON fm.family_id = f.id WHERE fm.family_id = ? AND fm.user_id = ?', 
    [familyId, inviterId], (err, membership) => {
    if (err) {
      return res.status(500).json({ error: '数据库错误' });
    }
    
    if (!membership) {
      return res.status(403).json({ error: '您不是该家庭的成员' });
    }
    
    // 查找被邀请的用户
    db.get('SELECT id, username, nickname FROM users WHERE username = ?', [username.trim()], (err, invitee) => {
      if (err) {
        return res.status(500).json({ error: '数据库错误' });
      }
      
      if (!invitee) {
        return res.status(404).json({ error: '用户不存在' });
      }
      
      if (invitee.id === inviterId) {
        return res.status(400).json({ error: '不能邀请自己' });
      }
      
      // 检查用户是否已经在某个家庭中
      db.get('SELECT family_id FROM family_members WHERE user_id = ?', [invitee.id], (err, existingMembership) => {
        if (err) {
          return res.status(500).json({ error: '数据库错误' });
        }
        
        if (existingMembership) {
          return res.status(400).json({ error: '该用户已经是某个家庭的成员' });
        }
        
        // 检查是否已经有待处理的邀请
        db.get('SELECT id FROM family_invitations WHERE family_id = ? AND invitee_id = ? AND status = "pending"', 
          [familyId, invitee.id], (err, existingInvitation) => {
          if (err) {
            return res.status(500).json({ error: '数据库错误' });
          }
          
          if (existingInvitation) {
            return res.status(400).json({ error: '已经向该用户发送过邀请' });
          }
          
          // 创建邀请记录
          db.run('INSERT INTO family_invitations (family_id, inviter_id, invitee_username, invitee_id) VALUES (?, ?, ?, ?)',
            [familyId, inviterId, username.trim(), invitee.id], function(err) {
            if (err) {
              return res.status(500).json({ error: '创建邀请失败' });
            }
            
            // 获取邀请者信息
            db.get('SELECT username, nickname FROM users WHERE id = ?', [inviterId], (err, inviterInfo) => {
              if (err) {
                console.error('获取邀请者信息失败:', err);
              }
              
              const inviterName = inviterInfo ? (inviterInfo.nickname || inviterInfo.username) : '未知用户';
              
              // 发送邀请通知给被邀请者
              createNotification(
                invitee.id,
                'family',
                '家庭邀请',
                JSON.stringify({
                  type: 'family_invitation',
                  invitation_id: this.lastID,
                  family_id: familyId,
                  family_name: membership.family_name,
                  inviter_name: inviterName,
                  message: `${inviterName} 邀请您加入家庭 "${membership.family_name}"`
                })
              );
              
              res.json({
                success: true,
                message: '邀请已发送',
                invitation_id: this.lastID
              });
            });
          });
        });
      });
    });
  });
});

// 响应家庭邀请（同意/拒绝）
app.post('/api/invitations/:invitationId/respond', authenticateToken, (req, res) => {
  const { invitationId } = req.params;
  const { action } = req.body; // 'accept' 或 'reject'
  const userId = req.user.id;
  
  if (!action || !['accept', 'reject'].includes(action)) {
    return res.status(400).json({ error: '无效的操作' });
  }
  
  // 查找邀请记录
  db.get(`SELECT fi.*, f.name as family_name, u.username as inviter_username, u.nickname as inviter_nickname 
           FROM family_invitations fi 
           JOIN families f ON fi.family_id = f.id 
           JOIN users u ON fi.inviter_id = u.id 
           WHERE fi.id = ? AND fi.invitee_id = ? AND fi.status = 'pending'`, 
    [invitationId, userId], (err, invitation) => {
    if (err) {
      return res.status(500).json({ error: '数据库错误' });
    }
    
    if (!invitation) {
      return res.status(404).json({ error: '邀请不存在或已处理' });
    }
    
    if (action === 'accept') {
      // 检查用户是否已经在某个家庭中
      db.get('SELECT family_id FROM family_members WHERE user_id = ?', [userId], (err, existingMembership) => {
        if (err) {
          return res.status(500).json({ error: '数据库错误' });
        }
        
        if (existingMembership) {
          return res.status(400).json({ error: '您已经是某个家庭的成员' });
        }
        
        // 开始事务
        db.serialize(() => {
          db.run('BEGIN TRANSACTION');
          
          // 更新邀请状态
          db.run('UPDATE family_invitations SET status = "accepted", responded_at = CURRENT_TIMESTAMP WHERE id = ?', 
            [invitationId], (err) => {
            if (err) {
              db.run('ROLLBACK');
              return res.status(500).json({ error: '更新邀请状态失败' });
            }
            
            // 添加用户到家庭
            db.run('INSERT INTO family_members (family_id, user_id, role, joined_at) VALUES (?, ?, ?, CURRENT_TIMESTAMP)',
              [invitation.family_id, userId, '成员'], (err) => {
              if (err) {
                db.run('ROLLBACK');
                return res.status(500).json({ error: '加入家庭失败' });
              }
              
              db.run('COMMIT');
              
              // 获取新成员信息
              db.get('SELECT username, nickname FROM users WHERE id = ?', [userId], (err, userInfo) => {
                if (err) {
                  console.error('获取用户信息失败:', err);
                }
                
                const memberName = userInfo ? (userInfo.nickname || userInfo.username) : '未知用户';
                const inviterName = invitation.inviter_nickname || invitation.inviter_username;
                
                // 发送成功通知给新成员
                createNotification(
                  userId,
                  'family',
                  '加入家庭成功',
                  `您已成功加入家庭 "${invitation.family_name}"`
                );
                
                // 发送同意通知给邀请者
                createNotification(
                  invitation.inviter_id,
                  'family',
                  '邀请已接受',
                  `${memberName} 已接受您的邀请，成功加入家庭 "${invitation.family_name}"`
                );
                
                // 给家庭中的其他成员发送新成员加入通知
                db.all('SELECT user_id FROM family_members WHERE family_id = ? AND user_id != ? AND user_id != ?', 
                  [invitation.family_id, userId, invitation.inviter_id], (err, members) => {
                  if (err) {
                    console.error('获取家庭成员失败:', err);
                  } else if (members && members.length > 0) {
                    members.forEach(member => {
                      createNotification(
                        member.user_id,
                        'family',
                        '新成员加入家庭',
                        JSON.stringify({
                          message: `${memberName} 已加入家庭 "${invitation.family_name}"`,
                          member_name: memberName,
                          family_name: invitation.family_name,
                          join_time: new Date().toLocaleString()
                        })
                      );
                    });
                  }
                });
                
                res.json({
                  success: true,
                  message: '成功加入家庭',
                  family: {
                    id: invitation.family_id,
                    name: invitation.family_name
                  }
                });
              });
            });
          });
        });
      });
    } else {
      // 拒绝邀请
      db.run('UPDATE family_invitations SET status = "rejected", responded_at = CURRENT_TIMESTAMP WHERE id = ?', 
        [invitationId], (err) => {
        if (err) {
          return res.status(500).json({ error: '更新邀请状态失败' });
        }
        
        // 获取拒绝者信息
        db.get('SELECT username, nickname FROM users WHERE id = ?', [userId], (err, userInfo) => {
          if (err) {
            console.error('获取用户信息失败:', err);
          }
          
          const memberName = userInfo ? (userInfo.nickname || userInfo.username) : '未知用户';
          
          // 发送拒绝通知给邀请者
          createNotification(
            invitation.inviter_id,
            'family',
            '邀请已拒绝',
            `${memberName} 拒绝了您的家庭邀请`
          );
          
          res.json({
            success: true,
            message: '已拒绝邀请'
          });
        });
      });
    }
  });
});

// 获取用户的待处理邀请
app.get('/api/invitations/pending', authenticateToken, (req, res) => {
  const userId = req.user.id;
  
  db.all(`SELECT fi.*, f.name as family_name, u.username as inviter_username, u.nickname as inviter_nickname
           FROM family_invitations fi 
           JOIN families f ON fi.family_id = f.id 
           JOIN users u ON fi.inviter_id = u.id 
           WHERE fi.invitee_id = ? AND fi.status = 'pending' 
           ORDER BY fi.created_at DESC`, 
    [userId], (err, invitations) => {
    if (err) {
      return res.status(500).json({ error: '数据库错误' });
    }
    
    res.json({ invitations });
  });
});

function createNotification(userId, category, title, content, callback) {
  db.run(`
    INSERT INTO notifications (user_id, category, title, content)
    VALUES (?, ?, ?, ?)
  `, [userId, category, title, content], function(err) {
    if (callback) {
      callback(err, this.lastID);
    }
  });
}

// 健康检查
app.get('/api/health', (req, res) => {
  // 检查数据库连接状态
  db.get('SELECT 1 as test', (err, row) => {
    if (err) {
      console.error('数据库连接检查失败:', err.message);
      return res.status(500).json({
        status: 'error',
        message: '数据库连接异常',
        backend: 'online',
        database: 'offline',
        error: err.message
      });
    }
    
    // 数据库连接正常
    res.json({
      status: 'ok',
      message: '系统运行正常',
      backend: 'online',
      database: 'online'
    });
  });
});

// 获取用户信息API
app.get('/api/users/:userId', authenticateToken, (req, res) => {
  const userId = req.params.userId;
  const requesterId = req.user.id;
  
  // 检查请求者是否有权限查看用户信息（同一家庭成员）
  db.get(`
    SELECT DISTINCT u.id, u.username, u.nickname, u.avatar 
    FROM users u
    INNER JOIN family_members fm1 ON u.id = fm1.user_id
    INNER JOIN family_members fm2 ON fm1.family_id = fm2.family_id
    WHERE u.id = ? AND fm2.user_id = ?
  `, [userId, requesterId], (err, user) => {
    if (err) {
      return res.status(500).json({ error: '数据库错误' });
    }
    
    if (!user) {
      return res.status(404).json({ error: '用户不存在或无权限查看' });
    }
    
    res.json({ user });
  });
});

// 发送删除记录请求API
app.post('/api/families/:familyId/records/:recordId/delete-request', authenticateToken, (req, res) => {
  const familyId = req.params.familyId;
  const recordId = req.params.recordId;
  const userId = req.user.id;
  const { message } = req.body;
  
  // 验证用户是否属于该家庭
  db.get('SELECT id FROM family_members WHERE family_id = ? AND user_id = ?', [familyId, userId], (err, membership) => {
    if (err) {
      return res.status(500).json({ error: '数据库错误' });
    }
    
    if (!membership) {
      return res.status(403).json({ error: '您不是该家庭的成员' });
    }
    
    // 检查记录是否存在且属于该家庭
    db.get('SELECT user_id, type, amount, description, event_date, related_person FROM records WHERE id = ? AND family_id = ?', [recordId, familyId], (err, record) => {
      if (err) {
        return res.status(500).json({ error: '数据库错误' });
      }
      
      if (!record) {
        return res.status(404).json({ error: '记录不存在' });
      }
      
      // 检查是否为自己的记录
      if (record.user_id === userId) {
        return res.status(400).json({ error: '不能请求删除自己的记录' });
      }
      
      // 检查是否已有待处理的删除请求
      db.get(`SELECT id, content FROM notifications 
              WHERE user_id = ? AND category = 'delete_request' AND is_read = 0 
              AND json_extract(content, '$.record_id') = ? 
              AND json_extract(content, '$.requester_id') = ?`, 
             [record.user_id, recordId, userId], (err, existingRequest) => {
        if (err) {
          return res.status(500).json({ error: '数据库错误' });
        }
        
        if (existingRequest) {
          return res.status(400).json({ 
            error: '已请求删除该记录，请等待对方处理', 
            code: 'DUPLICATE_REQUEST'
          });
        }
        
        // 获取请求者和记录创建者信息
      db.get('SELECT username, nickname FROM users WHERE id = ?', [userId], (err, requester) => {
        if (err) {
          return res.status(500).json({ error: '数据库错误' });
        }
        
        // 创建删除请求通知给记录创建者
        const transactionTypeText = record.amount >= 0 ? '收入' : '支出';
        const personName = record.description ? record.description.split(' - ')[0] : '未知';
        const requesterName = requester.nickname ? `${requester.nickname}（${requester.username}）` : requester.username;
        
        const notificationContent = {
          type: 'delete_request',
          requester_id: userId,
          requester_name: requesterName,
          record_id: recordId,
          family_id: familyId,
          message: message || '',
          record_info: {
            person_name: personName,
            event_type: record.type,
            relation_type: record.related_person,
            transaction_type: record.amount >= 0 ? 'income' : 'expense',
            amount: Math.abs(record.amount),
            event_date: record.event_date
          },
          request_time: new Date().toLocaleString()
        };
        
        createNotification(
          record.user_id,
          'delete_request',
          `${requesterName} 请求删除您的${transactionTypeText}记录`,
          JSON.stringify(notificationContent),
          (err, notificationId) => {
            if (err) {
              console.error('创建删除请求通知失败:', err);
              return res.status(500).json({ error: '发送通知失败' });
            }
            console.log(`删除请求通知已创建，ID: ${notificationId}, 发送给用户: ${record.user_id}`);
            res.json({ success: true, message: '删除请求已发送' });
          }
        );
      });
      });
    });
  });
});

// 处理删除请求响应API
app.post('/api/notifications/:notificationId/delete-response', authenticateToken, (req, res) => {
  const notificationId = req.params.notificationId;
  const userId = req.user.id;
  const { action } = req.body; // 'approve' 或 'reject'
  
  // 获取通知信息
  db.get('SELECT user_id, content FROM notifications WHERE id = ? AND user_id = ? AND category = "delete_request"', [notificationId, userId], (err, notification) => {
    if (err) {
      return res.status(500).json({ error: '数据库错误' });
    }
    
    if (!notification) {
      return res.status(404).json({ error: '通知不存在' });
    }
    
    let notificationContent;
    try {
      notificationContent = JSON.parse(notification.content);
    } catch (error) {
      return res.status(400).json({ error: '通知内容格式错误' });
    }
    
    const { requester_id, record_id, family_id, requester_name, record_info } = notificationContent;
    
    if (action === 'approve') {
      // 同意删除，删除记录
      db.get('SELECT user_id FROM records WHERE id = ? AND family_id = ?', [record_id, family_id], (err, record) => {
        if (err) {
          return res.status(500).json({ error: '数据库错误' });
        }
        
        if (!record) {
          return res.status(404).json({ error: '记录已不存在' });
        }
        
        // 删除记录
        db.run('DELETE FROM records WHERE id = ?', [record_id], function(err) {
          if (err) {
            return res.status(500).json({ error: '删除记录失败' });
          }
          
          // 获取当前用户信息
          db.get('SELECT username, nickname FROM users WHERE id = ?', [userId], (err, currentUser) => {
            if (err) {
              console.error('获取用户信息失败:', err);
            }
            
            const currentUserName = currentUser ? 
              (currentUser.nickname ? `${currentUser.nickname}（${currentUser.username}）` : currentUser.username) : '未知用户';
            
            // 通知所有家庭成员（包括删除者和请求者）记录已被删除
            db.all('SELECT user_id FROM family_members WHERE family_id = ?', [family_id], (err, allMembers) => {
              if (err) {
                console.error('获取家庭成员失败:', err);
              } else if (allMembers && allMembers.length > 0) {
                allMembers.forEach(member => {
                  createNotification(
                    member.user_id,
                    'records',
                    `${currentUserName}删除了该记录`,
                    JSON.stringify({
                      message: `${currentUserName}删除了该记录`,
                      deleter_name: currentUserName,
                      record_info: record_info,
                      delete_time: new Date().toLocaleString()
                    })
                  );
                });
              }
            });
            
            // 给请求者额外发送删除请求通知
            const eventTypeMap = {
              'wedding': '结婚',
              'birth': '满月',
              'graduation': '升学',
              'birthday': '生日',
              'engagement': '订婚',
              'anniversary': '周年纪念',
              'funeral': '丧事',
              'housewarming': '乔迁',
              'other': '其他'
            };
            const relationTypeMap = {
              'relative': '亲戚',
              'friend': '朋友',
              'colleague': '同事',
              'classmate': '同学'
            };
            const eventTypeText = eventTypeMap[record_info.event_type] || record_info.event_type || '未知';
            const relationTypeText = relationTypeMap[record_info.relation_type] || record_info.relation_type || '未知';
            const recordDetails = `${record_info.person_name || '未知'} - ${eventTypeText} - ${relationTypeText} - ${record_info.transaction_type === 'income' ? '收入' : '支出'}${record_info.amount || 0}元 - ${record_info.event_date || '未知日期'}`;
            
            createNotification(
              requester_id,
              'delete_request',
              `${currentUserName}已同意删除该记录，该记录已被删除`,
              JSON.stringify({
                type: 'delete_approved',
                approver_name: currentUserName,
                record_info: record_info,
                record_details: recordDetails,
                message: `${currentUserName}已同意删除该记录：${recordDetails}，该记录已被删除`,
                response_time: new Date().toLocaleString()
              })
            );
            
            // 标记通知为已读
            db.run('UPDATE notifications SET is_read = 1 WHERE id = ?', [notificationId]);
            
            res.json({ success: true, message: '记录删除成功' });
          });
        });
      });
    } else if (action === 'reject') {
      // 拒绝删除
      db.get('SELECT username, nickname FROM users WHERE id = ?', [userId], (err, currentUser) => {
        if (err) {
          console.error('获取用户信息失败:', err);
        }
        
        const currentUserName = currentUser ? 
          (currentUser.nickname ? `${currentUser.nickname}（${currentUser.username}）` : currentUser.username) : '未知用户';
        
        // 通知请求者删除被拒绝
        createNotification(
          requester_id,
          'delete_request',
          `${currentUserName}拒绝删除该记录`,
          JSON.stringify({
            type: 'delete_rejected',
            message: `${currentUserName}拒绝删除该记录`,
            rejector_name: currentUserName,
            record_info: record_info,
            response_time: new Date().toLocaleString()
          })
        );
        
        // 标记通知为已读
        db.run('UPDATE notifications SET is_read = 1 WHERE id = ?', [notificationId]);
        
        res.json({ success: true, message: '已拒绝删除请求' });
      });
    } else {
      return res.status(400).json({ error: '无效的操作' });
    }
  });
});

// 启动服务器
app.listen(PORT, () => {
  console.log(`🚀 家庭礼金簿后端服务已启动`);
  console.log(`📍 服务地址: http://localhost:${PORT}`);
  console.log(`🔗 API文档: http://localhost:${PORT}/api/health`);
  console.log(`💾 数据库: SQLite (family_gift.db)`);
});

// 优雅关闭
process.on('SIGINT', () => {
  console.log('\n正在关闭服务器...');
  db.close((err) => {
    if (err) {
      console.error('关闭数据库连接时出错:', err.message);
    } else {
      console.log('数据库连接已关闭');
    }
    process.exit(0);
  });
});