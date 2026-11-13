"""Atualiza live-data.json consultando ClinicalTrials.gov, PubMed e openFDA para todo o catálogo.
Uso: python tools/atualizar.py [--so SLUG ...]
Mantém o valor anterior de uma métrica quando a consulta falha (execução incremental)."""
import json, re, sys, time, unicodedata, pathlib, urllib.request, urllib.error, urllib.parse
from datetime import datetime, timezone, timedelta

raiz = pathlib.Path(__file__).resolve().parent.parent
SAIDA = raiz / "live-data.json"
ESPERA = 0.4  # PubMed sem chave permite ~3 req/s

def slug(nome):
    s = unicodedata.normalize("NFD", nome.lower())
    s = "".join(c for c in s if unicodedata.category(c) != "Mn")
    return re.sub(r"[^a-z0-9]+", "-", s).strip("-")

def catalogo():
    dados = (raiz / "data.js").read_text(encoding="utf-8")
    core = (raiz / "core.js").read_text(encoding="utf-8")
    bloco = re.search(r"const FASE_EXISTENTES = \{(.*?)\};", dados, re.S).group(1)
    fases = dict(re.findall(r'"([^"]+)":\s*"([^"]+)"', bloco))
    itens = {}
    for nome in re.findall(r'^\s*nome: "([^"]+)"', dados, re.M):
        itens[nome] = fases.get(nome, "Pré-clínico (animais)")
    for nome, _cat, fase in re.findall(r'^P\("([^"]+)",\s*"([^"]+)",\s*"([^"]+)"', dados, re.M):
        itens[nome] = fase
    tbl = re.search(r"const TERMO_EN = \{(.*?)\n\};", core, re.S).group(1)
    termos = dict(re.findall(r'"([^"]+)":\s*"([^"]+)"', tbl))
    return [(n, f, termos.get(n, re.sub(r"\s*\(.*\)", "", n))) for n, f in itens.items()]

FALHA = object()
EMA_URL = "https://www.ema.europa.eu/en/documents/report/medicines-output-medicines_json-report_en.json"
EMA_ALIAS = {"leuprolide": "leuprorelin", "oxytocin": "oxytocin"}
_ema = None

def ema_base():
    global _ema
    if _ema is None:
        d = get(EMA_URL)
        _ema = d["data"] if isinstance(d, dict) and "data" in d else FALHA
    return _ema

def dmy(s):
    return f"{s[6:10]}-{s[3:5]}-{s[:2]}" if re.fullmatch(r"\d\d/\d\d/\d{4}", s or "") else None

def ema_info(termo):
    """Medicamentos humanos da EMA cujo princípio ativo é só o termo. Retorna None se não houver, ou FALHA."""
    base = ema_base()
    if base is FALHA: return FALHA
    alvo = EMA_ALIAS.get(termo.lower(), termo.lower())
    achados = []
    for x in base:
        if x.get("category") != "Human": continue
        sub = (x.get("active_substance") or "").lower()
        if alvo in sub and not re.search(r"[,/]| and | \+ ", sub):
            achados.append(x)
    if not achados: return None
    ativos = [x for x in achados if x.get("medicine_status") == "Authorised"]
    datas = sorted(filter(None, (dmy(x.get("marketing_authorisation_date")) for x in (ativos or achados))))
    marcas = sorted({x["name_of_medicine"] for x in (ativos or achados)})[:5]
    url = (ativos or achados)[0].get("medicine_url") or ""
    return {"situacao": "autorizado" if ativos else "retirado", "desde": datas[0] if datas else None, "marcas": marcas, "url": url}

def recalls(termo):
    ini = (datetime.now(timezone.utc) - timedelta(days=3 * 365)).strftime("%Y%m%d")
    q = urllib.parse.quote(f'(openfda.generic_name:"{termo}" product_description:"{termo}") AND report_date:[{ini} TO 20991231]', safe='()":[]')
    time.sleep(ESPERA)
    d = get(f"https://api.fda.gov/drug/enforcement.json?search={q.replace('%20', '+')}&limit=3&sort=report_date:desc")
    if d is FALHA: return FALHA
    if d is None: return {"total": 0, "recentes": []}
    rec = []
    for r in d.get("results", []):
        x = r.get("report_date", "")
        rec.append({"data": f"{x[:4]}-{x[4:6]}-{x[6:]}" if len(x) == 8 else "", "classe": r.get("classification", ""),
                    "empresa": r.get("recalling_firm", ""), "motivo": (r.get("reason_for_recall") or "")[:220],
                    "produto": (r.get("product_description") or "")[:100]})
    return {"total": d.get("meta", {}).get("results", {}).get("total", len(rec)), "recentes": rec}

