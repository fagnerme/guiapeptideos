"""Coleta medicamentos aprovados (ChEMBL, fase 4) e liga o principio ativo aos nomes comerciais.
Fontes abertas: ChEMBL (nomes comerciais internacionais, ATC, vias, alertas) e dados abertos da Anvisa (marcas do Brasil).
Saidas:
  dados/medicamentos.js    indice leve (const MEDICAMENTOS), integrado ao catalogo em index, buscar e peptideo
  js/core.js               bloco MARCAS_AUTO (marcas das substancias que ja tem ficha no catalogo)
Uso: python tools/coletar_medicamentos.py [--sem-anvisa]"""
import csv, io, json, re, sys, time, unicodedata, urllib.request
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent
API = "https://www.ebi.ac.uk/chembl/api/data/"
ANVISA = "https://dados.anvisa.gov.br/dados/CONSULTAS/PRODUTOS/TA_CONSULTA_MEDICAMENTOS.CSV"
INI, FIM = "/*marcas-auto:inicio*/", "/*marcas-auto:fim*/"

ATC1 = {"A": "Aparelho digestivo e metabolismo", "B": "Sangue e órgãos hematopoéticos", "C": "Cardiovascular", "D": "Dermatológicos",
        "G": "Geniturinário e hormônios sexuais", "H": "Hormônios sistêmicos", "J": "Anti-infecciosos de uso sistêmico",
        "L": "Antineoplásicos e imunomoduladores", "M": "Musculoesquelético", "N": "Sistema nervoso", "P": "Antiparasitários",
        "R": "Aparelho respiratório", "S": "Órgãos dos sentidos", "V": "Diversos"}
ATC2 = {"A01": "Estomatológicos", "A02": "Acidez e úlcera (antiácidos, IBPs)", "A03": "Distúrbios funcionais gastrointestinais", "A04": "Antieméticos",
        "A05": "Terapia biliar e hepática", "A06": "Laxantes", "A07": "Antidiarreicos e anti-inflamatórios intestinais", "A08": "Antiobesidade",
        "A09": "Digestivos e enzimas", "A10": "Antidiabéticos", "A11": "Vitaminas", "A12": "Minerais", "A14": "Anabolizantes", "A16": "Outros do trato digestivo e metabolismo",
        "B01": "Antitrombóticos", "B02": "Antihemorrágicos", "B03": "Antianêmicos", "B05": "Substitutos do sangue e soluções", "B06": "Outros hematológicos",
        "C01": "Terapia cardíaca", "C02": "Anti-hipertensivos", "C03": "Diuréticos", "C04": "Vasodilatadores periféricos", "C05": "Vasoprotetores",
        "C07": "Betabloqueadores", "C08": "Bloqueadores de canais de cálcio", "C09": "Atuam no sistema renina-angiotensina", "C10": "Redutores de lipídios",
        "D01": "Antifúngicos dermatológicos", "D02": "Emolientes e protetores", "D03": "Cicatrizantes", "D04": "Antipruriginosos", "D05": "Antipsoriáticos",
        "D06": "Antibióticos e quimioterápicos dermatológicos", "D07": "Corticoides dermatológicos", "D08": "Antissépticos", "D10": "Antiacneicos", "D11": "Outros dermatológicos",
        "G01": "Antiinfecciosos ginecológicos", "G02": "Outros ginecológicos", "G03": "Hormônios sexuais e moduladores", "G04": "Urológicos",
        "H01": "Hormônios hipofisários e hipotalâmicos", "H02": "Corticoides sistêmicos", "H03": "Terapia da tireoide", "H04": "Hormônios pancreáticos", "H05": "Homeostase do cálcio",
        "J01": "Antibacterianos", "J02": "Antimicóticos", "J04": "Antimicobacterianos", "J05": "Antivirais", "J06": "Soros e imunoglobulinas", "J07": "Vacinas",
        "L01": "Antineoplásicos", "L02": "Terapia endócrina oncológica", "L03": "Imunoestimulantes", "L04": "Imunossupressores",
        "M01": "Anti-inflamatórios e antirreumáticos", "M02": "Tópicos para dor articular e muscular", "M03": "Relaxantes musculares", "M04": "Antigotosos",
        "M05": "Medicamentos para doenças ósseas", "M09": "Outros musculoesqueléticos",
        "N01": "Anestésicos", "N02": "Analgésicos", "N03": "Antiepilépticos", "N04": "Antiparkinsonianos", "N05": "Psicolépticos (antipsicóticos, ansiolíticos, hipnóticos)",
        "N06": "Psicoanalépticos (antidepressivos, estimulantes)", "N07": "Outros do sistema nervoso",
        "P01": "Antiprotozoários", "P02": "Anti-helmínticos", "P03": "Ectoparasiticidas",
        "R01": "Preparações nasais", "R02": "Preparações para a garganta", "R03": "Antiasmáticos e DPOC", "R05": "Tosse e resfriado", "R06": "Anti-histamínicos", "R07": "Outros respiratórios",
        "S01": "Oftalmológicos", "S02": "Otológicos", "S03": "Oftalmológicos e otológicos",
        "V03": "Outros terapêuticos", "V04": "Diagnósticos", "V06": "Nutrientes", "V08": "Meios de contraste", "V09": "Radiodiagnóstico", "V10": "Radioterápicos"}
