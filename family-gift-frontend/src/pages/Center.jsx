import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Alert, AlertDescription } from '../components/ui/alert';
import { StatusIndicator } from '../components/ui/status-indicator';
import ErrorModal from '../components/ErrorModal';
import { 
  Users, 
  TrendingUp, 
  TrendingDown, 
  Copy, 
  UserPlus, 
  Edit,
  Crown,
  Plus,
  Calendar,
  DollarSign,
  Activity,
  AlertTriangle,
  Eye,
  BarChart3,
  PieChart,
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  Sparkles,
  FileText,
  Bell,
  Target,
  Clock,
  Zap,
  TrendingUp as TrendingUpIcon,
  Lightbulb,
  AlertCircle,
  CheckCircle,
  Star,
  Award,
  Flame,
  Settings,
  Database,
  Shield,
  Calculator,
  Check
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth.jsx';
import { useVersion } from '../contexts/VersionContext.jsx';
import SmartInsightsCard from '../components/SmartInsightsCard';

const Center = () => {
  const { versionInfo } = useVersion();
  
  // 调试日志：监控版本信息变化
  useEffect(() => {
    console.log('Center页面: 版本信息已更新', versionInfo);
  }, [versionInfo]);
  const [family, setFamily] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [members, setMembers] = useState([]);
  const [recentRecords, setRecentRecords] = useState([]);
  const [recordCreators, setRecordCreators] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showJoinForm, setShowJoinForm] = useState(false);
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [familyName, setFamilyName] = useState('');
  const [familyIdCode, setFamilyIdCode] = useState('');
  const [editingName, setEditingName] = useState(false);
  const [newFamilyName, setNewFamilyName] = useState('');
  const [inviteUsername, setInviteUsername] = useState('');
  const [copySuccess, setCopySuccess] = useState(false);
  const [showCopyDialog, setShowCopyDialog] = useState(false);
  const [showEditSuccessDialog, setShowEditSuccessDialog] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [analyticsData, setAnalyticsData] = useState(null);
  const { user } = useAuth();
  const navigate = useNavigate();
  
  // 系统状态监控相关状态
  const [systemStatus, setSystemStatus] = useState({
    backend: 'checking',
    database: 'checking',
    networkSpeed: 'checking'
  });
  const [networkSpeed, setNetworkSpeed] = useState(0);
  const [lastCheckTime, setLastCheckTime] = useState(null);
  const [ipInfo, setIpInfo] = useState({ ip: '获取中...', location: '获取中...' });
  const [popularType, setPopularType] = useState('event'); // 'event' 或 'relation'
  
  // 个性化仪表盘编辑状态
  const [dashboardData, setDashboardData] = useState({
    todayReminders: [
      { id: 1, type: 'birthday', content: '张三生日 - 明天', icon: 'Clock' },
      { id: 2, type: 'reminder', content: '李四婚礼回礼提醒', icon: 'AlertCircle' }
    ],
    monthlyBudget: {
      used: 1500,
      total: 1000,
      percentage: 75
    },
    holidayCountdown: {
      name: '春节',
      days: 45
    },
    relationshipSummary: {
      expenseContacts: 0,
      incomeContacts: 0,
      avgExpenseAmount: 0,
      avgIncomeAmount: 0,
      currentView: 'expense', // 'expense' 或 'income'
      description: '暂无往来记录'
    },
    todayRecords: {
      currentView: 'created' // 'created' 或 'event'
    }
  });

  useEffect(() => {
    fetchFamilyData();
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

  const fetchFamilyData = async () => {
    try {
      // 获取家庭信息
      const familyResponse = await fetch('/api/families', {
        credentials: 'include'
      });

      if (familyResponse.ok) {
        const familyData = await familyResponse.json();
        setFamily(familyData.family);
        setNewFamilyName(familyData.family.family_name);

        // 获取总体分析数据
        const analysisResponse = await fetch(`/api/families/${familyData.family.id}/analysis/total`, {
          credentials: 'include'
        });

        if (analysisResponse.ok) {
          const analysisData = await analysisResponse.json();
          setAnalysis(analysisData);
          
          // 同步总支出到本月预算的已用金额
          setDashboardData(prev => {
            const used = Math.abs(analysisData.total_expense || 0); // 取绝对值，因为支出可能是负数
            const total = prev.monthlyBudget.total;
            return {
              ...prev,
              monthlyBudget: {
                ...prev.monthlyBudget,
                used: used,
                percentage: Math.round((used / total) * 100)
              }
            };
          });
        }

        // 获取家庭成员
        const membersResponse = await fetch(`/api/families/${familyData.family.id}/members`, {
          credentials: 'include'
        });

        if (membersResponse.ok) {
          const membersData = await membersResponse.json();
          setMembers(membersData.members || []);
        }

        // 获取所有记录用于统计
        const recordsResponse = await fetch(`/api/families/${familyData.family.id}/records`, {
          credentials: 'include'
        });

        if (recordsResponse.ok) {
          const recordsData = await recordsResponse.json();
          const records = recordsData.records || [];
          setRecentRecords(records);
          
          // 获取记录创建者信息
          await fetchRecordCreators(records);
          
          // 保存总记录数到analysis中
          setAnalysis(prev => ({
            ...prev,
            total_records: recordsData.pagination?.total || 0
          }));
          
          // 计算人情往来摘要
          const expenseContacts = new Set();
          const incomeContacts = new Set();
          let totalExpenseAmount = 0;
          let totalIncomeAmount = 0;
          let expenseRecords = 0;
          let incomeRecords = 0;
          
          records.forEach(record => {
            // 从description字段中提取人名（格式："人名" 或 "人名 - 备注"）
            if (record.description && record.description.trim()) {
              const personName = record.description.split(' - ')[0].trim();
              if (personName) {
                if (record.amount < 0) {
                  // 支出记录（负数金额）
                  expenseContacts.add(personName);
                  totalExpenseAmount += Math.abs(record.amount);
                  expenseRecords++;
                } else if (record.amount > 0) {
                  // 收入记录（正数金额）
                  incomeContacts.add(personName);
                  totalIncomeAmount += record.amount;
                  incomeRecords++;
                }
              }
            }
          });
          
          // 计算平均金额
          const avgExpenseAmount = expenseContacts.size > 0 ? (totalExpenseAmount / expenseContacts.size) : 0;
          const avgIncomeAmount = incomeContacts.size > 0 ? (totalIncomeAmount / incomeContacts.size) : 0;
          
          setDashboardData(prev => ({
            ...prev,
            relationshipSummary: {
              expenseContacts: expenseContacts.size,
              incomeContacts: incomeContacts.size,
              avgExpenseAmount: avgExpenseAmount,
              avgIncomeAmount: avgIncomeAmount,
              expenseRecords: expenseRecords,
              incomeRecords: incomeRecords,
              totalExpenseAmount: totalExpenseAmount,
              totalIncomeAmount: totalIncomeAmount,
              currentView: prev.relationshipSummary.currentView,
              description: (expenseContacts.size + incomeContacts.size) > 0 ? '点击切换查看' : '暂无往来记录'
            }
          }));
        }

        // 获取热门趋势分析数据
        const analyticsResponse = await fetch(`/api/families/${familyData.family.id}/analytics`, {
          credentials: 'include'
        });

        if (analyticsResponse.ok) {
          const analyticsResult = await analyticsResponse.json();
          setAnalyticsData(analyticsResult);
        }

      } else if (familyResponse.status === 404) {
        setFamily(null);
      } else {
        const errorData = await familyResponse.json();
        setError(errorData.error);
      }
    } catch (error) {
      console.error('Failed to fetch family data:', error);
      setError('获取数据失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  const formatAmount = (amount) => {
    return Math.abs(amount).toLocaleString('zh-CN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
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

  // 处理热门趋势数据
  const getPopularTypes = () => {
    if (popularType === 'event') {
      return getPopularEventTypes();
    } else {
      return getPopularRelations();
    }
  };

  // 处理热门事件类型数据
  const getPopularEventTypes = () => {
    if (!recentRecords || recentRecords.length === 0) return [];
    
    // 获取当前月份
    const currentDate = new Date();
    const currentMonth = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;
    
    // 统计事件类型的支出数据（只统计当前月）
    const eventStats = {};
    recentRecords
      .filter(record => {
        const recordDate = new Date(record.event_date);
        const recordMonth = `${recordDate.getFullYear()}-${String(recordDate.getMonth() + 1).padStart(2, '0')}`;
        return record.amount < 0 && recordMonth === currentMonth; // 只统计支出且为当前月
      })
      .forEach(record => {
        const eventType = record.type || 'other';
        if (!eventStats[eventType]) {
          eventStats[eventType] = {
            totalAmount: 0,
            count: 0
          };
        }
        eventStats[eventType].totalAmount += Math.abs(record.amount);
        eventStats[eventType].count += 1;
      });
    
    // 转换为数组并排序
    return Object.entries(eventStats)
      .map(([eventType, stats]) => ({
        name: getEventTypeName(eventType),
        totalAmount: stats.totalAmount,
        count: stats.count
      }))
      .sort((a, b) => b.totalAmount - a.totalAmount) // 按总支出金额排序
      .slice(0, 3)
      .map((item, index) => ({
        rank: index + 1,
        name: item.name,
        avgAmount: item.totalAmount, // 显示总支出金额
        count: item.count
      }));
  };

  // 处理热门人物关系数据
  const getPopularRelations = () => {
    if (!recentRecords || recentRecords.length === 0) return [];
    
    // 获取当前月份
    const currentDate = new Date();
    const currentMonth = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;
    
    // 统计人物关系的支出数据（只统计当前月）
    const relationStats = {};
    recentRecords
      .filter(record => {
        const recordDate = new Date(record.event_date);
        const recordMonth = `${recordDate.getFullYear()}-${String(recordDate.getMonth() + 1).padStart(2, '0')}`;
        return record.amount < 0 && recordMonth === currentMonth; // 只统计支出且为当前月
      })
      .forEach(record => {
        const relation = record.related_person || 'other';
        if (!relationStats[relation]) {
          relationStats[relation] = {
            totalAmount: 0,
            count: 0
          };
        }
        relationStats[relation].totalAmount += Math.abs(record.amount);
        relationStats[relation].count += 1;
      });
    
    // 转换为数组并排序
    return Object.entries(relationStats)
      .map(([relation, stats]) => ({
        name: getRelationText(relation),
        totalAmount: stats.totalAmount,
        count: stats.count
      }))
      .sort((a, b) => b.totalAmount - a.totalAmount) // 按总支出金额排序
      .slice(0, 3)
      .map((item, index) => ({
        rank: index + 1,
        name: item.name,
        avgAmount: item.totalAmount, // 显示总支出金额
        count: item.count
      }));
  };

  // 获取月度趋势数据
  const getMonthlyTrends = () => {
    // 获取当前年月
    const now = new Date();
    
    // 从recentRecords直接获取本月记录（与礼金薄概览保持一致）
    const currentMonthRecords = recentRecords.filter(record => {
      const recordDate = new Date(record.event_date);
      return recordDate.getMonth() === now.getMonth() && recordDate.getFullYear() === now.getFullYear();
    });
    
    // 获取上个月记录
    const lastMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthRecords = recentRecords.filter(record => {
      const recordDate = new Date(record.event_date);
      return recordDate.getMonth() === lastMonthDate.getMonth() && recordDate.getFullYear() === lastMonthDate.getFullYear();
    });
    
    // 计算本月支出和收入（从recentRecords直接计算）
    const currentExpense = currentMonthRecords
      .filter(record => record.amount < 0)
      .reduce((sum, record) => sum + Math.abs(record.amount), 0);
    
    const currentIncome = currentMonthRecords
      .filter(record => record.amount > 0)
      .reduce((sum, record) => sum + record.amount, 0);
    
    // 计算上月支出和收入
    const lastExpense = lastMonthRecords
      .filter(record => record.amount < 0)
      .reduce((sum, record) => sum + Math.abs(record.amount), 0);
    
    const lastIncome = lastMonthRecords
      .filter(record => record.amount > 0)
      .reduce((sum, record) => sum + record.amount, 0);
    
    // 计算净收支
    const currentNetIncome = currentIncome - currentExpense;
    const lastNetIncome = lastIncome - lastExpense;
    
    // 计算净收支变化百分比
    const change = lastNetIncome !== 0 ? ((currentNetIncome - lastNetIncome) / Math.abs(lastNetIncome) * 100) : 0;
    
    // 计算笔数
    const monthlyIncomeCount = currentMonthRecords.filter(record => record.amount > 0).length;
    const monthlyExpenseCount = currentMonthRecords.filter(record => record.amount < 0).length;
    const monthlyTotalCount = currentMonthRecords.length;
    
    // 计算平均收入和支出
    const avgIncome = monthlyIncomeCount > 0 ? Math.round(currentIncome / monthlyIncomeCount) : 0;
    const avgExpense = monthlyExpenseCount > 0 ? Math.round(currentExpense / monthlyExpenseCount) : 0;
    
    return {
      expense: currentExpense,
      income: currentIncome,
      change: Math.round(change),
      avgIncome,
      avgExpense,
      monthlyIncomeCount,
      monthlyExpenseCount,
      monthlyTotalCount
    };
  };

  // 获取事件类型中文名称
  const getEventTypeName = (eventType) => {
    const typeMap = {
      'wedding': '结婚',
      'birth': '满月',
      'graduation': '升学',
      'birthday': '生日',
      'moving': '乔迁',
      'funeral': '白事',
      'casual': '无事酒',
      'other': '其他'
    };
    return typeMap[eventType] || eventType || '其他';
  };

  const isCreator = () => {
    if (!family || !user) return false;
    const currentMember = members.find(m => m.user_id === user.id);
    return currentMember?.role === '创建者';
  };

  // 类型转换函数
  const getTypeText = (type) => {
    const typeMap = {
      'wedding': '结婚',
      'birth': '满月',
      'graduation': '升学',
      'birthday': '生日',
      'moving': '乔迁',
      'funeral': '白事',
      'casual': '无事酒',
      'other': '其他'
    };
    return typeMap[type] || type;
  };

  // 关系类型转换函数
  const getRelationText = (relation) => {
    const relationMap = {
      'friend': '朋友',
      'relative': '亲戚',
      'colleague': '同事',
      'neighbor': '邻居',
      'classmate': '同学',
      'family': '家人',
      'other': '其他'
    };
    return relationMap[relation] || relation;
  };

  const copyFamilyId = async () => {
    try {
      await navigator.clipboard.writeText(family.family_id_code);
      setShowCopyDialog(true);
    } catch (error) {
      setError('复制失败，请手动复制');
      setTimeout(() => setError(''), 3000);
    }
  };

  const handleCreateFamily = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/families', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ family_name: familyName }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess('家庭创建成功！');
        setShowCreateForm(false);
        setFamilyName('');
        fetchFamilyData();
      } else {
        setError(data.error);
      }
    } catch (error) {
      setErrorMessage('网络错误，创建家庭失败，请检查网络连接后重试');
      setShowErrorModal(true);
    } finally {
      setLoading(false);
    }
  };

  const handleJoinFamily = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/families/join', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ family_id_code: familyIdCode }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess('成功加入家庭！');
        setShowJoinForm(false);
        setFamilyIdCode('');
        fetchFamilyData();
      } else {
        setError(data.error);
      }
    } catch (error) {
      setErrorMessage('网络错误，加入家庭失败，请检查网络连接后重试');
      setShowErrorModal(true);
    } finally {
      setLoading(false);
    }
  };

  const handleEditFamilyName = async () => {
    if (!newFamilyName.trim()) {
      setError('家庭名称不能为空');
      return;
    }

    try {
      const response = await fetch(`/api/families/${family.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ family_name: newFamilyName }),
      });

      if (response.ok) {
        setEditingName(false);
        setShowEditSuccessDialog(true);
        fetchFamilyData();
        // 3秒后自动关闭弹窗
        setTimeout(() => {
          setShowEditSuccessDialog(false);
        }, 3000);
      } else {
        const data = await response.json();
        setError(data.error);
      }
    } catch (error) {
      setError('更新失败，请重试');
    }
  };

  const handleRemoveMember = async (memberId) => {
    if (!confirm('确定要移除该成员吗？')) return;

    try {
      const response = await fetch(`/api/families/${family.id}/members/${memberId}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (response.ok) {
        setSuccess('成员移除成功！');
        fetchFamilyData();
      } else {
        const data = await response.json();
        setError(data.error);
      }
    } catch (error) {
      setError('移除失败，请重试');
    }
  };

  const handleLeaveFamily = async () => {
    if (!confirm('确定要退出家庭吗？')) return;

    try {
      const response = await fetch(`/api/families/${family.id}/leave`, {
        method: 'POST',
        credentials: 'include',
      });

      if (response.ok) {
        setSuccess('已退出家庭！');
        fetchFamilyData();
      } else {
        const data = await response.json();
        setError(data.error);
      }
    } catch (error) {
      setError('退出失败，请重试');
    }
  };

  const handleQuickRecord = () => {
    navigate('/record');
  };

  const handleViewAllRecords = () => {
    navigate('/archive');
  };
  
  // 个性化仪表盘编辑状态
  const [editingReminder, setEditingReminder] = useState(null);
  const [editingBudget, setEditingBudget] = useState(false);
  const [editingHoliday, setEditingHoliday] = useState(false);
  const [holidayType, setHolidayType] = useState('preset'); // 'preset' 或 'custom'

  const presetHolidays = [
    { name: '春节', date: '2025-01-29' },
    { name: '元宵节', date: '2025-02-12' },
    { name: '清明节', date: '2025-04-05' },
    { name: '劳动节', date: '2025-05-01' },
    { name: '端午节', date: '2025-05-31' },
    { name: '七夕节', date: '2025-08-29' },
    { name: '中秋节', date: '2025-10-06' },
    { name: '国庆节', date: '2025-10-01' },
    { name: '重阳节', date: '2025-10-29' },
    { name: '圣诞节', date: '2025-12-25' },
    { name: '元旦', date: '2026-01-01' }
  ];

  const calculateDaysToHoliday = (dateString) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // 设置为当天开始时间
    const holidayDate = new Date(dateString);
    holidayDate.setHours(0, 0, 0, 0); // 设置为节日开始时间
    
    // 如果节日已过，计算到明年同一节日的天数
    if (holidayDate < today) {
      const nextYear = new Date(holidayDate);
      nextYear.setFullYear(nextYear.getFullYear() + 1);
      const diffTime = nextYear - today;
      return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }
    
    const diffTime = holidayDate - today;
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const updateReminder = (id, content) => {
    setDashboardData(prev => ({
      ...prev,
      todayReminders: prev.todayReminders.map(reminder => 
        reminder.id === id ? { ...reminder, content } : reminder
      )
    }));
  };

  const addReminder = () => {
    const newReminder = {
      id: Date.now(),
      type: 'reminder',
      content: '新提醒',
      icon: 'Bell'
    };
    setDashboardData(prev => ({
      ...prev,
      todayReminders: [...prev.todayReminders, newReminder]
    }));
  };

  const removeReminder = (id) => {
    setDashboardData(prev => ({
      ...prev,
      todayReminders: prev.todayReminders.filter(reminder => reminder.id !== id)
    }));
  };

  const updateBudget = (total) => {
    const newTotal = parseFloat(total) || 0;
    setDashboardData(prev => ({
      ...prev,
      monthlyBudget: {
        ...prev.monthlyBudget,
        total: newTotal,
        percentage: Math.round((prev.monthlyBudget.used / newTotal) * 100)
      }
    }));
    setEditingBudget(false);
    setSuccess('预算已更新！');
    setTimeout(() => setSuccess(''), 3000);
  };

  const updateHoliday = (name, days) => {
    setDashboardData(prev => ({
      ...prev,
      holidayCountdown: {
        name,
        days: parseInt(days) || 0
      }
    }));
    setEditingHoliday(false);
    setSuccess('节日倒计时已更新！');
    setTimeout(() => setSuccess(''), 3000);
  };

  const selectPresetHoliday = (holiday) => {
    const days = calculateDaysToHoliday(holiday.date);
    updateHoliday(holiday.name, days);
  };
  
  // 初始化监控
  const initializeMonitoring = async () => {
    // 分别检查后端和网络状态
    await checkBackendStatus();
    
    // 检查网络连接后再决定是否获取IP信息
    const networkResult = await checkNetworkStatus();
    if (networkResult.hasInternet) {
      await getIpInfo();
    }
  };
  
  // 检测后端和数据库状态函数（不检测网络）
  const checkBackendStatus = async () => {
    try {
      const response = await fetch('/api/health', {
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
        setIpInfo({ ip: '未获取IP地址，请检查网络状态', location: '未获取地理位置，请检查网络状态' });
      }
      
      return networkResult;
    } catch (error) {
      console.error('网络状态检查失败:', error);
      setSystemStatus(prevStatus => ({
        ...prevStatus,
        networkSpeed: 'offline'
      }));
      setIpInfo({ ip: '未获取IP地址，请检查网络状态', location: '未获取地理位置，请检查网络状态' });
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
        // 静默处理IP API错误，避免控制台噪音
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
               if (!data.error && !data.reason) {
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
         // 静默处理地理位置API错误，不在控制台显示
         continue;
       }
     }
     
     // 如果所有地理位置API都失败，至少显示IP
     setIpInfo({ ip: userIP, location: '地理位置获取失败' });
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

  if (loading) {
    return (
      <div className="min-h-screen bg-transparent flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
          <div className="text-gray-600 font-medium">加载中...</div>
        </div>
      </div>
    );
  }

  // 如果用户未登录，显示提示信息
  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <Card className="max-w-md w-full shadow-xl border-0">
          <CardContent className="p-4 text-center">
            <AlertTriangle className="w-16 h-16 text-amber-500 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">需要登录</h3>
            <p className="text-gray-600 mb-6">您尚未登录，请先登录后再使用家庭功能。</p>
            <Button onClick={() => navigate('/login')} className="w-full">
              前往登录
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!family) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6">
        {/* 站主专属欢迎词 */}
        {!!user?.is_admin && (
          <Card className="bg-gradient-to-r from-amber-500 to-orange-500 text-white mb-8 shadow-xl border-0">
            <CardContent className="p-4">
              <div className="flex items-center justify-center space-x-3">
                <Crown className="w-8 h-8 text-yellow-200" />
                <div className="text-center">
                  <h3 className="text-xl font-bold">
                    欢迎回来，尊敬的站主！您拥有系统的最高管理权限。
                  </h3>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* 主内容区域 */}
        <div className="bg-white/10 backdrop-blur-xl rounded-3xl border border-white/20 shadow-2xl p-8 max-w-4xl w-full">
            {/* 标题区域 */}
            <div className="text-center mb-8">
              <div className="w-20 h-20 bg-gradient-to-br from-blue-400 to-purple-500 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
                <Users className="w-10 h-10 text-white" />
              </div>
              <h1 className="text-4xl font-bold text-white mb-4 tracking-tight">
                家庭礼金管理系统
              </h1>
              <p className="text-blue-100 text-lg max-w-2xl mx-auto">
                专业的人情往来记录平台，让每一份情谊都有据可查
              </p>
            </div>

            {/* 功能特色 */}
            <div className="grid grid-cols-3 gap-6 mb-8">
              <div className="text-center p-4 bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 shadow-lg hover:bg-white/10 hover:border-white/20 hover:shadow-2xl hover:shadow-blue-500/20 transition-all duration-300 group cursor-pointer">
                <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center mx-auto mb-3 group-hover:bg-blue-500/30 group-hover:shadow-lg group-hover:shadow-blue-500/30 transition-all duration-300">
                  <Shield className="w-6 h-6 text-blue-300 group-hover:text-blue-200 transition-colors duration-300" />
                </div>
                <h3 className="text-sm font-semibold text-white mb-1 group-hover:text-blue-100 transition-colors duration-300">安全可靠</h3>
                <p className="text-xs text-blue-200 group-hover:text-blue-100 transition-colors duration-300">数据加密存储</p>
              </div>
              <div className="text-center p-4 bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 shadow-lg hover:bg-white/10 hover:border-white/20 hover:shadow-2xl hover:shadow-green-500/20 transition-all duration-300 group cursor-pointer">
                <div className="w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center mx-auto mb-3 group-hover:bg-green-500/30 group-hover:shadow-lg group-hover:shadow-green-500/30 transition-all duration-300">
                  <BarChart3 className="w-6 h-6 text-green-300 group-hover:text-green-200 transition-colors duration-300" />
                </div>
                <h3 className="text-sm font-semibold text-white mb-1 group-hover:text-green-100 transition-colors duration-300">智能统计</h3>
                <p className="text-xs text-blue-200 group-hover:text-green-100 transition-colors duration-300">自动生成报表</p>
              </div>
              <div className="text-center p-4 bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 shadow-lg hover:bg-white/10 hover:border-white/20 hover:shadow-2xl hover:shadow-purple-500/20 transition-all duration-300 group cursor-pointer">
                <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center mx-auto mb-3 group-hover:bg-purple-500/30 group-hover:shadow-lg group-hover:shadow-purple-500/30 transition-all duration-300">
                  <Users className="w-6 h-6 text-purple-300 group-hover:text-purple-200 transition-colors duration-300" />
                </div>
                <h3 className="text-sm font-semibold text-white mb-1 group-hover:text-purple-100 transition-colors duration-300">多人协作</h3>
                <p className="text-xs text-blue-200 group-hover:text-purple-100 transition-colors duration-300">家庭共同管理</p>
              </div>
            </div>

            {/* 操作按钮 */}
            <div className="grid grid-cols-2 gap-6">
              {/* 创建家庭按钮 */}
              <button
                onClick={() => setShowCreateForm(true)}
                className="group relative bg-gradient-to-br from-blue-600 to-purple-600 text-white p-6 rounded-2xl hover:from-blue-700 hover:to-purple-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
              >
                <div className="text-center">
                  <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:bg-white/30 transition-colors">
                    <Plus className="w-7 h-7 text-white" />
                  </div>
                  <h3 className="text-lg font-bold mb-2">创建新家庭</h3>
                  <p className="text-blue-100 text-sm">建立专属的家庭礼金账本</p>
                </div>
              </button>

              {/* 加入家庭按钮 */}
              <button
                onClick={() => setShowJoinForm(true)}
                className="group relative bg-white/10 border-2 border-white/30 text-white p-6 rounded-2xl hover:bg-white/20 hover:border-white/50 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
              >
                <div className="text-center">
                  <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:bg-white/30 transition-colors">
                    <UserPlus className="w-7 h-7 text-white" />
                  </div>
                  <h3 className="text-lg font-bold mb-2">加入现有家庭</h3>
                  <p className="text-blue-100 text-sm">使用邀请码加入家庭账本</p>
                </div>
              </button>
            </div>
          </div>

        {/* 创建家庭弹窗 */}
        {showCreateForm && (
          <div className="fixed inset-0 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md transform transition-all duration-300 scale-100">
              <div className="p-8">
                <div className="text-center mb-8">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Plus className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">创建新家庭</h3>
                  <p className="text-gray-600">为您的家庭建立专属的礼金账本</p>
                </div>
                
                <form onSubmit={handleCreateFamily} className="space-y-6">
                  <div>
                    <Label htmlFor="familyName" className="block text-gray-700 text-sm font-semibold mb-3">
                      家庭名称
                    </Label>
                    <Input
                      id="familyName"
                      value={familyName}
                      onChange={(e) => setFamilyName(e.target.value)}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      placeholder="请输入家庭名称"
                      required
                      autoFocus
                    />
                  </div>
                  
                  <div className="flex space-x-4 pt-4">
                    <Button
                      type="submit"
                      disabled={loading || !familyName.trim()}
                      className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-6 rounded-xl font-semibold hover:from-blue-700 hover:to-purple-700 transition-all duration-300 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed transform hover:-translate-y-0.5"
                    >
                      {loading ? '创建中...' : '创建家庭'}
                    </Button>
                    <Button
                      type="button"
                      onClick={() => setShowCreateForm(false)}
                      className="flex-1 bg-gray-100 text-gray-700 py-3 px-6 rounded-xl font-semibold hover:bg-gray-200 transition-all duration-300"
                    >
                      取消
                    </Button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* 加入家庭弹窗 */}
        {showJoinForm && (
          <div className="fixed inset-0 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md transform transition-all duration-300 scale-100">
              <div className="p-8">
                <div className="text-center mb-8">
                  <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-blue-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <UserPlus className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">加入家庭</h3>
                  <p className="text-gray-600">输入邀请码加入现有的家庭账本</p>
                </div>
                
                <form onSubmit={handleJoinFamily} className="space-y-6">
                  <div>
                    <Label htmlFor="familyIdCode" className="block text-gray-700 text-sm font-semibold mb-3">
                      邀请码
                    </Label>
                    <Input
                      id="familyIdCode"
                      type="text"
                      placeholder="请输入家庭邀请码"
                      value={familyIdCode}
                      onChange={(e) => setFamilyIdCode(e.target.value)}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all text-center text-lg tracking-widest"
                      required
                      autoFocus
                    />
                  </div>
                  
                  <div className="flex space-x-4 pt-4">
                    <Button
                      type="submit"
                      disabled={loading || !familyIdCode.trim()}
                      className="flex-1 bg-gradient-to-r from-green-500 to-blue-500 text-white py-3 px-6 rounded-xl font-semibold hover:from-green-600 hover:to-blue-600 transition-all duration-300 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed transform hover:-translate-y-0.5"
                    >
                      {loading ? '加入中...' : '加入家庭'}
                    </Button>
                    <Button
                      type="button"
                      onClick={() => setShowJoinForm(false)}
                      className="flex-1 bg-gray-100 text-gray-700 py-3 px-6 rounded-xl font-semibold hover:bg-gray-200 transition-all duration-300"
                    >
                      取消
                    </Button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* 错误和成功提示 */}
        {error && (
          <Alert variant="destructive" className="shadow-lg border-0">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="border-green-200 bg-green-50 shadow-lg border-0">
            <Sparkles className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-700 font-medium">
              {success}
            </AlertDescription>
          </Alert>
        )}

        {/* 邀请成员弹窗 */}
        {showInviteDialog && (
          <div className="fixed inset-0 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md transform transition-all duration-300 scale-100">
              <div className="p-6">
                <div className="text-center mb-6">
                  <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-green-600 rounded-xl flex items-center justify-center mx-auto mb-3">
                    <UserPlus className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-1">邀请成员</h3>
                  <p className="text-gray-600 text-sm">邀请朋友加入您的家庭账本</p>
                </div>
                
                <div className="space-y-4">
                  {/* 输入用户名方式 */}
                  <div>
                    <Label htmlFor="inviteUsername" className="block text-gray-700 text-sm font-semibold mb-2">
                      输入好友用户名
                    </Label>
                    <Input
                      id="inviteUsername"
                      value={inviteUsername}
                      onChange={(e) => setInviteUsername(e.target.value)}
                      className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                      placeholder="请输入好友的用户名"
                    />
                  </div>
                  
                  {/* 分割线 */}
                  <div className="flex items-center">
                    <div className="flex-1 border-t border-gray-200"></div>
                    <span className="px-4 text-gray-500 text-sm">或者</span>
                    <div className="flex-1 border-t border-gray-200"></div>
                  </div>
                  
                  {/* 复制邀请链接 */}
                   <div>
                     <Label className="block text-gray-700 text-sm font-semibold mb-2">
                        分享礼金薄{family ? family.family_name : ''}ID
                      </Label>
                     <div className="flex space-x-2">
                       <Input
                         value={family ? family.family_id_code : '加载中...'}
                         readOnly
                         className="flex-1 px-3 py-2 border-2 border-gray-200 rounded-lg text-gray-700 bg-gray-50 text-center font-mono"
                       />
                       <Button
                         type="button"
                         onClick={() => {
                           if (family) {
                             navigator.clipboard.writeText(family.family_id_code);
                             setCopySuccess(true);
                             setTimeout(() => setCopySuccess(false), 3000);
                           }
                         }}
                         className="px-3 py-2 bg-gradient-to-r from-emerald-500 to-green-600 text-white rounded-lg hover:from-emerald-600 hover:to-green-700 transition-all duration-300 flex items-center transform hover:scale-105"
                       >
                         <Copy className="w-4 h-4" />
                       </Button>
                     </div>
                     <p className="text-gray-500 text-xs mt-1">点击复制按钮，将ID分享给好友加入</p>
                     {copySuccess && (
                       <div className="mt-1 px-2 py-1 bg-emerald-50 border border-emerald-200 rounded flex items-center space-x-1">
                         <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></div>
                         <span className="text-emerald-700 text-xs font-medium">ID已复制到剪贴板</span>
                       </div>
                     )}
                   </div>
                  
                  <div className="flex space-x-4 pt-4">
                    <Button
                      type="button"
                      onClick={async () => {
                        if (inviteUsername.trim()) {
                          setLoading(true);
                          try {
                            const response = await fetch(`/api/families/${family.id}/invite`, {
                              method: 'POST',
                              headers: {
                                'Content-Type': 'application/json',
                              },
                              credentials: 'include',
                              body: JSON.stringify({ username: inviteUsername.trim() }),
                            });
                            
                            const data = await response.json();
                            
                            if (response.ok) {
                              setSuccess(`邀请已发送给用户: ${inviteUsername}`);
                              setInviteUsername('');
                              setShowInviteDialog(false);
                              setTimeout(() => setSuccess(''), 3000);
                            } else {
                              setError(data.error || '发送邀请失败');
                              setTimeout(() => setError(''), 3000);
                            }
                          } catch (error) {
                            setError('网络错误，发送邀请失败');
                            setTimeout(() => setError(''), 3000);
                          } finally {
                            setLoading(false);
                          }
                        }
                      }}
                      disabled={loading || !inviteUsername.trim()}
                      className="flex-1 bg-gradient-to-r from-emerald-500 to-green-600 text-white py-3 px-6 rounded-xl font-semibold hover:from-emerald-600 hover:to-green-700 transition-all duration-300 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed transform hover:-translate-y-0.5"
                    >
                      {loading ? '发送中...' : '发送邀请'}
                    </Button>
                    <Button
                      type="button"
                      onClick={() => {
                        setShowInviteDialog(false);
                        setInviteUsername('');
                        setCopySuccess(false);
                      }}
                      className="flex-1 bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700 py-3 px-6 rounded-xl font-semibold hover:from-gray-200 hover:to-gray-300 transition-all duration-300 transform hover:scale-105"
                    >
                      取消
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ID复制成功弹窗 */}
        {showCopyDialog && (
          <div className="fixed inset-0 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xs transform transition-all duration-300 scale-100">
              <div className="p-4 text-center">
                <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-3">
                  <CheckCircle className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">复制成功！</h3>
                <div className="bg-gray-50 rounded-lg p-2 mb-3">
                  <span className="font-mono text-sm text-gray-700">{family?.family_id_code}</span>
                </div>
                <p className="text-xs text-gray-500 mb-4">已复制到剪贴板</p>
                <button
                  onClick={() => setShowCopyDialog(false)}
                  className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white py-2 px-4 rounded-lg font-medium hover:from-blue-600 hover:to-purple-700 transition-all duration-200 transform hover:scale-105"
                >
                  确定
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 整体容器 */}
        <div className="bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 p-8 shadow-2xl">
          {/* 大标题 */}
          <div className="mb-8">
            <div className="flex items-center space-x-4 mb-3">
              <div className="w-1 h-12 bg-gradient-to-b from-blue-400 to-purple-500 rounded-full"></div>
              <div>
                <h1 className="text-3xl font-bold text-white tracking-wide">家庭礼金管理</h1>
                <div className="h-0.5 w-20 bg-gradient-to-r from-blue-400 to-purple-500 mt-2 rounded-full"></div>
              </div>
            </div>
            <p className="text-white/70 text-base ml-8 font-medium">智能记录，轻松管理您的礼金往来</p>
          </div>

          {/* 礼金薄卡片组 */}
          <div className="mb-8">
            {/* 礼金薄小标题 */}
            
            {/* 礼金薄综合信息卡片 - 一体化紧凑设计 */}
            <Card className="shadow-2xl border-0 transition-all duration-500 bg-gradient-to-br from-slate-800/25 via-amber-900/20 to-orange-900/25 border border-amber-500/30 group transform p-0 hover-card">
              <CardHeader className="relative z-10 p-0 mb-0 hover:shadow-3xl transition-all duration-500">
                <CardTitle className="bg-gradient-to-r from-amber-400/10 to-orange-500/10 rounded-t-lg border-b border-amber-300/25 w-full">
                  <div className="flex items-center justify-between space-x-4 text-xl text-white px-4 py-3">
                    <div className="flex items-center space-x-2">
                      <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-green-600 rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:scale-110">
                        <Wallet className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex flex-col justify-center">
                        {editingName ? (
                          <div className="flex items-center space-x-0.5">
                            <Input
                              value={newFamilyName}
                              onChange={(e) => setNewFamilyName(e.target.value)}
                              className="text-white bg-white/10 border-amber-300/50 focus:border-amber-400 text-sm font-bold"
                              placeholder="输入家庭名称"
                              autoFocus
                              onKeyPress={(e) => {
                                if (e.key === 'Enter') {
                                  handleEditFamilyName();
                                }
                                if (e.key === 'Escape') {
                                  setEditingName(false);
                                  setNewFamilyName(family?.family_name || '');
                                }
                              }}
                            />
                            <Button
                               size="sm"
                               onClick={handleEditFamilyName}
                               className="bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white px-3 py-1.5 text-xs font-medium shadow-md hover:shadow-lg transition-all duration-300 transform hover:scale-105 hover:-translate-y-0.5 active:scale-95"
                             >
                               ✓ 保存
                             </Button>
                             <Button
                               size="sm"
                               onClick={() => {
                                 setEditingName(false);
                                 setNewFamilyName(family?.family_name || '');
                               }}
                               className="bg-gradient-to-r from-slate-500 to-slate-600 hover:from-slate-600 hover:to-slate-700 text-white px-3 py-1.5 text-xs font-medium shadow-md hover:shadow-lg transition-all duration-300 transform hover:scale-105 hover:-translate-y-0.5 active:scale-95"
                             >
                               ✕ 取消
                             </Button>
                          </div>
                        ) : (
                          <span 
                             className="font-bold tracking-wide pb-1 mb-2 inline-block relative cursor-pointer hover:text-amber-200 transition-colors"
                             onClick={() => {
                               if (isCreator()) {
                                 setNewFamilyName(family?.family_name || '');
                                 setEditingName(true);
                               }
                             }}
                             title={isCreator() ? '点击编辑名称' : ''}
                           >
                            {family?.family_name || '礼金薄概览'}
                            <div className="absolute -bottom-1 left-0 w-full h-0.5 bg-gradient-to-r from-amber-300 via-amber-200 to-amber-100 opacity-80"></div>
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-1">
                      <StatusIndicator 
                        status={
                          systemStatus.backend === 'online' && systemStatus.database === 'online' && systemStatus.networkSpeed !== 'offline' ? 'online' :
                          systemStatus.backend === 'checking' || systemStatus.database === 'checking' || systemStatus.networkSpeed === 'checking' ? 'checking' :
                          'offline'
                        } 
                        size="sm" 
                        showPing={true}
                      />
                      <span className="text-white/70 text-xs font-medium">{getStatusText()}</span>
                    </div>
                  </div>
                  <div className="h-0.5 bg-gradient-to-r from-amber-200/50 via-orange-200/50 to-amber-300/50 w-full"></div>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 relative z-10 -mt-5 hover:shadow-3xl transition-all duration-500">
                {/* 左右分布布局 */}
                <div className="flex gap-4 mb-2">
                  {/* 左侧区域 - 快速记录 */}
                  <div className="flex-1 flex justify-start">
                    <div className="flex flex-col justify-start h-12">
                      <Button
                        variant="outline"
                        onClick={handleQuickRecord}
                        size="sm"
                        className="border-2 border-blue-500/60 text-blue-400 bg-blue-900/20 hover:bg-blue-800/40 hover:border-blue-400/80 hover:text-blue-300 text-xs h-12"
                      >
                        <Plus className="w-3 h-3 mr-1" />
                        快速记录
                      </Button>
                    </div>
                  </div>
                  
                  {/* 中间区域 - 今日统计 */}
                   <div className="flex-1 flex justify-center">
                     <div className="relative bg-gradient-to-br from-amber-500/20 to-orange-500/20 rounded-xl px-3 py-2 border border-amber-400/30 text-center min-w-[140px] shadow-lg h-20 flex flex-col justify-center -mt-2">
                       <div className="absolute top-1 right-1 w-2 h-2 bg-amber-400 rounded-full animate-pulse"></div>
                       
                       {/* 标题和切换按钮 */}
                       <div className="flex items-center justify-center space-x-1 mb-1">
                         <Calendar className="w-3 h-3 text-amber-400" />
                         <span className="text-amber-200 text-xs font-medium">今日记录</span>
                       </div>
                       
                       {/* 切换按钮组 */}
                       <div className="flex items-center justify-center mb-1">
                         <div className="bg-gray-800/50 rounded-md p-0.5 flex space-x-0.5">
                           <button
                             onClick={() => setDashboardData(prev => ({
                               ...prev,
                               todayRecords: {
                                 ...prev.todayRecords,
                                 currentView: 'created'
                               }
                             }))}
                             className={`px-1 py-0.5 rounded text-xs font-medium transition-all duration-200 ${
                               dashboardData.todayRecords.currentView === 'created'
                                 ? 'bg-amber-500/80 text-white shadow-sm'
                                 : 'text-amber-300 hover:text-amber-200 hover:bg-amber-500/20'
                             }`}
                           >
                              创建
                            </button>
                            <button
                              onClick={() => setDashboardData(prev => ({
                                ...prev,
                                todayRecords: {
                                  ...prev.todayRecords,
                                  currentView: 'event'
                                }
                              }))}
                              className={`px-1 py-0.5 rounded text-xs font-medium transition-all duration-200 ${
                                dashboardData.todayRecords.currentView === 'event'
                                   ? 'bg-green-500/80 text-white shadow-sm'
                                   : 'text-green-300 hover:text-green-200 hover:bg-green-500/20'
                              }`}
                            >
                              事件
                            </button>
                         </div>
                       </div>
                       
                       {/* 记录数量显示 */}
                       <div className="text-amber-100 text-sm font-bold">
                          {(() => {
                            const today = new Date();
                            if (dashboardData.todayRecords.currentView === 'created') {
                              // 今天创建的记录
                              return recentRecords.filter(record => {
                                const createdDate = new Date(record.created_at);
                                return today.toDateString() === createdDate.toDateString();
                              }).length;
                            } else {
                              // 事件时间是今天的记录
                              return recentRecords.filter(record => {
                                const eventDate = new Date(record.event_date);
                                return today.toDateString() === eventDate.toDateString();
                              }).length;
                            }
                          })()} 条记录
                        </div>
                     </div>
                   </div>
                  
                  {/* 右侧区域 - 邀请好友和ID */}
                  <div className="flex-1 flex flex-col items-end space-y-2">
                    {/* 邀请成员按钮 */}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowInviteDialog(true)}
                      className="border-2 border-emerald-500/60 text-emerald-400 bg-emerald-900/20 hover:bg-emerald-800/40 hover:border-emerald-400/80 hover:text-emerald-300 text-xs h-8"
                    >
                      <UserPlus className="w-3 h-3 mr-1" />
                      邀请成员
                    </Button>
                    
                    {/* ID及复制按钮 */}
                    <div className="flex items-center space-x-2">
                      <div className="flex items-center space-x-1.5">
                        <span className="text-white/70 text-xs">ID:</span>
                        <span className="text-white font-mono text-xs">{family.family_id_code}</span>
                      </div>
                      <button
                        onClick={copyFamilyId}
                        className="text-white/70 hover:text-white p-1 hover:bg-white/10 rounded transition-all"
                        title="复制ID"
                      >
                        <Copy className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
                    
                {/* 礼金薄概览标题 */}
                <div className="flex items-center space-x-2 mb-2">
                  <Database className="w-4 h-4 text-blue-400" />
                  <span className="text-white font-medium text-sm">礼金薄概览</span>
                  <div className="flex-1 h-px bg-gradient-to-r from-blue-400/50 to-transparent"></div>
                </div>
                
                {/* 极致紧凑信息区域 */}
                <div className="space-y-2 mb-3">
                  
                  {/* 核心信息网格 */}
                  <div className="grid grid-cols-4 gap-2">
                    {/* 权限等级 */}
                    <div className="bg-white/8 rounded-md p-2 border border-white/10 text-center">
                      <Crown className="w-3 h-3 mx-auto mb-1 text-amber-400" />
                      <div className="text-white/70 text-xs mb-0.5">权限等级</div>
                      <div className={`text-xs font-medium ${isCreator() ? 'text-green-400' : 'text-white'}`}>{isCreator() ? '创建者' : '成员'}</div>
                    </div>
                    
                    {/* 家庭成员 */}
                    <div className="bg-white/8 rounded-md p-2 border border-white/10 text-center">
                      <Users className="w-3 h-3 text-blue-400 mx-auto mb-1" />
                      <div className="text-white/70 text-xs mb-0.5">家庭成员</div>
                      <div className="text-white text-xs font-medium">{members.length} 人</div>
                    </div>
                    
                    {/* 总记录数 */}
                    <div className="bg-white/8 rounded-md p-2 border border-white/10 text-center">
                      <Activity className="w-3 h-3 text-green-400 mx-auto mb-1" />
                      <div className="text-white/70 text-xs mb-0.5">数据记录</div>
                      <div className="text-white text-xs font-medium">{analysis?.total_records || 0} 条</div>
                    </div>
                    
                    {/* 本月记录 */}
                    <div className="bg-white/8 rounded-md p-2 border border-white/10 text-center">
                      <Calendar className="w-3 h-3 text-purple-400 mx-auto mb-1" />
                      <div className="text-white/70 text-xs mb-0.5">本月记录</div>
                      <div className="text-purple-300 text-xs font-medium">
                        {recentRecords.filter(record => {
                          const now = new Date();
                          const recordDate = new Date(record.event_date);
                          return recordDate.getMonth() === now.getMonth() && recordDate.getFullYear() === now.getFullYear();
                        }).length} 条
                      </div>
                    </div>
                  </div>
                  
                  {/* 财务统计详情 */}
                  {analysis && (
                    <div className="mt-3 space-y-2">
                      <div className="flex items-center space-x-2 mb-2">
                        <TrendingUp className="w-4 h-4 text-blue-400" />
                        <span className="text-white font-medium text-sm">财务统计</span>
                        <div className="flex-1 h-px bg-gradient-to-r from-blue-400/50 to-transparent"></div>
                      </div>
                      
                      {/* 收支统计卡片 */}
                      <div className="grid grid-cols-3 gap-2">
                        <div className="bg-gradient-to-br from-green-500/20 to-emerald-500/20 rounded-lg p-2 border border-green-400/30">
                          <div className="flex items-center space-x-2 mb-1">
                            <ArrowUpRight className="w-4 h-4 text-green-400" />
                            <span className="text-green-300 text-xs font-medium">总收入</span>
                          </div>
                          <div className="text-green-200 text-lg font-bold">¥{formatAmount(analysis.total_income || 0)}</div>
                          <div className="text-green-300/70 text-xs">{analysis.income_count || 0} 笔收入</div>
                        </div>
                        
                        <div className="bg-gradient-to-br from-red-500/20 to-pink-500/20 rounded-lg p-2 border border-red-400/30">
                          <div className="flex items-center space-x-2 mb-1">
                            <ArrowDownRight className="w-4 h-4 text-red-400" />
                            <span className="text-red-300 text-xs font-medium">总支出</span>
                          </div>
                          <div className="text-red-200 text-lg font-bold">¥{formatAmount(analysis.total_expense || 0)}</div>
                          <div className="text-red-300/70 text-xs">{analysis.expense_count || 0} 笔支出</div>
                        </div>
                        
                        <div className={`bg-gradient-to-br ${
                          (analysis.net_income || 0) >= 0 
                            ? 'from-blue-500/20 to-indigo-500/20 border-blue-400/30' 
                            : 'from-orange-500/20 to-red-500/20 border-orange-400/30'
                        } rounded-lg p-2 border`}>
                          <div className="flex items-center space-x-2 mb-1">
                            <Wallet className={`w-4 h-4 ${
                              (analysis.net_income || 0) >= 0 ? 'text-blue-400' : 'text-orange-400'
                            }`} />
                            <span className={`text-xs font-medium ${
                              (analysis.net_income || 0) >= 0 ? 'text-blue-300' : 'text-orange-300'
                            }`}>净收支</span>
                          </div>
                          <div className={`text-lg font-bold ${
                            (analysis.net_income || 0) >= 0 ? 'text-blue-200' : 'text-orange-200'
                          }`}>
                            {(analysis.net_income || 0) < 0 ? '-' : ''}¥{formatAmount(analysis.net_income || 0)}
                          </div>
                          <div className={`text-xs ${
                            (analysis.net_income || 0) >= 0 ? 'text-blue-300/70' : 'text-orange-300/70'
                          }`}>
                            {(analysis.net_income || 0) >= 0 ? '盈余' : '亏损'}
                          </div>
                        </div>
                      </div>
                      
                      {/* 平均金额统计 */}
                      <div className="grid grid-cols-2 gap-2">

                      </div>
                    </div>
                  )}
                </div>
                
                {/* 极致紧凑功能区域 */}
                <div className="space-y-3">
                  {/* 系统概览标题 */}
                  <div className="flex items-center space-x-2 mb-3">
                    <Settings className="w-4 h-4 text-amber-400" />
                    <span className="text-white font-medium text-sm">系统概览</span>
                    <div className="flex-1 h-px bg-gradient-to-r from-amber-400/50 to-transparent"></div>
                  </div>
                  
                  {/* 系统信息行 */}
                  <div className="flex items-center justify-between bg-white/8 rounded-md p-2 border border-white/10">
                    <div className="flex items-center space-x-3">
                      <div className="flex items-center space-x-1">
                        <Settings className="w-3 h-3 text-amber-400" />
                        <span className="text-white/70 text-xs">系统版本：{versionInfo.version}</span>
                      </div>
                      <div className="text-white/50 text-xs">|</div>
                      <span className="text-white/70 text-xs">{versionInfo.environment}</span>
                    </div>
                    <Button
                      onClick={async (e) => {
                        // 脉冲动画效果
                        const button = e.target.closest('button');
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
                        
                        // 立即设置IP和位置为检测中状态（橙色）
                        setIpInfo({ ip: '检测中...', location: '检测中...' });
                        
                        await checkBackendStatus();
                        const networkResult = await checkNetworkStatus();
                        if (networkResult.hasInternet) {
                          await getIpInfo();
                        }
                      }}
                      size="sm"
                      className="bg-gradient-to-r from-blue-500/70 to-purple-500/70 hover:from-blue-500 hover:to-purple-500 text-white border-0 text-xs py-1 px-2 h-6 flex items-center space-x-1"
                    >
                      <Shield className="w-3 h-3" />
                      <span>刷新</span>
                    </Button>
                  </div>
                  
                  {/* 监控数据网格 */}
                  <div className="grid grid-cols-3 gap-2">
                    <div className="bg-white/8 rounded-md p-2 border border-white/10 text-center">
                      <div className="text-white/70 text-xs mb-0.5">网速</div>
                      <div className={`text-xs font-mono ${
                        networkSpeed === 'checking' || systemStatus.networkSpeed === 'checking' ? 'text-yellow-400' : 
                        systemStatus.networkSpeed === 'offline' ? 'text-red-400' : 
                        typeof networkSpeed === 'number' ? 
                          (networkSpeed < 100 ? 'text-green-400' : 
                           networkSpeed < 300 ? 'text-orange-400' : 'text-red-400') : 
                        'text-slate-400'
                      }`}>
                        {networkSpeed === 'checking' || systemStatus.networkSpeed === 'checking' ? '检测中' : 
                         systemStatus.networkSpeed === 'offline' ? '无网络连接' : 
                         typeof networkSpeed === 'number' ? `${networkSpeed}ms` : '请检查网络状态'}
                      </div>
                    </div>
                    <div className="bg-white/8 rounded-md p-2 border border-white/10 text-center">
                      <div className="text-white/70 text-xs mb-0.5">公网IP</div>
                      <div className={`text-xs font-mono truncate ${
                        ipInfo.ip === '检测中...' ? 'text-yellow-400' :
                        !ipInfo.ip || ipInfo.ip === '获取中...' || ipInfo.ip === '未获取IP地址，请检查网络状态' ? 'text-red-400' : 'text-white'
                      }`} title={ipInfo.ip}>
                        {ipInfo.ip || '未获取'}
                      </div>
                    </div>
                    <div className="bg-white/8 rounded-md p-2 border border-white/10 text-center">
                      <div className="text-white/70 text-xs mb-0.5">地理位置</div>
                      <div className={`text-xs truncate ${
                        ipInfo.location === '检测中...' ? 'text-yellow-400' :
                        !ipInfo.location || ipInfo.location === '获取中...' || ipInfo.location === '未获取地理位置，请检查网络状态' ? 'text-red-400' : 'text-white'
                      }`} title={ipInfo.location}>
                        {ipInfo.location || '未获取'}
                      </div>
                    </div>
                  </div>
                  

                  
                  {/* 状态信息 */}
                  <div className="text-center bg-white/5 rounded-md p-1.5 border border-white/5">
                    <div className="text-white/40 text-xs">
                      💡 最新检测: {lastCheckTime ? lastCheckTime.toLocaleTimeString() : '未检测'} · 每30秒自动刷新
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

          </div>

        {/* 主要内容区域 */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* 左侧：收支分析 */}
          <div className="xl:col-span-2 space-y-6">
            {/* 热门趋势 */}
            <Card className="shadow-2xl border-0 hover:shadow-3xl transition-all duration-500 bg-gradient-to-br from-pink-500/15 via-rose-500/12 to-red-500/15 border border-pink-300/30 group hover:border-pink-300/50 hover:scale-[1.02] transform p-0">
              <CardHeader className="relative z-10 p-0 mb-0">
                <CardTitle className="bg-gradient-to-r from-pink-400/15 to-rose-500/15 rounded-t-lg border-b border-pink-300/25 w-full">
                  <div className="flex items-center justify-start space-x-4 text-xl text-white px-4 py-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-pink-400 via-rose-500 to-red-500 rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:scale-110">
                      <TrendingUp className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex flex-col justify-center">
                      <span className="font-bold tracking-wide pb-1 mb-2 inline-block relative">
                         热门趋势
                         <div className="absolute -bottom-1 left-0 w-full h-0.5 bg-gradient-to-r from-pink-300 via-pink-200 to-pink-100 opacity-80"></div>
                       </span>
                    </div>
                  </div>
                  <div className="h-0.5 bg-gradient-to-r from-pink-200/50 via-rose-200/50 to-pink-300/50 w-full"></div>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 relative z-10 -mt-5 h-80">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* 热门礼金类型 */}
                  <div className="space-y-1">
                    <h4 className="text-white font-semibold flex items-center space-x-2">
                      <TrendingUpIcon className="w-5 h-5 text-pink-400" />
                      <span>热门{popularType === 'event' ? '事件类型' : '人物关系'}</span>
                    </h4>
                    {/* 切换按钮 */}
                    <div className="flex space-x-2 mb-3">
                      <Button
                        size="sm"
                        onClick={() => setPopularType('event')}
                        className={`text-xs px-3 py-1 h-6 transition-all duration-200 ${
                          popularType === 'event'
                            ? 'bg-pink-500/80 hover:bg-pink-500 text-white border-pink-400'
                            : 'bg-white/10 hover:bg-white/20 text-white/70 border-white/20'
                        }`}
                      >
                        事件类型
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => setPopularType('relation')}
                        className={`text-xs px-3 py-1 h-6 transition-all duration-200 ${
                          popularType === 'relation'
                            ? 'bg-pink-500/80 hover:bg-pink-500 text-white border-pink-400'
                            : 'bg-white/10 hover:bg-white/20 text-white/70 border-white/20'
                        }`}
                      >
                        人物关系
                      </Button>
                    </div>
                    <div className="space-y-2">
                      {getPopularTypes().length > 0 ? (
                        getPopularTypes().map((item, index) => {
                          const gradients = [
                            'from-pink-400 to-rose-500',
                            'from-orange-400 to-red-500',
                            'from-yellow-400 to-orange-500'
                          ];
                          return (
                            <div key={index} className="flex items-center justify-between bg-gradient-to-r from-pink-50/10 to-rose-50/10 rounded-md p-2 border border-pink-200/20">
                              <div className="flex items-center space-x-2">
                                <div className={`w-6 h-6 bg-gradient-to-br ${gradients[index]} rounded-md flex items-center justify-center`}>
                                  <span className="text-white text-xs font-bold">{item.rank}</span>
                                </div>
                                <span className="text-white text-sm">{item.name}</span>
                              </div>
                              <div className="text-right">
                                <div className="text-pink-300 font-semibold text-sm">¥{formatAmount(item.avgAmount)}</div>
                                <div className="text-xs text-gray-400">总支出</div>
                              </div>
                            </div>
                          );
                        })
                      ) : (
                        <div className="text-center py-3 text-gray-400">
                          <span className="text-sm">暂无数据</span>
                        </div>
                      )}
                      {/* 提示文本 */}
                      <div className="mt-2 px-2 py-1.5 bg-white/5 rounded-md border border-white/10">
                        <p className="text-xs text-gray-400 text-center leading-tight">
                          💡 仅统计支出金额最大的前三项，因为正常情况下同一家庭一月内不会频繁办理多项宴席
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* 月度趋势 */}
                  <div className="space-y-1">
                    <h4 className="text-white font-semibold flex items-center space-x-2">
                      <TrendingUpIcon className="w-5 h-5 text-pink-400" />
                      <span>月度趋势</span>
                    </h4>
                    <div className="bg-gradient-to-br from-pink-50/5 to-rose-50/5 rounded-xl p-3 border border-pink-200/20">
                      {analyticsData ? (() => {
                        const trends = getMonthlyTrends();
                        return (
                          <div className="space-y-3">
                            {/* 本月支出卡片 */}
                            <div className="bg-gradient-to-br from-pink-500/15 to-red-500/15 rounded p-1.5 border border-pink-400/30">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-1">
                                  <ArrowDownRight className="w-2.5 h-2.5 text-pink-400" />
                                  <span className="text-pink-300 text-xs font-medium">本月支出</span>
                                </div>
                                <div className="text-pink-200 text-xs font-bold">¥{formatAmount(trends.expense)}</div>
                              </div>
                            </div>
                            
                            {/* 本月收入卡片 */}
                            <div className="bg-gradient-to-br from-green-500/15 to-emerald-500/15 rounded p-1.5 border border-green-400/30">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-1">
                                  <ArrowUpRight className="w-2.5 h-2.5 text-green-400" />
                                  <span className="text-green-300 text-xs font-medium">本月收入</span>
                                </div>
                                <div className="text-green-200 text-xs font-bold">¥{formatAmount(trends.income)}</div>
                              </div>
                            </div>
                            
                            {/* 较上月净收支卡片 */}
                            <div className={`bg-gradient-to-br rounded p-1.5 border ${
                              trends.change >= 0 
                                ? 'from-green-500/15 to-emerald-500/15 border-green-400/30' 
                                : 'from-red-500/15 to-pink-500/15 border-red-400/30'
                            }`}>
                              <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-1">
                                  {trends.change >= 0 ? (
                                    <TrendingUpIcon className="w-2.5 h-2.5 text-green-400" />
                                  ) : (
                                    <TrendingDown className="w-2.5 h-2.5 text-red-400" />
                                  )}
                                  <span className={`text-xs font-medium ${
                                    trends.change >= 0 ? 'text-green-300' : 'text-red-300'
                                  }`}>较上月净收支</span>
                                </div>
                                <div className={`text-xs font-bold ${
                                  trends.change >= 0 ? 'text-green-200' : 'text-red-200'
                                }`}>{trends.change >= 0 ? '+' : ''}{trends.change}%</div>
                              </div>
                            </div>
                            
                            {/* 平均收入卡片 */}
                            <div className="bg-gradient-to-br from-blue-500/15 to-indigo-500/15 rounded p-1.5 border border-blue-400/30">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-1">
                                  <Calculator className="w-2.5 h-2.5 text-blue-400" />
                                  <span className="text-blue-300 text-xs font-medium">平均收入</span>
                                </div>
                                <div className="text-blue-200 text-xs font-bold">¥{formatAmount(trends.avgIncome)}</div>
                              </div>
                            </div>
                            
                            {/* 平均支出卡片 */}
                            <div className="bg-gradient-to-br from-orange-500/15 to-amber-500/15 rounded p-1.5 border border-orange-400/30">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-1">
                                  <Calculator className="w-2.5 h-2.5 text-orange-400" />
                                  <span className="text-orange-300 text-xs font-medium">平均支出</span>
                                </div>
                                <div className="text-orange-200 text-xs font-bold">¥{formatAmount(trends.avgExpense)}</div>
                              </div>
                            </div>
                            
                            {/* 总笔数卡片 */}
                            <div className="bg-gradient-to-br from-yellow-500/15 to-amber-500/15 rounded p-1.5 border border-yellow-400/30">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-1">
                                  <Activity className="w-2.5 h-2.5 text-yellow-400" />
                                  <span className="text-yellow-300 text-xs font-medium">总笔数</span>
                                </div>
                                <div className="text-yellow-200 text-xs font-bold">{trends.monthlyTotalCount} 笔</div>
                              </div>
                            </div>
                          </div>
                        );
                      })() : (
                        <div className="text-center py-3 text-gray-400">
                          <span className="text-sm">暂无数据</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 智能洞察 */}
            <SmartInsightsCard 
              records={recentRecords}
              familyId={family?.id}
              members={members}
              analysis={analysis}
            />
          </div>

          {/* 右侧：家庭成员 */}
          <div className="space-y-6">
            <Card className="shadow-2xl border-0 hover:shadow-3xl transition-all duration-500 bg-gradient-to-br from-blue-600/15 via-indigo-600/12 to-purple-700/15 border border-blue-400/30 hover:border-blue-400/50 hover:scale-[1.02] transform p-0">
              <CardHeader className="relative z-10 p-0">
                <CardTitle className="bg-gradient-to-r from-blue-500/25 to-indigo-600/25 rounded-t-lg border-b border-blue-400/35 w-full">
                  <div className="flex items-center justify-between px-4 py-3">
                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-500 via-indigo-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg transition-all duration-300">
                        <Users className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex items-center">
                        <span className="text-white font-bold tracking-wide text-xl pb-1 mb-2 inline-block relative">
                           家庭成员
                           <div className="absolute -bottom-1 left-0 w-full h-0.5 bg-gradient-to-r from-blue-400 via-blue-300 to-blue-200 opacity-80"></div>
                         </span>
                      </div>
                    </div>
                    {isCreator() && (
                      <Button size="sm" variant="outline" onClick={() => setShowInviteDialog(true)} className="border-2 border-emerald-500/60 text-emerald-400 bg-emerald-900/20 hover:bg-emerald-800/40 hover:border-emerald-400/80 hover:text-emerald-300">
                        <UserPlus className="w-4 h-4 mr-2" />
                        邀请成员
                      </Button>
                    )}
                  </div>
                  <div className="h-0.5 bg-gradient-to-r from-blue-300/50 via-indigo-300/50 to-purple-300/50 w-full"></div>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 -mt-5 h-80 overflow-y-auto scrollbar-hide">
                  <div className="space-y-1">
                    {members.map((member) => (
                    <div key={member.id} className="group hover:scale-105 rounded-xl p-2 transition-all duration-200 border border-blue-600/30 cursor-pointer bg-blue-800/15 backdrop-blur-sm hover:bg-blue-700/25">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          {/* 头像区域 - 与导航栏样式一致 */}
                          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg overflow-hidden">
                            {member.avatar ? (
                              <img 
                                src={member.avatar} 
                                alt="用户头像" 
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <span className="text-white font-medium text-sm">
                                {member.username?.charAt(0)?.toUpperCase() || '?'}
                              </span>
                            )}
                          </div>
                          {/* 用户信息区域 - 与导航栏样式一致 */}
                          <div className="text-sm">
                            <div className="font-medium text-white flex items-center">
                              {member.role === '创建者' && (
                                <Crown className="w-3 h-3 mr-1 text-yellow-400" />
                              )}
                              {member.nickname || member.username}
                            </div>
                            <div className="text-slate-300 text-xs">
                              {member.username || '用户名未设置'}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center">
                          {/* 创建者/成员标识 */}
                          <div className="text-right">
                            <span className={`text-xs px-2 py-1 rounded-full ${
                              member.role === '创建者' 
                                ? 'text-yellow-400 bg-yellow-400/20 font-semibold' 
                                : 'text-gray-300 bg-slate-700/50'
                            }`}>
                              {member.role === '创建者' ? '创建者' : '成员'}
                            </span>
                          </div>
                          <div className="ml-2 group-hover:block hidden">
                            {isCreator() && member.user_id !== user?.id ? (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleRemoveMember(member.id)}
                                className="text-red-600 hover:text-red-700 hover:bg-red-50 transition-all"
                              >
                                移除
                              </Button>
                            ) : member.user_id === user?.id && member.role !== '创建者' ? (
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={handleLeaveFamily}
                                className="bg-red-600 hover:bg-red-700 text-white transition-all"
                              >
                                退出
                              </Button>
                            ) : null}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* 个性化仪表盘 */}
            <Card className="shadow-2xl border-0 hover:shadow-3xl transition-all duration-500 bg-gradient-to-br from-amber-600/15 via-orange-600/12 to-yellow-700/15 border border-amber-400/30 group hover:border-amber-400/50 hover:scale-[1.02] transform p-0">
              <CardHeader className="relative z-10 p-0">
                <CardTitle className="bg-gradient-to-r from-amber-500/10 to-orange-600/10 rounded-t-lg border-b border-amber-400/35 w-full">
                  <div className="flex items-center px-4 py-3">
                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 bg-gradient-to-br from-amber-500 via-orange-600 to-yellow-600 rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:scale-110">
                        <Target className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex items-center justify-between w-full">
                        <span className="text-white font-bold tracking-wide text-xl pb-1 mb-2 inline-block relative">
                           个性化仪表盘
                           <div className="absolute -bottom-1 left-0 w-full h-0.5 bg-gradient-to-r from-amber-400 via-orange-300 to-yellow-200 opacity-80"></div>
                         </span>
                      </div>
                    </div>
                  </div>
                  <div className="h-0.5 bg-gradient-to-r from-amber-300/50 via-orange-300/50 to-yellow-300/50 w-full"></div>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 relative z-10 -mt-5 h-80 overflow-y-auto scrollbar-hide">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 h-full">
                  {/* 今日提醒 */}
                  <div className="bg-gradient-to-br from-blue-50/10 to-indigo-50/10 rounded-xl p-3 border border-blue-200/20 h-full flex flex-col">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center space-x-2 mr-2">
                        <Bell className="w-4 h-4 text-blue-400" />
                        <span className="text-white font-medium text-sm truncate">今日提醒</span>
                      </div>
                      <div className="flex items-center -space-x-1 ml-auto">
                        <Badge className="bg-blue-100/20 text-blue-300 border-blue-200/30 text-xs">
                          {dashboardData.todayReminders.length}条
                        </Badge>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={addReminder}
                          className="text-blue-300 hover:text-blue-200 hover:bg-blue-500/20 transition-all p-1 h-6 w-6"
                        >
                          <Plus className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                    <div className="space-y-1 flex-1">
                      {dashboardData.todayReminders.map((reminder) => (
                        <div key={reminder.id} className="text-xs text-gray-300 flex items-center space-x-2">
                          {reminder.icon === 'Clock' && <Clock className="w-3 h-3 text-yellow-400" />}
                          {reminder.icon === 'AlertCircle' && <AlertCircle className="w-3 h-3 text-orange-400" />}
                          {reminder.icon === 'Bell' && <Bell className="w-3 h-3 text-blue-400" />}
                          {editingReminder === reminder.id ? (
                            <div className="flex items-center space-x-1 flex-1">
                              <Input
                                value={reminder.content}
                                onChange={(e) => updateReminder(reminder.id, e.target.value)}
                                onBlur={() => setEditingReminder(null)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    setEditingReminder(null);
                                    setSuccess('提醒已更新！');
                                    setTimeout(() => setSuccess(''), 3000);
                                  }
                                  if (e.key === 'Escape') setEditingReminder(null);
                                }}
                                autoFocus
                                className="text-xs h-6 bg-white/10 border-white/20 text-white"
                              />
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => removeReminder(reminder.id)}
                                className="text-red-300 hover:text-red-200 hover:bg-red-500/20 transition-all p-1 h-6 w-6"
                              >
                                ×
                              </Button>
                            </div>
                          ) : (
                            <span 
                              className="cursor-pointer hover:text-blue-300 transition-colors flex-1"
                              onClick={() => setEditingReminder(reminder.id)}
                            >
                              {reminder.content}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* 本月预算 */}
                  <div className={`rounded-xl p-3 border h-full flex flex-col ${
                    dashboardData.monthlyBudget.percentage >= 100 
                      ? 'bg-gradient-to-br from-red-50/10 to-red-50/10 border-red-200/20'
                      : dashboardData.monthlyBudget.percentage >= 50
                      ? 'bg-gradient-to-br from-orange-50/10 to-yellow-50/10 border-orange-200/20'
                      : 'bg-gradient-to-br from-green-50/10 to-emerald-50/10 border-green-200/20'
                  }`}>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center space-x-2">
                        <Target className={`w-4 h-4 ${
                          dashboardData.monthlyBudget.percentage >= 100 
                            ? 'text-red-400'
                            : dashboardData.monthlyBudget.percentage >= 50
                            ? 'text-orange-400'
                            : 'text-green-400'
                        }`} />
                        <span className="text-white font-medium text-sm truncate">本月预算</span>
                      </div>
                      <Badge className={`text-xs ${
                        dashboardData.monthlyBudget.percentage >= 100 
                          ? 'bg-red-100/20 text-red-300 border-red-200/30'
                          : dashboardData.monthlyBudget.percentage >= 50
                          ? 'bg-orange-100/20 text-orange-300 border-orange-200/30'
                          : 'bg-green-100/20 text-green-300 border-green-200/30'
                      }`}>
                        {dashboardData.monthlyBudget.percentage}%
                      </Badge>
                    </div>
                    <div className="space-y-1 flex-1 flex flex-col justify-center">
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-300">
                          已用: ¥{dashboardData.monthlyBudget.used}
                        </span>
                        <span className="text-gray-300">
                          预算: {editingBudget ? (
                            <Input
                              type="number"
                              value={dashboardData.monthlyBudget.total}
                              onChange={(e) => {
                                const total = parseInt(e.target.value) || 1;
                                setDashboardData(prev => ({
                                  ...prev,
                                  monthlyBudget: {
                                    ...prev.monthlyBudget,
                                    total,
                                    percentage: Math.round((prev.monthlyBudget.used / total) * 100)
                                  }
                                }));
                              }}
                              onBlur={() => {
                                setEditingBudget(false);
                                setSuccess('预算已更新！');
                                setTimeout(() => setSuccess(''), 3000);
                              }}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  setEditingBudget(false);
                                  setSuccess('预算已更新！');
                                  setTimeout(() => setSuccess(''), 3000);
                                }
                                if (e.key === 'Escape') setEditingBudget(false);
                              }}
                              autoFocus
                              className="inline-block w-24 h-5 text-xs bg-white/10 border-white/20 text-white ml-1 [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                            />
                          ) : (
                            <span 
                              className="cursor-pointer hover:text-green-300 transition-colors"
                              onClick={() => setEditingBudget(true)}
                            >
                              ¥{dashboardData.monthlyBudget.total}
                            </span>
                          )}
                        </span>
                      </div>
                      <div className="w-full bg-gray-700/50 rounded-full h-1.5">
                        <div className={`h-1.5 rounded-full ${
                          dashboardData.monthlyBudget.percentage >= 100 
                            ? 'bg-gradient-to-r from-red-400 to-red-500'
                            : dashboardData.monthlyBudget.percentage >= 50
                            ? 'bg-gradient-to-r from-orange-400 to-yellow-500'
                            : 'bg-gradient-to-r from-green-400 to-emerald-500'
                        }`} style={{width: `${Math.min(dashboardData.monthlyBudget.percentage, 100)}%`}}></div>
                      </div>
                      {dashboardData.monthlyBudget.percentage >= 100 && (
                        <div className="text-red-300 text-xs mt-1 flex items-center space-x-1">
                          <AlertTriangle className="w-3 h-3" />
                          <span>预算已超支！请注意控制支出</span>
                        </div>
                      )}
                      {dashboardData.monthlyBudget.percentage >= 50 && dashboardData.monthlyBudget.percentage < 100 && (
                        <div className="text-orange-300 text-xs mt-1 flex items-center space-x-1">
                          <AlertTriangle className="w-3 h-3" />
                          <span>预算使用过半，请合理安排支出</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* 重要节日倒计时 */}
                  <div className="bg-gradient-to-br from-purple-50/10 to-pink-50/10 rounded-xl p-3 border border-purple-200/20 h-full flex flex-col">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center space-x-1">
                        <Calendar className="w-4 h-4 text-purple-400" />
                        <span className="text-white font-medium text-xs truncate">节日倒计时</span>
                      </div>
                      <Badge 
                        className="bg-purple-100/20 text-purple-300 border-purple-200/30 text-xs cursor-pointer hover:bg-purple-100/30 transition-colors max-w-20 truncate"
                        onClick={() => setEditingHoliday(true)}
                      >
                        {dashboardData.holidayCountdown.name}
                      </Badge>
                    </div>
                    
                    {editingHoliday && (
                      <div className="mb-2 space-y-2">
                        <div className="flex space-x-1">
                          <Button
                            size="sm"
                            variant={holidayType === 'preset' ? 'default' : 'ghost'}
                            onClick={() => setHolidayType('preset')}
                            className="text-xs h-6 px-2"
                          >
                            预设
                          </Button>
                          <Button
                            size="sm"
                            variant={holidayType === 'custom' ? 'default' : 'ghost'}
                            onClick={() => setHolidayType('custom')}
                            className="text-xs h-6 px-2"
                          >
                            自定义
                          </Button>
                        </div>
                        
                        {holidayType === 'preset' ? (
                          <div className="grid grid-cols-2 gap-1">
                            {presetHolidays.map((holiday) => (
                              <Button
                                key={holiday.name}
                                size="sm"
                                variant="ghost"
                                onClick={() => selectPresetHoliday(holiday)}
                                className="text-xs h-6 text-purple-300 hover:text-purple-200 hover:bg-purple-500/20"
                              >
                                {holiday.name}
                              </Button>
                            ))}
                          </div>
                        ) : (
                          <div className="space-y-1">
                            <Input
                              placeholder="节日名称"
                              value={dashboardData.holidayCountdown.name}
                              onChange={(e) => setDashboardData(prev => ({
                                ...prev,
                                holidayCountdown: {
                                  ...prev.holidayCountdown,
                                  name: e.target.value
                                }
                              }))}
                              className="text-xs h-6 bg-white/10 border-white/20 text-white"
                            />
                            <Input
                              type="number"
                              placeholder="天数"
                              value={dashboardData.holidayCountdown.days}
                              onChange={(e) => setDashboardData(prev => ({
                                ...prev,
                                holidayCountdown: {
                                  ...prev.holidayCountdown,
                                  days: parseInt(e.target.value) || 0
                                }
                              }))}
                              className="text-xs h-6 bg-white/10 border-white/20 text-white"
                            />
                            <Button
                              size="sm"
                              onClick={() => {
                                setEditingHoliday(false);
                                setSuccess('节日倒计时已更新！');
                                setTimeout(() => setSuccess(''), 3000);
                              }}
                              className="w-full text-xs h-6"
                            >
                              保存
                            </Button>
                          </div>
                        )}
                      </div>
                    )}
                    
                    <div className="text-center flex-1 flex flex-col justify-center">
                      <div className="text-xl font-bold text-purple-300 mb-0.5">
                        {dashboardData.holidayCountdown.days}
                      </div>
                      <div className="text-xs text-gray-300">天后</div>
                    </div>
                  </div>

                  {/* 人情往来 */}
                  <div className="bg-gradient-to-br from-blue-50/10 to-indigo-50/10 rounded-xl p-2 border border-blue-200/20 h-full flex flex-col relative">
                    {/* 标题行和人数标签 */}
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center space-x-2">
                        <Users className="w-4 h-4 text-blue-400" />
                        <span className="text-white font-medium text-sm whitespace-nowrap">人情往来</span>
                      </div>
                      <Badge className="bg-blue-100/20 text-blue-300 border-blue-200/30 text-xs">
                        {dashboardData.relationshipSummary.currentView === 'expense' 
                          ? dashboardData.relationshipSummary.expenseContacts 
                          : dashboardData.relationshipSummary.incomeContacts}人
                      </Badge>
                    </div>
                    
                    {/* 切换按钮组 */}
                    <div className="flex items-center mb-0.5">
                      <div className="bg-gray-800/50 rounded-md p-0.5 flex">
                        <button
                          onClick={() => setDashboardData(prev => ({
                            ...prev,
                            relationshipSummary: {
                              ...prev.relationshipSummary,
                              currentView: 'expense'
                            }
                          }))}
                          className={`px-1 py-0.5 rounded text-xs font-medium transition-all duration-200 ${
                            dashboardData.relationshipSummary.currentView === 'expense'
                              ? 'bg-red-500/80 text-white shadow-sm'
                              : 'text-gray-400 hover:text-red-300 hover:bg-red-500/20'
                          }`}
                        >
                          支出
                        </button>
                        <button
                          onClick={() => setDashboardData(prev => ({
                            ...prev,
                            relationshipSummary: {
                              ...prev.relationshipSummary,
                              currentView: 'income'
                            }
                          }))}
                          className={`px-1 py-0.5 rounded text-xs font-medium transition-all duration-200 ${
                            dashboardData.relationshipSummary.currentView === 'income'
                              ? 'bg-green-500/80 text-white shadow-sm'
                              : 'text-gray-400 hover:text-green-300 hover:bg-green-500/20'
                          }`}
                        >
                          收入
                        </button>
                      </div>
                    </div>
                    
                    {/* 统计信息 */}
                    <div className="flex-1 flex flex-col justify-start space-y-0 pb-0">
                      {(dashboardData.relationshipSummary.expenseContacts + dashboardData.relationshipSummary.incomeContacts) > 0 ? (
                        <>
                          {/* 人数统计 */}
                          <div className="flex items-center space-x-1.5 text-xs py-0">
                            <UserPlus className="w-2.5 h-2.5 text-blue-400" />
                            <span className="text-gray-300 text-xs">
                              {dashboardData.relationshipSummary.currentView === 'expense' 
                                ? `${dashboardData.relationshipSummary.expenseContacts}个联系人`
                                : `${dashboardData.relationshipSummary.incomeContacts}个联系人`}
                            </span>
                          </div>
                          
                          {/* 记录笔数统计 */}
                          <div className="flex items-center space-x-1.5 text-xs py-0">
                            <FileText className="w-2.5 h-2.5 text-purple-400" />
                            <span className="text-purple-300 text-xs">
                              {dashboardData.relationshipSummary.currentView === 'expense' 
                                ? `${dashboardData.relationshipSummary.expenseRecords}笔记录`
                                : `${dashboardData.relationshipSummary.incomeRecords}笔记录`}
                            </span>
                          </div>
                          
                          {/* 总金额 */}
                          <div className="flex items-center space-x-1.5 text-xs py-0">
                            <Calculator className="w-2.5 h-2.5 text-green-400" />
                            <span className="text-green-300 text-xs">
                              <span className="mr-1">总计</span>
                              {dashboardData.relationshipSummary.currentView === 'expense' 
                                ? `¥${dashboardData.relationshipSummary.totalExpenseAmount.toFixed(2)}`
                                : `¥${dashboardData.relationshipSummary.totalIncomeAmount.toFixed(2)}`}
                            </span>
                          </div>
                          
                          {/* 人均金额 */}
                          <div className="flex items-center space-x-1.5 text-xs py-0">
                            <DollarSign className="w-2.5 h-2.5 text-yellow-400" />
                            <span className="text-yellow-300 text-xs">
                              <span className="mr-1">人均</span>
                              {dashboardData.relationshipSummary.currentView === 'expense' 
                                ? `¥${dashboardData.relationshipSummary.avgExpenseAmount.toFixed(2)}`
                                : `¥${dashboardData.relationshipSummary.avgIncomeAmount.toFixed(2)}`}
                            </span>
                          </div>
                        </>
                      ) : (
                        <div className="text-center text-xs text-gray-400">暂无往来记录</div>
                      )}
                    </div>
                    
                    {/* 数据来源说明 - 固定在底部 */}
                    <div className="absolute bottom-0 left-0 right-0 text-[10px] text-gray-400 text-center">
                      基于本家庭礼金薄数据
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* 最近记录 - 跨越整个宽度 */}
        <div className="mt-6">
          <Card className="shadow-2xl border-0 hover:shadow-3xl transition-all duration-500 bg-gradient-to-br from-emerald-600/15 via-teal-600/12 to-cyan-700/15 border border-emerald-400/30 group hover:border-emerald-400/50 hover:scale-[1.02] transform p-0">
            <CardHeader className="relative z-10 p-0">
              <CardTitle className="bg-gradient-to-r from-emerald-400/10 to-teal-500/10 rounded-t-lg border-b border-emerald-300/25 w-full">
                <div className="flex items-center justify-between text-xl text-white px-4 py-3">
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 via-teal-600 to-green-600 rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:scale-110">
                      <Activity className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex flex-col justify-center">
                      <span className="font-bold tracking-wide pb-1 mb-2 inline-block relative">
                         最近记录
                         <span className="text-xs text-white/60 ml-2">(最新时间创建的前5条)</span>
                         <div className="absolute -bottom-1 left-0 w-full h-0.5 bg-gradient-to-r from-emerald-400 via-emerald-300 to-emerald-200 opacity-80"></div>
                       </span>
                    </div>
                  </div>
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    className="text-white hover:bg-white/10 hover:text-white border border-white/20 hover:border-white/30 transition-all duration-200"
                    onClick={() => navigate('/all-records')}
                  >
                    <Eye className="w-4 h-4 mr-1" />
                    查看全部
                  </Button>
                </div>
                <div className="h-0.5 bg-gradient-to-r from-emerald-300/60 via-teal-300/60 to-emerald-400/60 w-full"></div>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 -mt-5">
              {recentRecords.length > 0 ? (
                <div className="space-y-2">
                  {recentRecords.slice(0, 5).map((record, index) => (
                    <div key={record.id} className="group bg-white/[0.03] backdrop-blur-md rounded-xl p-3 transition-all duration-300 border border-white/20 shadow-lg hover:bg-gradient-to-br hover:from-blue-500/10 hover:to-purple-500/10 hover:border-white/30 hover:shadow-xl hover:shadow-blue-500/20 hover:scale-[1.02] transform">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className={`w-3 h-3 rounded-full ${
                            record.amount >= 0 ? 'bg-green-500' : 'bg-red-500'
                          } shadow-lg`}></div>
                          <div>
                            <div className="font-medium text-white group-hover:text-gray-200">
                              {(record.description || '礼金记录').replace(/\s*-\s*$/, '')}
                            </div>
                            <div className="text-sm text-gray-300 mt-1">
                              {getTypeText(record.type)} · {getRelationText(record.related_person)}
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
                        <div className="text-right">
                          <div className={`font-bold text-lg ${
                            record.amount >= 0 ? 'text-green-400' : 'text-red-400'
                          }`}>
                            {record.amount < 0 ? '-' : ''}¥{formatAmount(record.amount)}
                          </div>
                          <div className="text-sm text-gray-300 font-mono">
                            {new Date(record.event_date).toLocaleDateString('zh-CN', {
                              year: 'numeric',
                              month: '2-digit',
                              day: '2-digit'
                            })}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-slate-700/50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Calendar className="w-8 h-8 text-gray-300" />
                  </div>
                  <p className="text-gray-300 text-lg">暂无记录数据</p>
                  <p className="text-gray-400 text-sm mt-2">开始记录您的第一笔礼金往来吧</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>

    {/* 编辑成功弹窗 */}
    {showEditSuccessDialog && (
      <div 
        className="fixed inset-0 flex items-center justify-center p-4 z-50"
        onClick={() => setShowEditSuccessDialog(false)}
      >
        <div 
          className="bg-white rounded-2xl shadow-2xl w-full max-w-xs transform transition-all duration-300 scale-100"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="p-4 text-center">
            <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-3">
              <Check className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">修改成功！</h3>
            <p className="text-xs text-gray-500 mb-4">家庭名称已成功更新</p>
            <button
              onClick={() => setShowEditSuccessDialog(false)}
              className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white py-2 px-4 rounded-lg font-medium hover:from-blue-600 hover:to-purple-700 transition-all duration-200 transform hover:scale-105"
            >
              确定
            </button>
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
  </div>
  );
};

export default Center;

