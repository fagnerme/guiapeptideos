"""Coleta como os estudos clínicos foram conduzidos (doses, via, frequência e duração) no ClinicalTrials.gov.
Uso: python tools/coletar_estudos.py [--so SLUG ...] [--limite N]
Grava dados/estudos/<slug>.json (um arquivo por item, carregado só na ficha) e dados/estudos/index.json.
Os valores são extraídos do texto dos braços e das intervenções do registro; o texto original acompanha cada estudo."""
import json, pathlib, re, sys, threading, time
from concurrent.futures import ThreadPoolExecutor
import urllib.parse, urllib.request

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
import atualizar as A
from condicoes_pt import traduzir

raiz = A.raiz
PASTA = raiz / "dados" / "estudos"
CAMPOS = ("NCTId,BriefTitle,Phase,EnrollmentCount,StartDate,PrimaryCompletionDate,Condition,ArmGroupLabel,ArmGroupType,"
          "ArmGroupDescription,ArmGroupInterventionName,InterventionName,InterventionDescription,InterventionOtherName,PrimaryOutcomeTimeFrame,BriefSummary,DetailedDescription")

ESQUEMA = [
    ("Ciclos / intermitente", r"\bcycles?\b|\bon[/ -]off\b|\bweeks? on\b|intermittent|drug holiday|alternating|\bcyclic"),
    ("Pausa entre períodos (washout)", r"wash-?\s?out|treatment-free|drug-free|off[- ]treatment"),
    ("Aumento gradual da dose", r"titrat|escalat|run-in|lead-in|ramp"),
    ("Retirada / interrupção", r"withdraw|discontinu|\btaper|cessation|stopped|stop treatment"),
    ("Fase de extensão ou seguimento", r"extension|follow-up period|follow-up phase|open-label extension"),
]
NUM = r"\d{1,3}(?:,\d{3})+(?:\.\d+)?|\d+(?:\.\d+)?|\d+,\d{1,2}"
DOSE = re.compile(r"(?<![\w.,])(" + NUM + r")\s*(mg/kg|mcg/kg|µg/kg|μg/kg|ug/kg|g/kg|mg|mcg|µg|μg|ug|g|IU|UI|units?)\b(?!\s*/\s*(?:m2|m²|dL|mL|L)\b)", re.I)
UNID = {"mcg": "mcg", "µg": "mcg", "μg": "mcg", "ug": "mcg", "mg": "mg", "g": "g", "mg/kg": "mg/kg", "mcg/kg": "mcg/kg", "g/kg": "g/kg",
        "µg/kg": "mcg/kg", "μg/kg": "mcg/kg", "ug/kg": "mcg/kg", "iu": "UI", "ui": "UI", "unit": "unidades", "units": "unidades"}
FREQ = [
    (r"\b(twice|two times)\s+(a\s+|per\s+)?week(ly)?\b|\bBIW\b", "2×/semana"),
    (r"\b(three times|thrice)\s+(a\s+|per\s+)?week(ly)?\b|\bTIW\b", "3×/semana"),
    (r"\bonce[\s-]+(a\s+|per\s+)?week(ly)?\b|\b(every|each)\s+week\b|\bweekly\b|\bQW\b|\bq1w\b|\bper week\b", "1×/semana"),
    (r"\b(every|each)\s+(2|two)\s+weeks\b|\bevery other week\b|\bbi-?weekly\b|\bQ2W\b", "a cada 2 semanas"),
    (r"\b(every|each)\s+(4|four)\s+weeks\b|\bonce\s+(a\s+|per\s+)?month\b|\bmonthly\b|\bQ4W\b", "a cada 4 semanas (mensal)"),
    (r"\b(three times|thrice)\s+(a\s+|per\s+)?(day|daily)\b|\bTID\b|\bt\.i\.d\b", "3×/dia"),
    (r"\b(twice|two times)\s+(a\s+|per\s+)?(day|daily)\b|\bBID\b|\bb\.i\.d\b", "2×/dia"),
    (r"\bevery other day\b|\balternate days?\b", "dias alternados"),
    (r"\bonce[\s-]+(a\s+|per\s+)?(day|daily)\b|\b(every|each)\s+day\b|\bdaily\b|\bQD\b|\bper day\b|/\s*day\b|\ba day\b|\bq\.d\b", "1×/dia"),
    (r"\bsingle[\s-]+(dose|injection|administration)\b|\bone[\s-]+time\b|\bonce only\b", "dose única"),
]
VIAS = [
    (r"\bsubcutaneous(ly)?\b|\bs\.?c\.?\b(?=[\s,.)]|$)|\bsubcut\b|\bSQ\b|\bSC\b", "subcutânea"),
    (r"\bintramuscular(ly)?\b|\bi\.?m\.?\b(?=[\s,.)]|$)|\bIM\b", "intramuscular"),
    (r"\bintravenous(ly)?\b|\binfusion\b|\bI\.?V\.?\b|\bIV\b", "intravenosa"),
    (r"\bintranasal(ly)?\b|\bnasal\b", "nasal"),
    (r"\bsublingual\b", "sublingual"),
    (r"\btopical(ly)?\b|\bcream\b|\bointment\b|\bgel\b|\btransdermal\b|\bpatch\b", "tópica/transdérmica"),
    (r"\binhal(ed|ation|er)\b", "inalada"),
    (r"\boral(ly)?\b|\btablets?\b|\bcapsules?\b|\bby mouth\b|\bsoftgel\b|\bpills?\b|\bPO\b", "oral"),
]
DUR = re.compile(r"(" + NUM + r")\s*[- ]?\s*(weeks?|wks?|months?|mos?|days?|years?|yrs?)\b", re.I)
SEM = re.compile(r"\b(?:week|wk)s?\s*(\d+)\b", re.I)
EM_DIAS = {"d": 1, "w": 7, "m": 30.4, "y": 365}


