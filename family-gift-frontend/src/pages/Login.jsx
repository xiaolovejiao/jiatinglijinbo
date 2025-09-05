import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Alert, AlertDescription } from '../components/ui/alert';
import { Eye, EyeOff, Crown, Shield } from 'lucide-react';
import { useAuth } from '../hooks/useAuth.jsx';

const Login = () => {
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    secondaryKey: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [welcomeMessage, setWelcomeMessage] = useState('');
  const [showSecondaryAuth, setShowSecondaryAuth] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  
  // 内置站主账号信息
  const ADMIN_ACCOUNT = {
    username: '18982733559',
    password: '863807276',
    secondaryKey: 'luo863807276'
  };

  const { login, adminLogin } = useAuth();
  const navigate = useNavigate();

  // 鼠标跟随效果
  useEffect(() => {
    const handleMouseMove = (e) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // 网络状态检测
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    // 监听网络状态变化
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // 定期检测网络连接（通过尝试连接到一个可靠的服务）
    const checkNetworkStatus = async () => {
      try {
        // 使用AbortController来设置超时
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);
        
        const response = await fetch('https://www.baidu.com/', {
          method: 'HEAD',
          mode: 'no-cors',
          cache: 'no-cache',
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        setIsOnline(true);
      } catch (error) {
        // 如果网络请求失败，回退到navigator.onLine
        setIsOnline(navigator.onLine);
      }
    };

    // 每30秒检测一次网络状态
    const interval = setInterval(checkNetworkStatus, 30000);
    
    // 组件挂载时立即检测一次
    checkNetworkStatus();

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(interval);
    };
  }, []);

  // 根据输入状态获取颜色
  const getInputStatusColor = (value) => {
    if (value === ADMIN_ACCOUNT.secondaryKey) {
      return 'green'; // 完全匹配
    } else if (value.startsWith('luo')) {
      return 'blue'; // 以luo开头
    } else {
      return 'red'; // 初始状态或不匹配
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // 检查是否为站主账号
    if (formData.username === ADMIN_ACCOUNT.username && formData.password === ADMIN_ACCOUNT.password) {
      if (!showSecondaryAuth) {
        // 第一步验证通过，显示二次验证
        setShowSecondaryAuth(true);
        setLoading(false);
        return;
      } else {
        // 二次验证
        if (formData.secondaryKey === ADMIN_ACCOUNT.secondaryKey) {
          // 站主登录成功，设置用户状态并跳转到控制台
          const adminUser = {
            id: 'admin',
            username: '站主',
            role: 'admin',
            isAdmin: true
          };
          // 发送请求到后端进行认证
          setLoading(true);
          const result = await adminLogin(adminUser);
          setLoading(false);
          if (result.success) {
            navigate('/console');
          } else {
            setError('管理员登录失败，请重试');
          }
          setLoading(false);
          return;
        } else {
          setError('密钥验证未通过。系统斗胆一问：站主大人今日是否忘了携带那枚至关重要的\'权柄\'？敬请再次赐下。');
          setLoading(false);
          return;
        }
      }
    }

    // 普通用户登录流程
    const result = await login(formData.username, formData.password);

    if (result.success) {
      // 显示站主专属欢迎词
      if (result.data.welcome_message) {
        setWelcomeMessage(result.data.welcome_message);
        setTimeout(() => {
          navigate('/center');
        }, 2000);
      } else {
        // 普通用户跳转到欢迎页面
        navigate('/welcome');
      }
    } else {
      setError(result.error);
    }

    setLoading(false);
  };

  if (welcomeMessage) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <div className="mb-4">
              <Shield className="w-16 h-16 text-blue-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                {welcomeMessage}
              </h2>
              <p className="text-gray-600">正在跳转到管理面板...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div 
      className={`min-h-screen flex items-center justify-center p-4 relative overflow-hidden`}
      style={showSecondaryAuth ? {
        background: `
          radial-gradient(120px circle at ${mousePosition.x}px ${mousePosition.y}px, rgba(255, 255, 255, 0.08), rgba(255, 255, 255, 0.02) 60%, transparent 80%),
          radial-gradient(250px circle at ${mousePosition.x}px ${mousePosition.y}px, rgba(34, 211, 238, 0.04), transparent 70%),
          linear-gradient(135deg, rgb(88 28 135) 0%, rgb(67 56 202) 50%, rgb(15 23 42) 100%)
        `
      } : {
        background: `
          radial-gradient(circle at 20% 80%, rgba(120, 119, 198, 0.3), transparent 50%),
          radial-gradient(circle at 80% 20%, rgba(255, 119, 198, 0.3), transparent 50%),
          radial-gradient(circle at 40% 40%, rgba(120, 219, 255, 0.2), transparent 50%),
          linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)
        `
      }}
    >
      {/* 科技感背景装饰 - 始终显示 */}
      <div className="absolute inset-0 overflow-hidden">
        {/* 动态粒子效果 */}
        <div className="absolute top-10 left-10 w-2 h-2 bg-cyan-400 rounded-full animate-ping" style={{animationDelay: '0s'}}></div>
        <div className="absolute top-20 right-20 w-1 h-1 bg-purple-400 rounded-full animate-ping" style={{animationDelay: '1s'}}></div>
        <div className="absolute bottom-20 left-20 w-1.5 h-1.5 bg-pink-400 rounded-full animate-ping" style={{animationDelay: '2s'}}></div>
        <div className="absolute bottom-10 right-10 w-2 h-2 bg-blue-400 rounded-full animate-ping" style={{animationDelay: '3s'}}></div>
        <div className="absolute top-1/3 left-1/4 w-1 h-1 bg-green-400 rounded-full animate-ping" style={{animationDelay: '4s'}}></div>
        <div className="absolute top-2/3 right-1/4 w-1.5 h-1.5 bg-yellow-400 rounded-full animate-ping" style={{animationDelay: '5s'}}></div>
        
        {/* 浮动几何图形 */}
        <div className="absolute top-1/4 left-1/6 w-20 h-20 border border-cyan-400/30 rotate-45 animate-spin" style={{animationDuration: '15s'}}></div>
        <div className="absolute bottom-1/4 right-1/6 w-16 h-16 border border-purple-400/30 rotate-12 animate-pulse" style={{animationDuration: '3s'}}></div>
        <div className="absolute top-1/2 right-1/3 w-12 h-12 border-2 border-pink-400/40 rounded-full animate-bounce" style={{animationDuration: '4s'}}></div>
        
        {/* 光线效果 */}
        <div className="absolute top-0 left-1/4 w-px h-full bg-gradient-to-b from-transparent via-cyan-400/20 to-transparent animate-pulse" style={{animationDelay: '1s'}}></div>
        <div className="absolute top-0 right-1/3 w-px h-full bg-gradient-to-b from-transparent via-purple-400/20 to-transparent animate-pulse" style={{animationDelay: '2s'}}></div>
        
        {showSecondaryAuth && (
          <>
            {/* 站主模式额外装饰 */}
            <div className="absolute -top-40 -right-40 w-80 h-80 bg-yellow-500/10 rounded-full blur-3xl animate-pulse"></div>
            <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl animate-pulse"></div>
            <div className="absolute top-1/4 -left-20 w-40 h-40 bg-purple-500/5 rounded-full blur-2xl animate-bounce" style={{animationDuration: '3s'}}></div>
            <div className="absolute bottom-1/4 -right-20 w-60 h-60 bg-green-500/5 rounded-full blur-2xl animate-bounce" style={{animationDuration: '4s', animationDelay: '1s'}}></div>
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-r from-yellow-500/3 to-blue-500/3 rounded-full blur-3xl animate-spin" style={{animationDuration: '20s'}}></div>
          </>
        )}
      </div>
      <Card className={`w-full max-w-sm relative z-10 transition-all duration-700 transform ${showSecondaryAuth ? 'bg-gradient-to-br from-gray-700/90 via-slate-600/85 to-gray-700/90 border-2 border-cyan-400/80 hover:bg-gradient-to-br hover:from-gray-600 hover:via-slate-600/95 hover:to-gray-600 hover:scale-[1.02] hover:shadow-[0_30px_60px_-12px_rgba(6,182,212,0.6)] hover:border-cyan-300 ring-2 ring-cyan-500/40 hover:ring-cyan-400/60' : 'bg-gradient-to-br from-slate-700/80 via-purple-700/70 to-slate-700/80 border-2 border-purple-400/60 hover:bg-gradient-to-br hover:from-slate-700/90 hover:via-purple-700/80 hover:to-slate-700/90 hover:border-purple-300/80 hover:shadow-[0_30px_60px_-12px_rgba(168,85,247,0.6)] hover:scale-[1.02] ring-2 ring-purple-500/30 hover:ring-purple-400/50'} shadow-[0_20px_40px_-12px_rgba(0,0,0,0.8)] rounded-2xl overflow-hidden`}>
        <CardHeader className="text-center">
          {showSecondaryAuth ? (
            <div className="text-center space-y-6">
              <div className="flex flex-col items-center space-y-4">
                <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-2xl animate-pulse hover:shadow-blue-500/50 transition-all duration-700 relative overflow-hidden group">
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                  <Crown className="w-10 h-10 text-white drop-shadow-lg relative z-10 group-hover:scale-110 transition-transform duration-300" />
                </div>
                <div>
                  <h2 className="text-3xl font-bold text-white mb-2 drop-shadow-lg">站主管理登录</h2>
                  <p className="text-slate-300 mb-4">站主控制台 - 系统管理权限验证</p>
                  <div className="flex items-center justify-center space-x-4 text-sm">
                    <div className="flex items-center space-x-2">
                      <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-400 animate-pulse' : 'bg-red-400 animate-pulse'}`}></div>
                      <span className={isOnline ? 'text-green-400' : 'text-red-400'}>{isOnline ? '系统在线' : '网络断开'}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                      <span className="text-blue-400">安全验证</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <>
              <div className="w-24 h-24 mx-auto mb-4 relative group">
                {/* 外层发光环 */}
                <div className="absolute -inset-4 rounded-full bg-gradient-to-r from-cyan-400/20 via-purple-500/20 to-pink-500/20 blur-xl animate-pulse group-hover:blur-2xl transition-all duration-700"></div>
                
                {/* 旋转边框 */}
                <div className="absolute -inset-2 rounded-full border-2 border-transparent bg-gradient-to-r from-cyan-400 via-purple-500 to-pink-500 animate-spin group-hover:animate-pulse" style={{animationDuration: '8s'}}>
                  <div className="absolute inset-0.5 rounded-full bg-slate-900"></div>
                </div>
                
                {/* 主体容器 */}
                <div className="w-24 h-24 bg-gradient-to-br from-slate-800 via-slate-700 to-slate-800 rounded-full flex items-center justify-center relative overflow-hidden border-2 border-cyan-400/60 group-hover:border-cyan-300 transition-all duration-700 shadow-[0_0_40px_rgba(6,182,212,0.6)] group-hover:shadow-[0_0_60px_rgba(6,182,212,0.8)]">
                  
                  {/* 内部几何装饰 */}
                  <div className="absolute inset-2 rounded-full border border-purple-400/30 animate-pulse"></div>
                  <div className="absolute inset-4 rounded-full border border-cyan-400/20 animate-ping" style={{animationDuration: '3s'}}></div>
                  
                  {/* 扫描线效果 */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-cyan-400/30 to-transparent -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                  
                  {/* 核心文字 */}
                  <div className="relative z-10 flex items-center justify-center">
                    <span className="font-black text-3xl bg-gradient-to-br from-cyan-300 via-white to-purple-300 bg-clip-text text-transparent drop-shadow-[0_0_20px_rgba(6,182,212,0.8)] group-hover:scale-110 transition-all duration-500 filter group-hover:drop-shadow-[0_0_30px_rgba(6,182,212,1)]">礼</span>
                  </div>
                  
                  {/* 粒子效果 */}
                  <div className="absolute top-2 left-2 w-1 h-1 bg-cyan-400 rounded-full animate-ping opacity-60"></div>
                  <div className="absolute bottom-3 right-3 w-0.5 h-0.5 bg-purple-400 rounded-full animate-ping opacity-80" style={{animationDelay: '1s'}}></div>
                  <div className="absolute top-4 right-2 w-0.5 h-0.5 bg-pink-400 rounded-full animate-ping opacity-70" style={{animationDelay: '2s'}}></div>
                  
                  {/* 内部光晕 */}
                  <div className="absolute inset-0 rounded-full bg-gradient-to-br from-cyan-400/10 via-transparent to-purple-400/10 group-hover:from-cyan-400/20 group-hover:to-purple-400/20 transition-all duration-700"></div>
                </div>
                
                {/* 底部反射效果 */}
                <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-16 h-4 bg-gradient-to-r from-transparent via-cyan-400/20 to-transparent blur-sm opacity-60 group-hover:opacity-80 transition-opacity duration-700"></div>
              </div>
              <CardTitle className="text-2xl font-bold bg-gradient-to-r from-white via-purple-100 to-cyan-100 bg-clip-text text-transparent drop-shadow-2xl mb-2 tracking-wide hover:scale-105 transition-transform duration-500">家庭礼金簿</CardTitle>
              <CardDescription className="text-gray-100/90 text-base font-medium tracking-wide bg-gradient-to-r from-gray-100 to-gray-200 bg-clip-text text-transparent drop-shadow-lg">智能人情往来管理系统</CardDescription>
              <div className="flex items-center justify-center mt-6 space-x-6">
                <div className="flex items-center space-x-3 bg-green-500/10 backdrop-blur-sm rounded-full px-4 py-2 border border-green-400/30 hover:bg-green-500/20 transition-all duration-300 group">
                  <div className="w-3 h-3 bg-gradient-to-r from-green-400 to-emerald-400 rounded-full animate-pulse shadow-lg shadow-green-400/50 group-hover:scale-110 transition-transform duration-300"></div>
                  <span className="text-green-300 text-sm font-medium tracking-wide group-hover:text-green-200 transition-colors duration-300">系统在线</span>
                </div>
                <div className="flex items-center space-x-3 bg-blue-500/10 backdrop-blur-sm rounded-full px-4 py-2 border border-blue-400/30 hover:bg-blue-500/20 transition-all duration-300 group">
                  <div className="w-3 h-3 bg-gradient-to-r from-blue-400 to-cyan-400 rounded-full animate-pulse shadow-lg shadow-blue-400/50 group-hover:scale-110 transition-transform duration-300"></div>
                  <span className="text-blue-300 text-sm font-medium tracking-wide group-hover:text-blue-200 transition-colors duration-300">安全登录</span>
                </div>
              </div>
            </>
          )}
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-2">
            {error && (
              <div className={`${showSecondaryAuth ? 'bg-red-900/20 border-red-500/30 backdrop-blur-sm' : 'bg-red-50 border-red-200'} border rounded-lg p-4 mb-4 transition-all duration-300 hover:shadow-lg ${showSecondaryAuth ? 'hover:shadow-red-500/20' : 'hover:shadow-red-200/50'} group`}>
                <div className="flex items-start space-x-3">
                  <div className={`w-8 h-8 ${showSecondaryAuth ? 'bg-gradient-to-br from-red-500 to-red-600' : 'bg-red-500'} rounded-lg flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-300 relative overflow-hidden`}>
                    {showSecondaryAuth && (
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-500"></div>
                    )}
                    <Shield className={`w-4 h-4 ${showSecondaryAuth ? 'text-white' : 'text-white'} relative z-10`} />
                  </div>
                  <div className="flex-1">
                    <h4 className={`text-sm font-semibold ${showSecondaryAuth ? 'text-red-300' : 'text-red-800'} mb-1`}>
                      {showSecondaryAuth ? '权限验证失败' : '登录失败'}
                    </h4>
                    <p className={`text-sm ${showSecondaryAuth ? 'text-red-200' : 'text-red-700'} leading-relaxed`}>
                      {error}
                    </p>
                  </div>
                </div>
                {showSecondaryAuth && (
                  <div className="mt-3 pt-3 border-t border-red-500/20">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-red-400">系统安全等级：最高</span>
                      <div className="flex items-center space-x-2">
                        <div className="w-1.5 h-1.5 bg-red-400 rounded-full animate-pulse"></div>
                        <span className="text-red-400">重新验证</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {!showSecondaryAuth && (
              <>
                <div className="space-y-1">
                  <Label htmlFor="username" className="text-gray-200 font-medium">用户名</Label>
                  <Input
                    id="username"
                    name="username"
                    type="text"
                    placeholder="请输入用户名"
                    value={formData.username}
                    onChange={handleChange}
                    required
                    className="bg-gray-800/50 border-gray-600 text-white placeholder:text-gray-300 focus:border-cyan-400 focus:ring-cyan-400/20"
                  />
                </div>

                <div className="space-y-1">
                  <Label htmlFor="password" className="text-gray-200 font-medium">密码</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="请输入密码"
                      value={formData.password}
                      onChange={handleChange}
                      required
                      className="bg-gray-800/50 border-gray-600 text-white placeholder:text-gray-300 focus:border-cyan-400 focus:ring-cyan-400/20 pr-10"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </>
            )}

            {showSecondaryAuth && (
              <div className="space-y-2">
                <div className="bg-gray-800/70 border border-cyan-400/60 backdrop-blur-md rounded-lg p-4 mb-4 hover:bg-gray-800/90 hover:border-cyan-400/80 transition-all duration-300 hover:shadow-lg hover:shadow-cyan-400/60 group ring-1 ring-cyan-500/20">
                  <div className="flex items-center space-x-3 mb-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center group-hover:scale-110 transition-all duration-300 relative overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-500"></div>
                      <Shield className="w-5 h-5 text-white relative z-10" />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-white">
                        站主二次验证
                      </h3>
                      <p className="text-xs text-slate-400">
                        尊敬的站主大人，请输入二次验证密钥启动系统权限。
                      </p>
                    </div>
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <Label htmlFor="secondaryKey" className="text-white flex items-center space-x-2">
                      <div className={`w-2 h-2 rounded-full ${
                        getInputStatusColor(formData.secondaryKey) === 'green' ? 'bg-green-400' :
                        getInputStatusColor(formData.secondaryKey) === 'blue' ? 'bg-blue-400' :
                        'bg-red-400'
                      }`}></div>
                      <span>站主专属密钥</span>
                    </Label>
                  </div>
                  <div className="relative">
                    <Input
                      id="secondaryKey"
                      name="secondaryKey"
                      type="password"
                      placeholder="请输入站主专属密钥"
                      value={formData.secondaryKey}
                      onChange={handleChange}
                      required
                      className="bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-400 focus:border-yellow-500 focus:ring-yellow-500/20 pr-10"
                    />
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      <div className={`w-2 h-2 rounded-full ${
                        getInputStatusColor(formData.secondaryKey) === 'green' ? 'bg-green-400' :
                        getInputStatusColor(formData.secondaryKey) === 'blue' ? 'bg-blue-400' :
                        'bg-red-400'
                      }`}></div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <Button 
              type="submit" 
              className={`w-full transition-all duration-300 ${
                showSecondaryAuth 
                  ? 'bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 hover:from-emerald-400 hover:via-teal-400 hover:to-emerald-500 text-white py-3 px-6 rounded-xl font-semibold transform hover:scale-105 relative overflow-hidden group'
                  : 'bg-red-500 hover:bg-red-600'
              }`}
              disabled={loading}
            >
              {showSecondaryAuth && (
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
              )}
              <span className="relative z-10">
                {loading ? (showSecondaryAuth ? '验证中...' : '登录中...') : (showSecondaryAuth ? '启动站主权限' : '登录')}
              </span>
            </Button>

            <div className="text-center space-y-2">
              {showSecondaryAuth ? (
                <>
                  <p className="text-sm text-gray-600">
                    <Link to="/" className="text-emerald-500 hover:text-emerald-600 font-medium transition-colors duration-300">
                      返回普通登录
                    </Link>
                  </p>
                  <p className="text-sm text-gray-600">
                    <Link to="/register" className="text-teal-500 hover:text-teal-600 font-medium transition-colors duration-300">
                      注册新账号
                    </Link>
                  </p>
                </>
              ) : (
                <>
                  <p className="text-sm text-gray-200">
                    还没有账号？{' '}
                    <Link to="/register" className="text-cyan-400 hover:text-cyan-300 font-medium">
                      立即注册
                    </Link>
                  </p>
                  <p className="text-sm text-gray-200">
                    <Link to="/forgot-password" className="text-cyan-400 hover:text-cyan-300 font-medium">
                      忘记密码？
                    </Link>
                  </p>
                </>
              )}
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;

