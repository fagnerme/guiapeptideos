"""Gera uma pagina HTML estatica por item (fichas/<slug>.html) com o conteudo no proprio HTML (indexavel sem JavaScript).
Uso: python tools/gerar_fichas.py https://seusite.com  (chamado tambem por build.py)
Os dados vem do proprio site: um Edge headless executa os dados/data-*.js e despeja o catalogo em JSON (tools/_pep.json)."""
import re, sys, json, html, shutil, subprocess, tempfile, unicodedata, pathlib, os
from datetime import datetime, timezone
from urllib.parse import quote

raiz = pathlib.Path(__file__).resolve().parent.parent
CACHE = raiz / "tools" / "_pep.json"
NOME_SITE = "Guia de Peptídeos, Hormônios, Suplementos e Medicamentos"
SCRIPTS = ["dados/data.js", "dados/data-extra.js", "dados/data-timeline.js", "dados/data-mecanismos.js", "dados/data-alegacoes.js", "dados/data-mudancas.js",
           "dados/historico.js", "dados/aprovacoes.js", "dados/data-vias.js", "dados/data-alvos.js", "dados/data-farmaco.js", "dados/data-interacoes.js",
           "dados/data-detalhes.js", "js/core.js"]

def slug(nome):
    s = unicodedata.normalize("NFD", nome.lower())
    s = "".join(c for c in s if unicodedata.category(c) != "Mn")
    return re.sub(r"[^a-z0-9]+", "-", s).strip("-")

def achar_edge():
    for c in [r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe", r"C:\Program Files\Microsoft\Edge\Application\msedge.exe",
              r"C:\Program Files\Google\Chrome\Application\chrome.exe"]:
        if os.path.exists(c):
            return c
    return shutil.which("msedge") or shutil.which("google-chrome") or shutil.which("google-chrome-stable") or shutil.which("chromium") or shutil.which("chromium-browser")

def despejar():
    edge = achar_edge()
    if not edge:
        return None
    tags = "".join(f'<script src="{s}"></script>' for s in SCRIPTS)
    pagina = raiz / "_dump.html"
    pagina.write_text('<!DOCTYPE html><html><head><meta charset="UTF-8"></head><body><pre id="o"></pre>' + tags +
                      '<script>document.getElementById("o").textContent="@@"+JSON.stringify({P:PEPTIDES,M:MECANISMOS,T:TERMO_EN})+"@@"</script></body></html>', encoding="utf-8")
    try:
        with tempfile.TemporaryDirectory() as perfil:
            r = subprocess.run([edge, "--headless=new", "--no-sandbox", "--disable-gpu", "--disable-dev-shm-usage", f"--user-data-dir={perfil}", "--virtual-time-budget=8000",
                                "--dump-dom", pagina.as_uri()], capture_output=True, timeout=90)
        saida = r.stdout.decode("utf-8", "replace")
        if not re.search(r'<pre id="o">@@', saida):
            print("AVISO: navegador sem saida util:", r.stderr.decode("utf-8", "replace")[-400:])
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
en = lambda t: html.escape(str("—" if t is None else t), quote=True)
chips_fases = lambda d: '<span class="fases">' + "".join(f'<span class="fase-chip"><b>{en(d.get("fase" + str(n)))}</b> na fase {n}</span>' for n in (1, 2, 3)) + "</span>"

def html_resumo_auto(dados, termo):
    if not dados:
        return ""
    quando = dados.get("quando")
    data = datetime.fromtimestamp(quando / 1000, timezone.utc).strftime("%Y-%m-%d %H:%M UTC") if quando else "data não informada"
    termo_url = quote(termo)
    return (
        '<section class="boas atualizacao-auto"><h2>Resumo automático da pesquisa</h2>'
        f'<p>Coleta registrada em {e(data)}.</p><ul>'
        f'<li>ClinicalTrials.gov: {en(dados.get("ensaios"))} estudo(s) registrado(s); '
        f'{en(dados.get("recrutando"))} recrutando; atualização mais recente do registro: '
        f'{e(dados.get("ultimaAtualizacao") or "—")}.<br>{chips_fases(dados)}</li>'
        f'<li>PubMed: {en(dados.get("artigosAno"))} artigo(s) nos últimos 12 meses e '
        f'{en(dados.get("revisoesAno"))} revisão(ões) sistemática(s)/meta-análise(s).</li></ul>'
        '<p><small>Busca textual por nome: os números descrevem atividade de pesquisa e não demonstram eficácia, benefício ou segurança.</small></p>'
        f'<p><small>Fontes: <a href="https://clinicaltrials.gov/search?term={termo_url}" target="_blank" rel="noopener">ClinicalTrials.gov</a> · '
        f'<a href="https://pubmed.ncbi.nlm.nih.gov/?term={termo_url}" target="_blank" rel="noopener">PubMed</a></small></p></section>'
    )

