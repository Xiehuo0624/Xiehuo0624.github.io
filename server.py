"""Local HTTPS server with HTTP Range request support."""

import http.server, ssl, os, re, sys

class RangeHandler(http.server.SimpleHTTPRequestHandler):
    """SimpleHTTPRequestHandler with HTTP Range request support."""

    def send_head(self):
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
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 4443

    context = ssl.SSLContext(ssl.PROTOCOL_TLS_SERVER)
    context.load_cert_chain('localhost-cert.pem', 'localhost-key.pem')

    server = http.server.HTTPServer(('127.0.0.1', port), RangeHandler)
    server.socket = context.wrap_socket(server.socket, server_side=True)
    print(f'✅ HTTPS 服务已启动 (支持 Range 请求)', flush=True)
    server.serve_forever()
