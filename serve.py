"""
EatPan Frontend — Local Dev Server
Run: python serve.py
Serves on http://localhost:6800 with correct MIME types for ES modules.
"""
import http.server
import socketserver

PORT = 6800

class ESModuleHandler(http.server.SimpleHTTPRequestHandler):
    extensions_map = {
        **http.server.SimpleHTTPRequestHandler.extensions_map,
        '.js': 'application/javascript',
        '.mjs': 'application/javascript',
        '.css': 'text/css',
        '.json': 'application/json',
        '.svg': 'image/svg+xml',
        '.woff': 'font/woff',
        '.woff2': 'font/woff2',
        '.html': 'text/html',
        '.md': 'text/markdown',
        '': 'application/octet-stream',
    }

    def end_headers(self):
        self.send_header('Cache-Control', 'no-cache, no-store, must-revalidate')
        self.send_header('Access-Control-Allow-Origin', '*')
        super().end_headers()

with socketserver.TCPServer(("", PORT), ESModuleHandler) as httpd:
    print(f"🍳 EatPan Dev Server running at http://localhost:{PORT}")
    print(f"   Press Ctrl+C to stop")
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\n👋 Server stopped.")
