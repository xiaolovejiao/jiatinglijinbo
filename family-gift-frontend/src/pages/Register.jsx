import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Alert, AlertDescription } from '../components/ui/alert';
import { Progress } from '../components/ui/progress';
import { Eye, EyeOff, CheckCircle, XCircle } from 'lucide-react';
import { useAuth } from '../hooks/useAuth.jsx';

const Register = () => {
  const [formData, setFormData] = useState({
    username: '',
    nickname: '',
    password: '',
    confirm_password: '',
    security_question: '',
    security_answer: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { register, checkPasswordStrength } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError('');
  };

  const handlePasswordChange = (e) => {
    const password = e.target.value;
    setFormData({
      ...formData,
      password
    });
    setError('');

    if (password) {
      const strength = checkPasswordStrength(password);
      setPasswordStrength(strength);
    } else {
      setPasswordStrength(null);
    }
  };

  const validateUsername = (username) => {
    if (!username) return false;
    if (username.length < 3 || username.length > 50) return false;
    
    const hasLetter = /[a-zA-Z]/.test(username);
    const hasDigit = /\d/.test(username);
    const isAlphanumeric = /^[a-zA-Z0-9]+$/.test(username);
    
    return hasLetter && hasDigit && isAlphanumeric;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // 验证用户名
    if (!validateUsername(formData.username)) {
      setError('用户名必须包含字母和数字，长度3-50位，只能包含字母和数字');
      setLoading(false);
      return;
    }

    // 验证密码强度
    if (!passwordStrength || passwordStrength.strength === 'weak') {
      setError('密码强度不足，请设置更强的密码');
      setLoading(false);
      return;
    }

    // 验证密码确认
    if (formData.password !== formData.confirm_password) {
      setError('两次输入的密码不一致');
      setLoading(false);
      return;
    }

    // 验证密保问题和答案
    if (!formData.security_question || !formData.security_answer) {
      setError('密保问题和答案为必填项，用于账号安全保护');
      setLoading(false);
      return;
    }

    // 转换字段名格式以匹配后端API
    const registerData = {
      username: formData.username,
      nickname: formData.nickname,
      password: formData.password,
      email: formData.email,
      phone: formData.phone,
      securityQuestion: formData.security_question,
      securityAnswer: formData.security_answer
    };

    const result = await register(registerData);

    if (result.success) {
      navigate('/center');
    } else {
      setError(result.error);
    }

    setLoading(false);
  };

  const getPasswordStrengthColor = (strength) => {
    switch (strength) {
      case 'strong': return 'bg-green-500';
      case 'medium': return 'bg-yellow-500';
      case 'weak': return 'bg-red-500';
      default: return 'bg-gray-300';
    }
  };

  const getPasswordStrengthText = (strength) => {
    switch (strength) {
      case 'strong': return '强';
      case 'medium': return '中';
      case 'weak': return '弱';
      default: return '';
    }
  };

  return (
    <div 
      className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden"
      style={{
        background: `
          radial-gradient(circle at 20% 80%, rgba(120, 119, 198, 0.3), transparent 50%),
          radial-gradient(circle at 80% 20%, rgba(255, 119, 198, 0.3), transparent 50%),
          radial-gradient(circle at 40% 40%, rgba(120, 219, 255, 0.2), transparent 50%),
          linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)
        `
      }}
    >
      {/* 科技感背景装饰 */}
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
      </div>
      <Card className="w-full max-w-sm relative z-10 transition-all duration-700 transform bg-gradient-to-br from-slate-700/85 via-purple-700/75 to-slate-700/85 border-2 border-purple-400/70 hover:bg-gradient-to-br hover:from-slate-700/95 hover:via-purple-700/85 hover:to-slate-700/95 hover:border-purple-300/90 hover:shadow-[0_30px_60px_-12px_rgba(168,85,247,0.6)] hover:scale-[1.02] ring-2 ring-purple-500/40 hover:ring-purple-400/60 shadow-[0_20px_40px_-12px_rgba(0,0,0,0.8)] rounded-2xl overflow-hidden">
        <CardHeader className="text-center">
          <div className="w-20 h-20 bg-gradient-to-br from-cyan-400 via-purple-500 to-pink-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-[0_25px_50px_-12px_rgba(168,85,247,0.8)] relative overflow-hidden group hover:scale-115 transition-all duration-700 border-2 border-cyan-300/60 hover:border-cyan-200">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/50 to-transparent -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-cyan-400/40 to-purple-400/40 animate-pulse"></div>
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-tr from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="absolute inset-0 rounded-2xl border-2 border-white/30 group-hover:border-white/50 transition-colors duration-500"></div>
              <span className="font-black text-3xl text-white drop-shadow-[0_8px_16px_rgba(0,0,0,0.8)] relative z-10 group-hover:scale-125 transition-transform duration-500 filter group-hover:brightness-125 group-hover:drop-shadow-[0_12px_24px_rgba(255,255,255,0.3)]">礼</span>
              <div className="absolute -inset-2 rounded-2xl bg-gradient-to-br from-cyan-500/30 to-purple-500/30 blur-md group-hover:blur-lg transition-all duration-500"></div>
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-cyan-300/20 to-purple-300/20 group-hover:from-cyan-200/30 group-hover:to-purple-200/30 transition-all duration-500"></div>
            </div>
          <CardTitle className="text-2xl font-bold bg-gradient-to-r from-white via-purple-100 to-cyan-100 bg-clip-text text-transparent drop-shadow-2xl mb-2 tracking-wide hover:scale-105 transition-transform duration-500">注册账号</CardTitle>
           <CardDescription className="text-gray-100/90 text-base font-medium tracking-wide bg-gradient-to-r from-gray-100 to-gray-200 bg-clip-text text-transparent drop-shadow-lg">创建您的家庭礼金簿账户</CardDescription>
          <div className="flex items-center justify-center mt-6 space-x-6">
            <div className="flex items-center space-x-3 bg-green-500/10 backdrop-blur-sm rounded-full px-4 py-2 border border-green-400/30 hover:bg-green-500/20 transition-all duration-300 group">
              <div className="w-3 h-3 bg-gradient-to-r from-green-400 to-emerald-400 rounded-full animate-pulse shadow-lg shadow-green-400/50 group-hover:scale-110 transition-transform duration-300"></div>
              <span className="text-green-300 text-sm font-medium tracking-wide group-hover:text-green-200 transition-colors duration-300">系统在线</span>
            </div>
            <div className="flex items-center space-x-3 bg-blue-500/10 backdrop-blur-sm rounded-full px-4 py-2 border border-blue-400/30 hover:bg-blue-500/20 transition-all duration-300 group">
              <div className="w-3 h-3 bg-gradient-to-r from-blue-400 to-cyan-400 rounded-full animate-pulse shadow-lg shadow-blue-400/50 group-hover:scale-110 transition-transform duration-300"></div>
              <span className="text-blue-300 text-sm font-medium tracking-wide group-hover:text-blue-200 transition-colors duration-300">安全注册</span>
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-2">
            {error && (
              <Alert className="bg-red-900/20 border-red-500/50 text-red-200">
                <AlertDescription className="text-red-200">{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-1">
              <Label htmlFor="username" className="text-gray-200 font-medium">账号</Label>
              <Input
                id="username"
                name="username"
                type="text"
                placeholder="字母数字结合，3-50位"
                value={formData.username}
                onChange={handleChange}
                required
                className="bg-gray-800/50 border-gray-600 text-white placeholder:text-gray-300 focus:border-cyan-400 focus:ring-cyan-400/20"
              />
              <div className="flex items-center space-x-2 text-xs">
                {formData.username && (
                  validateUsername(formData.username) ? (
                    <div className="flex items-center text-green-600">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      <span>账号格式正确</span>
                    </div>
                  ) : (
                    <div className="flex items-center text-red-600">
                      <XCircle className="w-3 h-3 mr-1" />
                      <span>账号格式不正确</span>
                    </div>
                  )
                )}
              </div>
            </div>

            <div className="space-y-1">
              <Label htmlFor="nickname" className="text-gray-200 font-medium">昵称</Label>
              <Input
                id="nickname"
                name="nickname"
                type="text"
                placeholder="请输入昵称"
                value={formData.nickname}
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
                  onChange={handlePasswordChange}
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
              
              {passwordStrength && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span>密码强度</span>
                    <span className={`font-medium ${
                      passwordStrength.strength === 'strong' ? 'text-green-600' :
                      passwordStrength.strength === 'medium' ? 'text-yellow-600' :
                      'text-red-600'
                    }`}>
                      {getPasswordStrengthText(passwordStrength.strength)}
                    </span>
                  </div>
                  <Progress 
                    value={(passwordStrength.score / 6) * 100} 
                    className="h-2"
                  />
                  <p className="text-xs text-gray-600">{passwordStrength.message}</p>
                </div>
              )}
            </div>

            <div className="space-y-1">
              <Label htmlFor="confirm_password" className="text-gray-200 font-medium">确认密码</Label>
              <div className="relative">
                <Input
                  id="confirm_password"
                  name="confirm_password"
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="请再次输入密码"
                  value={formData.confirm_password}
                  onChange={handleChange}
                  required
                  className="bg-gray-800/50 border-gray-600 text-white placeholder:text-gray-300 focus:border-cyan-400 focus:ring-cyan-400/20 pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
              {formData.confirm_password && (
                <div className="flex items-center space-x-2 text-xs">
                  {formData.password === formData.confirm_password ? (
                    <div className="flex items-center text-green-600">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      <span>密码一致</span>
                    </div>
                  ) : (
                    <div className="flex items-center text-red-600">
                      <XCircle className="w-3 h-3 mr-1" />
                      <span>密码不一致</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="space-y-1">
              <Label htmlFor="security_question" className="text-gray-200 font-medium">密保问题 *</Label>
              <Input
                id="security_question"
                name="security_question"
                type="text"
                placeholder="例如：您的小学班主任姓名？"
                value={formData.security_question}
                onChange={handleChange}
                required
                className="bg-gray-800/50 border-gray-600 text-white placeholder:text-gray-300 focus:border-cyan-400 focus:ring-cyan-400/20"
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="security_answer" className="text-gray-200 font-medium">密保答案 *</Label>
              <Input
                id="security_answer"
                name="security_answer"
                type="text"
                placeholder="请输入密保答案"
                value={formData.security_answer}
                onChange={handleChange}
                required
                className="bg-gray-800/50 border-gray-600 text-white placeholder:text-gray-300 focus:border-cyan-400 focus:ring-cyan-400/20"
              />
            </div>

            <Button 
              type="submit" 
              className="w-full bg-red-500 hover:bg-red-600"
              disabled={loading}
            >
              {loading ? '注册中...' : '注册'}
            </Button>

            <div className="text-center">
              <p className="text-sm text-gray-200">
                已有账号？{' '}
                <Link to="/login" className="text-cyan-400 hover:text-cyan-300 font-medium">
                  立即登录
                </Link>
              </p>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default Register;