def get(url):
    for i in range(4):
        try:
            req = urllib.request.Request(url, headers={"User-Agent": "guia-peptideos/1.0 (projeto educativo)"})
            with urllib.request.urlopen(req, timeout=30) as r:
                return json.load(r)
        except urllib.error.HTTPError as e:
            if e.code == 404:
                return None
            time.sleep(2 * (i + 1))
        except Exception:
            time.sleep(1 + i)
    return FALHA

def ct(termo, extra=""):
    q = urllib.parse.quote(termo)
    time.sleep(ESPERA)
    return get(f"https://clinicaltrials.gov/api/v2/studies?query.intr={q}&pageSize=1&countTotal=true{extra}")

def pm_raw(consulta, extra=""):
    q = urllib.parse.quote(consulta)
    time.sleep(ESPERA)
    return get(f"https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?db=pubmed&retmode=json&retmax=0&term={q}{extra}")

def pm(termo, extra=""):
    q = urllib.parse.quote(f"{termo}[Title/Abstract]")
    time.sleep(ESPERA)
    return get(f"https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?db=pubmed&retmode=json&retmax=0&term={q}{extra}")

def coletar(termo):
    r = {}
    def total(d): return d.get("totalCount") if isinstance(d, dict) else None
    def ok(d): return d is not FALHA
    d = ct(termo);                                        r["ensaios"] = total(d) if ok(d) else FALHA
    d = ct(termo, "&filter.advanced=AREA%5BPhase%5DPHASE1"); r["fase1"] = total(d) if ok(d) else FALHA
    d = ct(termo, "&filter.advanced=AREA%5BPhase%5DPHASE2"); r["fase2"] = total(d) if ok(d) else FALHA
    d = ct(termo, "&filter.advanced=AREA%5BPhase%5DPHASE3"); r["fase3"] = total(d) if ok(d) else FALHA
    d = ct(termo, "&filter.overallStatus=RECRUITING");    r["recrutando"] = total(d) if ok(d) else FALHA
    d = ct(termo, "&sort=LastUpdatePostDate%3Adesc&fields=LastUpdatePostDate")
    if ok(d):
        try: r["ultimaAtualizacao"] = d["studies"][0]["protocolSection"]["statusModule"]["lastUpdatePostDateStruct"]["date"]
        except Exception: r["ultimaAtualizacao"] = None
    else: r["ultimaAtualizacao"] = FALHA
    d = pm(termo);                                        r["artigos"] = int(d["esearchresult"]["count"]) if ok(d) and d else FALHA
    d = pm(termo, "&datetype=pdat&reldate=365");          r["artigosAno"] = int(d["esearchresult"]["count"]) if ok(d) and d else FALHA
    time.sleep(ESPERA)
    d = get(f"https://api.fda.gov/drug/drugsfda.json?search=openfda.generic_name:%22{urllib.parse.quote(termo)}%22&limit=100")
    if d is FALHA: r["fdaRegistros"] = FALHA; r["fdaAprovacao"] = FALHA
    elif d is None: r["fdaRegistros"] = 0; r["fdaAprovacao"] = None
    else:
        r["fdaRegistros"] = d.get("meta", {}).get("results", {}).get("total", 0)
        r["fdaAprovacao"] = aprovacao_fda(d, termo)
    d = pm_raw(f"{termo}[Title/Abstract] AND (adverse OR safety OR toxicity)", "&datetype=pdat&reldate=365")
    r["segurancaAno"] = int(d["esearchresult"]["count"]) if ok(d) and d else FALHA
    d = pm_raw(f"{termo}[Title/Abstract] AND (systematic review[pt] OR meta-analysis[pt])", "&datetype=pdat&reldate=365")
    r["revisoesAno"] = int(d["esearchresult"]["count"]) if ok(d) and d else FALHA
    time.sleep(ESPERA)
    d = get(f"https://api.fda.gov/drug/label.json?search=openfda.generic_name:%22{urllib.parse.quote(termo)}%22&limit=1&sort=effective_time:desc")
    if d is FALHA: r["bula"] = FALHA
    elif d is None or not d.get("results"): r["bula"] = None
    else:
        b = d["results"][0]
        x = b.get("effective_time", "")
        r["bula"] = {"atualizada": f"{x[:4]}-{x[4:6]}-{x[6:]}" if len(x) == 8 else "", "caixaPreta": "boxed_warning" in b}
    r["alertas"] = recalls(termo)
    r["ema"] = ema_info(termo)
    return r

