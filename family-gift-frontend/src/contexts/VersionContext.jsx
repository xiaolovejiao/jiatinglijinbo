import React, { createContext, useContext, useState, useEffect } from 'react';

const VersionContext = createContext();

export const useVersion = () => {
  const context = useContext(VersionContext);
  if (!context) {
    throw new Error('useVersion must be used within a VersionProvider');
  }
  return context;
};

export const VersionProvider = ({ children }) => {
  // 默认版本信息
  const defaultVersionInfo = {
    version: 'v1.1.3',
    environment: '生产环境',
    description: '家庭礼金管理系统 - 专业的人情往来记录平台'
  };

  const [versionInfo, setVersionInfo] = useState(defaultVersionInfo);

  // 在组件挂载时从localStorage读取版本信息
  useEffect(() => {
    console.log('VersionContext: 组件挂载，开始读取localStorage');
    const savedVersion = localStorage.getItem('systemVersionInfo');
    console.log('VersionContext: localStorage中的版本信息:', savedVersion);
    if (savedVersion) {
      try {
        const parsedVersion = JSON.parse(savedVersion);
        console.log('VersionContext: 解析后的版本信息:', parsedVersion);
        setVersionInfo(parsedVersion);
      } catch (error) {
        console.error('Failed to parse saved version info:', error);
        setVersionInfo(defaultVersionInfo);
      }
    } else {
      console.log('VersionContext: localStorage中没有版本信息，使用默认值');
    }
  }, []);

  // 更新版本信息并保存到localStorage
  const updateVersionInfo = (newVersionInfo) => {
    console.log('VersionContext: updateVersionInfo被调用，新版本信息:', newVersionInfo);
    setVersionInfo(newVersionInfo);
    localStorage.setItem('systemVersionInfo', JSON.stringify(newVersionInfo));
    console.log('VersionContext: 已保存到localStorage');
    // 手动触发自定义事件，确保同一页面内的组件也能收到更新
    window.dispatchEvent(new CustomEvent('versionInfoChanged', { detail: newVersionInfo }));
    console.log('VersionContext: 已触发versionInfoChanged事件');
  };

  // 监听localStorage变化，实现跨组件同步
  useEffect(() => {
    // 监听localStorage变化（跨标签页）
    const handleStorageChange = (e) => {
      console.log('VersionContext: 收到storage事件:', e.key, e.newValue);
      if (e.key === 'systemVersionInfo' && e.newValue) {
        try {
          const newVersionInfo = JSON.parse(e.newValue);
          console.log('VersionContext: 通过storage事件更新版本信息:', newVersionInfo);
          setVersionInfo(newVersionInfo);
        } catch (error) {
          console.error('Failed to parse version info from storage:', error);
        }
      }
    };

    // 监听自定义事件（同一页面内）
    const handleVersionChange = (e) => {
      console.log('VersionContext: 收到versionInfoChanged事件:', e.detail);
      setVersionInfo(e.detail);
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('versionInfoChanged', handleVersionChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('versionInfoChanged', handleVersionChange);
    };
  }, []);

  const value = {
    versionInfo,
    updateVersionInfo
  };

  return (
    <VersionContext.Provider value={value}>
      {children}
    </VersionContext.Provider>
  );
};