def numero(s):
    if re.fullmatch(r"\d{1,3}(?:,\d{3})+(?:\.\d+)?", s):
        return float(s.replace(",", ""))
    return float(s.replace(",", "."))


def fmt_num(x):
    if x >= 1000 and x == int(x):
        return f"{int(x):,}".replace(",", ".")
    return str(int(x)) if x == int(x) else str(x).replace(".", ",")


def doses_de(txt):
    achados = []
    for m in DOSE.finditer(txt):
        v, u = numero(m.group(1)), UNID.get(m.group(2).lower())
        if not u or v <= 0:
            continue
        # tratamento de "1 g" isolado em frase de peso/volume é raro; descarta valores absurdos
        if u == "mg" and v > 20000:
            continue
        achados.append((u, v))
    vistos, saida = set(), []
    for u, v in achados:
        if (u, v) not in vistos:
            vistos.add((u, v))
            saida.append((u, v))
    return saida


def dias_de(txt):
    out = []
    for m in DUR.finditer(txt):
        n, un = numero(m.group(1)), m.group(2).lower()[0]
        d = n * EM_DIAS["m" if un == "m" else un]
        if 1 <= d <= 3700:
            out.append((d, f"{fmt_num(n)} " + {"d": ("dia" if n == 1 else "dias"), "w": ("semana" if n == 1 else "semanas"), "m": ("mês" if n == 1 else "meses"), "y": ("ano" if n == 1 else "anos")}[un]))
    return out


def semana_de(txt):
    n = [int(x) for x in SEM.findall(txt)]
    n = [x for x in n if 1 <= x <= 520]
    return max(n) if n else None


def unico(seq):
    return list(dict.fromkeys(seq))


def padroes(txt, tabela, limite=2):
    achados = []
    for rx, rot in tabela:
        if re.search(rx, txt, re.I if rx.islower() or "(?i)" in rx else re.I) and rot not in achados:
            achados.append(rot)
    return achados[:limite]


def casa_substancia(txt, termos):
    t = txt.lower()
    return any(x in t for x in termos)


def esquema_de(textos):
    """Etiquetas e trechos (inglês) que descrevem ciclos, pausas, titulação ou retirada."""
    frases = []
    for t in textos:
        for f in re.split(r"(?<=[.;!?])\s+|\n+", t or ""):
            f = f.strip()
            if 25 <= len(f) <= 300 and f not in frases:
                frases.append(f)
    tags, trechos = [], []
    for rot, rx in ESQUEMA:
        achou = [f for f in frases if re.search(rx, f, re.I) and re.search(r"\d|week|month|day|cycle", f, re.I)]
        if achou:
            tags.append(rot)
            for f in achou[:1]:
                if f not in trechos and len(trechos) < 3:
                    trechos.append(f)
    return {"tags": tags, "trechos": trechos} if tags else None


