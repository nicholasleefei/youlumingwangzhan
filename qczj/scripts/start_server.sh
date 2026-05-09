#!/bin/bash
# 启动API服务器
cd "$(dirname "$0")/.."
PORT=22000 npm run server:dev