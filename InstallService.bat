@echo off
cd /d %~dp0
call npm install --production
call npm run install-service
