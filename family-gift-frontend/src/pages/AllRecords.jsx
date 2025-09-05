import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { Alert, AlertDescription } from '../components/ui/alert';
import { 
  Activity, 
  Search, 
  Filter,
  ArrowLeft,
  Calendar,
  Users,
  DollarSign,
  FileText,
  Trash2,
  MoreVertical,
  CheckSquare,
  Square,
  Check,
  X
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth.jsx';
import { useNavigate } from 'react-router-dom';
import DeleteConfirmModal from '../components/DeleteConfirmModal';
import BatchDeleteModal from '../components/BatchDeleteModal';

const AllRecords = () => {
  const [family, setFamily] = useState(null);
  const [allRecords, setAllRecords] = useState([]);
  const [filteredRecords, setFilteredRecords] = useState([]);
  const [filters, setFilters] = useState({
    relation: '',
    event: '',
    year: '',
    month: '',
    search: ''
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const recordsPerPage = 20;
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [recordCreator, setRecordCreator] = useState(null);
  const [recordCreators, setRecordCreators] = useState({});
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedRecords, setSelectedRecords] = useState(new Set());
  const [selectAll, setSelectAll] = useState(false);
  const [showBatchDeleteModal, setShowBatchDeleteModal] = useState(false);
  const [batchDeleteLoading, setBatchDeleteLoading] = useState(false);

  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  // 检查用户登录状态
  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/login');
      return;
    }
  }, [user, authLoading, navigate]);

  // 筛选选项
  const relationOptions = [
    { value: '', label: '全部人物关系' },
    { value: 'relative', label: '亲戚' },
    { value: 'friend', label: '朋友' },
    { value: 'colleague', label: '同事' },
    { value: 'classmate', label: '同学' }
  ];

  const eventOptions = [
    { value: '', label: '全部事件类型' },
    { value: 'wedding', label: '婚礼' },
    { value: 'birthday', label: '生日' },
    { value: 'funeral', label: '丧事' },
    { value: 'housewarming', label: '乔迁' },
    { value: 'baby_shower', label: '满月' },
    { value: 'graduation', label: '升学' },
    { value: 'promotion', label: '升职' },
    { value: 'festival', label: '节日' },
    { value: 'other', label: '其他' }
  ];

  // 获取家庭信息
  useEffect(() => {
    const fetchFamily = async () => {
      try {
        console.log('开始获取家庭信息...');
        const response = await fetch('/api/families', {
          credentials: 'include'
        });
        console.log('家庭信息响应状态:', response.status);
        if (response.ok) {
          const data = await response.json();
          console.log('家庭信息数据:', data);
          setFamily(data.family);
        } else {
          console.error('获取家庭信息失败，状态码:', response.status);
          setError('获取家庭信息失败');
        }
      } catch (error) {
        console.error('获取家庭信息失败:', error);
        setError('获取家庭信息失败');
      }
    };

    fetchFamily();
  }, []);

  // 获取所有记录
  useEffect(() => {
    const fetchAllRecords = async () => {
      if (!family) {
        console.log('没有家庭信息，跳过记录获取');
        return;
      }
      
      console.log('开始获取记录，家庭ID:', family.id);
      setLoading(true);
      try {
        const response = await fetch(`/api/families/${family.id}/records`, {
          credentials: 'include'
        });
        console.log('记录响应状态:', response.status);
        if (response.ok) {
          const data = await response.json();
          console.log('记录数据:', data);
          const records = data.records || [];
          setAllRecords(records);
          
          // 获取记录创建者信息
          await fetchRecordCreators(records);
        } else {
          console.error('获取记录失败，状态码:', response.status);
          setError('获取记录失败');
        }
      } catch (error) {
        console.error('获取记录失败:', error);
        setError('获取记录失败');
      } finally {
        setLoading(false);
      }
    };

    fetchAllRecords();
  }, [family]);

  // 筛选记录
  useEffect(() => {
    let filtered = [...allRecords];

    // 人物关系筛选
    if (filters.relation) {
      filtered = filtered.filter(record => record.related_person === filters.relation);
    }

    // 事件类型筛选
    if (filters.event) {
      filtered = filtered.filter(record => record.type === filters.event);
    }

    // 年份筛选
    if (filters.year) {
      filtered = filtered.filter(record => {
        const recordYear = new Date(record.event_date).getFullYear();
        return recordYear === parseInt(filters.year);
      });
    }

    // 月份筛选
    if (filters.month) {
      filtered = filtered.filter(record => {
        const recordMonth = new Date(record.event_date).getMonth() + 1;
        return recordMonth === parseInt(filters.month);
      });
    }

    // 搜索筛选
    if (filters.search) {
      filtered = filtered.filter(record => 
        record.description?.toLowerCase().includes(filters.search.toLowerCase()) ||
        getTypeText(record.type).toLowerCase().includes(filters.search.toLowerCase()) ||
        getRelationText(record.related_person).toLowerCase().includes(filters.search.toLowerCase())
      );
    }

    // 按日期排序（最新的在前）
    filtered.sort((a, b) => new Date(b.event_date) - new Date(a.event_date));

    setFilteredRecords(filtered);
    setCurrentPage(1); // 重置到第一页
  }, [allRecords, filters]);

  // 处理筛选条件变化
  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  // 格式化金额
  const formatAmount = (amount) => {
    return Math.abs(amount).toLocaleString();
  };

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

  // 获取事件类型文本
  const getTypeText = (type) => {
    const typeMap = {
      'wedding': '婚礼',
      'birthday': '生日',
      'funeral': '丧事',
      'housewarming': '乔迁',
      'baby_shower': '满月',
      'graduation': '升学',
      'promotion': '升职',
      'festival': '节日',
      'other': '其他'
    };
    return typeMap[type] || '其他';
  };

  // 获取关系文本
  const getRelationText = (relation) => {
    const relationMap = {
      'relative': '亲戚',
      'friend': '朋友',
      'colleague': '同事',
      'classmate': '同学'
    };
    return relationMap[relation] || '其他';
  };

  // 获取记录创建者信息
  const fetchRecordCreator = async (userId) => {
    if (recordCreators[userId]) {
      return recordCreators[userId];
    }
    
    try {
      const response = await fetch(`/api/users/${userId}`, {
        credentials: 'include'
      });
      if (response.ok) {
        const data = await response.json();
        const creator = data.user;
        setRecordCreators(prev => ({
          ...prev,
          [userId]: creator
        }));
        return creator;
      }
    } catch (error) {
      console.error('获取用户信息失败:', error);
    }
    return null;
  };

  // 批量获取记录创建者信息
  const fetchRecordCreators = async (records) => {
    const userIds = [...new Set(records.map(record => record.user_id).filter(Boolean))];
    const promises = userIds.map(userId => fetchRecordCreator(userId));
    await Promise.all(promises);
  };

  // 处理删除按钮点击
  const handleDeleteClick = async (record) => {
    setSelectedRecord(record);
    
    // 如果不是自己创建的记录，获取创建者信息
    if (record.user_id !== user?.id) {
      const creator = await fetchRecordCreator(record.user_id);
      setRecordCreator(creator);
    } else {
      setRecordCreator(null);
    }
    
    setShowDeleteModal(true);
  };

  // 处理删除确认（自己创建的记录）
  const handleConfirmDelete = async (recordId) => {
    setDeleteLoading(true);
    try {
      const response = await fetch(`/api/families/${family.id}/records/${recordId}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      
      if (response.ok) {
        // 删除成功，刷新记录列表
        setAllRecords(prev => prev.filter(record => record.id !== recordId));
        // 不在这里关闭弹窗，让DeleteConfirmModal处理成功状态
        return Promise.resolve();
      } else {
        const errorData = await response.json();
        const errorMsg = errorData.error || '删除记录失败';
        setError(errorMsg);
        return Promise.reject(new Error(errorMsg));
      }
    } catch (error) {
      console.error('删除记录失败:', error);
      const errorMsg = '删除记录失败';
      setError(errorMsg);
      return Promise.reject(new Error(errorMsg));
    } finally {
      setDeleteLoading(false);
    }
  };

  // 处理删除请求（他人创建的记录）
  const handleRequestDelete = async (recordId, message) => {
    setDeleteLoading(true);
    try {
      const response = await fetch(`/api/families/${family.id}/records/${recordId}/delete-request`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({ message })
      });
      
      if (response.ok) {
        // 请求发送成功，返回成功状态
        return Promise.resolve();
      } else {
        const errorData = await response.json();
        // 创建包含错误代码的错误对象，不在页面显示错误
        const error = new Error(errorData.error || '发送删除请求失败');
        error.code = errorData.code;
        return Promise.reject(error);
      }
    } catch (error) {
      console.error('发送删除请求失败:', error);
      return Promise.reject(error);
    } finally {
      setDeleteLoading(false);
    }
  };

  // 关闭删除弹窗
  const handleCloseDeleteModal = () => {
    setShowDeleteModal(false);
    setSelectedRecord(null);
    setRecordCreator(null);
    setDeleteLoading(false);
  };

  // 批量删除确认处理
  const handleBatchDeleteConfirm = async (selectedRecordIds) => {
    setBatchDeleteLoading(true);
    
    try {
      const selectedRecordData = allRecords.filter(record => 
        selectedRecordIds.has(record.id)
      );
      
      let deletedCount = 0;
      let requestedCount = 0;
      const requestedUsers = {};
      
      // 分别处理自己的记录和他人的记录
      const ownRecords = selectedRecordData.filter(record => record.user_id === user.id);
      const othersRecords = selectedRecordData.filter(record => record.user_id !== user.id);
      
      // 删除自己的记录
      for (const record of ownRecords) {
        try {
          await handleConfirmDelete(record.id);
          deletedCount++;
        } catch (error) {
          console.error(`删除记录 ${record.id} 失败:`, error);
        }
      }
      
      // 发送删除请求给他人的记录
      for (const record of othersRecords) {
        try {
          await handleRequestDelete(record.id, '批量删除请求');
          requestedCount++;
          
          // 统计请求的用户
          const userId = record.user_id;
          const userName = record.creator_name || '未知用户';
          const userNickname = record.creator_nickname || userName;
          const displayName = `${userNickname}（${userName}）`;
          
          if (!requestedUsers[userId]) {
            requestedUsers[userId] = {
              name: displayName,
              count: 0
            };
          }
          requestedUsers[userId].count++;
        } catch (error) {
          console.error(`发送删除请求 ${record.id} 失败:`, error);
        }
      }
      
      return {
        deletedCount,
        requestedCount,
        requestedUsers
      };
    } finally {
      setBatchDeleteLoading(false);
    }
  };

  // 关闭批量删除弹窗
  const handleCloseBatchDeleteModal = () => {
    setShowBatchDeleteModal(false);
    setSelectedRecords(new Set());
    setSelectAll(false);
    setSelectionMode(false);
    setBatchDeleteLoading(false);
  };

  // 切换选择模式
  const toggleSelectionMode = () => {
    setSelectionMode(!selectionMode);
    setSelectedRecords(new Set());
    setSelectAll(false);
  };

  // 全选/取消全选
  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedRecords(new Set());
      setSelectAll(false);
    } else {
      const allRecordIds = new Set(currentRecords.map(record => record.id));
      setSelectedRecords(allRecordIds);
      setSelectAll(true);
    }
  };

  // 单个记录选择
  const handleRecordSelect = (recordId) => {
    const newSelected = new Set(selectedRecords);
    if (newSelected.has(recordId)) {
      newSelected.delete(recordId);
    } else {
      newSelected.add(recordId);
    }
    setSelectedRecords(newSelected);
    setSelectAll(newSelected.size === currentRecords.length && currentRecords.length > 0);
  };

  // 批量删除
  const handleBatchDelete = () => {
    if (selectedRecords.size === 0) return;
    
    // 如果只选择了一个记录，使用单个删除逻辑
    if (selectedRecords.size === 1) {
      const recordId = Array.from(selectedRecords)[0];
      const record = allRecords.find(r => r.id === recordId);
      if (record) {
        handleDeleteClick(record);
      }
    } else {
      // 多个记录的批量删除逻辑
      setShowBatchDeleteModal(true);
    }
  };

  // 生成年份选项
  const generateYearOptions = () => {
    const years = [...new Set(allRecords.map(record => 
      new Date(record.event_date).getFullYear()
    ))].sort((a, b) => b - a);
    return years;
  };

  // 分页逻辑
  const totalPages = Math.ceil(filteredRecords.length / recordsPerPage);
  const startIndex = (currentPage - 1) * recordsPerPage;
  const endIndex = startIndex + recordsPerPage;
  const currentRecords = filteredRecords.slice(startIndex, endIndex);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-indigo-900 to-purple-900 flex items-center justify-center">
        <div className="bg-white/10 rounded-2xl border border-white/20 p-8">
          <div className="text-white text-lg">正在验证身份...</div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-indigo-900 to-purple-900 flex items-center justify-center">
        <div className="bg-white/10 rounded-2xl border border-white/20 p-8">
          <div className="text-white text-lg">加载数据中...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-indigo-900 to-purple-900 flex items-center justify-center">
        <div className="bg-white/10 rounded-2xl border border-white/20 p-8">
          <div className="text-red-400 text-lg">{error}</div>
        </div>
      </div>
    );
  }

  if (!family) {
    return (
      <div className="bg-white/10 rounded-3xl border border-white/20 shadow-2xl p-8 max-w-4xl mx-auto">
        <div className="text-center py-12">
          <FileText className="w-16 h-16 text-white/60 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">
            请先创建或加入家庭
          </h3>
          <p className="text-white/70">
            全部记录功能需要在家庭礼金簿中使用
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-indigo-900 to-purple-900 p-4">
      {/* 背景装饰 */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>
      
      <div className="relative z-10 max-w-7xl mx-auto space-y-6">
        {/* 整体容器 */}
        <div className="bg-white/5 rounded-2xl border border-white/10 p-8 shadow-2xl">
        {/* 页面标题和返回按钮 */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-4">
              <div className="w-1 h-12 bg-gradient-to-b from-green-400 to-blue-500 rounded-full"></div>
              <div>
                <h1 className="text-3xl font-bold text-white tracking-wide">全部记录</h1>
                <div className="h-0.5 w-20 bg-gradient-to-r from-green-400 to-blue-500 mt-2 rounded-full"></div>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-white/70">
                共 {filteredRecords.length} 条记录
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => navigate('/archive')}
                className="bg-white/10 border-white/20 text-white hover:bg-white/20 text-sm"
              >
                返回
              </Button>
            </div>
          </div>
          <p className="text-white/70 text-base ml-16 font-medium">查看和管理所有人情往来记录</p>
        </div>

        {error && (
          <Alert className="border-red-400/30 bg-red-500/10 mb-6">
            <AlertDescription className="text-red-300">
              {error}
            </AlertDescription>
          </Alert>
        )}

        {/* 筛选和搜索 */}
        <div className="mb-6 space-y-4">
          {/* 搜索框 */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-white/50" />
            <Input
              placeholder="搜索记录描述、事件类型或人物关系..."
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              className="pl-10 bg-white/10 border-white/20 text-white placeholder-white/50 focus:ring-2 focus:ring-blue-400 focus:border-transparent"
            />
          </div>

          {/* 筛选条件 */}
          <div className="p-4 bg-blue-500/10 border border-blue-400/30 rounded-xl shadow-lg">
            <div className="flex flex-wrap items-center gap-3">
              <select
                value={filters.relation}
                onChange={(e) => handleFilterChange('relation', e.target.value)}
                className="px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-sm text-white focus:ring-2 focus:ring-blue-400 focus:border-transparent"
              >
                {relationOptions.map(option => (
                  <option key={option.value} value={option.value} className="bg-gray-800 text-white">
                    {option.label}
                  </option>
                ))}
              </select>

              <select
                value={filters.event}
                onChange={(e) => handleFilterChange('event', e.target.value)}
                className="px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-sm text-white focus:ring-2 focus:ring-blue-400 focus:border-transparent"
              >
                {eventOptions.map(option => (
                  <option key={option.value} value={option.value} className="bg-gray-800 text-white">
                    {option.label}
                  </option>
                ))}
              </select>

              <select
                value={filters.year}
                onChange={(e) => handleFilterChange('year', e.target.value)}
                className="px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-sm text-white focus:ring-2 focus:ring-blue-400 focus:border-transparent"
              >
                <option value="" className="bg-gray-800 text-white">选择年份</option>
                {generateYearOptions().map(year => (
                  <option key={year} value={year} className="bg-gray-800 text-white">{year}年</option>
                ))}
              </select>

              <select
                value={filters.month}
                onChange={(e) => handleFilterChange('month', e.target.value)}
                className="px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-sm text-white focus:ring-2 focus:ring-blue-400 focus:border-transparent"
              >
                <option value="" className="bg-gray-800 text-white">选择月份</option>
                {Array.from({ length: 12 }, (_, i) => (
                  <option key={i + 1} value={i + 1} className="bg-gray-800 text-white">{i + 1}月</option>
                ))}
              </select>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setFilters({ relation: '', event: '', year: '', month: '', search: '' })}
                className="bg-white/10 border-white/20 text-white hover:bg-white/20"
              >
                <Filter className="w-4 h-4 mr-1" />
                清除筛选
              </Button>
            </div>
          </div>
        </div>

        {/* 记录列表 */}
        <Card className="bg-green-500/10 border border-green-400/30 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center justify-between text-white">
              <div className="flex items-center space-x-2">
                <Activity className="w-5 h-5 text-white/70" />
                <span>记录列表</span>
                <Badge variant="secondary" className="bg-white/10 text-white/80">
                  {filteredRecords.length} 条
                </Badge>
                {selectedRecords.size > 0 && (
                  <Badge variant="secondary" className="bg-blue-500/20 text-blue-300">
                    已选择 {selectedRecords.size} 条
                  </Badge>
                )}
              </div>
              <div className="flex items-center space-x-2">
                {selectionMode && (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleSelectAll}
                      className="bg-white/10 border-white/20 text-white hover:bg-white/20"
                    >
                      {selectAll ? (
                        <>
                          <CheckSquare className="w-4 h-4 mr-1" />
                          取消全选
                        </>
                      ) : (
                        <>
                          <Square className="w-4 h-4 mr-1" />
                          全选
                        </>
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleBatchDelete}
                      disabled={selectedRecords.size === 0}
                      className="bg-red-500/20 border-red-400/30 text-red-300 hover:bg-red-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Trash2 className="w-4 h-4 mr-1" />
                      删除 ({selectedRecords.size})
                    </Button>
                  </>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={toggleSelectionMode}
                  className={selectionMode 
                    ? "bg-blue-500/20 border-blue-400/30 text-blue-300 hover:bg-blue-500/30" 
                    : "bg-white/10 border-white/20 text-white hover:bg-white/20"
                  }
                >
                  {selectionMode ? (
                    <>
                      <X className="w-4 h-4 mr-1" />
                      取消选择
                    </>
                  ) : (
                    <>
                      <CheckSquare className="w-4 h-4 mr-1" />
                      选择
                    </>
                  )}
                </Button>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8 text-white/50">
                <Activity className="w-8 h-8 mx-auto mb-2 animate-spin" />
                <p>加载中...</p>
              </div>
            ) : currentRecords.length > 0 ? (
              <div className="space-y-2">
                {currentRecords.map((record) => (
                  <div 
                    key={record.id} 
                    className={`group rounded-xl p-4 transition-all duration-300 border shadow-lg transform cursor-pointer ${
                       selectedRecords.has(record.id) 
                         ? 'border-blue-400 bg-blue-500/30 shadow-blue-500/50 shadow-xl scale-[1.02] ring-2 ring-blue-400/50' 
                         : 'bg-white/[0.03] border-white/20 hover:bg-gradient-to-br hover:from-blue-500/10 hover:to-purple-500/10 hover:border-white/30 hover:shadow-xl hover:shadow-blue-500/20 hover:scale-[1.02]'
                     } ${
                       selectionMode ? 'cursor-pointer' : ''
                     }`}
                    onClick={() => selectionMode && handleRecordSelect(record.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        {selectionMode && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRecordSelect(record.id);
                            }}
                            className="p-1 text-white/60 hover:text-blue-400 transition-colors"
                          >
                            {selectedRecords.has(record.id) ? (
                              <CheckSquare className="w-5 h-5 text-blue-400" />
                            ) : (
                              <Square className="w-5 h-5" />
                            )}
                          </button>
                        )}
                        <div className={`w-3 h-3 rounded-full ${
                          record.amount >= 0 ? 'bg-green-500' : 'bg-red-500'
                        } shadow-lg`}></div>
                        <div>
                          <div className="font-medium text-white group-hover:text-gray-200">
                            {(record.description || '礼金记录').replace(/\s*-\s*$/, '')}
                          </div>
                          <div className="text-sm text-gray-300 mt-1 flex items-center space-x-2">
                            <span>{getTypeText(record.type)}</span>
                            <span>·</span>
                            <span>{getRelationText(record.related_person)}</span>
                            <span>·</span>
                            <span className="flex items-center">
                              <Calendar className="w-3 h-3 mr-1" />
                              {new Date(record.event_date).toLocaleDateString('zh-CN', {
                                year: 'numeric',
                                month: '2-digit',
                                day: '2-digit'
                              })}
                            </span>
                          </div>
                          <div className="text-xs text-gray-400 mt-1 flex items-center space-x-2">
                            <span>
                              创建者: {recordCreators[record.user_id] ? 
                                (recordCreators[record.user_id].nickname ? 
                                  `${recordCreators[record.user_id].nickname}（${recordCreators[record.user_id].username}）` : 
                                  recordCreators[record.user_id].username
                                ) : '未知用户'
                              }
                            </span>
                            <span>•</span>
                            <span>
                              创建时间: {record.created_at ? formatBeijingTime(record.created_at) : '未知时间'}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <div className="text-right">
                          <div className={`font-bold text-lg ${
                            record.amount >= 0 ? 'text-green-400' : 'text-red-400'
                          }`}>
                            {record.amount < 0 ? '-' : ''}¥{formatAmount(record.amount)}
                          </div>
                          <div className="text-sm text-gray-300 font-mono">
                            {record.amount >= 0 ? '收入' : '支出'}
                          </div>
                        </div>

                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-white/50">
                <FileText className="w-16 h-16 mx-auto mb-4 text-white/30" />
                <p className="text-lg font-medium mb-2">暂无记录</p>
                <p className="text-sm">当前筛选条件下没有找到任何记录</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* 分页 */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center space-x-2 mt-6">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="bg-white/10 border-white/20 text-white hover:bg-white/20 disabled:opacity-50"
            >
              上一页
            </Button>
            
            <div className="flex items-center space-x-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }
                
                return (
                  <Button
                    key={pageNum}
                    variant={currentPage === pageNum ? "default" : "outline"}
                    size="sm"
                    onClick={() => setCurrentPage(pageNum)}
                    className={currentPage === pageNum 
                      ? "bg-blue-500 text-white" 
                      : "bg-white/10 border-white/20 text-white hover:bg-white/20"
                    }
                  >
                    {pageNum}
                  </Button>
                );
              })}
            </div>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="bg-white/10 border-white/20 text-white hover:bg-white/20 disabled:opacity-50"
            >
              下一页
            </Button>
          </div>
        )}
        </div>
      </div>

      {/* 删除确认弹窗 */}
      <DeleteConfirmModal
        isOpen={showDeleteModal}
        record={selectedRecord}
        recordCreator={recordCreator}
        currentUser={user}
        onConfirmDelete={handleConfirmDelete}
        onRequestDelete={handleRequestDelete}
        onClose={handleCloseDeleteModal}
        loading={deleteLoading}
      />

      {/* 批量删除确认弹窗 */}
      <BatchDeleteModal
        isOpen={showBatchDeleteModal}
        selectedRecords={selectedRecords}
        allRecords={allRecords}
        currentUser={user}
        onConfirm={handleBatchDeleteConfirm}
        onClose={handleCloseBatchDeleteModal}
        loading={batchDeleteLoading}
      />
    </div>
  );
};

export default AllRecords;