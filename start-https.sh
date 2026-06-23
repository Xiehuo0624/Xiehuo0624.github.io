#!/bin/bash
# 启动本地预览服务（支持音频 Range 请求/进度条拖动）
# 默认 HTTP 8888 端口，加 --https 参数启用 HTTPS 4443 端口

cd "$(dirname "$0")"

if [[ "$1" == "--https" ]]; then
    PORT=4443
    python3 server.py $PORT --https
else
    PORT=8888
    python3 server.py $PORT
fi