def formatar_data_fonte(valor):
    if isinstance(valor, (int, float)):
        return datetime.fromtimestamp(valor / 1000, timezone.utc).strftime("%Y-%m-%d %H:%M UTC")
    if isinstance(valor, str):
        try:
            return datetime.fromisoformat(valor.replace("Z", "+00:00")).astimezone(timezone.utc).strftime("%Y-%m-%d %H:%M UTC")
        except ValueError:
            return valor
    return ""

def html_status_auto(dados, termo):
    if not dados:
        return ""
    fontes = []
    fda = dados.get("fdaAprovacao")
    fda_verificado = dados.get("fdaVerificadoEm") or (dados.get("quando") if dados.get("fdaOk") else None)
    if fda:
        fontes.append(("FDA (EUA)", "aprovação localizada", ", ".join(fda.get("marcas", [])), "https://www.accessdata.fda.gov/scripts/cder/daf/index.cfm?event=BasicSearch.process&searchterm=" + quote(termo), fda_verificado))
    elif fda_verificado:
        fontes.append(("FDA (EUA)", "nenhum registro de aprovação localizado nesta busca", "", "https://www.accessdata.fda.gov/scripts/cder/daf/index.cfm?event=BasicSearch.process&searchterm=" + quote(termo), fda_verificado))
    else:
        fontes.append(("FDA (EUA)", "consulta ainda não verificada", "", "https://www.accessdata.fda.gov/scripts/cder/daf/", None))

    ema = dados.get("ema")
    ema_verificado = dados.get("emaVerificadoEm") or (dados.get("quando") if dados.get("emaVerificado") else None)
    if ema and ema.get("situacao") == "autorizado":
        fontes.append(("EMA (União Europeia)", "autorização localizada", ", ".join(ema.get("marcas", [])), ema.get("url") or "https://www.ema.europa.eu/en/medicines", ema_verificado))
    elif ema:
        fontes.append(("EMA (União Europeia)", "sem autorização ativa localizada", ", ".join(ema.get("marcas", [])), ema.get("url") or "https://www.ema.europa.eu/en/medicines", ema_verificado))
    elif ema_verificado:
        fontes.append(("EMA (União Europeia)", "nenhum registro localizado nesta busca", "", "https://www.ema.europa.eu/en/medicines", ema_verificado))
    else:
        fontes.append(("EMA (União Europeia)", "consulta ainda não verificada", "", "https://www.ema.europa.eu/en/medicines", None))

    anvisa = dados.get("anvisa")
    if anvisa:
        estado = {"autorizado": "registro ativo localizado", "sem_registro_ativo": "nenhum registro ativo localizado", "sem_registro": "nenhum registro localizado nesta busca"}.get(anvisa.get("situacao"), "consulta indisponível")
        produtos = ", ".join(f"{x.get('nome', '')} (registro {x.get('registro', '')})" for x in anvisa.get("registros", []))
        fontes.append(("Anvisa (Brasil)", estado, produtos, "https://consultas.anvisa.gov.br/#/medicamentos/", anvisa.get("verificadoEm")))
    else:
        fontes.append(("Anvisa (Brasil)", "consulta ainda não verificada", "", "https://consultas.anvisa.gov.br/#/medicamentos/", None))

    canada = dados.get("canada")
    if canada:
        estado = {"autorizado": "autorização localizada", "sem_registro_ativo": "nenhum registro ativo localizado", "sem_registro": "nenhum registro localizado nesta busca", "consulta_parcial": "consulta parcial; sem conclusão"}.get(canada.get("situacao"), "consulta indisponível")
        if canada.get("parcial") and canada.get("situacao") != "consulta_parcial":
            estado += " (consulta parcial)"
        produtos = ", ".join(f"{x.get('produto') or x.get('din')} ({x.get('situacao', '')})" for x in canada.get("registros", []))
        fontes.append(("Health Canada", estado, produtos, "https://health-products.canada.ca/dpd-bdpp/index-eng.jsp", canada.get("verificadoEm")))
    else:
        fontes.append(("Health Canada", "consulta ainda não verificada", "", "https://health-products.canada.ca/dpd-bdpp/index-eng.jsp", None))

    linhas = "".join(
        f'<li><b>{e(orgao)}:</b> {e(estado)}{(" (verificado em " + e(formatar_data_fonte(data)) + ")") if data else ""}{": " + e(produtos) if produtos else ""} · '
        f'<a href="{e(url)}" target="_blank" rel="noopener">fonte oficial</a></li>'
        for orgao, estado, produtos, url, data in fontes
    )
    estudos = ""
    if isinstance(dados.get("ensaios"), int) and dados["ensaios"] > 0:
        estudos = (
            f'<p>ClinicalTrials.gov: {en(dados.get("ensaios"))} estudo(s) com correspondência textual; '
            f'{en(dados.get("recrutando"))} recrutando.</p><p>{chips_fases(dados)} '
            f'<a href="https://clinicaltrials.gov/search?term={quote(termo)}" target="_blank" rel="noopener">Consultar estudos</a>.</p>'
        )
    return (
        '<section class="boas status-fontes"><h2>Situação nas fontes regulatórias</h2>'
        f'<ul>{linhas}</ul>{estudos}'
        '<p><small>Ausência de resultados não prova ausência de aprovação em outros países, indicações ou bases. '
        'As buscas usam correspondência exata de ingrediente e não cobrem todas as autoridades do mundo. '
        'Anvisa e Health Canada consultam bases de medicamentos, não todos os suplementos.</small></p></section>'
    )

