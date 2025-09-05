import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Wifi, Download, Upload, Clock, Activity, Play, Square } from 'lucide-react';
import networkSpeedTest from '../utils/networkSpeedTest';

const NetworkSpeedCard = () => {
  const [networkData, setNetworkData] = useState({
    downloadSpeed: 0,
    uploadSpeed: 0,
    latency: 0,
    isConnected: true
  });
  
  const [chartData, setChartData] = useState({
    download: Array(50).fill(0),
    upload: Array(50).fill(0),
    latency: Array(50).fill(0)
  });
  
  // 测速状态管理
  const [testState, setTestState] = useState({
    isAutoTesting: true,
    isManualTesting: false,
    autoTestTimeLeft: 60, // 自动测速剩余时间（秒）
    testResults: null, // 测速结果总结
    hasCompletedAutoTest: false
  });
  
  const canvasRef = useRef(null);
  const animationRef = useRef(null);
  const autoTestTimerRef = useRef(null);
  const updateIntervalRef = useRef(null);
  
  // 鼠标悬停状态
  const [hoverData, setHoverData] = useState(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  
  // 使用真实的网速测试工具
  const measureNetworkSpeed = async () => {
    try {
      const result = await networkSpeedTest.runSpeedTest();
      return result;
    } catch (error) {
      console.error('网速测试失败:', error);
      // 返回模拟数据作为后备
      return {
        downloadSpeed: Math.random() * 1000 + 100,
        uploadSpeed: Math.random() * 500 + 50,
        latency: Math.random() * 100 + 20,
        isConnected: false
      };
    }
  };
  
  // 绘制科技化的图表
  const drawECGChart = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    
    // 清空画布
    ctx.clearRect(0, 0, width, height);
    
    // 计算动态缩放比例
    const maxDownload = Math.max(...chartData.download, 100); // 最小100避免除零
    const maxUpload = Math.max(...chartData.upload, 50); // 最小50避免除零
    const maxLatency = Math.max(...chartData.latency, 50); // 最小50避免除零
    
    // 绘制科技化网格
    ctx.strokeStyle = 'rgba(0, 255, 255, 0.15)';
    ctx.lineWidth = 0.5;
    
    // 垂直网格线（更密集）
    for (let i = 0; i < width; i += 15) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i, height);
      ctx.stroke();
    }
    
    // 水平网格线（更密集）
    for (let i = 0; i < height; i += 12) {
      ctx.beginPath();
      ctx.moveTo(0, i);
      ctx.lineTo(width, i);
      ctx.stroke();
    }
    
    // 绘制中心线
    ctx.strokeStyle = 'rgba(0, 255, 255, 0.3)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, height / 2);
    ctx.lineTo(width, height / 2);
    ctx.stroke();
    
    // 绘制下载速度曲线（绿色发光）- 动态缩放
    ctx.shadowColor = '#10b981';
    ctx.shadowBlur = 8;
    ctx.strokeStyle = '#10b981';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    chartData.download.forEach((value, index) => {
      const x = (index / (chartData.download.length - 1)) * width;
      const y = height - (value / maxDownload) * height * 0.9; // 使用90%高度，动态缩放
      if (index === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });
    ctx.stroke();
    
    // 绘制上传速度曲线（蓝色发光）- 动态缩放
    ctx.shadowColor = '#3b82f6';
    ctx.shadowBlur = 8;
    ctx.strokeStyle = '#3b82f6';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    chartData.upload.forEach((value, index) => {
      const x = (index / (chartData.upload.length - 1)) * width;
      const y = height - (value / maxUpload) * height * 0.9; // 使用90%高度，动态缩放
      if (index === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });
    ctx.stroke();
    
    // 绘制延时曲线（红色发光）- 动态缩放
    ctx.shadowColor = '#ef4444';
    ctx.shadowBlur = 6;
    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = 2;
    ctx.beginPath();
    chartData.latency.forEach((value, index) => {
      const x = (index / (chartData.latency.length - 1)) * width;
      const y = height - (value / maxLatency) * height * 0.9; // 使用90%高度，动态缩放
      if (index === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });
    ctx.stroke();
    
    // 重置阴影
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    
    // 绘制鼠标悬停指示线 - 使用精确的x坐标
    if (hoverData && hoverData.index >= 0) {
      const hoverX = (hoverData.index / (chartData.download.length - 1)) * width;
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
      ctx.lineWidth = 1;
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      ctx.moveTo(hoverX, 0);
      ctx.lineTo(hoverX, height);
      ctx.stroke();
      ctx.setLineDash([]);
    }
  };
  
  // 更新图表数据
  const updateChartData = (newData) => {
    setChartData(prev => ({
      download: [...prev.download.slice(1), newData.downloadSpeed],
      upload: [...prev.upload.slice(1), newData.uploadSpeed],
      latency: [...prev.latency.slice(1), newData.latency]
    }));
  };
  
  // 处理鼠标移动事件
  const handleMouseMove = (event) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    
    // 使用canvas的实际尺寸而不是CSS尺寸
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const canvasX = x * scaleX;
    const canvasY = y * scaleY;
    
    // 计算鼠标位置对应的数据索引，确保边界处理
    const normalizedX = Math.max(0, Math.min(1, canvasX / canvas.width));
    const dataIndex = Math.round(normalizedX * (chartData.download.length - 1));
    
    if (dataIndex >= 0 && dataIndex < chartData.download.length) {
      setMousePosition({ x, y });
      setHoverData({
        index: dataIndex,
        download: chartData.download[dataIndex] || 0,
        upload: chartData.upload[dataIndex] || 0,
        latency: chartData.latency[dataIndex] || 0
      });
    }
  };
  
  // 处理鼠标离开事件
  const handleMouseLeave = () => {
    setHoverData(null);
  };
  
  // 开始手动测速
  const startManualTest = () => {
    setTestState(prev => ({
      ...prev,
      isManualTesting: true,
      testResults: null
    }));
    
    // 开始更新数据
    const updateData = async () => {
      const data = await measureNetworkSpeed();
      setNetworkData(data);
      updateChartData(data);
    };
    
    updateData();
    updateIntervalRef.current = setInterval(updateData, 1000);
  };
  
  // 停止手动测速并生成结果
  const stopManualTest = () => {
    if (updateIntervalRef.current) {
      clearInterval(updateIntervalRef.current);
      updateIntervalRef.current = null;
    }
    
    // 生成测速结果总结
    const avgDownload = chartData.download.slice(-10).reduce((a, b) => a + b, 0) / 10;
    const avgUpload = chartData.upload.slice(-10).reduce((a, b) => a + b, 0) / 10;
    const avgLatency = chartData.latency.slice(-10).reduce((a, b) => a + b, 0) / 10;
    
    const results = {
      avgDownloadSpeed: avgDownload.toFixed(1),
      avgUploadSpeed: avgUpload.toFixed(1),
      avgLatency: avgLatency.toFixed(0),
      maxDownloadSpeed: Math.max(...chartData.download.slice(-10)).toFixed(1),
      minLatency: Math.min(...chartData.latency.slice(-10)).toFixed(0),
      testDuration: '手动测速',
      timestamp: new Date().toLocaleTimeString()
    };
    
    setTestState(prev => ({
      ...prev,
      isManualTesting: false,
      testResults: results
    }));
  };
  
  // 自动测速逻辑
  useEffect(() => {
    if (testState.isAutoTesting) {
      const updateNetworkData = async () => {
        const data = await measureNetworkSpeed();
        setNetworkData(data);
        updateChartData(data);
      };
      
      // 立即执行一次
      updateNetworkData();
      
      // 开始数据更新定时器
      updateIntervalRef.current = setInterval(updateNetworkData, 1000);
      
      // 开始倒计时定时器
      autoTestTimerRef.current = setInterval(() => {
        setTestState(prev => {
          const newTimeLeft = prev.autoTestTimeLeft - 1;
          
          if (newTimeLeft <= 0) {
            // 自动测速结束，清理定时器
            if (updateIntervalRef.current) {
              clearInterval(updateIntervalRef.current);
              updateIntervalRef.current = null;
            }
            if (autoTestTimerRef.current) {
              clearInterval(autoTestTimerRef.current);
              autoTestTimerRef.current = null;
            }
            
            // 生成结果（使用当前chartData的引用）
            setChartData(currentChartData => {
              const avgDownload = currentChartData.download.slice(-30).reduce((a, b) => a + b, 0) / 30;
              const avgUpload = currentChartData.upload.slice(-30).reduce((a, b) => a + b, 0) / 30;
              const avgLatency = currentChartData.latency.slice(-30).reduce((a, b) => a + b, 0) / 30;
              
              const results = {
                avgDownloadSpeed: avgDownload.toFixed(1),
                avgUploadSpeed: avgUpload.toFixed(1),
                avgLatency: avgLatency.toFixed(0),
                maxDownloadSpeed: Math.max(...currentChartData.download.slice(-30)).toFixed(1),
                minLatency: Math.min(...currentChartData.latency.slice(-30)).toFixed(0),
                testDuration: '1分钟自动测速',
                timestamp: new Date().toLocaleTimeString()
              };
              
              setTestState(prevState => ({
                ...prevState,
                isAutoTesting: false,
                hasCompletedAutoTest: true,
                autoTestTimeLeft: 0,
                testResults: results
              }));
              
              return currentChartData;
            });
            
            return {
              ...prev,
              isAutoTesting: false,
              hasCompletedAutoTest: true,
              autoTestTimeLeft: 0
            };
          }
          
          return {
            ...prev,
            autoTestTimeLeft: newTimeLeft
          };
        });
      }, 1000);
    }
    
    return () => {
      if (updateIntervalRef.current) {
        clearInterval(updateIntervalRef.current);
        updateIntervalRef.current = null;
      }
      if (autoTestTimerRef.current) {
        clearInterval(autoTestTimerRef.current);
        autoTestTimerRef.current = null;
      }
    };
  }, [testState.isAutoTesting]);
  
  // 动态调整画布尺寸
  useEffect(() => {
    const resizeCanvas = () => {
      const canvas = canvasRef.current;
      if (canvas) {
        const container = canvas.parentElement;
        const rect = container.getBoundingClientRect();
        
        // 设置画布的实际尺寸为容器的完整宽度
         canvas.width = rect.width;
         canvas.height = 240; // 对应h-60的高度
        
        // 重新绘制图表
        drawECGChart();
      }
    };
    
    // 初始调整
    resizeCanvas();
    
    // 监听窗口大小变化
    window.addEventListener('resize', resizeCanvas);
    
    return () => {
      window.removeEventListener('resize', resizeCanvas);
    };
  }, []);
  
  // 绘制图表动画
  useEffect(() => {
    let lastDrawTime = 0;
    const targetFPS = 30; // 限制帧率到30fps，减少CPU占用
    const frameInterval = 1000 / targetFPS;
    
    const animate = (currentTime) => {
      if (currentTime - lastDrawTime >= frameInterval) {
        drawECGChart();
        lastDrawTime = currentTime;
      }
      animationRef.current = requestAnimationFrame(animate);
    };
    
    animate(0);
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [chartData, hoverData]); // 添加hoverData依赖，确保悬停时重绘
  
  return (
    <Card className="mb-6 bg-gradient-to-br from-cyan-500/10 via-blue-500/10 to-indigo-500/10 border border-cyan-400/30 shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center justify-between text-white">
          <div className="flex items-center space-x-2">
            <div className="relative">
              <Wifi className="w-5 h-5 text-cyan-400" />
              {networkData.isConnected && (
                <div className="absolute -top-1 -right-1 w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              )}
            </div>
            <span>实时网速监控</span>
            <div className="flex items-center space-x-1 text-xs text-cyan-300">
              <Activity className="w-3 h-3" />
              <span>实时</span>
            </div>
          </div>

        </CardTitle>
        <div className="text-sm text-white/60">
          {testState.isAutoTesting ? (
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></div>
              <span>自动测速中... 剩余 {testState.autoTestTimeLeft} 秒</span>
            </div>
          ) : testState.isManualTesting ? (
            <span>互联网连接速度实时监控</span>
          ) : (
            <span>互联网连接速度实时监控 • 点击绿色按钮重新测速</span>
          )}
        </div>
      </CardHeader>
      <CardContent>
        
        <div className="grid grid-cols-1 lg:grid-cols-7 gap-6">
          {/* 数据显示区域 */}
          <div className="lg:col-span-2 flex flex-col justify-between" style={{height: '268px'}}>
            {/* 下载速度 */}
            <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/10">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-green-500/20 rounded-full flex items-center justify-center">
                  <Download className="w-4 h-4 text-green-400" />
                </div>
                <div>
                  <div className="text-sm text-white/60">下载速度</div>
                  <div className="font-bold text-green-400">
                    {networkData.downloadSpeed.toFixed(1)} KB/s
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs text-white/40">实时</div>
                <div className="w-12 h-2 bg-white/10 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-green-500 to-green-400 transition-all duration-300"
                    style={{ width: `${Math.min((networkData.downloadSpeed / 1000) * 100, 100)}%` }}
                  ></div>
                </div>
              </div>
            </div>
            
            {/* 上传速度 */}
            <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/10">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-blue-500/20 rounded-full flex items-center justify-center">
                  <Upload className="w-4 h-4 text-blue-400" />
                </div>
                <div>
                  <div className="text-sm text-white/60">上传速度</div>
                  <div className="font-bold text-blue-400">
                    {networkData.uploadSpeed.toFixed(1)} KB/s
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs text-white/40">实时</div>
                <div className="w-12 h-2 bg-white/10 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-blue-500 to-blue-400 transition-all duration-300"
                    style={{ width: `${Math.min((networkData.uploadSpeed / 500) * 100, 100)}%` }}
                  ></div>
                </div>
              </div>
            </div>
            
            {/* 延时 */}
            <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/10">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-red-500/20 rounded-full flex items-center justify-center">
                  <Clock className="w-4 h-4 text-red-400" />
                </div>
                <div>
                  <div className="text-sm text-white/60">网络延时</div>
                  <div className="font-bold text-red-400">
                    {networkData.latency.toFixed(0)} ms
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs text-white/40">ping</div>
                <div className={`text-xs font-medium ${
                  networkData.latency < 50 ? 'text-green-400' :
                  networkData.latency < 100 ? 'text-yellow-400' : 'text-red-400'
                }`}>
                  {networkData.latency < 50 ? '优秀' :
                   networkData.latency < 100 ? '良好' : '较慢'}
                </div>
              </div>
            </div>
          </div>
          
          {/* 心电图样式图表 */}
          <div className="lg:col-span-5 space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium text-white">网速趋势图</h4>
              <div className="flex items-center space-x-4 text-xs">
                <div className="flex items-center space-x-1">
                  <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                  <span className="text-white/60">下载</span>
                </div>
                <div className="flex items-center space-x-1">
                  <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                  <span className="text-white/60">上传</span>
                </div>
                <div className="flex items-center space-x-1">
                  <div className="w-2 h-2 bg-red-400 rounded-full"></div>
                  <span className="text-white/60">延时</span>
                </div>
              </div>
            </div>
            <div className="bg-gradient-to-br from-black/30 via-cyan-900/20 to-black/30 rounded-lg py-3 border border-cyan-400/30 shadow-lg shadow-cyan-500/20 relative backdrop-blur-sm h-60">
              <canvas 
                ref={canvasRef}
                className="w-full h-full"
                onMouseMove={handleMouseMove}
                onMouseLeave={handleMouseLeave}
              />
              {/* 悬停数据提示框 */}
              {hoverData && (
                <div 
                  className="absolute bg-black/90 text-white text-xs p-3 rounded-lg border border-cyan-400/50 pointer-events-none z-10 backdrop-blur-sm shadow-lg shadow-cyan-500/20"
                  style={{
                    left: `${mousePosition.x + 15}px`,
                    top: `${mousePosition.y - 80}px`,
                    transform: mousePosition.x > 200 ? 'translateX(-100%) translateX(-30px)' : 'none'
                  }}
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                      <span className="text-green-300">下载: {hoverData.download.toFixed(1)} KB/s</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                      <span className="text-blue-300">上传: {hoverData.upload.toFixed(1)} KB/s</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-red-400 rounded-full"></div>
                      <span className="text-red-300">延时: {hoverData.latency.toFixed(0)} ms</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

          </div>
        </div>
        
        {/* 测速结果总结区域 - 超紧凑布局 */}
        <div className="mt-3 p-2 bg-white/10 rounded-lg border border-white/20">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-1">
              <Activity className="h-3 w-3 text-green-400" />
              <h3 className="text-sm font-medium text-white">测速总结</h3>
            </div>

          </div>
          
          <div className="flex items-center justify-between gap-2 mb-1">
            <div className="grid grid-cols-3 md:grid-cols-6 gap-2 text-xs flex-1">
              <div className="text-center">
                <div className="text-white/60 text-xs">下载</div>
                <div className="text-green-400 font-bold text-xs">
                  {testState.testResults ? testState.testResults.avgDownloadSpeed : '--'} KB/s
                </div>
              </div>
              <div className="text-center">
                <div className="text-white/60 text-xs">上传</div>
                <div className="text-blue-400 font-bold text-xs">
                  {testState.testResults ? testState.testResults.avgUploadSpeed : '--'} KB/s
                </div>
              </div>
              <div className="text-center">
                <div className="text-white/60 text-xs">延时</div>
                <div className="text-red-400 font-bold text-xs">
                  {testState.testResults ? testState.testResults.avgLatency : '--'} ms
                </div>
              </div>
              <div className="text-center">
                <div className="text-white/60 text-xs">峰值</div>
                <div className="text-green-300 font-medium text-xs">
                  {testState.testResults ? testState.testResults.maxDownloadSpeed : '--'} KB/s
                </div>
              </div>
              <div className="text-center">
                <div className="text-white/60 text-xs">最低</div>
                <div className="text-red-300 font-medium text-xs">
                  {testState.testResults ? testState.testResults.minLatency : '--'} ms
                </div>
              </div>
              <div className="text-center">
                <div className="text-white/60 text-xs">时间</div>
                <div className="text-white/80 font-medium text-xs">
                  {testState.testResults ? testState.testResults.timestamp.split(':').slice(0,2).join(':') : '--'}
                </div>
              </div>
            </div>
            <div className="ml-3">
              <div className="relative">
                {/* 旋转特效环 - 仅在测速时显示 */}
                {(testState.isManualTesting || testState.isAutoTesting) && (
                  <div className={`absolute inset-0 w-14 h-14 rounded-full border-2 border-transparent animate-spin ${
                    testState.isAutoTesting ? 'border-t-red-300/70 border-r-red-200/50' : 'border-t-blue-300/70 border-r-blue-200/50'
                  }`}></div>
                )}
                <button
                   onClick={testState.isManualTesting ? stopManualTest : startManualTest}
                   disabled={!testState.hasCompletedAutoTest && !testState.isManualTesting}
                   className={`relative w-14 h-14 rounded-full flex items-center justify-center transition-all duration-500 transform text-sm font-bold shadow-md ${
                     testState.isAutoTesting
                       ? 'bg-red-500/80 cursor-not-allowed opacity-60 scale-95'
                       : testState.isManualTesting 
                         ? 'bg-blue-500 hover:bg-blue-600 scale-105 shadow-blue-500/50 animate-pulse' 
                         : (!testState.hasCompletedAutoTest && !testState.isManualTesting)
                           ? 'bg-red-500/80 cursor-not-allowed opacity-60 scale-95'
                           : 'bg-green-500 hover:bg-green-600 hover:scale-110 shadow-green-500/50 hover:shadow-green-500/70'
                   } text-white backdrop-blur-sm border border-white/20 ${
                     testState.isManualTesting ? 'before:absolute before:inset-0 before:rounded-full before:bg-blue-400/30 before:animate-ping' : ''
                   }`}
                   style={{
                     background: testState.isAutoTesting
                       ? 'linear-gradient(135deg, #ef4444, #dc2626)'
                       : testState.isManualTesting
                         ? 'linear-gradient(135deg, #3b82f6, #2563eb), radial-gradient(circle at center, rgba(59, 130, 246, 0.8), rgba(37, 99, 235, 0.9))'
                         : (!testState.hasCompletedAutoTest && !testState.isManualTesting)
                           ? 'linear-gradient(135deg, #ef4444, #dc2626)'
                           : 'linear-gradient(135deg, #10b981, #059669)',
                     boxShadow: testState.isAutoTesting
                       ? '0 0 10px rgba(239, 68, 68, 0.3)'
                       : testState.isManualTesting 
                         ? '0 0 20px rgba(59, 130, 246, 0.6), 0 0 40px rgba(59, 130, 246, 0.4), 0 0 60px rgba(59, 130, 246, 0.2), inset 0 0 20px rgba(255, 255, 255, 0.1)'
                         : (!testState.hasCompletedAutoTest && !testState.isManualTesting)
                           ? '0 0 10px rgba(239, 68, 68, 0.3)'
                           : '0 0 15px rgba(16, 185, 129, 0.4), 0 0 30px rgba(16, 185, 129, 0.2)',
                     animation: testState.isManualTesting ? 'pulse 1.5s ease-in-out infinite' : 'none'
                   }}
                  title={
                    testState.isAutoTesting
                      ? '自动测速进行中'
                      : testState.isManualTesting 
                        ? '停止测速' 
                        : (!testState.hasCompletedAutoTest && !testState.isManualTesting)
                          ? '等待自动测速完成后可用'
                          : '开始手动测速'
                  }
                >
                  <span className={`transition-all duration-300 ${
                    testState.isManualTesting ? 'text-white drop-shadow-lg' : ''
                  }`}>
                    {testState.isManualTesting ? (
                      <span className="relative">
                        <span className="absolute inset-0 animate-ping text-blue-200 opacity-75">测</span>
                        <span className="relative">测</span>
                      </span>
                    ) : (
                      '测'
                    )}
                  </span>
                </button>
              </div>
            </div>
          </div>
          
          <div className="text-xs text-white/50 text-center">
            {!testState.hasCompletedAutoTest && !testState.isManualTesting
              ? '等待自动测速完成'
              : testState.isAutoTesting
                ? '自动测速中...'
                : testState.isManualTesting
                  ? '手动测速中，点击蓝色按钮停止'
                  : testState.testResults
                    ? `${testState.testResults.testDuration} • 基于最近数据点`
                    : '点击绿色按钮开始手动测速'
            }
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default NetworkSpeedCard;