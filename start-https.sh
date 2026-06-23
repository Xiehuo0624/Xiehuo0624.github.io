#!/bin/bash
# 启动 HTTPS 本地预览服务
# 浏览器访问地址：https://localhost:4443

cd "$(dirname "$0")"

PORT=4443

# 检查端口是否已被占用
if lsof -i :$PORT > /dev/null 2>&1; then
    echo "⚠️  端口 $PORT 已被占用，服务可能已在运行"
    echo "👉 浏览器访问：https://localhost:$PORT"
    exit 1
fi

python3 server.py $PORT &

sleep 1

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  ✅ HTTPS 服务已启动！"
echo ""
echo "  👉 浏览器访问：https://localhost:$PORT"
echo ""
echo "  首页：https://localhost:$PORT/index.html"
echo "  关于：https://localhost:$PORT/about.html"
echo ""
echo "  ⚠️  首次访问提示不安全，点击「高级」→「继续前往」即可"
echo "  🔊 支持音频 Range 请求（可拖动进度条）"
echo "  🛑 按 Ctrl+C 停止服务"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

wait
