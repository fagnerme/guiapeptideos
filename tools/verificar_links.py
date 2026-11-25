"""Verifica os links externos fixos do site (HTML, js/ e dados/). Falha só em 404/410 ou domínio inexistente;
bloqueios (403/429/5xx) e lentidão viram aviso, porque órgãos como FDA e gov.br barram robôs.
Uso: python tools/verificar_links.py"""
import concurrent.futures as cf
import pathlib
import re
import socket
import sys
import urllib.error
import urllib.request

RAIZ = pathlib.Path(__file__).resolve().parent.parent
URL = re.compile(r"""https?://[^\s"'<>)\\`]+""")
IGNORAR = ("localhost", "127.0.0.1", "fonts.googleapis", "fonts.gstatic", "pagead2.googlesyndication",
           "translate.google", "translate.googleapis", "w3.org", "schema.org", "fagnerme.github.io", "example.")
UA = {"User-Agent": "Mozilla/5.0 (compatible; GuiaPeptideosLinkCheck/1.0)"}
# Respondem 404 falso para robôs de datacenter (os links abrem normalmente no navegador)
BARRAM_ROBOS = ("www.fda.gov",)


def coletar():
    urls = {}
    arquivos = [*RAIZ.glob("*.html"), *RAIZ.glob("js/*.js"), *RAIZ.glob("dados/*.js")]
    for a in arquivos:
        for u in URL.findall(a.read_text(encoding="utf-8", errors="ignore")):
            u = u.rstrip(".,;")
            if "${" in u or "{" in u or any(i in u for i in IGNORAR) or u.count("/") < 3:
                continue
            urls.setdefault(u, a.name)
    return urls


def checar(u):
    for metodo in ("HEAD", "GET"):
        try:
            with urllib.request.urlopen(urllib.request.Request(u, headers=UA, method=metodo), timeout=20) as r:
                return u, r.status
        except urllib.error.HTTPError as e:
            if metodo == "HEAD" and e.code in (403, 405, 501):
                continue
            return u, e.code
        except (socket.timeout, TimeoutError):
            return u, "timeout"
        except urllib.error.URLError as e:
            return u, "dns" if isinstance(e.reason, socket.gaierror) else f"erro {e.reason}"
        except Exception as e:
            return u, f"erro {e}"
    return u, "?"


def main():
    urls = coletar()
    print(f"{len(urls)} links externos fixos")
    with cf.ThreadPoolExecutor(8) as ex:
        res = list(ex.map(checar, urls))
    quebrados = [(u, s) for u, s in res if s in (404, 410, "dns") and not (s == 404 and any(d in u for d in BARRAM_ROBOS))]
    avisos = [(u, s) for u, s in res if s != 200 and (u, s) not in quebrados and not (isinstance(s, int) and 200 <= s < 400)]
    for u, s in avisos:
        print(f"AVISO {s}: {u} ({urls[u]})")
    for u, s in quebrados:
        print(f"QUEBRADO {s}: {u} ({urls[u]})")
    sys.exit(1 if quebrados else 0)


if __name__ == "__main__":
    main()
