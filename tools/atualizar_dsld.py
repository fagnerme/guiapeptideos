"""Suplementos/ativos a partir do DSLD (NIH, dominio publico): relatorio do que falta
(so ativos, sem marcas) e importacao automatica de fichas novas com texto de apresentacao da Wikipedia (CC BY-SA 4.0).
Uso:
  python tools/atualizar_dsld.py                  -> relatorio (tools/relatorio_dsld.md)
  python tools/atualizar_dsld.py --importar [--min 300] [--limite 20]   -> tambem cria fichas novas (com validacao e desfazer)
  python tools/atualizar_dsld.py --simular --importar                   -> mostra o que importaria, sem gravar
Depois rode: python tools/build.py <URL>"""
import json, re, shutil, subprocess, sys, time, urllib.parse, urllib.request
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

TOOLS = Path(__file__).resolve().parent
RAIZ = TOOLS.parent
NOVOS = TOOLS / "novos"
sys.path.insert(0, str(TOOLS))
import faltam_chembl, gerar_fichas, atualizar_chembl  # noqa

try:
    sys.stdout.reconfigure(encoding="utf-8")
except Exception:
    pass

API = "https://api.ods.od.nih.gov/dsld/v9/"
GRUPOS = NOVOS / "_dsld_grupos.json"
CONTAGENS = NOVOS / "_dsld_contagens.json"
RELATORIO = TOOLS / "relatorio_dsld.md"
UA = {"User-Agent": "GuiaEducativoPeptideos/1.0 (projeto educativo)", "Accept": "application/json"}
PERMITIDAS = {"vitamin", "mineral", "amino acid", "fatty acid", "hormone", "non-nutrient/non-botanical"}
LIXO = re.compile(r"stearate|silica|silicon|cellulose|gelatin|glycerin|glycerol|titanium|talc|flavor|colou?r|sucralose|aspartame|"
                  r"acesulfame|stevia|citric acid|acetic|sorbate|benzoate|lecithin|maltodextrin|starch|dextrin|\bgum\b|wax|"
                  r"\bwater\b|sodium chloride|carbonate|dioxide|phosphate|polysorbate|sorbitol|xylitol|mannitol|erythritol|"
                  r"carrageenan|pectin|shellac|propylene|caramel|hydroxide|povidone|vanillin|ethyl|blend|complex|proprietary|"
                  r"unspecified|\bother\b|extract|natural|artificial|preservative|sweetener|capsule|excipient|polyethylene|"
                  r"paraffin|palmitate|sulfate|chloride|oleate|laurate|lactose|sucrose|fructose|glucose|dextrose|mineral oil|"
                  r"edta|ethylenediamine|chlorine|alcohol|ethanol|octanol|glycerides|hypromellose|croscarmellose|methylcellulose|ascorbyl|tocopheryl acetate", re.I)
CAT_FICHA = {"vitamin": "Vitamina", "mineral": "Mineral", "hormone": "Hormônio"}
REL_QUIM = re.compile(r"compound|acid|vitamin|mineral|amino|nutrient|hormone|enzyme|supplement|molecule|substance|element|"
                      r"antioxidant|fatty|chemical|peptide|metabolite|alkaloid|steroid|coenzyme|cofactor|carotenoid|flavonoid|"
                      r"polyphenol|derivative|nootropic|neurotransmitter|organic", re.I)
PT_REL = re.compile(r"composto|ácido|acido|vitamina|mineral|amino|nutriente|hormôni|hormon|enzima|suplemento|molécula|substância|"
                    r"elemento|antioxidante|graxo|químic|peptídeo|metabólito|alcaloide|esteroide|coenzima|cofator|carotenoide|"
                    r"flavonoide|polifenol|derivado|neurotransmissor|orgânic|lipídio|proteína", re.I)


