"""Atualiza dados científicos e regulatórios para todo o catálogo.
Uso: python tools/atualizar.py [--so SLUG ...]
Mantém o valor anterior de uma métrica quando a consulta falha (execução incremental)."""
import csv, http.client, io, json, os, re, sys, threading, time, unicodedata, pathlib, urllib.request, urllib.error, urllib.parse
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timezone, timedelta

raiz = pathlib.Path(__file__).resolve().parent.parent
SAIDA = raiz / "dados" / "live-data.json"
# Itens são coletados em paralelo; o intervalo mínimo entre chamadas é aplicado por servidor.
# Chaves gratuitas (NCBI_API_KEY, OPENFDA_API_KEY) liberam taxas maiores; sem elas valem os limites públicos.
NCBI_KEY = os.environ.get("NCBI_API_KEY", "")
OPENFDA_KEY = os.environ.get("OPENFDA_API_KEY", "")
INTERVALOS = {
    "eutils.ncbi.nlm.nih.gov": 0.11 if NCBI_KEY else 0.34,
    "api.fda.gov": 0.26 if OPENFDA_KEY else 1.6,
    "clinicaltrials.gov": 0.12,
    "health-products.canada.ca": 0.1,
}
TRABALHADORES = int(os.environ.get("ATUALIZAR_TRABALHADORES", "12"))
_proximo, _trava_ritmo = {}, threading.Lock()

def esperar_vez(host):
    intervalo = INTERVALOS.get(host, 0.1)
    with _trava_ritmo:
        agora = time.monotonic()
        quando = max(agora, _proximo.get(host, 0))
        _proximo[host] = quando + intervalo
    if quando > agora:
        time.sleep(quando - agora)

def com_chave(url, host):
    chave = NCBI_KEY if host == "eutils.ncbi.nlm.nih.gov" else OPENFDA_KEY if host == "api.fda.gov" else ""
    return f"{url}{'&' if '?' in url else '?'}api_key={chave}" if chave else url
ANVISA_URL = "https://dados.anvisa.gov.br/dados/CONSULTAS/PRODUTOS/TA_CONSULTA_MEDICAMENTOS.CSV"
CANADA_API = "https://health-products.canada.ca/api/drug/"

def slug(nome):
    s = unicodedata.normalize("NFD", nome.lower())
    s = "".join(c for c in s if unicodedata.category(c) != "Mn")
    return re.sub(r"[^a-z0-9]+", "-", s).strip("-")

def catalogo():
    dados = (raiz / "dados" / "data.js").read_text(encoding="utf-8")
    core = (raiz / "js" / "core.js").read_text(encoding="utf-8")
    bloco = re.search(r"const FASE_EXISTENTES = \{(.*?)\};", dados, re.S).group(1)
    fases = dict(re.findall(r'"([^"]+)":\s*"([^"]+)"', bloco))
    itens = {}
    for nome in re.findall(r'^\s*nome: "([^"]+)"', dados, re.M):
        itens[nome] = fases.get(nome, "Pré-clínico (animais)")
    for nome, _cat, fase in re.findall(r'^P\("([^"]+)",\s*"([^"]+)",\s*"([^"]+)"', dados, re.M):
        itens[nome] = fase
    tbl = re.search(r"const TERMO_EN = \{(.*?)\n\};", core, re.S).group(1)
    extras = "".join(re.findall(r"Object\.assign\(TERMO_EN,\s*\{(.*?)\}\);", core, re.S))
    termos = dict(re.findall(r'"([^"]+)":\s*"([^"]+)"', tbl + "\n" + extras))
    return [(n, f, termos.get(n, re.sub(r"\s*\(.*\)", "", n))) for n, f in itens.items()]

def normalizar_ingrediente(valor):
    s = unicodedata.normalize("NFD", str(valor or "").lower())
    s = "".join(c for c in s if unicodedata.category(c) != "Mn")
    return " ".join(re.sub(r"[^a-z0-9]+", " ", s).split())

