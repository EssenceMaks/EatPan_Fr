"""
No-cache HTTP server for development.
Serves files with Cache-Control: no-store, no-cache headers
to prevent browser caching of JS modules during development.
"""
import http.server
import sys

class NoCacheHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0')
        self.send_header('Pragma', 'no-cache')
        self.send_header('Expires', '0')
        super().end_headers()

if __name__ == '__main__':
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 6800
    print(f'[DEV] No-cache dev server on http://localhost:{port}')
    server = http.server.HTTPServer(('', port), NoCacheHandler)
    server.serve_forever()
