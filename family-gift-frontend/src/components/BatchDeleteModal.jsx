import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { X, AlertTriangle, Users, User } from 'lucide-react';

const BatchDeleteModal = ({ 
  isOpen, 
  selectedRecords, 
  allRecords, 
  currentUser, 
  onConfirm, 
  onClose, 
  loading 
}) => {
  const [recordStats, setRecordStats] = useState({
    ownRecords: 0,
    othersRecords: {},
    totalOthers: 0
  });
  const [showResult, setShowResult] = useState(false);
  const [resultData, setResultData] = useState({
    deletedCount: 0,
    requestedCount: 0,
    requestedUsers: {}
  });

  // 计算记录统计
  useEffect(() => {
    if (!isOpen || !selectedRecords || !allRecords || !currentUser) return;

    const selectedRecordIds = Array.from(selectedRecords);
    const selectedRecordData = allRecords.filter(record => 
      selectedRecordIds.includes(record.id)
    );

    let ownCount = 0;
    const othersMap = {};

    selectedRecordData.forEach(record => {
      if (record.user_id === currentUser.id) {
        ownCount++;
      } else {
        const userId = record.user_id;
        const userName = record.creator_name || '未知用户';
        const userNickname = record.creator_nickname || userName;
        const displayName = `${userNickname}（${userName}）`;
        
        if (!othersMap[userId]) {
          othersMap[userId] = {
            name: displayName,
            count: 0
          };
        }
        othersMap[userId].count++;
      }
    });

    const totalOthers = Object.values(othersMap).reduce((sum, user) => sum + user.count, 0);

    setRecordStats({
      ownRecords: ownCount,
      othersRecords: othersMap,
      totalOthers
    });
  }, [isOpen, selectedRecords, allRecords, currentUser]);

  // 处理确认删除
  const handleConfirm = async () => {
    try {
      const result = await onConfirm(selectedRecords);
      setResultData(result);
      setShowResult(true);
    } catch (error) {
      console.error('批量删除失败:', error);
    }
  };

  // 关闭弹窗
  const handleClose = () => {
    setShowResult(false);
    setResultData({ deletedCount: 0, requestedCount: 0, requestedUsers: {} });
    onClose();
  };

  // 确认结果弹窗
  const handleResultConfirm = () => {
    handleClose();
  };

  if (!isOpen) return null;

  const hasOwnRecords = recordStats.ownRecords > 0;
  const hasOthersRecords = recordStats.totalOthers > 0;
  const othersUsers = Object.values(recordStats.othersRecords);

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
      <div className="w-full max-w-md mx-4 shadow-2xl border-0 bg-gradient-to-br from-orange-600/20 via-red-600/15 to-pink-700/20 border border-orange-400/40 rounded-lg backdrop-blur-md transform transition-all duration-300 scale-100 max-h-[90vh] overflow-y-auto">
        {!showResult ? (
          // 确认删除弹窗
          <>
            {/* 头部 */}
            <div className="text-center bg-gradient-to-r from-orange-500/10 to-red-600/10 rounded-t-lg border-b border-orange-400/35 py-3 px-4 relative">
              <div className={`w-10 h-10 bg-gradient-to-br ${
                hasOwnRecords && hasOthersRecords
                  ? 'from-orange-500 to-red-600'
                  : hasOwnRecords
                  ? 'from-red-500 to-pink-600'
                  : 'from-blue-500 to-indigo-600'
              } rounded-full flex items-center justify-center mx-auto mb-2`}>
                <AlertTriangle className="w-5 h-5 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-1">批量删除确认</h3>
              <p className="text-sm text-orange-200">请确认要删除的记录</p>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClose}
                className="absolute top-2 right-2 text-white/60 hover:text-white hover:bg-white/10 w-8 h-8 p-0"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            {/* 内容 */}
            <div className="p-4 space-y-4">
              {/* 统计信息 */}
              <div className="space-y-3">
                <div className="text-white/90 text-sm font-medium mb-3 text-center">选中记录统计</div>
                
                {hasOwnRecords && (
                  <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div className="w-6 h-6 bg-green-500/20 rounded-full flex items-center justify-center">
                          <User className="w-3 h-3 text-green-400" />
                        </div>
                        <span className="text-green-300 text-sm font-medium">自己的记录</span>
                      </div>
                      <span className="text-green-300 font-bold">{recordStats.ownRecords} 条</span>
                    </div>
                  </div>
                )}

                {hasOthersRecords && (
                  <div className="space-y-2">
                    <div className="bg-orange-500/10 border border-orange-500/30 rounded-lg p-3">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <div className="w-6 h-6 bg-orange-500/20 rounded-full flex items-center justify-center">
                            <Users className="w-3 h-3 text-orange-400" />
                          </div>
                          <span className="text-orange-300 text-sm font-medium">其他成员的记录</span>
                        </div>
                        <span className="text-orange-300 font-bold">{recordStats.totalOthers} 条</span>
                      </div>
                      {othersUsers.map((user, index) => (
                        <div key={index} className="flex items-center justify-between bg-orange-500/5 rounded-md p-2 ml-4">
                          <span className="text-orange-200 text-xs">{user.name}</span>
                          <span className="text-orange-200 text-xs font-medium">{user.count} 条</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* 操作说明 */}
              <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3">
                <div className="flex items-center space-x-2">
                  <div className="w-5 h-5 bg-yellow-500/20 rounded-full flex items-center justify-center flex-shrink-0">
                    <svg className="w-3 h-3 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="text-yellow-300 text-sm">
                    {hasOwnRecords && hasOthersRecords ? (
                      `确认删除自己的 ${recordStats.ownRecords} 条记录，并向其他成员发送 ${recordStats.totalOthers} 条删除请求？`
                    ) : hasOwnRecords ? (
                      `确认删除自己的 ${recordStats.ownRecords} 条记录？`
                    ) : (
                      `确认向其他成员发送 ${recordStats.totalOthers} 条删除请求？`
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* 按钮 */}
            <div className="flex justify-center space-x-3 p-4 border-t border-white/10">
              <Button
                variant="outline"
                onClick={handleClose}
                disabled={loading}
                className="bg-white/10 border-white/30 text-white hover:bg-white/20 px-6 py-2"
              >
                取消
              </Button>
              <Button
                onClick={handleConfirm}
                disabled={loading}
                className={`bg-gradient-to-r ${
                  hasOwnRecords && hasOthersRecords
                    ? 'from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700'
                    : hasOwnRecords
                    ? 'from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700'
                    : 'from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700'
                } text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 px-6 py-2`}
              >
                {loading ? (
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    <span>处理中...</span>
                  </div>
                ) : (
                  hasOwnRecords && hasOthersRecords
                    ? '确认删除并发送请求'
                    : hasOwnRecords
                    ? '确认删除'
                    : '发送请求'
                )}
              </Button>
            </div>
          </>
        ) : (
          // 结果弹窗
          <>
            {/* 头部 */}
            <div className="bg-gradient-to-r from-green-500/20 to-emerald-600/20 rounded-t-lg border-b border-green-400/30 p-6">
              <div className="flex items-center justify-center">
                <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center shadow-lg">
                  <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-4">
                  <h3 className="text-xl font-bold text-white">操作完成</h3>
                  <p className="text-sm text-green-200">批量删除操作已完成</p>
                </div>
              </div>
            </div>

            {/* 结果内容 */}
            <div className="p-6 space-y-4">
              <div className="space-y-3">
                {resultData.deletedCount > 0 && (
                  <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-green-500/20 rounded-full flex items-center justify-center">
                          <svg className="w-4 h-4 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <span className="text-green-300 font-medium">已删除自己的记录</span>
                      </div>
                      <span className="text-green-300 font-bold text-lg">{resultData.deletedCount} 条</span>
                    </div>
                  </div>
                )}
                
                {resultData.requestedCount > 0 && (
                  <div className="space-y-3">
                    <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-blue-500/20 rounded-full flex items-center justify-center">
                            <svg className="w-4 h-4 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                              <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                            </svg>
                          </div>
                          <span className="text-blue-300 font-medium">已发送删除请求</span>
                        </div>
                        <span className="text-blue-300 font-bold text-lg">{resultData.requestedCount} 条</span>
                      </div>
                      {Object.values(resultData.requestedUsers).map((user, index) => (
                        <div key={index} className="flex items-center justify-between bg-blue-500/5 rounded-lg p-3 ml-8">
                          <span className="text-blue-300/90 text-sm">{user.name}</span>
                          <span className="text-blue-300/90 text-sm font-medium">{user.count} 条</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* 确认按钮 */}
            <div className="flex justify-center p-6 border-t border-white/10">
              <Button
                onClick={handleResultConfirm}
                className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 px-8 py-2"
              >
                确认
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default BatchDeleteModal;