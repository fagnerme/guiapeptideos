"""Gera uma pagina HTML estatica por item (ficha-<slug>.html) com o conteudo no proprio HTML (indexavel sem JavaScript).
Uso: python tools/gerar_fichas.py https://seusite.com  (chamado tambem por build.py)
Os dados vem do proprio site: um Edge headless executa os data-*.js e despeja o catalogo em JSON (tools/_pep.json)."""
import re, sys, json, html, shutil, subprocess, tempfile, unicodedata, pathlib, os

raiz = pathlib.Path(__file__).resolve().parent.parent
CACHE = raiz / "tools" / "_pep.json"
NOME_SITE = "Guia Educativo de Peptídeos, Hormônios e Suplementos"
SCRIPTS = ["data.js", "data-extra.js", "data-timeline.js", "data-mecanismos.js", "data-alegacoes.js", "data-mudancas.js",
           "historico.js", "aprovacoes.js", "data-vias.js", "data-alvos.js", "data-farmaco.js", "data-interacoes.js",
           "data-detalhes.js", "core.js"]

def slug(nome):
    s = unicodedata.normalize("NFD", nome.lower())
    s = "".join(c for c in s if unicodedata.category(c) != "Mn")
    return re.sub(r"[^a-z0-9]+", "-", s).strip("-")

def achar_edge():
    for c in [r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe", r"C:\Program Files\Microsoft\Edge\Application\msedge.exe",
              r"C:\Program Files\Google\Chrome\Application\chrome.exe"]:
        if os.path.exists(c):
            return c
    return shutil.which("msedge") or shutil.which("chromium") or shutil.which("google-chrome")

def despejar():
    edge = achar_edge()
    if not edge:
        return None
    tags = "".join(f'<script src="{s}"></script>' for s in SCRIPTS)
    pagina = raiz / "_dump.html"
    pagina.write_text('<!DOCTYPE html><html><head><meta charset="UTF-8"></head><body><pre id="o"></pre>' + tags +
                      '<script>document.getElementById("o").textContent="@@"+JSON.stringify({P:PEPTIDES,M:MECANISMOS})+"@@"</script></body></html>', encoding="utf-8")
    try:
        with tempfile.TemporaryDirectory() as perfil:
            r = subprocess.run([edge, "--headless=new", "--disable-gpu", f"--user-data-dir={perfil}", "--virtual-time-budget=8000",
                                "--dump-dom", pagina.as_uri()], capture_output=True, timeout=90)
        saida = r.stdout.decode("utf-8", "replace")
    finally:
        pagina.unlink(missing_ok=True)
    m = re.search(r'<pre id="o">@@(.*?)@@</pre>', saida, re.S)
    return json.loads(html.unescape(m.group(1))) if m else None

def carregar():
    dados = despejar()
    if dados:
        CACHE.write_text(json.dumps(dados, ensure_ascii=False), encoding="utf-8")
        return dados
    if CACHE.exists():
        print("AVISO: usando cache tools/_pep.json (Edge indisponivel)")
        return json.loads(CACHE.read_text(encoding="utf-8"))
    raise SystemExit("Sem navegador e sem cache: nao foi possivel ler o catalogo")

e = lambda t: html.escape(str(t or ""), quote=True)