def coletar_anvisa(cat):
    aliases = {}
    for nome, _, termo in cat:
        s = slug(nome)
        candidatos = {nome, re.sub(r"\s*\([^)]*\)", "", nome), termo}
        for candidato in candidatos:
            normalizado = normalizar_ingrediente(candidato)
            if normalizado:
                aliases.setdefault(normalizado, set()).add(s)
    registros = {}
    req = urllib.request.Request(ANVISA_URL, headers={"User-Agent": "guia-peptideos/1.0 (projeto educativo)"})
    with urllib.request.urlopen(req, timeout=120) as resposta:
        leitor = csv.DictReader(io.TextIOWrapper(resposta, encoding="cp1252", newline=""), delimiter=";")
        obrigatorios = {"NO_PRODUTO", "NU_REGISTRO_PRODUTO", "VALIDADE_SITUACAO", "SUBSTANCIAS_MEDICAMENTOS"}
        if not leitor.fieldnames or not obrigatorios.issubset(leitor.fieldnames):
            raise ValueError("CSV da Anvisa sem as colunas de registro de medicamentos esperadas")
        for linha in leitor:
            substancias = normalizar_ingrediente(linha.get("SUBSTANCIAS_MEDICAMENTOS"))
            slugs = aliases.get(substancias)
            if not slugs:
                continue
            item = {
                "nome": linha.get("NO_PRODUTO", "").strip(),
                "registro": linha.get("NU_REGISTRO_PRODUTO", "").strip(),
                "situacao": linha.get("VALIDADE_SITUACAO", "").strip(),
                "atualizado": linha.get("DATA_ULTIMA_ATUALIZACAO", "").strip(),
            }
            for s in slugs:
                registros.setdefault(s, {})[(item["registro"], item["nome"], item["situacao"])] = item
    consultado = datetime.now(timezone.utc).isoformat()
    resultado = {}
    for nome, _, _ in cat:
        s = slug(nome)
        todos = list(registros.get(s, {}).values())
        ativos = [x for x in todos if normalizar_ingrediente(x["situacao"]) == "ativo"]
        resultado[s] = {
            "situacao": "autorizado" if ativos else "sem_registro_ativo" if todos else "sem_registro",
            "verificadoEm": consultado,
            "registrosAtivos": len(ativos),
            "registros": sorted(ativos or todos, key=lambda x: (x["nome"], x["registro"]))[:5],
            "correspondencia": "ingrediente exato; registros combinados não são associados automaticamente",
        }
    return resultado

def canada_info(termo):
    ingrediente = urllib.parse.quote(termo, safe="")
    itens = get(f"{CANADA_API}activeingredient/?ingredientname={ingrediente}&lang=en&type=json")
    if itens is FALHA:
        return FALHA
    if itens is None:
        itens = []
    if not isinstance(itens, list):
        return FALHA
    alvo = normalizar_ingrediente(termo)
    codigos = sorted({
        str(x.get("drug_code")) for x in itens
        if normalizar_ingrediente(x.get("ingredient_name")) == alvo and x.get("drug_code") is not None
    })
    limite = 10
    parcial = len(codigos) > limite
    registros, falhou = [], False
    for codigo in codigos[:limite]:
        produto = get(f"{CANADA_API}drugproduct/?id={codigo}&lang=en&type=json")
        status = get(f"{CANADA_API}status/?id={codigo}&lang=en&type=json")
        if produto is FALHA or status is FALHA:
            falhou = True
            continue
        if not isinstance(produto, dict) or not isinstance(status, dict):
            falhou = True
            continue
        if produto.get("class_name") != "Human":
            continue
        registros.append({
            "produto": produto.get("brand_name", ""),
            "din": produto.get("drug_identification_number", ""),
            "situacao": status.get("status", ""),
            "data": status.get("history_date", ""),
        })
    autorizados = [x for x in registros if x["situacao"] in ("Approved", "Marketed", "Authorized By Interim Order")]
    parcial = parcial or falhou
    if autorizados:
        situacao = "autorizado"
    elif parcial:
        situacao = "consulta_parcial"
    elif registros:
        situacao = "sem_registro_ativo"
    elif codigos:
        situacao = "consulta_parcial"
    else:
        situacao = "sem_registro"
    return {
        "situacao": situacao,
        "verificadoEm": datetime.now(timezone.utc).isoformat(),
        "parcial": parcial,
        "registros": (autorizados or registros)[:5],
        "totalCorrespondenciasExatas": len(codigos),
    }