def analisar(est, termos):
    p = est["protocolSection"]
    arms = p.get("armsInterventionsModule", {}).get("armGroups", []) or []
    ints = p.get("armsInterventionsModule", {}).get("interventions", []) or []
    int_txt = {}
    for i in ints:
        nomes = [i.get("name", "")] + (i.get("otherNames") or [])
        int_txt[i.get("name", "")] = (" ".join(nomes), i.get("description") or "")
    usados = []
    for a in arms:
        if a.get("type") == "PLACEBO_COMPARATOR" or a.get("type") == "NO_INTERVENTION":
            continue
        nomes_int = " ".join(a.get("interventionNames") or [])
        alvo_txt = f"{a.get('label', '')} {a.get('description', '')} {nomes_int}"
        for n in a.get("interventionNames") or []:
            n = re.sub(r"^\w+:\s*", "", n)
            if n in int_txt:
                alvo_txt += " " + int_txt[n][0]
        if casa_substancia(alvo_txt, termos):
            usados.append(a)
    if not usados:
        usados = [a for a in arms if a.get("type") == "EXPERIMENTAL"]
    if not usados:
        return None
    textos = []
    for a in usados:
        t = f"{a.get('label', '')}. {a.get('description') or ''}"
        for n in a.get("interventionNames") or []:
            n2 = re.sub(r"^\w+:\s*", "", n)
            if n2 in int_txt and casa_substancia(n2 + " " + int_txt[n2][0], termos):
                t += " " + (int_txt[n2][1] or "")
        textos.append(t.strip())
    for i in ints:
        if casa_substancia(i.get("name", "") + " " + " ".join(i.get("otherNames") or []), termos) and i.get("description"):
            if i["description"] not in " ".join(textos):
                textos.append(i["description"])
    junto = " ".join(textos)
    ds = doses_de(" ".join(f"{a.get('label', '')} {a.get('description') or ''}" for a in usados)) or doses_de(junto)
    por_un = {}
    for u, v in ds:
        por_un.setdefault(u, []).append(v)
    doses = []
    for u, vs in por_un.items():
        doses.append(", ".join(fmt_num(x) for x in sorted(set(vs))[:8]) + f" {u}")
    freq = padroes(junto, FREQ, 1)
    via = padroes(junto, VIAS, 2)
    tfs = [o.get("timeFrame") or "" for o in p.get("outcomesModule", {}).get("primaryOutcomes", [])[:3]]
    tfs = [t for t in tfs if not re.search(r"\b(after|follow|post|within|since|before|prior)\b|\bup to\s+\d+\s*days?\b|adverse", t, re.I)]
    arm_txt = " ".join(f"{a.get('description') or ''}" for a in usados)
    cand = []
    for t in tfs:
        sem = semana_de(t)
        if sem:
            cand.append((sem * 7, f"{sem} semanas"))
        cand += dias_de(t)
    origem = "desfecho"
    if not cand:
        origem = "braco"
        cand = dias_de(" ".join(m.group(0) for m in re.finditer(r"(?:for|during|over)\s+(?:up to\s+)?(?:\d+(?:[.,]\d+)?\s*(?:to|-)\s*)?\d+(?:[.,]\d+)?\s*[- ]?\s*(?:weeks?|wks?|months?|days?|years?)", arm_txt, re.I)))
    dur = max(cand)[1] if cand else None
    pid = p["identificationModule"]
    st = p["statusModule"]
    ano = lambda k: (st.get(k) or {}).get("date", "")[:4]
    des = p["designModule"]
    nbr = (des.get("enrollmentInfo") or {}).get("count")
    fases = [f.replace("PHASE", "Fase ").replace("EARLY_Fase 1", "Fase 1") for f in des.get("phases", [])]
    conds = [traduzir(c) for c in (p.get("conditionsModule", {}).get("conditions") or [])[:3]]
    braco = max(usados, key=lambda a: len(a.get("description") or ""))
    return {
        "nct": pid["nctId"], "titulo": pid.get("briefTitle", ""), "fase": " / ".join(fases), "n": nbr,
        "inicio": ano("startDateStruct"), "fim": ano("primaryCompletionDateStruct"), "condicoes": conds,
        "doses": doses, "frequencia": freq, "via": via, "duracao": dur, "duracaoOrigem": origem if dur else None,
        "braco": {"nome": braco.get("label", ""), "texto": (braco.get("description") or "")[:420]},
        "bracos": len(arms),
        "esquema": esquema_de(textos + [p.get("descriptionModule", {}).get("briefSummary"), p.get("descriptionModule", {}).get("detailedDescription")]),
    }


def termos_de(nome, termo):
    base = {termo.lower(), re.sub(r"\s*\(.*?\)", "", nome).lower()}
    for m in re.findall(r"\(([^)]+)\)", nome):
        base.add(m.lower())
    return {x for x in base if len(x) > 3}


def buscar(termo, fase_filtro, status="COMPLETED"):
    adv = f'AREA[InterventionName]"{termo}"'
    url = ("https://clinicaltrials.gov/api/v2/studies?pageSize=12&sort=EnrollmentCount%3Adesc&filter.overallStatus=" + status
           + "&aggFilters=" + urllib.parse.quote(fase_filtro) + "&fields=" + CAMPOS + "&filter.advanced=" + urllib.parse.quote(adv))
    d = A.get(url)
    return d.get("studies", []) if isinstance(d, dict) else []


def pontuar(e):
    return (bool(e["doses"]) + bool(e["duracao"]) + bool(e["frequencia"]) + bool(e["via"]), e["n"] or 0)


