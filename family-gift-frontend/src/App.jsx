import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './hooks/useAuth.jsx';
import { NotificationProvider } from './contexts/NotificationContext.jsx';
import { VersionProvider } from './contexts/VersionContext.jsx';
import Layout from './components/Layout';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import Center from './pages/Center';
import Record from './pages/Record';
import Archive from './pages/Archive';
import Profile from './pages/Profile';
import AllRecords from './pages/AllRecords';

import Console from './pages/Console';
import AdminDashboard from './pages/AdminDashboard';
import Welcome from './pages/Welcome';
import './App.css';

// 受保护的路由组件
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-50 flex items-center justify-center">
        <div className="text-gray-500">加载中...</div>
      </div>
    );
  }

  return user ? children : <Navigate to="/login" replace />;
};

// 公开路由组件（已登录用户重定向到中心页面）
const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-50 flex items-center justify-center">
        <div className="text-gray-500">加载中...</div>
      </div>
    );
  }

  // 站主用户重定向到控制台，普通用户重定向到欢迎页面
  if (user) {
    return (user.role === 'admin' || user.is_admin) ? <Navigate to="/console" replace /> : <Navigate to="/welcome" replace />;
  }
  
  return children;
};

function App() {
  return (
    <AuthProvider>
      <NotificationProvider>
        <VersionProvider>
          <Router>
        <Routes>
          {/* 公开路由 */}
          <Route path="/login" element={
            <PublicRoute>
              <Login />
            </PublicRoute>
          } />
          <Route path="/register" element={
            <PublicRoute>
              <Register />
            </PublicRoute>
          } />
          <Route path="/forgot-password" element={
            <PublicRoute>
              <ForgotPassword />
            </PublicRoute>
          } />

          {/* 站主控制台 - 独立路由 */}
          <Route path="/console" element={
            <ProtectedRoute>
              <Console />
            </ProtectedRoute>
          } />

          <Route path="/admin-dashboard" element={
            <ProtectedRoute>
              <AdminDashboard />
            </ProtectedRoute>
          } />
          
          {/* 用户欢迎页面 - 独立路由 */}
          <Route path="/welcome" element={
            <ProtectedRoute>
              <Welcome />
            </ProtectedRoute>
          } />

          {/* 受保护的路由 */}
          <Route path="/" element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }>
            <Route index element={<Navigate to="/center" replace />} />
            <Route path="center" element={<Center />} />
            <Route path="record" element={<Record />} />
            <Route path="archive" element={<Archive />} />
            <Route path="profile" element={<Profile />} />
            <Route path="all-records" element={<AllRecords />} />

          </Route>

          {/* 404 页面 */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
          </Router>
        </VersionProvider>
      </NotificationProvider>
    </AuthProvider>
  );
}

export default App;