def get(u, tent=3):
    for _ in range(tent):
        try:
            with urllib.request.urlopen(urllib.request.Request(u, headers=UA), timeout=30) as r:
                return json.load(r)
        except Exception:
            time.sleep(2 * (_ + 1))
    return {}


def grupos():
    if GRUPOS.exists() and time.time() - GRUPOS.stat().st_mtime < 30 * 86400:
        return json.loads(GRUPOS.read_text("utf-8"))
    tudo = {}
    for L in list("ABCDEFGHIJKLMNOPQRSTUVWXYZ") + ["Other"]:
        off = 0
        while True:
            hs = get(API + "ingredient-groups?method=by_letter&term=%s&size=200&from=%d" % (L, off)).get("hits", [])
            for h in hs:
                s = h["_source"]
                tudo[s["groupId"]] = {"id": s["groupId"], "nome": s["groupName"], "cat": s.get("category", []),
                                      "sin": s.get("synonyms", [])[:8], "fs": len(s.get("factsheets", []))}
            off += 200
            if len(hs) < 200:
                break
    if tudo:
        GRUPOS.write_text(json.dumps(tudo, ensure_ascii=False), "utf-8")
    return tudo


def contagem(termo, extra=""):
    """Numero de rotulos no mercado; None se a API falhar (nao confundir com zero)."""
    q = "search-filter?q=*&ingredient_name=%s&status=1&size=1%s" % (urllib.parse.quote(termo), extra)
    d = get(API + q, 5)
    if "stats" not in d:
        return None
    return int((d["stats"] or {}).get("count") or 0)


def contagens_cache():
    return json.loads(CONTAGENS.read_text("utf-8")) if CONTAGENS.exists() else {}


def preencher(termos):
    """Garante contagens em cache (validade de 30 dias)."""
    c = contagens_cache()
    agora = time.time()
    falta = [t for t in termos if t not in c or agora - c[t].get("t", 0) > 30 * 86400]
    print("consultando o DSLD para %d termos..." % len(falta))

    def um(t):
        n = contagem(t)
        r = None if n is None else {"n": n}
        if r is not None:
            r["t"] = agora
        return t, r
    falhas = 0
    with ThreadPoolExecutor(2) as ex:
        for i in range(0, len(falta), 150):
            for t, r in ex.map(um, falta[i:i + 150]):
                if r is None:
                    falhas += 1
                else:
                    c[t] = r
            CONTAGENS.write_text(json.dumps(c, ensure_ascii=False), "utf-8")
            print("  %d/%d" % (min(i + 150, len(falta)), len(falta)), flush=True)
    if falhas:
        print("aviso: %d consultas falharam e serao refeitas na proxima execucao" % falhas)
    return c


def catalogo():
    cat = faltam_chembl.chaves_catalogo()
    txt = (RAIZ / "data.js").read_bytes().decode("utf-8") + "".join(f.read_bytes().decode("utf-8", "ignore") for f in NOVOS.glob("novos_*.py"))
    for m in re.findall(r'P\("([^"]+)"|"nome":\s*"([^"]+)"', txt):
        n = re.sub(r"\s*\(.*?\)", "", m[0] or m[1])
        cat.add(faltam_chembl.stem(n))
    return cat | {re.sub(r"^(dl|l|d)(?=[a-z]{5})", "", k) for k in cat}


def chave(x):
    return re.sub(r"^(dl|l|d)(?=[a-z]{5})", "", faltam_chembl.stem(x))