def html_riscos_auto(dados, termo):
    if not dados:
        return ""
    bula = dados.get("bula")
    alertas = dados.get("alertas")
    itens = []
    if bula:
        caixa = "inclui alerta em caixa preta" if bula.get("caixaPreta") else "não inclui alerta em caixa preta"
        itens.append(f'<li>Rótulo FDA consultado (atualizado em {e(bula.get("atualizada") or "data não informada")}): {caixa}.</li>')
    else:
        itens.append('<li>Nenhum rótulo FDA foi localizado nesta busca por nome; isso não indica ausência de riscos.</li>')
    if isinstance(alertas, dict):
        total = alertas.get("total", 0)
        itens.append(f'<li>openFDA: {en(total)} recall(s) correspondentes nos últimos 3 anos.</li>')
        for r in (alertas.get("recentes") or [])[:3]:
            itens.append(
                f'<li>{e(r.get("data"))} · {e(r.get("classe"))} · {e(r.get("empresa"))}: '
                f'{e(r.get("motivo"))} <small>{e(r.get("produto"))}</small></li>'
            )
    else:
        itens.append('<li>Dados de recall da FDA indisponíveis nesta coleta.</li>')
    if dados.get("segurancaAno") is not None:
        itens.append(f'<li>PubMed: {en(dados.get("segurancaAno"))} publicação(ões) encontradas com termos de segurança nos últimos 12 meses.</li>')
    termo_url = quote(termo)
    return (
        '<section class="boas atualizacao-auto aviso-det"><h2>Atualização automática de riscos e segurança</h2>'
        f'<ul>{"".join(itens)}</ul>'
        '<p><small>Os resultados são buscas por nome e podem se referir a formulações ou lotes específicos. '
        'Ausência de resultados não significa ausência de risco; consulte a bula da apresentação específica.</small></p>'
        f'<p><small>Fontes: <a href="https://open.fda.gov/data/drug/label/" target="_blank" rel="noopener">rótulos FDA</a> · '
        f'<a href="https://www.fda.gov/safety/recalls-market-withdrawals-safety-alerts" target="_blank" rel="noopener">recalls FDA</a> · '
        f'<a href="https://pubmed.ncbi.nlm.nih.gov/?term={termo_url}" target="_blank" rel="noopener">PubMed</a></small></p></section>'
    )

