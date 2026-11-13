"""Gera sitemap.xml e robots.txt. Uso: python tools/build.py https://seusite.com"""
import re, sys, unicodedata, pathlib
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))

raiz = pathlib.Path(__file__).resolve().parent.parent
site = (sys.argv[1] if len(sys.argv) > 1 else "https://fagnerme.github.io/guiapeptideos").rstrip("/")

def slug(nome):
    s = unicodedata.normalize("NFD", nome.lower())
    s = "".join(c for c in s if unicodedata.category(c) != "Mn")
    return re.sub(r"[^a-z0-9]+", "-", s).strip("-")

texto = (raiz / "data.js").read_text(encoding="utf-8")
nomes = re.findall(r'^\s*nome: "([^"]+)"', texto, re.M) + re.findall(r'^P\("([^"]+)"', texto, re.M)

import gerar_fichas
fichas, comps = gerar_fichas.gerar(site)
paginas = ["index.html", "privacidade.html"] + [f"ficha-{s}.html" for s in fichas] + comps
for extra in ["comparar.html", "aprender.html", "quiz.html", "linha-do-tempo.html", "novidades.html", "sobre.html",
              "buscar.html", "grafo.html", "mecanismos.html", "alegacoes.html", "seguranca.html", "estatisticas.html",
              "alertas.html", "mudancas.html", "revisao.html", "glossario.html", "consulta.html", "calculadora.html", "meus-protocolos.html", "como-usar.html", "quiz-familias.html",
              "leituras.html", "favoritos.html", "alvos.html", "corpo.html", "interacoes.html", "duracao.html", "classes.html", "sinais.html"]:
    if (raiz / extra).exists():
        paginas.append(extra)

paginas += [f"alvo.html?a={k}" for k in re.findall(r'^  "([a-z0-9-]+)": \{ nome', (raiz / "data-alvos.js").read_text(encoding="utf-8"), re.M)]

urls = "\n".join(f"  <url><loc>{site}/{p.replace('&', '&amp;')}</loc></url>" for p in paginas)
(raiz / "sitemap.xml").write_text(
    f'<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n{urls}\n</urlset>\n',
    encoding="utf-8")
(raiz / "robots.txt").write_text(f"User-agent: *\nAllow: /\nSitemap: {site}/sitemap.xml\n", encoding="utf-8")
print(f"{len(paginas)} URLs no sitemap")



# Injeta canonical, Open Graph, Twitter Card e JSON-LD (WebSite/Organization) no <head> de cada HTML.
import html as _h, json as _j
def _meta(t, nome):
    m = re.search(r'<meta name="%s" content="([^"]*)"' % nome, t)
    return m.group(1) if m else ""
for f in sorted(raiz.glob("*.html")):
    if f.name.startswith(("ficha-", "comparar-")):
        continue
    t = f.read_text(encoding="utf-8")
    t = re.sub(r'\n?<!--seo-->.*?<!--/seo-->', "", t, flags=re.S)
    tit = re.search(r"<title>(.*?)</title>", t, re.S)
    if not tit:
        continue
    tit = tit.group(1).strip()
    desc = _meta(t, "description")
    url = f"{site}/{f.name}"
    nome_site = "Guia Educativo de Pept\u00eddeos, Horm\u00f4nios e Suplementos"
    blocos = [
        f'<meta name="site-root" content="{site}">',
        f'<link rel="canonical" href="{url}">',
        '<meta property="og:type" content="website">',
        f'<meta property="og:site_name" content="{_h.escape(nome_site)}">',
        '<meta property="og:locale" content="pt_BR">',
        f'<meta property="og:title" content="{tit}">',
        f'<meta property="og:description" content="{desc}">',
        f'<meta property="og:url" content="{url}">',
        f'<meta property="og:image" content="{site}/icons/icon-512.png">',
        '<meta name="twitter:card" content="summary">',
    ]
    if f.name == "index.html":
        ld = [{"@context": "https://schema.org", "@type": "WebSite", "name": nome_site, "url": f"{site}/", "inLanguage": "pt-BR",
               "potentialAction": {"@type": "SearchAction", "target": f"{site}/buscar.html?q={{search_term_string}}", "query-input": "required name=search_term_string"}},
              {"@context": "https://schema.org", "@type": "Organization", "name": nome_site, "url": f"{site}/", "logo": f"{site}/icons/icon-512.png"}]
        blocos += [f'<script type="application/ld+json">{_j.dumps(o, ensure_ascii=False)}</script>' for o in ld]
    t = t.replace("</head>", "<!--seo-->\n" + "\n".join(blocos) + "\n<!--/seo-->\n</head>", 1)
    f.write_text(t, encoding="utf-8")
print("SEO injetado em", len(list(raiz.glob("*.html"))), "paginas")

# Desempenho: scripts com defer (nao bloqueiam a renderizacao) e traducoes (~800 KB) so baixadas quando o idioma nao e portugues.
LOADER = '<script>/*i18n-lazy*/if((localStorage.getItem("lang")||"pt")!=="pt")document.write(\'<script src="i18n-conteudo.js"><\\/script><script src="i18n-detalhes.js"><\\/script><script src="i18n-paginas.js"><\\/script>\')</script>'
for f in sorted(raiz.glob("*.html")):
    t = f.read_text(encoding="utf-8")
    t0 = t
    t = re.sub(r'<script>/\*i18n-lazy\*/.*?</script>\n?', "", t, flags=re.S) if "i18n-lazy" in t else t
    achou = []
    def sub(m):
        nome = m.group(1)
        if nome in ("i18n-conteudo.js", "i18n-detalhes.js", "i18n-paginas.js"):
            if not achou:
                achou.append(1)
                return LOADER
            return ""
        return f'<script defer src="{nome}"></script>'
    t = re.sub(r'<script(?: defer)? src="([^"]+)"></script>', sub, t)
    if t != t0:
        f.write_text(t, encoding="utf-8")
print("defer e i18n sob demanda aplicados")


# Regenera a lista de arquivos do service worker (offline) e muda a versao para renovar o cache.
import time
arqs = ["index.html", "style.css", "manifest.webmanifest", "data.js", "data-extra.js",
        "data-mecanismos.js", "revisoes.js", "aprovacoes.js", "core.js", "i18n.js",
        "app.js", "ads.js", "icons/icon-192.png"]
sw = (raiz / "sw.js").read_text(encoding="utf-8-sig")
sw = re.sub(r'const VERSAO = "[^"]*";', f'const VERSAO = "guia-{time.strftime("%Y%m%d%H%M")}";', sw)
sw = re.sub(r'const BASE = \[.*?\];', lambda m: "const BASE = " + __import__("json").dumps(arqs) + ";", sw, flags=re.S)
(raiz / "sw.js").write_text(sw, encoding="utf-8")
print(f"sw.js: shell essencial com {len(arqs)} arquivos; demais recursos entram no cache sob demanda")