FALHA = object()
EMA_URL = "https://www.ema.europa.eu/en/documents/report/medicines-output-medicines_json-report_en.json"
EMA_ALIAS = {"leuprolide": "leuprorelin", "oxytocin": "oxytocin"}
_ema = None
INICIO_EXECUCAO = datetime.now(timezone.utc)

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
    host = urllib.parse.urlparse(url).hostname
    url = com_chave(url, host)
    for i in range(4):
        esperar_vez(host)
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
    return get(f"https://clinicaltrials.gov/api/v2/studies?query.intr={q}&pageSize=1&countTotal=true{extra}")

def ct_foco(termo, fase):
    """Estudos em que o ativo e a intervencao (nome da intervencao, nao comparador citado), iniciados desde 2015 e ativos ou concluidos."""
    adv = f'AREA[Phase]{fase} AND AREA[InterventionName]"{termo}" AND AREA[StartDate]RANGE[2015-01-01,MAX]'
    status = "RECRUITING|ACTIVE_NOT_RECRUITING|ENROLLING_BY_INVITATION|NOT_YET_RECRUITING|COMPLETED"
    return get("https://clinicaltrials.gov/api/v2/studies?pageSize=1&countTotal=true&sort=StartDate%3Aasc&fields=StartDate&filter.overallStatus="
               + urllib.parse.quote(status) + "&filter.advanced=" + urllib.parse.quote(adv))

def pm_raw(consulta, extra=""):
    q = urllib.parse.quote(consulta)
    return get(f"https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?db=pubmed&retmode=json&retmax=0&term={q}{extra}")

def pm(termo, extra=""):
    q = urllib.parse.quote(f"{termo}[Title/Abstract]")
    return get(f"https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?db=pubmed&retmode=json&retmax=0&term={q}{extra}")

def coletar(termo):
    r = {}
    def total(d): return d.get("totalCount") if isinstance(d, dict) else None
    def ok(d): return d is not FALHA
    def contagem(d):
        # o PubMed responde 200 com {"error": ...} ao estourar o limite; isso conta como falha da consulta
        try: return int(d["esearchresult"]["count"])
        except (KeyError, TypeError, ValueError): return FALHA
    d = ct(termo);                                        r["ensaios"] = total(d) if ok(d) else FALHA
    d = ct(termo, "&filter.advanced=AREA%5BPhase%5DPHASE1"); r["fase1"] = total(d) if ok(d) else FALHA
    d = ct(termo, "&filter.advanced=AREA%5BPhase%5DPHASE2"); r["fase2"] = total(d) if ok(d) else FALHA
    d = ct(termo, "&filter.advanced=AREA%5BPhase%5DPHASE3"); r["fase3"] = total(d) if ok(d) else FALHA
    d = ct(termo, "&filter.overallStatus=RECRUITING");    r["recrutando"] = total(d) if ok(d) else FALHA
    foco = {}
    for n, ph in ((1, "PHASE1"), (2, "PHASE2"), (3, "PHASE3")):
        d = ct_foco(termo, ph)
        foco[f"fase{n}"] = total(d) if ok(d) else FALHA
        if ok(d):
            try: foco[f"inicio{n}"] = d["studies"][0]["protocolSection"]["statusModule"]["startDateStruct"]["date"]
            except Exception: pass
    r["estudosFoco"] = FALHA if FALHA in foco.values() else foco
    d = ct(termo, "&sort=LastUpdatePostDate%3Adesc&fields=LastUpdatePostDate")
    if ok(d):
        try: r["ultimaAtualizacao"] = d["studies"][0]["protocolSection"]["statusModule"]["lastUpdatePostDateStruct"]["date"]
        except Exception: r["ultimaAtualizacao"] = None
    else: r["ultimaAtualizacao"] = FALHA
    d = pm(termo);                                        r["artigos"] = contagem(d) if ok(d) else FALHA
    d = pm(termo, "&datetype=pdat&reldate=365");          r["artigosAno"] = contagem(d) if ok(d) else FALHA
    d = get(f"https://api.fda.gov/drug/drugsfda.json?search=openfda.generic_name:%22{urllib.parse.quote(termo)}%22&limit=100")
    if d is FALHA: r["fdaRegistros"] = FALHA; r["fdaAprovacao"] = FALHA
    elif d is None: r["fdaRegistros"] = 0; r["fdaAprovacao"] = None
    else:
        r["fdaRegistros"] = d.get("meta", {}).get("results", {}).get("total", 0)
        r["fdaAprovacao"] = aprovacao_fda(d, termo)
    d = pm_raw(f"{termo}[Title/Abstract] AND (adverse OR safety OR toxicity)", "&datetype=pdat&reldate=365")
    r["segurancaAno"] = contagem(d) if ok(d) else FALHA
    d = pm_raw(f"{termo}[Title/Abstract] AND (systematic review[pt] OR meta-analysis[pt])", "&datetype=pdat&reldate=365")
    r["revisoesAno"] = contagem(d) if ok(d) else FALHA
    d = get(f"https://api.fda.gov/drug/label.json?search=openfda.generic_name:%22{urllib.parse.quote(termo)}%22&limit=1&sort=effective_time:desc")
    if d is FALHA: r["bula"] = FALHA
    elif d is None or not d.get("results"): r["bula"] = None
    else:
        b = d["results"][0]
        x = b.get("effective_time", "")
        r["bula"] = {"atualizada": f"{x[:4]}-{x[4:6]}-{x[6:]}" if len(x) == 8 else "", "caixaPreta": "boxed_warning" in b}
    r["alertas"] = recalls(termo)
    r["ema"] = ema_info(termo)
    r["canada"] = canada_info(termo)
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

