"""Coleta, na bula oficial do DailyMed (NIH, dominio publico), os trechos de contraindicacoes, interacoes
medicamentosas e alerta de caixa preta, traduz para portugues e grava em dados/bulas/<slug>.json.
Uso: python tools\\coletar_bulas.py [--so SLUG ...] [--limite N]"""
import json, pathlib, re, sys, time
import urllib.parse, urllib.request
import xml.etree.ElementTree as ET
from concurrent.futures import ThreadPoolExecutor

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
import atualizar as A
import coletar_estudos as E

raiz = pathlib.Path(__file__).resolve().parent.parent
PASTA = raiz / "dados" / "bulas"
API = "https://dailymed.nlm.nih.gov/dailymed/services/v2/"
NS = {"h": "urn:hl7-org:v3"}
SECOES = {"interacoes": "34073-7", "contraindicacoes": "34070-3", "caixa": "34066-1"}
LIMITE = 1400
REEMB = re.compile(r"\b(repackag|a-s medication|bryant ranch|proficient rx|direct[_ ]rx|nucare|quality care|preferred pharm|henry schein|medsource|rebel distributors|physicians total|remedyrepack|asclemed|enovachem)", re.I)


def baixar(url):
    for tent in range(3):
        try:
            req = urllib.request.Request(url, headers={"User-Agent": "guia-peptideos (educativo)"})
            with urllib.request.urlopen(req, timeout=45) as r:
                return r.read()
        except Exception:
            time.sleep(1 + tent)
    return None


def limpar(txt):
    txt = re.sub(r"\s+", " ", txt).strip()
    txt = re.sub(r"(\s\d+(\.\d+)+)+\s*$", "", txt)
    return re.sub(r"^\d+(\.\d+)*\s+", "", txt)


def cortar(txt, limite=LIMITE):
    """Corta em fim de frase para nao passar do limite; devolve (texto, foi_cortado)."""
    if len(txt) <= limite:
        return txt, False
    corte = txt[:limite]
    i = max(corte.rfind(". "), corte.rfind("; "))
    return (corte[:i + 1] if i > limite * 0.5 else corte.rstrip() + "…"), True


def secoes_do_xml(xml):
    raiz_xml = ET.fromstring(xml)
    achadas = {}
    for sec in raiz_xml.iter("{urn:hl7-org:v3}section"):
        c = sec.find("h:code", NS)
        if c is None:
            continue
        for chave, cod in SECOES.items():
            if c.get("code") == cod and chave not in achadas:
                txt = limpar(" ".join(sec.itertext()))
                titulo = sec.find("h:title", NS)
                if titulo is not None:
                    t = limpar("".join(titulo.itertext()))
                    if txt.lower().startswith(t.lower()):
                        txt = limpar(txt[len(t):])
                if len(txt) > 30:
                    achadas[chave] = txt
    return raiz_xml, achadas


def candidatos(termo):
    d = baixar(API + "spls.json?pagesize=8&drug_name=" + urllib.parse.quote(termo))
    if not d:
        return []
    lista = json.loads(d).get("data", [])
    return sorted(lista, key=lambda x: bool(REEMB.search(x.get("title", ""))))


def para_pt_longo(txt):
    partes, atual = [], ""
    for frase in re.split(r"(?<=[.;:])\s+", txt):
        if len(atual) + len(frase) > 700 and atual:
            partes.append(atual)
            atual = ""
        atual += (" " if atual else "") + frase
    if atual:
        partes.append(atual)
    out = [E.para_pt(p) for p in partes]
    return " ".join(out) if all(out) else ""


VIAS_PT = {"ORAL": "Oral", "SUBCUTANEOUS": "Subcutânea", "INTRAVENOUS": "Intravenosa", "INTRAMUSCULAR": "Intramuscular",
           "TOPICAL": "Tópica", "NASAL": "Nasal", "TRANSDERMAL": "Transdérmica", "SUBLINGUAL": "Sublingual", "INTRADERMAL": "Intradérmica",
           "OPHTHALMIC": "Oftálmica", "INTRATHECAL": "Intratecal", "RECTAL": "Retal", "VAGINAL": "Vaginal", "INHALATION": "Inalatória",
           "RESPIRATORY (INHALATION)": "Inalatória", "INTRAVITREAL": "Intravítrea", "BUCCAL": "Bucal", "INTRA-ARTICULAR": "Intra-articular"}


def vias_do_xml(xml):
    return sorted({VIAS_PT.get((e.get("displayName") or "").upper(), (e.get("displayName") or "").capitalize())
                   for e in ET.fromstring(xml).iter("{urn:hl7-org:v3}routeCode") if e.get("displayName")})


def coletar_item(nome, termo):
    achados = []
    for c in candidatos(termo)[:8]:
        xml = baixar(API + "spls/%s.xml" % c["setid"])
        if not xml:
            continue
        try:
            _, sec = secoes_do_xml(xml)
            vias = vias_do_xml(xml)
        except ET.ParseError:
            continue
        if sec and vias:
            achados.append((bool(REEMB.search(c.get("title", ""))), len(vias), c, sec, vias))
    achados.sort(key=lambda a: (a[0], a[1]))
    cobertas, bulas = set(), []
    for _, _, c, sec, vias in achados:
        if set(vias) <= cobertas or len(bulas) >= 4:
            continue
        cobertas |= set(vias)
        b = {"via": " + ".join(vias), "setid": c["setid"], "titulo": c["title"], "publicado": c.get("published_date"), "secoes": {}}
        for chave, txt in sec.items():
            en, cortado = cortar(txt)
            b["secoes"][chave] = {"en": en, "pt": para_pt_longo(en), "cortado": cortado}
        bulas.append(b)
    if not bulas:
        return None
    return {"fonte": "DailyMed (NIH/NLM)", "bulas": bulas}


def main():
    args = sys.argv[1:]
    so = set(args[args.index("--so") + 1:]) if "--so" in args else set()
    limite = int(args[args.index("--limite") + 1]) if "--limite" in args else 0
    cat = [c for c in A.catalogo() if c[1] == "Aprovado" or so]
    if so:
        cat = [c for c in cat if A.slug(c[0]) in so]
    if limite:
        cat = cat[:limite]
    PASTA.mkdir(exist_ok=True)
    idx_path = PASTA / "index.json"
    idx = set(json.loads(idx_path.read_text(encoding="utf-8"))) if idx_path.exists() else set()

    def trabalho(c):
        try:
            return A.slug(c[0]), coletar_item(c[0], c[2])
        except Exception as ex:
            return A.slug(c[0]), ex

    feitos = 0
    with ThreadPoolExecutor(max_workers=4) as ex:
        for s, r in ex.map(trabalho, cat):
            feitos += 1
            f = PASTA / (s + ".json")
            if isinstance(r, Exception):
                print("erro", s, r)
            elif r:
                f.write_text(json.dumps(r, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
                idx.add(s)
            if feitos % 25 == 0:
                print(feitos, "/", len(cat), flush=True)
    idx_path.write_text(json.dumps(sorted(idx), separators=(",", ":")), encoding="utf-8")
    E.salvar_cache()
    print("itens com bula:", len(idx))


if __name__ == "__main__":
    main()
