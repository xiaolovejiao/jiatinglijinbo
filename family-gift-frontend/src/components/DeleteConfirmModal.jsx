import React, { useState } from 'react';
import { Button } from './ui/button';
import { 
  Trash2, 
  X,
  Shield,
  MessageSquare
} from 'lucide-react';

const DeleteConfirmModal = ({ 
  isOpen, 
  onClose, 
  record, 
  currentUser,
  recordCreator,
  onConfirmDelete,
  onRequestDelete,
  loading = false
}) => {
  const [showSecondConfirm, setShowSecondConfirm] = useState(false);
  const [requestMessage, setRequestMessage] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [showError, setShowError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [showInfo, setShowInfo] = useState(false);
  const [infoMessage, setInfoMessage] = useState('');

  if (!isOpen || !record) return null;

  // 检查是否是当前用户创建的记录
  const isOwnRecord = record.user_id === currentUser?.id;

  // 格式化金额
  const formatAmount = (amount) => {
    return Math.abs(amount).toLocaleString();
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

  // 处理删除确认
  const handleDeleteConfirm = async () => {
    if (isOwnRecord) {
      if (!showSecondConfirm) {
        setShowSecondConfirm(true);
      } else {
        try {
          await onConfirmDelete(record.id);
          // 显示删除成功状态
          setSuccessMessage('记录删除成功！');
          setShowSuccess(true);
        } catch (error) {
          // 处理删除失败错误
          const errorMsg = error.message || '删除记录失败';
          setErrorMessage(errorMsg);
          setShowError(true);
          console.error('删除记录失败:', error);
        }
      }
    } else {
      // 发送删除请求给创建者
      try {
        await onRequestDelete(record.id, requestMessage);
        // 显示成功状态
        setSuccessMessage('删除请求已成功发送给记录创建者，请等待对方确认。');
        setShowSuccess(true);
      } catch (error) {
        // 处理重复请求错误
        const errorMsg = error.message || '发送删除请求失败';
        if (error.code === 'DUPLICATE_REQUEST') {
          // 重复请求显示为信息提示
          setInfoMessage(errorMsg);
          setShowInfo(true);
        } else {
          // 其他错误显示为错误提示
          setErrorMessage(errorMsg);
          setShowError(true);
        }
        console.error('发送删除请求失败:', error);
      }
    }
  };

  // 重置状态
  const handleClose = () => {
    setShowSecondConfirm(false);
    setRequestMessage('');
    setShowSuccess(false);
    setSuccessMessage('');
    setShowError(false);
    setErrorMessage('');
    setShowInfo(false);
    setInfoMessage('');
    onClose();
  };

  // 处理成功确认
  const handleSuccessConfirm = () => {
    setShowSuccess(false);
    setSuccessMessage('');
    setShowSecondConfirm(false);
    setRequestMessage('');
    // 如果是删除自己的记录成功，需要通知父组件关闭弹窗并清理状态
    if (isOwnRecord && successMessage === '记录删除成功！') {
      // 延迟关闭以确保用户看到成功消息
      setTimeout(() => {
        onClose();
      }, 100);
    } else {
      onClose();
    }
  };

  // 处理错误确认
  const handleErrorConfirm = () => {
    setShowError(false);
    setErrorMessage('');
  };

  // 处理信息确认
  const handleInfoConfirm = () => {
    setShowInfo(false);
    setInfoMessage('');
    onClose();
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
      <div className="w-full max-w-xs mx-4 shadow-2xl border-0 bg-gradient-to-br from-red-600/20 via-pink-600/15 to-rose-700/20 border border-red-400/40 rounded-lg backdrop-blur-md transform transition-all duration-300 scale-100">
        {showSuccess ? (
          // 成功状态显示
          <>
            <div className="text-center bg-gradient-to-r from-green-500/10 to-emerald-600/10 rounded-t-lg border-b border-green-400/35 py-2 px-3">
              <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-1">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-sm font-semibold text-white mb-0.5">
                {isOwnRecord && successMessage === '记录删除成功！' ? '删除成功' : '发送成功'}
              </h3>
              <p className="text-xs text-green-200">
                {isOwnRecord && successMessage === '记录删除成功！' ? '记录已成功删除' : '删除请求已成功发送'}
              </p>
            </div>
            <div className="p-4 space-y-4">
              <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-3">
                <div className="flex items-center space-x-2">
                  <div className="w-6 h-6 bg-green-500/20 rounded-full flex items-center justify-center flex-shrink-0">
                    <svg className="w-3 h-3 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div>
                    <div className="text-green-300 text-sm font-medium">
                      {isOwnRecord && successMessage === '记录删除成功！' ? '操作完成' : '请求已发送'}
                    </div>
                    <div className="text-green-200 text-xs">{successMessage}</div>
                  </div>
                </div>
              </div>
              <div className="flex justify-center pt-4 border-t border-white/10">
                <Button 
                  onClick={handleSuccessConfirm}
                  className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 py-3 px-6 text-sm"
                >
                  好的
                </Button>
              </div>
            </div>
          </>
        ) : showInfo ? (
          // 信息状态显示
          <>
            <div className="text-center bg-gradient-to-r from-blue-500/10 to-indigo-600/10 rounded-t-lg border-b border-blue-400/35 py-2 px-3">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center mx-auto mb-1">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-sm font-semibold text-white mb-0.5">
                温馨提示
              </h3>
              <p className="text-xs text-blue-200">
                请求状态提醒
              </p>
            </div>
            <div className="p-4 space-y-4">
              <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3">
                <div className="flex items-center space-x-2">
                  <div className="w-6 h-6 bg-blue-500/20 rounded-full flex items-center justify-center flex-shrink-0">
                    <svg className="w-3 h-3 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div>
                    <div className="text-blue-300 text-sm font-medium">请求状态</div>
                    <div className="text-blue-200 text-xs">{infoMessage}</div>
                  </div>
                </div>
              </div>
              <div className="flex justify-center pt-4 border-t border-white/10">
                <Button 
                  onClick={handleInfoConfirm}
                  className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 py-3 px-6 text-sm"
                >
                  我知道了
                </Button>
              </div>
            </div>
          </>
        ) : showError ? (
          // 错误状态显示
          <>
            <div className="text-center bg-gradient-to-r from-red-500/10 to-pink-600/10 rounded-t-lg border-b border-red-400/35 py-2 px-3">
              <div className="w-8 h-8 bg-gradient-to-br from-red-500 to-pink-600 rounded-full flex items-center justify-center mx-auto mb-1">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <h3 className="text-sm font-semibold text-white mb-0.5">
                发送失败
              </h3>
              <p className="text-xs text-red-200">
                删除请求发送失败
              </p>
            </div>
            <div className="p-4 space-y-4">
              <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3">
                <div className="flex items-center space-x-2">
                  <div className="w-6 h-6 bg-red-500/20 rounded-full flex items-center justify-center flex-shrink-0">
                    <svg className="w-3 h-3 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div>
                    <div className="text-red-300 text-sm font-medium">请求失败</div>
                    <div className="text-red-200 text-xs">{errorMessage}</div>
                  </div>
                </div>
              </div>
              <div className="flex justify-center pt-4 border-t border-white/10">
                <Button 
                  onClick={handleErrorConfirm}
                  className="bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 py-3 px-6 text-sm"
                >
                  确定
                </Button>
              </div>
            </div>
          </>
        ) : (
          // 原有的删除确认界面
          <>
            <div className="text-center bg-gradient-to-r from-red-500/10 to-pink-600/10 rounded-t-lg border-b border-red-400/35 py-2 px-3">
              <div className={`w-8 h-8 bg-gradient-to-br ${
                isOwnRecord ? 'from-red-500 to-pink-600' : 'from-orange-500 to-red-600'
              } rounded-full flex items-center justify-center mx-auto mb-1`}>
                {isOwnRecord ? (
                  <Trash2 className="w-4 h-4 text-white" />
                ) : (
                  <Shield className="w-4 h-4 text-white" />
                )}
              </div>
              <h3 className="text-sm font-semibold text-white mb-0.5">
                {isOwnRecord ? '删除记录' : '删除请求'}
              </h3>
              <p className="text-xs text-red-200">
                {isOwnRecord ? '请确认删除以下记录信息' : '需要创建者授权删除此记录'}
              </p>
            </div>

        <div className="p-4 space-y-4">
          {/* 记录信息 */}
           <div className="mb-4">
             <h4 className="text-sm font-medium text-white mb-2">记录详情</h4>
             <div className="bg-white/[0.05] rounded-lg p-3 space-y-2">
               <div className="grid grid-cols-2 gap-3">
                 <div>
                   <div className="text-xs text-gray-400">描述</div>
                   <div className="text-sm text-white font-medium">{(record.description || '礼金记录').replace(/\s*-\s*$/, '')}</div>
                 </div>
                 <div>
                   <div className="text-xs text-gray-400">关系</div>
                   <div className="text-sm text-white">{getRelationText(record.related_person)}</div>
                 </div>
               </div>
               <div className="grid grid-cols-2 gap-3">
                 <div>
                   <div className="text-xs text-gray-400">金额</div>
                   <div className={`text-base font-bold ${
                     record.amount >= 0 ? 'text-green-400' : 'text-red-400'
                   }`}>
                     {record.amount < 0 ? '-' : ''}¥{formatAmount(record.amount)}
                   </div>
                 </div>
                 <div>
                   <div className="text-xs text-gray-400">类型</div>
                   <div className="text-xs font-medium px-2 py-1 rounded-full inline-block bg-blue-500/20 text-blue-400">
                     {getTypeText(record.type)}
                   </div>
                 </div>
               </div>
               <div>
                 <div className="text-xs text-gray-400">日期</div>
                 <div className="text-sm text-white">{new Date(record.event_date).toLocaleDateString('zh-CN')}</div>
               </div>
             </div>
           </div>

          {/* 创建者信息 */}
          <div className="mb-4 p-3 bg-white/[0.05] rounded-lg border border-white/20">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                {isOwnRecord ? (
                  <>
                    <div className="w-6 h-6 bg-blue-500/20 rounded-full flex items-center justify-center">
                      <svg className="w-3 h-3 text-blue-300" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div>
                      <div className="text-xs font-medium text-white">这是您创建的记录</div>
                      <div className="text-xs text-blue-200">账户：{currentUser?.username}{currentUser?.nickname && ` (${currentUser.nickname})`}</div>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="w-6 h-6 bg-orange-500/20 rounded-full flex items-center justify-center">
                      <svg className="w-3 h-3 text-orange-300" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div>
                      <div className="text-xs font-medium text-white">家庭成员创建的记录</div>
                      <div className="text-xs text-orange-200">
                        创建者：{recordCreator ? 
                          `${recordCreator.nickname || recordCreator.username}（${recordCreator.username}）` : 
                          '未知用户'
                        }
                      </div>
                    </div>
                  </>
                )}
              </div>
              <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                isOwnRecord ? 'bg-blue-500/20 text-blue-300' : 'bg-orange-500/20 text-orange-300'
              }`}>
                {isOwnRecord ? '自己' : '成员'}
              </div>
            </div>
          </div>

          {/* 警告信息 */}
           <div className="mb-4">
             {isOwnRecord ? (
               <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3">
                 <div className="flex items-center space-x-2">
                   <div className="w-6 h-6 bg-red-500/20 rounded-full flex items-center justify-center flex-shrink-0">
                     <svg className="w-3 h-3 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                       <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                     </svg>
                   </div>
                   <div>
                     <div className="text-red-300 text-sm font-medium">确认删除</div>
                     <div className="text-red-200 text-xs">删除后无法恢复，请谨慎操作</div>
                   </div>
                 </div>
               </div>
             ) : (
               <div className="bg-orange-500/10 border border-orange-500/30 rounded-lg p-3">
                 <div className="flex items-center space-x-2">
                   <div className="w-6 h-6 bg-orange-500/20 rounded-full flex items-center justify-center flex-shrink-0">
                     <svg className="w-3 h-3 text-orange-400" fill="currentColor" viewBox="0 0 20 20">
                       <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                     </svg>
                   </div>
                   <div>
                      <div className="text-orange-300 text-sm font-medium">需要授权</div>
                      <div className="text-orange-200 text-xs">需要家庭成员同意，将发送删除请求通知</div>
                    </div>
                 </div>
               </div>
             )}
           </div>

          {/* 删除请求消息（非自己创建的记录） */}
          {!isOwnRecord && (
            <div className="space-y-3 mb-6">
              <div>
                <label className="block text-sm font-medium text-white mb-2">删除说明（可选）</label>
                <textarea
                  value={requestMessage}
                  onChange={(e) => setRequestMessage(e.target.value)}
                  placeholder="请简要说明删除原因..."
                  className="w-full px-3 py-2 bg-white/[0.05] border border-white/20 rounded-lg text-white placeholder-white/50 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500/50 transition-all duration-200"
                  rows={3}
                  maxLength={100}
                />
                <div className="flex justify-between items-center mt-2">
                  <div className="text-xs text-white/60">此说明将发送给记录创建者</div>
                  <div className="text-xs text-white/50">
                    {requestMessage.length}/100
                  </div>
                </div>
              </div>
            </div>
          )}
          
          <div className="flex space-x-3 pt-4 border-t border-white/10">
            <Button 
              onClick={handleClose}
              variant="outline"
              className="flex-1 bg-white/[0.03] backdrop-blur-md border border-white/20 text-white hover:bg-white/[0.05] transition-all duration-300 transform hover:scale-105 py-3 text-sm"
            >
              <X className="w-4 h-4 mr-2" />
              取消
            </Button>
            <Button 
              onClick={handleDeleteConfirm}
              disabled={loading}
              className={`flex-1 ${isOwnRecord 
                ? 'bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700' 
                : 'bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700'
              } text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 py-3 text-sm disabled:opacity-50`}
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  {isOwnRecord ? (
                    <Trash2 className="w-4 h-4 mr-2" />
                  ) : (
                    <MessageSquare className="w-4 h-4 mr-2" />
                  )}
                  {isOwnRecord ? (showSecondConfirm ? '确认删除' : '删除') : '发送请求'}
                </>
              )}
            </Button></div>
          </div>
          </>
        )}
      </div>
    </div>
  );
};

export default DeleteConfirmModal;