def gerar(site):
    bruto = carregar()
    itens = bruto["P"] if isinstance(bruto, dict) else bruto
    familias = bruto.get("M", []) if isinstance(bruto, dict) else []
    modelo = (raiz / "peptideo.html").read_text(encoding="utf-8")
    resto = modelo[modelo.index('<header id="topo">'):]
    resto = re.sub(r'\n?<!--seo-->.*?<!--/seo-->', "", resto, flags=re.S)
    for f in raiz.glob("ficha-*.html"):
        f.unlink()
    ordenados = sorted(itens, key=lambda p: p["nome"].lower())
    for i, p in enumerate(ordenados):
        s = slug(p["nome"])
        url = f"{site}/ficha-{s}.html"
        desc = f'{p["nome"]}: {p.get("oQueFaz", "")} Fase: {p.get("fase", "")}. Conteúdo educativo.'.strip()
        titulo = f'{p["nome"]} — o que é, evidências e riscos | {NOME_SITE}'
        card = f"{site}/cards/{s}.png" if (raiz / "cards" / f"{s}.png").exists() else f"{site}/icons/icon-512.png"
        ld = [
            {"@context": "https://schema.org", "@type": "MedicalWebPage", "name": p["nome"], "description": desc, "inLanguage": "pt-BR",
             "url": url, "isPartOf": {"@type": "WebSite", "name": NOME_SITE, "url": f"{site}/"}, "about": {"@type": "Drug", "name": p["nome"]}},
            {"@context": "https://schema.org", "@type": "BreadcrumbList", "itemListElement": [
                {"@type": "ListItem", "position": 1, "name": "Início", "item": f"{site}/index.html"},
                {"@type": "ListItem", "position": 2, "name": p.get("categoria", ""), "item": f"{site}/index.html"},
                {"@type": "ListItem", "position": 3, "name": p["nome"], "item": url}]},
        ]
        secs = [("O que faz", "oQueFaz"), ("Mecanismo de ação", "mecanismo"), ("Benefícios observados nos estudos", "beneficios"),
                ("Nível de evidência", "evidencia"), ("Riscos", "riscos"), ("Protocolo / contexto de uso", "protocolo")]
        corpo = "".join(f"<section class=\"boas\"><h2>{t}</h2><p>{e(p.get(k))}</p></section>" for t, k in secs if p.get(k))
        fontes = "".join(f"<li>{e(x)}</li>" for x in p.get("fontes", []) or [])
        ant = ordenados[i - 1] if i else None
        prox = ordenados[i + 1] if i + 1 < len(ordenados) else None
        nav = "".join([f'<a href="ficha-{slug(ant["nome"])}.html">← {e(ant["nome"])}</a>' if ant else "<span></span>",
                       f'<a href="ficha-{slug(prox["nome"])}.html">{e(prox["nome"])} →</a>' if prox else ""])
        estatico = (f'<div id="conteudo"><nav class="migalhas"><a href="index.html">Catálogo</a> › {e(p.get("categoria"))} › {e(p["nome"])}</nav>'
                    f'<article class="pagina-pep"><h1 class="titulo-pep">{e(p["nome"])}</h1>'
                    f'<p><span class="tag">{e(p.get("categoria"))}</span> <span class="tag">{e(p.get("fase"))}</span></p>'
                    f'<p><b>Status regulatório:</b> {e(p.get("status"))}</p>{corpo}'
                    f'<section class="boas"><h2>Fontes</h2><ul>{fontes}</ul></section>'
                    f'<p><small>Conteúdo educativo, não é orientação médica. Veja a <a href="sobre.html">metodologia e a política editorial</a>.</small></p>'
                    f'</article><p class="prox-ant">{nav}</p></div>')
        cab = (f'<!DOCTYPE html>\n<html lang="pt-BR">\n<head>\n<meta charset="UTF-8">\n<meta name="viewport" content="width=device-width, initial-scale=1">\n'
               f'<title>{e(titulo)}</title>\n<meta name="description" content="{e(desc)}">\n'
               '<link rel="manifest" href="manifest.webmanifest">\n<meta name="theme-color" content="#1f3a5f">\n'
               '<link rel="icon" href="icons/icon-192.png">\n<link rel="apple-touch-icon" href="icons/icon-192.png">\n<link rel="stylesheet" href="style.css">\n'
               f'<meta name="site-root" content="{e(site)}">\n<link rel="canonical" href="{url}">\n'
               f'<meta property="og:type" content="article">\n<meta property="og:site_name" content="{e(NOME_SITE)}">\n<meta property="og:locale" content="pt_BR">\n'
               f'<meta property="og:title" content="{e(titulo)}">\n<meta property="og:description" content="{e(desc)}">\n<meta property="og:url" content="{url}">\n'
               f'<meta property="og:image" content="{card}">\n<meta name="twitter:card" content="summary_large_image">\n<meta name="twitter:image" content="{card}">\n'
               + "".join(f'<script type="application/ld+json" data-seo="1">{json.dumps(o, ensure_ascii=False)}</script>\n' for o in ld) + "</head>\n")
        corpo_pag = resto.replace('<div id="conteudo"></div>', estatico, 1)
        corpo_pag = corpo_pag.replace("<body>", "", 1)
        pag = cab + f'<body>\n<script>window.PEP_SLUG="{s}";</script>\n' + corpo_pag
        (raiz / f"ficha-{s}.html").write_text(pag, encoding="utf-8")
    print(f"{len(ordenados)} fichas estaticas geradas")
    comps = gerar_comparacoes(site, ordenados, familias)
    return [slug(p["nome"]) for p in ordenados], comps

