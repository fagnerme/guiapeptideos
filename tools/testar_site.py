"""Teste de fumaça do site: abre páginas no navegador e falha se houver erro de JavaScript,
página sem título principal ou "Item não encontrado". Uso: python tools/testar_site.py
Requer: pip install playwright (e, no CI, playwright install --with-deps chromium)."""
import functools
import http.server
import pathlib
import random
import re
import sys
import threading

from playwright.sync_api import sync_playwright

RAIZ = pathlib.Path(__file__).resolve().parent.parent
PAGINAS = [
    "index.html", "api/index.html", "buscar.html?q=bpc", "calculadora.html", "calculadora.html#conv", "calculadora.html#raw",
    "meus-protocolos.html", "comparar.html?a=semaglutida&b=tirzepatida", "glossario.html", "seguranca.html",
    "sobre.html", "alvos.html", "classes.html", "quiz.html", "interacoes.html", "grafo.html", "corpo.html",
    "revisao.html", "estatisticas.html", "novidades.html", "sinais.html", "linha-do-tempo.html", "mecanismos.html",
    "duracao.html", "leituras.html", "consulta.html", "favoritos.html", "aprender.html", "como-usar.html",
    "privacidade.html", "alertas.html", "alegacoes.html", "mudancas.html", "quiz-familias.html", "404.html",
    "peptideo.html?p=semaglutida", "peptideo.html?p=diazepam", "buscar.html?q=mounjaro", "index.html?q=valium", "termo.html?t=agonista", "alvo.html?a=glp1r",
    "fichas/semaglutida.html", "comparar/semaglutida-vs-tirzepatida.html",
]
AMOSTRA_FICHAS = 15
AMOSTRA_COMPARACOES = 15


def amostra(pasta, n):
    arquivos = sorted((RAIZ / pasta).glob("*.html"))
    random.Random(7).shuffle(arquivos)
    return [f"{pasta}/{a.name}" for a in arquivos[:n]]


class Silencioso(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *args):
        pass


def main():
    servidor = http.server.ThreadingHTTPServer(("127.0.0.1", 0), functools.partial(Silencioso, directory=str(RAIZ)))
    base = f"http://127.0.0.1:{servidor.server_port}/"
    threading.Thread(target=servidor.serve_forever, daemon=True).start()
    paginas = PAGINAS + amostra("fichas", AMOSTRA_FICHAS) + amostra("comparar", AMOSTRA_COMPARACOES)
    falhas = []
    with sync_playwright() as p:
        try:
            navegador = p.chromium.launch()
        except Exception:
            navegador = p.chromium.launch(channel="msedge")
        ctx = navegador.new_context(viewport={"width": 390, "height": 800}, service_workers="block")
        for rel in paginas:
            pg = ctx.new_page()
            erros = []
            pg.on("pageerror", lambda e: erros.append(f"erro JS: {str(e)[:120]}"))
            pg.on("console", lambda m: erros.append(f"console: {m.text[:120]}") if m.type == "error" and (base in m.text or m.location.get("url", "").startswith(base) and not re.search(r"Access to fetch|Failed to load resource", m.text)) else None)
            pg.on("requestfailed", lambda r: erros.append(f"falhou: {r.url[:100]}") if r.url.startswith(base) else None)
            pg.on("response", lambda r: erros.append(f"HTTP {r.status}: {r.url[:100]}") if r.url.startswith(base) and r.status >= 400 and "favicon" not in r.url else None)
            try:
                pg.goto(base + rel, wait_until="load", timeout=20000)
                pg.wait_for_timeout(600)
                info = pg.evaluate("""() => ({
                    h1: document.querySelectorAll('h1').length,
                    naoEncontrado: !!document.querySelector('main')?.innerText.includes('Item não encontrado'),
                    sobraX: document.documentElement.scrollWidth - innerWidth })""")
                if info["h1"] < 1:
                    erros.append("sem título principal (h1)")
                if info["naoEncontrado"] and not rel.startswith("404"):
                    erros.append('mostra "Item não encontrado"')
                if info["sobraX"] > 0:
                    erros.append(f"rolagem lateral de {info['sobraX']}px no celular")
            except Exception as e:
                erros.append(f"não abriu: {str(e)[:100]}")
            pg.close()
            if erros:
                falhas.append((rel, sorted(set(erros))))
        navegador.close()
    servidor.shutdown()
    print(f"{len(paginas)} páginas testadas")
    for rel, erros in falhas:
        print(f"FALHA {rel}")
        for e in erros:
            print(f"  - {e}")
    sys.exit(1 if falhas else 0)


if __name__ == "__main__":
    main()
