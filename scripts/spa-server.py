#!/usr/bin/env python3
"""
SPA HTTP Server - Single Page Application Server with fallback to index.html
For client-side routing support
"""

import http.server
import socketserver
import os
from pathlib import Path

PORT = 5173
DIST_DIR = ".."

class SPAHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        # Add CORS headers for development
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Cache-Control', 'no-cache, no-store, must-revalidate')
        super().end_headers()

    def do_GET(self):
        # Get the requested path
        path = self.path.split('?')[0]

        # Check if file exists in dist
        dist_path = Path(self.directory) / path.lstrip('/')
        if dist_path.exists() and dist_path.is_file():
            # File exists - serve normally
            return super().do_GET()

        # For admin routes, check if should fallback to admin/index.html
        if path.startswith('/admin'):
            admin_index = Path(self.directory) / 'admin' / 'index.html'
            if admin_index.exists():
                self.path = '/admin/index.html'
                return super().do_GET()

        # Otherwise - fallback to index.html (SPA routing)
        self.path = '/index.html'
        return super().do_GET()

def main():
    # Get absolute path to dist directory
    script_dir = os.path.dirname(os.path.abspath(__file__))
    dist_dir = os.path.join(script_dir, '..', 'dist')
    os.chdir(dist_dir)
    print(f"Working directory: {os.getcwd()}")
    Handler = SPAHandler
    with socketserver.TCPServer(("", PORT), Handler) as httpd:
        print(f"Serving SPA from dist/ on http://localhost:{PORT}")
        print(f"SPA routing enabled: all non-file requests fallback to index.html")
        print(f"Admin routes fallback to admin/index.html")
        print("Press Ctrl+C to stop")
        print()
        httpd.serve_forever()

if __name__ == "__main__":
    main()
