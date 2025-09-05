import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { apiRequest } from '../config/api';

const NotificationContext = createContext();

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};

export const NotificationProvider = ({ children }) => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState({
    system: { unread: 0, messages: [] },
    family: { unread: 0, messages: [] },
    records: { unread: 0, messages: [] },
    delete_request: { unread: 0, messages: [] }
  });
  const [loading, setLoading] = useState(false);

  // 从后端获取消息通知
  const fetchNotifications = async () => {
    if (!user) {
      console.log('用户未登录，跳过获取消息通知');
      return;
    }
    
    console.log('开始获取消息通知，用户:', user);
    
    try {
      setLoading(true);
      const response = await apiRequest('/api/notifications', {
        method: 'GET'
      });
      
      console.log('消息通知API响应状态:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('获取到的消息通知数据:', data);
        setNotifications(data);
      } else {
        const errorText = await response.text();
        console.error('获取消息通知失败:', response.status, response.statusText, errorText);
      }
    } catch (error) {
      console.error('获取消息通知失败:', error);
    } finally {
      setLoading(false);
    }
  };

  // 用户登录后获取消息通知
  useEffect(() => {
    if (user) {
      fetchNotifications();
      
      // 设置轮询，每5秒获取一次最新消息
      const pollInterval = setInterval(() => {
        fetchNotifications();
      }, 5000); // 5秒
      
      return () => {
        clearInterval(pollInterval);
      };
    } else {
      // 用户登出时清空消息
      setNotifications({
        system: { unread: 0, messages: [] },
        family: { unread: 0, messages: [] },
        records: { unread: 0, messages: [] },
        delete_request: { unread: 0, messages: [] }
      });
    }
  }, [user]);

  // 计算总未读消息数
  const getTotalUnreadCount = () => {
    if (!notifications || !notifications.system || !notifications.family || !notifications.records || !notifications.delete_request) {
      return 0;
    }
    return notifications.system.unread + notifications.family.unread + notifications.records.unread + notifications.delete_request.unread;
  };

  // 标记消息为已读
  const markAsRead = async (category, messageId) => {
    try {
      const response = await fetch(`/api/notifications/${messageId}/read`, {
        method: 'PUT',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        // 更新本地状态
        setNotifications(prev => ({
          ...prev,
          [category]: {
            ...prev[category],
            unread: Math.max(0, prev[category].unread - 1),
            messages: prev[category].messages.map(msg => 
              msg.id === messageId ? { ...msg, read: true } : msg
            )
          }
        }));
      } else {
        console.error('标记消息已读失败:', response.statusText);
      }
    } catch (error) {
      console.error('标记消息已读失败:', error);
    }
  };

  // 批量标记某类别消息为已读
  const markCategoryAsRead = async (category) => {
    try {
      const response = await fetch(`/api/notifications/category/${category}/read`, {
        method: 'PUT',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        // 更新本地状态
        setNotifications(prev => ({
          ...prev,
          [category]: {
            ...prev[category],
            unread: 0,
            messages: prev[category].messages.map(msg => ({ ...msg, read: true }))
          }
        }));
      } else {
        console.error('批量标记消息已读失败:', response.statusText);
      }
    } catch (error) {
      console.error('批量标记消息已读失败:', error);
    }
  };

  // 清除某类别的所有消息
  const clearCategory = async (category) => {
    try {
      const url = `/api/notifications/category/${category}`;
      console.log(`🔍 前端发送清除请求 - URL: ${url}, 类别: ${category}`);
      
      const response = await fetch(url, {
        method: 'DELETE',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        // 更新本地状态
        setNotifications(prev => ({
          ...prev,
          [category]: {
            unread: 0,
            messages: []
          }
        }));
        console.log(`✅ 成功清除 ${category} 类别的消息`);
      } else {
        // 获取详细错误信息
        const errorData = await response.json().catch(() => ({ error: response.statusText }));
        console.error('清除消息失败:', {
          status: response.status,
          statusText: response.statusText,
          error: errorData.error || '未知错误'
        });
        alert(`清除消息失败: ${errorData.error || response.statusText}`);
      }
    } catch (error) {
      console.error('清除消息失败:', error);
      alert(`清除消息失败: ${error.message}`);
    }
  };

  // 添加新消息（本地使用，实际消息由后端创建）
  const addMessage = (category, message) => {
    const newMessage = {
      ...message,
      id: Date.now(),
      read: false,
      timestamp: new Date().toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
      })
    };
    
    setNotifications(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        unread: prev[category].unread + 1,
        messages: [newMessage, ...prev[category].messages]
      }
    }));
  };

  const value = {
    notifications,
    getTotalUnreadCount,
    markAsRead,
    markCategoryAsRead,
    clearCategory,
    addMessage,
    loading,
    fetchNotifications
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};