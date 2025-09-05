import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { 
  Brain, 
  TrendingDown, 
  TrendingUp, 
  AlertTriangle, 
  BarChart3, 
  Users, 
  Calendar, 
  Activity,
  RefreshCw,
  ChevronRight,
  Lightbulb,
  Wallet,
  Sparkles
} from 'lucide-react';
import AIAnalysisEngine from '../utils/aiAnalysisEngine';

const SmartInsightsCard = ({ familyId, records, analytics, members }) => {
  const [insights, setInsights] = useState([]);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [expandedInsight, setExpandedInsight] = useState(null);
  const [isAtBottom, setIsAtBottom] = useState(false);
  const [showContinueHint, setShowContinueHint] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [scrollStart, setScrollStart] = useState(0);
  const [activeCategory, setActiveCategory] = useState('all');
  
  const contentRef = useRef(null);
  const aiEngine = new AIAnalysisEngine();

  // 洞察分类定义
  const insightCategories = {
    all: { label: '全部', icon: Brain, color: 'purple' },
    financial: { label: '收支', icon: Wallet, color: 'green' },
    social: { label: '人情', icon: Users, color: 'blue' },
    consumption: { label: '消费', icon: BarChart3, color: 'orange' },
    activity: { label: '活跃度', icon: Activity, color: 'pink' }
  };

  // 洞察类型到分类的映射
  const insightTypeToCategory = {
    spending: 'financial',
    income: 'financial', 
    balance: 'financial',
    debt_management: 'financial',
    relationship: 'social',
    social_health: 'social',
    eventType: 'consumption',
    consumption_habits: 'consumption',
    holiday_prediction: 'consumption',
    activity: 'activity',
    quarterly_comparison: 'financial'
  };

  // 根据分类过滤洞察数据
  const getFilteredInsights = () => {
    if (activeCategory === 'all') {
      return insights;
    }
    return insights.filter(insight => 
      insightTypeToCategory[insight.type] === activeCategory
    );
  };

  // 移除彩蛋点击处理函数



  // 滚动监听处理
  const handleScroll = (e) => {
    const { scrollTop, scrollHeight, clientHeight } = e.target;
    const isBottom = scrollTop + clientHeight >= scrollHeight - 10;
    setIsAtBottom(isBottom);
    
    // 滑到底部时直接显示"已经到底了"提示
    if (isBottom && !showContinueHint) {
      setShowContinueHint(true);
    }
  };

  // 鼠标拖拽滚动处理
  const handleMouseDown = (e) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
    setScrollStart(contentRef.current.scrollTop);
    e.preventDefault();
  };

  const handleMouseMove = (e) => {
    if (!isDragging || !contentRef.current) return;
    
    const deltaY = e.clientY - dragStart.y;
    const newScrollTop = scrollStart - deltaY;
    const element = contentRef.current;
    const { scrollHeight, clientHeight } = element;
    
    // 检测过度滚动
    if (newScrollTop < 0) {
      // 向上过度滚动
      setPullDistance(Math.abs(newScrollTop));
    } else if (newScrollTop > scrollHeight - clientHeight) {
      // 向下过度滚动 - 彩蛋触发区域
      const overScroll = newScrollTop - (scrollHeight - clientHeight);
      setPullDistance(overScroll);
      
      if (overScroll > 50) {
        // 显示底部提示
        if (!showContinueHint) {
          setShowContinueHint(true);
        }
      }
    } else {
      setPullDistance(0);
    }
    
    contentRef.current.scrollTop = Math.max(0, newScrollTop);
    e.preventDefault();
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // 添加全局鼠标事件监听
  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'grabbing';
      document.body.style.userSelect = 'none';
    } else {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isDragging, dragStart, scrollStart]);
  

  


  // 中文映射
  const getChineseText = {
    // 关系多样性映射
    relationshipDiversity: {
      'diverse': '丰富多样',
      'focused': '相对集中',
      'limited': '相对有限'
    },
    // 支出趋势映射
    spendingTrend: {
      'increasing': '上升趋势',
      'stable': '稳定趋势',
      'decreasing': '下降趋势'
    }
  };

  // 图标映射
  const iconMap = {
    TrendingDown,
    TrendingUp,
    AlertTriangle,
    BarChart3,
    Users,
    Calendar,
    Activity,
    Lightbulb,
    Wallet
  };

  // 优先级颜色映射
  const priorityColors = {
    high: 'text-red-400 bg-red-500/15 border-red-500/30',
    medium: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20',
    low: 'text-green-400 bg-green-500/10 border-green-500/20'
  };

  // 获取优先级标签
  const getPriorityLabel = (priority) => {
    const labels = {
      high: { text: '需要关注', color: 'bg-red-500 text-white', icon: AlertTriangle },
      medium: { text: '建议关注', color: 'bg-yellow-500 text-white', icon: Lightbulb },
      low: { text: '一般提醒', color: 'bg-green-500 text-white', icon: Activity }
    };
    return labels[priority] || labels.low;
  };

  // 生成智能洞察
  const generateInsights = async () => {
    if (!familyId || !records) return;
    
    setLoading(true);
    try {
      // 使用AI分析引擎生成洞察
      const result = aiEngine.getFamilyUnifiedInsights(
        familyId,
        { id: familyId },
        records,
        analytics
      );
      
      // 添加热门趋势分析
      const monthlyTrends = aiEngine.analyzeMonthlyTrends(records);
      
      // 添加个性化仪表盘数据
      const dashboardData = {
        totalFamilies: 1, // 当前家庭
        totalMembers: members?.length || 0,
        totalRecords: records?.length || 0,
        monthlyRecords: monthlyTrends.totalRecords,
        lastLoginTime: new Date().toISOString(),
        activeFeatures: ['礼金记录', '数据分析', '智能洞察']
      };
      
      // 整合所有数据
      const enhancedResult = {
        ...result,
        monthlyTrends,
        dashboardData,
        giftBookOverview: {
          totalAmount: analytics?.total_amount || 0,
          totalRecords: analytics?.total_records || 0,
          monthlyIncome: result.analysisResult.monthlyIncome,
          monthlySpending: result.analysisResult.monthlySpending
        }
      };
      
      setAnalysisResult(enhancedResult.analysisResult);
      setInsights(enhancedResult.insights);
      setLastUpdated(new Date());
    } catch (error) {
      console.error('生成智能洞察失败:', error);
    } finally {
      setLoading(false);
    }
  };

  // 初始化和数据变化时重新生成洞察
  useEffect(() => {
    generateInsights();
  }, [familyId, records, analytics]);

  // 格式化时间
  const formatTime = (date) => {
    return date.toLocaleTimeString('zh-CN', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };



  // 获取详细的AI建议
  const getDetailedAISuggestions = (insight, records) => {
    const suggestions = [];
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();
    
    // 根据洞察类型生成具体建议
    switch (insight.type) {
      case 'spending':
        // 分析最近的支出记录
        const recentSpending = records.filter(r => {
          const recordDate = new Date(r.event_date);
          return r.amount < 0 && recordDate.getMonth() + 1 === currentMonth && recordDate.getFullYear() === currentYear;
        }).sort((a, b) => new Date(b.event_date) - new Date(a.event_date)).slice(0, 3);
        
        if (recentSpending.length > 0) {
          const highestSpending = recentSpending[0];
          suggestions.push({
            title: '近期支出分析',
            content: `您在${new Date(highestSpending.event_date).toLocaleDateString('zh-CN')}向${highestSpending.related_person}支出了¥${Math.abs(highestSpending.amount)}，这是本月最大的一笔支出。`,
            actionItems: [
              `建议在${currentMonth + 1}月${new Date(highestSpending.event_date).getDate()}日前后关注${highestSpending.related_person}的回礼情况`,
              `可以在微信上适当关心${highestSpending.related_person}的近况，维护关系`,
              `如果是重要节日支出，建议提前1-2周准备类似场合的预算`
            ]
          });
        }
        break;
        
      case 'income':
        // 分析最近的收入记录
        const recentIncome = records.filter(r => {
          const recordDate = new Date(r.event_date);
          return r.amount > 0 && recordDate.getMonth() + 1 === currentMonth && recordDate.getFullYear() === currentYear;
        }).sort((a, b) => new Date(b.event_date) - new Date(a.event_date)).slice(0, 3);
        
        if (recentIncome.length > 0) {
          const latestIncome = recentIncome[0];
          suggestions.push({
            title: '回礼提醒',
            content: `${latestIncome.related_person}在${new Date(latestIncome.event_date).toLocaleDateString('zh-CN')}给了您¥${latestIncome.amount}的礼金。`,
            actionItems: [
              `建议在${latestIncome.related_person}的生日或重要节日时回礼¥${Math.round(latestIncome.amount * 1.1)}-¥${Math.round(latestIncome.amount * 1.3)}`,
              `可以在农历新年、中秋节等传统节日主动联系${latestIncome.related_person}`,
              `建议在手机日历中设置${latestIncome.related_person}的生日提醒`
            ]
          });
        }
        break;
        
      case 'debt_management':
        if (insight.pendingDebts && insight.pendingDebts.length > 0) {
          const urgentDebt = insight.pendingDebts[0];
          suggestions.push({
            title: '人情债务提醒',
            content: `您目前欠${urgentDebt.person}约¥${urgentDebt.amount}的人情，最后一次往来是${urgentDebt.lastEvent?.event}。`,
            actionItems: [
              `建议在下个月的第2-3周主动联系${urgentDebt.person}，了解近况`,
              `可以在${urgentDebt.person}的重要节日（生日、结婚纪念日等）时回礼`,
              `建议准备¥${Math.round(urgentDebt.amount * 1.1)}的预算用于回礼`
            ]
          });
        }
        break;
        
      case 'social_health':
        if (insight.detailedAnalysis?.dormantList && insight.detailedAnalysis.dormantList.length > 0) {
          const dormantFriend = insight.detailedAnalysis.dormantList[0];
          suggestions.push({
            title: '社交关系维护',
            content: `您已经很久没有和${dormantFriend}联系了，建议主动维护这段关系。`,
            actionItems: [
              `本周末可以给${dormantFriend}发个微信问候，了解近况`,
              `可以邀请${dormantFriend}在下个月聚餐或喝茶`,
              `关注${dormantFriend}的朋友圈动态，适时点赞和评论`
            ]
          });
        }
        break;
        
      case 'holiday_prediction':
        if (insight.upcomingEvents && insight.upcomingEvents.length > 0) {
          const nextEvent = insight.upcomingEvents[0];
          suggestions.push({
            title: '节日准备计划',
            content: `${nextEvent.monthName}即将迎来${nextEvent.holidays.join('、')}，预计需要¥${nextEvent.estimatedAmount}的礼金预算。`,
            actionItems: [
              `建议在${currentMonth + 1}月15日前准备好节日礼金`,
              `可以提前购买一些通用礼品，如茶叶、坚果礼盒等`,
              `建议关注亲友群动态，不要错过重要的聚会邀请`
            ]
          });
        }
        break;
        
      case 'consumption_habits':
        if (insight.frequentEvents && insight.frequentEvents.length > 0) {
          const topEvent = insight.frequentEvents[0];
          suggestions.push({
            title: '消费习惯优化',
            content: `您最常参与的是${topEvent.type}，平均每次¥${topEvent.avgAmount}，共${topEvent.count}次。`,
            actionItems: [
              `建议为${topEvent.type}设定标准预算¥${Math.round(topEvent.avgAmount * 0.9)}-¥${Math.round(topEvent.avgAmount * 1.2)}`,
              `可以准备一些${topEvent.type}专用的礼品，如红包袋、贺卡等`,
              `建议在参加${topEvent.type}前1-2天确认具体金额标准`
            ]
          });
        }
        break;
    }
    
    return suggestions;
  };

  const getInsightDetails = (insight) => {
    if (insight.details) {
      // 使用新的详细信息结构
      const details = {
        spending: {
          description: '基于本月支出数据的详细分析',
          metrics: [
            `总支出: ¥${insight.details.totalAmount?.toFixed(2) || '0.00'}`,
            `支出笔数: ${insight.details.recordCount || 0}笔`,
            ...(insight.details.topRecords?.slice(0, 3).map(record => 
              `${record.related_person || '未知'} - ${record.type}: ¥${Math.abs(record.amount)}`
            ) || [])
          ],
          aiSuggestions: [
            '💡 AI建议：根据您的支出模式，建议设定月度预算上限',
            '📊 AI建议：可以考虑在重要节日前提前规划支出',
            '🎯 AI建议：建议记录每笔支出的具体用途，便于后续分析'
          ]
        },
        income: {
          description: '基于本月收入数据的详细分析',
          metrics: [
            `总收入: ¥${insight.details.totalAmount?.toFixed(2) || '0.00'}`,
            `收入笔数: ${insight.details.recordCount || 0}笔`,
            ...(insight.details.topRecords?.slice(0, 3).map(record => 
              `${record.related_person || '未知'} - ${record.type}: ¥${record.amount}`
            ) || [])
          ],
          aiSuggestions: [
            '💰 AI建议：收入稳定，可以考虑适当增加社交投入',
            '📈 AI建议：建议建立回礼提醒机制，维护人际关系',
            '🤝 AI建议：可以主动参与更多社交活动，扩展人脉网络'
          ]
        },
        balance: {
          description: '收支平衡状况详细评估',
          metrics: [
            `净收支: ¥${insight.details.netBalance?.toFixed(2) || '0.00'}`,
            `收入记录: ${insight.details.incomeCount || 0}笔`,
            `支出记录: ${insight.details.spendingCount || 0}笔`,
            `收支比例: ${insight.details.incomeCount && insight.details.spendingCount ? 
              (insight.details.incomeCount / (insight.details.incomeCount + insight.details.spendingCount) * 100).toFixed(1) + '%收入' : '暂无数据'}`
          ],
          aiSuggestions: [
            '⚖️ AI建议：保持收支平衡，避免过度支出',
            '📋 AI建议：建议制定季度财务回顾计划',
            '💡 AI建议：可以设置支出预警，控制大额支出'
          ]
        },
        eventType: {
          description: '事件类型分布详细分析',
          metrics: insight.details.topTypes?.map(([type, stats]) => 
            `${type}: ${stats.count}笔，总计¥${stats.totalAmount.toFixed(0)}`
          ) || [],
          aiSuggestions: [
            '🎉 AI建议：根据事件类型调整礼金标准，体现心意',
            '📅 AI建议：可以提前关注朋友圈动态，不错过重要活动',
            '🎁 AI建议：考虑准备一些通用礼品，应对突发邀请'
          ]
        },
        relationship: {
          description: '人际关系网络详细分析',
          metrics: [
            `关系多样性: ${getChineseText.relationshipDiversity[insight.details.diversity] || insight.details.diversity || '未知'}`,
            `活跃关系数: ${insight.details.topRelations?.length || 0}个`,
            ...(insight.details.topRelations?.map(([person, stats]) => 
              `${person}: ${stats.count}笔，总计¥${stats.totalAmount.toFixed(0)}`
            ) || [])
          ],
          aiSuggestions: [
            '👥 AI建议：定期联系老朋友，维护长期关系',
            '🌟 AI建议：可以组织小型聚会，增进友谊',
            '📱 AI建议：利用社交媒体保持日常互动'
          ]
        },
        activity: {
          description: '社交活跃度详细评估',
          metrics: [
            `本月记录: ${insight.details.recordCount || 0}笔`,
            `日均频率: ${insight.details.avgDaily || 0}笔/天`,
            ...(insight.details.recentRecords?.slice(0, 3).map(record => {
              const date = new Date(record.event_date).getDate();
              return `${date}日 - ${record.related_person || '未知'}(${record.type}): ¥${Math.abs(record.amount)}`;
            }) || [])
          ],
          aiSuggestions: [
            '📊 AI建议：保持适度的社交频率，避免过度疲劳',
            '⏰ AI建议：可以设置提醒，及时记录重要事件',
            '🎯 AI建议：关注社交质量，而非仅仅数量'
          ]
        }
      };
      
      return details[insight.type] || { description: '智能分析结果', metrics: [], aiSuggestions: ['💡 AI建议：继续记录数据，获得更准确的分析结果'] };
    }
    
    // 兼容旧的分析结果格式
    const details = {
      spending: {
        description: '基于本月支出数据分析',
        metrics: analysisResult ? [
          `月度支出: ¥${analysisResult.monthlySpending.toFixed(2)}`,
          `记录笔数: ${analysisResult.recordCount}笔`
        ] : [],
        aiSuggestions: [
          '💡 AI建议：根据您的支出模式，建议设定月度预算上限',
          '📊 AI建议：可以考虑在重要节日前提前规划支出'
        ]
      },
      balance: {
        description: '收支平衡状况评估',
        metrics: analysisResult ? [
          `月度收入: ¥${analysisResult.monthlyIncome.toFixed(2)}`,
          `净收支: ¥${analysisResult.netBalance.toFixed(2)}`
        ] : [],
        aiSuggestions: [
          '⚖️ AI建议：保持收支平衡，避免过度支出',
          '📋 AI建议：建议制定季度财务回顾计划'
        ]
      },
      relationship: {
        description: '人际关系网络分析',
        metrics: analysisResult ? [
          `关系多样性: ${getChineseText.relationshipDiversity[analysisResult.relationshipDiversity] || analysisResult.relationshipDiversity}`,
          `活跃关系数: ${new Set(records.map(r => r.related_person).filter(Boolean)).size}个`
        ] : [],
        aiSuggestions: [
          '👥 AI建议：定期联系老朋友，维护长期关系',
          '🌟 AI建议：可以组织小型聚会，增进友谊'
        ]
      },
      activity: {
        description: '社交活跃度评估',
        metrics: analysisResult ? [
          `本月记录: ${analysisResult.recordCount}笔`,
          `平均频率: ${(analysisResult.recordCount / 30).toFixed(1)}笔/天`
        ] : [],
        aiSuggestions: [
          '📊 AI建议：保持适度的社交频率，避免过度疲劳',
          '⏰ AI建议：可以设置提醒，及时记录重要事件'
        ]
      }
    };
    
    return details[insight.type] || { description: '智能分析结果', metrics: [], aiSuggestions: ['💡 AI建议：继续记录数据，获得更准确的分析结果'] };
  };

  if (!familyId) {
    return (
      <Card className="bg-gradient-to-br from-purple-900/20 to-blue-900/20 border-purple-500/20">
        <CardContent className="p-6 text-center">
          <Brain className="w-12 h-12 text-purple-400 mx-auto mb-4" />
          <p className="text-white/70">请先创建或加入家庭以获取智能洞察</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="relative">
      <Card className="border-0 transition-all duration-500 bg-gradient-to-br from-purple-600/15 via-indigo-600/12 to-purple-700/15 border border-purple-400/30 group hover:border-purple-400/50 hover:scale-[1.02] transform p-0">
        <CardHeader className="relative z-10 p-0">
          <CardTitle className="bg-gradient-to-r from-purple-400/10 to-indigo-500/10 rounded-t-lg border-b border-purple-300/25 w-full">
            <div className="flex items-center justify-between space-x-4 text-xl text-white px-4 py-3">
              <div className="flex items-center space-x-4">
                <div className="w-10 h-10 bg-gradient-to-br from-purple-500 via-indigo-600 to-purple-600 rounded-xl flex items-center justify-center transition-all duration-300 group-hover:scale-110">
                  <Brain className="w-5 h-5 text-white" />
                </div>
                <div className="flex flex-col justify-center">
                  <span className="font-bold tracking-wide pb-1 mb-2 inline-block relative">
                     智能洞察
                     <div className="absolute -bottom-1 left-0 w-full h-0.5 bg-gradient-to-r from-purple-400 via-indigo-300 to-purple-200 opacity-80"></div>
                   </span>
                </div>
              </div>

            </div>
            <div className="h-0.5 bg-gradient-to-r from-purple-200/50 via-indigo-200/50 to-purple-300/50 w-full"></div>
            
            {/* 智能摘要 - 在标题卡片内部 */}
            {analysisResult && insights.length > 0 && (
              <div className="px-3 py-0.5 bg-gradient-to-r from-yellow-400/10 to-amber-500/10 border-b border-yellow-300/20 relative z-20">
                <div className="flex items-center space-x-1.5 mb-0">
                  <Sparkles className="w-2.5 h-2.5 text-yellow-400" />
                  <span className="text-yellow-300 font-medium text-xs">AI智能摘要（基于本月数据）</span>
                </div>
                <p className="text-white/90 text-xs leading-tight">
                  {activeCategory === 'all' 
                    ? aiEngine.generateSummary(analysisResult, insights)
                    : `${insightCategories[activeCategory].label}板块：${getFilteredInsights().length > 0 
                        ? `发现${getFilteredInsights().length}个洞察，${getFilteredInsights().filter(i => i.priority === 'high').length}个高优先级项目需要关注` 
                        : '暂无相关洞察数据'}`
                  }
                </p>
              </div>
            )}
          </CardTitle>
        </CardHeader>
        
        <div className="relative h-[calc(20rem-3.375rem)]">
          <CardContent 
            ref={contentRef}
            className="px-4 pt-0 pb-0 h-full overflow-y-auto scrollbar-hide space-y-0.5 -mt-8 cursor-grab active:cursor-grabbing relative"
            onScroll={handleScroll}
            onMouseDown={handleMouseDown}
            style={{ touchAction: 'pan-y', userSelect: 'none', overscrollBehavior: 'none' }}
          >

        {loading ? (
          <div className="text-center py-4">
            <div className="animate-spin w-6 h-6 border-2 border-purple-400 border-t-transparent rounded-full mx-auto mb-2"></div>
            <p className="text-white/70 text-xs">AI正在分析数据...</p>
          </div>
        ) : insights.length > 0 ? (
          <>
            {/* 数据分析维度 */}
            {insights.monthlyTrends && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-1.5 mb-1.5 mt-0">
                {/* 本月热门趋势 */}
                <div className="bg-gradient-to-br from-pink-500/10 to-rose-500/10 rounded-lg p-2 border border-pink-500/20">
                  <div className="flex items-center space-x-1.5 mb-1">
                    <TrendingUp className="w-3 h-3 text-pink-400" />
                    <span className="text-white font-medium text-xs">本月热门趋势</span>
                  </div>
                  <div className="space-y-1">
                    {insights.monthlyTrends.popularEventTypes.slice(0, 2).map((type, idx) => (
                      <div key={idx} className="flex justify-between items-center">
                        <span className="text-white/80 text-xs">{type.name}</span>
                        <span className="text-pink-300 text-xs font-medium">¥{type.avgAmount.toFixed(0)}</span>
                      </div>
                    ))}
                    {insights.monthlyTrends.popularEventTypes.length === 0 && (
                      <p className="text-white/60 text-xs">暂无热门事件类型</p>
                    )}
                  </div>
                </div>
                
                {/* 个性化仪表盘 */}
                <div className="bg-gradient-to-br from-blue-500/10 to-indigo-500/10 rounded-lg p-2 border border-blue-500/20">
                  <div className="flex items-center space-x-1.5 mb-1">
                    <BarChart3 className="w-3 h-3 text-blue-400" />
                    <span className="text-white font-medium text-xs">使用数据</span>
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between items-center">
                      <span className="text-white/80 text-xs">家庭成员</span>
                      <span className="text-blue-300 text-xs font-medium">{insights.dashboardData?.totalMembers || 0}人</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-white/80 text-xs">总记录数</span>
                      <span className="text-blue-300 text-xs font-medium">{insights.dashboardData?.totalRecords || 0}条</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-white/80 text-xs">本月记录</span>
                      <span className="text-blue-300 text-xs font-medium">{insights.dashboardData?.monthlyRecords || 0}条</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {/* 礼金薄概览和财务统计 */}
            {insights.giftBookOverview && (
              <div className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 rounded-lg p-2 border border-green-500/20 mb-2">
                <div className="flex items-center space-x-1.5 mb-1">
                  <Wallet className="w-3 h-3 text-green-400" />
                  <span className="text-white font-medium text-xs">财务统计</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="text-center">
                    <p className="text-green-300 text-sm font-bold">¥{insights.giftBookOverview.monthlyIncome.toFixed(0)}</p>
                    <p className="text-white/60 text-xs">本月收入</p>
                  </div>
                  <div className="text-center">
                    <p className="text-red-300 text-sm font-bold">¥{insights.giftBookOverview.monthlySpending.toFixed(0)}</p>
                    <p className="text-white/60 text-xs">本月支出</p>
                  </div>
                  <div className="text-center">
                    <p className="text-blue-300 text-xs font-medium">¥{insights.giftBookOverview.totalAmount.toFixed(0)}</p>
                    <p className="text-white/60 text-xs">总金额</p>
                  </div>
                  <div className="text-center">
                    <p className="text-purple-300 text-xs font-medium">{insights.giftBookOverview.totalRecords}</p>
                    <p className="text-white/60 text-xs">总记录</p>
                  </div>
                </div>
              </div>
            )}
            
            {/* 分类切换按钮 - 固定在内容顶部 */}
            {analysisResult && insights.length > 0 && (
              <div className="py-2 bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-700 border-b border-purple-400/50 sticky top-0 z-30 -mx-6">
                <div className="flex items-center justify-between h-full px-3">
                  <span className="text-white font-medium text-xs ml-4">洞察分类</span>
                  <div className="flex items-center space-x-1">
                    {Object.entries(insightCategories).map(([key, category]) => {
                      const IconComponent = category.icon;
                      const isActive = activeCategory === key;
                      const colorClasses = {
                        purple: isActive ? 'bg-purple-500 text-purple-100 border-purple-400' : 'text-purple-300 hover:text-purple-200 hover:bg-purple-500/30',
                        green: isActive ? 'bg-green-500 text-green-100 border-green-400' : 'text-green-300 hover:text-green-200 hover:bg-green-500/30',
                        blue: isActive ? 'bg-blue-500 text-blue-100 border-blue-400' : 'text-blue-300 hover:text-blue-200 hover:bg-blue-500/30',
                        orange: isActive ? 'bg-orange-500 text-orange-100 border-orange-400' : 'text-orange-300 hover:text-orange-200 hover:bg-orange-500/30',
                        pink: isActive ? 'bg-pink-500 text-pink-100 border-pink-400' : 'text-pink-300 hover:text-pink-200 hover:bg-pink-500/30'
                      };
                      
                      return (
                        <button
                          key={key}
                          onClick={() => setActiveCategory(key)}
                          className={`flex items-center space-x-1 px-2 py-1 rounded-md text-xs transition-all duration-200 border ${
                            isActive ? colorClasses[category.color] : `border-transparent ${colorClasses[category.color]}`
                          }`}
                          title={category.label}
                        >
                          <IconComponent className="w-3 h-3" />
                          <span className="hidden sm:inline">{category.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* 洞察列表 */}
            <div className="space-y-5">
              {getFilteredInsights().map((insight, index) => {
                const originalIndex = insights.findIndex(i => i === insight);
                const IconComponent = iconMap[insight.icon] || Lightbulb;
                const isExpanded = expandedInsight === originalIndex;
                const details = getInsightDetails(insight);
                const priorityLabel = getPriorityLabel(insight.priority);
                const PriorityIcon = priorityLabel.icon;
                
                return (
                  <div key={index} className="group">
                    <div 
                      className={`p-2 rounded-lg border transition-all duration-200 cursor-pointer ${
                        priorityColors[insight.priority]
                      } hover:bg-opacity-20`}
                      onClick={() => setExpandedInsight(isExpanded ? null : originalIndex)}
                    >
                      {/* 优先级标签在右侧垂直居中 */}
                       <div className="flex items-center justify-between">
                         <div className="flex items-start space-x-2 flex-1">
                           <IconComponent className="w-3 h-3 mt-0.5 flex-shrink-0" />
                           <div className="flex-1 min-w-0">
                             <h4 className="font-medium text-xs text-white mb-0.5">
                               {insight.title}
                             </h4>
                             <p className="text-xs text-white/70 leading-relaxed">
                               {insight.content}
                             </p>
                           </div>
                         </div>
                         <div className="flex items-center space-x-2 ml-2">
                           <div className={`inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${
                              priorityLabel.color
                            }`}>
                             <PriorityIcon className="w-3 h-3" />
                             <span>{priorityLabel.text}</span>
                           </div>
                           <ChevronRight className={`w-3 h-3 text-white/50 transition-transform ${
                             isExpanded ? 'rotate-90' : ''
                           }`} />
                         </div>
                       </div>
                      
                      {/* 展开的详细信息 */}
                      {isExpanded && (
                        <div className="mt-3 pt-3 border-t border-white/10">
                          <p className="text-xs text-white/60 mb-2">{details.description}</p>
                          {details.metrics.length > 0 && (
                            <div className="space-y-1 mb-3">
                              {details.metrics.map((metric, idx) => (
                                <div key={idx} className="text-xs text-white/70 flex items-center">
                                  <div className="w-1 h-1 bg-white/40 rounded-full mr-2"></div>
                                  {metric}
                                </div>
                              ))}
                            </div>
                          )}
                          {/* AI建议部分 */}
                           {details.aiSuggestions && details.aiSuggestions.length > 0 && (
                             <div className="mt-3 pt-2 border-t border-purple-300/20">
                               <div className="flex items-center space-x-1 mb-2">
                                 <Brain className="w-3 h-3 text-purple-300" />
                                 <span className="text-purple-300 font-medium text-xs">AI智能建议</span>
                               </div>
                               <div className="space-y-1">
                                 {details.aiSuggestions.map((suggestion, idx) => (
                                   <div key={idx} className="text-xs text-purple-200/80 flex items-start">
                                     <div className="w-1 h-1 bg-purple-300/60 rounded-full mr-2 mt-1.5 flex-shrink-0"></div>
                                     <span className="leading-relaxed">{suggestion}</span>
                                   </div>
                                 ))}
                               </div>
                             </div>
                           )}
                           
                           {/* 详细AI建议部分 */}
                           {getDetailedAISuggestions(insight, records).length > 0 && (
                             <div className="mt-4 pt-3 border-t border-purple-300/30">
                               <div className="flex items-center space-x-1 mb-3">
                                 <Sparkles className="w-3 h-3 text-yellow-300" />
                                 <span className="text-yellow-300 font-medium text-xs">AI个性化建议</span>
                               </div>
                               <div className="space-y-2">
                                 {getDetailedAISuggestions(insight, records).map((suggestion, idx) => (
                                   <div key={idx} className="bg-purple-900/30 rounded-lg p-2 border border-purple-400/20">
                                     <div className="flex items-start space-x-2">
                                       <div className="w-1.5 h-1.5 bg-yellow-300/80 rounded-full mt-1.5 flex-shrink-0"></div>
                                       <div className="flex-1">
                                         <div className="text-xs text-yellow-200 font-medium mb-1">{suggestion.title}</div>
                                         <div className="text-xs text-purple-200/90 leading-relaxed">{suggestion.content}</div>
                                         {suggestion.actionItems && suggestion.actionItems.length > 0 && (
                                           <div className="mt-2 space-y-1">
                                             {suggestion.actionItems.map((action, actionIdx) => (
                                               <div key={actionIdx} className="text-xs text-purple-300/80 flex items-start">
                                                 <span className="text-purple-400 mr-1">→</span>
                                                 <span>{action}</span>
                                               </div>
                                             ))}
                                           </div>
                                         )}
                                       </div>
                                     </div>
                                   </div>
                                 ))}
                               </div>
                             </div>
                           )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
            
            {/* 底部提示文本 */}
            {!isAtBottom && (
              <div className="text-center py-4 border-t border-white/10 mt-4">
                <div className="flex items-center justify-center space-x-2 text-white/60">
                  <Sparkles className="w-3 h-3" />
                  <span className="text-xs">已经到底了</span>
                </div>
              </div>
            )}
            
            {/* 底部提示 - 滑到底部时显示 */}
            {isAtBottom && showContinueHint && (
              <div className="text-center py-4 border-t border-white/10 mt-4">
                <div className="flex items-center justify-center space-x-2 text-white/60">
                  <Sparkles className="w-3 h-3" />
                  <span className="text-xs">已经到底了</span>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-8">
            <Brain className="w-12 h-12 text-purple-400/50 mx-auto mb-4" />
            <p className="text-white/70 text-sm mb-2">暂无足够数据生成洞察</p>
            <p className="text-white/50 text-xs">添加更多礼金记录以获取智能分析</p>
          </div>
        )}
          </CardContent>
          
          {/* 移除红包彩蛋效果 */}

          {/* 底部AI分析提示 - 始终显示 */}
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-purple-900/95 via-purple-800/80 to-transparent p-1 text-center rounded-b-xl z-10 opacity-100">
            <div className="flex items-center justify-center space-x-1">
              <Brain className="w-2.5 h-2.5 text-purple-300" />
              <span className="text-purple-200 text-xs">此分析由AI基于本月数据智能生成，仅供参考</span>
              <Sparkles className="w-2.5 h-2.5 text-purple-300" />
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default SmartInsightsCard;