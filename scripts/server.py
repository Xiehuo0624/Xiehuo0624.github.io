"""Local HTTP/HTTPS server with HTTP Range request support.

默认只监听 127.0.0.1；需要局域网访问时显式传 --lan。
"""

import http.server, ssl, os, re, subprocess, sys

class RangeHandler(http.server.SimpleHTTPRequestHandler):
    """SimpleHTTPRequestHandler with HTTP Range request support."""

    def end_headers(self):
        # 开发环境：HTML/JS/CSS 禁用缓存，保证手机等设备每次拿到最新代码；
        # 音频（m4a）保持可缓存，避免重复下载 17MB
        if self.path.split('?')[0].endswith(('.html', '.js', '.css')):
            self.send_header('Cache-Control', 'no-cache')
        super().end_headers()

    # 即使显式 --lan 也不对外提供这些路径/文件
    FORBIDDEN_NAMES = {'.git', '.gitignore', '.DS_Store', 'localhost-key.pem', 'localhost-cert.pem', 'tmp', 'docs', 'originals'}
    FORBIDDEN_NAMES_LOWER = {name.lower() for name in FORBIDDEN_NAMES}

    def is_forbidden(self, path):
        # 只检查服务器根目录之下的相对路径，避免把克隆路径中的父目录名
        # （例如 /tmp/website）误判为站点内的 tmp 资源；
        # macOS 默认文件系统大小写不敏感：必须按小写比较，否则
        # /scripts/LOCALHOST-KEY.PEM 会绕过黑名单直接命中真实文件。
        norm = os.path.abspath(path).replace('\\', '/').rstrip('/')
        root = os.path.abspath(self.directory)
        try:
            rel = os.path.relpath(norm, root).replace('\\', '/')
        except ValueError:
            return True
        if rel == '.':
            return False
        parts = [p for p in rel.split('/') if p]
        if '..' in parts or any(p.lower() in self.FORBIDDEN_NAMES_LOWER for p in parts):
            return True
        return os.path.basename(norm).lower() in self.FORBIDDEN_NAMES_LOWER

    def list_directory(self, path):
        # 本地预览不需要目录索引，也避免泄露目录内文件列表
        self.send_error(404, 'File not found')
        return None

    def send_head(self):
        path = self.translate_path(self.path)
        if self.is_forbidden(path):
            self.send_error(404, 'File not found')
            return None
        if os.path.isdir(path):
            index = os.path.join(path, 'index.html')
            if os.path.isfile(index):
                # 目录请求映射到 index.html（例如 / -> /index.html），同时保留查询串
                base, sep, query = self.path.partition('?')
                base = base.rstrip('/') + '/index.html'
                self.path = base + (sep + query if sep else '')
                return self.send_head()
            self.send_error(404, 'File not found')
            return None
        if 'Range' in self.headers:
            return self.send_range_head()
        return super().send_head()

    def send_range_head(self):
        path = self.translate_path(self.path)
        if self.is_forbidden(path):
            self.send_error(404, 'File not found')
            return None
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
        # 仅支持单段范围；完整匹配避免把多段范围静默截断成第一段
        m = re.fullmatch(r'bytes=(\d*)-(\d*)', range_header.strip())
        if not m or (not m.group(1) and not m.group(2)):
            f.close()
            self.send_error(416, 'Invalid Range')
            return None

        if not m.group(1):
            # 后缀范围：bytes=-N 表示文件末尾 N 字节
            suffix = int(m.group(2))
            if suffix <= 0 or size == 0:
                f.close()
                self.send_response(416)
                self.send_header('Content-Range', f'bytes */{size}')
                self.end_headers()
                return None
            start = max(0, size - suffix)
            end = size - 1
        else:
            start = int(m.group(1))
            # RFC 7233：end 超过文件末尾时截断到 size-1，而不是直接 416
            end = int(m.group(2)) if m.group(2) else size - 1
            end = min(end, size - 1)

        if start >= size or start > end:
            f.close()
            self.send_response(416)
            self.send_header('Content-Range', f'bytes */{size}')
            self.end_headers()
            return None

        length = end - start + 1
        f.seek(start)
        self._range_length = length

        self.send_response(206)
        self.send_header('Content-Type', ctype)
        self.send_header('Content-Range', f'bytes {start}-{end}/{size}')
        self.send_header('Content-Length', str(length))
        self.send_header('Accept-Ranges', 'bytes')
        self.send_header('Last-Modified', self.date_time_string(fs.st_mtime))
        self.end_headers()
        return f

    def copyfile(self, source, outputfile):
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


if __name__ == '__main__':
    args = sys.argv[1:]
    port = 8888
    for arg in args:
        if arg.isdigit():
            port = int(arg)
    use_ssl = '--ssl' in args or '--https' in args

    # 默认只监听本机；需要手机/局域网调试时显式加 --lan（或 --host=0.0.0.0）
    host = '127.0.0.1'
    if '--lan' in args:
        host = '0.0.0.0'
    for arg in args:
        if arg.startswith('--host='):
            # 空值（--host=）会绑定所有接口，与安全默认相悖；回退到本机
            host = arg.split('=', 1)[1] or '127.0.0.1'

    # Serve from project root (parent of scripts/)
    project_root = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
    os.chdir(project_root)

    server = http.server.ThreadingHTTPServer((host, port), RangeHandler)
    # 多线程：单个客户端连接卡住（如流式下载中暂停）时不再阻塞整个服务器

    display_host = 'localhost' if host == '127.0.0.1' else host
    if use_ssl:
        cert_dir = os.path.dirname(os.path.abspath(__file__))
        cert_path = os.path.join(cert_dir, 'localhost-cert.pem')
        key_path = os.path.join(cert_dir, 'localhost-key.pem')
        if not (os.path.isfile(cert_path) and os.path.isfile(key_path)):
            # key/cert 不入库：新克隆环境首次启用 HTTPS 时按 cnf 自动生成
            print('🔑 未找到本地证书/私钥，正在用 localhost-san.cnf 自动生成…', flush=True)
            try:
                subprocess.run([
                    'openssl', 'req', '-x509', '-newkey', 'rsa:2048', '-nodes',
                    '-keyout', key_path, '-out', cert_path, '-days', '825',
                    '-config', os.path.join(cert_dir, 'localhost-san.cnf'),
                ], check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
            except (OSError, subprocess.CalledProcessError):
                print('❌ 自动生成证书失败：请确认已安装 openssl，或手动生成 scripts/localhost-{key,cert}.pem', flush=True)
                raise
        context = ssl.SSLContext(ssl.PROTOCOL_TLS_SERVER)
        context.load_cert_chain(cert_path, key_path)
        server.socket = context.wrap_socket(server.socket, server_side=True)
        print(f'✅ HTTPS 服务已启动 (支持 Range 请求) — https://{display_host}:{port}', flush=True)
    else:
        print(f'✅ HTTP 服务已启动 (支持 Range 请求) — http://{display_host}:{port}', flush=True)

    server.serve_forever()
