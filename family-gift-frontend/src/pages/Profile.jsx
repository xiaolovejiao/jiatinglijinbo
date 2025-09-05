import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useLocation, useNavigate } from 'react-router-dom';
import { useNotification } from '../contexts/NotificationContext';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Alert, AlertDescription } from '../components/ui/alert';
import { User, Lock, Trash2, Shield, LogOut, Edit, Camera, Upload, Check, X, Mail, Calendar, Save, Star, Bell } from 'lucide-react';
import ErrorModal from '../components/ErrorModal';

const Profile = () => {
  const { user, logout, updateUser } = useAuth();
  const navigate = useNavigate();
  const { notifications, getTotalUnreadCount, markAsRead, markCategoryAsRead, clearCategory, fetchNotifications, loading: notificationLoading } = useNotification();
  
  // 格式化时间为北京时间
  const formatBeijingTime = (timestamp) => {
    if (!timestamp) return '';
    
    // 创建Date对象，数据库返回的是UTC时间
    const date = new Date(timestamp);
    
    // 转换为北京时间（UTC+8）
    const beijingTime = new Date(date.getTime() + (8 * 60 * 60 * 1000));
    
    // 格式化为本地时间字符串
    return beijingTime.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });
  };
  const location = useLocation();
  const [activeTab, setActiveTab] = useState('basic');
  const [isEditing, setIsEditing] = useState(false);
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [showAvatarSuccessDialog, setShowAvatarSuccessDialog] = useState(false);
  const [showLogoutConfirmDialog, setShowLogoutConfirmDialog] = useState(false);
  const [showDeleteAccountConfirmDialog, setShowDeleteAccountConfirmDialog] = useState(false);
  const [formData, setFormData] = useState({
    old_password: '',
    new_password: '',
    confirm_password: '',
    security_answer: '',
    delete_password: '',
    delete_security_answer: '',
    username: '',
    email: '',
    phone: '',
    bio: '',
    nickname: ''
  });
  const [errors, setErrors] = useState({});
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  
  // 密码验证相关状态
  const [passwordMismatch, setPasswordMismatch] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState({ level: 0, text: '', color: '' });
  
  // 密码强度检测函数
  const checkPasswordStrength = (password) => {
    if (!password) {
      return { level: 0, text: '', color: '' };
    }
    
    let score = 0;
    let feedback = [];
    
    // 长度检查
    if (password.length >= 8) score += 1;
    else feedback.push('至少8位');
    
    // 包含数字
    if (/\d/.test(password)) score += 1;
    else feedback.push('包含数字');
    
    // 包含小写字母
    if (/[a-z]/.test(password)) score += 1;
    else feedback.push('包含小写字母');
    
    // 包含大写字母
    if (/[A-Z]/.test(password)) score += 1;
    else feedback.push('包含大写字母');
    
    // 包含特殊字符
    if (/[^\w\s]/.test(password)) score += 1;
    else feedback.push('包含特殊字符');
    
    let level, text, color;
    
    if (score <= 1) {
      level = 1;
      text = '弱';
      color = 'text-red-400';
    } else if (score <= 2) {
      level = 2;
      text = '一般';
      color = 'text-yellow-400';
    } else if (score <= 3) {
      level = 3;
      text = '较强';
      color = 'text-blue-400';
    } else {
      level = 4;
      text = '强';
      color = 'text-green-400';
    }
    
    return { level, text, color, feedback: feedback.join('、') };
  };
  
  // 删除请求确认弹窗状态
  const [showDeleteRequestModal, setShowDeleteRequestModal] = useState(false);
  const [deleteRequestAction, setDeleteRequestAction] = useState(null);
  const [deleteRequestMessageId, setDeleteRequestMessageId] = useState(null);
  
  // 删除请求结果弹窗状态
  const [showDeleteRequestResultModal, setShowDeleteRequestResultModal] = useState(false);
  const [deleteRequestResultMessage, setDeleteRequestResultMessage] = useState('');
  const [deleteRequestResultType, setDeleteRequestResultType] = useState('success'); // 'success' or 'error'
  
  // 消息折叠状态管理
  const [collapsedMessages, setCollapsedMessages] = useState(new Set());
  
  // 切换消息折叠状态
  const toggleMessageCollapse = (messageId) => {
    setCollapsedMessages(prev => {
      const newSet = new Set(prev);
      if (newSet.has(messageId)) {
        newSet.delete(messageId);
      } else {
        newSet.add(messageId);
      }
      return newSet;
    });
  };
  
  // 处理"好的"按钮点击（将已同意删除的消息标记为已读）
  const handleOkButtonClick = (messageId) => {
    markAsRead('records', messageId);
    fetchNotifications(); // 刷新通知列表
  };
  
  // 翻译函数
  const translateEventType = (eventType) => {
    const eventTypeMap = {
      'wedding': '结婚',
      'birth': '满月',
      'graduation': '升学',
      'birthday': '生日',
      'moving': '乔迁',
      'funeral': '白事',
      'casual': '无事酒',
      'housewarming': '乔迁',
      'baby_shower': '满月',
      'promotion': '升职',
      'anniversary': '周年纪念',
      'festival': '节日',
      'other': '其他'
    };
    return eventTypeMap[eventType] || eventType;
  };
  
  const translateRelationType = (relationType) => {
    const relationTypeMap = {
      'relative': '亲戚',
      'friend': '朋友',
      'colleague': '同事',
      'classmate': '同学',
      'neighbor': '邻居',
      'family': '家人',
      'other': '其他'
    };
    return relationTypeMap[relationType] || relationType;
  };
  
  // 当前选中的消息板块
  const [selectedCategory, setSelectedCategory] = useState('system');
  const [messageViewMode, setMessageViewMode] = useState({
    system: 'unread',
    family: 'unread', 
    records: 'unread',
    delete_request: 'unread'
  });
  
  // 处理消息板块点击事件
  const handleCategoryClick = (category) => {
    setSelectedCategory(category);
  };
  
  // 切换消息查看模式（未读/已读）
  const handleViewModeToggle = (category, mode) => {
    setMessageViewMode(prev => ({
      ...prev,
      [category]: mode
    }));
  };
  
  // 标记单条消息为已读
  const handleMarkAsRead = (category, messageId) => {
    markAsRead(category, messageId);
  };
  
  // 标记所有消息为已读
  const handleMarkAllAsRead = async (category) => {
    await markCategoryAsRead(category);
  };
  
  // 清除已读消息
  const handleClearReadMessages = async (category) => {
    await clearCategory(category);
  };

  // 格式化成员注销退出家庭通知的颜色
  const formatMemberDeregistrationNotification = (content) => {
    // 匹配格式: "用户名 因注销账号已退出家庭 "家庭名"，退出时间：时间"
    const regex = /^(.+?)\s因注销账号已退出家庭\s"(.+?)"，退出时间：(.+)$/;
    const match = content.match(regex);
    
    if (match) {
      const [, username, familyName, exitTime] = match;
      return (
        <span className="text-white/80 text-xs">
          <span className="text-blue-400 font-semibold">{username}</span>
          {' 因注销账号已退出家庭 '}
          <span className="text-red-400 font-semibold">"{familyName}"</span>
          {'，退出时间：'}
          <span className="text-green-400 font-medium">{exitTime}</span>
        </span>
      );
    }
    
    return <span className="text-white/80 text-xs">{content}</span>;
  };



  // 处理URL参数，自动切换到对应的标签页
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const tabParam = searchParams.get('tab');
    const categoryParam = searchParams.get('category');
    const modeParam = searchParams.get('mode');
    
    if (tabParam === 'messages') {
      setActiveTab('notifications');
      
      // 如果指定了分类，自动选择该分类
      if (categoryParam && ['records', 'family', 'system'].includes(categoryParam)) {
        setSelectedCategory(categoryParam);
      }
      
      // 如果指定了查看模式，自动设置查看模式
      if (modeParam && categoryParam && ['unread', 'read'].includes(modeParam)) {
        setMessageViewMode(prev => ({
          ...prev,
          [categoryParam]: modeParam
        }));
      }
    }
  }, [location.search]);

  // 监听通知变化，设置删除请求消息的默认折叠状态
  useEffect(() => {
    if (notifications && notifications.delete_request && notifications.delete_request.messages && Array.isArray(notifications.delete_request.messages)) {
      const deleteRequestIds = notifications.delete_request.messages.map(msg => msg.id);
      setCollapsedMessages(prev => {
        const newSet = new Set(prev);
        deleteRequestIds.forEach(id => {
          newSet.add(id); // 默认折叠（添加到Set中表示折叠）
        });
        return newSet;
      });
    }
  }, [notifications]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
    setError('');
    setSuccess('');
    
    // 密码强度检测
    if (name === 'new_password') {
      const strength = checkPasswordStrength(value);
      setPasswordStrength(strength);
    }
    
    // 实时验证确认密码是否一致
    if (name === 'confirm_password' || (name === 'new_password' && formData.confirm_password)) {
      const newPassword = name === 'new_password' ? value : formData.new_password;
      const confirmPassword = name === 'confirm_password' ? value : formData.confirm_password;
      
      if (confirmPassword && newPassword !== confirmPassword) {
        setPasswordMismatch(true);
      } else {
        setPasswordMismatch(false);
      }
    }
  };

  // 初始化编辑数据
  const handleEditProfile = () => {
    setFormData(prev => ({
      ...prev,
      username: user?.username || '',
      email: user?.email || '',
      phone: user?.phone || '',
      bio: user?.bio || '',
      nickname: user?.nickname || ''
    }));
    setIsEditing(true);
    setErrors({});
    setSuccess('');
  };

  // 取消编辑
  const handleCancelEdit = () => {
    setIsEditing(false);
    setFormData(prev => ({
      ...prev,
      username: '',
      email: '',
      phone: '',
      bio: ''
    }));
    setErrors({});
    setSuccess('');
  };

  // 处理头像文件选择
  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setAvatarFile(file);
      // 创建预览URL
      const reader = new FileReader();
      reader.onload = (e) => {
        setAvatarPreview(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // 上传头像
  const handleAvatarUpload = async () => {
    if (!avatarFile) return;

    setUploadingAvatar(true);
    setErrors({});
    setSuccess('');

    try {
      const token = localStorage.getItem('token');
      const formData = new FormData();
      formData.append('avatar', avatarFile);

      const response = await fetch('/api/user/upload-avatar', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        credentials: 'include',
        body: formData
      });

      const data = await response.json();

      if (response.ok) {
        setAvatarFile(null);
        setAvatarPreview(null);
        // 更新用户上下文中的头像数据
        if (data.avatar) {
          updateUser({ avatar: data.avatar });
        }
        // 显示成功弹窗
        setShowAvatarSuccessDialog(true);
        // 3秒后自动关闭弹窗
        setTimeout(() => {
          setShowAvatarSuccessDialog(false);
        }, 3000);
      } else {
        setErrorMessage(data.message || '头像上传失败，请重试');
        setShowErrorModal(true);
      }
    } catch (error) {
      console.error('头像上传失败:', error);
      setErrorMessage('网络错误，请重试');
      setShowErrorModal(true);
    } finally {
      setUploadingAvatar(false);
    }
  };

  // 处理删除请求的函数
  const handleDeleteRequest = async (action, messageId) => {
    try {
      const response = await fetch(`/api/notifications/${messageId}/delete-response`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ action }),
      });
      
      if (response.ok) {
        // 自动标记为已处理
        markAsRead(messageId);
        setDeleteRequestResultMessage(action === 'approve' ? '已同意删除请求，记录已删除' : '已拒绝删除请求');
        setDeleteRequestResultType('success');
        setShowDeleteRequestResultModal(true);
        // 刷新通知
        fetchNotifications();
        
        // 如果是同意操作，跳转到记录消息页面
        if (action === 'approve') {
          setTimeout(() => {
            navigate('/profile?tab=messages&category=records');
          }, 1500); // 延迟1.5秒让用户看到成功提示
        }
      } else {
        const data = await response.json();
        setDeleteRequestResultMessage(data.error || '操作失败');
        setDeleteRequestResultType('error');
        setShowDeleteRequestResultModal(true);
      }
    } catch (error) {
      setDeleteRequestResultMessage('网络错误，请重试');
      setDeleteRequestResultType('error');
      setShowDeleteRequestResultModal(true);
    }
    
    // 关闭弹窗
    setShowDeleteRequestModal(false);
    setDeleteRequestAction(null);
    setDeleteRequestMessageId(null);
  };

  // 显示删除请求确认弹窗
  const showDeleteRequestConfirm = (action, messageId) => {
    setDeleteRequestAction(action);
    setDeleteRequestMessageId(messageId);
    setShowDeleteRequestModal(true);
  };

  // 保存资料修改
  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrors({});
    setSuccess('');

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/user/update-profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        credentials: 'include',
        body: JSON.stringify({
          bio: formData.bio,
          nickname: formData.nickname
        })
      });

      const data = await response.json();

      if (response.ok) {
        setSuccessMessage('资料修改成功！');
        setShowSuccessDialog(true);
        setIsEditing(false);
        // 更新用户上下文中的数据
        updateUser({
          bio: formData.bio,
          nickname: formData.nickname
        });
      } else {
        setErrorMessage(data.message || '修改失败，请重试');
        setShowErrorModal(true);
      }
    } catch (error) {
      console.error('修改资料失败:', error);
      setErrorMessage('网络错误，请重试');
      setShowErrorModal(true);
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    
    if (!formData.old_password || !formData.new_password || !formData.confirm_password || !formData.security_answer) {
      setErrorMessage('所有字段都不能为空');
      setShowErrorModal(true);
      return;
    }
    
    if (formData.new_password !== formData.confirm_password) {
      setErrorMessage('两次输入的新密码不一致');
      setShowErrorModal(true);
      return;
    }
    
    if (formData.new_password.length < 6) {
      setErrorMessage('新密码长度至少6位');
      setShowErrorModal(true);
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          old_password: formData.old_password,
          new_password: formData.new_password,
          confirm_password: formData.confirm_password,
          security_answer: formData.security_answer
        }),
      });

      const data = await response.json();
      if (response.ok) {
        setSuccessMessage('密码修改成功！');
        setShowSuccessDialog(true);
        setFormData({
          ...formData,
          old_password: '',
          new_password: '',
          confirm_password: '',
          security_answer: ''
        });
      } else {
        setErrorMessage(data.error || '密码修改失败');
        setShowErrorModal(true);
      }
    } catch (error) {
      setErrorMessage('网络错误，请重试');
      setShowErrorModal(true);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async (e) => {
    e.preventDefault();
    
    if (!formData.delete_password || !formData.delete_security_answer) {
      setErrorMessage('密码和密保答案不能为空');
      setShowErrorModal(true);
      return;
    }

    if (!formData.delete_confirmation || formData.delete_confirmation !== '确认注销') {
      setErrorMessage('请输入"确认注销"以继续');
      setShowErrorModal(true);
      return;
    }

    // 显示自定义确认弹窗
    setShowDeleteAccountConfirmDialog(true);
  };

  // 确认注销账号
  const confirmDeleteAccount = async () => {
    setShowDeleteAccountConfirmDialog(false);
    setLoading(true);
    try {
      const response = await fetch('/api/delete-account', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          password: formData.delete_password,
          security_answer: formData.delete_security_answer
        }),
      });

      const data = await response.json();
      if (response.ok) {
        setSuccessMessage('账号注销成功，即将跳转到登录页面...');
        setShowSuccessDialog(true);
        setTimeout(() => {
          logout();
        }, 2000);
      } else {
        setErrorMessage(data.error || '账号注销失败');
        setShowErrorModal(true);
      }
    } catch (error) {
      setErrorMessage('网络错误，请重试');
      setShowErrorModal(true);
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: 'basic', label: '账号信息', icon: User },
    { id: 'notifications', label: '消息通知', icon: Bell },
    { id: 'edit', label: '编辑资料', icon: Edit },
    { id: 'password', label: '修改密码', icon: Lock },
    { id: 'logout', label: '退出登录', icon: LogOut },
    { id: 'delete', label: '注销账号', icon: Trash2 }
  ];

  return (
    <div className="min-h-screen p-2 lg:p-4">
      <div className="max-w-6xl mx-auto">
        {/* 统一的大卡片容器 */}
        <Card className="shadow-2xl border-0 hover:shadow-3xl transition-all duration-500 bg-gradient-to-br from-blue-600/15 via-indigo-600/12 to-purple-700/15 border border-blue-400/30 group hover:border-blue-400/50 transform p-0">
          {/* 页面标题区域 */}
          <CardHeader className="relative z-10 p-0 mb-0">
            <CardTitle className="bg-gradient-to-r from-blue-500/25 to-indigo-600/25 rounded-t-lg border-b border-blue-400/35 w-full">
              <div className="flex items-center justify-start space-x-4 text-xl text-white px-4 py-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 via-indigo-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:scale-110">
                  <User className="w-5 h-5 text-white" />
                </div>
                <div className="flex flex-col justify-center">
                  <span className="font-bold tracking-wide pb-1 mb-2 inline-block relative">
                     个人中心
                     <div className="absolute -bottom-1 left-0 w-full h-0.5 bg-gradient-to-r from-blue-400 via-blue-300 to-blue-200 opacity-80"></div>
                   </span>
                </div>
              </div>
              <div className="h-0.5 bg-gradient-to-r from-blue-300/50 via-indigo-300/50 to-blue-300/50 w-full"></div>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 relative z-10 -mt-5">
            <p className="text-white/70 text-base font-medium mb-4">管理您的账号信息和设置</p>

        {/* 错误和成功提示 */}
        {error && (
          <Alert className="border-red-200 bg-red-50 shadow-lg border-0 rounded-2xl">
            <AlertDescription className="text-red-600 font-medium">
              {error}
            </AlertDescription>
          </Alert>
        )}



            {/* 主要内容区域 */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-3">
              {/* 侧边栏 */}
              <div className="lg:col-span-1">
                <div className="bg-white/5 border border-white/10 rounded-2xl p-3 lg:p-4">
                <nav className="space-y-3">
                  {/* 移动端水平滚动菜单 */}
                  <div className="lg:hidden flex space-x-2 overflow-x-auto pb-2">
                    {tabs.map((tab) => {
                      const Icon = tab.icon;
                      return (
                        <button
                          key={tab.id}
                          onClick={() => {
                            if (tab.id === 'edit') {
                              handleEditProfile();
                              setActiveTab('edit');
                            } else if (tab.id === 'logout') {
                              setActiveTab('logout');
                              setIsEditing(false);
                              setErrors({});
                              setSuccess('');
                            } else {
                              setActiveTab(tab.id);
                              setIsEditing(false);
                              setErrors({});
                              setSuccess('');
                            }
                          }}
                          className={`flex-shrink-0 flex flex-col items-center space-y-1 px-4 py-3 rounded-2xl transition-all duration-300 min-w-[80px] ${
                            activeTab === tab.id
                              ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg'
                              : 'text-slate-300 hover:text-white hover:bg-slate-700/50 hover:shadow-md'
                          }`}
                        >
                          <Icon className="w-5 h-5" />
                          <span className="text-xs font-medium text-center">{tab.label}</span>
                        </button>
                      );
                    })}
                  </div>
                  
                  {/* 桌面端垂直菜单 */}
                  <div className="hidden lg:block space-y-3">
                    {tabs.map((tab) => {
                      const Icon = tab.icon;
                      return (
                        <button
                          key={tab.id}
                          onClick={() => {
                            if (tab.id === 'edit') {
                              handleEditProfile();
                              setActiveTab('edit');
                            } else if (tab.id === 'logout') {
                               setActiveTab('logout');
                               setIsEditing(false);
                               setErrors({});
                               setSuccess('');
                             } else {
                              setActiveTab(tab.id);
                              setIsEditing(false);
                              setErrors({});
                              setSuccess('');
                            }
                          }}
                          className={`w-full flex items-center space-x-3 px-4 py-3 rounded-2xl text-left transition-all duration-300 transform hover:-translate-y-0.5 ${
                            activeTab === tab.id
                              ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg'
                              : (tab.id === 'logout'
                                  ? 'text-yellow-400 hover:text-yellow-300 hover:bg-slate-700/50 hover:shadow-md'
                                  : tab.id === 'delete'
                                  ? 'text-red-400 hover:text-red-300 hover:bg-slate-700/50 hover:shadow-md'
                                  : 'text-slate-300 hover:text-white hover:bg-slate-700/50 hover:shadow-md')
                          }`}
                        >
                          <Icon className="w-5 h-5" />
                          <span className="font-medium">{tab.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </nav>
                </div>
              </div>

              {/* 主内容区 */}
              <div className="lg:col-span-3">
                {(activeTab === 'basic' || activeTab === 'edit') && (
                  <div className="bg-white/5 border border-white/10 rounded-2xl">
                    <div className="p-4 border-b border-white/10">
                      <h3 className="text-2xl font-bold text-white mb-2">
                          {isEditing ? '编辑资料' : '基本信息'}
                      </h3>
                      <p className="text-white/70 text-base">
                        {isEditing ? '修改您的个人资料信息' : '查看您的账户基本信息'}
                      </p>
                    </div>
                    <div className="p-4">
                  {/* 用户信息区域 - QQ风格布局 */}
                   <div className="flex items-start space-x-6 mb-6">
                     {/* 头像区域 */}
                     <div className="relative flex-shrink-0">
                       <div 
                         className="w-24 h-24 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-2xl cursor-pointer hover:shadow-3xl transition-all duration-300 transform hover:scale-105 overflow-hidden"
                         onClick={() => isEditing && document.getElementById('avatar-upload').click()}
                       >
                         {avatarPreview ? (
                           <img 
                             src={avatarPreview} 
                             alt="头像预览" 
                             className="w-full h-full object-cover"
                           />
                         ) : user?.avatar ? (
                           <img 
                             src={user.avatar} 
                             alt="用户头像" 
                             className="w-full h-full object-cover"
                           />
                         ) : (
                           <User className="w-12 h-12 text-white" />
                         )}
                       </div>
                       {isEditing && (
                         <div 
                           className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity duration-300"
                           onClick={() => document.getElementById('avatar-upload').click()}
                         >
                           <Camera className="w-6 h-6 text-white" />
                         </div>
                       )}
                     </div>
                     
                     {/* 用户信息区域 */}
                     <div className="flex-1 min-w-0">
                       {/* 昵称 */}
                       <div className="mb-2">
                         <h2 className="text-2xl font-bold text-white truncate">
                           {user?.nickname || user?.username || '未设置昵称'}
                         </h2>
                       </div>
                       
                       {/* 用户名和注册时间 */}
                       <div className="space-y-1">
                         <div className="flex items-center space-x-2">
                           <User className="w-4 h-4 text-white/60" />
                           <span className="text-white/80 text-sm">账号：</span>
                           <span className="text-white text-sm">{user?.username}</span>
                         </div>
                         <div className="flex items-center space-x-2">
                           <Calendar className="w-4 h-4 text-white/60" />
                           <span className="text-white/80 text-sm">注册时间：</span>
                           <span className="text-white text-sm">
                             {user?.created_at ? (() => {
                               const date = new Date(user.created_at);
                               const beijingTime = new Date(date.getTime() + (8 * 60 * 60 * 1000));
                               return beijingTime.toLocaleDateString('zh-CN', {
                                 year: 'numeric',
                                 month: 'long',
                                 day: 'numeric'
                               });
                             })() : '未知'}
                           </span>
                         </div>
                       </div>
                     </div>
                     
                     {/* 右侧区域 */}
                     <div className="flex-shrink-0 w-64">
                       {!isEditing ? (
                         <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                           <div className="flex items-center space-x-3">
                             <div className="w-10 h-10 bg-green-500/20 rounded-xl flex items-center justify-center">
                               <Star className="w-5 h-5 text-green-400" />
                             </div>
                             <div className="flex-1">
                               <p className="text-sm text-white/60">个人简介</p>
                               <p className="text-base font-semibold text-white">
                                 {user?.bio || '暂无个人简介'}
                               </p>
                             </div>
                           </div>
                         </div>
                       ) : (
                         <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                           <p className="text-sm text-white/80 text-center">
                             点击头像即可上传头像图片
                           </p>
                         </div>
                       )}
                     </div>
                   </div>
                   
                   {/* 隐藏的文件输入框 */}
                   <input
                     id="avatar-upload"
                     type="file"
                     accept="image/*"
                     onChange={handleAvatarChange}
                     className="hidden"
                   />
                   
                   {/* 头像上传控制区域 */}
                   {isEditing && avatarFile && (
                     <div className="mb-6">
                       <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                         <p className="text-sm text-white/80 mb-3">已选择文件: {avatarFile.name}</p>
                         <div className="flex space-x-3">
                           <Button
                             type="button"
                             onClick={handleAvatarUpload}
                             disabled={uploadingAvatar}
                             className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white px-4 py-2 rounded-xl font-semibold transition-all duration-300 shadow-lg hover:shadow-xl"
                           >
                             <Upload className="w-4 h-4 mr-2" />
                             {uploadingAvatar ? '上传中...' : '上传头像'}
                           </Button>
                           <Button
                             type="button"
                             onClick={() => {
                               setAvatarFile(null);
                               setAvatarPreview(null);
                             }}
                             className="bg-gradient-to-r from-slate-500 to-slate-600 hover:from-slate-600 hover:to-slate-700 text-white px-4 py-2 rounded-xl font-semibold transition-all duration-300 shadow-lg hover:shadow-xl"
                           >
                             <X className="w-4 h-4 mr-2" />
                             取消
                           </Button>
                         </div>
                       </div>
                     </div>
                   )}

                  {/* 错误和成功消息 */}
                  {(errors.general || errors.avatar) && (
                    <Alert className="mb-6 border-red-200 bg-gradient-to-r from-red-50 to-pink-50 rounded-2xl shadow-lg">
                      <AlertDescription className="text-red-700 font-medium">
                        {errors.general || errors.avatar}
                      </AlertDescription>
                    </Alert>
                  )}


                  {!isEditing ? (
                    <>
                    </>
                  ) : (
                    <>
                      {/* 编辑表单 */}
                       <form onSubmit={handleSaveProfile} className="space-y-4">
                         <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 lg:gap-4">
                           <div className="space-y-2">
                             <Label htmlFor="nickname" className="text-blue-300 font-semibold text-sm lg:text-base">昵称</Label>
                             <Input
                               id="nickname"
                               name="nickname"
                               type="text"
                               placeholder="请输入昵称"
                               value={formData.nickname}
                               onChange={handleInputChange}
                               className="h-11 lg:h-12 rounded-2xl border-2 border-white/20 focus:border-blue-500 transition-all duration-300 text-sm lg:text-base bg-white/10 text-white placeholder:text-white/50"
                             />
                           </div>

                           <div className="space-y-2">
                             <Label htmlFor="bio" className="text-blue-300 font-semibold text-sm lg:text-base">个人简介</Label>
                             <Input
                               id="bio"
                               name="bio"
                               type="text"
                               placeholder="请输入个人简介"
                               value={formData.bio}
                               onChange={handleInputChange}
                               className="h-11 lg:h-12 rounded-2xl border-2 border-white/20 focus:border-blue-500 transition-all duration-300 text-sm lg:text-base bg-white/10 text-white placeholder:text-white/50"
                             />
                           </div>
                         </div>

                         {/* 操作按钮 */}
                         <div className="flex flex-col sm:flex-row gap-2 lg:gap-3 pt-3">
                           <Button 
                             type="submit"
                             disabled={loading}
                             className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white py-3 px-4 lg:px-6 rounded-2xl font-semibold transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 text-sm lg:text-base h-11 lg:h-12"
                           >
                             <Save className="w-4 h-4 lg:w-5 lg:h-5 mr-2" />
                             {loading ? '保存中...' : '保存修改'}
                           </Button>
                           <Button 
                             type="button"
                             onClick={handleCancelEdit}
                             className="flex-1 bg-gradient-to-r from-slate-500 to-slate-600 hover:from-slate-600 hover:to-slate-700 text-white py-3 px-4 lg:px-6 rounded-2xl font-semibold transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 text-sm lg:text-base h-11 lg:h-12"
                           >
                             <X className="w-4 h-4 lg:w-5 lg:h-5 mr-2" />
                             取消
                           </Button>
                         </div>
                       </form>
                    </>
                  )}
                    </div>
                  </div>
                )}

                {activeTab === 'password' && (
                  <div className="bg-white/5 border border-white/10 rounded-2xl">
                    <div className="p-4 border-b border-white/10">
                      <h3 className="text-2xl font-bold text-white mb-2">修改密码</h3>
                      <p className="text-white/70 text-base">更改您的登录密码以保护账号安全</p>
                    </div>
                    <div className="p-4">
                 <form onSubmit={handleChangePassword} className="space-y-3">
                   <div className="space-y-2">
                     <Label htmlFor="old_password" className="text-blue-300 font-semibold text-sm lg:text-base">当前密码</Label>
                     <Input
                       id="old_password"
                       name="old_password"
                       type="password"
                       placeholder="请输入当前密码"
                       value={formData.old_password}
                       onChange={handleInputChange}
                       className="h-11 lg:h-12 rounded-2xl border-2 border-white/20 focus:border-blue-500 transition-all duration-300 text-sm lg:text-base bg-white/10 text-white placeholder:text-white/50"
                     />
                   </div>

                   <div className="space-y-2">
                     <Label htmlFor="new_password" className="text-blue-300 font-semibold text-sm lg:text-base">新密码</Label>
                     <Input
                       id="new_password"
                       name="new_password"
                       type="password"
                       placeholder="请输入新密码（至少8位）"
                       value={formData.new_password}
                       onChange={handleInputChange}
                       className="h-11 lg:h-12 rounded-2xl border-2 border-white/20 focus:border-blue-500 transition-all duration-300 text-sm lg:text-base bg-white/10 text-white placeholder:text-white/50"
                     />
                     {formData.new_password && (
                       <div className="flex items-center text-xs space-x-1">
                         <span className="text-white/60">密码强度：</span>
                         <div className="flex items-center space-x-2">
                           <div className="flex space-x-1">
                             {[1, 2, 3, 4].map((level) => (
                               <div
                                 key={level}
                                 className={`w-4 h-1 rounded-full transition-all duration-300 ${
                                   level <= passwordStrength.level
                                     ? passwordStrength.level === 1
                                       ? 'bg-red-400'
                                       : passwordStrength.level === 2
                                       ? 'bg-yellow-400'
                                       : passwordStrength.level === 3
                                       ? 'bg-blue-400'
                                       : 'bg-green-400'
                                     : 'bg-white/20'
                                 }`}
                               />
                             ))}
                           </div>
                           <span className={`font-medium ${passwordStrength.color}`}>
                             {passwordStrength.text}
                           </span>
                         </div>
                       </div>
                     )}
                     {passwordStrength.feedback && passwordStrength.level < 4 && (
                       <p className="text-xs text-white/60">建议：{passwordStrength.feedback}</p>
                     )}
                   </div>

                   <div className="space-y-2">
                     <div className="flex items-center space-x-2">
                       <Label htmlFor="confirm_password" className="text-blue-300 font-semibold text-sm lg:text-base">确认新密码</Label>
                       {passwordMismatch && formData.confirm_password && (
                         <span className="text-red-400 text-xs font-medium animate-pulse">密码不一致</span>
                       )}
                     </div>
                     <Input
                       id="confirm_password"
                       name="confirm_password"
                       type="password"
                       placeholder="请再次输入新密码"
                       value={formData.confirm_password}
                       onChange={handleInputChange}
                       className={`h-11 lg:h-12 rounded-2xl border-2 transition-all duration-300 text-sm lg:text-base bg-white/10 text-white placeholder:text-white/50 ${
                         passwordMismatch && formData.confirm_password
                           ? 'border-red-400 focus:border-red-500'
                           : 'border-white/20 focus:border-blue-500'
                       }`}
                     />
                   </div>

                   <div className="space-y-2">
                     <Label htmlFor="security_answer" className="text-blue-300 font-semibold text-sm lg:text-base">密保答案</Label>
                     <p className="text-xs lg:text-sm text-white/80 mb-2 bg-white/10 p-2 lg:p-3 rounded-xl">
                       密保问题：{user?.security_question || '未设置密保问题'}
                     </p>
                     <Input
                       id="security_answer"
                       name="security_answer"
                       type="text"
                       placeholder="请输入密保问题的答案"
                       value={formData.security_answer}
                       onChange={handleInputChange}
                       className="h-11 lg:h-12 rounded-2xl border-2 border-white/20 focus:border-blue-500 transition-all duration-300 text-sm lg:text-base bg-white/10 text-white placeholder:text-white/50"
                     />
                   </div>

                   <Button 
                     type="submit" 
                     className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white py-3 px-4 lg:px-6 rounded-2xl font-semibold transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 h-11 lg:h-12 text-sm lg:text-base"
                     disabled={loading}
                   >
                     {loading ? '修改中...' : '修改密码'}
                   </Button>
                       </form>
                     </div>
                   </div>
                 )}

                {activeTab === 'delete' && (
                  <div className="bg-white/5 border border-white/10 rounded-2xl">
                    <div className="p-4 border-b border-white/10">
                      <h3 className="text-2xl font-bold text-red-400 mb-2">注销账号</h3>
                      <p className="text-white/70 text-base">
                        注销后账号将无法恢复，请谨慎操作
                      </p>
                    </div>
                    <div className="p-4">
                   <form onSubmit={handleDeleteAccount} className="space-y-3">
                     <div className="space-y-2">
                       <Label htmlFor="delete_password" className="text-red-300 font-semibold text-sm lg:text-base">确认密码</Label>
                       <Input
                         id="delete_password"
                         name="delete_password"
                         type="password"
                         placeholder="请输入密码确认身份"
                         value={formData.delete_password}
                         onChange={handleInputChange}
                         className="h-11 lg:h-12 rounded-2xl border-2 border-white/20 focus:border-red-500 transition-all duration-300 text-sm lg:text-base bg-white/10 text-white placeholder:text-white/50"
                       />
                     </div>

                     <div className="space-y-2">
                       <Label htmlFor="delete_security_answer" className="text-red-300 font-semibold text-sm lg:text-base">密保答案</Label>
                       <p className="text-xs lg:text-sm text-white/80 mb-2 bg-white/10 p-2 lg:p-3 rounded-xl">
                         密保问题：{user?.security_question || '未设置密保问题'}
                       </p>
                       <Input
                         id="delete_security_answer"
                         name="delete_security_answer"
                         type="text"
                         placeholder="请输入密保问题的答案"
                         value={formData.delete_security_answer}
                         onChange={handleInputChange}
                         className="h-11 lg:h-12 rounded-2xl border-2 border-white/20 focus:border-red-500 transition-all duration-300 text-sm lg:text-base bg-white/10 text-white placeholder:text-white/50"
                       />
                     </div>

                     <div className="space-y-2">
                       <Label htmlFor="delete_confirmation" className="text-red-300 font-semibold text-sm lg:text-base">确认注销</Label>
                       <Input
                         id="delete_confirmation"
                         name="delete_confirmation"
                         type="text"
                         placeholder="请输入 '确认注销' 以继续"
                         value={formData.delete_confirmation}
                         onChange={handleInputChange}
                         className="h-11 lg:h-12 rounded-2xl border-2 border-white/20 focus:border-red-500 transition-all duration-300 text-sm lg:text-base bg-white/10 text-white placeholder:text-white/50"
                       />

                     </div>

                     <div className="bg-red-500/10 border-2 border-red-400/30 rounded-xl p-2 lg:p-3">
                       <div className="flex items-start space-x-1.5 lg:space-x-2">
                         <div className="w-6 h-6 lg:w-8 lg:h-8 bg-red-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                           <Trash2 className="w-3 h-3 lg:w-4 lg:h-4 text-red-400" />
                         </div>
                         <div>
                           <h4 className="text-xs lg:text-sm font-bold text-red-300 mb-1 lg:mb-1.5">
                             注意事项
                           </h4>
                           <ul className="text-xs text-red-200 space-y-0.5 lg:space-y-1">
                             <li className="flex items-center space-x-1">
                               <div className="w-0.5 h-0.5 lg:w-1 lg:h-1 bg-red-400 rounded-full"></div>
                               <span>账号注销后无法恢复</span>
                             </li>
                             <li className="flex items-center space-x-1">
                               <div className="w-0.5 h-0.5 lg:w-1 lg:h-1 bg-red-400 rounded-full"></div>
                               <span>所有相关数据会被删除</span>
                             </li>
                             <li className="flex items-center space-x-1">
                               <div className="w-0.5 h-0.5 lg:w-1 lg:h-1 bg-red-400 rounded-full"></div>
                               <span>如需重新使用需要重新注册</span>
                             </li>
                           </ul>
                         </div>
                       </div>
                     </div>

                     <Button 
                       type="submit" 
                       className="w-full bg-gradient-to-r from-red-600 to-red-800 hover:from-red-700 hover:to-red-900 text-white py-3 px-4 lg:px-6 rounded-2xl font-semibold transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 h-11 lg:h-12 text-sm lg:text-base"
                       disabled={loading}
                     >
                       {loading ? '注销中...' : '确认注销账号'}
                     </Button>
                     </form>
                     </div>
                   </div>
                 )}

                {activeTab === 'notifications' && (
                  <div className="bg-white/5 border border-white/10 rounded-2xl">
                    <div className="p-4 border-b border-white/10">
                      <h3 className="text-2xl font-bold text-white mb-2">消息通知</h3>
                      <p className="text-white/70 text-base">查看您的系统通知、家庭动态和记录消息</p>
                    </div>
                    <div className="p-4">
                      <div className="space-y-6">
                        {/* 消息分类板块 */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                          {/* 记录消息 */}
                          <div className="relative">
                            <div className={`border rounded-xl p-4 cursor-pointer transform transition-all duration-300 ease-in-out ${
                              selectedCategory === 'records' 
                                ? 'bg-blue-500/20 border-blue-400/50 shadow-lg shadow-blue-500/25' 
                                : 'bg-blue-500/10 border-blue-400/30 hover:bg-blue-500/20 hover:scale-110 hover:shadow-lg hover:shadow-blue-500/30'
                            }`} onClick={() => handleCategoryClick('records')}>
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center space-x-2">
                                <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                  </svg>
                                </div>
                                <h4 className="text-white font-semibold">记录消息</h4>
                              </div>
                              <div className="relative">
                                {notifications.records.unread > 0 && (
                                  <span className="bg-blue-500 text-white text-xs px-2 py-1 rounded-full font-medium">{notifications.records.unread}</span>
                                )}
                              </div>
                            </div>
                              <p className="text-white/70 text-sm">礼金记录添加、删除、修改等</p>
                              <div className="mt-3 text-xs text-blue-300">{notifications.records.unread}条未读消息</div>
                            </div>
                          </div>
                          
                          {/* 删除请求 */}
                          <div className="relative">
                            <div className={`border rounded-xl p-4 cursor-pointer transform transition-all duration-300 ease-in-out ${
                              selectedCategory === 'delete_request' 
                                ? 'bg-red-500/20 border-red-400/50 shadow-lg shadow-red-500/25' 
                                : 'bg-red-500/10 border-red-400/30 hover:bg-red-500/20 hover:scale-110 hover:shadow-lg hover:shadow-red-500/30'
                            }`} onClick={() => handleCategoryClick('delete_request')}>
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center space-x-2">
                                <div className="w-8 h-8 bg-red-500 rounded-lg flex items-center justify-center">
                                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                  </svg>
                                </div>
                                <h4 className="text-white font-semibold">删除请求</h4>
                              </div>
                              <div className="relative">
                                {notifications.delete_request.unread > 0 && (
                                  <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full font-medium">{notifications.delete_request.unread}</span>
                                )}
                              </div>
                            </div>
                              <p className="text-white/70 text-sm">其他家庭成员请求删除您的礼金记录时的通知提醒</p>
                              <div className="mt-3 text-xs text-red-300">{notifications.delete_request.unread}个未处理请求</div>
                            </div>
                          </div>

                          {/* 家庭管理 */}
                          <div className="relative">
                            <div className={`border rounded-xl p-4 cursor-pointer transform transition-all duration-300 ease-in-out ${
                              selectedCategory === 'family' 
                                ? 'bg-green-500/20 border-green-400/50 shadow-lg shadow-green-500/25' 
                                : 'bg-green-500/10 border-green-400/30 hover:bg-green-500/20 hover:scale-110 hover:shadow-lg hover:shadow-green-500/30'
                            }`} onClick={() => handleCategoryClick('family')}>
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center space-x-2">
                                <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center">
                                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                  </svg>
                                </div>
                                <h4 className="text-white font-semibold">家庭管理</h4>
                              </div>
                              <div className="relative">
                                {notifications.family.unread > 0 && (
                                  <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full font-medium">{notifications.family.unread}</span>
                                )}
                              </div>
                            </div>
                              <p className="text-white/70 text-sm">家庭邀请、成员加入退出等家庭管理通知</p>
                              <div className="mt-3 text-xs text-green-300">{notifications.family.unread}条未读消息</div>
                            </div>
                          </div>
                          
                          {/* 系统通知 */}
                          <div className="relative">
                            <div className={`border rounded-xl p-4 cursor-pointer transform transition-all duration-300 ease-in-out ${
                              selectedCategory === 'system' 
                                ? 'bg-orange-500/20 border-orange-400/50 shadow-lg shadow-orange-500/25' 
                                : 'bg-orange-500/10 border-orange-400/30 hover:bg-orange-500/20 hover:scale-110 hover:shadow-lg hover:shadow-orange-500/30'
                            }`} onClick={() => handleCategoryClick('system')}>
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center space-x-2">
                                <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center">
                                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5zM9 7H4l5-5v5zM12 12h.01" />
                                  </svg>
                                </div>
                                <h4 className="text-white font-semibold">系统通知</h4>
                              </div>
                              <div className="relative">
                                {notifications.system.unread > 0 && (
                                  <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full font-medium">{notifications.system.unread}</span>
                                )}
                              </div>
                            </div>
                              <p className="text-white/70 text-sm">系统版本更新、个人资料修改等</p>
                              <div className="mt-3 text-xs text-orange-300">{notifications.system.unread}条未读消息</div>
                            </div>
                          </div>
                        </div>
                        
                        {/* 消息详情显示区域 */}
                        <div className={`border rounded-xl p-4 transform transition-all duration-500 ease-in-out animate-in fade-in slide-in-from-bottom-4 ${
                          selectedCategory === 'system' ? 'bg-orange-500/10 border-orange-400/30' :
                          selectedCategory === 'family' ? 'bg-green-500/5 border-green-400/20' :
                          selectedCategory === 'delete_request' ? 'bg-red-500/5 border-red-400/20' :
                          'bg-blue-500/5 border-blue-400/20'
                        }`}>
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex space-x-4">
                              <button 
                                onClick={() => handleViewModeToggle(selectedCategory, 'unread')}
                                className={`px-3 py-1 rounded-lg text-sm font-medium transform transition-all duration-200 ease-in-out hover:scale-105 active:scale-95 ${
                                  messageViewMode[selectedCategory] === 'unread' 
                                    ? (selectedCategory === 'system' ? 'bg-orange-500 text-white shadow-md' :
                                       selectedCategory === 'family' ? 'bg-green-500 text-white shadow-md' :
                                       selectedCategory === 'delete_request' ? 'bg-red-500 text-white shadow-md' :
                                       'bg-blue-500 text-white shadow-md')
                                    : (selectedCategory === 'system' ? 'bg-orange-500/20 text-orange-300 hover:bg-orange-500/30' :
                                       selectedCategory === 'family' ? 'bg-green-500/20 text-green-300 hover:bg-green-500/30' :
                                       selectedCategory === 'delete_request' ? 'bg-red-500/20 text-red-300 hover:bg-red-500/30' :
                                       'bg-blue-500/20 text-blue-300 hover:bg-blue-500/30')
                                }`}
                              >
                                {selectedCategory === 'delete_request' ? '未处理' : '未读'} ({notifications[selectedCategory].messages.filter(msg => !msg.read).length})
                              </button>
                              <button 
                                onClick={() => handleViewModeToggle(selectedCategory, 'read')}
                                className={`px-3 py-1 rounded-lg text-sm font-medium transform transition-all duration-200 ease-in-out hover:scale-105 active:scale-95 ${
                                  messageViewMode[selectedCategory] === 'read' 
                                    ? (selectedCategory === 'system' ? 'bg-orange-500 text-white shadow-md' :
                                       selectedCategory === 'family' ? 'bg-green-500 text-white shadow-md' :
                                       selectedCategory === 'delete_request' ? 'bg-green-500 text-white shadow-md' :
                                       'bg-blue-500 text-white shadow-md')
                                    : (selectedCategory === 'system' ? 'bg-orange-500/20 text-orange-300 hover:bg-orange-500/30' :
                                       selectedCategory === 'family' ? 'bg-green-500/20 text-green-300 hover:bg-green-500/30' :
                                       selectedCategory === 'delete_request' ? 'bg-green-500/20 text-green-300 hover:bg-green-500/30' :
                                       'bg-blue-500/20 text-blue-300 hover:bg-blue-500/30')
                                }`}
                              >
                                {selectedCategory === 'delete_request' ? '已处理' : '已读'} ({notifications[selectedCategory].messages.filter(msg => msg.read).length})
                              </button>
                            </div>
                            <div className="flex space-x-2">
                              {messageViewMode[selectedCategory] === 'unread' && notifications[selectedCategory].messages.filter(msg => !msg.read).length > 0 && selectedCategory !== 'delete_request' && (
                                <button 
                                  onClick={() => handleMarkAllAsRead(selectedCategory)}
                                  className="px-3 py-1 bg-green-500/20 text-green-300 rounded-lg text-sm hover:bg-green-500/30 transform transition-all duration-200 ease-in-out hover:scale-105 active:scale-95"
                                >
                                  全部标记已读
                                </button>
                              )}
                              {messageViewMode[selectedCategory] === 'read' && notifications[selectedCategory].messages.filter(msg => msg.read).length > 0 && (
                                <button 
                                  onClick={() => handleClearReadMessages(selectedCategory)}
                                  className={`px-3 py-1 rounded-lg text-sm transform transition-all duration-200 ease-in-out hover:scale-105 active:scale-95 ${
                                    selectedCategory === 'system' ? 'bg-orange-500/20 text-orange-300 hover:bg-orange-500/30' :
                                    selectedCategory === 'family' ? 'bg-green-500/20 text-green-300 hover:bg-green-500/30' :
                                    selectedCategory === 'delete_request' ? 'bg-red-500/20 text-red-300 hover:bg-red-500/30' :
                                    'bg-blue-500/20 text-blue-300 hover:bg-blue-500/30'
                                  }`}
                                >
                                  {selectedCategory === 'delete_request' ? '清除已处理' : '清除已读'}
                                </button>
                              )}
                            </div>
                          </div>
                          <div className="space-y-3 transform transition-all duration-300 ease-in-out">
                            {notifications[selectedCategory].messages
                              .filter(msg => messageViewMode[selectedCategory] === 'unread' ? !msg.read : msg.read)
                              .map(message => (
                                <div key={message.id} className="relative group">
                                  <div className={`border rounded-lg p-3 transform transition-all duration-300 ease-in-out group-hover:scale-102 group-hover:shadow-md animate-in fade-in slide-in-from-left-4 ${
                                    selectedCategory === 'system' ? 'bg-orange-500/10 border-orange-400/20 group-hover:shadow-orange-500/20' :
                                    selectedCategory === 'family' ? 'bg-green-500/10 border-green-400/20 group-hover:shadow-green-500/20' :
                                    selectedCategory === 'delete_request' ? (
                                      // 为已处理的删除请求添加不同背景色
                                      message.read && (() => {
                                        try {
                                          const details = JSON.parse(message.content);
                                          // 如果是delete_approved或delete_rejected消息，直接根据类型设置背景色
                                          if (details.type === 'delete_approved') {
                                            return 'bg-green-500/10 border-green-400/20 group-hover:shadow-green-500/20';
                                          } else if (details.type === 'delete_rejected') {
                                            return 'bg-red-500/10 border-red-400/20 group-hover:shadow-red-500/20';
                                          } else if (details.type === 'delete_request' && details.record_info) {
                                            // 如果是原始删除请求，查找对应的处理结果
                                            const allDeleteMessages = notifications.delete_request.messages || [];
                                            const approvedMessage = allDeleteMessages.find(msg => {
                                              try {
                                                const msgDetails = JSON.parse(msg.content);
                                                return msgDetails.type === 'delete_approved' && 
                                                       msgDetails.record_info && 
                                                       msgDetails.record_info.id === details.record_info.id;
                                              } catch (e) { return false; }
                                            });
                                            const rejectedMessage = allDeleteMessages.find(msg => {
                                              try {
                                                const msgDetails = JSON.parse(msg.content);
                                                return msgDetails.type === 'delete_rejected' && 
                                                       msgDetails.record_info && 
                                                       msgDetails.record_info.id === details.record_info.id;
                                              } catch (e) { return false; }
                                            });
                                            
                                            if (approvedMessage) {
                                              return 'bg-green-500/10 border-green-400/20 group-hover:shadow-green-500/20';
                                            } else if (rejectedMessage) {
                                              return 'bg-red-500/10 border-red-400/20 group-hover:shadow-red-500/20';
                                            }
                                          }
                                        } catch (e) {}
                                        return 'bg-red-500/10 border-red-400/20 group-hover:shadow-red-500/20';
                                      })() || 'bg-red-500/10 border-red-400/20 group-hover:shadow-red-500/20'
                                    ) : 'bg-blue-500/10 border-blue-400/20 group-hover:shadow-blue-500/20'
                                  }`}>
                                  <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                      <h5 className="text-white font-medium text-sm mb-1">{message.title}</h5>
                                      {selectedCategory === 'records' ? (
                                        (() => {
                                          try {
                                            const details = JSON.parse(message.content);
                                            // 检查是否有record_info嵌套结构（删除通知）或直接字段（创建通知）
                                            const recordData = details.record_info || details;
                                            // 使用已定义的翻译函数
                                            return (
                                              <div className="space-y-2">
                                                <div className="grid grid-cols-2 gap-2 text-xs">
                                                  <div className="text-white/60">姓名: <span className="text-white/80">{recordData.person_name?.replace(/^-+|-+$/g, '')}</span></div>
                                                  <div className="text-white/60">事件: <span className="text-white/80">{translateEventType(recordData.event_type)}</span></div>
                                                  <div className="text-white/60">关系: <span className="text-white/80">{translateRelationType(recordData.relation_type)}</span></div>
                                                  <div className="text-white/60">类型: <span className={`font-medium ${
                                                    recordData.transaction_type === 'income' ? 'text-green-400' : 'text-red-400'
                                                  }`}>{recordData.transaction_type === 'income' ? '收入' : '支出'}</span></div>
                                                  <div className="text-white/60">金额: <span className={`font-medium ${
                                                    recordData.transaction_type === 'income' ? 'text-green-400' : 'text-red-400'
                                                  }`}>¥{recordData.amount}</span></div>
                                                  <div className="text-white/60">日期: <span className="text-white/80">{recordData.event_date}</span></div>
                                                  {recordData.remarks && (
                                                    <div className="text-white/60 col-span-2">备注: <span className="text-white/80">{recordData.remarks}</span></div>
                                                  )}
                                                </div>
                                              </div>
                                            );
                                          } catch (e) {
                            // 处理纯文本通知，特别是成员注销退出家庭通知
                            if (selectedCategory === 'family' && message.title === '成员注销退出家庭') {
                              return (
                                <div className="text-white/70 text-xs mb-2">
                                  {formatMemberDeregistrationNotification(message.content)}
                                </div>
                              );
                            }
                            return <p className="text-white/70 text-xs mb-2">{message.content}</p>;
                          }
                                        })()
                                      ) : (
                                        (() => {
                                          try {
                                            const details = JSON.parse(message.content);
                                            if (selectedCategory === 'system') {
                                              // 系统通知显示
                                              return (
                                                <div className="space-y-1">
                                                  <p className="text-white/80 text-xs">{details.message}</p>
                                                  {details.nickname && (
                                                    <div className="text-white/60 text-xs">昵称: <span className="text-white/80">{details.nickname}</span></div>
                                                  )}
                                                  {details.bio && (
                                                    <div className="text-white/60 text-xs">个人简介: <span className="text-white/80">{details.bio}</span></div>
                                                  )}
                                                  {details.update_time && (
                                                    <div className="text-white/60 text-xs">更新时间: <span className="text-white/80">{details.update_time}</span></div>
                                                  )}
                                                  {details.avatar_url && (
                                                    <div className="text-white/60 text-xs">头像已更新</div>
                                                  )}
                                                  {details.upload_time && (
                                                    <div className="text-white/60 text-xs">上传时间: <span className="text-white/80">{details.upload_time}</span></div>
                                                  )}
                                                  {details.change_time && (
                                                    <div className="text-white/60 text-xs">修改时间: <span className="text-white/80">{details.change_time}</span></div>
                                                  )}
                                                  {details.reset_time && (
                                                    <div className="text-white/60 text-xs">重置时间: <span className="text-white/80">{details.reset_time}</span></div>
                                                  )}
                                                  {details.security_tip && (
                                                    <div className="text-orange-300 text-xs font-medium bg-orange-500/10 p-2 rounded-lg mt-1">
                                                      <span className="text-orange-400">安全提示:</span> {details.security_tip}
                                                    </div>
                                                  )}
                                                </div>
                                              );
                                            } else if (selectedCategory === 'delete_request') {
                                              // 删除请求通知显示
                                              const isCollapsed = collapsedMessages.has(message.id);
                                              const isApprovedMessage = details.type === 'delete_approved';
                                              const isRejectedMessage = details.type === 'delete_rejected';
                                              const isOriginalRequest = details.type === 'delete_request';
                                              
                                              // 检查是否是已读的原始删除请求（即自己处理过的请求）
                                              const isProcessedRequest = message.read && isOriginalRequest;
                                              
                                              // 如果是已处理的原始请求，检查处理结果
                                              let processedAction = null;
                                              if (isProcessedRequest && details.record_info) {
                                                // 查找同一记录的处理结果消息
                                                const allDeleteMessages = notifications.delete_request.messages || [];
                                                const approvedMessage = allDeleteMessages.find(msg => {
                                                  try {
                                                    const msgDetails = JSON.parse(msg.content);
                                                    return msgDetails.type === 'delete_approved' && 
                                                           msgDetails.record_info && 
                                                           msgDetails.record_info.id === details.record_info.id;
                                                  } catch (e) { return false; }
                                                });
                                                const rejectedMessage = allDeleteMessages.find(msg => {
                                                  try {
                                                    const msgDetails = JSON.parse(msg.content);
                                                    return msgDetails.type === 'delete_rejected' && 
                                                           msgDetails.record_info && 
                                                           msgDetails.record_info.id === details.record_info.id;
                                                  } catch (e) { return false; }
                                                });
                                                
                                                if (approvedMessage) processedAction = 'approve';
                                                else if (rejectedMessage) processedAction = 'reject';
                                              }
                                              
                                              return (
                                                <div className="space-y-3">
                                                  {/* 消息标题和状态标签 */}
                                                  <div className="flex items-center justify-between">
                                                    <div className="flex-1">
                                                      <p className="text-white/80 text-xs">
                                                        {isApprovedMessage ? (
                                                          // 删除同意消息：重新构造标题，使用翻译后的字段
                                                          details.record_info ? 
                                                            `${details.approver_name}已同意删除该记录：${details.record_info.person_name || '未知'} - ${translateEventType(details.record_info.event_type)} - ${translateRelationType(details.record_info.relation_type)} - ${details.record_info.transaction_type === 'income' ? '收入' : '支出'}${details.record_info.amount || 0}元 - ${details.record_info.event_date || '未知日期'}，该记录已被删除`
                                                            : (details.message || '删除请求已处理')
                                                        ) : isRejectedMessage ? (
                                                          // 删除拒绝消息：重新构造标题，使用翻译后的字段
                                                          details.record_info ? 
                                                            `${details.rejecter_name}已拒绝删除该记录：${details.record_info.person_name || '未知'} - ${translateEventType(details.record_info.event_type)} - ${translateRelationType(details.record_info.relation_type)} - ${details.record_info.transaction_type === 'income' ? '收入' : '支出'}${details.record_info.amount || 0}元 - ${details.record_info.event_date || '未知日期'}`
                                                            : (details.message || '删除请求被拒绝')
                                                        ) : (
                                                          // 删除请求消息：使用原有逻辑
                                                          details.message || `${details.requester_name} 请求删除您的记录`
                                                        )}
                                                      </p>
                                                      {/* 为已处理的原始删除请求添加状态标签 */}
                                                      {isProcessedRequest && processedAction && (
                                                        <div className="mt-2">
                                                          <span className={`text-xs px-2 py-1 rounded font-medium ${
                                                            processedAction === 'approve' 
                                                              ? 'bg-green-500/20 text-green-300 border border-green-500/30'
                                                              : 'bg-red-500/20 text-red-300 border border-red-500/30'
                                                          }`}>
                                                            {processedAction === 'approve' ? '已同意' : '已拒绝'}
                                                          </span>
                                                        </div>
                                                      )}
                                                    </div>
                                                    <button
                                                      onClick={() => toggleMessageCollapse(message.id)}
                                                      className="ml-2 text-white/60 hover:text-white/80 transition-colors duration-200"
                                                    >
                                                      <svg className={`w-4 h-4 transform transition-transform duration-200 ${
                                                        isCollapsed ? 'rotate-180' : 'rotate-0'
                                                      }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                                      </svg>
                                                    </button>
                                                  </div>
                                                  
                                                  {/* 详细信息（可折叠） */}
                                                  {!isCollapsed && (
                                                    <>
                                                      {/* 记录详情 */}
                                                      <div className="bg-white/5 p-2 rounded-lg">
                                                        <div className="text-white/60 text-xs mb-1">记录详情:</div>
                                                        <div className="text-white/80 text-xs space-y-1">
                                                          <div className="grid grid-cols-2 gap-x-3">
                                                             <div>姓名: <span className="text-white/90">{details.record_info?.person_name}</span></div>
                                                             <div>事件类型: <span className="text-white/90">{translateEventType(details.record_info?.event_type)}</span></div>
                                                           </div>
                                                          <div className="grid grid-cols-2 gap-x-3">
                                                            <div>关系类型: <span className="text-white/90">{translateRelationType(details.record_info?.relation_type)}</span></div>
                                                            <div>类型: <span className={`font-medium ${
                                                              details.record_info?.transaction_type === 'income' ? 'text-green-400' : 'text-red-400'
                                                            }`}>{details.record_info?.transaction_type === 'income' ? '收入' : '支出'}</span></div>
                                                          </div>
                                                          <div className="grid grid-cols-2 gap-x-3">
                                                            <div>金额: <span className={`font-medium ${
                                                              details.record_info?.transaction_type === 'income' ? 'text-green-400' : 'text-red-400'
                                                            }`}>¥{details.record_info?.amount}</span></div>
                                                            <div>事件日期: <span className="text-white/90">{details.record_info?.event_date}</span></div>
                                                          </div>
                                                        </div>
                                                      </div>
                                                      
                                                      {/* 请求信息 */}
                                                      <div className="bg-white/5 p-3 rounded-lg space-y-2">
                                                        <div className="text-white/60 text-xs">{(isApprovedMessage || isRejectedMessage) ? '处理信息:' : '请求信息:'}</div>
                                                        <div className="text-white/80 text-xs space-y-1">
                                                          {isApprovedMessage ? (
                                                            <>
                                                              <div>处理者: <span className="text-green-400">{details.approver_name}</span></div>
                                                              <div>处理时间: <span className="text-white/90">{details.response_time}</span></div>
                                                            </>
                                                          ) : isRejectedMessage ? (
                                                            <>
                                                              <div>处理者: <span className="text-red-400">{details.rejecter_name}</span></div>
                                                              <div>处理时间: <span className="text-white/90">{details.response_time}</span></div>
                                                            </>
                                                          ) : (
                                                            <>
                                                              <div>请求者: <span className="text-blue-400">{details.requester_name}</span></div>
                                                              <div>请求时间: <span className="text-white/90">{details.request_time}</span></div>
                                                              {details.message && (
                                                                <div>留言: <span className="text-white/90">{details.message}</span></div>
                                                              )}
                                                            </>
                                                          )}
                                                        </div>
                                                      </div>
                                                    </>
                                                  )}
                                                  
                                                  {/* 按钮区域 */}
                                                  {(isApprovedMessage || isRejectedMessage) && !message.read ? (
                                                    // 已处理删除的消息显示"好的"按钮
                                                    <div className="flex justify-end">
                                                      <button
                                                        onClick={() => handleOkButtonClick(message.id)}
                                                        className="px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white text-xs font-medium rounded-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 ease-in-out active:scale-95 border border-blue-400/30 hover:border-blue-300/50"
                                                      >
                                                        好的
                                                      </button>
                                                    </div>
                                                  ) : (
                                                    // 未处理的删除请求显示同意/拒绝按钮
                                                    !message.read && details.type === 'delete_request' && (
                                                      <div className="flex space-x-2">
                                                        <button
                                                          onClick={() => showDeleteRequestConfirm('approve', message.id)}
                                                          className="px-4 py-2 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white text-xs font-medium rounded-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 ease-in-out active:scale-95 border border-green-400/30 hover:border-green-300/50"
                                                        >
                                                          同意删除
                                                        </button>
                                                        <button
                                                          onClick={() => showDeleteRequestConfirm('reject', message.id)}
                                                          className="px-4 py-2 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white text-xs font-medium rounded-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 ease-in-out active:scale-95 border border-red-400/30 hover:border-red-300/50"
                                                        >
                                                          拒绝删除
                                                        </button>
                                                      </div>
                                                    )
                                                  )}
                                                </div>
                                              );
                                            } else if (selectedCategory === 'family') {
                                              // 家庭通知显示
                                              
                                              // 检查是否是邀请通知
                                              if (details.type === 'family_invitation' && !message.read) {
                                                return (
                                                  <div className="space-y-3">
                                                    <p className="text-white/80 text-xs">{details.message}</p>
                                                    <div className="flex space-x-2">
                                                      <button
                                                        onClick={async () => {
                                                          try {
                                                            const response = await fetch(`/api/invitations/${details.invitation_id}/respond`, {
                                                              method: 'POST',
                                                              headers: {
                                                                'Content-Type': 'application/json',
                                                              },
                                                              credentials: 'include',
                                                              body: JSON.stringify({ action: 'accept' }),
                                                            });
                                                            
                                                            if (response.ok) {
                                                               const data = await response.json();
                                                               // 标记消息为已读
                                                               handleMarkAsRead(selectedCategory, message.id);
                                                               // 显示成功弹窗
                                                               setSuccessMessage(`成功加入家庭 "${data.family?.name || ''}"！`);
                                                               setShowSuccessDialog(true);
                                                               // 延迟刷新页面
                                                               setTimeout(() => {
                                                                 window.location.reload();
                                                               }, 2000);
                                                             } else {
                                                               const data = await response.json();
                                                               setError(data.error || '操作失败');
                                                               setTimeout(() => setError(''), 3000);
                                                             }
                                                          } catch (error) {
                                                             setError('网络错误，请重试');
                                                             setTimeout(() => setError(''), 3000);
                                                           }
                                                        }}
                                                        className="px-4 py-2 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white text-xs font-medium rounded-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 ease-in-out active:scale-95 border border-green-400/30 hover:border-green-300/50"
                                                      >
                                                        同意
                                                      </button>
                                                      <button
                                                        onClick={async () => {
                                                          try {
                                                            const response = await fetch(`/api/invitations/${details.invitation_id}/respond`, {
                                                              method: 'POST',
                                                              headers: {
                                                                'Content-Type': 'application/json',
                                                              },
                                                              credentials: 'include',
                                                              body: JSON.stringify({ action: 'reject' }),
                                                            });
                                                            
                                                            if (response.ok) {
                                                               // 标记消息为已读
                                                               handleMarkAsRead(selectedCategory, message.id);
                                                               setSuccessMessage('已拒绝邀请');
                                                               setShowSuccessDialog(true);
                                                             } else {
                                                               const data = await response.json();
                                                               setError(data.error || '操作失败');
                                                               setTimeout(() => setError(''), 3000);
                                                             }
                                                          } catch (error) {
                                                             setError('网络错误，请重试');
                                                             setTimeout(() => setError(''), 3000);
                                                           }
                                                        }}
                                                        className="px-4 py-2 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white text-xs font-medium rounded-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 ease-in-out active:scale-95 border border-red-400/30 hover:border-red-300/50"
                                                      >
                                                        拒绝
                                                      </button>
                                                    </div>
                                                  </div>
                                                );
                                              }
                                              
                                              // 普通家庭通知显示
                                              return (
                                                <div className="space-y-1">
                                                  <p className="text-white/80 text-xs">{details.message}</p>
                                                  {details.modifier_name && (
                                                    <div className="text-white/60 text-xs">操作者: <span className="text-white/80">{details.modifier_name}</span></div>
                                                  )}
                                                  {details.old_name && details.new_name && (
                                                    <div className="text-white/60 text-xs">
                                                      原名称: <span className="text-white/80">{details.old_name}</span> → 
                                                      新名称: <span className="text-white/80">{details.new_name}</span>
                                                    </div>
                                                  )}
                                                  {details.person_name && (
                                                    <div className="text-white/60 text-xs">相关人员: <span className="text-white/80">{details.person_name?.replace(/^-+|-+$/g, '')}</span></div>
                                                  )}
                                                  {details.transaction_type && details.amount && (
                                                    <div className="text-white/60 text-xs">
                                                      类型: <span className={`font-medium ${
                                                        details.transaction_type === 'income' ? 'text-green-400' : 'text-red-400'
                                                      }`}>{details.transaction_type === 'income' ? '收入' : '支出'}</span>
                                                      金额: <span className={`font-medium ${
                                                        details.transaction_type === 'income' ? 'text-green-400' : 'text-red-400'
                                                      }`}>¥{details.amount}</span>
                                                    </div>
                                                  )}
                                                  {details.modify_time && (
                                                    <div className="text-white/60 text-xs">操作时间: <span className="text-white/80">{details.modify_time}</span></div>
                                                  )}
                                                  {details.delete_time && (
                                                    <div className="text-white/60 text-xs">删除时间: <span className="text-white/80">{details.delete_time}</span></div>
                                                  )}
                                                </div>
                                              );
                                            }
                                            return <p className="text-white/70 text-xs mb-2">{details.message || message.content}</p>;
                                          } catch (e) {
                            // 处理纯文本通知，特别是成员注销退出家庭通知
                            if (selectedCategory === 'family' && message.title === '成员注销退出家庭') {
                              return (
                                <div className="text-white/70 text-xs mb-2">
                                  {formatMemberDeregistrationNotification(message.content)}
                                </div>
                              );
                            }
                            return <p className="text-white/70 text-xs mb-2">{message.content}</p>;
                          }
                                        })()
                                      )}
                                      <span className={`text-xs ${
                                        selectedCategory === 'system' ? 'text-orange-300' :
                                        selectedCategory === 'family' ? 'text-green-300' :
                                        selectedCategory === 'delete_request' ? 'text-red-300' :
                                        'text-blue-300'
                                      }`}>{formatBeijingTime(message.timestamp)}</span>
                                    </div>
                                    {!message.read && selectedCategory !== 'delete_request' && (
                                      <button 
                                        onClick={() => handleMarkAsRead(selectedCategory, message.id)}
                                        className={`ml-3 px-2 py-1 rounded text-xs transform transition-all duration-200 ease-in-out hover:scale-105 active:scale-95 ${
                                          selectedCategory === 'system' ? 'bg-orange-500/20 text-orange-300 hover:bg-orange-500/30' :
                                          selectedCategory === 'family' ? 'bg-green-500/20 text-green-300 hover:bg-green-500/30' :
                                          'bg-blue-500/20 text-blue-300 hover:bg-blue-500/30'
                                        }`}
                                      >
                                        标记已读
                                      </button>
                                    )}
                                  </div>
                                </div>
                              </div>
                              ))
                            }
                            {notifications[selectedCategory].messages.filter(msg => messageViewMode[selectedCategory] === 'unread' ? !msg.read : msg.read).length === 0 && (
                              <div className="text-center text-white/50 py-4">
                                暂无{messageViewMode[selectedCategory] === 'unread' ? (selectedCategory === 'delete_request' ? '未处理' : '未读') : (selectedCategory === 'delete_request' ? '已处理' : '已读')}消息
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'logout' && (
                  <div className="bg-white/5 border border-white/10 rounded-2xl">
                    <div className="p-4 border-b border-white/10">
                      <h3 className="text-2xl font-bold text-orange-500 mb-2">退出登录</h3>
                      <p className="text-white/70 text-base">确认退出当前账户</p>
                    </div>
                    <div className="p-4">
                      <div className="text-center space-y-6">
                        {/* 退出登录图标 */}
                        <div className="flex justify-center">
                          <div className="w-20 h-20 bg-gradient-to-br from-orange-500 to-red-600 rounded-full flex items-center justify-center shadow-2xl">
                            <LogOut className="w-10 h-10 text-white" />
                          </div>
                        </div>

                        {/* 提示信息 */}
                        <div className="space-y-4">
                          <h4 className="text-xl font-semibold text-white">确认退出登录？</h4>
                          <p className="text-white/70 text-base max-w-md mx-auto">
                            退出登录后，您需要重新输入用户名和密码才能访问系统。
                          </p>
                        </div>

                        {/* 操作按钮 */}
                        <div className="flex justify-center">
                          <Button 
                            onClick={() => setShowLogoutConfirmDialog(true)}
                            className="bg-gradient-to-r from-orange-400 to-orange-600 hover:from-orange-500 hover:to-orange-700 text-white py-3 px-8 rounded-2xl font-semibold transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                          >
                            <LogOut className="w-5 h-5 mr-2" />
                            确认退出
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* 头像上传成功弹窗 */}
      {showAvatarSuccessDialog && (
        <div className="fixed inset-0 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xs transform transition-all duration-300 scale-100">
            <div className="p-4 text-center">
              <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-3">
                <Check className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">头像上传成功！</h3>
              <p className="text-xs text-gray-500 mb-4">您的头像已成功更新</p>
              <button
                onClick={() => setShowAvatarSuccessDialog(false)}
                className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white py-2 px-4 rounded-lg font-medium hover:from-blue-600 hover:to-purple-700 transition-all duration-200 transform hover:scale-105"
              >
                确定
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* 二次确认退出登录弹窗 */}
      {showLogoutConfirmDialog && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="w-96 mx-4 shadow-2xl border-0 bg-gradient-to-br from-orange-600/20 via-red-600/15 to-orange-700/20 border border-orange-400/40 rounded-2xl transform transition-all duration-300 scale-100">
            <div className="p-6 text-center">
              <div className="mx-auto w-16 h-16 bg-orange-500/20 backdrop-blur-md rounded-full flex items-center justify-center mb-4 border border-orange-400/30">
                <LogOut className="w-8 h-8 text-orange-400" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">确认退出登录？</h3>
              <p className="text-orange-200 mb-6">退出后需要重新登录</p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowLogoutConfirmDialog(false)}
                  className="flex-1 bg-gradient-to-r from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700 text-white py-3 px-4 rounded-xl font-medium transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                >
                  取消
                </button>
                <button
                  onClick={() => {
                    setShowLogoutConfirmDialog(false);
                    logout();
                  }}
                  className="flex-1 bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white py-3 px-4 rounded-xl font-medium transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                >
                  确认
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 成功弹窗 */}
      {showSuccessDialog && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50">
          <Card className="w-96 mx-4 shadow-2xl border-0 bg-gradient-to-br from-green-600/20 via-emerald-600/15 to-teal-700/20 border border-green-400/40 animate-pulse">
            <CardHeader className="text-center">
              <div className="mx-auto w-16 h-16 bg-green-500/20 backdrop-blur-md rounded-full flex items-center justify-center mb-4 border border-green-400/30">
                <Check className="w-8 h-8 text-green-400" />
              </div>
              <CardTitle className="text-xl font-bold text-white">操作成功！</CardTitle>
              <p className="text-green-200">{successMessage}</p>
            </CardHeader>
            <CardContent className="text-center">
              <Button 
                onClick={() => setShowSuccessDialog(false)}
                className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300"
              >
                <Check className="w-4 h-4 mr-2" />
                确定
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {/* 删除请求确认弹窗 */}
      {showDeleteRequestModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
          <div className="w-full max-w-xs mx-4 shadow-2xl border-0 bg-gradient-to-br from-orange-600/20 via-yellow-600/15 to-amber-700/20 border border-orange-400/40 rounded-lg backdrop-blur-md transform transition-all duration-300 scale-100">
            <div className="text-center bg-gradient-to-r from-orange-500/10 to-yellow-600/10 rounded-t-lg border-b border-orange-400/35 py-2 px-3">
              <div className={`w-8 h-8 bg-gradient-to-br ${
                deleteRequestAction === 'approve' 
                  ? 'from-green-500 to-emerald-600' 
                  : 'from-red-500 to-pink-600'
              } rounded-full flex items-center justify-center mx-auto mb-1`}>
                {deleteRequestAction === 'approve' ? (
                  <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                )}
              </div>
              <h3 className="text-sm font-semibold text-white mb-0.5">
                {deleteRequestAction === 'approve' ? '确认同意删除' : '确认拒绝删除'}
              </h3>
              <p className="text-xs text-orange-200">
                {deleteRequestAction === 'approve' 
                  ? '请确认同意删除此记录'
                  : '请确认拒绝删除请求'
                }
              </p>
            </div>
            <div className="p-3 space-y-2">
              <div className="space-y-1">
                <div className="text-center">
                  <p className="text-white/70 text-xs">
                    {deleteRequestAction === 'approve' 
                      ? '您确定要同意这个删除请求吗？记录将被永久删除。'
                      : '您确定要拒绝这个删除请求吗？'
                    }
                  </p>
                </div>
              </div>
              
              <div className="flex space-x-1.5">
                <button
                  onClick={() => handleDeleteRequest(deleteRequestAction, deleteRequestMessageId)}
                  className={`flex-1 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 py-1.5 text-xs rounded ${
                    deleteRequestAction === 'approve'
                      ? 'bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700'
                      : 'bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700'
                  }`}
                >
                  {deleteRequestAction === 'approve' ? '确认同意' : '确认拒绝'}
                </button>
                <button
                  onClick={() => setShowDeleteRequestModal(false)}
                  className="flex-1 bg-white/[0.03] backdrop-blur-md border border-white/20 text-white hover:bg-white/[0.05] transition-all duration-300 transform hover:scale-105 py-1.5 text-xs rounded"
                >
                  取消
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 错误弹窗 */}
      <ErrorModal 
        isOpen={showErrorModal}
        onClose={() => setShowErrorModal(false)}
        message={errorMessage}
      />

      {/* 删除请求结果弹窗 */}
      {showDeleteRequestResultModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowDeleteRequestResultModal(false)}></div>
          <div className="relative w-full max-w-xs mx-4 shadow-2xl border-0 bg-gradient-to-br from-slate-800/95 via-slate-700/90 to-slate-900/95 border border-white/20 rounded-lg backdrop-blur-md transform transition-all duration-300 scale-100">
            <div className={`text-center bg-gradient-to-r ${
              deleteRequestResultType === 'success' 
                ? 'from-green-500/10 to-emerald-600/10 border-b border-green-400/35' 
                : 'from-red-500/10 to-pink-600/10 border-b border-red-400/35'
            } rounded-t-lg py-2 px-3`}>
              <div className={`w-8 h-8 bg-gradient-to-br ${
                deleteRequestResultType === 'success'
                  ? 'from-green-500 to-emerald-600'
                  : 'from-red-500 to-pink-600'
              } rounded-full flex items-center justify-center mx-auto mb-1`}>
                {deleteRequestResultType === 'success' ? (
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                )}
              </div>
              <h3 className="text-sm font-semibold text-white mb-0.5">
                {deleteRequestResultType === 'success' ? '操作成功' : '操作失败'}
              </h3>
              <p className={`text-xs ${
                deleteRequestResultType === 'success' ? 'text-green-200' : 'text-red-200'
              }`}>
                {deleteRequestResultType === 'success' ? '删除请求已处理' : '请求处理失败'}
              </p>
            </div>
            <div className="p-4 space-y-4">
              <div className={`bg-${deleteRequestResultType === 'success' ? 'green' : 'red'}-500/10 border border-${deleteRequestResultType === 'success' ? 'green' : 'red'}-500/30 rounded-lg p-3`}>
                <div className="flex items-center space-x-2">
                  <div className={`w-6 h-6 bg-${deleteRequestResultType === 'success' ? 'green' : 'red'}-500/20 rounded-full flex items-center justify-center flex-shrink-0`}>
                    {deleteRequestResultType === 'success' ? (
                      <svg className={`w-3 h-3 text-${deleteRequestResultType === 'success' ? 'green' : 'red'}-400`} fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    ) : (
                      <svg className={`w-3 h-3 text-${deleteRequestResultType === 'success' ? 'green' : 'red'}-400`} fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>
                  <div>
                    <div className={`text-${deleteRequestResultType === 'success' ? 'green' : 'red'}-300 text-sm font-medium`}>
                      {deleteRequestResultMessage}
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex justify-center">
                <button
                  onClick={() => setShowDeleteRequestResultModal(false)}
                  className={`bg-gradient-to-r ${
                    deleteRequestResultType === 'success'
                      ? 'from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700'
                      : 'from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700'
                  } text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 py-3 px-6 text-sm rounded-lg`}
                >
                  确定
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 注销账号确认弹窗 */}
      {showDeleteAccountConfirmDialog && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="w-96 mx-4 shadow-2xl border-0 bg-gradient-to-br from-red-600/20 via-red-600/15 to-red-700/20 border border-red-400/40 rounded-2xl transform transition-all duration-300 scale-100">
            <div className="p-6 text-center">
              <div className="mx-auto w-16 h-16 bg-red-500/20 backdrop-blur-md rounded-full flex items-center justify-center mb-4 border border-red-400/30">
                <Trash2 className="w-8 h-8 text-red-400" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">确认注销账号？</h3>
              <p className="text-red-200 mb-6">此操作不可恢复，所有数据将被永久删除！</p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowDeleteAccountConfirmDialog(false)}
                  className="flex-1 bg-gradient-to-r from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700 text-white py-3 px-4 rounded-xl font-medium transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                >
                  取消
                </button>
                <button
                  onClick={confirmDeleteAccount}
                  className="flex-1 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white py-3 px-4 rounded-xl font-medium transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                >
                  确认注销
                </button>
              </div>
            </div>
          </div>
        </div>
      )}


    </div>
  );
};

export default Profile;