SAIS = re.compile(r"\b(cloridrato|cloreto|sulfato|fosfato|acetato|maleato|besilato|mesilato|tartarato|succinato|citrato|bromidrato|brometo|nitrato|fumarato|"
                  r"valerato|propionato|dipropionato|decanoato|cipionato|enantato|sodico|sodica|potassico|calcico|magnesico|monoidratado|anidro|di-?hidratado|"
                  r"hydrochloride|sulfate|phosphate|acetate|maleate|besylate|mesylate|tartrate|succinate|citrate|hydrobromide|bromide|nitrate|fumarate|sodium|potassium|calcium|de)\b")


# nomes usados no Brasil que diferem do nome em inglês/espanhol do ChEMBL
PT_NOME = {"acetaminophen": "Paracetamol", "metamizole": "Dipirona", "dipyrone": "Dipirona", "aspirin": "Ácido acetilsalicílico",
           "epinephrine": "Adrenalina", "norepinephrine": "Noradrenalina", "albuterol": "Salbutamol", "ascorbicacid": "Ácido ascórbico",
           "tranexamicacid": "Ácido tranexâmico", "folicacid": "Ácido fólico", "valproicacid": "Ácido valproico", "zoledronicacid": "Ácido zoledrônico",
           "ursodeoxycholicacid": "Ácido ursodesoxicólico", "tretinoin": "Tretinoína", "levothyroxine": "Levotiroxina", "liothyronine": "Liotironina",
           "isotretinoin": "Isotretinoína", "hydrochlorothiazide": "Hidroclorotiazida", "glyburide": "Glibenclamida", "cyclosporine": "Ciclosporina"}


def sem_acento(s):
    return "".join(c for c in unicodedata.normalize("NFD", s) if unicodedata.category(c) != "Mn")


def slug(n):
    return re.sub(r"[^a-z0-9]+", "-", sem_acento(n.lower())).strip("-")


def chave(n):
    s = sem_acento(n.lower())
    s = re.sub(r"\(.*?\)", " ", s)
    s = SAIS.sub(" ", s)
    return re.sub(r"[^a-z0-9]+", "", s)


def get(u, tent=4):
    for i in range(tent):
        try:
            with urllib.request.urlopen(urllib.request.Request(u, headers={"Accept": "application/json", "User-Agent": "guia-peptideos"}), timeout=120) as r:
                return json.load(r)
        except Exception as e:
            print("  retry", i, e)
            time.sleep(4)
    return {}