def candidatos(minimo):
    cat = catalogo()
    vistos, lista = set(), []
    for g in grupos().values():
        cats = {c.lower() for c in g["cat"] if c}
        if not cats & PERMITIDAS or LIXO.search(g["nome"]):
            continue
        k = faltam_chembl.norm(g["nome"])
        if not k or k in vistos:
            continue
        vistos.add(k)
        nomes = [g["nome"]] + [s for s in g["sin"] if len(s) <= 40][:6]
        if any(len(faltam_chembl.norm(x)) >= 4 and chave(x) in cat for x in nomes):
            continue
        tipo = next((CAT_FICHA[c] for c in ("vitamin", "mineral", "hormone") if c in cats), "Suplemento e metabólito")
        lista.append({"nome": g["nome"], "cat": tipo, "sin": g["sin"], "fs": g["fs"]})
    c = preencher([x["nome"] for x in lista])
    for x in lista:
        x["n"] = c.get(x["nome"], {}).get("n", 0)
    lista = [x for x in lista if x["n"] >= minimo]
    lista.sort(key=lambda x: -x["n"])
    return lista


# ---------- texto educativo (Wikipedia) e fase (ClinicalTrials.gov) ----------
def resumo(lang, titulo):
    return get("https://%s.wikipedia.org/api/rest_v1/page/summary/%s?redirect=true" % (lang, urllib.parse.quote(titulo.replace(" ", "_"), safe="")), 4)


def frases(txt, limite):
    out = ""
    for f in re.split(r"(?<=[.!?])\s+(?=[A-ZÁÉÍÓÚÂÊÔÃÕÇ])", txt.strip()):
        if len(out) + len(f) > limite and out:
            break
        out += (" " if out else "") + f
    return out


def wiki(nome):
    en = resumo("en", nome)
    if en.get("type") != "standard" or not en.get("extract"):
        return None
    if not REL_QUIM.search((en.get("description") or "") + " " + en["extract"][:300]):
        return None
    ll = get("https://en.wikipedia.org/w/api.php?action=query&prop=langlinks&lllang=pt&titles=%s&redirects=1&format=json" % urllib.parse.quote(en["title"]), 4)
    pt_t = None
    for pg in (ll.get("query", {}).get("pages") or {}).values():
        for l in pg.get("langlinks", []):
            pt_t = l.get("*")
    if not pt_t:
        return None
    pt = resumo("pt", pt_t)
    ext = pt.get("extract") or ""
    if pt.get("type") != "standard" or len(ext) < 120:
        return None
    url = (pt.get("content_urls") or {}).get("desktop", {}).get("page") or "https://pt.wikipedia.org/wiki/" + urllib.parse.quote(pt_t.replace(" ", "_"))
    return {"nome": re.sub(r"\s*\(.*?\)\s*", " ", pt["title"]).strip(), "texto": frases(ext, 700), "url": url, "en": en["title"]}


def ensaios(termo):
    # so ensaios de suplemento alimentar: sem isso a busca traz sais de medicamentos (ex.: cabozantinibe malato)
    base = "https://clinicaltrials.gov/api/v2/studies?query.intr=%s&countTotal=true&filter.advanced=" % urllib.parse.quote(termo)
    filtro = "AREA[InterventionType]DIETARY_SUPPLEMENT"
    d = get(base + urllib.parse.quote(filtro) + "&pageSize=100&fields=Condition")
    r = {"total": int(d.get("totalCount") or 0)}
    cont = {}
    for s in d.get("studies", []):
        for x in s["protocolSection"].get("conditionsModule", {}).get("conditions", []):
            cont[x] = cont.get(x, 0) + 1
    r["cond"] = [[k, v] for k, v in sorted(cont.items(), key=lambda kv: -kv[1])[:6]]
    for ph in ("PHASE3", "PHASE2", "PHASE1"):
        r[ph] = int(get(base + urllib.parse.quote(filtro + " AND AREA[Phase]" + ph) + "&pageSize=1").get("totalCount") or 0) if r["total"] else 0
    return r


def txt_cond(e):
    if not e.get("cond"):
        return ""
    return "Condições mais estudadas nos ensaios (termos do registro, em inglês): %s." % ", ".join("%s (%d)" % (k, v) for k, v in e["cond"])


