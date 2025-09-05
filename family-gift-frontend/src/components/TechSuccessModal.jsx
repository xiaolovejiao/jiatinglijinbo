import React, { useEffect, useState } from 'react';
import { CheckCircle, X, Zap, Shield, Activity } from 'lucide-react';

const TechSuccessModal = ({ isOpen, onClose, message, type = 'success' }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
      // 进度条动画
      const progressTimer = setInterval(() => {
        setProgress(prev => {
          if (prev >= 100) {
            clearInterval(progressTimer);
            // 3秒后自动关闭
            setTimeout(() => {
              handleClose();
            }, 500);
            return 100;
          }
          return prev + 2;
        });
      }, 60); // 3秒完成进度条

      return () => clearInterval(progressTimer);
    } else {
      setIsVisible(false);
      setProgress(0);
    }
  }, [isOpen]);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(() => {
      onClose();
      setProgress(0);
    }, 300);
  };

  if (!isOpen) return null;

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircle className="w-8 h-8 text-emerald-400" />;
      case 'warning':
        return <Shield className="w-8 h-8 text-yellow-400" />;
      case 'info':
        return <Activity className="w-8 h-8 text-blue-400" />;
      default:
        return <CheckCircle className="w-8 h-8 text-emerald-400" />;
    }
  };

  const getGradientColors = () => {
    switch (type) {
      case 'success':
        return 'from-emerald-500/20 to-green-500/20';
      case 'warning':
        return 'from-yellow-500/20 to-orange-500/20';
      case 'info':
        return 'from-blue-500/20 to-cyan-500/20';
      default:
        return 'from-emerald-500/20 to-green-500/20';
    }
  };

  const getBorderColor = () => {
    switch (type) {
      case 'success':
        return 'border-emerald-500/30';
      case 'warning':
        return 'border-yellow-500/30';
      case 'info':
        return 'border-blue-500/30';
      default:
        return 'border-emerald-500/30';
    }
  };

  const getProgressColor = () => {
    switch (type) {
      case 'success':
        return 'from-emerald-400 to-green-500';
      case 'warning':
        return 'from-yellow-400 to-orange-500';
      case 'info':
        return 'from-blue-400 to-cyan-500';
      default:
        return 'from-emerald-400 to-green-500';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* 背景遮罩 */}
      <div 
        className={`absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300 ${
          isVisible ? 'opacity-100' : 'opacity-0'
        }`}
        onClick={handleClose}
      />
      
      {/* 弹窗内容 */}
      <div 
        className={`relative transform transition-all duration-300 ${
          isVisible ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
        }`}
      >
        {/* 外层光晕效果 */}
        <div className="absolute -inset-4 bg-gradient-to-r from-emerald-500/20 via-blue-500/20 to-purple-500/20 rounded-3xl blur-xl animate-pulse" />
        
        {/* 主弹窗 */}
        <div className={`relative bg-gradient-to-br from-slate-800/95 to-slate-900/95 backdrop-blur-xl rounded-2xl border ${getBorderColor()} shadow-2xl min-w-[400px] max-w-md`}>
          {/* 关闭按钮 */}
          <button
            onClick={handleClose}
            className="absolute top-4 right-4 p-2 rounded-full bg-slate-700/50 hover:bg-slate-600/50 text-slate-400 hover:text-white transition-all duration-200 group"
          >
            <X className="w-4 h-4 group-hover:rotate-90 transition-transform duration-200" />
          </button>

          {/* 头部装饰 */}
          <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
            <div className={`w-16 h-16 bg-gradient-to-br ${getGradientColors()} rounded-full border ${getBorderColor()} flex items-center justify-center shadow-lg`}>
              {getIcon()}
            </div>
          </div>

          {/* 内容区域 */}
          <div className="pt-12 pb-6 px-6">
            {/* 状态指示器 */}
            <div className="flex items-center justify-center mb-4">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
                <span className="text-emerald-400 text-xs font-mono uppercase tracking-wider">
                  {type === 'success' ? 'SUCCESS' : type === 'warning' ? 'WARNING' : 'INFO'}
                </span>
                <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
              </div>
            </div>

            {/* 主要消息 */}
            <div className="text-center mb-6">
              <h3 className="text-xl font-bold text-white mb-2">
                操作完成
              </h3>
              <p className="text-slate-300 text-sm leading-relaxed">
                {message}
              </p>
            </div>

            {/* 进度条 */}
            <div className="mb-4">
              <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
                <span>处理进度</span>
                <span>{progress}%</span>
              </div>
              <div className="w-full bg-slate-700/50 rounded-full h-2 overflow-hidden">
                <div 
                  className={`h-full bg-gradient-to-r ${getProgressColor()} transition-all duration-100 ease-out relative`}
                  style={{ width: `${progress}%` }}
                >
                  <div className="absolute inset-0 bg-white/20 animate-pulse" />
                </div>
              </div>
            </div>

            {/* 底部装饰 */}
            <div className="flex items-center justify-center space-x-4 text-xs text-slate-500">
              <div className="flex items-center space-x-1">
                <Zap className="w-3 h-3" />
                <span>SYSTEM</span>
              </div>
              <div className="w-1 h-1 bg-slate-500 rounded-full" />
              <div className="flex items-center space-x-1">
                <Shield className="w-3 h-3" />
                <span>SECURE</span>
              </div>
              <div className="w-1 h-1 bg-slate-500 rounded-full" />
              <div className="flex items-center space-x-1">
                <Activity className="w-3 h-3" />
                <span>ACTIVE</span>
              </div>
            </div>
          </div>

          {/* 底部光效 */}
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-emerald-500/50 to-transparent" />
        </div>
      </div>
    </div>
  );
};

export default TechSuccessModal;