def chembl():
    out, off = [], 0
    while True:
        d = get(API + "molecule.json?max_phase=4&limit=500&offset=%d" % off)
        mols = d.get("molecules") or []
        out += mols
        print("ChEMBL", len(out), "/", (d.get("page_meta") or {}).get("total_count"), flush=True)
        if not (d.get("page_meta") or {}).get("next"):
            break
        off += 500
    return out


def marcas_anvisa():
    """-> (chave da substancia unica -> marcas ativas no Brasil, referencia primeiro; lista de associacoes (marca, substancias))."""
    res, combos = {}, []
    req = urllib.request.Request(ANVISA, headers={"User-Agent": "guia-peptideos"})
    with urllib.request.urlopen(req, timeout=600) as r:
        for x in csv.DictReader(io.TextIOWrapper(r, encoding="cp1252", newline=""), delimiter=";"):
            sub = x["SUBSTANCIAS_MEDICAMENTOS"].strip()
            if x["VALIDADE_SITUACAO"] != "Ativo" or x["TIPO_AUTORIZACAO"] != "REGISTRADO" or not sub:
                continue
            cat = x["DS_TIPO_CATEGORIA_REGULATORIA"]
            if cat.startswith("Gen"):
                continue
            nome = re.sub(r"\s+", " ", x["NO_PRODUTO"]).strip()
            if re.search(r"[,+;]", sub):
                if "+" not in nome and "(" not in nome and len(nome) <= 30 and not cat.startswith(("Fito", "DINAM", "BAIXO")):
                    combos.append((nome.title(), [s.strip() for s in re.split(r"[,+;]", sub) if s.strip()]))
                continue
            k = chave(sub)
            if not k or chave(nome).startswith(k[:6]) or "(" in nome or len(nome) > 28:
                continue
            res.setdefault(k, {}).setdefault(nome.title(), 0 if cat == "Novo" else 1)
    return {k: [n for n, _ in sorted(v.items(), key=lambda kv: (kv[1], kv[0]))] for k, v in res.items()}, combos


def fda_combos():
    """Marcas dos EUA com 2 ou mais principios ativos (openFDA Drugs@FDA)."""
    out, skip = [], 0
    while skip <= 25000:
        d = get("https://api.fda.gov/drug/drugsfda.json?limit=1000&skip=%d" % skip, tent=3)
        res = d.get("results") or []
        if not res:
            break
        for a in res:
            for p in a.get("products") or []:
                ings = [i["name"] for i in p.get("active_ingredients") or [] if i.get("name")]
                if len(ings) >= 2 and p.get("brand_name") and p.get("marketing_status") != "Discontinued":
                    out.append((titulo(p["brand_name"]), ings))
        print("FDA", skip, len(out), flush=True)
        skip += 1000
    return out


def catalogo():
    d = json.loads((RAIZ / "api" / "v1" / "catalog.json").read_text("utf-8"))
    itens = next(v for v in d.values() if isinstance(v, list) and v and isinstance(v[0], dict) and "id" in v[0])
    return {chave(i["name"]): i["id"] for i in itens}


def titulo(n):
    return " ".join(p.capitalize() if p.isupper() else p for p in n.split())


