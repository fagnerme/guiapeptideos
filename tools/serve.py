"""Servidor local de desenvolvimento sem cache. Uso: python tools/serve.py [porta]"""
import http.server, sys, os, functools

class Handler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header("Cache-Control", "no-store")
        super().end_headers()

porta = int(sys.argv[1]) if len(sys.argv) > 1 else 8765
raiz = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
http.server.ThreadingHTTPServer(("", porta), functools.partial(Handler, directory=raiz)).serve_forever()
