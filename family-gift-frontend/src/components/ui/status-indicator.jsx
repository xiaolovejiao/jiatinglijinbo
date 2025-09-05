import React from 'react';
import { cn } from '../../lib/utils';

/**
 * 统一的状态指示器组件
 * @param {Object} props
 * @param {'online'|'offline'|'checking'} props.status - 状态
 * @param {'sm'|'md'|'lg'} props.size - 大小
 * @param {boolean} props.showPing - 是否显示ping动画（仅在online状态下）
 * @param {string} props.className - 额外的CSS类
 */
export const StatusIndicator = ({ 
  status = 'offline', 
  size = 'md', 
  showPing = true, 
  className 
}) => {
  // 状态颜色映射
  const getStatusColor = (status) => {
    switch (status) {
      case 'online': return 'bg-green-500';
      case 'offline': return 'bg-red-500';
      case 'checking': return 'bg-yellow-500';
      default: return 'bg-gray-500';
    }
  };

  // 尺寸映射
  const getSizeClasses = (size) => {
    switch (size) {
      case 'sm': return 'w-1.5 h-1.5';
      case 'md': return 'w-2 h-2';
      case 'lg': return 'w-3 h-3';
      default: return 'w-2 h-2';
    }
  };

  // 动画逻辑
  const shouldPulse = status === 'checking' || status === 'online';
  const shouldPing = status === 'online' && showPing;

  return (
    <div className={cn('relative', className)}>
      {/* 主状态点 */}
      <div 
        className={cn(
          getSizeClasses(size),
          getStatusColor(status),
          'rounded-full shadow-lg',
          shouldPulse && 'animate-pulse'
        )}
      />
      
      {/* Ping动画效果（所有状态都显示） */}
      {showPing && (
        <div 
          className={cn(
            'absolute inset-0',
            getSizeClasses(size),
            getStatusColor(status),
            'rounded-full animate-ping opacity-75'
          )}
        />
      )}
    </div>
  );
};

export default StatusIndicator;