def fase_de(cat, e):
    if cat in ("Vitamina", "Mineral"):
        return "Aprovado"
    for ph, f in (("PHASE3", "Fase 3"), ("PHASE2", "Fase 2"), ("PHASE1", "Fase 1")):
        if e[ph]:
            return f
    # estudos em humanos sem fase definida (comum em suplementos): a etapa mais inicial em humanos
    return "Fase 1" if e["total"] else "Pré-clínico (animais)"


def familia_de(cat, nome):
    if cat == "Vitamina":
        return "vitaminas-lipo" if re.search(r"vitamin (a|d|e|k)\b|retinol|tocopherol|calciferol|phylloquinone|menaquinone", nome, re.I) else "vitaminas-hidro"
    return {"Mineral": "minerais", "Hormônio": "hormonios-metabolicos"}.get(cat, "suplementos-metabolicos")


def ficha(c, w, e):
    cat = c["cat"]
    fase = fase_de(cat, e)
    tot = e["total"]
    ev = ("Ficha de dados automáticos, sem avaliação editorial da qualidade das evidências. O ClinicalTrials.gov registra %d estudo(s) de suplemento com este ativo"
          "%s. %s Quantidade de estudos não indica eficácia: leia as revisões nas fontes." % (
              tot, (" (fase 3: %d; fase 2: %d; fase 1: %d)" % (e["PHASE3"], e["PHASE2"], e["PHASE1"])) if tot else "", txt_cond(e)))
    ev = ev.replace("  ", " ")
    status = ("Presente em suplementos alimentares vendidos nos EUA (base DSLD/NIH). Suplementos não passam por aprovação prévia como medicamento; "
              "o status e os limites de dose variam por país, então confira o FDA, a EMA e a Anvisa.")
    if cat == "Hormônio":
        status = "Pode ser tratado como medicamento ou como suplemento conforme o país e a dose. " + status
    return {
        "nome": w["nome"], "termo_en": c["nome"].lower(), "categoria": cat, "fase": fase, "status": status,
        "mecanismo": "O mecanismo de ação não foi organizado automaticamente nesta ficha; veja o texto de apresentação e as fontes.",
        "evidencia": ev,
        "riscos": "Os riscos não foram organizados automaticamente. Suplementos podem interagir com medicamentos, e a dose e a pureza importam; converse com um profissional de saúde.",
        "fontes": ["DSLD — Dietary Supplement Label Database (NIH)", "Wikipédia, CC BY-SA 4.0: " + w["url"],
                   "ClinicalTrials.gov: https://clinicaltrials.gov/search?intr=" + urllib.parse.quote(c["nome"])],
        "oque": w["texto"],
        "beneficios": "Esta ficha é automática e não traz texto editorial sobre benefícios; consulte os estudos e as revisões nas fontes.",
        "det": {
            "oque": w["texto"],
            "age": ["O mecanismo ainda não foi organizado nesta ficha.", "Os detalhes de como age não foram revisados editorialmente.", "Consulte as fontes e as revisões científicas para o mecanismo completo."],
            "hist": "Sem histórico organizado nesta ficha automática.",
            "estudos": ("Estudos registrados no ClinicalTrials.gov: %d. %s Confira o registro para ensaios em andamento." % (tot, txt_cond(e))).replace("  ", " "),
            "evitar": "Gestantes, pessoas com doenças crônicas ou que usam medicamentos devem consultar um profissional antes de usar; esta ficha automática não lista contraindicações.",
        },
        "timeline": [], "familia": familia_de(cat, c["nome"]), "alvos": [], "auto": "dsld",
    }


def construir(cands):
    cat = catalogo()

    def um(c):
        w = wiki(c["nome"])
        if not w or chave(w["nome"]) in cat or chave(w["en"]) in cat:
            return c, None, None
        return c, w, ensaios(c["nome"])
    fichas, sem, vistos = [], [], set()
    with ThreadPoolExecutor(3) as ex:
        for c, w, e in ex.map(um, cands):
            if not w or w["nome"].lower() in vistos:
                sem.append(c["nome"]); continue
            vistos.add(w["nome"].lower())
            fichas.append(ficha(c, w, e))
    return fichas, sem


