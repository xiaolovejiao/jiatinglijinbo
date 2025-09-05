import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Alert, AlertDescription } from '../components/ui/alert';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import AIAnalysisEngine from '../utils/aiAnalysisEngine';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell, AreaChart, Area, LabelList
} from 'recharts';
import { 
  TrendingUp, 
  TrendingDown, 
  Users, 
  Calendar, 
  DollarSign, 
  Filter,
  Bot,
  Trophy,
  Target,
  Percent,
  FileText,
  CreditCard,
  PiggyBank,
  Wallet,
  BarChart3,
  PieChart as PieChartIcon,
  Activity,
  Search,
  Eye
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth.jsx';
import { useNavigate } from 'react-router-dom';
import NetworkSpeedCard from '../components/NetworkSpeedCard';

const Archive = () => {
  const [family, setFamily] = useState(null);
  const [overview, setOverview] = useState(null);
  const [monthlyData, setMonthlyData] = useState([]);
  const [yearlyData, setYearlyData] = useState([]);
  const [relationData, setRelationData] = useState([]);
  const [eventData, setEventData] = useState([]);
  const [recentRecords, setRecentRecords] = useState([]);
  const [recordCreators, setRecordCreators] = useState({});
  const [filters, setFilters] = useState({
    relation: '',
    event: '',
    year: new Date().getFullYear(),
    month: ''
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  // 为每个卡片创建独立的动画状态
  const [monthlyChartKey, setMonthlyChartKey] = useState(0);
  const [relationChartKey, setRelationChartKey] = useState(0);
  const [yearlyChartKey, setYearlyChartKey] = useState(0);
  const [eventChartKey, setEventChartKey] = useState(0);
  const [isMonthlyCardHovered, setIsMonthlyCardHovered] = useState(false);
  const [isRelationCardHovered, setIsRelationCardHovered] = useState(false);
  const [isYearlyCardHovered, setIsYearlyCardHovered] = useState(false);
  const [isEventCardHovered, setIsEventCardHovered] = useState(false);
 
  const { user } = useAuth();
  const navigate = useNavigate();

  // 筛选选项
  const relationOptions = [
    { value: '', label: '全部人物关系', color: 'bg-gray-100 text-gray-700 hover:bg-gray-200' },
    { value: 'relative', label: '亲戚', color: 'bg-red-100 text-red-700 hover:bg-red-200' },
    { value: 'friend', label: '朋友', color: 'bg-blue-100 text-blue-700 hover:bg-blue-200' },
    { value: 'colleague', label: '同事', color: 'bg-green-100 text-green-700 hover:bg-green-200' },
    { value: 'classmate', label: '同学', color: 'bg-purple-100 text-purple-700 hover:bg-purple-200' }
  ];

  const eventOptions = [
    { value: '', label: '全部事件类型', color: 'bg-gray-100 text-gray-700 hover:bg-gray-200' },
    { value: 'wedding', label: '结婚', color: 'bg-pink-100 text-pink-700 hover:bg-pink-200' },
    { value: 'birth', label: '满月', color: 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200' },
    { value: 'graduation', label: '升学', color: 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200' },
    { value: 'birthday', label: '生日', color: 'bg-orange-100 text-orange-700 hover:bg-orange-200' },
    { value: 'moving', label: '乔迁', color: 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200' },
    { value: 'funeral', label: '白事', color: 'bg-slate-100 text-slate-700 hover:bg-slate-200' },
    { value: 'casual', label: '无事酒', color: 'bg-teal-100 text-teal-700 hover:bg-teal-200' },
    { value: 'other', label: '其他', color: 'bg-stone-100 text-stone-700 hover:bg-stone-200' }
  ];

  // 图表颜色
  const COLORS = ['#ef4444', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'];

  useEffect(() => {
    fetchFamilyData();
  }, []);

  useEffect(() => {
    if (family) {
      fetchAnalysisData();
    }
  }, [family, filters]);

  const fetchFamilyData = async () => {
    try {
      const response = await fetch('/api/families', {
        credentials: 'include'
      });
      if (response.ok) {
        const data = await response.json();
        const familyInfo = data.family;
        
        // 获取家庭成员列表
        if (familyInfo && familyInfo.id) {
          const membersResponse = await fetch(`/api/families/${familyInfo.id}/members`, {
            credentials: 'include'
          });
          if (membersResponse.ok) {
            const membersData = await membersResponse.json();
            familyInfo.members = membersData.members || [];
          }
        }
        
        setFamily(familyInfo);
      } else {
        setError('请先创建或加入家庭');
      }
    } catch (error) {
      console.error('获取家庭信息失败:', error);
      setError('获取家庭信息失败');
    }
  };

  const fetchAnalysisData = async () => {
    if (!family) return;
    
    setLoading(true);
    try {
      // 获取总体分析数据
      const overviewResponse = await fetch(`/api/families/${family.id}/analysis/total`, {
        credentials: 'include'
      });
      if (overviewResponse.ok) {
        const data = await overviewResponse.json();
        setOverview(data);
      }

      // 获取所有记录用于分析
      const allRecordsResponse = await fetch(`/api/families/${family.id}/records`, {
        credentials: 'include'
      });
      let allRecords = [];
      if (allRecordsResponse.ok) {
        const data = await allRecordsResponse.json();
        allRecords = data.records || [];
        const recentRecordsData = allRecords.slice(0, 5);
        setRecentRecords(recentRecordsData); // 保留最近5条记录用于显示
        
        // 获取最近记录的创建者信息
        await fetchRecordCreators(recentRecordsData);
      }

      // 构建筛选参数（月度趋势分析不受月份筛选限制）
      const getFilteredRecords = (excludeMonth = false) => {
        return allRecords.filter(record => {
          // 人群筛选
          if (filters.relation && record.related_person !== filters.relation) {
            return false;
          }
          // 事件类型筛选
          if (filters.event && record.type !== filters.event) {
            return false;
          }
          // 年份筛选
          if (filters.year && record.event_date) {
            const recordYear = new Date(record.event_date).getFullYear();
            if (recordYear !== filters.year) {
              return false;
            }
          }
          // 月份筛选（月度趋势分析时排除）
          if (!excludeMonth && filters.month && record.event_date) {
            const recordMonth = new Date(record.event_date).getMonth() + 1;
            if (recordMonth !== parseInt(filters.month)) {
              return false;
            }
          }
          return true;
        });
      };

      // 获取月度趋势数据（受人物和事件筛选条件影响，但不受月份筛选限制）
      const monthlyFilteredRecords = allRecords.filter(record => {
        // 人群筛选
        if (filters.relation && record.related_person !== filters.relation) {
          return false;
        }
        // 事件类型筛选
        if (filters.event && record.type !== filters.event) {
          return false;
        }
        // 年份筛选
        if (filters.year && record.event_date) {
          const recordYear = new Date(record.event_date).getFullYear();
          if (recordYear !== filters.year) {
            return false;
          }
        }
        // 不受月份筛选限制
        return true;
      });
      const monthlyData = [];
      for (let month = 1; month <= 12; month++) {
        const monthRecords = monthlyFilteredRecords.filter(record => {
          if (!record.event_date) return false;
          const recordMonth = new Date(record.event_date).getMonth() + 1;
          return recordMonth === month;
        });
        
        const income = monthRecords
          .filter(record => record.amount > 0)
          .reduce((sum, record) => sum + record.amount, 0);
        const expense = Math.abs(monthRecords
          .filter(record => record.amount < 0)
          .reduce((sum, record) => sum + record.amount, 0));
        
        monthlyData.push({
          month: `${month}月`,
          income,
          expense,
          net: income - expense
        });
      }
      setMonthlyData(monthlyData);

      // 获取年度对比数据（受人物和事件筛选条件影响，但不受年份和月份筛选限制）
      const yearlyFilteredRecords = allRecords.filter(record => {
        // 人群筛选
        if (filters.relation && record.related_person !== filters.relation) {
          return false;
        }
        // 事件类型筛选
        if (filters.event && record.type !== filters.event) {
          return false;
        }
        // 不受年份和月份筛选限制
        return true;
      });
      
      const yearlyData = {};
      yearlyFilteredRecords.forEach(record => {
        if (!record.event_date) return;
        const year = new Date(record.event_date).getFullYear();
        if (!yearlyData[year]) {
          yearlyData[year] = { income: 0, expense: 0 };
        }
        if (record.amount > 0) {
          yearlyData[year].income += record.amount;
        } else {
          yearlyData[year].expense += Math.abs(record.amount);
        }
      });
      
      const yearlyArray = Object.entries(yearlyData)
        .map(([year, data]) => ({
          year: `${year}`,
          income: data.income,
          expense: data.expense
        }))
        .sort((a, b) => parseInt(a.year) - parseInt(b.year));
      setYearlyData(yearlyArray);

      // 获取人物关系分析数据（排除人群筛选条件）
      const relationFilteredRecords = allRecords.filter(record => {
        // 事件类型筛选
        if (filters.event && record.type !== filters.event) {
          return false;
        }
        // 年份筛选
        if (filters.year && record.event_date) {
          const recordYear = new Date(record.event_date).getFullYear();
          if (recordYear !== filters.year) {
            return false;
          }
        }
        // 月份筛选
        if (filters.month && record.event_date) {
          const recordMonth = new Date(record.event_date).getMonth() + 1;
          if (recordMonth !== parseInt(filters.month)) {
            return false;
          }
        }
        return true;
      });
      
      const relationStats = {};
      const relationColors = {
        'relative': '#f87171',
        'friend': '#60a5fa', 
        'colleague': '#4ade80',
        'classmate': '#a78bfa'
      };
      const relationNames = {
        'relative': '亲戚',
        'friend': '朋友',
        'colleague': '同事', 
        'classmate': '同学'
      };
      
      relationFilteredRecords.forEach(record => {
        const relation = record.related_person || 'other';
        relationStats[relation] = (relationStats[relation] || 0) + 1;
      });
      
      const relationData = Object.entries(relationStats).map(([key, value]) => ({
        name: relationNames[key] || '其他',
        value,
        color: relationColors[key] || '#94a3b8'
      }));
      setRelationData(relationData);

      // 获取事件类型统计数据（排除事件筛选条件）
      const eventFilteredRecords = allRecords.filter(record => {
        // 人群筛选
        if (filters.relation && record.related_person !== filters.relation) {
          return false;
        }
        // 年份筛选
        if (filters.year && record.event_date) {
          const recordYear = new Date(record.event_date).getFullYear();
          if (recordYear !== filters.year) {
            return false;
          }
        }
        // 月份筛选
        if (filters.month && record.event_date) {
          const recordMonth = new Date(record.event_date).getMonth() + 1;
          if (recordMonth !== parseInt(filters.month)) {
            return false;
          }
        }
        return true;
      });
      
      const eventStats = {};
      const eventNames = {
        'wedding': '结婚',
        'birth': '满月',
        'birthday': '生日',
        'graduation': '升学',
        'moving': '乔迁',
        'funeral': '白事',
        'casual': '无事酒'
      };
      
      eventFilteredRecords.forEach(record => {
        const eventType = record.type || 'other';
        if (!eventStats[eventType]) {
          eventStats[eventType] = { count: 0, amount: 0 };
        }
        eventStats[eventType].count += 1;
        eventStats[eventType].amount += Math.abs(record.amount || 0);
      });
      
      const eventData = Object.entries(eventStats).map(([key, data]) => ({
        name: eventNames[key] || '其他',
        count: data.count,
        amount: data.amount
      }));
      setEventData(eventData);

    } catch (error) {
      console.error('获取分析数据失败:', error);
      setError('获取分析数据失败');
    } finally {
      setLoading(false);
    }
  };

  const formatAmount = (amount) => {
    return Math.abs(amount || 0).toLocaleString();
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

  // 格式化日期函数
  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = now - date;
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      return '今天';
    } else if (diffDays === 1) {
      return '昨天';
    } else if (diffDays < 7) {
      return `${diffDays}天前`;
    } else if (diffDays < 30) {
      const weeks = Math.floor(diffDays / 7);
      return `${weeks}周前`;
    } else if (diffDays < 365) {
      const months = Math.floor(diffDays / 30);
      return `${months}个月前`;
    } else {
      const years = Math.floor(diffDays / 365);
      return `${years}年前`;
    }
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

  // 生成人情往来热力榜数据
  const getHeatRankingData = () => {
    if (!recentRecords || recentRecords.length === 0) return [];
    
    // 获取筛选后的记录
    const filteredRecords = recentRecords.filter(record => {
      // 人群筛选
      if (filters.relation && record.related_person !== filters.relation) {
        return false;
      }
      // 事件类型筛选
      if (filters.event && record.type !== filters.event) {
        return false;
      }
      // 年份筛选
      if (filters.year && record.event_date) {
        const recordYear = new Date(record.event_date).getFullYear();
        if (recordYear !== filters.year) {
          return false;
        }
      }
      // 月份筛选
      if (filters.month && record.event_date) {
        const recordMonth = new Date(record.event_date).getMonth() + 1;
        if (recordMonth !== parseInt(filters.month)) {
          return false;
        }
      }
      return true;
    });
    
    // 统计每个人的往来数据
    const personStats = {};
    filteredRecords.forEach(record => {
      const personName = record.description ? record.description.split(' - ')[0].trim() : '未知';
      const relation = record.related_person || 'other';
      
      if (!personStats[personName]) {
        personStats[personName] = {
          totalAmount: 0,
          count: 0,
          relation: relation,
          incomeAmount: 0,
          expenseAmount: 0
        };
      }
      
      personStats[personName].totalAmount += Math.abs(record.amount);
      personStats[personName].count += 1;
      
      if (record.amount > 0) {
        personStats[personName].incomeAmount += record.amount;
      } else {
        personStats[personName].expenseAmount += Math.abs(record.amount);
      }
    });
    
    // 转换为数组并排序（按总金额排序）
    return Object.entries(personStats)
      .map(([name, stats]) => ({
        name,
        relation: getRelationText(stats.relation),
        totalAmount: stats.totalAmount,
        count: stats.count,
        incomeAmount: stats.incomeAmount,
        expenseAmount: stats.expenseAmount,
        avgAmount: stats.totalAmount / stats.count
      }))
      .sort((a, b) => b.totalAmount - a.totalAmount)
      .slice(0, 10)
      .map((item, index) => ({ ...item, rank: index + 1 }));
  };

  // 获取AI回礼建议
  const getAIGiftSuggestions = () => {
    if (!recentRecords || recentRecords.length === 0) return null;
    
    // 创建AI分析引擎实例
    const aiAnalysisEngine = new AIAnalysisEngine();
    
    // 使用AI分析引擎分析债务管理
    const debtAnalysis = aiAnalysisEngine.analyzeDebtManagement(recentRecords);
    
    return debtAnalysis;
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const generateYearOptions = () => {
    // 从实际记录中提取年份
    const recordYears = new Set();
    recentRecords.forEach(record => {
      if (record.event_date) {
        const year = new Date(record.event_date).getFullYear();
        recordYears.add(year);
      }
    });
    
    // 转换为数组并排序（最新年份在前）
    const years = Array.from(recordYears).sort((a, b) => b - a);
    
    // 如果没有记录，返回当前年份
    if (years.length === 0) {
      years.push(new Date().getFullYear());
    }
    
    return years;
  };

  if (loading && !family) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">加载中...</div>
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
            数据档案功能需要在家庭礼金簿中使用
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 整体容器 */}
      <div className="bg-white/5 rounded-2xl border border-white/10 p-8 shadow-2xl">
        {/* 大标题 */}
        <div className="mb-8">
          <div className="flex items-center space-x-4 mb-3">
            <div className="w-1 h-12 bg-gradient-to-b from-blue-400 to-purple-500 rounded-full"></div>
            <div>
              <h1 className="text-3xl font-bold text-white tracking-wide">数据档案</h1>
              <div className="h-0.5 w-20 bg-gradient-to-r from-blue-400 to-purple-500 mt-2 rounded-full"></div>
            </div>
          </div>
          <p className="text-white/70 text-base ml-8 font-medium">深度分析人情往来，智能预测回礼时机</p>
        </div>

        {error && (
          <Alert className="border-red-400/30 bg-red-500/10">
            <AlertDescription className="text-red-300">
              {error}
            </AlertDescription>
          </Alert>
        )}

        {/* 数据概览 */}
        {overview && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
            <Card className="bg-blue-500/20 border border-blue-400/30 shadow-lg hover:bg-blue-500/30 transition-all duration-300">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-blue-100/80 text-sm font-medium">总记录数</p>
                    <p className="text-2xl font-bold text-blue-50 mt-1">{overview.total_records || 0}</p>
                  </div>
                  <div className="p-3 bg-blue-500/20 rounded-full">
                    <FileText className="w-6 h-6 text-blue-300" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-green-500/20 border border-green-400/30 shadow-lg hover:bg-green-500/30 transition-all duration-300">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-green-100/80 text-sm font-medium">总收入</p>
                    <p className="text-2xl font-bold text-green-50 mt-1">¥{formatAmount(overview.total_income)}</p>
                  </div>
                  <div className="p-3 bg-green-500/20 rounded-full">
                    <TrendingUp className="w-6 h-6 text-green-300" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-red-500/20 border border-red-400/30 shadow-lg hover:bg-red-500/30 transition-all duration-300">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-red-100/80 text-sm font-medium">总支出</p>
                    <p className="text-2xl font-bold text-red-50 mt-1">¥{formatAmount(overview.total_expense)}</p>
                  </div>
                  <div className="p-3 bg-red-500/20 rounded-full">
                    <TrendingDown className="w-6 h-6 text-red-300" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-purple-500/20 border border-purple-400/30 shadow-lg hover:bg-purple-500/30 transition-all duration-300">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-purple-100/80 text-sm font-medium">总净收支</p>
                    <p className="text-2xl font-bold text-purple-50 mt-1">
                      {(overview.net_income || 0) < 0 ? '-' : ''}¥{formatAmount(overview.net_income)}
                    </p>
                  </div>
                  <div className="p-3 bg-purple-500/20 rounded-full">
                    <Wallet className="w-6 h-6 text-purple-300" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-orange-500/20 border border-orange-400/30 shadow-lg hover:bg-orange-500/30 transition-all duration-300">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-orange-100/80 text-sm font-medium">家庭成员数</p>
                    <p className="text-2xl font-bold text-orange-50 mt-1">{family?.members?.length || 0}</p>
                  </div>
                  <div className="p-3 bg-orange-500/20 rounded-full">
                    <Users className="w-6 h-6 text-orange-300" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* 数据分析综合面板 */}
        <Card className="mb-6 bg-gradient-to-br from-blue-500/10 via-purple-500/10 to-indigo-500/10 border border-blue-400/30 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-white">
              <Filter className="w-5 h-5 text-blue-400" />
              <span>数据分析综合面板</span>
            </CardTitle>
            <div className="text-sm text-white/60">
              筛选条件和分析图表的综合展示面板
            </div>
          </CardHeader>
          <CardContent>
            {/* 筛选条件区域 */}
            <div className="mb-6 p-4 bg-white/5 border border-white/10 rounded-lg">
              <div className="flex items-center space-x-2 mb-3">
                <Filter className="w-4 h-4 text-blue-400" />
                <span className="text-sm font-medium text-white">筛选条件</span>
              </div>
              <div className="flex flex-wrap items-center justify-between gap-3">
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
                    onChange={(e) => handleFilterChange('year', e.target.value ? parseInt(e.target.value) : '')}
                    className="px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-sm text-white focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                    title="仅显示有记录数据的年份"
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
                </div>
                <div className="text-sm text-white/60 hidden lg:block">
                  年份选项仅显示有数据记录的年份，系统默认选择当前年份
                </div>
              </div>
            </div>

            {/* 分析图表区域 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 月度趋势分析 */}
          <Card 
            className="bg-white/10 border border-white/20 shadow-lg hover:bg-white/15 hover:border-white/30 transition-all duration-500 hover:shadow-2xl hover:shadow-blue-500/20 hover:scale-105 group animate-fade-in"
            onMouseEnter={() => {
              if (!isMonthlyCardHovered) {
                setMonthlyChartKey(prev => prev + 1);
                setIsMonthlyCardHovered(true);
              }
            }}
            onMouseLeave={() => setIsMonthlyCardHovered(false)}
          >
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 text-blue-300">
                <BarChart3 className="w-5 h-5 text-blue-400" />
                <span>月度趋势分析</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-2">
              {!filters.year ? (
                <div className="flex flex-col items-center justify-center h-[250px] text-white/50">
                  <BarChart3 className="w-16 h-16 mb-4 text-white/30" />
                  <p className="text-lg font-medium mb-2">请选择年份</p>
                  <p className="text-sm text-center">月度趋势分析需要选择年份<br />请在上方筛选条件中选择年份</p>
                </div>
              ) : monthlyData && monthlyData.some(item => item.income > 0 || item.expense > 0) ? (
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart 
                    key={monthlyChartKey}
                    data={monthlyData}
                    className="transition-all duration-500"
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                    <XAxis 
                      dataKey="month" 
                      stroke="rgba(255,255,255,0.7)"
                      fontSize={10}
                      tickLine={true}
                      axisLine={true}
                    />
                    <YAxis stroke="rgba(255,255,255,0.7)" />
                    <Tooltip 
                      contentStyle={{
                        backgroundColor: 'rgba(0,0,0,0.9)', 
                        border: '1px solid rgba(255,255,255,0.2)', 
                        borderRadius: '6px', 
                        color: 'white',
                        boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
                        backdropFilter: 'blur(10px)',
                        padding: '4px 6px',
                        fontSize: '11px',
                        lineHeight: '1.1',
                        minWidth: 'auto'
                      }}
                    />
                    <Legend />
                    <Line type="monotone" dataKey="income" stroke="#10b981" strokeWidth={3} dot={{ fill: '#10b981', strokeWidth: 2, r: 4 }} name="收入" />
                    <Line type="monotone" dataKey="expense" stroke="#ef4444" strokeWidth={3} dot={{ fill: '#ef4444', strokeWidth: 2, r: 4 }} name="支出" />
                    <Line type="monotone" dataKey="net" stroke="#3b82f6" strokeWidth={3} dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }} name="净收支" />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex flex-col items-center justify-center h-[250px] text-white/50">
                  <BarChart3 className="w-16 h-16 mb-4 text-white/30" />
                  <p className="text-lg font-medium mb-2">暂无数据</p>
                  <p className="text-sm text-center">当前没有任何记录数据<br />请先添加一些人情记录</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* 年度对比分析 */}
          <Card 
            className="bg-white/10 border border-white/20 shadow-lg hover:bg-white/15 hover:border-white/30 transition-all duration-500 hover:shadow-2xl hover:shadow-emerald-500/20 hover:scale-105 group animate-fade-in"
            onMouseEnter={() => {
              if (!isYearlyCardHovered) {
                setYearlyChartKey(prev => prev + 1);
                setIsYearlyCardHovered(true);
              }
            }}
            onMouseLeave={() => setIsYearlyCardHovered(false)}
          >
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 text-emerald-300">
                <BarChart3 className="w-5 h-5 text-emerald-400" />
                <span>年度对比分析</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-2">
              {yearlyData && yearlyData.length > 0 ? (
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart 
                    key={yearlyChartKey}
                    data={yearlyData}
                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                    className="transition-all duration-500"
                  >
                    <CartesianGrid 
                      strokeDasharray="3 3" 
                      stroke="rgba(255,255,255,0.1)" 
                      opacity={0.6}
                    />
                    <XAxis 
                      dataKey="year" 
                      stroke="rgba(255,255,255,0.7)"
                      fontSize={12}
                      tickLine={true}
                      axisLine={true}
                    />
                    <YAxis 
                      stroke="rgba(255,255,255,0.7)"
                      fontSize={12}
                      tickLine={true}
                      axisLine={true}
                      tickFormatter={(value) => `¥${value.toLocaleString()}`}
                    />
                    <Tooltip 
                      contentStyle={{
                        backgroundColor: 'rgba(0,0,0,0.9)', 
                        border: '1px solid rgba(255,255,255,0.2)', 
                        borderRadius: '6px', 
                        color: 'white',
                        boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
                        backdropFilter: 'blur(10px)',
                        padding: '4px 6px',
                        fontSize: '11px',
                        lineHeight: '1.1',
                        minWidth: 'auto'
                      }}
                      labelStyle={{ display: 'none' }}
                      content={({ active, payload, label }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0];
                        const isIncome = data.dataKey === 'income';
                        const typeColor = isIncome ? '#22c55e' : '#ef4444';
                        const typeName = isIncome ? '收入' : '支出';
                        
                        return (
                          <div style={{
                            backgroundColor: 'rgba(0,0,0,0.9)',
                            border: '1px solid rgba(255,255,255,0.2)',
                            borderRadius: '6px',
                            padding: '4px 6px',
                            fontSize: '11px',
                            lineHeight: '1.1',
                            minWidth: 'auto'
                          }}>
                            <div style={{
                               display: 'flex',
                               justifyContent: 'center',
                               alignItems: 'center',
                               marginBottom: '4px'
                             }}>
                               <span style={{ color: typeColor, fontWeight: 'bold' }}>
                                 {typeName}¥{data.value.toLocaleString()}
                               </span>
                             </div>
                            <div style={{
                              textAlign: 'center',
                              color: '#60a5fa',
                              fontSize: '11px'
                            }}>
                              {data.payload.year}年
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }}
                    cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                    shared={false}
                  />
                  <Legend 
                    wrapperStyle={{ paddingTop: '10px', color: 'white' }}
                    iconType="rect"
                    formatter={(value) => value === 'income' ? '收入' : '支出'}
                  />
                  <Bar 
                    dataKey="income" 
                    fill="url(#incomeGradient)" 
                    name="income"
                    radius={[4, 4, 0, 0]}
                    animationBegin={0}
                    animationDuration={1500}
                    animationEasing="ease-out"
                    className="hover:opacity-80 transition-opacity duration-200"
                  >
                    {yearlyData.map((entry, index) => (
                      <Cell 
                        key={`income-cell-${index}`} 
                        fill="url(#incomeGradient)"
                        style={{ cursor: 'pointer' }}
                      />
                    ))}
                    <LabelList 
                      dataKey="income" 
                      position="top" 
                      fill="#10b981" 
                      fontSize={11}
                      fontWeight="bold"
                      formatter={(value) => value.toLocaleString()}
                    />
                  </Bar>
                  <Bar 
                    dataKey="expense" 
                    fill="url(#expenseGradient)" 
                    name="expense"
                    radius={[4, 4, 0, 0]}
                    animationBegin={300}
                    animationDuration={1500}
                    animationEasing="ease-out"
                    className="hover:opacity-80 transition-opacity duration-200"
                  >
                    {yearlyData.map((entry, index) => (
                      <Cell 
                        key={`expense-cell-${index}`} 
                        fill="url(#expenseGradient)"
                        style={{ cursor: 'pointer' }}
                      />
                    ))}
                    <LabelList 
                      dataKey="expense" 
                      position="top" 
                      fill="#ef4444" 
                      fontSize={11}
                      fontWeight="bold"
                      formatter={(value) => value.toLocaleString()}
                    />
                  </Bar>
                  <defs>
                    <linearGradient id="incomeGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#10b981" stopOpacity={0.9}/>
                      <stop offset="100%" stopColor="#059669" stopOpacity={0.7}/>
                    </linearGradient>
                    <linearGradient id="expenseGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#ef4444" stopOpacity={0.9}/>
                      <stop offset="100%" stopColor="#dc2626" stopOpacity={0.7}/>
                    </linearGradient>
                  </defs>
                </BarChart>
               </ResponsiveContainer>
               ) : (
                 <div className="flex flex-col items-center justify-center h-[250px] text-white/50">
                   <BarChart3 className="w-12 h-12 mb-3 text-white/30" />
                   <p className="text-lg font-medium mb-1">暂无数据</p>
                   <p className="text-sm text-white/40">请先记录人情往来数据</p>
                 </div>
               )}
             </CardContent>
          </Card>

          {/* 人物关系分析 */}
          <Card 
            className="bg-white/10 border border-white/20 shadow-lg hover:bg-white/15 hover:border-white/30 transition-all duration-500 hover:shadow-2xl hover:shadow-green-500/20 hover:scale-105 group animate-fade-in"
            onMouseEnter={() => {
              if (!isRelationCardHovered) {
                setRelationChartKey(prev => prev + 1);
                setIsRelationCardHovered(true);
              }
            }}
            onMouseLeave={() => setIsRelationCardHovered(false)}
          >
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 text-orange-300">
                <PieChartIcon className="w-5 h-5 text-orange-400" />
                <span>人物关系分析</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-2">
              {filters.relation ? (
                <div className="flex flex-col items-center justify-center h-[250px] text-white/50">
                  <PieChartIcon className="w-16 h-16 mb-4 text-white/30" />
                  <p className="text-lg font-medium mb-2">已选择人群</p>
                  <p className="text-sm text-center">当前图表不予统计<br />请清除人群筛选条件查看完整分析</p>
                </div>
              ) : (filters.month && !filters.year) ? (
                <div className="flex flex-col items-center justify-center h-[250px] text-white/50">
                  <PieChartIcon className="w-16 h-16 mb-4 text-white/30" />
                  <p className="text-lg font-medium mb-2">筛选条件不完整</p>
                  <p className="text-sm text-center">选择了月份还需要选择年份<br />才能进行人物关系分析</p>
                </div>
              ) : relationData && relationData.length > 0 ? (
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart key={relationChartKey}>
                  <Pie
                    data={relationData}
                    cx="50%"
                    cy="50%"
                    startAngle={90}
                    endAngle={450}
                    labelLine={true}
                    label={({ name, value, percent, cx, cy, midAngle, innerRadius, outerRadius, fill }) => {
                      const RADIAN = Math.PI / 180;
                      const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
                      const x = cx + radius * Math.cos(-midAngle * RADIAN);
                      const y = cy + radius * Math.sin(-midAngle * RADIAN);
                      const sin = Math.sin(-midAngle * RADIAN);
                      const cos = Math.cos(-midAngle * RADIAN);
                      const sx = cx + (outerRadius + 8) * cos;
                      const sy = cy + (outerRadius + 8) * sin;
                      const mx = cx + (outerRadius + 20) * cos;
                      const my = cy + (outerRadius + 20) * sin;
                      const ex = mx + (cos >= 0 ? 1 : -1) * 15;
                      const ey = my;
                      const textAnchor = cos >= 0 ? 'start' : 'end';

                      return (
                        <g>
                          <path d={`M${sx},${sy}L${mx},${my}L${ex},${ey}`} stroke={fill} fill="none" strokeWidth={1}/>
                          <circle cx={ex} cy={ey} r={2} fill={fill} stroke="none"/>
                          <text 
                            x={ex + (cos >= 0 ? 1 : -1) * 12} 
                            y={ey} 
                            textAnchor={textAnchor} 
                            fill={fill} 
                            fontSize={12}
                            fontWeight="bold"
                          >
                            {`${name}`}
                          </text>
                          <text 
                            x={ex + (cos >= 0 ? 1 : -1) * 12} 
                            y={ey + 14} 
                            textAnchor={textAnchor} 
                            fill="rgba(255,255,255,0.7)" 
                            fontSize={10}
                          >
                            {`${value}人(${(percent * 100).toFixed(0)}%)`}
                          </text>
                        </g>
                      );
                    }}
                    outerRadius={80}
                     innerRadius={35}
                     fill="#8884d8"
                     dataKey="value"
                     stroke="none"
                     strokeWidth={0}
                     paddingAngle={0}
                    animationBegin={0}
                    animationDuration={1200}
                    animationEasing="ease-in-out"
                  >
                    {relationData.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={entry.color}
                        style={{
                           cursor: 'pointer',
                           transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                           transformOrigin: 'center'
                         }}
                         onMouseEnter={(e) => {
                           e.target.style.transform = 'scale(1.05)';
                           e.target.style.filter = 'brightness(1.1)';
                         }}
                         onMouseLeave={(e) => {
                           e.target.style.transform = 'scale(1)';
                           e.target.style.filter = 'brightness(1)';
                         }}
                      />
                    ))}

                  </Pie>
                  <Legend 
                    verticalAlign="bottom" 
                    height={36}
                    iconType="circle"
                    wrapperStyle={{
                      paddingTop: '0px',
                      fontSize: '12px',
                      color: 'rgba(255,255,255,0.8)'
                    }}
                  />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: 'rgba(0,0,0,0.9)', 
                      border: '1px solid rgba(255,255,255,0.2)', 
                      borderRadius: '6px', 
                      color: 'white',
                      boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
                      backdropFilter: 'blur(10px)',
                      padding: '4px 6px',
                      fontSize: '11px',
                      lineHeight: '1.1',
                      minWidth: 'auto'
                    }}
                    content={({ active, payload, label }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0];
                        const chartColor = data.payload.color; // 获取图表板块颜色
                        return (
                          <div style={{
                            backgroundColor: 'rgba(0,0,0,0.9)',
                            border: '1px solid rgba(255,255,255,0.2)',
                            borderRadius: '6px',
                            padding: '4px 6px',
                            fontSize: '11px',
                            lineHeight: '1.1',
                            minWidth: 'auto'
                          }}>
                            <div style={{
                               display: 'flex',
                               justifyContent: 'center',
                               alignItems: 'center',
                               marginBottom: '4px'
                             }}>
                               <span style={{ color: chartColor, fontWeight: 'bold' }}>
                                 {data.name} {data.value}人
                               </span>
                             </div>
                            <div style={{
                               textAlign: 'center',
                               color: '#fdba74',
                               fontSize: '11px'
                             }}>
                               人物关系
                             </div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                </PieChart>
               </ResponsiveContainer>
               ) : (
                 <div className="flex flex-col items-center justify-center h-[250px] text-white/50">
                   <PieChartIcon className="w-12 h-12 mb-3 text-white/30" />
                   <p className="text-lg font-medium mb-1">暂无数据</p>
                   <p className="text-sm text-white/40">请先记录人情往来数据</p>
                 </div>
               )}
             </CardContent>
          </Card>

          {/* 事件类型统计 */}
          <Card 
            className="bg-white/10 border border-white/20 shadow-lg hover:bg-white/15 hover:border-white/30 transition-all duration-500 hover:shadow-2xl hover:shadow-purple-500/20 hover:scale-105 group animate-fade-in"
            onMouseEnter={() => {
              if (!isEventCardHovered) {
                setEventChartKey(prev => prev + 1);
                setIsEventCardHovered(true);
              }
            }}
            onMouseLeave={() => setIsEventCardHovered(false)}
          >
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 text-purple-300">
                <Target className="w-5 h-5 text-purple-400" />
                <span>事件类型统计</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {filters.event ? (
                <div className="flex flex-col items-center justify-center h-[300px] text-white/50">
                  <Target className="w-16 h-16 mb-4 text-white/30" />
                  <p className="text-lg font-medium mb-2">已选择事件</p>
                  <p className="text-sm text-center">当前图表不予统计<br />请清除事件筛选条件查看完整分析</p>
                </div>
              ) : (filters.month && !filters.year) ? (
                <div className="flex flex-col items-center justify-center h-[300px] text-white/50">
                  <Target className="w-16 h-16 mb-4 text-white/30" />
                  <p className="text-lg font-medium mb-2">筛选条件不完整</p>
                  <p className="text-sm text-center">选择了月份还需要选择年份<br />才能进行事件类型统计</p>
                </div>
              ) : eventData && eventData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart key={eventChartKey}>
                  <Pie
                    data={eventData}
                    cx="50%"
                    cy="50%"
                    labelLine={true}
                    label={({ name, value, percent, cx, cy, midAngle, innerRadius, outerRadius, fill }) => {
                      const RADIAN = Math.PI / 180;
                      const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
                      const x = cx + radius * Math.cos(-midAngle * RADIAN);
                      const y = cy + radius * Math.sin(-midAngle * RADIAN);
                      const sin = Math.sin(-midAngle * RADIAN);
                      const cos = Math.cos(-midAngle * RADIAN);
                      const sx = cx + (outerRadius + 8) * cos;
                      const sy = cy + (outerRadius + 8) * sin;
                      const mx = cx + (outerRadius + 20) * cos;
                      const my = cy + (outerRadius + 20) * sin;
                      const ex = mx + (cos >= 0 ? 1 : -1) * 15;
                      const ey = my;
                      const textAnchor = cos >= 0 ? 'start' : 'end';

                      return (
                        <g>
                          <path d={`M${sx},${sy}L${mx},${my}L${ex},${ey}`} stroke={fill} fill="none" strokeWidth={1}/>
                          <circle cx={ex} cy={ey} r={2} fill={fill} stroke="none"/>
                          <text 
                            x={ex + (cos >= 0 ? 1 : -1) * 12} 
                            y={ey} 
                            textAnchor={textAnchor} 
                            fill={fill} 
                            fontSize={12}
                            fontWeight="bold"
                          >
                            {`${name}`}
                          </text>
                          <text 
                            x={ex + (cos >= 0 ? 1 : -1) * 12} 
                            y={ey + 14} 
                            textAnchor={textAnchor} 
                            fill="rgba(255,255,255,0.7)" 
                            fontSize={10}
                          >
                            {`${value}次(${(percent * 100).toFixed(0)}%)`}
                          </text>
                        </g>
                      );
                    }}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="count"
                    animationBegin={0}
                    animationDuration={1200}
                    animationEasing="ease-in-out"
                  >
                    {eventData.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={COLORS[index % COLORS.length]}
                        style={{
                          cursor: 'pointer',
                          transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                          transformOrigin: 'center'
                        }}
                        onMouseEnter={(e) => {
                          e.target.style.transform = 'scale(1.05)';
                          e.target.style.filter = 'brightness(1.2)';
                        }}
                        onMouseLeave={(e) => {
                          e.target.style.transform = 'scale(1)';
                          e.target.style.filter = 'brightness(1)';
                        }}
                      />
                    ))}
                  </Pie>
                  <Legend 
                    verticalAlign="bottom" 
                    height={36}
                    iconType="circle"
                    wrapperStyle={{
                      paddingTop: '0px',
                      fontSize: '12px',
                      color: 'rgba(255,255,255,0.8)'
                    }}
                  />
                  <Tooltip 
                    content={({ active, payload, label }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0];
                        // 获取当前板块的颜色
                        const sliceColor = data.payload.fill || COLORS[eventData.findIndex(item => item.name === data.name) % COLORS.length];
                        return (
                          <div style={{
                            backgroundColor: 'rgba(0,0,0,0.9)',
                            border: '1px solid rgba(255,255,255,0.2)',
                            borderRadius: '6px',
                            padding: '4px 6px',
                            fontSize: '11px',
                            lineHeight: '1.1',
                            minWidth: 'auto'
                          }}>
                            <div style={{
                               display: 'flex',
                               justifyContent: 'center',
                               alignItems: 'center',
                               marginBottom: '4px'
                             }}>
                               <span style={{ color: sliceColor, fontWeight: 'bold' }}>
                                 {data.name}{data.value}次
                               </span>
                             </div>
                            <div style={{
                              textAlign: 'center',
                              color: '#60a5fa',
                              fontSize: '11px'
                            }}>
                              事件类型
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }}
                    cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                    shared={false}
                  />
                </PieChart>
               </ResponsiveContainer>
               ) : (
                 <div className="flex flex-col items-center justify-center h-[300px] text-white/50">
                   <Target className="w-12 h-12 mb-3 text-white/30" />
                   <p className="text-lg font-medium mb-1">暂无数据</p>
                   <p className="text-sm text-white/40">请先记录人情往来数据</p>
                 </div>
               )}
             </CardContent>
          </Card>
            </div>
          </CardContent>
        </Card>

        {/* 实时网速监控卡片 */}
        <NetworkSpeedCard />

        {/* 人情往来分析大卡片 */}
        <Card className="mb-6 bg-gradient-to-r from-orange-500/10 via-purple-500/10 to-blue-500/10 border border-white/20 shadow-lg h-[450px] flex flex-col">
          <CardHeader className="flex-shrink-0 pb-3">
            <CardTitle className="flex items-center space-x-2 text-white text-base">
              <div className="flex items-center space-x-1">
                <Trophy className="w-4 h-4 text-yellow-400" />
                <Bot className="w-4 h-4 text-blue-400" />
              </div>
              <span>人情往来智能分析</span>
            </CardTitle>
            <p className="text-xs text-white/60">热力榜排名与AI回礼建议 · 可滑动查看</p>
          </CardHeader>
          <CardContent className="flex-1 overflow-hidden pt-0 pb-2 -mt-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 h-full overflow-y-auto scrollbar-hide">
              {/* 人情往来热力榜 */}
              <div className="bg-orange-500/10 border border-orange-400/30 rounded-lg p-3 h-full overflow-y-auto scrollbar-hide">
                <div className="flex items-center space-x-2 mb-0.5">
                  <Trophy className="w-4 h-4 text-yellow-400" />
                  <h3 className="text-white font-medium text-sm">人情往来热力榜</h3>
                </div>
                <p className="text-xs text-white/60 mb-1">基于往来金额和频次的排名</p>
                {(() => {
                  const heatRankingData = getHeatRankingData();
                  return heatRankingData.length > 0 ? (
                    <div className="space-y-2">
                      {heatRankingData.map((person) => (
                        <div key={person.name} className="flex items-center justify-between p-2 bg-white/5 rounded-lg border border-white/10 hover:bg-white/10 transition-all duration-300">
                          <div className="flex items-center space-x-2">
                            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                              person.rank === 1 ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-400/30' :
                              person.rank === 2 ? 'bg-gray-400/20 text-gray-300 border border-gray-400/30' :
                              person.rank === 3 ? 'bg-orange-500/20 text-orange-400 border border-orange-400/30' :
                              'bg-white/10 text-white/70 border border-white/20'
                            }`}>
                              {person.rank}
                            </div>
                            <div>
                              <div className="font-medium text-white text-sm">{person.name}</div>
                              <div className="text-xs text-white/60">{person.relation} · {person.count}笔往来</div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-bold text-white text-sm">¥{formatAmount(person.totalAmount)}</div>
                            <div className="text-xs text-white/60">平均¥{formatAmount(person.avgAmount)}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-6 text-white/50">
                      <Trophy className="w-10 h-10 mx-auto mb-2 text-white/30" />
                      <p className="text-sm">暂无数据</p>
                      <p className="text-xs">当前筛选条件下无人情往来记录</p>
                    </div>
                  );
                })()
                }
              </div>

              {/* AI回礼助手 */}
              <div className="bg-purple-500/10 border border-purple-400/30 rounded-lg p-3 h-full overflow-y-auto scrollbar-hide">
                <div className="flex items-center space-x-2 mb-0.5">
                  <Bot className="w-4 h-4 text-blue-400" />
                  <h3 className="text-white font-medium text-sm">AI回礼助手</h3>
                </div>
                <p className="text-xs text-white/60 mb-1">基于历史数据分析，为您提供回礼时机和金额建议</p>
                {(() => {
                  const aiSuggestions = getAIGiftSuggestions();
                  
                  if (!aiSuggestions) {
                    return (
                      <div className="text-center py-6 text-white/50">
                        <Bot className="w-10 h-10 mx-auto mb-2 text-white/30" />
                        <p className="text-sm">暂无回礼建议</p>
                        <p className="text-xs">当有人情记录时，AI将为您智能建议</p>
                      </div>
                    );
                  }
                  
                  // 如果没有债务和债权，显示平衡状态
                  if (!aiSuggestions.hasDebts && !aiSuggestions.hasCredits) {
                    return (
                      <div className="space-y-3">
                        {/* 总体分析 */}
                        <div className="bg-blue-500/20 rounded-lg p-3 border border-blue-400/30">
                          <div className="flex items-start space-x-2">
                            <Bot className="w-4 h-4 text-blue-400 mt-0.5" />
                            <div className="flex-1">
                              <h4 className="text-white font-medium mb-1 text-sm">AI分析总结</h4>
                              <p className="text-blue-200 text-xs mb-1">{aiSuggestions.summary}</p>
                              <p className="text-blue-300 text-xs">{aiSuggestions.aiAdvice}</p>
                            </div>
                          </div>
                        </div>
                        
                        {/* 行动建议 */}
                        <div className="bg-purple-500/20 rounded-lg p-3 border border-purple-400/30">
                          <h4 className="text-purple-300 font-medium mb-2 flex items-center text-sm">
                            <Target className="w-3 h-3 mr-1" />
                            行动建议
                          </h4>
                          <p className="text-purple-200 text-xs">{aiSuggestions.urgentActions}</p>
                        </div>
                      </div>
                    );
                  }
                  
                  return (
                    <div className="space-y-3">
                      {/* 总体分析 */}
                      <div className="bg-blue-500/20 rounded-lg p-3 border border-blue-400/30">
                        <div className="flex items-start space-x-2">
                          <Bot className="w-4 h-4 text-blue-400 mt-0.5" />
                          <div className="flex-1">
                            <h4 className="text-white font-medium mb-1 text-sm">AI分析总结</h4>
                            <p className="text-blue-200 text-xs mb-1">{aiSuggestions.summary}</p>
                            <p className="text-blue-300 text-xs">{aiSuggestions.aiAdvice}</p>
                          </div>
                        </div>
                      </div>
                      
                      {/* 待还人情 */}
                      {aiSuggestions.hasDebts && aiSuggestions.pendingDebts.length > 0 && (
                        <div className="bg-red-500/20 rounded-lg p-3 border border-red-400/30">
                          <h4 className="text-red-300 font-medium mb-2 flex items-center text-sm">
                            <CreditCard className="w-3 h-3 mr-1" />
                            待还人情 ({aiSuggestions.pendingDebts.length}笔)
                          </h4>
                          <div className="space-y-2">
                            {aiSuggestions.pendingDebts.slice(0, 3).map((debt, index) => (
                              <div key={index} className="flex items-center justify-between bg-red-900/30 rounded p-1.5">
                                <div className="flex-1">
                                  <div className="text-white text-xs font-medium">{debt.person}</div>
                                  <div className="text-red-200 text-xs">
                                    {debt.lastEvent && `最后往来：${getTypeText(debt.lastEvent.event)} · ${formatDate(debt.lastEvent.date)}`}
                                  </div>
                                </div>
                                <div className="text-right">
                                  <div className="text-red-300 font-medium text-xs">¥{formatAmount(debt.amount)}</div>
                                  {debt.amount > 500 && (
                                    <Badge variant="destructive" className="text-xs px-1 py-0">优先</Badge>
                                  )}
                                </div>
                              </div>
                            ))}
                            {aiSuggestions.pendingDebts.length > 3 && (
                              <div className="text-center text-red-300/60 text-xs">
                                还有 {aiSuggestions.pendingDebts.length - 3} 笔待还人情...
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                      
                      {/* 待收回礼 */}
                      {aiSuggestions.hasCredits && aiSuggestions.expectedReturns.length > 0 && (
                        <div className="bg-green-500/20 rounded-lg p-3 border border-green-400/30">
                          <h4 className="text-green-300 font-medium mb-2 flex items-center text-sm">
                            <PiggyBank className="w-3 h-3 mr-1" />
                            待收回礼 ({aiSuggestions.expectedReturns.length}笔)
                          </h4>
                          <div className="space-y-2">
                            {aiSuggestions.expectedReturns.slice(0, 3).map((credit, index) => (
                              <div key={index} className="flex items-center justify-between bg-green-900/30 rounded p-1.5">
                                <div className="flex-1">
                                  <div className="text-white text-xs font-medium">{credit.person}</div>
                                  <div className="text-green-200 text-xs">
                                    {credit.lastEvent && `最后往来：${getTypeText(credit.lastEvent.event)} · ${formatDate(credit.lastEvent.date)}`}
                                  </div>
                                </div>
                                <div className="text-green-300 font-medium text-xs">¥{formatAmount(credit.amount)}</div>
                              </div>
                            ))}
                            {aiSuggestions.expectedReturns.length > 3 && (
                              <div className="text-center text-green-300/60 text-xs">
                                还有 {aiSuggestions.expectedReturns.length - 3} 笔待收回礼...
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                      
                      {/* 行动建议 */}
                      <div className="bg-purple-500/20 rounded-lg p-3 border border-purple-400/30">
                        <h4 className="text-purple-300 font-medium mb-2 flex items-center text-sm">
                          <Target className="w-3 h-3 mr-1" />
                          行动建议
                        </h4>
                        <p className="text-purple-200 text-xs">{aiSuggestions.urgentActions}</p>
                      </div>
                    </div>
                  );
                })()
                }
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 最近记录 */}
        <Card className="bg-green-500/10 border border-green-400/30 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center justify-between text-white">
              <div className="flex items-center space-x-2">
                <Activity className="w-5 h-5 text-white/70" />
                <span>最近记录</span>
                <span className="text-xs text-white/60">(最新时间创建的前5条)</span>
              </div>
              <Button 
                size="sm" 
                variant="outline" 
                className="bg-white/10 border-white/20 text-white hover:bg-white/20"
                onClick={() => navigate('/all-records')}
              >
                <Eye className="w-4 h-4 mr-1" />
                查看全部
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {recentRecords.length > 0 ? (
              <div className="space-y-2">
                {recentRecords.map((record) => (
                  <div key={record.id} className="group bg-white/[0.03] rounded-xl p-3 transition-all duration-300 border border-white/20 shadow-lg hover:bg-gradient-to-br hover:from-blue-500/10 hover:to-purple-500/10 hover:border-white/30 hover:shadow-xl hover:shadow-blue-500/20 hover:scale-[1.02] transform">
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
              <div className="text-center py-8 text-white/50">
                暂无记录数据
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Archive;

