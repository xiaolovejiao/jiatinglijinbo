// API配置
const getApiBaseUrl = () => {
  // 所有环境都直接使用Railway后端地址
  return import.meta.env.VITE_API_BASE_URL || 'https://jiatinglijinbo-production.up.railway.app';
};

export const API_BASE_URL = getApiBaseUrl();

// 创建API请求函数
export const apiRequest = async (endpoint, options = {}) => {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const defaultOptions = {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  };

  try {
    const response = await fetch(url, defaultOptions);
    return response;
  } catch (error) {
    console.error('API请求失败:', error);
    throw error;
  }
};

export default { API_BASE_URL, apiRequest };