# ---------- mesclagem segura ----------
def importar(fichas, sem, simular):
    print("fichas prontas: %d | sem texto confiavel/ja no catalogo: %d" % (len(fichas), len(sem)))
    print("   ", [f["nome"] + " (" + f["fase"] + ")" for f in fichas][:25])
    if simular or not fichas:
        return 0
    antes = atualizar_chembl.contar()
    if antes is None:
        print("Sem navegador para validar o catalogo; abortando por seguranca."); return 1
    arq = NOVOS / ("novos_dsld_%s.py" % time.strftime("%Y%m%d"))
    txt = "# gerado por tools/atualizar_dsld.py (DSLD/NIH + Wikipedia)\nNOVOS = " + json.dumps(fichas, ensure_ascii=False, indent=1) + "\n"
    arq.write_text(txt.replace(": true", ": True").replace(": false", ": False").replace(": null", ": None"), "utf-8")
    bk = TOOLS / "_bk_dsld"
    bk.mkdir(exist_ok=True)
    for n in atualizar_chembl.ARQ:
        shutil.copy2(RAIZ / n, bk / n)
    marc = NOVOS / "_mesclados.json"
    marc_bk = marc.read_bytes() if marc.exists() else None
    r = subprocess.run([sys.executable, str(TOOLS / "mesclar_novos.py")], capture_output=True, text=True, encoding="utf-8", errors="replace")
    print(r.stdout[-800:])
    m = re.search(r"mesclados:\s*(\d+)", r.stdout)
    n = int(m.group(1)) if m else 0
    depois = atualizar_chembl.contar()
    if r.returncode != 0 or depois != antes + n:
        print("FALHA na validacao (%s -> %s, esperado +%d). Desfazendo." % (antes, depois, n))
        for f in atualizar_chembl.ARQ:
            shutil.copy2(bk / f, RAIZ / f)
        if marc_bk is not None:
            marc.write_bytes(marc_bk)
        elif marc.exists():
            marc.unlink()
        arq.unlink(missing_ok=True)
        shutil.rmtree(bk, ignore_errors=True)
        return 1
    shutil.rmtree(bk, ignore_errors=True)
    print("OK: %d fichas novas (catalogo %d -> %d)." % (n, antes, depois))
    return 0


def relatorio(cands, minimo):
    L = ["# Suplementos e ativos que faltam no catálogo (DSLD/NIH)", "",
         "Gerado em %s. Ativos de rótulos de suplementos no mercado dos EUA que ainda não têm ficha, com pelo menos %d rótulos. "
         "Sem marcas. Esta lista é só um aviso: as fichas só entram com `--importar`, e apenas quando há texto confiável em português." % (time.strftime("%Y-%m-%d"), minimo), "",
         "| Ativo | Tipo | Rótulos no mercado |", "|---|---|---|"]
    L += ["| %s | %s | %d |" % (x["nome"], x["cat"], x["n"]) for x in cands]
    RELATORIO.write_text("\n".join(L) + "\n", "utf-8")
    print("relatorio: %d ativos em %s" % (len(cands), RELATORIO.name))


def main():
    arg = lambda k, d: int(sys.argv[sys.argv.index(k) + 1]) if k in sys.argv else d
    minimo, limite = arg("--min", 300), arg("--limite", 20)
    cands = candidatos(minimo)
    relatorio(cands, minimo)
    rc = 0
    if "--importar" in sys.argv:
        # tenta mais candidatos que o limite, porque parte nao tera texto confiavel
        fichas, sem = construir(cands[:limite * 3])
        rc = importar(fichas[:limite], sem, "--simular" in sys.argv)
    return rc


if __name__ == "__main__":
    sys.exit(main())
