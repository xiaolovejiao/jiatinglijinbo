import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Alert, AlertDescription } from '../components/ui/alert';
import { Progress } from '../components/ui/progress';
import { Eye, EyeOff, CheckCircle, XCircle } from 'lucide-react';
import { useAuth } from '../hooks/useAuth.jsx';
import { apiRequest } from '../config/api';

const ForgotPassword = () => {
  const [step, setStep] = useState(1); // 1: 输入用户名, 2: 回答密保问题, 3: 重置密码
  const [formData, setFormData] = useState({
    username: '',
    security_answer: '',
    new_password: '',
    confirm_password: ''
  });
  const [securityQuestion, setSecurityQuestion] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(null);
  const navigate = useNavigate();
  const { checkPasswordStrength } = useAuth();

  const handleInputChange = (e) => {
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
      new_password: password
    });
    setError('');

    if (password) {
      const strength = checkPasswordStrength(password);
      setPasswordStrength(strength);
    } else {
      setPasswordStrength(null);
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

  const handleStep1Submit = async (e) => {
    e.preventDefault();
    if (!formData.username) {
      setError('请输入用户名');
      return;
    }

    setLoading(true);
    try {
      const response = await apiRequest('/api/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ username: formData.username })
      });

      const data = await response.json();
      if (response.ok) {
        setSecurityQuestion(data.security_question);
        setStep(2);
      } else {
        setError(data.error || '获取密保问题失败');
      }
    } catch (error) {
      setError('网络错误，请重试');
    } finally {
      setLoading(false);
    }
  };

  const handleStep2Submit = async (e) => {
    e.preventDefault();
    if (!formData.security_answer) {
      setError('请输入密保答案');
      return;
    }
    if (!formData.new_password) {
      setError('请输入新密码');
      return;
    }
    
    // 验证密码强度
    if (!passwordStrength || passwordStrength.strength === 'weak') {
      setError('密码强度不足，请设置更强的密码');
      return;
    }
    
    if (formData.new_password !== formData.confirm_password) {
      setError('两次输入的密码不一致');
      return;
    }

    setLoading(true);
    try {
      const response = await apiRequest('/api/reset-password', {
        method: 'POST',
        body: JSON.stringify({
          username: formData.username,
          securityAnswer: formData.security_answer,
          newPassword: formData.new_password
        })
      });

      const data = await response.json();
      if (response.ok) {
        setSuccess('密码重置成功！');
        setTimeout(() => {
          navigate('/login');
        }, 2000);
      } else {
        setError(data.error || '密码重置失败');
      }
    } catch (error) {
      setError('网络错误，请重试');
    } finally {
      setLoading(false);
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
      <Card className="w-full max-w-sm relative z-10 transition-all duration-700 transform bg-gradient-to-br from-slate-700/80 via-purple-700/70 to-slate-700/80 border-2 border-purple-400/60 hover:bg-gradient-to-br hover:from-slate-700/90 hover:via-purple-700/80 hover:to-slate-700/90 hover:border-purple-300/80 hover:shadow-[0_30px_60px_-12px_rgba(168,85,247,0.6)] hover:scale-[1.02] ring-2 ring-purple-500/30 hover:ring-purple-400/50 shadow-[0_20px_40px_-12px_rgba(0,0,0,0.8)] rounded-2xl overflow-hidden">
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
          <CardTitle className="text-2xl font-bold bg-gradient-to-r from-white via-purple-100 to-cyan-100 bg-clip-text text-transparent drop-shadow-2xl mb-2 tracking-wide hover:scale-105 transition-transform duration-500">
            忘记密码
          </CardTitle>
          <p className="text-gray-100/90 text-base font-medium tracking-wide bg-gradient-to-r from-gray-100 to-gray-200 bg-clip-text text-transparent drop-shadow-lg mb-4">
            {step === 1 && '请输入您的用户名'}
            {step === 2 && '请回答密保问题并设置新密码'}
          </p>
          <div className="flex items-center justify-center mt-6 space-x-6">
            <div className="flex items-center space-x-3 bg-green-500/10 backdrop-blur-sm rounded-full px-4 py-2 border border-green-400/30 hover:bg-green-500/20 transition-all duration-300 group">
              <div className="w-3 h-3 bg-gradient-to-r from-green-400 to-emerald-400 rounded-full animate-pulse shadow-lg shadow-green-400/50 group-hover:scale-110 transition-transform duration-300"></div>
              <span className="text-green-300 text-sm font-medium tracking-wide group-hover:text-green-200 transition-colors duration-300">系统在线</span>
            </div>
            <div className="flex items-center space-x-3 bg-orange-500/10 backdrop-blur-sm rounded-full px-4 py-2 border border-orange-400/30 hover:bg-orange-500/20 transition-all duration-300 group">
              <div className="w-3 h-3 bg-gradient-to-r from-orange-400 to-amber-400 rounded-full animate-pulse shadow-lg shadow-orange-400/50 group-hover:scale-110 transition-transform duration-300"></div>
              <span className="text-orange-300 text-sm font-medium tracking-wide group-hover:text-orange-200 transition-colors duration-300">密码重置</span>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-2">
          {error && (
            <Alert className="bg-red-900/20 border-red-500/50 text-red-200">
              <AlertDescription className="text-red-200">
                {error}
              </AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert className="bg-green-900/20 border-green-500/50 text-green-200">
              <AlertDescription className="text-green-200">
                {success}
              </AlertDescription>
            </Alert>
          )}

          {step === 1 && (
            <form onSubmit={handleStep1Submit} className="space-y-2">
              <div>
                <Label htmlFor="username" className="text-gray-200 font-medium">用户名</Label>
                <Input
                  id="username"
                  name="username"
                  type="text"
                  placeholder="请输入用户名"
                  value={formData.username}
                  onChange={handleInputChange}
                  className="bg-gray-800/50 border-gray-600 text-white placeholder:text-gray-300 focus:border-cyan-400 focus:ring-cyan-400/20"
                />
              </div>

              <Button 
                type="submit" 
                className="w-full btn-primary"
                disabled={loading}
              >
                {loading ? '获取中...' : '获取密保问题'}
              </Button>
            </form>
          )}

          {step === 2 && (
            <form onSubmit={handleStep2Submit} className="space-y-2">
              <div>
                <Label className="text-gray-200 font-medium">密保问题</Label>
                <div className="p-3 bg-gray-800/50 border border-gray-600 rounded-md text-sm text-gray-200">
                  {securityQuestion}
                </div>
              </div>

              <div>
                <Label htmlFor="security_answer" className="text-gray-200 font-medium">密保答案</Label>
                <Input
                  id="security_answer"
                  name="security_answer"
                  type="text"
                  placeholder="请输入密保答案"
                  value={formData.security_answer}
                  onChange={handleInputChange}
                  className="bg-gray-800/50 border-gray-600 text-white placeholder:text-gray-300 focus:border-cyan-400 focus:ring-cyan-400/20"
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="new_password" className="text-gray-200 font-medium">新密码</Label>
                <div className="relative">
                  <Input
                    id="new_password"
                    name="new_password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="请输入新密码"
                    value={formData.new_password}
                    onChange={handlePasswordChange}
                    className="bg-gray-800/50 border-gray-600 text-white placeholder:text-gray-300 focus:border-cyan-400 focus:ring-cyan-400/20 pr-10"
                    required
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
                <Label htmlFor="confirm_password" className="text-gray-200 font-medium">确认新密码</Label>
                <div className="relative">
                  <Input
                    id="confirm_password"
                    name="confirm_password"
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="请再次输入新密码"
                    value={formData.confirm_password}
                    onChange={handleInputChange}
                    className="bg-gray-800/50 border-gray-600 text-white placeholder:text-gray-300 focus:border-cyan-400 focus:ring-cyan-400/20 pr-10"
                    required
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
                    {formData.new_password === formData.confirm_password ? (
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

              <Button 
                type="submit" 
                className="w-full btn-primary"
                disabled={loading}
              >
                {loading ? '重置中...' : '重置密码'}
              </Button>
            </form>
          )}

          <div className="text-center space-y-1">
            <Link 
              to="/login" 
              className="text-sm text-cyan-400 hover:text-cyan-300 font-medium"
            >
              返回登录
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ForgotPassword;

