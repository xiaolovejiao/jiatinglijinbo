import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { StatusIndicator } from '../components/ui/status-indicator';
import { User, Settings, Crown, Shield } from 'lucide-react';
import { apiRequest } from '../config/api';

const Console = () => {
  const navigate = useNavigate();
  const [systemStatus, setSystemStatus] = useState({
    backend: 'checking',
    database: 'checking',
    networkSpeed: 'checking'
  });
  const [networkSpeed, setNetworkSpeed] = useState(0);
  const [lastCheckTime, setLastCheckTime] = useState(null);
  const [ipInfo, setIpInfo] = useState({ ip: '获取中...', location: '获取中...' });
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  // 检测网速（外网连接）
  const checkNetworkSpeed = async () => {
    try {
      const startTime = Date.now();
      const response = await fetch('https://www.baidu.com/', {
        method: 'HEAD',
        mode: 'no-cors',
        cache: 'no-cache',
        signal: AbortSignal.timeout(8000)
      });
      const endTime = Date.now();
      const responseTime = endTime - startTime;
      
      // 计算网速评级 (ms)
      let speed = 0;
      if (responseTime < 100) speed = 100;
      else if (responseTime < 200) speed = 80;
      else if (responseTime < 500) speed = 60;
      else if (responseTime < 1000) speed = 40;
      else speed = 20;
      
      setNetworkSpeed(responseTime);
      return speed;
    } catch (error) {
      setNetworkSpeed(0);
      return 0;
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
    setIpInfo({ ip: '检测中...', location: '检测中...' });
    
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
     setIpInfo({ ip: userIP, location: '地理位置获取失败' });
  };

  // 检测系统状态函数
  const checkSystemStatus = async () => {
    try {
      // 检测网速（外网连接）
      const speedScore = await checkNetworkSpeed();
      
      // 检测后端API状态
      const response = await apiRequest('/api/health', {
        method: 'GET',
        signal: AbortSignal.timeout(5000)
      });
      
      if (response.ok) {
        const data = await response.json();
        setSystemStatus({
          backend: 'online',
          database: data.database ? 'online' : 'offline',
          networkSpeed: speedScore > 50 ? 'online' : speedScore > 0 ? 'checking' : 'offline'
        });
        setLastCheckTime(new Date());
      } else {
        setSystemStatus({
          backend: 'offline',
          database: 'offline',
          networkSpeed: speedScore > 50 ? 'online' : speedScore > 0 ? 'checking' : 'offline'
        });
        setLastCheckTime(new Date());
      }
    } catch (error) {
      // 即使后端离线，也要检测外网速度
      const speedScore = await checkNetworkSpeed();
      setSystemStatus({
        backend: 'offline',
        database: 'offline',
        networkSpeed: speedScore > 50 ? 'online' : speedScore > 0 ? 'checking' : 'offline'
      });
      setLastCheckTime(new Date());
    }
  };

  // 鼠标跟随效果
  useEffect(() => {
    const handleMouseMove = (e) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // 自动检测系统状态
  useEffect(() => {
    // 立即检测一次
    checkSystemStatus();
    // 获取IP信息
    getIpInfo();
    
    // 每30秒检测一次
    const interval = setInterval(checkSystemStatus, 30000);
    
    // 清理函数
     return () => {
       clearInterval(interval);
     };
  }, []);

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

  const getNetworkSpeedText = () => {
    if (networkSpeed === 0) return '检测失败';
    if (networkSpeed < 100) return '极快';
    if (networkSpeed < 200) return '良好';
    if (networkSpeed < 500) return '一般';
    if (networkSpeed < 1000) return '较慢';
    return '很慢';
  };

  return (
    <div 
      className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 relative overflow-hidden flex items-center justify-center p-4"
      style={{
        background: `
          radial-gradient(120px circle at ${mousePosition.x}px ${mousePosition.y}px, rgba(255, 255, 255, 0.12), rgba(255, 255, 255, 0.04) 60%, transparent 80%),
          radial-gradient(250px circle at ${mousePosition.x}px ${mousePosition.y}px, rgba(168, 85, 247, 0.06), transparent 70%),
          linear-gradient(135deg, rgb(15 23 42) 0%, rgb(88 28 135) 50%, rgb(15 23 42) 100%)
        `
      }}
    >
      {/* 动态背景装饰 */}
      <div className="absolute inset-0">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-blue-500/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl animate-pulse delay-500"></div>
      </div>
      
      {/* 站主管理系统卡片 */}
      <div className="relative z-10 bg-white/10 rounded-2xl shadow-2xl border border-white/20 p-6 w-full max-w-md hover:scale-105 transition-transform duration-300">
        {/* 卡片内部光效 */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent rounded-3xl"></div>
        
        <div className="relative text-center">
          {/* 顶部图标和标题 */}
          <div className="relative mb-6">
            <div className="w-20 h-20 bg-gradient-to-br from-yellow-400 via-purple-500 to-blue-600 rounded-full flex items-center justify-center mx-auto shadow-xl shadow-purple-500/50 animate-pulse">
              <Crown className="w-10 h-10 text-white drop-shadow-lg" />
            </div>
          </div>
          
          <h1 className="text-2xl font-bold text-white mb-4 tracking-wide drop-shadow-lg">
            站主控制台
          </h1>
          <p className="text-gray-300 mb-6 leading-relaxed text-sm max-w-sm mx-auto">
            全面管理您的家庭礼金薄系统
          </p>
          
          {/* 系统状态指示器 - 超紧凑布局 */}
          <div className="bg-white/5 backdrop-blur-sm rounded-lg p-3 mb-6 border border-white/10">
            <h3 className="text-white text-sm font-semibold mb-2 text-center">系统监控</h3>
            
            {/* 状态网格布局 - 3列超紧凑 */}
            <div className="grid grid-cols-3 gap-2 mb-2">
              {/* 后端状态 */}
              <div className="bg-white/5 rounded p-1.5 text-center border border-white/10 hover:bg-white/10 transition-all duration-300">
                <div className="flex items-center justify-center mb-1">
                  <StatusIndicator 
                    status={systemStatus.backend} 
                    size="sm" 
                    showPing={true}
                  />
                </div>
                <span className="text-white font-medium text-xs">后端</span>
                <div className="text-xs text-gray-300">
                  {systemStatus.backend === 'online' ? '在线' : systemStatus.backend === 'checking' ? '检测中...' : '离线'}
                </div>
              </div>
              
              {/* 数据库状态 */}
              <div className="bg-white/5 rounded p-1.5 text-center border border-white/10 hover:bg-white/10 transition-all duration-300">
                <div className="flex items-center justify-center mb-1">
                  <StatusIndicator 
                    status={systemStatus.database} 
                    size="sm" 
                    showPing={true}
                  />
                </div>
                <span className="text-white font-medium text-xs">数据库</span>
                <div className="text-xs text-gray-300">
                  {systemStatus.database === 'online' ? '在线' : systemStatus.database === 'checking' ? '检测中...' : '离线'}
                </div>
              </div>
              
              {/* 网速状态 */}
              <div className="bg-white/5 rounded p-1.5 text-center border border-white/10 hover:bg-white/10 transition-all duration-300">
                <div className="flex items-center justify-center mb-1">
                  <StatusIndicator 
                    status={systemStatus.networkSpeed} 
                    size="sm" 
                    showPing={true}
                  />
                </div>
                <span className="text-white font-medium text-xs">网速</span>
                <div className={`text-xs ${
                  networkSpeed === 'checking' || systemStatus.networkSpeed === 'checking' ? 'text-yellow-400' :
                  networkSpeed === 0 ? 'text-red-400' : 
                  networkSpeed > 0 && networkSpeed < 100 ? 'text-green-400' : 
                  networkSpeed > 0 && networkSpeed < 300 ? 'text-orange-400' : 
                  networkSpeed > 0 ? 'text-red-400' : 'text-gray-300'
                }`}>
                  {networkSpeed === 'checking' || systemStatus.networkSpeed === 'checking' ? '检测中...' :
                   networkSpeed === 0 ? '检测失败' : 
                   networkSpeed > 0 ? `${networkSpeed}ms` : '检测中...'}
                </div>
              </div>
            </div>
            
            {/* IP地址和地理位置信息 - 合并显示 */}
              <div className="bg-white/5 rounded p-2 text-center border border-white/10 mb-2 hover:bg-white/10 transition-all duration-300">
                <div className="mb-1">
                  <span className="text-white font-medium text-xs">IP地址: </span>
                  <span className={`text-xs ${
                    ipInfo.ip === '检测中...' ? 'text-yellow-400' :
                    ipInfo.ip === '无法获取公网IP' || ipInfo.ip === '获取失败' ? 'text-red-400' :
                    'text-gray-300'
                  }`}>{ipInfo.ip || '检测中...'}</span>
                </div>
                <div>
                  <span className="text-white font-medium text-xs">地理位置: </span>
                  <span className={`text-xs ${
                    ipInfo.location === '检测中...' ? 'text-yellow-400' :
                    ipInfo.location === '请检查网络连接' || ipInfo.location === '地理位置获取失败' ? 'text-red-400' :
                    'text-gray-300'
                  }`}>{ipInfo.location || '检测中...'}</span>
                </div>
              </div>
            
            {/* 整体状态 - 超紧凑 */}
            <div className="bg-gradient-to-r from-white/10 to-white/5 rounded p-2 text-center border border-white/20 hover:from-white/15 hover:to-white/10 transition-all duration-300">
              <div className="flex items-center justify-center space-x-1 mb-1">
                <StatusIndicator 
                   status={
                     systemStatus.backend === 'online' && systemStatus.database === 'online' && systemStatus.networkSpeed !== 'offline' ? 'online' :
                     systemStatus.backend === 'checking' || systemStatus.database === 'checking' || systemStatus.networkSpeed === 'checking' ? 'checking' :
                     'offline'
                   } 
                   size="sm" 
                   showPing={true}
                 />
                <span className="text-white font-medium text-xs">{getStatusText()}</span>
              </div>
              {/* 检测时间信息和刷新按钮 */}
               <div className="text-xs text-gray-400 space-y-0.5">
                 {lastCheckTime && (
                   <div className="flex items-center justify-center space-x-1">
                     <span>最新检测: {lastCheckTime.toLocaleTimeString()}</span>
                     <button 
                       onClick={async (e) => {
                        // 获取当前旋转角度并累加360度实现重复旋转
                        const button = e.target.closest('button');
                        const currentTransform = button.style.transform;
                        const currentRotation = currentTransform.match(/rotate\((\d+)deg\)/);
                        const currentDegree = currentRotation ? parseInt(currentRotation[1]) : 0;
                        const newDegree = currentDegree + 360;
                        button.style.transform = `rotate(${newDegree}deg)`;
                        
                        // 立即重置状态显示刷新过程
                        setSystemStatus({
                          backend: 'checking',
                          database: 'checking',
                          networkSpeed: 'checking'
                        });
                        setNetworkSpeed(0);
                        setIpInfo({ ip: '检测中...', location: '检测中...' });
                        setLastCheckTime(new Date());
                        
                        // 等待1秒让用户看到刷新效果
                         await new Promise(resolve => setTimeout(resolve, 1000));
                        
                        // 执行刷新
                        checkSystemStatus();
                        getIpInfo();
                      }}
                       className="text-green-400 hover:text-green-300 transition-all duration-300"
                       title="刷新系统监测"
                     >
                       <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                       </svg>
                     </button>
                   </div>
                 )}
               </div>
            </div>
          </div>
           

           
           {/* 操作按钮 */}
          <div className="space-y-3 mb-6">
            <button 
              onClick={() => navigate('/admin-dashboard')}
              className="group w-full bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 hover:from-emerald-400 hover:via-teal-400 hover:to-emerald-500 text-white py-3 px-6 rounded-xl font-semibold transition-all duration-300 shadow-lg hover:shadow-emerald-500/50 hover:shadow-xl transform hover:-translate-y-1 hover:scale-102 text-sm relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
              <Shield className="w-4 h-4 inline mr-2" />
              站主管理中心
            </button>
          </div>
          
          {/* 版本信息 */}
          <div className="border-t border-white/20 pt-4">
            <p className="text-gray-400 font-medium text-xs tracking-wide">系统v2.0 | 站主专属控制台</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Console;