def main():
    cat = catalogo()
    mols = chembl()
    anv, combos_br = ({}, []) if "--sem-anvisa" in sys.argv else marcas_anvisa()
    itens, vistos, marcas_cat = [], set(), {}
    for m in mols:
        en = m.get("pref_name")
        if not en:
            continue
        syn = m.get("molecule_synonyms") or []
        es = next((s["molecule_synonym"] for s in syn if s["syn_type"] == "INN_SPANISH"), None)
        comerciais = sorted({s["molecule_synonym"].strip().title() for s in syn if s["syn_type"] == "TRADE_NAME" and len(s["molecule_synonym"]) < 32})
        nome = PT_NOME.get(chave(en)) or titulo(es or en)
        chaves = {chave(en), chave(nome)} - {""}
        br = next((anv[k] for k in chaves if k in anv), [])
        s = slug(nome)
        if s in vistos or not s:
            continue
        vistos.add(s)
        todas = []
        for n in br[:10] + comerciais:
            if chave(n) not in chaves and not any(n.lower() == x.lower() or n.lower().startswith(x.lower() + " ") for x in todas):
                todas.append(n)
        atc = (m.get("atc_classifications") or [""])[0]
        vias = [v for v, c in (("oral", m.get("oral")), ("injetável", m.get("parenteral")), ("tópico", m.get("topical"))) if c]
        slug_cat = next((cat[k] for k in chaves if k in cat), None)
        it = {"n": nome, "e": en.title(), "m": todas[:30], "a": atc, "y": m.get("first_approval"), "v": vias, "c": m["molecule_chembl_id"]}
        if m.get("molecule_type") != "Small molecule":
            it["b"] = 1
        if str(m.get("black_box_warning")) in ("1", "True"):
            it["cx"] = 1
        if m.get("withdrawn_flag"):
            it["r"] = 1
        if slug_cat:
            it["f"] = slug_cat
            marcas_cat[slug_cat] = todas[:30]
        itens.append(it)
    itens.sort(key=lambda i: slug(i["n"]))
    # associacoes: marca com 2+ principios ativos, ligada as fichas de cada ativo
    alvo_de = {}
    for i in itens:
        for k in {chave(i["e"]), chave(i["n"])} - {""}:
            alvo_de.setdefault(k, i.get("f") or slug(i["n"]))
    existentes = {slug(i["n"]) for i in itens}
    combos, vistos_c = [], set()
    for marca, ings in combos_br + ([] if "--sem-fda" in sys.argv else fda_combos()):
        ids = list(dict.fromkeys(alvo_de[chave(x)] for x in ings if chave(x) in alvo_de))
        faltam = [titulo(x.lower()) for x in ings if chave(x) not in alvo_de]
        s = slug(marca)
        if len(ids) < 2 or not s or s in existentes or (s, tuple(sorted(ids))) in vistos_c or chave(marca).startswith(chave(ings[0])[:6]):
            continue
        vistos_c.add((s, tuple(sorted(ids))))
        existentes.add(s)
        combos.append([marca, ids, faltam] if faltam else [marca, ids])
    combos.sort(key=lambda c: slug(c[0]))
    print("associacoes:", len(combos))
    saida = {"geradoEm": time.strftime("%Y-%m-%d"), "fontes": ["ChEMBL", "Anvisa (dados abertos)", "openFDA"], "combos": combos,
             "atc1": ATC1, "atc2": {k: v for k, v in ATC2.items() if any(i["a"].startswith(k) for i in itens)}, "itens": itens}
    (RAIZ / "dados" / "medicamentos.js").write_text("const MEDICAMENTOS = " + json.dumps(saida, ensure_ascii=False, separators=(",", ":")) + ";\n", "utf-8")
    print("medicamentos:", len(itens), "| ligados a fichas:", len(marcas_cat), "| com marcas:", sum(1 for i in itens if i["m"]))

    core = RAIZ / "js" / "core.js"
    t = core.read_bytes().decode("utf-8")
    bloco = INI + "\nconst MARCAS_AUTO = " + json.dumps({k: v for k, v in sorted(marcas_cat.items()) if v}, ensure_ascii=False, separators=(",", ":")) + ";\n" + FIM
    if INI in t:
        t = re.sub(re.escape(INI) + r".*?" + re.escape(FIM), lambda _: bloco, t, flags=re.S)
    else:
        t = t.replace("const SINONIMOS = {", bloco + "\nconst SINONIMOS = {", 1)
    core.write_bytes(t.encode("utf-8"))


if __name__ == "__main__":
    main()
