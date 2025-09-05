/**
 * 内置AI分析引擎
 * 提供轻量级数据分析和智能建议生成功能
 */

class AIAnalysisEngine {
  constructor() {
    // 中文映射表
    this.chineseMapping = {
      // 事件类型映射
      eventTypes: {
        'wedding': '结婚',
        'birth': '满月',
        'graduation': '升学',
        'birthday': '生日',
        'moving': '乔迁',
        'funeral': '白事',
        'casual': '无事酒',
        'other': '其他'
       },
       // 关系类型映射
       relationTypes: {
         'relative': '亲戚',
         'friend': '朋友',
         'colleague': '同事',
         'neighbor': '邻居',
         'classmate': '同学',
         'other': '其他'
       }
    };
    
    this.analysisTemplates = {
      spending: {
        high: '本月支出较高，建议适当控制礼金开支',
        normal: '本月支出正常，保持良好的理财习惯',
        low: '本月支出较少，可适当增加社交投入'
      },
      income: {
        high: '本月收礼较多，建议做好回礼规划',
        normal: '本月收支平衡，财务状况良好',
        low: '本月收礼较少，注意维护人际关系'
      },
      trend: {
        increasing: '支出呈上升趋势，建议关注预算控制',
        stable: '支出趋势稳定，财务管理良好',
        decreasing: '支出呈下降趋势，可适当增加社交活动'
      },
      relationship: {
        diverse: '人际关系网络丰富，社交活跃度高',
        focused: '主要集中在特定关系群体，可拓展社交圈',
        limited: '社交范围相对有限，建议增加互动'
      }
    };
  }

  /**
   * 转换英文类型为中文
   */
  translateToChineseType(type, category = 'eventTypes') {
    return this.chineseMapping[category][type] || type || '其他';
  }

  /**
   * 转换关系类型为中文
   */
  translateRelationType(relationType) {
    return this.translateToChineseType(relationType, 'relationTypes');
  }

  /**
   * 翻译事件类型
   */
  translateEventType(eventType) {
    return this.translateToChineseType(eventType, 'eventTypes');
  }

  /**
   * 翻译关系人称
   */
  translateRelatedPerson(relatedPerson) {
    if (!relatedPerson) return '未知';
    return this.translateToChineseType(relatedPerson, 'relationTypes') || relatedPerson;
  }

  /**
   * 分析家庭财务状况
   * @param {Object} familyData - 家庭数据
   * @param {Array} records - 记录数据
   * @param {Object} analytics - 分析数据
   * @returns {Object} 分析结果
   */
  analyzeFamilyFinances(familyData, records, analytics) {
    const currentMonth = new Date().getMonth() + 1;
    const currentYear = new Date().getFullYear();
    
    // 过滤当月数据
    const currentMonthRecords = records.filter(record => {
      const recordDate = new Date(record.event_date);
      return recordDate.getMonth() + 1 === currentMonth && 
             recordDate.getFullYear() === currentYear;
    });

    // 计算基础指标
    const monthlySpending = this.calculateMonthlySpending(currentMonthRecords);
    const monthlyIncome = this.calculateMonthlyIncome(currentMonthRecords);
    const spendingTrend = this.analyzeSpendingTrend(records);
    const relationshipDiversity = this.analyzeRelationshipDiversity(currentMonthRecords);
    const eventTypeDistribution = this.analyzeEventTypeDistribution(currentMonthRecords);

    return {
      monthlySpending,
      monthlyIncome,
      spendingTrend,
      relationshipDiversity,
      eventTypeDistribution,
      netBalance: monthlyIncome - monthlySpending,
      recordCount: currentMonthRecords.length
    };
  }

  /**
   * 计算月度支出
   */
  calculateMonthlySpending(records) {
    return records
      .filter(record => record.amount < 0)
      .reduce((total, record) => total + Math.abs(record.amount), 0);
  }

  /**
   * 计算月度收入
   */
  calculateMonthlyIncome(records) {
    return records
      .filter(record => record.amount > 0)
      .reduce((total, record) => total + record.amount, 0);
  }

  /**
   * 分析支出趋势
   */
  analyzeSpendingTrend(records) {
    const monthlyData = {};
    
    records.forEach(record => {
      const date = new Date(record.event_date);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = 0;
      }
      
      if (record.amount < 0) {
        monthlyData[monthKey] += Math.abs(record.amount);
      }
    });

    const months = Object.keys(monthlyData).sort().slice(-3); // 最近3个月
    const values = months.map(month => monthlyData[month] || 0);
    
    if (values.length < 2) return 'stable';
    
    const trend = values[values.length - 1] - values[0];
    const threshold = values[0] * 0.2; // 20%变化阈值
    