def registrar_falha(exc):
    antigo = json.loads(SAIDA.read_text(encoding="utf-8")) if SAIDA.exists() else {"itens": {}}
    execucoes = antigo.get("execucoes", [])
    if not isinstance(execucoes, list):
        execucoes = []
    fim = datetime.now(timezone.utc)
    execucao = {
        "iniciadaEm": INICIO_EXECUCAO.isoformat(),
        "concluidaEm": fim.isoformat(),
        "status": "falhou",
        "erro": f"{type(exc).__name__}: {exc}"[:300],
    }
    antigo["execucao"] = execucao
    antigo["execucoes"] = [execucao] + execucoes[:19]
    SAIDA.write_text(json.dumps(antigo, ensure_ascii=False, indent=1), encoding="utf-8")
    print(f"Execução falhou: {execucao['erro']}", flush=True)

def eventos(nome, s, ant, novo):
    """Mudanças relevantes entre duas coletas. Só compara campos que a coleta anterior já verificava."""
    hoje = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    ev = lambda tipo, txt, fato=None: {"data": hoje, "slug": s, "nome": nome, "tipo": tipo, "texto": txt, **({"fato": fato} if fato else {})}
    out = []
    if not ant: return out
    mudou_fda = ant.get("fdaVerificadoEm") and novo.get("fdaVerificadoEm") != ant.get("fdaVerificadoEm")
    nova_aprovacao_fda = ant.get("fdaOk") and not ant.get("fdaAprovacao") and novo.get("fdaAprovacao")
    if nova_aprovacao_fda or (mudou_fda and ant.get("fdaAprovacao") != novo.get("fdaAprovacao")):
        tipo = "aprovacao" if novo.get("fdaAprovacao") else "seguranca"
        out.append(ev(tipo, "Registro de aprovação no Drugs@FDA mudou."))
    if ant.get("emaVerificado"):
        a, n = (ant.get("ema") or {}).get("situacao"), (novo.get("ema") or {}).get("situacao")
        if a != n:
            out.append(ev("aprovacao" if n == "autorizado" else "seguranca", f"Situação na EMA mudou: {a or 'sem registro'} → {n or 'sem registro'}."))
    for fonte, orgao in (("anvisa", "Anvisa"), ("canada", "Health Canada")):
        anterior, atual = ant.get(fonte), novo.get(fonte)
        def assinatura(d):
            return (
                d.get("situacao"),
                d.get("registrosAtivos"),
                d.get("totalCorrespondenciasExatas"),
                tuple(sorted((x.get("nome") or x.get("produto") or "", x.get("registro") or x.get("din") or "", x.get("situacao") or "") for x in d.get("registros", []))),
            )
        if anterior and atual and anterior.get("verificadoEm") and atual.get("verificadoEm") and assinatura(anterior) != assinatura(atual):
            tipo = "aprovacao" if atual["situacao"] == "autorizado" else "seguranca"
            out.append(ev(tipo, f"Situação ou registros na {orgao} mudaram: {anterior.get('situacao')} → {atual.get('situacao')}."))
    if ant.get("alertas") and novo.get("alertas") and novo["alertas"]["total"] > ant["alertas"]["total"]:
        out.append(ev("seguranca", f"{novo['alertas']['total'] - ant['alertas']['total']} novo(s) recall(s) na FDA (janela de 3 anos)."))
    campos_estudo = ("ensaios", "fase1", "fase2", "fase3", "recrutando")
    if all(isinstance(ant.get(k), int) and isinstance(novo.get(k), int) for k in campos_estudo):
        anterior = tuple(ant[k] for k in campos_estudo)
        atual = tuple(novo[k] for k in campos_estudo)
        if anterior != atual or ant.get("ultimaAtualizacao") != novo.get("ultimaAtualizacao"):
            out.append(ev("estudos", f"Dados do ClinicalTrials.gov mudaram: estudos {ant['ensaios']} → {novo['ensaios']}; fase 1/2/3 {ant['fase1']}/{ant['fase2']}/{ant['fase3']} → {novo['fase1']}/{novo['fase2']}/{novo['fase3']}; recrutando {ant['recrutando']} → {novo['recrutando']}; registro mais recente {novo.get('ultimaAtualizacao') or 'sem data'}.", novo.get("ultimaAtualizacao")))
    fa, fn = fase_foco(ant.get("estudosFoco")), fase_foco(novo.get("estudosFoco"))
    if fn and fn != fa and (fa is not None or ant.get("estudosFoco")):
        out.append(ev("estudos", f"Estudos com o ativo como intervenção (ClinicalTrials.gov) indicam fase mais avançada: {fa or 'nenhuma'} → {fn}. O selo de fase é atualizado automaticamente se o item for medicamento."))
    ab, nb = ant.get("bula"), novo.get("bula")
    if ab and nb and nb.get("atualizada") and nb["atualizada"] != ab.get("atualizada"):
        out.append(ev("conteudo", f"Bula da FDA atualizada ({ab.get('atualizada') or '?'} → {nb['atualizada']}). Reveja riscos e status.", nb["atualizada"]))
    if ab and nb and nb.get("caixaPreta") and not ab.get("caixaPreta"):
        out.append(ev("seguranca", "A bula da FDA passou a ter alerta em caixa preta (boxed warning)."))
    if isinstance(ant.get("revisoesAno"), int) and isinstance(novo.get("revisoesAno"), int) and novo["revisoesAno"] > ant["revisoesAno"]:
        out.append(ev("conteudo", f"{novo['revisoesAno'] - ant['revisoesAno']} nova(s) revisão(ões) sistemática(s)/meta-análise(s) no PubMed. Reveja evidência e benefícios."))
    if isinstance(ant.get("segurancaAno"), int) and isinstance(novo.get("segurancaAno"), int) and novo["segurancaAno"] >= ant["segurancaAno"] + 5:
        out.append(ev("seguranca", f"Aumento de publicações sobre segurança/efeitos adversos no PubMed ({ant['segurancaAno']} → {novo['segurancaAno']} no último ano). Reveja riscos."))
    return out

