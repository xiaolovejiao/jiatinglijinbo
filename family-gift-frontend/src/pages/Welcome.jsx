import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { 
  Users, 
  Heart, 
  Gift, 
  Plus,
  Activity,
  UserPlus,
  ArrowRight
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth.jsx';

const Welcome = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  // 鼠标跟随效果
  useEffect(() => {
    const handleMouseMove = (e) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);



  const handleContinue = () => {
    navigate('/center');
  };

  return (
    <div 
      className="min-h-screen bg-gradient-to-br from-blue-900 via-indigo-900 to-purple-900 relative overflow-hidden flex items-center justify-center p-4"
      style={{
        background: `
          radial-gradient(120px circle at ${mousePosition.x}px ${mousePosition.y}px, rgba(255, 255, 255, 0.12), rgba(255, 255, 255, 0.04) 60%, transparent 80%),
          radial-gradient(250px circle at ${mousePosition.x}px ${mousePosition.y}px, rgba(59, 130, 246, 0.06), transparent 70%),
          linear-gradient(135deg, rgb(30 58 138) 0%, rgb(67 56 202) 50%, rgb(30 58 138) 100%)
        `
      }}
    >
      {/* 动态背景装饰 */}
      <div className="absolute inset-0">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-indigo-500/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl animate-pulse delay-500"></div>
      </div>
      
      {/* 用户欢迎卡片 */}
      <div className="relative z-10 bg-white/10 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 p-8 w-full max-w-lg hover:scale-105 transition-transform duration-300">
        {/* 卡片内部光效 */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent rounded-2xl"></div>
        
        <div className="relative text-center">
          {/* 顶部图标和标题 */}
          <div className="relative mb-6">
            <div className="w-24 h-24 bg-gradient-to-br from-blue-400 via-indigo-500 to-purple-600 rounded-full flex items-center justify-center mx-auto shadow-xl shadow-blue-500/50 animate-pulse">
              <Heart className="w-12 h-12 text-white drop-shadow-lg" />
            </div>
          </div>
          
          <h1 className="text-3xl font-bold text-white mb-2 tracking-wide drop-shadow-lg">
            欢迎来到家庭礼金簿
          </h1>
          <h2 className="text-xl font-semibold text-blue-200 mb-4">
            {user?.nickname || user?.username}，您好！
          </h2>
          <p className="text-gray-300 mb-8 leading-relaxed text-sm max-w-md mx-auto">
            在这里，您可以轻松管理家庭的人情往来，记录每一份珍贵的情谊，让温暖的回忆永远保存。
          </p>
          
          {/* 功能特色展示 */}
          <div className="bg-white/5 backdrop-blur-sm rounded-lg p-4 mb-6 border border-white/10">
            <h3 className="text-white text-sm font-semibold mb-3 text-center">主要功能</h3>
            
            <div className="grid grid-cols-3 gap-3">
              {/* 智能记录 */}
              <div className="bg-white/5 rounded-lg p-3 text-center border border-white/10 hover:bg-white/10 transition-all duration-300">
                <div className="flex items-center justify-center mb-2">
                  <div className="w-8 h-8 bg-green-500/20 rounded-full flex items-center justify-center">
                    <Plus className="w-4 h-4 text-green-400" />
                  </div>
                </div>
                <span className="text-white font-medium text-xs">智能记录</span>
                <div className="text-xs text-gray-300 mt-1">
                  快速记录礼金
                </div>
              </div>
              
              {/* 数据统计 */}
              <div className="bg-white/5 rounded-lg p-3 text-center border border-white/10 hover:bg-white/10 transition-all duration-300">
                <div className="flex items-center justify-center mb-2">
                  <div className="w-8 h-8 bg-purple-500/20 rounded-full flex items-center justify-center">
                    <Activity className="w-4 h-4 text-purple-400" />
                  </div>
                </div>
                <span className="text-white font-medium text-xs">数据统计</span>
                <div className="text-xs text-gray-300 mt-1">
                  查看详细分析
                </div>
              </div>
              
              {/* 家庭管理 */}
              <div className="bg-white/5 rounded-lg p-3 text-center border border-white/10 hover:bg-white/10 transition-all duration-300">
                <div className="flex items-center justify-center mb-2">
                  <div className="w-8 h-8 bg-orange-500/20 rounded-full flex items-center justify-center">
                    <UserPlus className="w-4 h-4 text-orange-400" />
                  </div>
                </div>
                <span className="text-white font-medium text-xs">家庭管理</span>
                <div className="text-xs text-gray-300 mt-1">
                  管理家庭成员
                </div>
              </div>
            </div>
          </div>
          
          {/* 操作按钮 */}
          <div className="space-y-3">
            <Button 
              onClick={handleContinue}
              className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-semibold py-3 px-6 rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center space-x-2"
            >
              <span>开始使用</span>
              <ArrowRight className="w-4 h-4" />
            </Button>
            

          </div>
        </div>
      </div>
    </div>
  );
};

export default Welcome;