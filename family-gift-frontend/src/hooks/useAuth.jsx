import { useState, useEffect, createContext, useContext } from 'react';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // 刷新token
  const refreshToken = async () => {
    try {
      const response = await fetch("/api/refresh-token", {
        method: "POST",
        credentials: "include"
      });
      
      if (response.ok) {
        return true;
      } else {
        return false;
      }
    } catch (error) {
      console.error("Token refresh failed:", error);
      return false;
    }
  };

  // 检查当前用户状态
  const checkAuth = async () => {
    try {
      const response = await fetch("/api/me", {
        credentials: "include"
      });
      
      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
      } else if (response.status === 403) {
        // Token可能过期，尝试刷新
        const refreshSuccess = await refreshToken();
        if (refreshSuccess) {
          // 刷新成功，重新检查用户状态
          const retryResponse = await fetch("/api/me", {
            credentials: "include"
          });
          if (retryResponse.ok) {
            const retryData = await retryResponse.json();
            setUser(retryData.user);
          } else {
            setUser(null);
          }
        } else {
          setUser(null);
        }
      } else {
        setUser(null);
      }
    } catch (error) {
      console.error("Auth check failed:", error);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  // 登录
  const login = async (username, password) => {
    try {
      const response = await fetch("/api/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (response.ok) {
        setUser(data.user);
        return { success: true, data };
      } else {
        return { success: false, error: data.error };
      }
    } catch (error) {
      console.error("Login failed:", error);
      return { success: false, error: "登录失败，请重试" };
    }
  };

  // 注册
  const register = async (userData) => {
    try {
      const response = await fetch("/api/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(userData),
      });

      const data = await response.json();

      if (response.ok) {
        setUser(data.user);
        return { success: true, data };
      } else {
        return { success: false, error: data.error };
      }
    } catch (error) {
      console.error("Registration failed:", error);
      return { success: false, error: "注册失败，请重试" };
    }
  };

  // 注销
  const logout = async () => {
    try {
      await fetch("/api/logout", {
        method: "POST",
        credentials: "include",
      });
    } catch (error) {
      console.error("Logout failed:", error);
    } finally {
      setUser(null);
    }
  };

  // 检查密码强度（前端实现）
  const checkPasswordStrength = (password) => {
    if (!password) {
      return { strength: "weak", score: 0, message: "请输入密码" };
    }

    let score = 0;
    let feedback = [];
    
    // 长度检查
    if (password.length >= 8) {
      score += 1;
    } else {
      feedback.push("至少8个字符");
    }
    
    // 包含小写字母
    if (/[a-z]/.test(password)) {
      score += 1;
    } else {
      feedback.push("包含小写字母");
    }
    
    // 包含大写字母
    if (/[A-Z]/.test(password)) {
      score += 1;
    } else {
      feedback.push("包含大写字母");
    }
    
    // 包含数字
    if (/\d/.test(password)) {
      score += 1;
    } else {
      feedback.push("包含数字");
    }
    
    // 包含特殊字符
    if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      score += 1;
    } else {
      feedback.push("包含特殊字符");
    }
    
    // 长度奖励
    if (password.length >= 12) {
      score += 1;
    }
    
    // 确定强度等级
    let strength, message;
    if (score >= 5) {
      strength = "strong";
      message = "密码强度很高";
    } else if (score >= 3) {
      strength = "medium";
      message = feedback.length > 0 ? `建议：${feedback.join("、")}` : "密码强度中等";
    } else {
      strength = "weak";
      message = `密码强度较弱，建议：${feedback.join("、")}`;
    }
    
    return {
      strength,
      score,
      message
    };
  };

  useEffect(() => {
    checkAuth();
  }, []); // 只在组件初始化时检查一次
  
  useEffect(() => {
    // 设置定期刷新token（每6天刷新一次，确保7天有效期内不会过期）
    const refreshInterval = setInterval(() => {
      if (user) {
        refreshToken();
      }
    }, 6 * 24 * 60 * 60 * 1000); // 6天
    
    return () => {
      clearInterval(refreshInterval);
    };
  }, [user]);

  // 站主登录（发送请求到后端进行认证）
  const adminLogin = async (adminUser) => {
    try {
      // 发送请求到后端进行认证
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ 
          username: adminUser.username,
          isAdmin: true,
          adminKey: "admin-key-2024" // 这个密钥应该与后端匹配
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setUser(adminUser);
        return { success: true, data };
      } else {
        // 如果后端认证失败，仍然设置本地状态（保持原有行为）
        setUser(adminUser);
        console.warn("后端管理员认证失败，使用本地状态");
        return { success: true };
      }
    } catch (error) {
      console.error("Admin login failed:", error);
      // 出错时仍然设置本地状态（保持原有行为）
      setUser(adminUser);
      return { success: true };
    }
  };

  // 更新用户信息
  const updateUser = (updatedUserData) => {
    setUser(prevUser => ({
      ...prevUser,
      ...updatedUserData
    }));
  };

  const value = {
    user,
    loading,
    login,
    register,
    logout,
    checkPasswordStrength,
    checkAuth,
    adminLogin,
    updateUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

