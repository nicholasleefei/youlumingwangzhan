@echo off
REM 启动API服务器
cd /d "%~dp0.."
set PORT=22000
npm run server:dev
