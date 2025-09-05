import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Alert, AlertDescription } from '../components/ui/alert';
import { Badge } from '../components/ui/badge';
import { StatusIndicator } from '../components/ui/status-indicator';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../components/ui/alert-dialog";
import { 
  Crown, 
  Users, 
  Home, 
  Trash2, 
  AlertTriangle,
  BarChart3,
  Calendar,
  DollarSign,
  Shield,
  ArrowLeft,
  LogOut,
  Settings,
  Database,
  Activity,
  AlertCircle,
  Edit,
  Save,
  X
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useVersion } from '../contexts/VersionContext.jsx';
import SystemTerminalModal from '../components/SystemTerminalModal';
import TechSuccessModal from '../components/TechSuccessModal';
import { apiRequest } from '../config/api';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const { versionInfo, updateVersionInfo } = useVersion();
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [families, setFamilies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [activeTab, setActiveTab] = useState('overview');
  const [showDeleteUserDialog, setShowDeleteUserDialog] = useState(false);
  const [showDeleteFamilyDialog, setShowDeleteFamilyDialog] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  const [familyToDelete, setFamilyToDelete] = useState(null);
  
  // 多选相关状态
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [selectedFamilies, setSelectedFamilies] = useState([]);
  const [showBatchDeleteDialog, setShowBatchDeleteDialog] = useState(false);
  const [batchDeleteType, setBatchDeleteType] = useState(''); // 'users' or 'families'
  
  // 选择模式状态
  const [isUserSelectionMode, setIsUserSelectionMode] = useState(false);
  const [isFamilySelectionMode, setIsFamilySelectionMode] = useState(false);
  
  // 科技感弹窗状态
  const [showTechModal, setShowTechModal] = useState(false);
  const [techModalMessage, setTechModalMessage] = useState('');
  const [techModalType, setTechModalType] = useState('success');
  
  // 系统状态监控相关状态
  const [systemStatus, setSystemStatus] = useState({
    backend: 'checking',
    database: 'checking',
    networkSpeed: 'checking',
    ipInfo: 'checking'
  });
  const [networkSpeed, setNetworkSpeed] = useState(0);
  const [lastCheckTime, setLastCheckTime] = useState(null);
  const [ipInfo, setIpInfo] = useState({ ip: '获取中...', location: '获取中...' });
  
  // 版本信息编辑状态
  const [isEditingVersion, setIsEditingVersion] = useState(false);
  const [tempVersionInfo, setTempVersionInfo] = useState(versionInfo);
  
  // 系统终端弹窗状态
  const [showTerminalModal, setShowTerminalModal] = useState(false);
  const [currentOperation, setCurrentOperation] = useState(null);

  // 同步版本信息到临时状态
  useEffect(() => {
    setTempVersionInfo(versionInfo);
  }, [versionInfo]);

  useEffect(() => {
    fetchAdminData();
    
    // 初始化检查
    const initializeMonitoring = async () => {
      // 分别检查后端和网络状态
      await checkBackendStatus();
      
      // 检查网络连接后再决定是否获取IP信息
      const networkResult = await checkNetworkStatus();
      if (networkResult.hasInternet) {
        await getIpInfo();
      }
    };
    
    initializeMonitoring();
    
    // 设置定时器，每30秒检查一次后端状态
    const backendInterval = setInterval(() => {
      checkBackendStatus();
    }, 30000);
    
    // 设置定时器，每30秒检查一次网络状态
    const networkInterval = setInterval(() => {
      checkNetworkStatus();
    }, 30000);
    
    // 设置定时器，每60秒尝试获取一次IP信息（如果有外网连接）
    const ipInterval = setInterval(async () => {
      const networkResult = await checkNetworkStatus();
      if (networkResult.hasInternet) {
        await getIpInfo();
      }
    }, 60000);
    
    return () => {
      clearInterval(backendInterval);
      clearInterval(networkInterval);
      clearInterval(ipInterval);
    };
  }, []);

  const fetchAdminData = async () => {
    setLoading(true);
    try {
      const [statsRes, usersRes, familiesRes] = await Promise.all([
        apiRequest('/api/admin/stats'),
        apiRequest('/api/admin/users'),
        apiRequest('/api/admin/families')
      ]);

      // 检查认证状态
      if (statsRes.status === 401 || statsRes.status === 403) {
        setError('认证失效，请重新登录');
        setTimeout(() => {
          navigate('/login');
        }, 2000);
        return;
      }

      if (statsRes.ok) {
        const data = await statsRes.json();
        setStats(data.stats);
      } else {
        console.error('获取统计数据失败:', statsRes.status, statsRes.statusText);
      }

      if (usersRes.ok) {
        const data = await usersRes.json();
        setUsers(data.users);
      } else {
        console.error('获取用户数据失败:', usersRes.status, usersRes.statusText);
      }

      if (familiesRes.ok) {
        const data = await familiesRes.json();
        setFamilies(data.families);
      } else {
        console.error('获取家庭数据失败:', familiesRes.status, familiesRes.statusText);
      }
    } catch (error) {
      console.error('获取管理员数据失败:', error);
      setError('获取数据失败');
    } finally {
      setLoading(false);
    }
  };

  // 检测外网连接和网速
  const checkNetworkSpeed = async (isManualRefresh = false) => {
    // 开始检测时设置为"正在检测中..."
    setNetworkSpeed('checking');
    
    try {
      // 检测外网连接速度
      const internetStartTime = Date.now();
      const internetResponse = await fetch('https://www.baidu.com/', {
        method: 'HEAD',
        mode: 'no-cors',
        cache: 'no-cache',
        signal: AbortSignal.timeout(8000)
      });
      const internetEndTime = Date.now();
      const internetResponseTime = internetEndTime - internetStartTime;
      
      // 延迟2秒后显示网速结果
      setTimeout(() => {
        setNetworkSpeed(internetResponseTime);
      }, 2000);
      
      return { responseTime: internetResponseTime, hasInternet: true };
    } catch (error) {
      // 外网连接失败
      if (isManualRefresh) {
        // 手动刷新时，延迟2秒后显示为0ms
        setTimeout(() => {
          setNetworkSpeed(0);
        }, 2000);
      } else {
        // 自动刷新时，延迟2秒后显示为0ms
        setTimeout(() => {
          setNetworkSpeed(0);
        }, 2000);
      }
      
      return { responseTime: 0, hasInternet: false };
    }
  };



  // 使用谷歌翻译API翻译地理位置
  const translateLocationWithGoogle = async (location) => {
    if (!location || location === '未知位置' || location === '位置获取失败') {
      return location;
    }
    
    try {
      // 使用谷歌翻译API进行实时翻译
      const response = await fetch(`https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=zh-CN&dt=t&q=${encodeURIComponent(location)}`, {
        signal: AbortSignal.timeout(8000),
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data && data[0] && data[0][0] && data[0][0][0]) {
          console.log('谷歌翻译成功:', data[0][0][0]);
          return data[0][0][0];
        }
      } else {
        console.log('谷歌翻译请求失败:', response.status, response.statusText);
      }
    } catch (error) {
      console.log('谷歌翻译失败，使用原始位置信息:', error.message);
    }
    
    return location;
  };

  // 获取IP和地址信息
  const getIpInfo = async () => {
    // 设置检测中状态
    setSystemStatus(prevStatus => ({
      ...prevStatus,
      ipInfo: 'checking'
    }));
    setIpInfo({ ip: '正在检测中...', location: '正在检测中...' });
    
    const ipApis = [
      // 国内可访问的IP服务
      { url: 'https://myip.ipip.net/json', type: 'ipip' },
      { url: 'https://api.ip.sb/ip', type: 'simple' },
      { url: 'https://httpbin.org/ip', type: 'httpbin' },
      // 国外服务作为备用
      { url: 'https://api.ipify.org?format=json', type: 'ipify' },
      { url: 'https://ipapi.co/json/', type: 'ipapi' },
      { url: 'https://api.myip.com', type: 'myip' }
    ];
    
    let userIP = null;
    
    // 尝试获取IP地址
    for (const api of ipApis) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);
        
        const response = await fetch(api.url, {
          signal: controller.signal,
          headers: {
            'Accept': 'application/json',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
          }
        });
        
        clearTimeout(timeoutId);
        
        if (response.ok) {
          const data = await response.json();
          
          // 根据不同API类型解析IP
          switch (api.type) {
            case 'ipip':
              userIP = data.data?.ip || data.ip;
              break;
            case 'simple':
              userIP = await response.text();
              break;
            case 'httpbin':
              userIP = data.origin;
              break;
            case 'ipify':
              userIP = data.ip;
              break;
            case 'ipapi':
              userIP = data.ip;
              break;
            case 'myip':
              userIP = data.ip;
              break;
          }
          
          // 验证IP格式
          if (userIP && /^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(userIP.trim())) {
            userIP = userIP.trim();
            // 验证不是内网IP
            if (!userIP.startsWith('192.168.') && !userIP.startsWith('10.') && 
                !userIP.startsWith('172.') && !userIP.startsWith('127.')) {
              console.log(`成功通过 ${api.type} 获取到IP: ${userIP}`);
              break;
            }
          }
          userIP = null;
        }
      } catch (error) {
        console.log(`${api.type} API 失败:`, error.message);
        continue;
      }
    }
    
    if (!userIP) {
      setSystemStatus(prevStatus => ({
        ...prevStatus,
        ipInfo: 'offline'
      }));
      setIpInfo({ ip: '无法获取公网IP', location: '请检查网络连接' });
      return;
    }
    
    // 获取地理位置信息
     const locationApis = [
        // 优先使用快速的中文服务
        { url: `http://ip-api.com/json/${userIP}?lang=zh-CN&fields=status,country,regionName,city,query`, type: 'ip-api-cn', headers: {} },
        { url: `http://whois.pconline.com.cn/ipJson.jsp?ip=${userIP}&json=true`, type: 'pconline', headers: {} },
        // 备用国际服务
        { url: `https://ipapi.co/${userIP}/json/`, type: 'ipapi', headers: {} },
        { url: `https://ipinfo.io/${userIP}/json`, type: 'ipinfo', headers: {} },
        { url: `http://ip-api.com/json/${userIP}?fields=status,country,regionName,city,query`, type: 'ip-api-en', headers: {} }
      ];
     
     for (const api of locationApis) {
       try {
         const controller = new AbortController();
         const timeoutId = setTimeout(() => controller.abort(), 5000);
         
         const response = await fetch(api.url, {
           signal: controller.signal,
           headers: {
             'Accept': 'application/json',
             'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
             ...api.headers
           }
         });
         
         clearTimeout(timeoutId);
         
         if (response.ok) {
           let data;
           const contentType = response.headers.get('content-type');
           
           if (contentType && contentType.includes('application/json')) {
             data = await response.json();
           } else {
             const text = await response.text();
             try {
               data = JSON.parse(text);
             } catch {
               console.log(`${api.type} 返回非JSON格式数据`);
               continue;
             }
           }
           
           let locationText = '';
           
           switch (api.type) {
             case 'ip-api-cn':
               if (data.status === 'success') {
                 let parts = [];
                 if (data.country) parts.push(data.country);
                 if (data.regionName) {
                   const region = data.regionName.endsWith('省') || data.regionName.endsWith('市') || data.regionName.endsWith('区') || data.regionName.endsWith('自治区') ? data.regionName : data.regionName + '省';
                   parts.push(region);
                 }
                 if (data.city) {
                   const city = data.city.endsWith('市') || data.city.endsWith('县') || data.city.endsWith('区') ? data.city : data.city + '市';
                   parts.push(city);
                 }
                 locationText = parts.join(' ');
               }
               break;
             case 'pconline':
               if (data.addr) {
                 locationText = data.addr.replace(/\s+/g, ' ').trim();
               }
               break;
             case 'ipapi':
               if (!data.error) {
                 let parts = [];
                 if (data.country_name) parts.push(data.country_name);
                 if (data.region) parts.push(data.region);
                 if (data.city) parts.push(data.city);
                 const englishLocation = parts.join(', ');
                 if (englishLocation) {
                   if (!/[\u4e00-\u9fa5]/.test(englishLocation)) {
                     try {
                       const translatedLocation = await translateLocationWithGoogle(englishLocation);
                       if (translatedLocation) {
                         // 为翻译后的中文地址添加全称后缀
                         const locationParts = translatedLocation.split(' ');
                         const formattedParts = locationParts.map((part, index) => {
                           if (index === 1 && part && !part.endsWith('省') && !part.endsWith('市') && !part.endsWith('区') && !part.endsWith('自治区')) {
                             return part + '省';
                           }
                           if (index === 2 && part && !part.endsWith('市') && !part.endsWith('县') && !part.endsWith('区')) {
                             return part + '市';
                           }
                           return part;
                         });
                         locationText = formattedParts.join(' ');
                       } else {
                         locationText = englishLocation;
                       }
                     } catch {
                       locationText = englishLocation;
                     }
                   } else {
                     locationText = englishLocation;
                   }
                 }
               }
               break;
             case 'ipinfo':
               if (data.city || data.region || data.country) {
                 let parts = [];
                 if (data.country) parts.push(data.country);
                 if (data.region) parts.push(data.region);
                 if (data.city) parts.push(data.city);
                 const englishLocation = parts.join(', ');
                 if (englishLocation) {
                   try {
                     const translatedLocation = await translateLocationWithGoogle(englishLocation);
                     if (translatedLocation) {
                       // 为翻译后的中文地址添加全称后缀
                       const locationParts = translatedLocation.split(' ');
                       const formattedParts = locationParts.map((part, index) => {
                         if (index === 1 && part && !part.endsWith('省') && !part.endsWith('市') && !part.endsWith('区') && !part.endsWith('自治区')) {
                           return part + '省';
                         }
                         if (index === 2 && part && !part.endsWith('市') && !part.endsWith('县') && !part.endsWith('区')) {
                           return part + '市';
                         }
                         return part;
                       });
                       locationText = formattedParts.join(' ');
                     } else {
                       locationText = englishLocation;
                     }
                   } catch {
                     locationText = englishLocation;
                   }
                 }
               }
               break;
             case 'ip-api-en':
               if (data.status === 'success') {
                 let parts = [];
                 if (data.country) parts.push(data.country);
                 if (data.regionName) parts.push(data.regionName);
                 if (data.city) parts.push(data.city);
                 const englishLocation = parts.join(', ');
                 if (englishLocation) {
                   try {
                     const translatedLocation = await translateLocationWithGoogle(englishLocation);
                     if (translatedLocation) {
                       // 为翻译后的中文地址添加全称后缀
                       const locationParts = translatedLocation.split(' ');
                       const formattedParts = locationParts.map((part, index) => {
                         if (index === 1 && part && !part.endsWith('省') && !part.endsWith('市') && !part.endsWith('区') && !part.endsWith('自治区')) {
                           return part + '省';
                         }
                         if (index === 2 && part && !part.endsWith('市') && !part.endsWith('县') && !part.endsWith('区')) {
                           return part + '市';
                         }
                         return part;
                       });
                       locationText = formattedParts.join(' ');
                     } else {
                       locationText = englishLocation;
                     }
                   } catch {
                     locationText = englishLocation;
                   }
                 }
               }
               break;
           }
           
           if (locationText && locationText.trim()) {
             setSystemStatus(prevStatus => ({
               ...prevStatus,
               ipInfo: 'online'
             }));
             setIpInfo({ ip: userIP, location: locationText.trim() });
             console.log(`成功通过 ${api.type} 获取到位置: ${locationText}`);
             return;
           }
         }
       } catch (error) {
         console.log(`${api.type} 地理位置API 失败:`, error.message);
         continue;
       }
     }
     
     // 如果所有地理位置API都失败，至少显示IP
     setSystemStatus(prevStatus => ({
       ...prevStatus,
       ipInfo: userIP ? 'checking' : 'offline'
     }));
     setIpInfo({ ip: userIP, location: '地理位置获取失败' });
  };

  // 检测后端和数据库状态函数（不检测网络）
  const checkBackendStatus = async () => {
    try {
      const response = await apiRequest('/api/health', {
        method: 'GET',
        cache: 'no-cache',
        signal: AbortSignal.timeout(3000)
      });
      
      if (response.ok) {
        const data = await response.json();
        setSystemStatus(prevStatus => ({
          ...prevStatus,
          backend: 'online',
          database: data.database ? 'online' : 'offline'
        }));
      } else {
        setSystemStatus(prevStatus => ({
          ...prevStatus,
          backend: 'offline',
          database: 'offline'
        }));
      }
    } catch (backendError) {
      setSystemStatus(prevStatus => ({
        ...prevStatus,
        backend: 'offline',
        database: 'offline'
      }));
    }
    
    setLastCheckTime(new Date());
  };

  // 检测网络状态函数（仅外网）
  const checkNetworkStatus = async () => {
    // 开始检测时设置状态为检测中
    setSystemStatus(prevStatus => ({
      ...prevStatus,
      networkSpeed: 'checking'
    }));
    
    try {
      const networkResult = await checkNetworkSpeed();
      const networkStatus = networkResult.hasInternet ? 
        (networkResult.responseTime > 0 && networkResult.responseTime < 1000 ? 'online' : 
         networkResult.responseTime > 0 ? 'checking' : 'offline') : 'offline';
      
      setSystemStatus(prevStatus => ({
        ...prevStatus,
        networkSpeed: networkStatus
      }));
      
      // 如果没有外网连接，更新IP信息显示
      if (!networkResult.hasInternet) {
        setSystemStatus(prevStatus => ({
          ...prevStatus,
          ipInfo: 'offline'
        }));
        setIpInfo({ ip: '未获取IP地址，请检查网络状态', location: '未获取地理位置，请检查网络状态' });
      }
      
      return networkResult;
    } catch (error) {
      console.error('网络状态检查失败:', error);
      setSystemStatus(prevStatus => ({
        ...prevStatus,
        networkSpeed: 'offline',
        ipInfo: 'offline'
      }));
      setIpInfo({ ip: '未获取IP地址，请检查网络状态', location: '未获取地理位置，请检查网络状态' });
      return { responseTime: 0, hasInternet: false };
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'online': return 'bg-green-500';
      case 'offline': return 'bg-red-500';
      case 'checking': return 'bg-yellow-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusText = () => {
    if (systemStatus.backend === 'checking') return '系统检测中...';
    if (systemStatus.backend === 'offline') return '后端服务离线';
    if (systemStatus.database === 'offline') return '数据库连接异常';
    if (systemStatus.networkSpeed === 'offline') return '网络连接异常';
    return '系统运行正常';
  };

  const handleDeleteUserClick = (userId) => {
    setUserToDelete(userId);
    setShowDeleteUserDialog(true);
  };

  const handleDeleteUser = async () => {
    if (!userToDelete) return;

    try {
      const response = await fetch(`/api/admin/users/${userToDelete}`, {
        method: 'DELETE',
        credentials: 'include'
      });

      if (response.ok) {
        setSuccess('用户删除成功');
        fetchAdminData();
        setTimeout(() => setSuccess(''), 3000);
      } else {
        const data = await response.json().catch(() => ({}));
        setError(data.error || '删除用户失败');
      }
    } catch (error) {
      setError('删除用户失败');
    } finally {
      setShowDeleteUserDialog(false);
      setUserToDelete(null);
    }
  };

  const handleDeleteFamilyClick = (familyId) => {
    setFamilyToDelete(familyId);
    setShowDeleteFamilyDialog(true);
  };

  const handleDeleteFamily = async () => {
    if (!familyToDelete) return;

    try {
      const response = await apiRequest(`/api/admin/families/${familyToDelete}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        setSuccess('家庭删除成功');
        fetchAdminData();
        setTimeout(() => setSuccess(''), 3000);
      } else {
        const data = await response.json().catch(() => ({}));
        setError(data.error || '删除家庭失败');
      }
    } catch (error) {
      setError('删除家庭失败');
    } finally {
      setShowDeleteFamilyDialog(false);
      setFamilyToDelete(null);
    }
  };

  // 批量删除处理函数
  const handleBatchDelete = async () => {
    const itemsToDelete = batchDeleteType === 'users' ? selectedUsers : selectedFamilies;
    const endpoint = batchDeleteType === 'users' ? 'users' : 'families';
    
    if (itemsToDelete.length === 0) return;

    try {
      // 使用批量删除API端点，避免并发事务问题
      const requestBody = batchDeleteType === 'users' 
        ? { userIds: itemsToDelete }
        : { familyIds: itemsToDelete };
      
      const response = await apiRequest(`/api/admin/${endpoint}/batch-delete`, {
        method: 'POST',
        body: JSON.stringify(requestBody)
      });

      if (response.ok) {
        const data = await response.json();
        const itemType = batchDeleteType === 'users' ? '用户' : '家庭';
        showTechSuccessModal(data.message || `成功删除 ${itemsToDelete.length} 个${itemType}`, 'success');
        fetchAdminData();
      } else {
        const errorData = await response.json();
        setError(errorData.error || '批量删除失败');
      }
    } catch (error) {
      console.error('批量删除错误:', error);
      setError('批量删除失败');
    } finally {
      setShowBatchDeleteDialog(false);
      setBatchDeleteType('');
      // 清空选中项
      if (batchDeleteType === 'users') {
        setSelectedUsers([]);
      } else {
        setSelectedFamilies([]);
      }
    }
   };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  // 选择模式切换函数
  const toggleUserSelectionMode = () => {
    setIsUserSelectionMode(!isUserSelectionMode);
    if (isUserSelectionMode) {
      setSelectedUsers([]); // 退出选择模式时清空选择
    }
  };

  const toggleFamilySelectionMode = () => {
    setIsFamilySelectionMode(!isFamilySelectionMode);
    if (isFamilySelectionMode) {
      setSelectedFamilies([]); // 退出选择模式时清空选择
    }
  };

  // 版本信息编辑相关函数
  const handleEditVersion = () => {
    setTempVersionInfo(versionInfo);
    setIsEditingVersion(true);
  };

  const handleSaveVersion = () => {
    updateVersionInfo(tempVersionInfo);
    setIsEditingVersion(false);
    setSuccess('版本信息已更新');
    setTimeout(() => setSuccess(''), 3000);
  };

  const handleCancelEdit = () => {
    setTempVersionInfo(versionInfo);
    setIsEditingVersion(false);
  };

  const handleVersionInputChange = (field, value) => {
    setTempVersionInfo(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // 打开系统终端弹窗
  const openTerminalModal = (operationType) => {
    setCurrentOperation({ type: operationType });
    setShowTerminalModal(true);
  };

  // 关闭系统终端弹窗
  const closeTerminalModal = () => {
    setShowTerminalModal(false);
    setCurrentOperation(null);
  };

  // 显示科技感弹窗
  const showTechSuccessModal = (message, type = 'success') => {
    setTechModalMessage(message);
    setTechModalType(type);
    setShowTechModal(true);
  };

  const closeTechModal = () => {
    setShowTechModal(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-white text-lg">加载中...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 overflow-hidden">
      {/* 顶部导航栏 - 高级专业样式 */}
      <nav className="bg-gradient-to-r from-slate-800/80 via-slate-700/80 to-slate-800/80 backdrop-blur-xl border-b border-slate-600/50 shadow-2xl">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            {/* 左侧 - 返回按钮和标题 */}
            <div className="flex items-center space-x-6">
              <Button
                onClick={() => navigate('/console')}
                variant="ghost"
                className="group relative overflow-hidden bg-slate-700/30 hover:bg-slate-600/50 border border-slate-600/50 hover:border-slate-500/70 text-slate-200 hover:text-white transition-all duration-300 flex items-center space-x-3 px-6 py-3 rounded-xl shadow-lg hover:shadow-xl"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <ArrowLeft className="w-5 h-5 relative z-10 group-hover:scale-110 transition-transform duration-300" />
                <span className="relative z-10 font-medium">控制台</span>
              </Button>
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full blur-lg opacity-50 animate-pulse"></div>
                  <Crown className="w-10 h-10 text-yellow-400 relative z-10 drop-shadow-lg" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold bg-gradient-to-r from-white via-slate-100 to-slate-200 bg-clip-text text-transparent drop-shadow-lg">站主管理中心</h1>
                  <p className="text-slate-400 text-sm font-medium">System Administration Center</p>
                </div>
              </div>
             </div>
 
              {/* 右侧 - 操作按钮 */}
            <div className="flex items-center space-x-4">

              <Button
                onClick={handleLogout}
                variant="ghost"
                className="group relative overflow-hidden bg-red-900/20 hover:bg-red-800/30 border border-red-700/50 hover:border-red-600/70 text-red-300 hover:text-red-200 transition-all duration-300 flex items-center space-x-3 px-5 py-3 rounded-xl shadow-lg hover:shadow-xl hover:shadow-red-500/20"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-red-500/10 to-pink-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <LogOut className="w-5 h-5 relative z-10 group-hover:scale-110 transition-transform duration-300" />
                <span className="relative z-10 font-medium">退出登录</span>
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* 主要内容区域 */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* 错误和成功提示 */}
        {error && (
          <Alert className="mb-4 bg-red-900/20 border-red-500/50 text-red-200">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        {success && (
          <Alert className="mb-4 bg-green-900/20 border-green-500/50 text-green-200">
            <AlertDescription>{success}</AlertDescription>
          </Alert>
        )}

        {/* 选项卡导航 */}
        <div className="mb-6">
          <div className="flex space-x-1 bg-slate-800/50 p-1 rounded-lg">
            <button
              onClick={() => setActiveTab('overview')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                activeTab === 'overview'
                  ? 'bg-blue-600 text-white shadow-lg'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
              }`}
            >
              <BarChart3 className="w-4 h-4 inline mr-2" />
              系统概览
            </button>
            <button
              onClick={() => setActiveTab('users')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                activeTab === 'users'
                  ? 'bg-blue-600 text-white shadow-lg'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
              }`}
            >
              <Users className="w-4 h-4 inline mr-2" />
              用户管理
            </button>
            <button
              onClick={() => setActiveTab('families')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                activeTab === 'families'
                  ? 'bg-blue-600 text-white shadow-lg'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
              }`}
            >
              <Home className="w-4 h-4 inline mr-2" />
              家庭管理
            </button>
            <button
              onClick={() => setActiveTab('system')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                activeTab === 'system'
                  ? 'bg-blue-600 text-white shadow-lg'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
              }`}
            >
              <Database className="w-4 h-4 inline mr-2" />
              系统管理
            </button>
          </div>
        </div>

        {/* 系统概览 */}
        {activeTab === 'overview' && (
          <div className="space-y-4">
            {/* 数据统计概览 */}
            <div className="bg-gradient-to-br from-slate-800/60 via-slate-800/50 to-slate-900/60 backdrop-blur-xl rounded-2xl border border-slate-600/30 shadow-2xl overflow-hidden">
              {/* 标题区域 */}
              <div className="bg-gradient-to-r from-blue-600/20 via-purple-600/20 to-indigo-600/20 p-4 border-b border-slate-600/30">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="relative">
                      <div className="w-8 h-8 bg-gradient-to-br from-green-500 via-teal-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg">
                        <BarChart3 className="w-4 h-4 text-white" />
                      </div>
                    </div>
                    <div>
                      <h3 className="text-lg font-bold bg-gradient-to-r from-white via-green-100 to-emerald-100 bg-clip-text text-transparent">数据统计概览</h3>
                      <p className="text-slate-400 text-xs">Data Statistics Overview</p>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* 统计卡片 */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 p-4">
              <Card 
                className="bg-slate-800/50 border-slate-700 cursor-pointer hover:bg-slate-700/50 transition-colors duration-200"
                onClick={() => setActiveTab('users')}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-slate-400 text-sm">总用户数</p>
                      <p className="text-2xl font-bold text-white">{stats?.totalUsers || 0}</p>
                    </div>
                    <Users className="w-8 h-8 text-blue-400" />
                  </div>
                </CardContent>
              </Card>

              <Card 
                className="bg-slate-800/50 border-slate-700 cursor-pointer hover:bg-slate-700/50 transition-colors duration-200"
                onClick={() => setActiveTab('families')}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-slate-400 text-sm">总家庭数</p>
                      <p className="text-2xl font-bold text-white">{stats?.totalFamilies || 0}</p>
                    </div>
                    <Home className="w-8 h-8 text-green-400" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-slate-800/50 border-slate-700">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-slate-400 text-sm">总记录数</p>
                      <p className="text-2xl font-bold text-white">{stats?.totalRecords || 0}</p>
                    </div>
                    <Calendar className="w-8 h-8 text-purple-400" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-slate-800/50 border-slate-700">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-slate-400 text-sm">总盈利数</p>
                      <p className={`text-2xl font-bold ${
                        (stats?.totalAmount || 0) < 0 ? 'text-red-400' : 
                        (stats?.totalAmount || 0) === 0 ? 'text-white' : 'text-green-400'
                      }`}>¥{stats?.totalAmount || 0}</p>
                    </div>
                    <DollarSign className="w-8 h-8 text-yellow-400" />
                  </div>
                </CardContent>
              </Card>
            </div>
            </div>

            {/* 系统状态监控 */}
            <div className="bg-gradient-to-br from-slate-800/60 via-slate-800/50 to-slate-900/60 backdrop-blur-xl rounded-2xl border border-slate-600/30 shadow-2xl overflow-hidden">
              {/* 标题区域 */}
              <div className="bg-gradient-to-r from-blue-600/20 via-purple-600/20 to-indigo-600/20 p-4 border-b border-slate-600/30">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="relative">
                      <div className="w-8 h-8 bg-gradient-to-br from-blue-500 via-purple-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                        <Activity className="w-4 h-4 text-white" />
                      </div>
                      <div className="absolute -top-1 -right-1 border-2 border-slate-800 rounded-full">
                        <StatusIndicator 
                  status={
                    systemStatus.backend === 'online' && systemStatus.database === 'online' && systemStatus.networkSpeed !== 'offline' ? 'online' :
                    systemStatus.backend === 'checking' || systemStatus.database === 'checking' || systemStatus.networkSpeed === 'checking' ? 'checking' :
                    'offline'
                  } 
                  size="lg" 
                  showPing={true}
                />
                      </div>
                    </div>
                    <div>
                      <h3 className="text-lg font-bold bg-gradient-to-r from-white via-blue-100 to-purple-100 bg-clip-text text-transparent">实时系统监控</h3>
                      <p className="text-slate-400 text-xs">Real-time System Monitoring</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <StatusIndicator 
                      status={
                        systemStatus.backend === 'online' && systemStatus.database === 'online' && systemStatus.networkSpeed !== 'offline' ? 'online' :
                        systemStatus.backend === 'checking' || systemStatus.database === 'checking' || systemStatus.networkSpeed === 'checking' ? 'checking' :
                        'offline'
                      } 
                      size="lg" 
                      showPing={true}
                    />
                    <span className="text-white font-medium text-sm">{getStatusText()}</span>
                  </div>
                </div>
              </div>

              <div className="p-4 space-y-4">
                {/* 核心服务状态 */}
                <div className="space-y-3">
                  <h4 className="text-white font-semibold text-base flex items-center space-x-2">
                    <Shield className="w-4 h-4 text-blue-400" />
                    <span>核心服务状态</span>
                  </h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {/* 后端服务 */}
                    <div className="group relative overflow-hidden bg-gradient-to-br from-slate-700/40 to-slate-800/40 rounded-xl p-4 border border-slate-600/30 hover:border-blue-500/50 transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/20">
                      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                      <div className="relative z-10">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center space-x-2">
                            <Database className="w-5 h-5 text-blue-400" />
                            <span className="text-white font-medium">后端服务</span>
                          </div>
                          <StatusIndicator 
                            status={systemStatus.backend} 
                            size="lg" 
                            showPing={true}
                          />
                        </div>
                        <div className="text-sm text-slate-300 mb-2">
                          状态: <span className={`font-medium ${systemStatus.backend === 'online' ? 'text-green-400' : systemStatus.backend === 'checking' ? 'text-yellow-400' : 'text-red-400'}`}>
                            {systemStatus.backend === 'online' ? '运行正常' : systemStatus.backend === 'checking' ? '检测中...' : '服务离线'}
                          </span>
                        </div>
                        <div className="text-xs text-slate-400">
                          端口: 5000 | 协议: HTTP/HTTPS
                        </div>
                      </div>
                    </div>

                    {/* 数据库 */}
                    <div className="group relative overflow-hidden bg-gradient-to-br from-slate-700/40 to-slate-800/40 rounded-xl p-4 border border-slate-600/30 hover:border-green-500/50 transition-all duration-300 hover:shadow-lg hover:shadow-green-500/20">
                      <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                      <div className="relative z-10">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center space-x-2">
                            <Database className="w-5 h-5 text-green-400" />
                            <span className="text-white font-medium">数据库</span>
                          </div>
                          <StatusIndicator 
                            status={systemStatus.database} 
                            size="lg" 
                            showPing={true}
                          />
                        </div>
                        <div className="text-sm text-slate-300 mb-2">
                          状态: <span className={`font-medium ${systemStatus.database === 'online' ? 'text-green-400' : systemStatus.database === 'checking' ? 'text-yellow-400' : 'text-red-400'}`}>
                            {systemStatus.database === 'online' ? '连接正常' : systemStatus.database === 'checking' ? '检测中...' : '连接异常'}
                          </span>
                        </div>
                        <div className="text-xs text-slate-400">
                          类型: SQLite | 版本: 3.x
                        </div>
                      </div>
                    </div>

                    {/* 网络状态 */}
                    <div className="group relative overflow-hidden bg-gradient-to-br from-slate-700/40 to-slate-800/40 rounded-xl p-4 border border-slate-600/30 hover:border-purple-500/50 transition-all duration-300 hover:shadow-lg hover:shadow-purple-500/20">
                      <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                      <div className="relative z-10">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center space-x-2">
                            <Activity className="w-5 h-5 text-purple-400" />
                            <span className="text-white font-medium">网络延迟</span>
                          </div>
                          <StatusIndicator 
                            status={
                              networkSpeed === 'checking' || systemStatus.networkSpeed === 'checking' ? 'checking' :
                              systemStatus.networkSpeed
                            } 
                            size="lg" 
                            showPing={true}
                          />
                        </div>
                        <div className="text-sm text-slate-300 mb-2">
                          延迟: <span className={`font-medium ${
                            networkSpeed === 'checking' || systemStatus.networkSpeed === 'checking' ? 'text-yellow-400' :
                            systemStatus.networkSpeed === 'offline' ? 'text-red-400' :
                            networkSpeed > 0 && networkSpeed < 100 ? 'text-green-400' :
                            networkSpeed > 0 && networkSpeed < 300 ? 'text-orange-400' :
                            networkSpeed > 0 ? 'text-red-400' : 'text-red-400'
                          }`}>
                            {
                              networkSpeed === 'checking' || systemStatus.networkSpeed === 'checking' ? '正在检测中...' :
                              systemStatus.networkSpeed === 'offline' ? '无网络连接' :
                              networkSpeed > 0 ? `${networkSpeed}ms` : '请检查网络状态'
                            }
                          </span>
                        </div>
                        <div className="text-xs text-slate-400">
                          质量: {
                            networkSpeed === 'checking' || systemStatus.networkSpeed === 'checking' ? '检测中' :
                            systemStatus.networkSpeed === 'offline' ? '请检查网络状态' :
                            networkSpeed > 0 && networkSpeed < 100 ? '优秀' :
                            networkSpeed > 0 && networkSpeed < 300 ? '良好' :
                            networkSpeed > 0 ? '一般' : '请检查网络状态'
                          }
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 网络信息 */}
                <div className="space-y-3">
                  <h4 className="text-white font-semibold text-base flex items-center space-x-2">
                    <Activity className="w-4 h-4 text-indigo-400" />
                    <span>网络信息</span>
                  </h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {/* IP地址信息 */}
                    <div className="bg-gradient-to-br from-slate-700/40 to-slate-800/40 rounded-xl p-4 border border-slate-600/30">
                      <div className="flex items-center space-x-2 mb-3">
                        <StatusIndicator 
                    status={systemStatus.ipInfo} 
                    size="md" 
                    showPing={true}
                  />
                        <span className="text-white font-medium">IP地址信息</span>
                      </div>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-slate-400">公网IP:</span>
                          <span className={`font-mono ${
                            systemStatus.ipInfo === 'checking' ? 'text-yellow-400' :
                            (ipInfo.ip && ipInfo.ip.includes('请检查网络状态')) ? 'text-red-400' :
                            ipInfo.ip ? 'text-slate-200' : 'text-yellow-400'
                          }`}>{ipInfo.ip || '获取中...'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">地理位置:</span>
                          <span className={`${
                            systemStatus.ipInfo === 'checking' ? 'text-yellow-400' :
                            (ipInfo.location && ipInfo.location.includes('请检查网络状态')) ? 'text-red-400' :
                            ipInfo.location ? 'text-slate-200' : 'text-yellow-400'
                          }`}>{ipInfo.location || '获取中...'}</span>
                        </div>
                      </div>
                    </div>

                    {/* 系统信息 */}
                    <div className="bg-gradient-to-br from-slate-700/40 to-slate-800/40 rounded-xl p-4 border border-slate-600/30">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-2">
                          <StatusIndicator 
                            status="online" 
                            size="md" 
                            showPing={true}
                          />
                          <span className="text-white font-medium">系统信息</span>
                        </div>
                        <Button
                          onClick={handleEditVersion}
                          size="sm"
                          variant="ghost"
                          className="h-6 w-6 p-0 text-slate-400 hover:text-white hover:bg-slate-600/50"
                        >
                          <Edit className="w-3 h-3" />
                        </Button>
                      </div>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-slate-400">系统版本:</span>
                          <Badge className="bg-blue-600/80 text-white text-xs">{versionInfo.version}</Badge>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">运行环境:</span>
                          <Badge className="bg-purple-600/80 text-white text-xs">{versionInfo.environment}</Badge>
                        </div>

                      </div>
                    </div>
                  </div>
                </div>

                {/* 监控控制 */}
                <div className="bg-gradient-to-r from-slate-700/30 via-slate-600/30 to-slate-700/30 rounded-xl p-4 border border-slate-600/30">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center">
                        <Activity className="w-4 h-4 text-white" />
                      </div>
                      <div>
                        <div className="text-white font-medium">监控状态</div>
                        <div className="text-xs text-slate-400">实时监控已启用 • 自动检测间隔: 30秒</div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      {lastCheckTime && (
                        <div className="text-right">
                          <div className="text-xs text-slate-400">最新检测时间</div>
                          <div className="text-sm text-slate-200 font-mono">{lastCheckTime.toLocaleTimeString()}</div>
                        </div>
                      )}
                      <button 
                        onClick={async (e) => {
                          const button = e.target.closest('button');
                          // 脉冲动画效果
                          button.style.transform = 'scale(0.95)';
                          button.style.transition = 'transform 0.1s ease-out';
                          
                          setTimeout(() => {
                            button.style.transform = 'scale(1.05)';
                            button.style.transition = 'transform 0.2s ease-in-out';
                            
                            setTimeout(() => {
                              button.style.transform = 'scale(1)';
                              button.style.transition = 'transform 0.1s ease-out';
                            }, 200);
                          }, 100);
                          
                          try {
                            // 分别检查后端和网络状态
                            await checkBackendStatus();
                            
                            // 手动刷新网络状态（带3秒延迟）
                            const networkResult = await checkNetworkSpeed(true);
                            const networkStatus = networkResult.hasInternet ? 
                              (networkResult.responseTime > 0 && networkResult.responseTime < 1000 ? 'online' : 
                               networkResult.responseTime > 0 ? 'checking' : 'offline') : 'offline';
                            
                            setSystemStatus(prevStatus => ({
                              ...prevStatus,
                              networkSpeed: networkStatus
                            }));
                            
                            // 检查网络连接后再决定是否获取IP信息
                            if (networkResult.hasInternet) {
                              await getIpInfo();
                            } else {
                              // 如果没有外网连接，更新IP信息显示
                              setSystemStatus(prevStatus => ({
                                ...prevStatus,
                                ipInfo: 'offline'
                              }));
                              setIpInfo({ ip: '未获取IP地址，请检查网络状态', location: '未获取地理位置，请检查网络状态' });
                            }
                          } catch (error) {
                            console.error('刷新系统状态失败:', error);
                          }
                        }}
                        className="group relative overflow-hidden bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/30 hover:border-blue-400/50 text-blue-300 hover:text-blue-200 transition-all duration-300 flex items-center space-x-2 px-4 py-2 rounded-lg shadow-lg hover:shadow-blue-500/20"
                        title="手动刷新状态"
                      >
                        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                        <Activity className="w-4 h-4 relative z-10" />
                        <span className="relative z-10 text-sm font-medium">刷新状态</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 用户管理 - 全息科技风格 */}
        {activeTab === 'users' && (
          <div className="relative">
            {/* 外层光晕效果 */}
            <div className="absolute -inset-2 bg-gradient-to-r from-blue-500/20 via-cyan-500/20 to-indigo-500/20 rounded-3xl blur-2xl transition-all duration-700 opacity-60 animate-pulse"></div>
            
            <div className="relative bg-gradient-to-br from-slate-900/95 via-slate-800/95 to-slate-900/95 backdrop-blur-xl rounded-3xl border border-cyan-500/30 shadow-2xl overflow-hidden">
              {/* 全息标题栏 */}
              <div className="relative bg-gradient-to-r from-blue-900/40 via-cyan-900/40 to-indigo-900/40 p-6 border-b border-cyan-500/30">
                {/* 背景动画线条 */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-cyan-500/10 to-transparent animate-pulse"></div>
                <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-cyan-400/50 to-transparent"></div>
                
                <div className="relative flex items-center justify-between">
                  <div className="flex items-center space-x-6">
                    {/* 3D全息图标 */}
                    <div className="relative group">
                      <div className="absolute -inset-2 bg-gradient-to-r from-blue-500/30 to-cyan-500/30 rounded-2xl blur-lg transition-all duration-500 group-hover:blur-xl opacity-60"></div>
                      <div className="relative w-16 h-16 bg-gradient-to-br from-blue-500 via-cyan-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-2xl transform transition-all duration-300 group-hover:scale-110 group-hover:rotate-3">
                        <Users className="w-8 h-8 text-white drop-shadow-lg" />
                        <div className="absolute -top-1 -right-1 w-4 h-4 bg-cyan-400 rounded-full animate-ping"></div>
                        <div className="absolute -top-1 -right-1 w-4 h-4 bg-cyan-400 rounded-full"></div>
                      </div>
                    </div>
                    
                    <div>
                      <h3 className="text-2xl font-bold bg-gradient-to-r from-cyan-300 via-blue-300 to-indigo-300 bg-clip-text text-transparent drop-shadow-lg">
                        用户管理系统
                      </h3>
                      <p className="text-cyan-400/80 text-sm font-medium tracking-wider">USER MANAGEMENT SYSTEM</p>
                      <div className="flex items-center space-x-2 mt-2">
                        <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                        <span className="text-green-400 text-xs font-mono">在线</span>
                        <div className="text-slate-400 text-xs">|</div>
                        <span className="text-cyan-400 text-xs font-mono">{users.length} 用户</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* 右侧操作区域 */}
                  <div className="flex items-center space-x-4">
                    {/* 选择模式按钮 */}
                    <Button
                      onClick={toggleUserSelectionMode}
                      variant="ghost"
                      size="sm"
                      className={`group/btn relative border transition-all duration-300 ${
                        isUserSelectionMode 
                          ? 'bg-cyan-900/30 border-cyan-500/50 text-cyan-300 hover:bg-cyan-900/50' 
                          : 'bg-slate-800/50 border-slate-600/50 text-slate-300 hover:bg-slate-700/50'
                      }`}
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 to-blue-500/10 rounded opacity-0 group-hover/btn:opacity-100 transition-opacity duration-300"></div>
                      <Users className="w-4 h-4 relative z-10" />
                      <span className="ml-2 text-xs font-medium relative z-10">
                        {isUserSelectionMode ? '退出选择' : '选择用户'}
                      </span>
                    </Button>
                    
                    {/* 批量操作按钮 */}
                    {isUserSelectionMode && selectedUsers.length > 0 && (
                      <Button
                        onClick={() => {
                          setBatchDeleteType('users');
                          setShowBatchDeleteDialog(true);
                        }}
                        variant="ghost"
                        size="sm"
                        className="group/btn relative bg-red-900/20 border border-red-500/30 text-red-400 hover:text-red-300 hover:bg-red-900/40 hover:border-red-400/50 transition-all duration-300"
                      >
                        <div className="absolute inset-0 bg-gradient-to-r from-red-500/10 to-pink-500/10 rounded opacity-0 group-hover/btn:opacity-100 transition-opacity duration-300"></div>
                        <Trash2 className="w-4 h-4 relative z-10" />
                        <span className="ml-2 text-xs font-medium relative z-10">
                          {selectedUsers.length > 0 ? `删除选中 (${selectedUsers.length})` : '删除选中'}
                        </span>
                      </Button>
                    )}
                    
                    <div className="text-right">
                      <div className="text-cyan-400 text-xs font-mono">安全等级</div>
                       <div className="text-green-400 text-sm font-bold">最高级</div>
                    </div>
                    <div className="w-12 h-12 bg-gradient-to-br from-green-500/20 to-emerald-500/20 rounded-xl border border-green-500/30 flex items-center justify-center">
                      <Shield className="w-6 h-6 text-green-400" />
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="p-6">
                {users.length > 0 ? (
                  <div className="space-y-4">
                    {/* 数据表格头部 */}
                    <div className="grid grid-cols-12 gap-4 px-6 py-3 bg-gradient-to-r from-slate-800/50 to-slate-700/50 rounded-xl border border-slate-600/30">
                      {isUserSelectionMode && (
                        <div className="col-span-1 text-cyan-400 text-sm font-medium tracking-wider flex items-center justify-center">
                          <input
                            type="checkbox"
                            checked={selectedUsers.length === users.filter(u => !u.is_admin).length && users.filter(u => !u.is_admin).length > 0}
                            onChange={(e) => {
                              const nonAdminUsers = users.filter(u => !u.is_admin);
                              if (e.target.checked) {
                                setSelectedUsers(nonAdminUsers.map(u => u.id));
                              } else {
                                setSelectedUsers([]);
                              }
                            }}
                            className="w-4 h-4 text-cyan-400 bg-slate-800/50 border-cyan-500/30 rounded focus:ring-cyan-400/50 focus:ring-2"
                          />
                        </div>
                      )}
                     <div className={`${isUserSelectionMode ? 'col-span-5' : 'col-span-6'} text-cyan-400 text-sm font-medium tracking-wider`}>用户信息</div>
                     <div className="col-span-3 text-cyan-400 text-sm font-medium tracking-wider">权限等级</div>
                     <div className="col-span-3 text-cyan-400 text-sm font-medium tracking-wider">注册时间</div>

                    </div>
                    
                    {/* 用户卡片列表 */}
                    <div className="space-y-3">
                      {users.map((user, index) => (
                        <div key={user.id} className="group relative">
                          {/* 悬停光效 */}
                          <div className="absolute -inset-1 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 rounded-xl transition-all duration-300 opacity-0 group-hover:opacity-100"></div>
                          
                          <div 
                            className={`relative bg-gradient-to-r from-slate-800/60 to-slate-700/60 backdrop-blur-sm rounded-xl border border-slate-600/30 group-hover:border-cyan-400/50 transition-all duration-300 transform group-hover:scale-[1.02] ${
                              isUserSelectionMode && !user.is_admin ? 'cursor-pointer' : ''
                            }`}
                            onClick={(e) => {
                              // 只在选择模式下且不是管理员时处理点击
                              if (isUserSelectionMode && !user.is_admin) {
                                // 避免点击复选框时触发卡片点击
                                if (e.target.type !== 'checkbox' && !e.target.closest('input[type="checkbox"]')) {
                                  if (selectedUsers.includes(user.id)) {
                                    setSelectedUsers(selectedUsers.filter(id => id !== user.id));
                                  } else {
                                    setSelectedUsers([...selectedUsers, user.id]);
                                  }
                                }
                              }
                            }}
                          >
                            <div className="grid grid-cols-12 gap-4 px-6 py-4 items-center">
                              {/* 选择框 */}
                              {isUserSelectionMode && (
                                <div className="col-span-1 flex items-center justify-center">
                                  {!user.is_admin ? (
                                    <input
                                      type="checkbox"
                                      checked={selectedUsers.includes(user.id)}
                                      onChange={(e) => {
                                        if (e.target.checked) {
                                          setSelectedUsers([...selectedUsers, user.id]);
                                        } else {
                                          setSelectedUsers(selectedUsers.filter(id => id !== user.id));
                                        }
                                      }}
                                      className="w-4 h-4 text-cyan-400 bg-slate-800/50 border-cyan-500/30 rounded focus:ring-cyan-400/50 focus:ring-2"
                                    />
                                  ) : (
                                    <div className="px-2 py-1 bg-yellow-500/20 border border-yellow-500/30 rounded text-yellow-400 text-xs font-medium">
                                      保护
                                    </div>
                                  )}
                                </div>
                              )}
                              
                              {/* 用户信息 */}
                              <div className={`${isUserSelectionMode ? 'col-span-5' : 'col-span-6'} flex items-center space-x-3`}>
                                <div className="w-10 h-10 rounded-full border border-cyan-500/30 overflow-hidden flex items-center justify-center">
                                  {user.avatar ? (
                                    <img 
                                      src={`http://localhost:3000${user.avatar}`} 
                                      alt={user.username}
                                      className="w-full h-full object-cover"
                                      onError={(e) => {
                                        e.target.style.display = 'none';
                                        e.target.nextSibling.style.display = 'flex';
                                      }}
                                    />
                                  ) : null}
                                  <div 
                                    className={`w-full h-full bg-gradient-to-br from-blue-500/20 to-cyan-500/20 flex items-center justify-center ${user.avatar ? 'hidden' : 'flex'}`}
                                  >
                                    <span className="text-cyan-400 font-mono text-sm">{user.username.charAt(0).toUpperCase()}</span>
                                  </div>
                                </div>
                                <div>
                                  <div className="text-white font-medium">{user.nickname ? `${user.nickname}（${user.username}）` : user.username}</div>
                                  <div className="text-slate-400 text-xs font-mono">ID: {user.id}</div>
                                </div>
                              </div>
                              
                              {/* 权限标识 */}
                              <div className="col-span-3">
                                {user.is_admin ? (
                                  <div className="flex items-center space-x-2">
                                    <div className="w-8 h-8 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-lg flex items-center justify-center shadow-lg">
                                      <Crown className="w-4 h-4 text-white" />
                                    </div>
                                    <div>
                                      <div className="text-yellow-400 font-medium text-sm">ADMINISTRATOR</div>
                                      <div className="text-yellow-400/60 text-xs">Full Access</div>
                                    </div>
                                  </div>
                                ) : (
                                  <div className="flex items-center space-x-2">
                                    <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-lg flex items-center justify-center shadow-lg">
                                      <Users className="w-4 h-4 text-white" />
                                    </div>
                                    <div>
                                      <div className="text-blue-400 font-medium text-sm">普通用户</div>
                                      <div className="text-blue-400/60 text-xs">受限访问</div>
                                    </div>
                                  </div>
                                )}
                              </div>
                              
                              {/* 注册时间 */}
                              <div className="col-span-3">
                                <div className="text-slate-300 font-mono text-sm">
                                  {(() => {
                                    const date = new Date(user.created_at);
                                    const beijingTime = new Date(date.getTime() + (8 * 60 * 60 * 1000));
                                    return beijingTime.toLocaleDateString('zh-CN', {
                                      year: 'numeric',
                                      month: '2-digit',
                                      day: '2-digit'
                                    });
                                  })()} 
                                </div>
                                <div className="text-slate-500 text-xs">
                                  {(() => {
                                    const date = new Date(user.created_at);
                                    const beijingTime = new Date(date.getTime() + (8 * 60 * 60 * 1000));
                                    return beijingTime.toLocaleTimeString('zh-CN', {
                                      hour: '2-digit',
                                      minute: '2-digit'
                                    });
                                  })()} 
                                </div>
                              </div>
                              

                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="py-16 flex flex-col items-center justify-center text-center">
                    {/* 空状态全息效果 */}
                    <div className="relative mb-8">
                      <div className="absolute -inset-4 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 rounded-full blur-xl animate-pulse"></div>
                      <div className="relative w-24 h-24 bg-gradient-to-br from-slate-700/50 to-slate-800/50 rounded-full border border-cyan-500/30 flex items-center justify-center">
                        <Users className="w-12 h-12 text-cyan-400/60" />
                        <div className="absolute inset-0 rounded-full border-2 border-cyan-400/20 animate-ping"></div>
                      </div>
                    </div>
                    
                    <h3 className="text-xl font-bold bg-gradient-to-r from-cyan-300 to-blue-300 bg-clip-text text-transparent mb-3">
                      用户数据库为空
                    </h3>
                    <p className="text-slate-400 max-w-md leading-relaxed">
                      系统检测到用户数据库当前为空状态。新用户注册后，相关信息将在此处实时显示。
                    </p>
                    
                    <div className="mt-6 flex items-center space-x-2 text-cyan-400/60 text-sm">
                      <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse"></div>
                      <span className="font-mono">等待数据...</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* 家庭管理 - 全息科技风格 */}
        {activeTab === 'families' && (
          <div className="relative">
            {/* 外层光晕效果 */}
            <div className="absolute -inset-2 bg-gradient-to-r from-emerald-500/20 via-green-500/20 to-teal-500/20 rounded-3xl blur-2xl transition-all duration-700 opacity-60 animate-pulse"></div>
            
            <div className="relative bg-gradient-to-br from-slate-900/95 via-slate-800/95 to-slate-900/95 backdrop-blur-xl rounded-3xl border border-emerald-500/30 shadow-2xl overflow-hidden">
              {/* 全息标题栏 */}
              <div className="relative bg-gradient-to-r from-emerald-900/40 via-green-900/40 to-teal-900/40 p-6 border-b border-emerald-500/30">
                {/* 背景动画线条 */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-emerald-500/10 to-transparent animate-pulse"></div>
                <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-emerald-400/50 to-transparent"></div>
                
                <div className="relative flex items-center justify-between">
                  <div className="flex items-center space-x-6">
                    {/* 3D全息图标 */}
                    <div className="relative group">
                      <div className="absolute -inset-2 bg-gradient-to-r from-emerald-500/30 to-green-500/30 rounded-2xl blur-lg transition-all duration-500 group-hover:blur-xl opacity-60"></div>
                      <div className="relative w-16 h-16 bg-gradient-to-br from-emerald-500 via-green-500 to-teal-600 rounded-2xl flex items-center justify-center shadow-2xl transform transition-all duration-300 group-hover:scale-110 group-hover:rotate-3">
                        <Home className="w-8 h-8 text-white drop-shadow-lg" />
                        <div className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-400 rounded-full animate-ping"></div>
                        <div className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-400 rounded-full"></div>
                      </div>
                    </div>
                    
                    <div>
                      <h3 className="text-2xl font-bold bg-gradient-to-r from-emerald-300 via-green-300 to-teal-300 bg-clip-text text-transparent drop-shadow-lg">
                        家庭管理系统
                      </h3>
                      <p className="text-emerald-400/80 text-sm font-medium tracking-wider">FAMILY MANAGEMENT SYSTEM</p>
                      <div className="flex items-center space-x-2 mt-2">
                        <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                        <span className="text-green-400 text-xs font-mono">活跃</span>
                         <div className="text-slate-400 text-xs">|</div>
                         <span className="text-emerald-400 text-xs font-mono">{families.length} 个家庭</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* 右侧操作区域 */}
                  <div className="flex items-center space-x-4">
                    {/* 选择模式按钮 */}
                    <Button
                      onClick={toggleFamilySelectionMode}
                      variant="ghost"
                      size="sm"
                      className={`group/btn relative border transition-all duration-300 ${
                        isFamilySelectionMode 
                          ? 'bg-emerald-900/30 border-emerald-500/50 text-emerald-300 hover:bg-emerald-900/50' 
                          : 'bg-slate-800/50 border-slate-600/50 text-slate-300 hover:bg-slate-700/50'
                      }`}
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/10 to-green-500/10 rounded opacity-0 group-hover/btn:opacity-100 transition-opacity duration-300"></div>
                      <Home className="w-4 h-4 relative z-10" />
                      <span className="ml-2 text-xs font-medium relative z-10">
                        {isFamilySelectionMode ? '退出选择' : '选择家庭'}
                      </span>
                    </Button>
                    
                    {/* 批量操作按钮 */}
                    {isFamilySelectionMode && selectedFamilies.length > 0 && (
                      <Button
                        onClick={() => {
                          setBatchDeleteType('families');
                          setShowBatchDeleteDialog(true);
                        }}
                        variant="ghost"
                        size="sm"
                        className="group/btn relative bg-red-900/20 border border-red-500/30 text-red-400 hover:text-red-300 hover:bg-red-900/40 hover:border-red-400/50 transition-all duration-300"
                      >
                        <div className="absolute inset-0 bg-gradient-to-r from-red-500/10 to-pink-500/10 rounded opacity-0 group-hover/btn:opacity-100 transition-opacity duration-300"></div>
                        <Trash2 className="w-4 h-4 relative z-10" />
                        <span className="ml-2 text-xs font-medium relative z-10">
                          {selectedFamilies.length > 0 ? `删除选中 (${selectedFamilies.length})` : '删除选中'}
                        </span>
                      </Button>
                    )}
                    
                    <div className="text-right">
                      <div className="text-emerald-400 text-xs font-mono">网络状态</div>
                       <div className="text-green-400 text-sm font-bold">已连接</div>
                    </div>
                    <div className="w-12 h-12 bg-gradient-to-br from-emerald-500/20 to-green-500/20 rounded-xl border border-emerald-500/30 flex items-center justify-center">
                      <Activity className="w-6 h-6 text-emerald-400" />
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="p-6">
                {families.length > 0 ? (
                  <div className="space-y-4">
                    {/* 数据表格头部 */}
                    <div className="grid grid-cols-12 gap-4 px-6 py-3 bg-gradient-to-r from-slate-800/50 to-slate-700/50 rounded-xl border border-slate-600/30">
                      {isFamilySelectionMode && (
                        <div className="col-span-1 text-emerald-400 text-sm font-medium tracking-wider flex items-center justify-center">
                          <input
                            type="checkbox"
                            checked={selectedFamilies.length === families.length && families.length > 0}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedFamilies(families.map(f => f.id));
                              } else {
                                setSelectedFamilies([]);
                              }
                            }}
                            className="w-4 h-4 text-emerald-400 bg-slate-800/50 border-emerald-500/30 rounded focus:ring-emerald-400/50 focus:ring-2"
                          />
                        </div>
                      )}
                        <div className={`${isFamilySelectionMode ? 'col-span-5' : 'col-span-6'} text-emerald-400 text-sm font-medium tracking-wider`}>家庭信息</div>
                        <div className="col-span-3 text-emerald-400 text-sm font-medium tracking-wider">创建者</div>
                       <div className="col-span-3 text-emerald-400 text-sm font-medium tracking-wider">创建时间</div>
                      
                    </div>
                    
                    {/* 家庭卡片列表 */}
                    <div className="space-y-3">
                      {families.map((family, index) => (
                        <div key={family.id} className="group relative">
                          {/* 悬停光效 */}
                          <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500/20 to-green-500/20 rounded-xl transition-all duration-300 opacity-0 group-hover:opacity-100"></div>
                          
                          <div 
                            className={`relative bg-gradient-to-r from-slate-800/60 to-slate-700/60 backdrop-blur-sm rounded-xl border border-slate-600/30 group-hover:border-emerald-400/50 transition-all duration-300 transform group-hover:scale-[1.02] ${
                              isFamilySelectionMode ? 'cursor-pointer' : ''
                            }`}
                            onClick={(e) => {
                              // 只在选择模式下处理点击
                              if (isFamilySelectionMode) {
                                // 避免点击复选框时触发卡片点击
                                if (e.target.type !== 'checkbox' && !e.target.closest('input[type="checkbox"]')) {
                                  if (selectedFamilies.includes(family.id)) {
                                    setSelectedFamilies(selectedFamilies.filter(id => id !== family.id));
                                  } else {
                                    setSelectedFamilies([...selectedFamilies, family.id]);
                                  }
                                }
                              }
                            }}
                          >
                            <div className="grid grid-cols-12 gap-4 px-6 py-4 items-center">
                              {/* 选择框 */}
                              {isFamilySelectionMode && (
                                <div className="col-span-1 flex items-center justify-center">
                                  <input
                                    type="checkbox"
                                    checked={selectedFamilies.includes(family.id)}
                                    onChange={(e) => {
                                      if (e.target.checked) {
                                        setSelectedFamilies([...selectedFamilies, family.id]);
                                      } else {
                                        setSelectedFamilies(selectedFamilies.filter(id => id !== family.id));
                                      }
                                    }}
                                    className="w-4 h-4 text-emerald-400 bg-slate-800/50 border-emerald-500/30 rounded focus:ring-emerald-400/50 focus:ring-2"
                                  />
                                </div>
                              )}
                              
                              {/* 家庭信息 */}
                              <div className={`${isFamilySelectionMode ? 'col-span-5' : 'col-span-6'} flex items-center space-x-3`}>
                                <div className="w-10 h-10 bg-gradient-to-br from-emerald-500/20 to-green-500/20 rounded-full border border-emerald-500/30 flex items-center justify-center">
                                  <Home className="w-5 h-5 text-emerald-400" />
                                </div>
                                <div>
                                  <div className="text-white font-medium">{family.name}</div>
                                  <div className="text-slate-400 text-xs font-mono">ID: {family.id}</div>
                                </div>
                              </div>
                              
                              {/* 创建者 */}
                              <div className="col-span-3">
                                <div className="flex items-center space-x-2">
                                  <div className="w-6 h-6 bg-gradient-to-br from-blue-500/20 to-indigo-500/20 rounded-full border border-blue-500/30 flex items-center justify-center">
                                    <span className="text-blue-400 font-mono text-xs">{family.username.charAt(0).toUpperCase()}</span>
                                  </div>
                                  <div>
                                    <div className="text-slate-300 font-medium text-sm">
                                      {family.nickname ? `${family.nickname}（${family.username}）` : family.username}
                                    </div>
                                    <div className="text-slate-500 text-xs">创建者</div>
                                  </div>
                                </div>
                              </div>
                              
                              {/* 创建时间 */}
                              <div className="col-span-3">
                                <div className="text-slate-300 font-mono text-sm">
                                  {(() => {
                                    const date = new Date(family.created_at);
                                    const beijingTime = new Date(date.getTime() + (8 * 60 * 60 * 1000));
                                    return beijingTime.toLocaleDateString('zh-CN', {
                                      year: 'numeric',
                                      month: '2-digit',
                                      day: '2-digit'
                                    });
                                  })()} 
                                </div>
                                <div className="text-slate-500 text-xs">
                                  {(() => {
                                    const date = new Date(family.created_at);
                                    const beijingTime = new Date(date.getTime() + (8 * 60 * 60 * 1000));
                                    return beijingTime.toLocaleTimeString('zh-CN', {
                                      hour: '2-digit',
                                      minute: '2-digit'
                                    });
                                  })()} 
                                </div>
                              </div>

                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="py-16 flex flex-col items-center justify-center text-center">
                    {/* 空状态全息效果 */}
                    <div className="relative mb-8">
                      <div className="absolute -inset-4 bg-gradient-to-r from-emerald-500/20 to-green-500/20 rounded-full blur-xl animate-pulse"></div>
                      <div className="relative w-24 h-24 bg-gradient-to-br from-slate-700/50 to-slate-800/50 rounded-full border border-emerald-500/30 flex items-center justify-center">
                        <Home className="w-12 h-12 text-emerald-400/60" />
                        <div className="absolute inset-0 rounded-full border-2 border-emerald-400/20 animate-ping"></div>
                      </div>
                    </div>
                    
                    <h3 className="text-xl font-bold bg-gradient-to-r from-emerald-300 to-green-300 bg-clip-text text-transparent mb-3">
                      家庭数据库为空
                    </h3>
                    <p className="text-slate-400 max-w-md leading-relaxed">
                      系统检测到家庭数据库当前为空状态。新家庭创建后，相关信息将在此处实时显示。
                    </p>
                    
                    <div className="mt-6 flex items-center space-x-2 text-emerald-400/60 text-sm">
                      <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
                      <span className="font-mono">等待数据...</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* 系统管理 - 科幻炫酷设计 */}
        {activeTab === 'system' && (
          <div className="space-y-8">
            {/* 版本信息管理 - 全息面板风格 */}
            <div className="relative">
              {/* 外层光晕效果 */}
              <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500/20 via-blue-500/20 to-purple-500/20 rounded-3xl blur-xl transition-all duration-500 opacity-60"></div>
              
              <div className="relative bg-gradient-to-br from-slate-900/95 via-slate-800/95 to-slate-900/95 backdrop-blur-xl rounded-3xl border border-cyan-500/30 shadow-2xl overflow-hidden">
                {/* 顶部霓虹标题栏 */}
                <div className="relative bg-gradient-to-r from-cyan-900/40 via-blue-900/40 to-purple-900/40 p-6 border-b border-cyan-500/30">
                  {/* 背景动画线条 */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-cyan-500/10 to-transparent animate-pulse"></div>
                  
                  <div className="relative flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      {/* 3D图标容器 */}
                      <div className="relative">
                        <div className="w-12 h-12 bg-gradient-to-br from-cyan-400 via-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg transform rotate-3 hover:rotate-6 transition-transform duration-300">
                          <div className="absolute inset-0 bg-gradient-to-br from-cyan-400/50 to-purple-600/50 rounded-2xl blur-md"></div>
                          <Settings className="relative w-6 h-6 text-white drop-shadow-lg" />
                        </div>
                        {/* 脉冲环 */}
                        <div className="absolute inset-0 rounded-2xl border-2 border-cyan-400/50 animate-ping"></div>
                      </div>
                      
                      <div>
                        <h3 className="text-2xl font-bold bg-gradient-to-r from-cyan-300 via-blue-300 to-purple-300 bg-clip-text text-transparent drop-shadow-lg">
                          版本信息管理
                        </h3>
                        <p className="text-cyan-400/80 text-sm font-medium tracking-wider">VERSION CONTROL SYSTEM</p>
                      </div>
                    </div>
                    
                    {/* 状态指示器 */}
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse shadow-lg shadow-green-400/50"></div>
                      <span className="text-green-400 text-xs font-medium">ONLINE</span>
                    </div>
                  </div>
                </div>
                
                <div className="p-8">
                  {!isEditingVersion ? (
                    <div className="space-y-8">
                      {/* 版本信息展示 - 全息卡片 */}
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {/* 系统版本卡片 */}
                        <div className="group relative cursor-pointer" onClick={() => {
                          setTempVersionInfo(versionInfo);
                          setIsEditingVersion(true);
                        }}>
                          <div className="absolute -inset-0.5 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-2xl opacity-30 group-hover:opacity-60 transition duration-300"></div>
                          <div className="relative bg-gradient-to-br from-slate-800/80 to-slate-900/80 backdrop-blur-sm rounded-2xl p-6 border border-cyan-500/30 hover:border-cyan-400/50 transition-all duration-300 transform group-hover:scale-105">
                            <div className="flex items-center justify-between mb-4">
                              <div className="flex items-center space-x-3">
                                <div className="w-8 h-8 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-lg flex items-center justify-center">
                                  <span className="text-white font-bold text-sm">V</span>
                                </div>
                                <span className="text-cyan-300 font-semibold">系统版本</span>
                                <Edit className="w-4 h-4 text-cyan-400/60 group-hover:text-cyan-400 transition-colors duration-300" />
                              </div>
                              <div className="px-4 py-2 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 rounded-xl border border-cyan-400/30">
                                <span className="text-cyan-300 font-mono text-lg font-bold">{versionInfo.version}</span>
                              </div>
                            </div>
                            <div className="h-1 bg-gradient-to-r from-cyan-500/30 to-blue-500/30 rounded-full"></div>
                          </div>
                        </div>
                        
                        {/* 运行环境卡片 */}
                        <div className="group relative cursor-pointer" onClick={() => {
                          setTempVersionInfo(versionInfo);
                          setIsEditingVersion(true);
                        }}>
                          <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl opacity-30 group-hover:opacity-60 transition duration-300"></div>
                          <div className="relative bg-gradient-to-br from-slate-800/80 to-slate-900/80 backdrop-blur-sm rounded-2xl p-6 border border-purple-500/30 hover:border-purple-400/50 transition-all duration-300 transform group-hover:scale-105">
                            <div className="flex items-center justify-between mb-4">
                              <div className="flex items-center space-x-3">
                                <div className="w-8 h-8 bg-gradient-to-br from-purple-400 to-pink-500 rounded-lg flex items-center justify-center">
                                  <span className="text-white font-bold text-sm">E</span>
                                </div>
                                <span className="text-purple-300 font-semibold">运行环境</span>
                                <Edit className="w-4 h-4 text-purple-400/60 group-hover:text-purple-400 transition-colors duration-300" />
                              </div>
                              <div className="px-4 py-2 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-xl border border-purple-400/30">
                                <span className="text-purple-300 font-mono text-lg font-bold">{versionInfo.environment}</span>
                              </div>
                            </div>
                            <div className="h-1 bg-gradient-to-r from-purple-500/30 to-pink-500/30 rounded-full"></div>
                          </div>
                        </div>
                      </div>
                      

                      

                    </div>
                  ) : (
                    <div className="space-y-8">
                      {/* 编辑表单 - 科幻风格 */}
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* 系统版本输入 */}
                        <div className="space-y-3">
                          <label className="block text-cyan-300 font-semibold text-sm tracking-wider">系统版本</label>
                          <div className="relative">
                            <input
                              type="text"
                              value={tempVersionInfo.version}
                              onChange={(e) => handleVersionInputChange('version', e.target.value)}
                              className="w-full px-4 py-3 bg-slate-800/50 border border-cyan-500/30 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-400 transition-all duration-300"
                              placeholder="例如: v1.0.4"
                            />
                            <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-cyan-500/10 to-blue-500/10 pointer-events-none"></div>
                          </div>
                        </div>
                        
                        {/* 运行环境选择 */}
                        <div className="space-y-3">
                          <label className="block text-purple-300 font-semibold text-sm tracking-wider">运行环境</label>
                          <div className="relative">
                            <select
                              value={tempVersionInfo.environment}
                              onChange={(e) => handleVersionInputChange('environment', e.target.value)}
                              className="w-full px-4 py-3 bg-slate-800/50 border border-purple-500/30 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-400 transition-all duration-300 appearance-none"
                            >
                              <option value="开发环境">开发环境</option>
                              <option value="测试环境">测试环境</option>
                              <option value="生产环境">生产环境</option>
                            </select>
                            <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-purple-500/10 to-pink-500/10 pointer-events-none"></div>
                          </div>
                        </div>
                      </div>
                      

                      
                      {/* 操作按钮 */}
                      <div className="flex justify-end space-x-4">
                        <Button
                          onClick={handleCancelEdit}
                          className="group relative px-6 py-3 bg-slate-700/50 hover:bg-slate-600/50 text-slate-300 border border-slate-600/50 rounded-xl transition-all duration-300"
                        >
                          <div className="flex items-center space-x-2">
                            <X className="w-4 h-4" />
                            <span>取消</span>
                          </div>
                        </Button>
                        <Button
                          onClick={handleSaveVersion}
                          className="group relative px-6 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl shadow-lg transform hover:scale-105 transition-all duration-300"
                        >
                          <div className="absolute inset-0 bg-gradient-to-r from-emerald-400/20 to-teal-400/20 rounded-xl blur group-hover:blur-md transition-all duration-300"></div>
                          <div className="relative flex items-center space-x-2">
                            <Save className="w-4 h-4" />
                            <span>保存更改</span>
                          </div>
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* 系统工具 - 矩阵风格 */}
            <div className="relative">
              {/* 外层光晕效果 */}
              <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500/20 via-teal-500/20 to-cyan-500/20 rounded-3xl blur-xl transition-all duration-500 opacity-60"></div>
              
              <div className="relative bg-gradient-to-br from-slate-900/95 via-slate-800/95 to-slate-900/95 backdrop-blur-xl rounded-3xl border border-emerald-500/30 shadow-2xl overflow-hidden">
                {/* 顶部标题栏 */}
                <div className="relative bg-gradient-to-r from-emerald-900/40 via-teal-900/40 to-cyan-900/40 p-6 border-b border-emerald-500/30">
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-emerald-500/10 to-transparent animate-pulse"></div>
                  
                  <div className="relative flex items-center space-x-4">
                    <div className="relative">
                      <div className="w-12 h-12 bg-gradient-to-br from-emerald-400 via-teal-500 to-cyan-600 rounded-2xl flex items-center justify-center shadow-lg transform -rotate-3 hover:rotate-3 transition-transform duration-300">
                        <div className="absolute inset-0 bg-gradient-to-br from-emerald-400/50 to-cyan-600/50 rounded-2xl blur-md"></div>
                        <Database className="relative w-6 h-6 text-white drop-shadow-lg" />
                      </div>
                      <div className="absolute inset-0 rounded-2xl border-2 border-emerald-400/50 animate-ping"></div>
                    </div>
                    
                    <div>
                      <h3 className="text-2xl font-bold bg-gradient-to-r from-emerald-300 via-teal-300 to-cyan-300 bg-clip-text text-transparent drop-shadow-lg">
                        系统工具矩阵
                      </h3>
                      <p className="text-emerald-400/80 text-sm font-medium tracking-wider">SYSTEM TOOLS MATRIX</p>
                    </div>
                  </div>
                </div>
                
                <div className="p-8">
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* 数据库维护 */}
                    <div className="group relative">
                      <div className="absolute -inset-1 bg-gradient-to-r from-blue-500/30 to-cyan-500/30 rounded-2xl transition-all duration-500 opacity-0 group-hover:opacity-100"></div>
                      
                      <div className="relative bg-gradient-to-br from-slate-800/60 to-slate-900/60 backdrop-blur-sm rounded-2xl p-6 border border-blue-500/30 group-hover:border-cyan-400/50 transition-all duration-300 transform group-hover:scale-105">
                        {/* 右上角英文标题 */}
                        <div className="absolute top-4 right-4 text-right">
                          <div className="text-cyan-400 text-xs font-mono whitespace-nowrap">DB-MAINT</div>
                          <div className="text-slate-400 text-xs">v2.1.0</div>
                        </div>
                        
                        {/* 图标和标题区域 */}
                        <div className="flex items-center space-x-4 mb-6">
                          <div className="relative">
                            <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-2xl flex items-center justify-center shadow-lg group-hover:shadow-cyan-500/25 transition-all duration-300">
                              <Database className="w-7 h-7 text-white" />
                            </div>
                            <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-400 rounded-full animate-pulse shadow-lg shadow-green-400/50"></div>
                          </div>
                          <div>
                            <h4 className="text-xl font-bold text-white group-hover:text-cyan-300 transition-colors duration-300">
                              数据库维护
                            </h4>
                            <p className="text-slate-400 text-sm">智能清理无效数据，优化数据库性能，确保系统稳定运行</p>
                          </div>
                        </div>
                        
                        {/* 状态指示器 */}
                        <div className="flex items-center space-x-2 mb-6">
                          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                          <span className="text-green-400 text-xs font-medium">READY</span>
                          <div className="flex-1 h-px bg-gradient-to-r from-green-400/50 to-transparent"></div>
                        </div>
                        
                        {/* 操作按钮 */}
                        <Button 
                          onClick={() => openTerminalModal('maintenance')}
                          className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-semibold py-3 rounded-xl shadow-lg group-hover:shadow-cyan-500/25 transform group-hover:scale-105 transition-all duration-300"
                        >
                          <span className="flex items-center justify-center space-x-2">
                            <span>执行维护</span>
                            <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                          </span>
                        </Button>
                      </div>
                    </div>
                    
                    {/* 系统备份 */}
                    <div className="group relative">
                      <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500/30 to-green-500/30 rounded-2xl transition-all duration-500 opacity-0 group-hover:opacity-100"></div>
                      
                      <div className="relative bg-gradient-to-br from-slate-800/60 to-slate-900/60 backdrop-blur-sm rounded-2xl p-6 border border-emerald-500/30 group-hover:border-green-400/50 transition-all duration-300 transform group-hover:scale-105">
                        {/* 右上角英文标题 */}
                        <div className="absolute top-4 right-4 text-right">
                          <div className="text-green-400 text-xs font-mono whitespace-nowrap">SYS-BACKUP</div>
                          <div className="text-slate-400 text-xs">v3.0.1</div>
                        </div>
                        
                        <div className="flex items-center space-x-4 mb-6">
                          <div className="relative">
                            <div className="w-14 h-14 bg-gradient-to-br from-emerald-500 to-green-600 rounded-2xl flex items-center justify-center shadow-lg group-hover:shadow-green-500/25 transition-all duration-300">
                              <Shield className="w-7 h-7 text-white" />
                            </div>
                            <div className="absolute -top-1 -right-1 w-4 h-4 bg-blue-400 rounded-full animate-pulse shadow-lg shadow-blue-400/50"></div>
                          </div>
                          <div>
                            <h4 className="text-xl font-bold text-white group-hover:text-green-300 transition-colors duration-300">
                              系统备份
                            </h4>
                            <p className="text-slate-400 text-sm">创建完整的系统数据备份，多重加密保障数据安全</p>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-2 mb-6">
                          <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                          <span className="text-blue-400 text-xs font-medium">STANDBY</span>
                          <div className="flex-1 h-px bg-gradient-to-r from-blue-400/50 to-transparent"></div>
                        </div>
                        
                        <Button 
                          onClick={() => openTerminalModal('backup')}
                          className="w-full bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500 text-white font-semibold py-3 rounded-xl shadow-lg group-hover:shadow-green-500/25 transform group-hover:scale-105 transition-all duration-300"
                        >
                          <span className="flex items-center justify-center space-x-2">
                            <span>创建备份</span>
                            <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                          </span>
                        </Button>
                      </div>
                    </div>
                    
                    {/* 系统日志 */}
                    <div className="group relative">
                      <div className="absolute -inset-1 bg-gradient-to-r from-purple-500/30 to-pink-500/30 rounded-2xl transition-all duration-500 opacity-0 group-hover:opacity-100"></div>
                      
                      <div className="relative bg-gradient-to-br from-slate-800/60 to-slate-900/60 backdrop-blur-sm rounded-2xl p-6 border border-purple-500/30 group-hover:border-pink-400/50 transition-all duration-300 transform group-hover:scale-105">
                        {/* 右上角英文标题 */}
                        <div className="absolute top-4 right-4 text-right">
                          <div className="text-purple-400 text-xs font-mono whitespace-nowrap">LOG-VIEWER</div>
                          <div className="text-slate-400 text-xs">v1.8.3</div>
                        </div>
                        
                        <div className="flex items-center space-x-4 mb-6">
                          <div className="relative">
                            <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl flex items-center justify-center shadow-lg group-hover:shadow-purple-500/25 transition-all duration-300">
                              <Activity className="w-7 h-7 text-white" />
                            </div>
                            <div className="absolute -top-1 -right-1 w-4 h-4 bg-yellow-400 rounded-full animate-pulse shadow-lg shadow-yellow-400/50"></div>
                          </div>
                          <div>
                            <h4 className="text-xl font-bold text-white group-hover:text-purple-300 transition-colors duration-300">
                              系统日志
                            </h4>
                            <p className="text-slate-400 text-sm">实时监控系统运行状态，查看详细的日志和错误记录</p>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-2 mb-6">
                          <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></div>
                          <span className="text-yellow-400 text-xs font-medium">ACTIVE</span>
                          <div className="flex-1 h-px bg-gradient-to-r from-yellow-400/50 to-transparent"></div>
                        </div>
                        
                        <Button 
                          onClick={() => openTerminalModal('logs')}
                          className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-semibold py-3 rounded-xl shadow-lg group-hover:shadow-purple-500/25 transform group-hover:scale-105 transition-all duration-300"
                        >
                          <span className="flex items-center justify-center space-x-2">
                            <span>查看日志</span>
                            <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                          </span>
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 删除用户确认弹窗 */}
      <AlertDialog open={showDeleteUserDialog} onOpenChange={setShowDeleteUserDialog}>
        <AlertDialogContent className="bg-slate-800 border border-slate-600/50 text-white">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-bold bg-gradient-to-r from-white via-blue-100 to-indigo-100 bg-clip-text text-transparent flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-400" />
              确认删除用户
            </AlertDialogTitle>
            <AlertDialogDescription className="text-slate-300">
              此操作将永久删除该用户及其所有数据，包括礼金记录和家庭信息。此操作不可撤销。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-4">
            <AlertDialogCancel className="bg-slate-700 hover:bg-slate-600 text-white border-slate-600 hover:border-slate-500">
              取消
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteUser}
              className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white border-none"
            >
              确认删除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* 删除家庭确认弹窗 */}
      <AlertDialog open={showDeleteFamilyDialog} onOpenChange={setShowDeleteFamilyDialog}>
        <AlertDialogContent className="bg-slate-800 border border-slate-600/50 text-white">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-bold bg-gradient-to-r from-white via-blue-100 to-indigo-100 bg-clip-text text-transparent flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-400" />
              确认删除家庭
            </AlertDialogTitle>
            <AlertDialogDescription className="text-slate-300">
              此操作将永久删除该家庭及其所有礼金记录数据。此操作不可撤销。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-4">
            <AlertDialogCancel className="bg-slate-700 hover:bg-slate-600 text-white border-slate-600 hover:border-slate-500">
              取消
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteFamily}
              className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white border-none"
            >
              确认删除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* 批量删除确认弹窗 */}
      <AlertDialog open={showBatchDeleteDialog} onOpenChange={setShowBatchDeleteDialog}>
        <AlertDialogContent className="bg-slate-800 border border-slate-600/50 text-white">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-bold bg-gradient-to-r from-white via-blue-100 to-indigo-100 bg-clip-text text-transparent flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-400" />
              批量删除确认
            </AlertDialogTitle>
            <AlertDialogDescription className="text-slate-300">
              {batchDeleteType === 'users' 
                ? `您即将删除 ${selectedUsers.length} 个用户及其所有数据，包括礼金记录和家庭信息。`
                : `您即将删除 ${selectedFamilies.length} 个家庭及其所有礼金记录数据。`
              }
              <br />
              <span className="text-red-400 font-medium">此操作不可撤销，请谨慎操作！</span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-4">
            <AlertDialogCancel className="bg-slate-700 hover:bg-slate-600 text-white border-slate-600 hover:border-slate-500">
              取消
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleBatchDelete}
              className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white border-none"
            >
              确认删除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* 系统终端弹窗 */}
      <SystemTerminalModal 
        isOpen={showTerminalModal}
        onClose={closeTerminalModal}
        operation={currentOperation}
      />

      {/* 科技感成功弹窗 */}
      <TechSuccessModal 
        isOpen={showTechModal}
        onClose={closeTechModal}
        message={techModalMessage}
        type={techModalType}
      />
    </div>
  );
};

export default AdminDashboard;