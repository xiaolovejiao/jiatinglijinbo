@echo off
echo 正在启动家庭礼金簿后端服务...
echo.

REM 检查Node.js是否安装
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo 错误: 未检测到Node.js，请先安装Node.js
    pause
    exit /b 1
)

REM 检查是否已安装依赖
if not exist "node_modules" (
    echo 正在安装依赖包...
    npm install
    if %errorlevel% neq 0 (
        echo 错误: 依赖安装失败
        pause
        exit /b 1
    )
)

echo 启动后端服务...
echo 服务地址: http://localhost:5000
echo 按 Ctrl+C 停止服务
echo.

npm start

if %errorlevel% neq 0 (
    echo 错误: 服务启动失败
    pause
    exit /b 1
)

pause