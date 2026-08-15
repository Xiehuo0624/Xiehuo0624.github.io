#!/bin/bash
# 启动本地预览服务（支持音频 Range 请求/进度条拖动）
# 默认 HTTP 8888 端口，加 --https 参数启用 HTTPS 4443 端口。
# 需要手机在同一局域网访问时再加 --lan（server.py 默认只监听 127.0.0.1）。
# --https 在新克隆环境缺少 key/cert 时会由 server.py 按 localhost-san.cnf 自动生成。

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

HTTPS=0
LAN=0
for arg in "$@"; do
    [[ "$arg" == "--https" ]] && HTTPS=1
    [[ "$arg" == "--lan" ]] && LAN=1
done

PORT=8888
ARGS=()
if [[ $HTTPS == 1 ]]; then
    PORT=4443
    ARGS+=(--https)
fi
[[ $LAN == 1 ]] && ARGS+=(--lan)

python3 "$SCRIPT_DIR/server.py" "$PORT" "${ARGS[@]}"