def fase_foco(foco):
    """Fase mais avancada sustentada por estudos focados no ativo (fase 3 exige 2 estudos)."""
    if not isinstance(foco, dict): return None
    if (foco.get("fase3") or 0) >= 2: return "Fase 3"
    if (foco.get("fase2") or 0) >= 1: return "Fase 2"
    if (foco.get("fase1") or 0) >= 1: return "Fase 1"
    return None

def gerar_aprovacoes(cat, itens):
    def data_verificada(valor):
        if isinstance(valor, (int, float)):
            return datetime.fromtimestamp(valor / 1000, timezone.utc).isoformat()
        return valor

    auto = {}
    for nome, _, _ in cat:
        i = itens.get(slug(nome), {})
        auto[slug(nome)] = {
            "fda": i.get("fdaAprovacao"),
            "fdaVerificadoEm": data_verificada(i.get("fdaVerificadoEm") or (i.get("quando") if i.get("fdaOk") else None)),
            "ema": i.get("ema"),
            "emaVerificadoEm": data_verificada(i.get("emaVerificadoEm") or (i.get("quando") if i.get("emaVerificado") else None)),
            "anvisa": i.get("anvisa"),
            "canada": i.get("canada"),
            "estudos": {**{k: i.get(k) for k in ("ensaios", "fase1", "fase2", "fase3", "recrutando", "ultimaAtualizacao")}, "foco": i.get("estudosFoco")},
        }
    (raiz / "dados" / "aprovacoes.js").write_text(
        "/* Gerado por tools/atualizar.py: status consultados em fontes oficiais. */\n"
        "const APROVACOES_AUTO = " + json.dumps(auto, ensure_ascii=False, indent=1) + ";\n", encoding="utf-8")
    return auto

