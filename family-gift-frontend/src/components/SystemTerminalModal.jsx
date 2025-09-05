import React, { useState, useEffect, useRef } from 'react';
import { X, Terminal, Cpu, Database, Shield, Activity, CheckCircle, AlertCircle, Loader } from 'lucide-react';

const SystemTerminalModal = ({ isOpen, onClose, operation, onExecute }) => {
  const [logs, setLogs] = useState([]);
  const [isExecuting, setIsExecuting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState('idle'); // idle, running, success, error
  const [currentStep, setCurrentStep] = useState('');
  const logsEndRef = useRef(null);

  const scrollToBottom = () => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [logs]);

  // 当弹窗打开时重置所有状态
  useEffect(() => {
    if (isOpen) {
      setLogs([]);
      setIsExecuting(false);
      setProgress(0);
      setStatus('idle');
      setCurrentStep('');
    }
  }, [isOpen]);

  const addLog = (message, type = 'info', delay = 0) => {
    setTimeout(() => {
      const timestamp = new Date().toLocaleTimeString();
      
      // 打字机效果：逐字显示
      if (message.length > 20) {
        let currentText = '';
        const chars = message.split('');
        
        // 先添加空的日志条目
        const logId = Date.now() + Math.random();
        setLogs(prev => [...prev, { 
          id: logId, 
          timestamp, 
          message: '', 
          type 
        }]);
        
        // 逐字添加字符
        chars.forEach((char, index) => {
          setTimeout(() => {
            currentText += char;
            setLogs(prev => prev.map(log => 
              log.id === logId ? { ...log, message: currentText } : log
            ));
          }, index * 30); // 每个字符间隔30ms
        });
      } else {
        // 短文本直接显示
        setLogs(prev => [...prev, { 
          id: Date.now() + Math.random(), 
          timestamp, 
          message, 
          type 
        }]);
      }
    }, delay);
  };

  const simulateProgress = (steps, totalTime = 8000, skipProgressBar = false) => {
    let currentDelay = 0;
    
    steps.forEach((step, index) => {
      setTimeout(() => {
        setCurrentStep(step.message);
        
        // 只有在非数据库维护操作时才更新进度条
        if (!skipProgressBar) {
          // 设置更合理的进度，逐步增长而不是立即跳到90%
          const targetProgress = Math.round(((index + 1) / steps.length) * 85); // 分配85%给步骤，留15%给API结果
          setProgress(targetProgress);
        }
        
        addLog(step.message, step.type || 'info');
        
        // 计算主消息的打字机效果时间
        const mainMessageTime = step.message.length > 20 ? step.message.length * 30 : 0;
        
        if (step.details) {
          step.details.forEach((detail, detailIndex) => {
            // 等待主消息打字机效果完成后再显示详细信息
            const detailDelay = mainMessageTime + (detailIndex + 1) * 800;
            addLog(`  └─ ${detail}`, 'detail', detailDelay);
          });
          
          // 计算所有详细信息完成的时间
          const lastDetailTime = step.details[step.details.length - 1].length > 20 ? 
            step.details[step.details.length - 1].length * 30 : 0;
          const totalDetailTime = mainMessageTime + step.details.length * 800 + lastDetailTime;
          currentDelay += totalDetailTime + 1000; // 额外1秒间隔
        } else {
          // 没有详细信息时，只需等待主消息完成
          currentDelay += mainMessageTime + 1000; // 额外1秒间隔
        }
      }, currentDelay);
      
      // 为下一个步骤添加基础延迟
      const randomDelay = Math.random() * 1000 + 800; // 800-1800ms的随机延迟
      currentDelay += randomDelay;
    });
    
    // 返回总的执行时间，用于后续状态设置
    return currentDelay;
  };

  const executeOperation = async () => {
    setIsExecuting(true);
    setStatus('running');
    setLogs([]);
    setProgress(0);
    
    addLog('>>> 系统终端已启动', 'system');
    addLog('>>> 正在初始化安全连接...', 'system');
    addLog('>>> 验证管理员权限...', 'system');
    addLog('>>> 权限验证通过 ✓', 'success', 500);
    
    try {
      let steps = [];
      let apiEndpoint = '';
      let method = 'POST';
      
      switch (operation.type) {
        case 'maintenance':
          apiEndpoint = '/api/admin/database/maintenance';
          steps = [
            { message: '正在连接数据库...', type: 'warning', details: ['建立SQLite连接', '验证数据库完整性', '检查文件权限'] },
            { message: '└─ 数据库连接成功 ✓', type: 'success' },
            { message: '扫描数据库结构...', type: 'warning', details: ['读取表结构', '分析外键关系', '检查约束条件'] },
            { message: '正在获取数据库信息...', type: 'info', details: ['查询用户表数据', '统计家庭信息', '分析记录数据'] },
            { message: '清理过期数据...', type: 'warning', details: ['删除30天前的已读通知', '清理临时文件', '优化索引结构'] },
            { message: '执行VACUUM操作...', type: 'warning', details: ['重建数据库文件', '回收未使用空间', '优化查询性能'] }
          ];
          break;
          
        case 'backup':
          apiEndpoint = '/api/admin/system/backup';
          steps = [
            { message: '正在创建备份目录...', type: 'info', details: ['检查可用磁盘空间: 15.2GB', '创建时间戳目录', '设置文件权限'] },
            { message: '锁定数据库...', type: 'info', details: ['暂停写入操作', '等待事务完成', '创建一致性快照'] },
            { message: '└─ 当前活跃连接: 3个', type: 'info' },
            { message: '└─ 等待事务完成...', type: 'info' },
            { message: '复制数据文件...', type: 'info', details: ['复制主数据库文件 (8.7MB)', '备份配置文件', '压缩备份数据'] },
            { message: '└─ family_gift.db -> backup_2025-01-24T15-30-45.db', type: 'info' },
            { message: '└─ 压缩率: 73%，备份大小: 2.3MB', type: 'success' },
            { message: '验证备份完整性...', type: 'info', details: ['计算文件校验和', '测试备份可用性', '记录备份元数据'] },
            { message: '└─ MD5校验: a1b2c3d4e5f6...', type: 'success' },
            { message: '└─ 备份测试通过 ✓', type: 'success' },
            { message: '系统备份完成 ✓', type: 'success' }
          ];
          break;
          
        case 'logs':
          apiEndpoint = '/api/admin/system/logs';
          method = 'GET';
          steps = [
            { message: '正在连接日志服务...', type: 'info', details: ['建立安全连接', '验证访问权限', '初始化日志读取器'] },
            { message: '扫描日志文件...', type: 'info', details: ['检索系统日志', '分析错误记录', '统计性能指标'] },
            { message: '└─ 发现日志文件: app.log (156KB)', type: 'info' },
            { message: '└─ 发现日志文件: error.log (23KB)', type: 'info' },
            { message: '└─ 发现日志文件: access.log (89KB)', type: 'info' },
            { message: '解析日志数据...', type: 'info', details: ['格式化日志条目', '分类错误级别', '生成统计报告'] },
            { message: '└─ INFO级别: 1,247条', type: 'info' },
            { message: '└─ WARN级别: 23条', type: 'warning' },
            { message: '└─ ERROR级别: 3条', type: 'error' },
            { message: '└─ 最新错误: 数据库连接超时 (2025-01-24 14:32)', type: 'error' },
            { message: '准备显示界面...', type: 'info', details: ['渲染日志视图', '应用语法高亮', '启用实时更新'] },
            { message: '日志系统就绪 ✓', type: 'success' }
          ];
          break;
      }
      
      // 数据库维护操作使用自己的进度逻辑，其他操作使用模拟进度
      const skipProgressBar = operation.type === 'maintenance';
      const totalStepTime = simulateProgress(steps, 10000, skipProgressBar);
      
      // 执行实际的API调用
      setTimeout(async () => {
        try {
          const response = await fetch(apiEndpoint, {
            method,
            credentials: 'include',
            headers: {
              'Content-Type': 'application/json'
            }
          });
          
          if (response.ok) {
            const result = await response.json();
            
            // 如果是数据库维护操作，显示详细的扫描结果
            if (operation.type === 'maintenance' && result.scan_results) {
              const data = result;
              
              // 计算总的显示项目数量，用于进度计算
              let totalItems = 0;
              let currentItem = 0;
              
              // 计算总项目数
              totalItems += 1; // 数据库扫描结果标题
              if (data.scan_results && data.scan_results.database_info) {
                totalItems += 3; // 数据库文件信息3项
              }
              totalItems += 1; // 数据表详细信息标题
              
              if (data.scan_results && data.scan_results.tables) {
                data.scan_results.tables.forEach((table) => {
                  totalItems += 1; // 表名
                  if (table.name === 'users' && table.sample_records && table.sample_records.length > 0) {
                    totalItems += 1 + table.sample_records.length; // 用户数 + 每个用户
                    if (table.record_count > table.sample_records.length) totalItems += 1; // 剩余用户提示
                  } else if (table.name === 'families' && table.sample_records && table.sample_records.length > 0) {
                    totalItems += 1 + table.sample_records.length; // 家庭数 + 每个家庭
                    if (table.record_count > table.sample_records.length) totalItems += 1; // 剩余家庭提示
                  } else if (table.name === 'records' && table.sample_records && table.sample_records.length > 0) {
                    totalItems += 1 + table.sample_records.length; // 记录数 + 每条记录
                    if (table.record_count > table.sample_records.length) totalItems += 1; // 剩余记录提示
                  } else if (table.name === 'gift_records' && table.sample_records && table.sample_records.length > 0) {
                    totalItems += 1 + table.sample_records.length; // 礼金记录数 + 每条记录
                    if (table.record_count > table.sample_records.length) totalItems += 1; // 剩余记录提示
                  } else {
                    totalItems += 1; // 其他表记录数
                  }
                  totalItems += 1; // 表结构标题
                  if (table.schema && table.schema.length > 0) {
                    totalItems += table.schema.length; // 每个字段
                  }
                });
              }
              
              if (data.maintenance_actions && data.maintenance_actions.length > 0) {
                totalItems += 1 + data.maintenance_actions.length; // 维护操作结果标题 + 每个操作
              }
              totalItems += 1; // 最终完成消息
              
              // 逐条显示，每条间隔500ms
              let delay = 0;
              
              const addLogWithProgress = (message, type, delayMs = 500) => {
                setTimeout(() => {
                  addLog(message, type);
                  currentItem++;
                  const progress = Math.round((currentItem / totalItems) * 100);
                  setProgress(progress);
                }, delay);
                delay += delayMs;
              };
              
              addLogWithProgress('\n=== 数据库扫描结果 ===', 'header');
              
              if (data.scan_results && data.scan_results.database_info) {
                addLogWithProgress(`数据库文件: ${data.scan_results.database_info.file_path || '未知路径'}`, 'info');
                addLogWithProgress(`文件大小: ${data.scan_results.database_info.size || '未知大小'}`, 'info');
                addLogWithProgress(`最后修改: ${data.scan_results.database_info.last_modified || '未知时间'}`, 'info');
              }
              
              addLogWithProgress(`\n=== 数据表详细信息 ===`, 'header');
              
              if (data.scan_results && data.scan_results.tables) {
                data.scan_results.tables.forEach((table, tableIndex) => {
                  addLogWithProgress(`\n📊 表名: ${table.name || '未知表'} (${table.record_count || 0} 条记录)`, 'info');
                  
                  // 显示记录信息
                  if (table.name === 'users' && table.sample_records && table.sample_records.length > 0) {
                    addLogWithProgress(`└─ 发现用户数: ${table.record_count || 0}`, 'info');
                    
                    // 显示所有用户，不只是示例
                    table.sample_records.forEach((user, index) => {
                      const nickname = user.nickname || '未设置昵称';
                      const username = user.username || '未知用户';
                      addLogWithProgress(`   └─ ${nickname}（${username}）`, 'info');
                    });
                    
                    // 如果记录数大于示例数，显示提示
                    if (table.record_count > table.sample_records.length) {
                      addLogWithProgress(`   └─ ... 还有 ${table.record_count - table.sample_records.length} 个用户`, 'info');
                    }
                  } else if (table.name === 'families' && table.sample_records && table.sample_records.length > 0) {
                    addLogWithProgress(`└─ 发现家庭数: ${table.record_count || 0}`, 'info');
                    
                    table.sample_records.forEach((family, index) => {
                      const familyName = family.name || family.family_name || '未命名家庭';
                      const description = family.description ? ` - ${family.description}` : '';
                      addLogWithProgress(`   └─ ${familyName}${description}`, 'info');
                    });
                    
                    if (table.record_count > table.sample_records.length) {
                      addLogWithProgress(`   └─ ... 还有 ${table.record_count - table.sample_records.length} 个家庭`, 'info');
                    }
                  } else if (table.name === 'records' && table.sample_records && table.sample_records.length > 0) {
                    addLogWithProgress(`└─ 发现记录数: ${table.record_count || 0}`, 'info');
                    
                    table.sample_records.forEach((record, index) => {
                      const amount = record.amount ? `¥${record.amount}` : '金额未知';
                      const eventType = record.event_type || record.type || '未知事件';
                      const giverName = record.giver_name || record.name || record.related_person || '未知姓名';
                      addLogWithProgress(`   └─ ${giverName} ${amount} (${eventType})`, 'info');
                    });
                    
                    if (table.record_count > table.sample_records.length) {
                      addLogWithProgress(`   └─ ... 还有 ${table.record_count - table.sample_records.length} 条记录`, 'info');
                    }
                  } else if (table.name === 'gift_records' && table.sample_records && table.sample_records.length > 0) {
                    addLogWithProgress(`└─ 发现礼金记录数: ${table.record_count || 0}`, 'info');
                    
                    table.sample_records.forEach((record, index) => {
                      const amount = record.amount ? `¥${record.amount}` : '金额未知';
                      const eventType = record.event_type || '未知事件';
                      const giverName = record.giver_name || '未知姓名';
                      addLogWithProgress(`   └─ ${giverName} ${amount} (${eventType})`, 'info');
                    });
                    
                    if (table.record_count > table.sample_records.length) {
                      addLogWithProgress(`   └─ ... 还有 ${table.record_count - table.sample_records.length} 条礼金记录`, 'info');
                    }
                  } else {
                    addLogWithProgress(`└─ 发现${table.name || '未知表'}表记录数: ${table.record_count || 0}`, 'info');
                  }
                  
                  // 显示表结构
                  addLogWithProgress(`🔧 表结构:`, 'info');
                  
                  if (table.schema && table.schema.length > 0) {
                    table.schema.forEach((col, index) => {
                      const dataType = col.type || 'TEXT';
                      const nullable = col.notnull === 0 ? '可为空' : '不可为空';
                      const pk = col.pk === 1 ? ' [主键]' : '';
                      const colName = col.name || '未知字段';
                      addLogWithProgress(`   └─ ${colName}: ${dataType} (${nullable})${pk}`, 'info');
                    });
                  }
                });
              }
              
              // 显示维护操作结果
              if (data.maintenance_actions && data.maintenance_actions.length > 0) {
                addLogWithProgress(`\n=== 维护操作结果 ===`, 'header');
                data.maintenance_actions.forEach(action => {
                  const status = action.success ? '✓' : '✗';
                  const color = action.success ? 'success' : 'error';
                  addLogWithProgress(`${status} ${action.action}: ${action.result}`, color);
                });
              }
              
              // 最后显示完成消息
              addLogWithProgress('数据库维护完成 ✓', 'success');
              
              // 确保进度条达到100%并设置状态
              setTimeout(() => {
                setStatus('success');
                setProgress(100);
              }, delay);
              
            } else {
              // 非数据库维护操作的原有逻辑
              setStatus('success');
              addLog('>>> 操作执行成功', 'success');
              addLog(`>>> ${result.message || '任务完成'}`, 'success');
            }
            
            if (operation.type === 'logs' && result.logs) {
              // 为日志查看创建新窗口
              setTimeout(() => {
                const logWindow = window.open('', '_blank', 'width=1200,height=800,scrollbars=yes');
                logWindow.document.write(`
                  <html>
                    <head>
                      <title>系统日志终端 - 网络日志查看器</title>
                      <style>
                        * { margin: 0; padding: 0; box-sizing: border-box; }
                        body { 
                          font-family: 'Courier New', 'Monaco', monospace; 
                          background: linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 50%, #16213e 100%);
                          color: #00ff41; 
                          padding: 20px;
                          overflow-x: hidden;
                        }
                        .header {
                          border: 2px solid #00ff41;
                          padding: 15px;
                          margin-bottom: 20px;
                          background: rgba(0, 255, 65, 0.1);
                          border-radius: 8px;
                          text-align: center;
                        }
                        .header h1 {
                          color: #00ff41;
                          font-size: 24px;
                          text-shadow: 0 0 10px #00ff41;
                          margin-bottom: 10px;
                        }
                        .system-info {
                          display: grid;
                          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                          gap: 10px;
                          margin-bottom: 20px;
                          padding: 15px;
                          border: 1px solid #333;
                          border-radius: 8px;
                          background: rgba(0, 0, 0, 0.3);
                        }
                        .info-item {
                          color: #0ff;
                          font-size: 12px;
                        }
                        .log-container {
                          border: 2px solid #333;
                          border-radius: 8px;
                          background: rgba(0, 0, 0, 0.8);
                          padding: 15px;
                          max-height: 500px;
                          overflow-y: auto;
                        }
                        .log-entry {
                          margin-bottom: 8px;
                          padding: 8px;
                          border-left: 3px solid #00ff41;
                          background: rgba(0, 255, 65, 0.05);
                          border-radius: 4px;
                          font-size: 13px;
                          line-height: 1.4;
                        }
                        .log-timestamp {
                          color: #0ff;
                          margin-right: 10px;
                        }
                        .log-level-INFO { border-left-color: #00ff41; }
                        .log-level-WARN { border-left-color: #ffaa00; color: #ffaa00; }
                        .log-level-ERROR { border-left-color: #ff4444; color: #ff4444; }
                        .log-module {
                          color: #888;
                          font-size: 11px;
                          margin-left: 10px;
                        }
                        .blink { animation: blink 1s infinite; }
                        @keyframes blink { 0%, 50% { opacity: 1; } 51%, 100% { opacity: 0; } }
                        ::-webkit-scrollbar { width: 8px; }
                        ::-webkit-scrollbar-track { background: #1a1a1a; }
                        ::-webkit-scrollbar-thumb { background: #00ff41; border-radius: 4px; }
                      </style>
                    </head>
                    <body>
                      <div class="header">
                        <h1>◆ 网络日志查看器 ◆</h1>
                        <div style="color: #0ff; font-size: 14px;">实时系统监控终端 | 获取时间: ${result.fetch_time}</div>
                      </div>
                      
                      <div class="system-info">
                        <div class="info-item">运行时间: ${Math.floor(result.system_info?.uptime || 0)}秒</div>
                        <div class="info-item">Node版本: ${result.system_info?.node_version || 'N/A'}</div>
                        <div class="info-item">平台: ${result.system_info?.platform || 'N/A'}</div>
                        <div class="info-item">日志条数: ${result.log_count || 0}</div>
                        <div class="info-item">内存使用: ${Math.round((result.system_info?.memory_usage?.heapUsed || 0) / 1024 / 1024)}MB</div>
                        <div class="info-item">状态: <span style="color: #00ff41;">● ONLINE</span></div>
                      </div>
                      
                      <div class="log-container">
                        ${result.logs.map(log => `
                          <div class="log-entry log-level-${log.level}">
                            <span class="log-timestamp">[${new Date(log.timestamp).toLocaleTimeString()}]</span>
                            <span class="log-level">[${log.level}]</span>
                            <span class="log-message">${log.message}</span>
                            <span class="log-module">(${log.module})</span>
                          </div>
                        `).join('')}
                        <div style="color: #00ff41; margin-top: 15px; text-align: center;">
                          <span class="blink">█</span> 实时监控中...
                        </div>
                      </div>
                    </body>
                  </html>
                `);
                logWindow.document.close();
              }, 1000);
            }
            
            // 对于数据库维护操作，延迟设置isExecuting为false，等待数据显示完成
            if (operation.type === 'maintenance' && result.scan_results) {
              // 计算数据显示的总时间，基于数据项目数量
              let totalItems = 0;
              if (result.scan_results && result.scan_results.database_info) {
                totalItems += 3; // 数据库文件信息3项
              }
              if (result.scan_results && result.scan_results.tables) {
                result.scan_results.tables.forEach((table) => {
                  totalItems += 1; // 表名
                  if (table.sample_records && table.sample_records.length > 0) {
                    totalItems += 1 + table.sample_records.length; // 记录数 + 每条记录
                    if (table.record_count > table.sample_records.length) totalItems += 1; // 剩余提示
                  }
                });
              }
              const totalDisplayTime = Math.max(totalItems * 200, 3000); // 每项200ms，最少3秒
              setTimeout(() => {
                setCurrentStep('数据库维护完成 ✓');
                setProgress(100);
                setStatus('success');
                setIsExecuting(false);
              }, totalDisplayTime);
            } else {
              // 对于非数据库维护操作，等待所有步骤完成后再设置最终状态
              setTimeout(() => {
                setCurrentStep('操作完成 ✓');
                setProgress(100);
                // 延迟设置状态为成功，确保进度条先到100%
                setTimeout(() => {
                  setStatus('success');
                  setIsExecuting(false);
                }, 500); // 进度条到100%后再等待500ms设置状态
              }, Math.max(totalStepTime - 2000, 1000)); // 等待步骤完成，减去API调用的2秒延迟
            }
            
          } else {
            const error = await response.json().catch(() => ({}));
            setStatus('error');
            setCurrentStep('操作失败');
            setProgress(100);
            setIsExecuting(false);
            addLog('>>> 操作执行失败', 'error');
            addLog(`>>> 错误: ${error.error || '未知错误'}`, 'error');
          }
        } catch (error) {
          setStatus('error');
          setCurrentStep('网络连接失败');
          setProgress(100);
          setIsExecuting(false);
          addLog('>>> 网络连接错误', 'error');
          addLog(`>>> ${error.message}`, 'error');
        }
      }, 2000);
      
    } catch (error) {
      setStatus('error');
      setCurrentStep('操作失败');
      setProgress(100);
      addLog('>>> 系统错误', 'error');
      addLog(`>>> ${error.message}`, 'error');
      setIsExecuting(false);
    }
  };

  const getOperationIcon = () => {
    const colors = getThemeColors();
    switch (operation?.type) {
      case 'maintenance': return <Database className={`w-6 h-6 text-${colors.accent}`} />;
      case 'backup': return <Shield className={`w-6 h-6 text-${colors.accent}`} />;
      case 'logs': return <Activity className={`w-6 h-6 text-${colors.accent}`} />;
      default: return <Terminal className={`w-6 h-6 text-${colors.accent}`} />;
    }
  };

  const getOperationTitle = () => {
    switch (operation?.type) {
      case 'maintenance': return '数据库维护';
      case 'backup': return '系统备份';
      case 'logs': return '系统日志';
      default: return '系统终端';
    }
  };

  // 根据操作类型获取颜色主题
  const getThemeColors = () => {
    switch (operation?.type) {
      case 'maintenance': 
        return {
          primary: 'cyan-500',
          secondary: 'blue-500',
          accent: 'cyan-400',
          border: 'cyan-500/50',
          bg: 'cyan-500/20',
          shadow: 'cyan-500/20'
        };
      case 'backup': 
        return {
          primary: 'emerald-500',
          secondary: 'green-500',
          accent: 'emerald-400',
          border: 'emerald-500/50',
          bg: 'emerald-500/20',
          shadow: 'emerald-500/20'
        };
      case 'logs': 
        return {
          primary: 'purple-500',
          secondary: 'pink-500',
          accent: 'purple-400',
          border: 'purple-500/50',
          bg: 'purple-500/20',
          shadow: 'purple-500/20'
        };
      default: 
        return {
          primary: 'cyan-500',
          secondary: 'blue-500',
          accent: 'cyan-400',
          border: 'blue-500/50',
          bg: 'blue-500/20',
          shadow: 'blue-500/20'
        };
    }
  };

  const colors = getThemeColors();

  const getStatusColor = () => {
    switch (status) {
      case 'running': return 'text-blue-400';
      case 'success': return 'text-green-400';
      case 'error': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'running': return <Loader className="w-4 h-4 animate-spin" />;
      case 'success': return <CheckCircle className="w-4 h-4" />;
      case 'error': return <AlertCircle className="w-4 h-4" />;
      default: return <Cpu className="w-4 h-4" />;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className={`bg-gradient-to-br from-gray-900 via-black to-gray-900 border-2 border-${colors.border} rounded-2xl w-full max-w-4xl h-[600px] flex flex-col shadow-2xl shadow-${colors.shadow} relative overflow-hidden`}>
        {/* 头部 */}
        <div className={`flex items-center justify-between p-6 border-b border-${colors.border} relative z-10`}>
          <div className="flex items-center space-x-4">
            <div className={`p-3 bg-${colors.bg} rounded-xl border border-${colors.border}`}>
              {getOperationIcon()}
            </div>
            <div>
              <h2 className={`text-xl font-bold text-${colors.accent} font-mono`}>
                ◆ {getOperationTitle()} ◆
              </h2>
              <p className="text-gray-400 text-sm font-mono">
                网络安全终端 v2.1.0
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className={`flex items-center space-x-2 ${getStatusColor()}`}>
              {getStatusIcon()}
              <span className="text-sm font-mono uppercase">
                {status === 'idle' ? '就绪' : 
                 status === 'running' ? '运行中' :
                 status === 'success' ? '成功' :
                 status === 'error' ? '错误' : status}
              </span>
            </div>
            
            <button
              onClick={onClose}
              className="p-2 hover:bg-red-500/20 rounded-lg transition-colors border border-red-500/30 hover:border-red-500/50"
            >
              <X className="w-5 h-5 text-red-400" />
            </button>
          </div>
        </div>

        {/* 进度条 */}
        {(isExecuting || status === 'success' || status === 'error') && (
          <div className={`px-6 py-3 border-b border-${colors.border} bg-gray-900 flex-shrink-0`}>
            <div className="flex items-center justify-between mb-2">
              <span className={`text-${colors.accent} text-sm font-mono`}>
                执行进度{currentStep ? ` - ${currentStep}` : ''}
              </span>
              <span className={`text-${colors.accent} text-sm font-mono`}>{Math.round(progress)}%</span>
            </div>
            <div className="w-full bg-gray-800 rounded-full h-2 overflow-hidden">
              <div 
                className={`h-full bg-gradient-to-r from-${colors.primary} to-${colors.secondary} transition-all duration-300 ease-out`}
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        {/* 终端输出 */}
        <div className="flex-1 p-6 overflow-hidden">
          <div className="h-full bg-black/50 rounded-xl border border-gray-700 p-4 overflow-y-auto font-mono text-sm">
            {logs.map((log) => (
              <div key={log.id} className="mb-2 flex items-start space-x-3">
                <span className="text-gray-500 text-xs whitespace-nowrap">
                  [{log.timestamp}]
                </span>
                <span className={`flex-1 ${
                  log.type === 'system' ? 'text-cyan-400' :
                  log.type === 'success' ? 'text-green-400' :
                  log.type === 'error' ? 'text-red-400' :
                  log.type === 'warning' ? 'text-yellow-400' :
                  log.type === 'header' ? 'text-purple-400 font-bold' :
                  log.type === 'detail' ? 'text-gray-400 text-xs' :
                  'text-gray-300'
                }`}>
                  {log.message}
                </span>
              </div>
            ))}
            <div ref={logsEndRef} />
            
            {/* 光标 */}
            <div className="flex items-center space-x-2 mt-4">
              <span className={`text-${colors.accent}`}>管理员@系统:~$</span>
              <span className={`w-2 h-4 bg-${colors.accent} animate-pulse`} />
            </div>
          </div>
        </div>

        {/* 底部操作 */}
        <div className={`p-6 border-t border-${colors.border} flex justify-between items-center`}>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
              <span className="text-green-400 text-xs font-mono">安全连接</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" />
              <span className="text-blue-400 text-xs font-mono">管理员权限</span>
            </div>
          </div>
          
          <div className="flex space-x-3">
            <button
              onClick={onClose}
              className="px-6 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors font-mono"
            >
              关闭
            </button>
            <button
              onClick={executeOperation}
              disabled={isExecuting}
              className={`px-6 py-2 bg-gradient-to-r from-${colors.primary.replace('-500', '-600')} to-${colors.secondary.replace('-500', '-600')} hover:from-${colors.primary} hover:to-${colors.secondary} disabled:from-gray-600 disabled:to-gray-700 text-white rounded-lg transition-all font-mono flex items-center space-x-2`}
            >
              {isExecuting ? (
                <>
                  <Loader className="w-4 h-4 animate-spin" />
                  <span>执行中...</span>
                </>
              ) : (
                <>
                  <Terminal className="w-4 h-4" />
                  <span>执行</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SystemTerminalModal;