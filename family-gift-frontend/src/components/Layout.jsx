import React, { useState } from 'react';
import { Link, useLocation, useNavigate, Outlet } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useNotification } from '../contexts/NotificationContext';
import { 
  Home, 
  PlusCircle, 
  BarChart3, 
  Users, 
  User, 
  Crown,
  Menu,
  X,
  Bell
} from 'lucide-react';

const Layout = () => {
  const { user, logout } = useAuth();
  const { getTotalUnreadCount, notifications } = useNotification();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const unreadMessages = getTotalUnreadCount(); // 获取总未读消息数量

  // 智能跳转到消息通知页面的逻辑
  const handleMessageClick = () => {
    // 如果有未读消息，跳转到未读消息页面
    if (unreadMessages > 0) {
      // 优先跳转到记录消息板块，如果记录消息没有未读消息，则按顺序检查其他板块
      if (notifications.records.unread > 0) {
        navigate('/app/profile?tab=messages&category=records&mode=unread');
      } else if (notifications.delete_request.unread > 0) {
        navigate('/app/profile?tab=messages&category=delete_request&mode=unread');
      } else if (notifications.family.unread > 0) {
        navigate('/app/profile?tab=messages&category=family&mode=unread');
      } else if (notifications.system.unread > 0) {
        navigate('/app/profile?tab=messages&category=system&mode=unread');
      } else {
        // 默认跳转到记录消息板块
        navigate('/app/profile?tab=messages&category=records&mode=unread');
      }
    } else {
      // 没有未读消息时，默认跳转到记录消息板块
      navigate('/app/profile?tab=messages&category=records');
    }
  };



  const navigationItems = [
    { path: '/app/center', label: '礼金簿中心', icon: Home },
    { path: '/app/record', label: '智能记录', icon: PlusCircle },
    { path: '/app/archive', label: '数据档案', icon: BarChart3 },
    { path: '/app/profile', label: '个人中心', icon: User },
  ];



  const isActive = (path) => location.pathname === path;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-indigo-900 to-purple-900">
      {/* 背景装饰 */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>
      
      {/* 顶部导航栏 */}
      <nav className="relative z-10 bg-slate-800/30 backdrop-blur-xl border-b border-slate-600/30 shadow-2xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo和标题 */}
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                <span className="text-white font-bold text-lg">礼</span>
              </div>
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-white via-blue-100 to-indigo-100 bg-clip-text text-transparent">家庭礼金簿</h1>
                {user?.is_admin ? (
                  <p className="text-xs text-yellow-400 flex items-center">
                    <Crown className="w-3 h-3 mr-1" />
                    站主专属
                  </p>
                ) : null}
              </div>
            </div>

            {/* 桌面端导航菜单 */}
            <div className="hidden md:flex items-center space-x-1">
              {navigationItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`group relative overflow-hidden flex items-center space-x-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300 ${
                      isActive(item.path)
                        ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg'
                        : 'text-slate-200 hover:text-white hover:bg-slate-700/50 border border-slate-600/30 hover:border-slate-500/50'
                    }`}
                  >
                    {!isActive(item.path) && (
                      <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    )}
                    <Icon className="w-4 h-4 relative z-10 group-hover:scale-110 transition-transform duration-300" />
                    <span className="relative z-10">{item.label}</span>
                  </Link>
                );
              })}
            </div>

            {/* 用户信息和退出按钮 */}
            <div className="hidden md:flex items-center space-x-4">
              {/* 消息按钮 */}
              <div className="relative">
                <div className="flex items-center space-x-2">
                  <div className="relative flex items-center">
                    <button
                      onClick={handleMessageClick}
                      className="text-slate-300 hover:text-white transition-colors duration-300 p-2 hover:bg-slate-700/30 rounded-lg"
                    >
                      <Bell className="w-6 h-6" />
                      {/* 桌面端未读消息徽章 - 左侧固定右侧扩展 */}
                           {unreadMessages > 0 && (
                             <div className="absolute -top-1 left-6 bg-gradient-to-r from-red-500 to-red-600 text-white text-xs font-bold rounded-full h-[20px] flex items-center justify-center shadow-lg animate-pulse" style={{minWidth: '20px', padding: '0 4px'}}>
                               <span className="leading-none whitespace-nowrap">{unreadMessages > 99 ? '99+' : unreadMessages}</span>
                             </div>
                           )}
                    </button>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <div 
                  className="w-10 h-10 bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg overflow-hidden cursor-pointer hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                  onClick={() => navigate('/profile')}
                >
                  {user?.avatar ? (
                    <img 
                      src={user.avatar} 
                      alt="用户头像" 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-white font-medium text-sm">
                      {user?.username?.charAt(0)?.toUpperCase()}
                    </span>
                  )}
                </div>
                <div className="text-sm">
                  <div className="font-medium text-white flex items-center">
                    {user?.nickname || user?.username}
                    {user?.is_admin ? (
                      <Crown className="w-3 h-3 ml-1 text-yellow-400" />
                    ) : null}
                  </div>
                  <div className="text-slate-300 text-xs">
                    {user?.username || '用户名未设置'}
                  </div>
                </div>
              </div>

            </div>

            {/* 移动端菜单按钮 */}
            <div className="md:hidden">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 rounded-lg text-slate-200 hover:bg-slate-700/50 hover:text-white border border-slate-600/30 hover:border-slate-500/50 transition-all duration-300"
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>

        {/* 移动端下拉菜单 */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-slate-800/50 backdrop-blur-xl border-t border-slate-600/30">
            <div className="px-4 py-2 space-y-1">
              {navigationItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`group relative overflow-hidden flex items-center space-x-3 px-3 py-2 rounded-xl text-sm font-medium transition-all duration-300 ${
                      isActive(item.path)
                        ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg'
                        : 'text-slate-200 hover:text-white hover:bg-slate-700/50 border border-slate-600/30 hover:border-slate-500/50'
                    }`}
                  >
                    {!isActive(item.path) && (
                      <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    )}
                    <Icon className="w-4 h-4 relative z-10" />
                    <span className="relative z-10">{item.label}</span>
                  </Link>
                );
              })}
              
              {/* 移动端消息按钮 */}
              <button
                onClick={() => {
                  handleMessageClick();
                  setMobileMenuOpen(false);
                }}
                className="flex items-center space-x-3 px-3 py-2 rounded-xl text-sm font-medium transition-all duration-300 text-slate-200 hover:text-white hover:bg-slate-700/50 w-full"
              >
                <div className="relative flex items-center">
                  <Bell className="w-5 h-5" />
                  {/* 移动端未读消息徽章 - 左侧固定右侧扩展 */}
                       {unreadMessages > 0 && (
                         <div className="absolute -top-1 left-5 bg-gradient-to-r from-red-500 to-red-600 text-white text-xs font-bold rounded-full h-[18px] flex items-center justify-center shadow-lg animate-pulse" style={{minWidth: '18px', padding: '0 3px'}}>
                           <span className="leading-none whitespace-nowrap">{unreadMessages > 99 ? '99+' : unreadMessages}</span>
                         </div>
                       )}
                </div>
                <span>消息通知</span>
              </button>
              
              {/* 移动端用户信息 */}
              <div className="border-t border-slate-600/30 pt-2 mt-2">
                <div className="flex items-center space-x-3 px-3 py-2">
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg">
                    <span className="text-white font-medium text-sm">
                      {user?.username?.charAt(0)?.toUpperCase()}
                    </span>
                  </div>
                  <div className="text-sm">
                    <div className="font-medium text-white flex items-center">
                      {user?.username}
                      {user?.is_admin && (
                        <Crown className="w-3 h-3 ml-1 text-yellow-400" />
                      )}
                    </div>
                    <div className="text-slate-300 text-xs">
                      {user?.is_admin ? '站主' : '用户'}
                    </div>
                  </div>
                </div>

              </div>
            </div>
          </div>
        )}
      </nav>

      {/* 站主欢迎消息 */}
      {user?.is_admin && location.pathname === '/center' ? (
        <div className="relative z-10 bg-gradient-to-r from-yellow-600/20 via-orange-500/20 to-yellow-600/20 backdrop-blur-xl border-b border-yellow-500/30">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
            <div className="flex items-center space-x-2">
              <Crown className="w-5 h-5 text-yellow-400" />
              <span className="text-yellow-100 font-medium">
                欢迎回来，尊敬的站主！您拥有系统的最高管理权限。
              </span>
            </div>
          </div>
        </div>
      ) : null}

      {/* 主要内容区域 */}
      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </main>
      

    </div>
  );
};

export default Layout;