def coletar_item(nome, termo):
    termos = termos_de(nome, termo)
    achados, vistos = [], set()
    for filtro in ("phase:2 3", "phase:1"):
        for est in buscar(termo, filtro):
            nct = est["protocolSection"]["identificationModule"]["nctId"]
            if nct in vistos:
                continue
            vistos.add(nct)
            try:
                e = analisar(est, termos)
            except Exception:
                e = None
            if e and e["doses"]:
                achados.append(e)
        if len([a for a in achados if a["duracao"]]) >= 3:
            break
    achados.sort(key=pontuar, reverse=True)
    return achados[:3]


CACHE_PT = PASTA / "_cache_pt.json"
_cache = json.loads(CACHE_PT.read_text(encoding="utf-8")) if CACHE_PT.exists() else {}
_trava = threading.Lock()


def para_pt(txt):
    """Tradução automática en→pt (endpoint público do Google Tradutor), com cache em disco; devolve '' se falhar."""
    txt = (txt or "").strip()
    if not txt:
        return ""
    with _trava:
        if txt in _cache:
            return _cache[txt]
    url = "https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=pt&dt=t&q=" + urllib.parse.quote(txt)
    for tent in range(3):
        try:
            req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
            with urllib.request.urlopen(req, timeout=20) as r:
                d = json.loads(r.read().decode("utf-8"))
            pt = "".join(seg[0] for seg in d[0] if seg and seg[0]).strip()
            if pt:
                with _trava:
                    _cache[txt] = pt
                return pt
        except Exception:
            time.sleep(1 + tent)
    return ""


def traduzir_estudos(lista):
    for e in lista:
        if e.get("esquema") and not e["esquema"].get("trechosPt"):
            pts = [para_pt(t) for t in e["esquema"]["trechos"]]
            if all(pts):
                e["esquema"]["trechosPt"] = pts
        if e.get("condicoes") and not e.get("condPt"):
            novas = [para_pt(c) or c for c in e["condicoes"]]
            e["condicoes"] = [n[:1].upper() + n[1:] for n in novas]
            e["condPt"] = True
        b = e.get("braco") or {}
        if b.get("texto") and not b.get("textoPt"):
            b["textoPt"] = para_pt(b["texto"])
        if b.get("nome") and not b.get("nomePt"):
            b["nomePt"] = para_pt(b["nome"])
        if e.get("titulo") and not e.get("tituloPt"):
            e["tituloPt"] = para_pt(e["titulo"])
    return lista


def salvar_cache():
    CACHE_PT.write_text(json.dumps(_cache, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")


def so_traduzir():
    arqs = [f for f in PASTA.glob("*.json") if f.name not in ("index.json", "_cache_pt.json")]

    def um(f):
        lista = json.loads(f.read_text(encoding="utf-8"))
        f.write_text(json.dumps(traduzir_estudos(lista), ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    with ThreadPoolExecutor(max_workers=8) as ex:
        list(ex.map(um, arqs))
    salvar_cache()
    print("traduzidos:", len(arqs), "arquivos;", len(_cache), "trechos no cache")


def main():
    if "--traduzir" in sys.argv:
        return so_traduzir()
    args = sys.argv[1:]
    so = set()
    if "--so" in args:
        i = args.index("--so")
        so = set(args[i + 1:])
    limite = int(args[args.index("--limite") + 1]) if "--limite" in args else 0
    cat = A.catalogo()
    if so:
        cat = [c for c in cat if A.slug(c[0]) in so]
    if limite:
        cat = cat[:limite]
    PASTA.mkdir(exist_ok=True)
    idx_path = PASTA / "index.json"
    idx = json.loads(idx_path.read_text(encoding="utf-8")) if idx_path.exists() and so else []
    idx = set(idx)

    def trabalho(c):
        nome, _fase, termo = c
        try:
            return A.slug(nome), traduzir_estudos(coletar_item(nome, termo))
        except Exception as ex:
            return A.slug(nome), ex

    feitos = 0
    with ThreadPoolExecutor(max_workers=A.TRABALHADORES) as ex:
        for s, r in ex.map(trabalho, cat):
            feitos += 1
            f = PASTA / f"{s}.json"
            if isinstance(r, Exception):
                print("erro", s, r)
                continue
            if r:
                f.write_text(json.dumps(r, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
                idx.add(s)
            else:
                f.unlink(missing_ok=True)
                idx.discard(s)
            if feitos % 50 == 0:
                print(feitos, "/", len(cat), flush=True)
    idx_path.write_text(json.dumps(sorted(idx), separators=(",", ":")), encoding="utf-8")
    salvar_cache()
    print("itens com estudos:", len(idx))


if __name__ == "__main__":
    main()