def gerar(site):
    bruto = carregar()
    itens = bruto["P"] if isinstance(bruto, dict) else bruto
    familias = bruto.get("M", []) if isinstance(bruto, dict) else []
    termos_en = bruto.get("T", {}) if isinstance(bruto, dict) else {}
    arquivo_live = raiz / "dados" / "live-data.json"
    live = json.loads(arquivo_live.read_text(encoding="utf-8")) if arquivo_live.exists() else {}
    dados_live = live.get("itens", {})
    modelo = (raiz / "peptideo.html").read_text(encoding="utf-8")
    resto = modelo[modelo.index('<header id="topo">'):]
    resto = re.sub(r'\n?<!--seo-->.*?<!--/seo-->', "", resto, flags=re.S)
    (raiz / "fichas").mkdir(exist_ok=True)
    for f in (raiz / "fichas").glob("*.html"):
        f.unlink()
    ordenados = sorted(itens, key=lambda p: p["nome"].lower())
    for i, p in enumerate(ordenados):
        s = slug(p["nome"])
        termo_busca = termos_en.get(p["nome"]) or p["nome"]
        url = f"{site}/fichas/{s}.html"
        desc = f'{p["nome"]}: {p.get("oQueFaz", "")} Fase: {p.get("fase", "")}. Conteúdo educativo.'.strip()
        titulo = f'{p["nome"]} — o que é, evidências e riscos | {NOME_SITE}'
        card = f"{site}/cards/{s}.png" if (raiz / "cards" / f"{s}.png").exists() else f"{site}/icons/og-logo.png"
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
        blocos = []
        atualizado = dados_live.get(s)
        for t, k in secs:
            if p.get(k):
                blocos.append(f"<section class=\"boas\"><h2>{t}</h2><p>{e(p.get(k))}</p></section>")
            if t == "Benefícios observados nos estudos":
                blocos.append(html_resumo_auto(atualizado, termo_busca))
            elif t == "Riscos":
                blocos.append(html_riscos_auto(atualizado, termo_busca))
        corpo = "".join(blocos)
        fontes = "".join(f"<li>{e(x)}</li>" for x in p.get("fontes", []) or [])
        ant = ordenados[i - 1] if i else None
        prox = ordenados[i + 1] if i + 1 < len(ordenados) else None
        nav = "".join([f'<a href="fichas/{slug(ant["nome"])}.html">← {e(ant["nome"])}</a>' if ant else "<span></span>",
                       f'<a href="fichas/{slug(prox["nome"])}.html">{e(prox["nome"])} →</a>' if prox else ""])
        estatico = (f'<div id="conteudo"><nav class="migalhas"><a href="index.html">Catálogo</a> › {e(p.get("categoria"))} › {e(p["nome"])}</nav>'
                    f'<article class="pagina-pep"><h1 class="titulo-pep">{e(p["nome"])}</h1>'
                    f'<p><span class="tag">{e(p.get("categoria"))}</span> <span class="tag">{e(p.get("fase"))}</span></p>'
                    f'<p><b>Status do catálogo:</b> {e(p.get("status"))}</p>{html_status_auto(atualizado, termo_busca)}{corpo}'
                    f'<section class="boas"><h2>Fontes</h2><ul>{fontes}</ul></section>'
                    f'<p><small>Conteúdo educativo, não é orientação médica. Veja a <a href="sobre.html">metodologia e a política editorial</a>.</small></p>'
                    f'</article><p class="prox-ant">{nav}</p></div>')
        cab = (f'<!DOCTYPE html>\n<html lang="pt-BR">\n<head>\n<meta charset="UTF-8">\n<meta name="viewport" content="width=device-width, initial-scale=1">\n<meta http-equiv="Content-Security-Policy" content="object-src &#39;none&#39;; base-uri &#39;self&#39;; form-action &#39;self&#39;">\n<base href="../">\n'
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
        (raiz / "fichas" / f"{s}.html").write_text(pag, encoding="utf-8")
    print(f"{len(ordenados)} fichas estaticas geradas")
    comps = gerar_comparacoes(site, ordenados, familias)
    return [slug(p["nome"]) for p in ordenados], comps

def gerar_comparacoes(site, itens, familias):
    """Paginas estaticas 'A vs B': pares da mesma familia de mecanismo com ao menos um item aprovado."""
    por_nome = {p["nome"]: p for p in itens}
    (raiz / "comparar").mkdir(exist_ok=True)
    for f in (raiz / "comparar").glob("*.html"):
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
                arq = f"comparar/{sa}-vs-{sb}.html"
                url = f"{site}/{arq}"
                titulo = f'{x["nome"]} vs {y["nome"]}: diferenças, evidências e riscos | {NOME_SITE}'
                desc = f'Comparação educativa entre {x["nome"]} e {y["nome"]} ({fam["nome"]}): fase, status regulatório, mecanismo, evidência e riscos.'
                linhas = "".join(f'<tr><th>{t_}</th><td>{e(x.get(k))}</td><td>{e(y.get(k))}</td></tr>' for t_, k in campos)
                corpo = (f'<div id="conteudo"><nav class="migalhas"><a href="index.html">Catálogo</a> › Comparações › {e(x["nome"])} vs {e(y["nome"])}</nav>'
                         f'<article class="pagina-pep"><h1 class="titulo-pep">{e(x["nome"])} vs {e(y["nome"])}</h1>'
                         f'<p>Ambos pertencem à família <b>{e(fam["nome"])}</b>. Veja abaixo como se diferenciam; o conteúdo é educativo e não é orientação médica.</p>'
                         f'<div class="tabela-rolavel"><table class="comparacao"><thead><tr><th></th><th><a href="fichas/{sa if x is a else sb}.html">{e(x["nome"])}</a></th>'
                         f'<th><a href="fichas/{sb if x is a else sa}.html">{e(y["nome"])}</a></th></tr></thead><tbody>{linhas}</tbody></table></div>'
                         f'<p><a href="comparar.html?a={slug(x["nome"])}&amp;b={slug(y["nome"])}">Abrir no comparador interativo</a> · '
                         f'<a href="fichas/{slug(x["nome"])}.html">Ficha de {e(x["nome"])}</a> · <a href="fichas/{slug(y["nome"])}.html">Ficha de {e(y["nome"])}</a></p>'
                         f'</article></div>')
                ld = {"@context": "https://schema.org", "@type": "WebPage", "name": titulo, "description": desc, "inLanguage": "pt-BR", "url": url}
                cab = (f'<!DOCTYPE html>\n<html lang="pt-BR">\n<head>\n<meta charset="UTF-8">\n<meta name="viewport" content="width=device-width, initial-scale=1">\n<meta http-equiv="Content-Security-Policy" content="object-src &#39;none&#39;; base-uri &#39;self&#39;; form-action &#39;self&#39;">\n<base href="../">\n'
                       f'<title>{e(titulo)}</title>\n<meta name="description" content="{e(desc)}">\n'
                       '<link rel="manifest" href="manifest.webmanifest">\n<meta name="theme-color" content="#1f3a5f">\n<link rel="icon" href="icons/icon-192.png">\n<link rel="stylesheet" href="style.css">\n'
                       f'<link rel="canonical" href="{url}">\n<meta property="og:type" content="article">\n<meta property="og:title" content="{e(titulo)}">\n'
                       f'<meta property="og:description" content="{e(desc)}">\n<meta property="og:url" content="{url}">\n<meta property="og:image" content="{site}/icons/og-logo.png">\n'
                       f'<script type="application/ld+json">{json.dumps(ld, ensure_ascii=False)}</script>\n</head>\n')
                pag = resto.replace('<div id="conteudo"></div>', corpo, 1).replace("<body>", "", 1)
                pag = re.sub(r'<script(?: defer)? src="(?:js/)?peptideo\.js"></script>', '', pag)
                (raiz / arq).write_text(cab + "<body>\n" + pag, encoding="utf-8")
                feitos.append(arq)
    print(f"{len(feitos)} paginas de comparacao geradas")
    return feitos

if __name__ == "__main__":
    gerar((sys.argv[1] if len(sys.argv) > 1 else "https://fagnerme.github.io/guiapeptideos").rstrip("/"))