    if (trend > threshold) return 'increasing';
    if (trend < -threshold) return 'decreasing';
    return 'stable';
  }

  /**
   * 分析人际关系多样性
   */
  analyzeRelationshipDiversity(records) {
    const relations = new Set(records.map(record => this.translateRelatedPerson(record.related_person)).filter(person => person !== '未知'));
    const relationCount = relations.size;
    
    // 分析关系类型分布
    const relationTypes = {};
    const relationFrequency = {};
    const relationAmounts = {};
    
    records.forEach(record => {
      const person = record.related_person;
      const amount = Math.abs(record.amount);
      
      relationFrequency[person] = (relationFrequency[person] || 0) + 1;
      relationAmounts[person] = (relationAmounts[person] || 0) + amount;
      
      // 根据交往频率和金额推断关系亲密度
      const frequency = relationFrequency[person];
      const totalAmount = relationAmounts[person];
      
      if (frequency >= 5 && totalAmount >= 1000) {
        relationTypes[person] = '核心关系';
      } else if (frequency >= 3 || totalAmount >= 500) {
        relationTypes[person] = '重要关系';
      } else {
        relationTypes[person] = '一般关系';
      }
    });
    
    const coreRelations = Object.values(relationTypes).filter(type => type === '核心关系').length;
    const importantRelations = Object.values(relationTypes).filter(type => type === '重要关系').length;
    const generalRelations = Object.values(relationTypes).filter(type => type === '一般关系').length;
    
    let diversityLevel;
     if (relationCount >= 10 && coreRelations >= 3) diversityLevel = 'high';
     else if (relationCount >= 5 && (coreRelations >= 2 || importantRelations >= 3)) diversityLevel = 'medium';
     else diversityLevel = 'low';
     
     // 为了向后兼容，返回字符串，但在内部存储详细信息
     this.lastRelationshipAnalysis = {
       level: diversityLevel,
       totalCount: relationCount,
       coreRelations,
       importantRelations,
       generalRelations,
       relationTypes,
       relationFrequency,
       relationAmounts,
       networkHealth: this.calculateNetworkHealth(relationFrequency, relationAmounts)
     };
     
     return diversityLevel;
  }

  /**
   * 分析事件类型分布
   */
  analyzeEventTypeDistribution(records) {
    const typeStats = {};
    const seasonalPatterns = {};
    const monthlyDistribution = {};
    
    records.forEach(record => {
      const type = record.type || 'other';
      const date = new Date(record.event_date);
      const month = date.getMonth();
      const season = Math.floor(month / 3); // 0-春, 1-夏, 2-秋, 3-冬
      
      if (!typeStats[type]) {
        typeStats[type] = {
          count: 0,
          amount: 0,
          months: new Set(),
          seasons: new Set(),
          recentTrend: 0
        };
      }
      
      typeStats[type].count++;
      typeStats[type].amount += Math.abs(record.amount);
      typeStats[type].months.add(month);
      typeStats[type].seasons.add(season);
      
      // 季节性模式分析
      if (!seasonalPatterns[type]) {
        seasonalPatterns[type] = [0, 0, 0, 0]; // 春夏秋冬
      }
      seasonalPatterns[type][season]++;
      
      // 月度分布
      if (!monthlyDistribution[type]) {
        monthlyDistribution[type] = new Array(12).fill(0);
      }
      monthlyDistribution[type][month]++;
    });
    
    // 计算趋势和季节性
    Object.keys(typeStats).forEach(type => {
      typeStats[type].seasonality = this.calculateSeasonality(seasonalPatterns[type] || [0, 0, 0, 0]);
      typeStats[type].consistency = typeStats[type].months.size; // 跨越的月份数
      
      // 计算最近3个月的趋势
      const recentRecords = records.filter(r => {
        const date = new Date(r.event_date);
        const now = new Date();
        const threeMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 3, 1);
        return r.type === type && date >= threeMonthsAgo;
      });
      
      typeStats[type].recentTrend = this.calculateTrendDirection(recentRecords);
    });

    return Object.entries(typeStats)
      .map(([type, stats]) => ({
        type,
        count: stats.count,
        amount: stats.amount,
        percentage: records.length > 0 ? (stats.count / records.length * 100).toFixed(1) : 0,
        seasonality: stats.seasonality,
        consistency: stats.consistency,
        recentTrend: stats.recentTrend
      }))
      .sort((a, b) => b.amount - a.amount);
  }

  /**
   * 分析本月热门趋势
   */
  analyzeMonthlyTrends(records) {
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();
    
    // 获取当前月份的记录
    const currentMonthRecords = records.filter(record => {
      const date = new Date(record.event_date);
      return date.getMonth() + 1 === currentMonth && date.getFullYear() === currentYear;
    });
    
    // 获取上个月的记录
    const lastMonth = currentMonth === 1 ? 12 : currentMonth - 1;
    const lastMonthYear = currentMonth === 1 ? currentYear - 1 : currentYear;
    const lastMonthRecords = records.filter(record => {
      const date = new Date(record.event_date);
      return date.getMonth() + 1 === lastMonth && date.getFullYear() === lastMonthYear;
    });
    
    // 获取去年同期记录
    const lastYearRecords = records.filter(record => {
      const date = new Date(record.event_date);
      return date.getMonth() + 1 === currentMonth && date.getFullYear() === currentYear - 1;
    });
    
    const currentSpending = Math.abs(currentMonthRecords
      .filter(r => r.amount < 0)
      .reduce((sum, r) => sum + r.amount, 0));
    
    const lastSpending = Math.abs(lastMonthRecords
      .filter(r => r.amount < 0)
      .reduce((sum, r) => sum + r.amount, 0));
    
    const lastYearSpending = Math.abs(lastYearRecords
      .filter(r => r.amount < 0)
      .reduce((sum, r) => sum + r.amount, 0));
    
    const currentIncome = currentMonthRecords
      .filter(r => r.amount > 0)
      .reduce((sum, r) => sum + r.amount, 0);
    
    const lastIncome = lastMonthRecords
      .filter(r => r.amount > 0)
      .reduce((sum, r) => sum + r.amount, 0);
    
    const lastYearIncome = lastYearRecords
      .filter(r => r.amount > 0)
      .reduce((sum, r) => sum + r.amount, 0);
    
    // 分析支出模式
    const spendingByWeek = this.analyzeWeeklyPattern(currentMonthRecords.filter(r => r.amount < 0));
    const incomeByWeek = this.analyzeWeeklyPattern(currentMonthRecords.filter(r => r.amount > 0));
    
    // 分析事件类型趋势
    const eventTypeTrends = this.analyzeEventTypeTrends(currentMonthRecords, lastMonthRecords);
    
    // 分析人际关系活跃度
    const relationshipActivity = this.analyzeRelationshipActivity(currentMonthRecords, lastMonthRecords);

    // 分析热门事件类型
    const eventTypeStats = {};
    currentMonthRecords.filter(r => r.amount < 0).forEach(record => {
      const type = this.translateEventType(record.type);
      if (!eventTypeStats[type]) {
        eventTypeStats[type] = { count: 0, totalAmount: 0 };
      }
      eventTypeStats[type].count++;
      eventTypeStats[type].totalAmount += Math.abs(record.amount);
    });

    const popularEventTypes = Object.entries(eventTypeStats)
      .map(([type, stats]) => ({
        name: type,
        count: stats.count,
        avgAmount: stats.totalAmount / stats.count,
        totalAmount: stats.totalAmount,
        rank: 0
      }))
      .sort((a, b) => b.totalAmount - a.totalAmount)
      .slice(0, 5)
      .map((item, index) => ({ ...item, rank: index + 1 }));

    // 分析热门人物关系
    const relationStats = {};
    currentMonthRecords.filter(r => r.amount < 0).forEach(record => {
      const relation = record.related_person || '未知';
      if (!relationStats[relation]) {
        relationStats[relation] = { count: 0, totalAmount: 0 };
      }
      relationStats[relation].count++;
      relationStats[relation].totalAmount += Math.abs(record.amount);
    });

    const popularRelations = Object.entries(relationStats)
      .map(([relation, stats]) => ({
        name: relation,
        count: stats.count,
        avgAmount: stats.totalAmount / stats.count,
        totalAmount: stats.totalAmount,
        rank: 0
      }))
      .sort((a, b) => b.totalAmount - a.totalAmount)
      .slice(0, 5)
      .map((item, index) => ({ ...item, rank: index + 1 }));
    
    return {
      currentMonth: {
        spending: currentSpending,
        income: currentIncome,
        recordCount: currentMonthRecords.length,
        weeklySpending: spendingByWeek,
        weeklyIncome: incomeByWeek
      },
      lastMonth: {
        spending: lastSpending,
        income: lastIncome,
        recordCount: lastMonthRecords.length
      },
      lastYear: {
        spending: lastYearSpending,
        income: lastYearIncome,
        recordCount: lastYearRecords.length
      },
      trends: {
        spendingChange: lastSpending > 0 ? ((currentSpending - lastSpending) / lastSpending * 100) : 0,
        incomeChange: lastIncome > 0 ? ((currentIncome - lastIncome) / lastIncome * 100) : 0,
        activityChange: lastMonthRecords.length > 0 ? 
          ((currentMonthRecords.length - lastMonthRecords.length) / lastMonthRecords.length * 100) : 0,
        yearOverYearSpending: lastYearSpending > 0 ? ((currentSpending - lastYearSpending) / lastYearSpending * 100) : 0,
        yearOverYearIncome: lastYearIncome > 0 ? ((currentIncome - lastYearIncome) / lastYearIncome * 100) : 0
      },
      patterns: {
        eventTypeTrends,
        relationshipActivity,
        peakSpendingWeek: spendingByWeek.indexOf(Math.max(...spendingByWeek)) + 1,
        peakIncomeWeek: incomeByWeek.indexOf(Math.max(...incomeByWeek)) + 1
      },
      popularEventTypes,
      popularRelations,
      totalRecords: currentMonthRecords.filter(r => r.amount < 0).length,
      totalAmount: currentMonthRecords.filter(r => r.amount < 0).reduce((sum, record) => sum + Math.abs(record.amount), 0)
    };
  }

  /**
   * 生成智能建议
   */
  generateInsights(analysisResult, familyData, records) {
    const insights = [];
    const currentMonthRecords = this.getMonthlyRecords(records);
    
    // 支出分析建议 - 增加具体信息
    const spendingLevel = this.categorizeSpending(analysisResult.monthlySpending);
    const spendingRecords = currentMonthRecords.filter(r => r.amount < 0);
    const topSpending = spendingRecords
      .sort((a, b) => a.amount - b.amount)
      .slice(0, 3)
      .map(r => `${this.translateRelatedPerson(r.related_person)}(${this.translateEventType(r.type)}): ¥${Math.abs(r.amount)}`)
      .join('、');
    
    insights.push({
      type: 'spending',
      title: '支出分析',
      content: `${this.analysisTemplates.spending[spendingLevel]}${topSpending ? `\n主要支出: ${topSpending}` : ''}`,
      priority: spendingLevel === 'high' ? 'high' : 'medium',
      icon: 'TrendingDown',
      details: {
        totalAmount: analysisResult.monthlySpending,
        recordCount: spendingRecords.length,
        topRecords: spendingRecords.slice(0, 5).map(record => ({
          ...record,
          type: this.translateEventType(record.type),
          related_person: this.translateRelatedPerson(record.related_person)
        }))
      }
    });

    // 收入分析建议 - 增加具体信息
    const incomeRecords = currentMonthRecords.filter(r => r.amount > 0);
    if (incomeRecords.length > 0) {
      const topIncome = incomeRecords
        .sort((a, b) => b.amount - a.amount)
        .slice(0, 3)
        .map(r => `${this.translateRelatedPerson(r.related_person)}(${this.translateEventType(r.type)}): ¥${r.amount}`)
        .join('、');
      
      insights.push({
        type: 'income',
        title: '收入分析',
        content: `本月收礼 ¥${analysisResult.monthlyIncome.toFixed(2)}，共${incomeRecords.length}笔\n主要收入: ${topIncome}`,
        priority: 'medium',
        icon: 'TrendingUp',
        details: {
          totalAmount: analysisResult.monthlyIncome,
          recordCount: incomeRecords.length,
          topRecords: incomeRecords.slice(0, 5).map(record => ({
            ...record,
            type: this.translateEventType(record.type),
            related_person: this.translateRelatedPerson(record.related_person)
          }))
        }
      });
    }

    // 收支平衡建议 - 增加具体信息
    if (analysisResult.netBalance < 0) {
      insights.push({
        type: 'balance',
        title: '收支提醒',
        content: `本月净支出 ¥${Math.abs(analysisResult.netBalance).toFixed(2)}，建议关注收支平衡\n收入${incomeRecords.length}笔，支出${spendingRecords.length}笔`,
        priority: 'high',
        icon: 'AlertTriangle',
        details: {
          netBalance: analysisResult.netBalance,
          incomeCount: incomeRecords.length,
          spendingCount: spendingRecords.length
        }
      });
    } else if (analysisResult.netBalance > 0) {
      insights.push({
        type: 'balance',
        title: '收支状况',
        content: `本月净收入 ¥${analysisResult.netBalance.toFixed(2)}，财务状况良好\n收入${incomeRecords.length}笔，支出${spendingRecords.length}笔`,
        priority: 'low',
        icon: 'TrendingUp',
        details: {
          netBalance: analysisResult.netBalance,
          incomeCount: incomeRecords.length,
          spendingCount: spendingRecords.length
        }
      });
    }

    // 事件类型分析 - 增加具体信息
    const eventTypeStats = {};
    currentMonthRecords.forEach(record => {
      const type = this.translateEventType(record.type);
      if (!eventTypeStats[type]) {
        eventTypeStats[type] = { count: 0, totalAmount: 0, records: [] };
      }
      eventTypeStats[type].count++;
      eventTypeStats[type].totalAmount += Math.abs(record.amount);
      eventTypeStats[type].records.push(record);
    });
    
    const topEventTypes = Object.entries(eventTypeStats)
      .sort(([,a], [,b]) => b.totalAmount - a.totalAmount)
      .slice(0, 3);
    
    if (topEventTypes.length > 0) {
      const eventTypeContent = topEventTypes
        .map(([type, stats]) => `${type}: ${stats.count}笔/¥${stats.totalAmount.toFixed(0)}`)
        .join('、');
      
      insights.push({
        type: 'eventType',
        title: '事件类型分析',
        content: `本月主要事件类型: ${eventTypeContent}`,
        priority: 'medium',
        icon: 'BarChart3',
        details: {
          eventTypes: eventTypeStats,
          topTypes: topEventTypes
        }
      });
    }

    // 人际关系分析 - 增加具体信息
    const relationStats = {};
    currentMonthRecords.forEach(record => {
      const person = this.translateRelatedPerson(record.related_person);
      if (!relationStats[person]) {
        relationStats[person] = { count: 0, totalAmount: 0, records: [] };
      }
      relationStats[person].count++;
      relationStats[person].totalAmount += Math.abs(record.amount);
      relationStats[person].records.push({
        ...record,
        type: this.translateEventType(record.type)
      });
    });
    
    const topRelations = Object.entries(relationStats)
      .sort(([,a], [,b]) => b.totalAmount - a.totalAmount)
      .slice(0, 3);
    
    if (topRelations.length > 0) {
      const relationContent = topRelations
        .map(([person, stats]) => `${person}: ${stats.count}笔/¥${stats.totalAmount.toFixed(0)}`)
        .join('、');
      
      insights.push({
        type: 'relationship',
        title: '人际关系分析',
        content: `${this.analysisTemplates.relationship[analysisResult.relationshipDiversity]}\n主要往来: ${relationContent}`,
        priority: 'medium',
        icon: 'Users',
        details: {
          relationStats,
          topRelations,
          diversity: analysisResult.relationshipDiversity
        }
      });
    }

    // 活跃度分析 - 增加具体信息
    if (analysisResult.recordCount === 0) {
      insights.push({
        type: 'activity',
        title: '活跃度提醒',
        content: '本月暂无礼金记录，建议保持社交活跃度',
        priority: 'medium',
        icon: 'Calendar',
        details: {
          recordCount: 0,
          suggestion: '增加社交活动'
        }
      });
    } else {
      const avgDaily = (analysisResult.recordCount / new Date().getDate()).toFixed(1);
      const recentRecords = currentMonthRecords
        .sort((a, b) => new Date(b.event_date) - new Date(a.event_date))
        .slice(0, 3)
        .map(r => `${new Date(r.event_date).getDate()}日-${this.translateRelatedPerson(r.related_person)}(¥${Math.abs(r.amount)})`)
        .join('、');
      
      insights.push({
        type: 'activity',
        title: '活跃度分析',
        content: `本月已记录${analysisResult.recordCount}笔礼金，日均${avgDaily}笔${recentRecords ? `\n最近记录: ${recentRecords}` : ''}`,
        priority: analysisResult.recordCount >= 10 ? 'low' : 'medium',
        icon: 'Activity',
        details: {
          recordCount: analysisResult.recordCount,
          avgDaily: parseFloat(avgDaily),
          recentRecords: currentMonthRecords.slice(0, 5).map(record => ({
            ...record,
            type: this.translateEventType(record.type),
            related_person: this.translateRelatedPerson(record.related_person)
          }))
        }
      });
    }

    // 季度对比分析
    const quarterlyComparison = this.analyzeQuarterlyComparison(records);
    if (quarterlyComparison.hasData) {
      insights.push({
        type: 'quarterly',
        title: '季度对比分析',
        content: `与上季度相比，${quarterlyComparison.trend}。本季度${quarterlyComparison.summary}`,
        priority: quarterlyComparison.significant ? 'high' : 'medium',
        icon: 'BarChart3',
        details: {
          currentQuarter: quarterlyComparison.currentQuarter,
          previousQuarter: quarterlyComparison.previousQuarter,
          changePercent: quarterlyComparison.changePercent,
          trend: quarterlyComparison.trend,
          aiSuggestion: `AI建议：${quarterlyComparison.aiAdvice}`
        }
      });
    }

    // 人情债务管理分析
    const debtAnalysis = this.analyzeDebtManagement(records);
    if (debtAnalysis.hasDebts || debtAnalysis.hasCredits) {
      insights.push({
        type: 'debt',
        title: '人情债务管理',
        content: `${debtAnalysis.summary}。${debtAnalysis.urgentActions}`,
        priority: debtAnalysis.hasUrgent ? 'high' : 'medium',
        icon: 'AlertTriangle',
        details: {
          pendingDebts: debtAnalysis.pendingDebts,
          expectedReturns: debtAnalysis.expectedReturns,
          totalDebtAmount: debtAnalysis.totalDebtAmount,
          totalCreditAmount: debtAnalysis.totalCreditAmount,
          aiSuggestion: `AI建议：${debtAnalysis.aiAdvice}`,
          detailedRecords: debtAnalysis.detailedRecords
        }
      });
    }

    // 社交网络健康度分析
    const socialHealth = this.analyzeSocialNetworkHealth(records);
    insights.push({
      type: 'social',
      title: '社交网络健康度',
      content: `社交网络健康度：${socialHealth.healthScore}分。${socialHealth.summary}`,
      priority: socialHealth.healthScore < 60 ? 'high' : 'medium',
      icon: 'Users',
      details: {
        healthScore: socialHealth.healthScore,
        activeConnections: socialHealth.activeConnections,
        dormantConnections: socialHealth.dormantConnections,
        newConnections: socialHealth.newConnections,
        recommendations: socialHealth.recommendations,
        aiSuggestion: `AI建议：${socialHealth.aiAdvice}`,
        detailedAnalysis: socialHealth.detailedAnalysis
      }
    });

    // 消费习惯洞察
    const consumptionInsights = this.analyzeConsumptionHabits(records);
    insights.push({
      type: 'consumption',
      title: '消费习惯洞察',
      content: `${consumptionInsights.pattern}。${consumptionInsights.summary}`,
      priority: 'medium',
      icon: 'Wallet',
      details: {
        spendingPattern: consumptionInsights.spendingPattern,
        peakTimes: consumptionInsights.peakTimes,
        averageAmount: consumptionInsights.averageAmount,
        frequentEvents: consumptionInsights.frequentEvents,
        seasonalTrends: consumptionInsights.seasonalTrends,
        aiSuggestion: `AI建议：${consumptionInsights.aiAdvice}`,
        personalizedTips: consumptionInsights.personalizedTips
      }
    });

    // 节日消费预测
    const holidayPrediction = this.predictHolidaySpending(records);
    if (holidayPrediction.hasUpcomingEvents) {
      insights.push({
        type: 'prediction',
        title: '节日消费预测',
        content: `${holidayPrediction.summary}。预计${holidayPrediction.timeframe}需要准备¥${holidayPrediction.estimatedAmount}`,
        priority: holidayPrediction.isUrgent ? 'high' : 'medium',
        icon: 'Calendar',
        details: {
          upcomingEvents: holidayPrediction.upcomingEvents,
          estimatedAmount: holidayPrediction.estimatedAmount,
          timeframe: holidayPrediction.timeframe,
          budgetSuggestion: holidayPrediction.budgetSuggestion,
          aiSuggestion: `AI建议：${holidayPrediction.aiAdvice}`,
          detailedPredictions: holidayPrediction.detailedPredictions
        }
      });
    }

    return insights.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
  }

  /**
   * 分析周模式
   */
  analyzeWeeklyPattern(records) {
    const weeks = [0, 0, 0, 0]; // 4周
    records.forEach(record => {
      const date = new Date(record.event_date);
      const weekOfMonth = Math.floor((date.getDate() - 1) / 7);
      if (weekOfMonth < 4) {
        weeks[weekOfMonth] += Math.abs(record.amount);
      }
    });
    return weeks;
  }

  /**
   * 分析事件类型趋势
   */
  analyzeEventTypeTrends(currentRecords, lastRecords) {
    const currentTypes = {};
    const lastTypes = {};
    
    currentRecords.forEach(record => {
      const type = this.translateEventType(record.type);
      currentTypes[type] = (currentTypes[type] || 0) + 1;
    });
    
    lastRecords.forEach(record => {
      const type = this.translateEventType(record.type);
      lastTypes[type] = (lastTypes[type] || 0) + 1;
    });
    
    const trends = {};
    Object.keys(currentTypes).forEach(type => {
      const current = currentTypes[type] || 0;
      const last = lastTypes[type] || 0;
      trends[type] = last > 0 ? ((current - last) / last * 100) : (current > 0 ? 100 : 0);
    });
    
    return trends;
  }

  /**
   * 分析关系活跃度
   */
  analyzeRelationshipActivity(currentRecords, lastRecords) {
    const currentRelations = new Set(currentRecords.map(r => r.related_person));
    const lastRelations = new Set(lastRecords.map(r => r.related_person));
    
    const newRelations = Array.from(currentRelations).filter(r => !lastRelations.has(r));
    const continuingRelations = Array.from(currentRelations).filter(r => lastRelations.has(r));
    const dormantRelations = Array.from(lastRelations).filter(r => !currentRelations.has(r));
    
    return {
      new: newRelations.length,
      continuing: continuingRelations.length,
      dormant: dormantRelations.length,
      total: currentRelations.size
    };
  }

  /**
   * 计算季节性
   */
  calculateSeasonality(seasonalData) {
    const total = seasonalData.reduce((sum, count) => sum + count, 0);
    if (total === 0) return 'none';
    
    const maxSeason = Math.max(...seasonalData);
    const maxIndex = seasonalData.indexOf(maxSeason);
    const seasons = ['春季', '夏季', '秋季', '冬季'];
    
    return maxSeason / total > 0.5 ? seasons[maxIndex] : 'balanced';
  }

  /**
    * 计算趋势方向
    */
   calculateTrendDirection(records) {
     if (records.length < 2) return 0;
     
     const sortedRecords = records.sort((a, b) => new Date(a.event_date) - new Date(b.event_date));
     const firstHalf = sortedRecords.slice(0, Math.floor(records.length / 2));
     const secondHalf = sortedRecords.slice(Math.floor(records.length / 2));
     
     const firstAvg = firstHalf.reduce((sum, r) => sum + Math.abs(r.amount), 0) / firstHalf.length;
     const secondAvg = secondHalf.reduce((sum, r) => sum + Math.abs(r.amount), 0) / secondHalf.length;
     
     return firstAvg > 0 ? ((secondAvg - firstAvg) / firstAvg * 100) : 0;
   }

   /**
    * 计算网络健康度
    */
   calculateNetworkHealth(relationFrequency, relationAmounts) {
     const totalRelations = Object.keys(relationFrequency).length;
     if (totalRelations === 0) return 0;
     
     // 计算活跃关系比例
     const activeRelations = Object.values(relationFrequency).filter(freq => freq >= 2).length;
     const activeRatio = activeRelations / totalRelations;
     
     // 计算金额分布均衡度
     const amounts = Object.values(relationAmounts);
     const avgAmount = amounts.reduce((sum, amt) => sum + amt, 0) / amounts.length;
     const variance = amounts.reduce((sum, amt) => sum + Math.pow(amt - avgAmount, 2), 0) / amounts.length;
     const balanceScore = Math.max(0, 100 - (Math.sqrt(variance) / avgAmount * 100));
     
     // 综合健康度评分
     return Math.round((activeRatio * 60 + balanceScore * 0.4));
   }

   /**
    * 生成事件类型洞察
    */
   generateEventTypeInsights(eventTypes) {
     const insights = [];
     
     Object.entries(eventTypes).forEach(([type, data]) => {
       if (data.count >= 3) {
         let insight = `${type}事件较为频繁，共${data.count}次`;
         
         if (data.seasonality !== 'balanced') {
           insight += `，主要集中在${data.seasonality}`;
         }
         
         if (Math.abs(data.recentTrend) > 20) {
           insight += `，最近呈${data.recentTrend > 0 ? '上升' : '下降'}趋势`;
         }
         
         insights.push(insight);
       }
     });
     
     return insights;
   }

  /**
   * 分类支出水平
   */
  categorizeSpending(amount) {
    if (amount > 2000) return 'high';
    if (amount > 500) return 'normal';
    return 'low';
  }

  /**
   * 获取家庭统一建议
   * 确保同一家庭的不同成员获得相同的建议
   */
  getFamilyUnifiedInsights(familyId, familyData, records, analytics) {
    // 基于家庭ID生成一致的分析结果
    const analysisResult = this.analyzeFamilyFinances(familyData, records, analytics);
    const insights = this.generateInsights(analysisResult, familyData, records);
    const monthlyTrends = this.analyzeMonthlyTrends(records);
    
    // 生成个性化仪表盘数据
    const dashboardData = {
      totalMembers: familyData?.members?.length || 0,
      totalRecords: records.length,
      monthlyRecords: this.getMonthlyRecords(records).length,
      activeMembers: this.getActiveMembers(records, familyData?.members || []).length
    };
    
    // 生成礼金薄概览数据
    const giftBookOverview = {
      monthlyIncome: analysisResult.monthlyIncome,
      monthlySpending: analysisResult.monthlySpending,
      totalAmount: records.reduce((sum, record) => sum + record.amount, 0),
      totalRecords: records.length,
      netBalance: analysisResult.netBalance
    };
    
    return {
      familyId,
      analysisResult,
      insights,
      monthlyTrends,
      dashboardData,
      giftBookOverview,
      generatedAt: new Date().toISOString(),
      summary: this.generateSummary(analysisResult, insights)
    };
  }
  
  /**
   * 获取当月记录
   */
  getMonthlyRecords(records) {
    const currentMonth = new Date().getMonth() + 1;
    const currentYear = new Date().getFullYear();
    
    return records.filter(record => {
      const recordDate = new Date(record.event_date);
      return recordDate.getMonth() + 1 === currentMonth && 
             recordDate.getFullYear() === currentYear;
    });
  }
  
  /**
   * 获取活跃成员
   */
  getActiveMembers(records, members) {
    const currentMonth = new Date().getMonth() + 1;
    const currentYear = new Date().getFullYear();
    
    const activeUserIds = new Set(
      records
        .filter(record => {
          const recordDate = new Date(record.event_date);
          return recordDate.getMonth() + 1 === currentMonth && 
                 recordDate.getFullYear() === currentYear;
        })
        .map(record => record.user_id)
    );
    
    return members.filter(member => activeUserIds.has(member.user_id));
  }

  /**
   * 生成分析摘要
   */
  generateSummary(analysisResult, insights) {
    const summaryParts = [];
    
    if (analysisResult.monthlySpending > 0) {
      summaryParts.push(`本月支出¥${analysisResult.monthlySpending.toFixed(0)}`);
    }
    
    if (analysisResult.monthlyIncome > 0) {
      summaryParts.push(`收入¥${analysisResult.monthlyIncome.toFixed(0)}`);
    }
    
    const highPriorityInsights = insights.filter(i => i.priority === 'high').length;
    if (highPriorityInsights > 0) {
      summaryParts.push(`${highPriorityInsights}项需要关注`);
    }
    
    return summaryParts.length > 0 ? summaryParts.join('，') + '。' : '暂无重要洞察。';
  }

  /**
   * 季度对比分析
   */
  analyzeQuarterlyComparison(records) {
    const now = new Date();
    const currentQuarter = Math.floor(now.getMonth() / 3) + 1;
    const currentYear = now.getFullYear();
    
    // 获取当前季度和上一季度的数据
    const currentQuarterRecords = records.filter(record => {
      const date = new Date(record.event_date);
      const quarter = Math.floor(date.getMonth() / 3) + 1;
      return date.getFullYear() === currentYear && quarter === currentQuarter;
    });
    
    const previousQuarter = currentQuarter === 1 ? 4 : currentQuarter - 1;
    const previousYear = currentQuarter === 1 ? currentYear - 1 : currentYear;
    
    const previousQuarterRecords = records.filter(record => {
      const date = new Date(record.event_date);
      const quarter = Math.floor(date.getMonth() / 3) + 1;
      return date.getFullYear() === previousYear && quarter === previousQuarter;
    });
    
    if (previousQuarterRecords.length === 0) {
      return { hasData: false };
    }
    
    const currentSpending = Math.abs(currentQuarterRecords.filter(r => r.amount < 0).reduce((sum, r) => sum + r.amount, 0));
    const previousSpending = Math.abs(previousQuarterRecords.filter(r => r.amount < 0).reduce((sum, r) => sum + r.amount, 0));
    
    const changePercent = previousSpending > 0 ? ((currentSpending - previousSpending) / previousSpending * 100) : 0;
    const significant = Math.abs(changePercent) > 20;
    
    let trend, summary, aiAdvice;
    if (changePercent > 10) {
      trend = '支出明显增加';
      summary = `支出增长${changePercent.toFixed(1)}%`;
      aiAdvice = '建议审查支出项目，制定预算控制计划，关注大额支出的必要性';
    } else if (changePercent < -10) {
      trend = '支出明显减少';
      summary = `支出减少${Math.abs(changePercent).toFixed(1)}%`;
      aiAdvice = '支出控制良好，可以考虑适当增加有意义的社交投入';
    } else {
      trend = '支出基本稳定';
      summary = `支出变化${Math.abs(changePercent).toFixed(1)}%`;
      aiAdvice = '保持当前的支出水平，继续维护良好的财务习惯';
    }
    
    return {
      hasData: true,
      currentQuarter: { spending: currentSpending, records: currentQuarterRecords.length },
      previousQuarter: { spending: previousSpending, records: previousQuarterRecords.length },
      changePercent,
      trend,
      summary,
      significant,
      aiAdvice
    };
  }

  /**
   * 人情债务管理分析
   */
  analyzeDebtManagement(records) {
    const now = new Date();
    const threeMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 3, now.getDate());
    
    // 分析支出记录，识别可能的人情债务
    const recentSpending = records.filter(record => {
      const date = new Date(record.event_date);
      return record.amount < 0 && date >= threeMonthsAgo;
    });
    
    // 分析收入记录，识别可能的回礼
    const recentIncome = records.filter(record => {
      const date = new Date(record.event_date);
      return record.amount > 0 && date >= threeMonthsAgo;
    });
    
    // 构建人情关系网络
    const relationshipMap = new Map();
    
    recentSpending.forEach(record => {
      const person = record.related_person;
      if (!relationshipMap.has(person)) {
        relationshipMap.set(person, { given: 0, received: 0, events: [] });
      }
      relationshipMap.get(person).given += Math.abs(record.amount);
      relationshipMap.get(person).events.push({
        type: 'given',
        amount: Math.abs(record.amount),
        event: record.type,
        date: record.event_date
      });
    });
    
    recentIncome.forEach(record => {
      const person = record.related_person;
      if (!relationshipMap.has(person)) {
        relationshipMap.set(person, { given: 0, received: 0, events: [] });
      }
      relationshipMap.get(person).received += record.amount;
      relationshipMap.get(person).events.push({
        type: 'received',
        amount: record.amount,
        event: record.type,
        date: record.event_date
      });
    });
    
    // 分析债务和债权
    const pendingDebts = [];
    const expectedReturns = [];
    let totalDebtAmount = 0;
    let totalCreditAmount = 0;
    
    relationshipMap.forEach((data, person) => {
      const balance = data.received - data.given;
      if (balance < -100) { // 欠别人的
        pendingDebts.push({
          person: this.translateRelatedPerson(person),
          amount: Math.abs(balance),
          lastEvent: data.events[data.events.length - 1]
        });
        totalDebtAmount += Math.abs(balance);
      } else if (balance > 100) { // 别人欠的
        expectedReturns.push({
          person: this.translateRelatedPerson(person),
          amount: balance,
          lastEvent: data.events[data.events.length - 1]
        });
        totalCreditAmount += balance;
      }
    });
    
    const hasDebts = pendingDebts.length > 0;
    const hasCredits = expectedReturns.length > 0;
    const hasUrgent = pendingDebts.some(debt => debt.amount > 500);
    
    let summary, urgentActions, aiAdvice;
    if (hasDebts && hasCredits) {
      summary = `当前有${pendingDebts.length}笔待还人情，${expectedReturns.length}笔待收回礼`;
      urgentActions = hasUrgent ? '有大额人情债务需要优先处理' : '人情往来基本平衡';
      aiAdvice = '建议建立人情账本，及时回礼，维护良好的人际关系。对于大额往来要特别留意时机';
    } else if (hasDebts) {
      summary = `当前有${pendingDebts.length}笔待还人情，总计¥${totalDebtAmount.toFixed(0)}`;
      urgentActions = hasUrgent ? '建议尽快安排回礼' : '适时安排回礼即可';
      aiAdvice = '建议制定回礼计划，选择合适的时机和场合进行回礼，保持人情往来的平衡';
    } else if (hasCredits) {
      summary = `当前有${expectedReturns.length}笔待收回礼，总计¥${totalCreditAmount.toFixed(0)}`;
      urgentActions = '耐心等待合适的回礼时机';
      aiAdvice = '保持耐心，在对方有喜事时主动回礼，体现人情味和关怀';
    } else {
      summary = '当前人情往来基本平衡';
      urgentActions = '继续保持良好的人际关系';
      aiAdvice = '继续维护现有的人际关系网络，适当参与社交活动';
    }
    
    return {
      hasDebts,
      hasCredits,
      hasUrgent,
      pendingDebts,
      expectedReturns,
      totalDebtAmount,
      totalCreditAmount,
      summary,
      urgentActions,
      aiAdvice,
      detailedRecords: Array.from(relationshipMap.entries()).map(([person, data]) => ({
        person: this.translateRelatedPerson(person),
        balance: data.received - data.given,
        events: data.events.map(event => ({
          ...event,
          event: this.translateEventType(event.event),
          date: new Date(event.date).toLocaleDateString('zh-CN')
        }))
      }))
    };
  }

  /**
   * 社交网络健康度分析
   */
  analyzeSocialNetworkHealth(records) {
    const now = new Date();
    const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 6, now.getDate());
    const threeMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 3, now.getDate());
    
    // 分析社交网络
    const allConnections = new Set(records.map(r => r.related_person).filter(Boolean));
    const recentConnections = new Set(
      records.filter(r => new Date(r.event_date) >= threeMonthsAgo)
        .map(r => r.related_person).filter(Boolean)
    );
    const oldConnections = new Set(
      records.filter(r => new Date(r.event_date) < threeMonthsAgo && new Date(r.event_date) >= sixMonthsAgo)
        .map(r => r.related_person).filter(Boolean)
    );
    
    const activeConnections = recentConnections.size;
    const dormantConnections = Array.from(allConnections).filter(person => !recentConnections.has(person)).length;
    const newConnections = Array.from(recentConnections).filter(person => !oldConnections.has(person)).length;
    
    // 计算健康度评分
    let healthScore = 0;
    healthScore += Math.min(activeConnections * 10, 40); // 活跃连接数 (最高40分)
    healthScore += Math.min(newConnections * 5, 20); // 新连接数 (最高20分)
    healthScore += Math.min((allConnections.size - dormantConnections) / allConnections.size * 40, 40); // 活跃比例 (最高40分)
    
    let summary, recommendations, aiAdvice;
    if (healthScore >= 80) {
      summary = '社交网络非常健康，人际关系活跃';
      recommendations = ['继续保持现有的社交频率', '可以考虑引荐朋友互相认识'];
      aiAdvice = '您的社交网络非常健康！建议继续保持，并可以考虑成为朋友圈的连接者';
    } else if (healthScore >= 60) {
      summary = '社交网络较为健康，有改善空间';
      recommendations = ['增加与老朋友的联系', '参加更多社交活动'];
      aiAdvice = '建议主动联系一些久未联系的朋友，参加聚会或组织小型聚餐';
    } else {
      summary = '社交网络需要加强维护';
      recommendations = ['重新激活休眠关系', '扩展社交圈子', '增加社交活动频率'];
      aiAdvice = '建议制定社交计划，每月至少主动联系3-5位朋友，参加社交活动';
    }
    
    return {
      healthScore: Math.round(healthScore),
      activeConnections,
      dormantConnections,
      newConnections,
      summary,
      recommendations,
      aiAdvice,
      detailedAnalysis: {
        totalConnections: allConnections.size,
        activeRate: (activeConnections / allConnections.size * 100).toFixed(1) + '%',
        newConnectionRate: (newConnections / activeConnections * 100).toFixed(1) + '%',
        dormantList: Array.from(allConnections).filter(person => !recentConnections.has(person))
          .map(person => this.translateRelatedPerson(person)).slice(0, 5)
      }
    };
  }

  /**
   * 消费习惯洞察
   */
  analyzeConsumptionHabits(records) {
    const spendingRecords = records.filter(r => r.amount < 0);
    
    if (spendingRecords.length === 0) {
      return {
        pattern: '暂无足够的消费数据',
        summary: '建议添加更多记录以获得个性化分析',
        spendingPattern: 'insufficient_data',
        aiAdvice: '继续记录礼金往来，积累数据以获得更准确的分析'
      };
    }
    
    // 分析消费模式
    const amounts = spendingRecords.map(r => Math.abs(r.amount));
    const averageAmount = amounts.reduce((sum, amount) => sum + amount, 0) / amounts.length;
    
    // 分析时间模式
    const monthlyDistribution = {};
    const weekdayDistribution = {};
    
    spendingRecords.forEach(record => {
      const date = new Date(record.event_date);
      const month = date.getMonth() + 1;
      const weekday = date.getDay();
      
      monthlyDistribution[month] = (monthlyDistribution[month] || 0) + 1;
      weekdayDistribution[weekday] = (weekdayDistribution[weekday] || 0) + 1;
    });
    
    // 找出高峰时间
    const peakMonth = Object.entries(monthlyDistribution)
      .sort(([,a], [,b]) => b - a)[0];
    const peakWeekday = Object.entries(weekdayDistribution)
      .sort(([,a], [,b]) => b - a)[0];
    
    const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
    
    // 分析事件类型偏好
    const eventTypeStats = {};
    spendingRecords.forEach(record => {
      const type = this.translateEventType(record.type);
      if (!eventTypeStats[type]) {
        eventTypeStats[type] = { count: 0, totalAmount: 0 };
      }
      eventTypeStats[type].count++;
      eventTypeStats[type].totalAmount += Math.abs(record.amount);
    });
    
    const frequentEvents = Object.entries(eventTypeStats)
      .sort(([,a], [,b]) => b.count - a.count)
      .slice(0, 3);
    
    // 生成个性化建议
    let pattern, summary, aiAdvice, personalizedTips;
    
    if (averageAmount > 500) {
      pattern = '您倾向于高额礼金消费';
      summary = `平均每笔¥${averageAmount.toFixed(0)}，属于慷慨型消费者`;
      aiAdvice = '建议设定礼金预算上限，避免过度消费影响家庭财务';
      personalizedTips = ['制定年度礼金预算', '对不同关系设定不同标准', '重要场合可适当提高标准'];
    } else if (averageAmount > 200) {
      pattern = '您的礼金消费适中合理';
      summary = `平均每笔¥${averageAmount.toFixed(0)}，消费习惯良好`;
      aiAdvice = '保持当前的消费水平，根据关系亲疏和场合重要性灵活调整';
      personalizedTips = ['继续保持理性消费', '可根据通胀适当调整', '关注礼金市场行情'];
    } else {
      pattern = '您倾向于节俭型礼金消费';
      summary = `平均每笔¥${averageAmount.toFixed(0)}，消费较为保守`;
      aiAdvice = '适当提高重要场合的礼金标准，避免在人际关系上显得过于节俭';
      personalizedTips = ['重要关系可适当提高标准', '关注当地礼金习俗', '平衡节俭与人情'];
    }
    
    return {
      pattern,
      summary,
      spendingPattern: averageAmount > 500 ? 'generous' : averageAmount > 200 ? 'moderate' : 'conservative',
      peakTimes: {
        month: `${peakMonth[0]}月`,
        weekday: weekdays[parseInt(peakWeekday[0])],
        monthlyCount: peakMonth[1],
        weekdayCount: peakWeekday[1]
      },
      averageAmount,
      frequentEvents: frequentEvents.map(([type, stats]) => ({
        type,
        count: stats.count,
        avgAmount: (stats.totalAmount / stats.count).toFixed(0)
      })),
      seasonalTrends: this.analyzeSeasonalTrends(spendingRecords),
      aiAdvice,
      personalizedTips
    };
  }

  /**
   * 节日消费预测
   */
  predictHolidaySpending(records) {
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    
    // 定义节日和高峰期
    const holidays = {
      1: ['元旦', '春节'],
      2: ['春节', '元宵节'],
      3: ['妇女节'],
      4: ['清明节'],
      5: ['劳动节', '母亲节'],
      6: ['儿童节', '父亲节'],
      7: ['建党节'],
      8: ['建军节', '七夕节'],
      9: ['教师节', '中秋节'],
      10: ['国庆节', '重阳节'],
      11: ['光棍节'],
      12: ['圣诞节']
    };
    
    // 分析历史数据中的节日消费模式
    const historicalData = {};
    records.filter(r => r.amount < 0).forEach(record => {
      const date = new Date(record.event_date);
      const month = date.getMonth() + 1;
      if (!historicalData[month]) {
        historicalData[month] = [];
      }
      historicalData[month].push(Math.abs(record.amount));
    });
    
    // 预测未来3个月的消费
    const upcomingMonths = [];
    for (let i = 1; i <= 3; i++) {
      const targetMonth = (currentMonth + i - 1) % 12 + 1;
      upcomingMonths.push(targetMonth);
    }
    
    const upcomingEvents = [];
    let totalEstimatedAmount = 0;
    
    upcomingMonths.forEach(month => {
      const monthHolidays = holidays[month] || [];
      const historicalAmounts = historicalData[month] || [];
      const avgAmount = historicalAmounts.length > 0 
        ? historicalAmounts.reduce((sum, amount) => sum + amount, 0) / historicalAmounts.length
        : 200; // 默认金额
      
      if (monthHolidays.length > 0) {
        const estimatedCount = Math.max(1, Math.floor(historicalAmounts.length / 12 * monthHolidays.length));
        const monthlyEstimate = avgAmount * estimatedCount;
        
        upcomingEvents.push({
          month,
          holidays: monthHolidays,
          estimatedAmount: monthlyEstimate,
          estimatedCount
        });
        
        totalEstimatedAmount += monthlyEstimate;
      }
    });
    
    const hasUpcomingEvents = upcomingEvents.length > 0;
    const isUrgent = upcomingEvents.some(event => event.month === currentMonth + 1);
    
    let summary, timeframe, budgetSuggestion, aiAdvice;
    
    if (hasUpcomingEvents) {
      const nextEvent = upcomingEvents[0];
      summary = `即将迎来${nextEvent.holidays.join('、')}等节日`;
      timeframe = `未来3个月`;
      budgetSuggestion = `建议预留¥${(totalEstimatedAmount * 1.2).toFixed(0)}的礼金预算`;
      aiAdvice = isUrgent 
        ? '下个月就有重要节日，建议提前准备礼金和礼品，关注亲友动态'
        : '提前规划节日礼金预算，可以分月准备，避免集中支出压力';
    } else {
      summary = '未来3个月节日较少';
      timeframe = '未来3个月';
      budgetSuggestion = '可以适当减少礼金预算，关注其他支出';
      aiAdvice = '节日较少的时期，可以主动联系朋友聚餐，维护人际关系';
    }
    
    return {
      hasUpcomingEvents,
      isUrgent,
      upcomingEvents,
      estimatedAmount: totalEstimatedAmount.toFixed(0),
      timeframe,
      summary,
      budgetSuggestion,
      aiAdvice,
      detailedPredictions: upcomingEvents.map(event => ({
        ...event,
        monthName: `${event.month}月`,
        suggestion: `预计${event.estimatedCount}笔，平均¥${(event.estimatedAmount / event.estimatedCount).toFixed(0)}`
      }))
    };
  }

  /**
   * 分析季节性趋势
   */
  analyzeSeasonalTrends(records) {
    const seasons = {
      spring: [3, 4, 5],
      summer: [6, 7, 8],
      autumn: [9, 10, 11],
      winter: [12, 1, 2]
    };
    
    const seasonalData = {};
    Object.keys(seasons).forEach(season => {
      seasonalData[season] = { count: 0, totalAmount: 0 };
    });
    
    records.forEach(record => {
      const month = new Date(record.event_date).getMonth() + 1;
      const season = Object.keys(seasons).find(s => seasons[s].includes(month));
      if (season) {
        seasonalData[season].count++;
        seasonalData[season].totalAmount += Math.abs(record.amount);
      }
    });
    
    const seasonNames = {
      spring: '春季',
      summer: '夏季', 
      autumn: '秋季',
      winter: '冬季'
    };
    
    return Object.entries(seasonalData).map(([season, data]) => ({
      season: seasonNames[season],
      count: data.count,
      avgAmount: data.count > 0 ? (data.totalAmount / data.count).toFixed(0) : 0
    }));
  }
}

export default AIAnalysisEngine;