def main():
    inicio = INICIO_EXECUCAO
    antigo = json.loads(SAIDA.read_text(encoding="utf-8")) if SAIDA.exists() else {"itens": {}}
    filtro = set(sys.argv[sys.argv.index("--so") + 1:]) if "--so" in sys.argv else None
    novo, sugestoes, historico = dict(antigo.get("itens", {})), [], []
    itens_processados = falhas_consulta = 0
    cat = catalogo()
    try:
        dados_anvisa = coletar_anvisa(cat)
    except (OSError, UnicodeError, csv.Error, http.client.HTTPException, ValueError) as erro:
        dados_anvisa = FALHA
        falhas_consulta += 1
        print(f"Consulta da base de medicamentos da Anvisa sem resposta; dados anteriores preservados: {type(erro).__name__}: {erro}", flush=True)
    else:
        print(f"Base de medicamentos da Anvisa consultada: {sum(x['situacao'] == 'autorizado' for x in dados_anvisa.values())} itens com registro ativo.", flush=True)
    ema_base()  # carrega uma vez antes das threads
    tarefas = [(n, nome, fase, termo) for n, (nome, fase, termo) in enumerate(cat, 1) if not filtro or slug(nome) in filtro]
    if not OPENFDA_KEY and len(tarefas) > 200:
        print("Aviso: sem OPENFDA_API_KEY o openFDA limita a ~1000 consultas/dia; itens sem resposta mantêm os dados anteriores.", flush=True)
    with ThreadPoolExecutor(max_workers=TRABALHADORES) as pool:
        resultados = pool.map(lambda t: coletar(t[3]), tarefas)
        for (n, nome, fase, termo), atual in zip(tarefas, resultados):
            s = slug(nome)
            print(f"[{n}/{len(cat)}] {nome} ({termo})", flush=True)
            if dados_anvisa is not FALHA:
                atual["anvisa"] = dados_anvisa[s]
            falhas = [chave for chave, valor in atual.items() if valor is FALHA]
            itens_processados += 1
            falhas_consulta += len(falhas)
            if falhas:
                print(f"  Consultas sem resposta: {', '.join(falhas)}", flush=True)
            base = antigo.get("itens", {}).get(s, {})
            item = dict(base)
            item.update({k: v for k, v in atual.items() if v is not FALHA})
            item["fdaOk"] = item.get("fdaRegistros") is not None
            agora = datetime.now(timezone.utc).isoformat()
            if "fdaRegistros" not in falhas:
                item["fdaVerificadoEm"] = agora
            item["emaVerificado"] = ema_base() is not FALHA if "ema" not in falhas else base.get("emaVerificado", False)
            if "ema" not in falhas and item["emaVerificado"]:
                item["emaVerificadoEm"] = agora
            if "fdaAprovacao" in item and item["fdaAprovacao"] is None: del item["fdaAprovacao"]
            if item.get("ema") is None: item.pop("ema", None)
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
    auto = gerar_aprovacoes(cat, novo)
    for nome, fase, _ in cat:
        a = auto.get(slug(nome), {})
        aprovado = (
            a.get("fda")
            or (a.get("ema") or {}).get("situacao") == "autorizado"
            or (a.get("anvisa") or {}).get("situacao") == "autorizado"
            or (a.get("canada") or {}).get("situacao") == "autorizado"
        )
        if fase != "Aprovado" and aprovado:
            sugestoes.append(f"{nome}: aprovação oficial detectada; o site já mostra 'Aprovado' automaticamente. Revise o texto do catálogo.")
    hist_arq = raiz / "dados" / "historico.js"
    antigo_h = []
    if hist_arq.exists():
        m = re.search(r"=\s*(\[.*\]);", hist_arq.read_text(encoding="utf-8"), re.S)
        if m: antigo_h = json.loads(m.group(1))
    todos = (historico + antigo_h)[:300]
    hist_arq.write_text("/* Gerado por tools/atualizar.py: mudanças detectadas entre coletas. */\nconst HISTORICO_AUTO = " + json.dumps(todos, ensure_ascii=False, indent=1) + ";\n", encoding="utf-8")
    fila = {}
    for ev_ in historico:
        if ev_["tipo"] in ("conteudo", "seguranca", "aprovacao", "estudos"):
            fila.setdefault(ev_["slug"], []).append({"data": ev_["data"], "tipo": ev_["tipo"], "texto": ev_["texto"], **({"fato": ev_["fato"]} if ev_.get("fato") else {})})
    for nome, fase, _ in cat:
        i = novo.get(slug(nome), {})
        for sug in sugestoes:
            if sug.startswith(nome + ":"):
                fila.setdefault(slug(nome), []).append({"data": datetime.now(timezone.utc).strftime("%Y-%m-%d"), "tipo": "fase", "texto": sug.split(": ", 1)[1]})
    antiga = {}
    arq_fila = raiz / "dados" / "revisao-pendente.js"
    if arq_fila.exists():
        m = re.search(r"=\s*(\{.*\});", arq_fila.read_text(encoding="utf-8"), re.S)
        if m: antiga = json.loads(m.group(1))
    for s_, lst in fila.items():
        ja = {(x["tipo"], x["texto"]) for x in antiga.get(s_, [])}
        antiga[s_] = [x for x in lst if (x["tipo"], x["texto"]) not in ja] + antiga.get(s_, [])
    arq_fila.write_text("/* Gerado por tools/atualizar.py: sinais nas fontes que pedem revisao humana do texto. Limpe com tools/revisar.py. */\nconst REVISAO_PENDENTE = " + json.dumps(antiga, ensure_ascii=False, indent=1) + ";\n", encoding="utf-8")
    fim = datetime.now(timezone.utc)
    execucao = {
        "iniciadaEm": inicio.isoformat(),
        "concluidaEm": fim.isoformat(),
        "status": "concluida_com_falhas" if falhas_consulta else "concluida",
        "escopo": "parcial" if filtro else "catalogo",
        "itensProcessados": itens_processados,
        "itensNoCatalogo": len(cat),
        "consultasSemResposta": falhas_consulta,
    }
    execucoes_antigas = antigo.get("execucoes", [])
    if not isinstance(execucoes_antigas, list):
        execucoes_antigas = []
    execucoes = [execucao] + execucoes_antigas[:19]
    saida = {
        "geradoEm": fim.isoformat(),
        "execucao": execucao,
        "execucoes": execucoes,
        "sugestoes": sugestoes,
        "itens": novo,
    }
    SAIDA.write_text(json.dumps(saida, ensure_ascii=False, indent=1), encoding="utf-8")
    print(
        f"\nExecução {execucao['status']}: {itens_processados}/{len(cat)} itens processados, "
        f"{falhas_consulta} consultas sem resposta. "
        f"{len(novo)} itens gravados em {SAIDA.name}; {len(sugestoes)} sugestões de revisão.",
        flush=True,
    )
    for s in sugestoes: print(" -", s)

if __name__ == "__main__":
    try:
        main()
    except Exception as erro:
        registrar_falha(erro)
        raise