def aprovacao_fda(d, termo):
    """Aprovação original mais antiga no Drugs@FDA de produtos cujo ÚNICO princípio ativo é o termo.
    Ignora combinações e soluções que só contêm a substância como componente (ex.: glutationa em colírio)."""
    alvo = termo.lower()
    datas, marcas = [], set()
    for reg in d.get("results", []):
        prods = [p for p in reg.get("products", [])
                 if len(p.get("active_ingredients", [])) == 1 and alvo in p["active_ingredients"][0].get("name", "").lower()]
        if not prods:
            continue
        for s in reg.get("submissions", []):
            x = s.get("submission_status_date", "")
            if s.get("submission_status") == "AP" and s.get("submission_type") == "ORIG" and re.fullmatch(r"\d{8}", x):
                datas.append(f"{x[:4]}-{x[4:6]}-{x[6:]}")
        marcas.update(p["brand_name"].title() for p in prods if p.get("brand_name"))
    return {"desde": min(datas), "marcas": sorted(marcas)[:5]} if datas else None

def eventos(nome, s, ant, novo):
    """Mudanças relevantes entre duas coletas. Só compara campos que a coleta anterior já verificava."""
    hoje = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    ev = lambda tipo, txt: {"data": hoje, "slug": s, "nome": nome, "tipo": tipo, "texto": txt}
    out = []
    if not ant: return out
    if ant.get("fdaOk") and not ant.get("fdaAprovacao") and novo.get("fdaAprovacao"):
        out.append(ev("aprovacao", "Nova aprovação detectada no Drugs@FDA."))
    if ant.get("emaVerificado"):
        a, n = (ant.get("ema") or {}).get("situacao"), (novo.get("ema") or {}).get("situacao")
        if a != n:
            out.append(ev("aprovacao" if n == "autorizado" else "seguranca", f"Situação na EMA mudou: {a or 'sem registro'} → {n or 'sem registro'}."))
    if ant.get("alertas") and novo.get("alertas") and novo["alertas"]["total"] > ant["alertas"]["total"]:
        out.append(ev("seguranca", f"{novo['alertas']['total'] - ant['alertas']['total']} novo(s) recall(s) na FDA (janela de 3 anos)."))
    if isinstance(ant.get("fase3"), int) and isinstance(novo.get("fase3"), int) and novo["fase3"] > ant["fase3"]:
        out.append(ev("estudos", f"{novo['fase3'] - ant['fase3']} novo(s) ensaio(s) de fase 3 registrado(s) no ClinicalTrials.gov."))
    ab, nb = ant.get("bula"), novo.get("bula")
    if ab and nb and nb.get("atualizada") and nb["atualizada"] != ab.get("atualizada"):
        out.append(ev("conteudo", f"Bula da FDA atualizada ({ab.get('atualizada') or '?'} → {nb['atualizada']}). Reveja riscos e status."))
    if ab and nb and nb.get("caixaPreta") and not ab.get("caixaPreta"):
        out.append(ev("seguranca", "A bula da FDA passou a ter alerta em caixa preta (boxed warning)."))
    if isinstance(ant.get("revisoesAno"), int) and isinstance(novo.get("revisoesAno"), int) and novo["revisoesAno"] > ant["revisoesAno"]:
        out.append(ev("conteudo", f"{novo['revisoesAno'] - ant['revisoesAno']} nova(s) revisão(ões) sistemática(s)/meta-análise(s) no PubMed. Reveja evidência e benefícios."))
    if isinstance(ant.get("segurancaAno"), int) and isinstance(novo.get("segurancaAno"), int) and novo["segurancaAno"] >= ant["segurancaAno"] + 5:
        out.append(ev("seguranca", f"Aumento de publicações sobre segurança/efeitos adversos no PubMed ({ant['segurancaAno']} → {novo['segurancaAno']} no último ano). Reveja riscos."))
    return out

