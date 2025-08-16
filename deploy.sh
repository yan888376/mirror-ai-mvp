#!/bin/bash

echo "🚀 部署镜中探我AI版到Vercel..."

# 创建环境变量文件
echo "AI_GATEWAY_API_KEY=oiDiOFqX71GVxdY3qTG6tTcO" > .env.local

echo "✅ 环境变量已设置"

# 如果没有安装vercel cli，先安装
if ! command -v vercel &> /dev/null; then
    echo "📦 安装Vercel CLI..."
    npm i -g vercel
fi

# 部署到Vercel
echo "🌐 开始部署..."
vercel --prod

echo "🎉 部署完成！"
echo "📝 请复制上面显示的URL链接进行测试"
