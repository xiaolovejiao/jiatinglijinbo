import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Alert, AlertDescription } from '../components/ui/alert';
import { Badge } from '../components/ui/badge';
import { 
  Users, 
  UserCheck, 
  Briefcase, 
  GraduationCap,
  Heart,
  Baby,
  Gift,
  Wine,
  Plus,
  Calendar,
  DollarSign,
  ArrowLeft,
  Home,
  Skull,
  MoreHorizontal,
  TrendingUp,
  TrendingDown,
  Check,
  X
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth.jsx';
import { apiRequest } from '../config/api';

const Record = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedRelation, setSelectedRelation] = useState('');
  const [selectedEvent, setSelectedEvent] = useState('');
  const [selectedTransactionType, setSelectedTransactionType] = useState('');
  const [formData, setFormData] = useState({
    person_name: '',
    amount: '',
    event_date: '',
    notes: ''
  });
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [showStepWarningDialog, setShowStepWarningDialog] = useState(false);
  const [family, setFamily] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  // 人物关系分类
  const relationTypes = [
    { id: 'relative', label: '亲戚', icon: Users, color: 'bg-red-50 border-red-200 text-red-700', hoverColor: 'hover:bg-red-100' },
    { id: 'friend', label: '朋友', icon: UserCheck, color: 'bg-blue-50 border-blue-200 text-blue-700', hoverColor: 'hover:bg-blue-100' },
    { id: 'colleague', label: '同事', icon: Briefcase, color: 'bg-green-50 border-green-200 text-green-700', hoverColor: 'hover:bg-green-100' },
    { id: 'classmate', label: '同学', icon: GraduationCap, color: 'bg-purple-50 border-purple-200 text-purple-700', hoverColor: 'hover:bg-purple-100' }
  ];

  // 事件类型（按用户要求的顺序：结婚、满月、升学、生日、乔迁、白事、无事酒、其他）
  const eventTypes = [
    { id: 'wedding', label: '结婚', icon: Heart, color: 'bg-pink-50 border-pink-200 text-pink-700', hoverColor: 'hover:bg-pink-100' },
    { id: 'birth', label: '满月', icon: Baby, color: 'bg-yellow-50 border-yellow-200 text-yellow-700', hoverColor: 'hover:bg-yellow-100' },
    { id: 'graduation', label: '升学', icon: GraduationCap, color: 'bg-indigo-50 border-indigo-200 text-indigo-700', hoverColor: 'hover:bg-indigo-100' },
    { id: 'birthday', label: '生日', icon: Gift, color: 'bg-orange-50 border-orange-200 text-orange-700', hoverColor: 'hover:bg-orange-100' },
    { id: 'moving', label: '乔迁', icon: Home, color: 'bg-emerald-50 border-emerald-200 text-emerald-700', hoverColor: 'hover:bg-emerald-100' },
    { id: 'funeral', label: '白事', icon: Skull, color: 'bg-gray-50 border-gray-200 text-gray-700', hoverColor: 'hover:bg-gray-100' },
    { id: 'casual', label: '无事酒', icon: Wine, color: 'bg-teal-50 border-teal-200 text-teal-700', hoverColor: 'hover:bg-teal-100' },
    { id: 'other', label: '其他', icon: MoreHorizontal, color: 'bg-slate-50 border-slate-200 text-slate-700', hoverColor: 'hover:bg-slate-100' }
  ];

  // 收支类型
  const transactionTypes = [
    { id: 'income', label: '收入', icon: TrendingUp, color: 'bg-green-50 border-green-200 text-green-700', hoverColor: 'hover:bg-green-100' },
    { id: 'expense', label: '支出', icon: TrendingDown, color: 'bg-red-50 border-red-200 text-red-700', hoverColor: 'hover:bg-red-100' }
  ];

  useEffect(() => {
    fetchFamilyData();
  }, []);

  const fetchFamilyData = async () => {
    try {
      const response = await apiRequest('/api/families');
      if (response.ok) {
        const data = await response.json();
        setFamily(data.family);
      } else {
        setError('请先创建或加入家庭');
      }
    } catch (error) {
      console.error('获取家庭信息失败:', error);
      setError('获取家庭信息失败');
    }
  };

  const handleRelationSelect = (relationId) => {
    setSelectedRelation(relationId);
    setCurrentStep(2);
  };

  const handleEventSelect = (eventId) => {
    setSelectedEvent(eventId);
    setCurrentStep(3);
  };

  const handleTransactionTypeSelect = (typeId) => {
    setSelectedTransactionType(typeId);
    setCurrentStep(4);
  };

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError('');
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    
    if (!formData.person_name || !formData.amount || !formData.event_date) {
      setError('请填写所有必填字段');
      return;
    }

    if (isNaN(formData.amount) || parseFloat(formData.amount) <= 0) {
      setError('请输入有效的金额');
      return;
    }

    setShowConfirmDialog(true);
  };

  const handleConfirmSubmit = async () => {
    if (!family) {
      setError('请先创建或加入家庭');
      return;
    }

    setLoading(true);
    try {
      const amount = selectedTransactionType === 'expense' 
        ? -Math.abs(parseFloat(formData.amount))
        : Math.abs(parseFloat(formData.amount));

      const response = await apiRequest(`/api/families/${family.id}/records`, {
        method: 'POST',
        body: JSON.stringify({
          amount: amount,
          type: selectedEvent,
          related_person: selectedRelation,
          description: formData.notes ? `${formData.person_name} - ${formData.notes}` : formData.person_name,
          event_date: formData.event_date
        })
      });

      const data = await response.json();
      if (response.ok) {
        setShowSuccessDialog(true);
      } else {
        setError(data.error || '添加记录失败');
      }
    } catch (error) {
      setError('网络错误，请重试');
    } finally {
      setLoading(false);
      setShowConfirmDialog(false);
    }
  };

  const resetForm = () => {
    setCurrentStep(1);
    setSelectedRelation('');
    setSelectedEvent('');
    setSelectedTransactionType('');
    setFormData({
      person_name: '',
      amount: '',
      event_date: '',
      notes: ''
    });
    setError('');
    setSuccess('');
    setShowConfirmDialog(false);
    setShowSuccessDialog(false);
  };

  const goToPreviousStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
      setError('');
    }
  };

  const goToStep = (step) => {
    // 只能点击当前步骤或之前的步骤
    if (step <= currentStep) {
      setCurrentStep(step);
      setError('');
    } else {
      // 点击后面的步骤时显示警告弹窗
      setShowStepWarningDialog(true);
    }
  };

  const getRelationLabel = (relationId) => {
    const relation = relationTypes.find(r => r.id === relationId);
    return relation ? relation.label : relationId;
  };

  const getEventLabel = (eventId) => {
    const event = eventTypes.find(e => e.id === eventId);
    return event ? event.label : eventId;
  };

  const getTransactionTypeLabel = (typeId) => {
    const type = transactionTypes.find(t => t.id === typeId);
    return type ? type.label : typeId;
  };

  // 获取人物关系对应的颜色
  const getRelationColor = (relationId) => {
    switch(relationId) {
      case 'relative': return 'bg-red-100/20 text-red-300 border-red-200/30';
      case 'friend': return 'bg-green-100/20 text-green-300 border-green-200/30';
      case 'colleague': return 'bg-blue-100/20 text-blue-300 border-blue-200/30';
      case 'classmate': return 'bg-purple-100/20 text-purple-300 border-purple-200/30';
      default: return 'bg-gray-100/20 text-gray-300 border-gray-200/30';
    }
  };

  // 获取事件类型对应的颜色
  const getEventColor = (eventId) => {
    switch(eventId) {
      case 'wedding': return 'bg-pink-100/20 text-pink-300 border-pink-200/30';
      case 'birth': return 'bg-blue-100/20 text-blue-300 border-blue-200/30';
      case 'graduation': return 'bg-purple-100/20 text-purple-300 border-purple-200/30';
      case 'birthday': return 'bg-yellow-100/20 text-yellow-300 border-yellow-200/30';
      case 'moving': return 'bg-orange-100/20 text-orange-300 border-orange-200/30';
      case 'funeral': return 'bg-gray-100/20 text-gray-300 border-gray-200/30';
      case 'casual': return 'bg-teal-100/20 text-teal-300 border-teal-200/30';
      case 'other': return 'bg-slate-100/20 text-slate-300 border-slate-200/30';
      default: return 'bg-gray-100/20 text-gray-300 border-gray-200/30';
    }
  };

  // 获取收支类型对应的颜色
  const getTransactionTypeColor = (typeId) => {
    switch(typeId) {
      case 'income': return 'bg-green-100/20 text-green-300 border-green-200/30';
      case 'expense': return 'bg-red-100/20 text-red-300 border-red-200/30';
      default: return 'bg-gray-100/20 text-gray-300 border-gray-200/30';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">智能记录面板</h1>
          <p className="text-gray-500">四步完成，轻松记录人情往来</p>
        </div>
        <div className="flex space-x-2">
          {currentStep > 1 && (
            <Button 
              variant="outline" 
              onClick={goToPreviousStep}
              className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
            >
              <ArrowLeft className="w-4 h-4 mr-1" />
              上一步
            </Button>
          )}
          {currentStep > 1 && (
            <Button 
              variant="outline" 
              onClick={resetForm}
              className="bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
            >
              重新开始
            </Button>
          )}
        </div>
      </div>

      {error && (
        <Alert className="border-red-200 bg-red-50">
          <AlertDescription className="text-red-600">
            {error}
          </AlertDescription>
        </Alert>
      )}



      {/* 步骤指示器 */}
      <div className="flex items-center justify-center mb-8">
        {[1, 2, 3, 4].map((step) => (
          <React.Fragment key={step}>
            <div 
              className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-200 ${
                currentStep === step 
                  ? 'step-active text-white cursor-pointer hover:scale-110' 
                  : currentStep > step
                  ? 'step-completed text-white cursor-pointer hover:scale-110'
                  : 'step-inactive cursor-not-allowed opacity-60'
              }`}
              onClick={() => goToStep(step)}
            >
              {step}
            </div>
            {step < 4 && (
              <div className={`w-16 h-1 ${
                currentStep >= step ? 'progress-line-active' : 'progress-line-inactive'
              }`} />
            )}
          </React.Fragment>
        ))}
      </div>

      {/* 第一步：选择人物关系 */}
      {currentStep === 1 && (
        <Card className="shadow-2xl border-0 hover:shadow-3xl transition-all duration-500 bg-gradient-to-br from-blue-600/15 via-indigo-600/12 to-purple-700/15 border border-blue-400/30 hover:border-blue-400/50 hover:scale-[1.02] transform">
          <CardHeader className="text-center bg-gradient-to-r from-blue-500/25 to-indigo-600/25 rounded-t-xl border-b border-blue-400/35 mx-0 -mt-6 mb-0 py-2 px-6 flex flex-col items-center justify-center">
            <CardTitle className="flex items-center justify-center space-x-2 text-white">
              <Users className="w-5 h-5 text-blue-400" />
              <span>第一步：选择人物关系分类</span>
            </CardTitle>
            <p className="text-blue-200">点击下方分类快速定位人群</p>
          </CardHeader>
          <CardContent className="p-4 -mt-7">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {relationTypes.map((relation) => {
                const Icon = relation.icon;
                return (
                  <Card 
                    key={relation.id}
                    className="cursor-pointer transition-all duration-300 bg-white/[0.03] rounded-xl border border-white/20 shadow-lg hover:bg-gradient-to-br hover:from-blue-500/10 hover:to-purple-500/10 hover:border-white/30 hover:shadow-xl hover:shadow-blue-500/20 hover:scale-[1.02] transform"
                    onClick={() => handleRelationSelect(relation.id)}
                  >
                    <CardContent className="p-6 text-center">
                      <Icon className={`w-12 h-12 mx-auto mb-3 ${
                        relation.id === 'relative' ? 'text-red-400' :
                        relation.id === 'friend' ? 'text-green-400' :
                        relation.id === 'colleague' ? 'text-blue-400' :
                        relation.id === 'classmate' ? 'text-purple-400' :
                        'text-orange-400'
                      }`} />
                      <h3 className="font-semibold text-lg text-white">{relation.label}</h3>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* 第二步：选择事件类型 */}
      {currentStep === 2 && (
        <Card className="shadow-2xl border-0 hover:shadow-3xl transition-all duration-500 bg-gradient-to-br from-emerald-600/15 via-teal-600/12 to-cyan-700/15 border border-emerald-400/30 hover:border-emerald-400/50 hover:scale-[1.02] transform">
          <CardHeader className="text-center bg-gradient-to-r from-emerald-400/10 to-teal-500/10 rounded-t-xl border-b border-emerald-300/25 mx-0 -mt-6 mb-0 py-2 px-6 flex flex-col items-center justify-center">
            <CardTitle className="flex items-center justify-center space-x-2 text-white">
              <Gift className="w-5 h-5 text-emerald-400" />
              <span>第二步：选择事件类型</span>
            </CardTitle>
            <p className="text-emerald-200">
              已选择：<Badge variant="outline" className={`ml-1 ${getRelationColor(selectedRelation)}`}>{getRelationLabel(selectedRelation)}</Badge>
            </p>
          </CardHeader>
          <CardContent className="p-4 -mt-7">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {eventTypes.map((event) => {
                const Icon = event.icon;
                return (
                  <Card 
                    key={event.id}
                    className="cursor-pointer transition-all duration-300 bg-white/[0.03] rounded-xl border border-white/20 shadow-lg hover:bg-gradient-to-br hover:from-emerald-500/10 hover:to-teal-500/10 hover:border-white/30 hover:shadow-xl hover:shadow-emerald-500/20 hover:scale-[1.02] transform"
                    onClick={() => handleEventSelect(event.id)}
                  >
                    <CardContent className="p-4 text-center">
                      <Icon className={`w-8 h-8 mx-auto mb-2 ${
                        event.id === 'wedding' ? 'text-pink-400' :
                        event.id === 'birth' ? 'text-blue-400' :
                        event.id === 'graduation' ? 'text-purple-400' :
                        event.id === 'birthday' ? 'text-yellow-400' :
                        event.id === 'moving' ? 'text-orange-400' :
                        event.id === 'funeral' ? 'text-gray-400' :
                        event.id === 'casual' ? 'text-teal-400' :
                        event.id === 'other' ? 'text-slate-400' :
                        'text-emerald-400'
                      }`} />
                      <h3 className="font-semibold text-sm text-white">{event.label}</h3>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* 第三步：选择收支类型 */}
      {currentStep === 3 && (
        <Card className="shadow-2xl border-0 hover:shadow-3xl transition-all duration-500 bg-gradient-to-br from-amber-600/15 via-orange-600/12 to-yellow-700/15 border border-amber-400/30 hover:border-amber-400/50 hover:scale-[1.02] transform">
          <CardHeader className="text-center bg-gradient-to-r from-amber-500/10 to-orange-600/10 rounded-t-xl border-b border-amber-400/35 mx-0 -mt-6 mb-0 py-2 px-6 flex flex-col items-center justify-center">
            <CardTitle className="flex items-center justify-center space-x-2 text-white">
              <DollarSign className="w-5 h-5 text-amber-400" />
              <span>第三步：选择收支类型</span>
            </CardTitle>
            <p className="text-amber-200">
              已选择：
              <Badge variant="outline" className={`ml-1 mr-1 ${getRelationColor(selectedRelation)}`}>{getRelationLabel(selectedRelation)}</Badge>
              <Badge variant="outline" className={`ml-1 ${getEventColor(selectedEvent)}`}>{getEventLabel(selectedEvent)}</Badge>
            </p>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-md mx-auto">
              {transactionTypes.map((type) => {
                const Icon = type.icon;
                return (
                  <Card 
                    key={type.id}
                    className="cursor-pointer transition-all duration-300 bg-white/[0.03] rounded-xl border border-white/20 shadow-lg hover:bg-gradient-to-br hover:from-amber-500/10 hover:to-orange-500/10 hover:border-white/30 hover:shadow-xl hover:shadow-amber-500/20 hover:scale-[1.02] transform"
                    onClick={() => handleTransactionTypeSelect(type.id)}
                  >
                    <CardContent className="p-6 text-center">
                      <Icon className={`w-12 h-12 mx-auto mb-3 ${
                        type.id === 'income' ? 'text-green-400' : 'text-red-400'
                      }`} />
                      <h3 className="font-semibold text-lg text-white">{type.label}</h3>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* 第四步：填写详细信息 */}
      {currentStep === 4 && (
        <Card className="shadow-2xl border-0 hover:shadow-3xl transition-all duration-500 bg-gradient-to-br from-purple-600/15 via-pink-600/12 to-rose-700/15 border border-purple-400/30 hover:border-purple-400/50 hover:scale-[1.02] transform">
          <CardHeader className="text-center bg-gradient-to-r from-purple-500/10 to-pink-600/10 rounded-t-xl border-b border-purple-400/35 mx-0 -mt-6 mb-0 py-2 px-6 flex flex-col items-center justify-center">
            <CardTitle className="flex items-center justify-center space-x-2 text-white">
              <Plus className="w-5 h-5 text-purple-400" />
              <span>第四步：填写详细信息</span>
            </CardTitle>
            <p className="text-purple-200">
              已选择：
              <Badge variant="outline" className={`ml-1 mr-1 ${getRelationColor(selectedRelation)}`}>{getRelationLabel(selectedRelation)}</Badge>
              <Badge variant="outline" className={`ml-1 mr-1 ${getEventColor(selectedEvent)}`}>{getEventLabel(selectedEvent)}</Badge>
              <Badge variant="outline" className={`ml-1 ${getTransactionTypeColor(selectedTransactionType)}`}>{getTransactionTypeLabel(selectedTransactionType)}</Badge>
            </p>
          </CardHeader>
          <CardContent className="p-4 -mt-7">
            <form onSubmit={handleFormSubmit} className="space-y-4 max-w-md mx-auto">
              <div>
                <Label htmlFor="person_name" className="text-white mb-2">姓名 *</Label>
                <Input
                  id="person_name"
                  name="person_name"
                  type="text"
                  placeholder="请输入姓名"
                  value={formData.person_name}
                  onChange={handleInputChange}
                  className="bg-white/[0.03] border border-white/20 text-white placeholder:text-white/70 !text-left"
                  required
                />
              </div>

              <div>
                <Label htmlFor="amount" className="text-white mb-2">金额 *</Label>
                <Input
                  id="amount"
                  name="amount"
                  type="number"
                  placeholder="请输入金额"
                  value={formData.amount}
                  onChange={handleInputChange}
                  className="bg-white/[0.03] border border-white/20 text-white placeholder:text-white/70 !text-left"
                  min="0"
                  step="0.01"
                  required
                />
              </div>

              <div>
                <Label htmlFor="event_date" className="text-white mb-2">日期 *</Label>
                <Input
                  id="event_date"
                  name="event_date"
                  type="date"
                  value={formData.event_date}
                  onChange={handleInputChange}
                  className="bg-white/[0.03] border border-white/20 text-white !text-left"
                  required
                />
              </div>

              <div>
                <Label htmlFor="notes" className="text-white mb-2">备注</Label>
                <Input
                  id="notes"
                  name="notes"
                  type="text"
                  placeholder="可选备注信息"
                  value={formData.notes}
                  onChange={handleInputChange}
                  className="bg-white/[0.03] border border-white/20 text-white placeholder:text-white/70 !text-left"
                />
              </div>

              <Button 
                type="submit" 
                className="w-full bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300"
              >
                确认信息
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {/* 确认信息弹窗 */}
      {showConfirmDialog && (
        <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
          <div className="w-full max-w-xs mx-4 shadow-2xl border-0 bg-gradient-to-br from-indigo-600/20 via-blue-600/15 to-cyan-700/20 border border-indigo-400/40 rounded-lg backdrop-blur-md transform transition-all duration-300 scale-100">
            <div className="text-center bg-gradient-to-r from-indigo-500/10 to-blue-600/10 rounded-t-lg border-b border-indigo-400/35 py-2 px-3">
              <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-1">
                <Check className="w-4 h-4 text-white" />
              </div>
              <h3 className="text-sm font-semibold text-white mb-0.5">确认记录信息</h3>
              <p className="text-xs text-indigo-200">请确认以下信息正确后开始录入</p>
            </div>
            <div className="p-3 space-y-2">
              <div className="space-y-1">
                 <div className="text-center">
                   <span className="text-white font-medium text-sm">{formData.person_name}</span>
                   <span className="text-indigo-200 text-xs ml-1">({getRelationLabel(selectedRelation)})</span>
                 </div>
                 <div className="text-center">
                   <span className={`font-bold text-base ${selectedTransactionType === 'income' ? 'text-green-400' : 'text-red-400'}`}>
                     {selectedTransactionType === 'income' ? '+' : '-'}¥{formData.amount}
                   </span>
                 </div>
                 <div className="text-center space-y-0">
                   <div className="text-indigo-200 text-xs">{getEventLabel(selectedEvent)} · {getTransactionTypeLabel(selectedTransactionType)}</div>
                   <div className="text-indigo-200 text-xs">{formData.event_date}</div>
                   {formData.notes && (
                     <div className="text-indigo-200 text-xs">备注：{formData.notes}</div>
                   )}
                 </div>
               </div>
              
              <div className="flex space-x-1.5">
                 <Button 
                   onClick={handleConfirmSubmit}
                   disabled={loading}
                   className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 py-1.5 text-xs"
                 >
                   <Check className="w-3 h-3 mr-0.5" />
                   {loading ? '录入中...' : '确认'}
                 </Button>
                 <Button 
                   onClick={() => setShowConfirmDialog(false)}
                   variant="outline"
                   className="flex-1 bg-white/[0.03] backdrop-blur-md border border-white/20 text-white hover:bg-white/[0.05] transition-all duration-300 transform hover:scale-105 py-1.5 text-xs"
                 >
                   <X className="w-3 h-3 mr-0.5" />
                   取消
                 </Button>
               </div>
            </div>
          </div>
        </div>
      )}

      {/* 成功确认弹窗 */}
      {showSuccessDialog && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50">
          <Card className="w-96 mx-4 shadow-2xl border-0 bg-gradient-to-br from-green-600/20 via-emerald-600/15 to-teal-700/20 border border-green-400/40 animate-pulse">
            <CardHeader className="text-center">
              <div className="mx-auto w-16 h-16 bg-green-500/20 backdrop-blur-md rounded-full flex items-center justify-center mb-4 border border-green-400/30">
                <Check className="w-8 h-8 text-green-400" />
              </div>
              <CardTitle className="text-xl font-bold text-white">操作成功！</CardTitle>
              <p className="text-green-200">记录已成功添加到家庭礼金簿</p>
            </CardHeader>
            <CardContent className="text-center">
              <div className="bg-white/[0.03] backdrop-blur-md p-4 rounded-xl border border-white/20 mb-4">
                <div className="text-sm text-green-200 space-y-1">
                  <div><span className="font-medium text-white">{formData.person_name}</span> 的 <span className="font-medium text-white">{getEventLabel(selectedEvent)}</span></div>
                  <div className={`font-bold text-lg ${
                    selectedTransactionType === 'income' ? 'text-green-400' : 'text-red-400'
                  }`}>
                    {selectedTransactionType === 'income' ? '+' : '-'}¥{formData.amount}
                  </div>
                  <div className="text-xs text-green-300">{formData.event_date}</div>
                </div>
              </div>
              <Button 
                onClick={() => {
                  setShowSuccessDialog(false);
                  resetForm();
                }}
                className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300"
              >
                <Home className="w-4 h-4 mr-2" />
                继续添加记录
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {/* 步骤警告弹窗 */}
      {showStepWarningDialog && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50">
          <Card className="w-80 mx-4 shadow-2xl border-0 bg-gradient-to-br from-orange-600/20 via-red-600/15 to-pink-700/20 border border-orange-400/40">
            <CardHeader className="text-center">
              <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-600 rounded-full flex items-center justify-center mx-auto mb-3">
                <X className="w-6 h-6 text-white" />
              </div>
              <CardTitle className="text-white mb-2">无法跳转</CardTitle>
              <p className="text-orange-200 text-sm">请按顺序完成前面的步骤后再进行下一步操作</p>
            </CardHeader>
            <CardContent className="text-center pb-6">
              <Button 
                onClick={() => setShowStepWarningDialog(false)}
                className="bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300"
              >
                我知道了
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default Record;