def main():
    antigo = json.loads(SAIDA.read_text(encoding="utf-8")) if SAIDA.exists() else {"itens": {}}
    filtro = set(sys.argv[sys.argv.index("--so") + 1:]) if "--so" in sys.argv else None
    novo, sugestoes, historico = dict(antigo.get("itens", {})), [], []
    cat = catalogo()
    for n, (nome, fase, termo) in enumerate(cat, 1):
        s = slug(nome)
        if filtro and s not in filtro:
            continue
        print(f"[{n}/{len(cat)}] {nome} ({termo})", flush=True)
        atual = coletar(termo)
        base = antigo.get("itens", {}).get(s, {})
        item = {k: (base.get(k) if v is FALHA else v) for k, v in atual.items()}
        item["fdaOk"] = item.get("fdaRegistros") is not None
        if "fdaAprovacao" in item and item["fdaAprovacao"] is None: del item["fdaAprovacao"]
        if item.get("ema") is None: item.pop("ema", None)
        item["emaVerificado"] = ema_base() is not FALHA
        for ev in eventos(nome, s, base, item): historico.append(ev)
        item["fdaRegistros"] = item.get("fdaRegistros") or 0
        item["quando"] = int(time.time() * 1000)
        novo[s] = item
    for nome, fase, _ in cat:
        i = novo.get(slug(nome), {})
        if i.get("fdaRegistros", 0) > 0 and fase != "Aprovado" and not i.get("fdaAprovacao"):
            sugestoes.append(f"{nome}: há registro na FDA, mas o catálogo marca '{fase}'.")
        elif (i.get("fase3") or 0) > 0 and fase in ("In vitro", "Pré-clínico (animais)", "Fase 1", "Fase 2"):
            sugestoes.append(f"{nome}: {i['fase3']} ensaio(s) de fase 3 encontrados, catálogo marca '{fase}'.")
    auto = {}
    for nome, fase, _ in cat:
        i = novo.get(slug(nome), {})
        e = {}
        if i.get("fdaAprovacao"): e["fda"] = i["fdaAprovacao"]
        if i.get("ema"): e["ema"] = i["ema"]
        if e: auto[slug(nome)] = e
    (raiz / "aprovacoes.js").write_text(
        "/* Gerado por tools/atualizar.py: aprovações confirmadas no Drugs@FDA e na EMA. Promovem a fase para 'Aprovado'. */\n"
        "const APROVACOES_AUTO = " + json.dumps(auto, ensure_ascii=False, indent=1) + ";\n", encoding="utf-8")
    for nome, fase, _ in cat:
        a = auto.get(slug(nome), {})
        if fase != "Aprovado" and (a.get("fda") or (a.get("ema") or {}).get("situacao") == "autorizado"):
            sugestoes.append(f"{nome}: aprovação oficial detectada; o site já mostra 'Aprovado' automaticamente. Revise o texto do catálogo.")
    hist_arq = raiz / "historico.js"
    antigo_h = []
    if hist_arq.exists():
        m = re.search(r"=\s*(\[.*\]);", hist_arq.read_text(encoding="utf-8"), re.S)
        if m: antigo_h = json.loads(m.group(1))
    todos = (historico + antigo_h)[:300]
    hist_arq.write_text("/* Gerado por tools/atualizar.py: mudanças detectadas entre coletas. */\nconst HISTORICO_AUTO = " + json.dumps(todos, ensure_ascii=False, indent=1) + ";\n", encoding="utf-8")
    fila = {}
    for ev_ in historico:
        if ev_["tipo"] in ("conteudo", "seguranca", "aprovacao", "estudos"):
            fila.setdefault(ev_["slug"], []).append({"data": ev_["data"], "tipo": ev_["tipo"], "texto": ev_["texto"]})
    for nome, fase, _ in cat:
        i = novo.get(slug(nome), {})
        for sug in sugestoes:
            if sug.startswith(nome + ":"):
                fila.setdefault(slug(nome), []).append({"data": datetime.now(timezone.utc).strftime("%Y-%m-%d"), "tipo": "fase", "texto": sug.split(": ", 1)[1]})
    antiga = {}
    arq_fila = raiz / "revisao-pendente.js"
    if arq_fila.exists():
        m = re.search(r"=\s*(\{.*\});", arq_fila.read_text(encoding="utf-8"), re.S)
        if m: antiga = json.loads(m.group(1))
    for s_, lst in fila.items():
        ja = {(x["tipo"], x["texto"]) for x in antiga.get(s_, [])}
        antiga[s_] = [x for x in lst if (x["tipo"], x["texto"]) not in ja] + antiga.get(s_, [])
    arq_fila.write_text("/* Gerado por tools/atualizar.py: sinais nas fontes que pedem revisao humana do texto. Limpe com tools/revisar.py. */\nconst REVISAO_PENDENTE = " + json.dumps(antiga, ensure_ascii=False, indent=1) + ";\n", encoding="utf-8")
    saida = {"geradoEm": datetime.now(timezone.utc).isoformat(), "sugestoes": sugestoes, "itens": novo}
    SAIDA.write_text(json.dumps(saida, ensure_ascii=False, indent=1), encoding="utf-8")
    print(f"\n{len(novo)} itens gravados em {SAIDA.name}; {len(sugestoes)} sugestões de revisão.")
    for s in sugestoes: print(" -", s)

if __name__ == "__main__":
    main()
