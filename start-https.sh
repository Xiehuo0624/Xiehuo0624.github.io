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

python3 -c "
import http.server, ssl, os, struct, re

class RangeHandler(http.server.SimpleHTTPRequestHandler):
    """SimpleHTTPRequestHandler with HTTP Range request support."""

    def send_head(self):
        # Check for Range header first
        if 'Range' in self.headers:
            return self.send_range_head()
        return super().send_head()

    def send_range_head(self):
        path = self.translate_path(self.path)
        if os.path.isdir(path):
            return super().send_head()

        ctype = self.guess_type(path)
        try:
            f = open(path, 'rb')
        except OSError:
            self.send_error(404, 'File not found')
            return None

        fs = os.fstat(f.fileno())
        size = fs.st_size

        range_header = self.headers['Range']
        m = re.match(r'bytes=(\d+)-(\d*)', range_header)
        if not m:
            f.close()
            self.send_error(416, 'Invalid Range')
            return None

        start = int(m.group(1))
        end = int(m.group(2)) if m.group(2) else size - 1

        if start >= size or end >= size or start > end:
            f.close()
            self.send_response(416)
            self.send_header('Content-Range', f'bytes */{size}')
            self.end_headers()
            return None

        length = end - start + 1
        f.seek(start)
        self._range_length = length  # store for copyfile

        self.send_response(206)
        self.send_header('Content-Type', ctype)
        self.send_header('Content-Range', f'bytes {start}-{end}/{size}')
        self.send_header('Content-Length', str(length))
        self.send_header('Accept-Ranges', 'bytes')
        self.send_header('Last-Modified', self.date_time_string(fs.st_mtime))
        self.end_headers()
        return f

    def copyfile(self, source, outputfile):
        # For range requests, only copy the requested portion
        if hasattr(self, '_range_length') and self._range_length:
            remaining = self._range_length
            while remaining > 0:
                chunk = source.read(min(8192, remaining))
                if not chunk:
                    break
                outputfile.write(chunk)
                remaining -= len(chunk)
            self._range_length = 0
        else:
            import shutil
            shutil.copyfileobj(source, outputfile)

context = ssl.SSLContext(ssl.PROTOCOL_TLS_SERVER)
context.load_cert_chain('localhost-cert.pem', 'localhost-key.pem')

server = http.server.HTTPServer(('127.0.0.1', $PORT), RangeHandler)
server.socket = context.wrap_socket(server.socket, server_side=True)
print('✅ HTTPS 服务已启动 (支持 Range 请求)', flush=True)
server.serve_forever()
" &

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