def gerar_comparacoes(site, itens, familias):
    """Paginas estaticas 'A vs B': pares da mesma familia de mecanismo com ao menos um item aprovado."""
    por_nome = {p["nome"]: p for p in itens}
    for f in raiz.glob("comparar-*.html"):
        f.unlink()
    modelo = (raiz / "peptideo.html").read_text(encoding="utf-8")
    resto = modelo[modelo.index('<header id="topo">'):]
    resto = re.sub(r'\n?<!--seo-->.*?<!--/seo-->', "", resto, flags=re.S)
    vistos, feitos = set(), []
    campos = [("Categoria", "categoria"), ("Fase", "fase"), ("Status regulatório", "status"), ("O que faz", "oQueFaz"),
              ("Mecanismo", "mecanismo"), ("Evidência", "evidencia"), ("Riscos", "riscos")]
    for fam in familias:
        if fam.get("id") == "peptideos-terapeuticos":
            continue
        membros = [por_nome[n] for n in fam.get("peptideos", []) if n in por_nome]
        for i, a in enumerate(membros):
            for b in membros[i + 1:]:
                if "Aprovado" not in (a.get("fase"), b.get("fase")):
                    continue
                sa, sb = sorted([slug(a["nome"]), slug(b["nome"])])
                if (sa, sb) in vistos:
                    continue
                vistos.add((sa, sb))
                x, y = (a, b) if slug(a["nome"]) == sa else (b, a)
                arq = f"comparar-{sa}-vs-{sb}.html"
                url = f"{site}/{arq}"
                titulo = f'{x["nome"]} vs {y["nome"]}: diferenças, evidências e riscos | {NOME_SITE}'
                desc = f'Comparação educativa entre {x["nome"]} e {y["nome"]} ({fam["nome"]}): fase, status regulatório, mecanismo, evidência e riscos.'
                linhas = "".join(f'<tr><th>{t_}</th><td>{e(x.get(k))}</td><td>{e(y.get(k))}</td></tr>' for t_, k in campos)
                corpo = (f'<div id="conteudo"><nav class="migalhas"><a href="index.html">Catálogo</a> › Comparações › {e(x["nome"])} vs {e(y["nome"])}</nav>'
                         f'<article class="pagina-pep"><h1 class="titulo-pep">{e(x["nome"])} vs {e(y["nome"])}</h1>'
                         f'<p>Ambos pertencem à família <b>{e(fam["nome"])}</b>. Veja abaixo como se diferenciam; o conteúdo é educativo e não é orientação médica.</p>'
                         f'<div class="tabela-rolavel"><table class="comparacao"><thead><tr><th></th><th><a href="ficha-{sa if x is a else sb}.html">{e(x["nome"])}</a></th>'
                         f'<th><a href="ficha-{sb if x is a else sa}.html">{e(y["nome"])}</a></th></tr></thead><tbody>{linhas}</tbody></table></div>'
                         f'<p><a href="comparar.html?a={slug(x["nome"])}&amp;b={slug(y["nome"])}">Abrir no comparador interativo</a> · '
                         f'<a href="ficha-{slug(x["nome"])}.html">Ficha de {e(x["nome"])}</a> · <a href="ficha-{slug(y["nome"])}.html">Ficha de {e(y["nome"])}</a></p>'
                         f'</article></div>')
                ld = {"@context": "https://schema.org", "@type": "WebPage", "name": titulo, "description": desc, "inLanguage": "pt-BR", "url": url}
                cab = (f'<!DOCTYPE html>\n<html lang="pt-BR">\n<head>\n<meta charset="UTF-8">\n<meta name="viewport" content="width=device-width, initial-scale=1">\n'
                       f'<title>{e(titulo)}</title>\n<meta name="description" content="{e(desc)}">\n'
                       '<link rel="manifest" href="manifest.webmanifest">\n<meta name="theme-color" content="#1f3a5f">\n<link rel="icon" href="icons/icon-192.png">\n<link rel="stylesheet" href="style.css">\n'
                       f'<link rel="canonical" href="{url}">\n<meta property="og:type" content="article">\n<meta property="og:title" content="{e(titulo)}">\n'
                       f'<meta property="og:description" content="{e(desc)}">\n<meta property="og:url" content="{url}">\n<meta property="og:image" content="{site}/icons/icon-512.png">\n'
                       f'<script type="application/ld+json">{json.dumps(ld, ensure_ascii=False)}</script>\n</head>\n')
                pag = resto.replace('<div id="conteudo"></div>', corpo, 1).replace("<body>", "", 1)
                pag = re.sub(r'<script(?: defer)? src="peptideo.js"></script>', '', pag)
                (raiz / arq).write_text(cab + "<body>\n" + pag, encoding="utf-8")
                feitos.append(arq)
    print(f"{len(feitos)} paginas de comparacao geradas")
    return feitos

if __name__ == "__main__":
    gerar((sys.argv[1] if len(sys.argv) > 1 else "https://SEU-DOMINIO.com").rstrip("/"))
