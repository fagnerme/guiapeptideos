"""Coleta os alvos biologicos de cada item: ChEMBL (mecanismo e alvo) + UniProt (funcao da proteina, CC BY 4.0),
traduz a funcao para portugues e grava em dados/alvos-bio/<slug>.json.
Uso: python tools\\coletar_alvos.py [--so SLUG ...] [--limite N]"""
import json, pathlib, re, sys, threading, time
import urllib.parse, urllib.request
from concurrent.futures import ThreadPoolExecutor

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
import atualizar as A
import coletar_estudos as E

raiz = pathlib.Path(__file__).resolve().parent.parent
PASTA = raiz / "dados" / "alvos-bio"
CH = "https://www.ebi.ac.uk/chembl/api/data/"
UP = "https://rest.uniprot.org/uniprotkb/"
ACAO = {"AGONIST": "Ativa", "PARTIAL AGONIST": "Ativa parcialmente", "ANTAGONIST": "Bloqueia", "INHIBITOR": "Inibe",
        "MODULATOR": "Modula", "POSITIVE ALLOSTERIC MODULATOR": "Reforça", "BINDING AGENT": "Liga-se a", "SUBSTRATE": "Substrato de",
        "RELEASING AGENT": "Libera", "ACTIVATOR": "Ativa", "STIMULATOR": "Estimula", "OPENER": "Abre", "BLOCKER": "Bloqueia",
        "INVERSE AGONIST": "Agonista inverso de", "NEGATIVE ALLOSTERIC MODULATOR": "Reduz a ação de", "CROSS-LINKING AGENT": "Une"}
_trava = threading.Lock()
_uniprot = {}


def pedir(url):
    for tent in range(3):
        try:
            req = urllib.request.Request(url, headers={"Accept": "application/json", "User-Agent": "guia-peptideos (educativo)"})
            with urllib.request.urlopen(req, timeout=45) as r:
                return json.load(r)
        except Exception:
            time.sleep(1 + tent)
    return {}


def molecula(nome, termo):
    """Procura a molecula no ChEMBL pelos nomes do item (sinonimo exato)."""
    cand = []
    for n in (termo, re.sub(r"\s*\(.*?\)", "", nome), *re.findall(r"\(([^)]+)\)", nome)):
        for parte in re.split(r"\s*/\s*", n or ""):
            parte = parte.strip()
            if len(parte) > 3 and parte.lower() not in cand:
                cand.append(parte.lower())
    for c in cand[:4]:
        d = pedir(CH + "molecule.json?limit=2&molecule_synonyms__molecule_synonym__iexact=" + urllib.parse.quote(c))
        mols = d.get("molecules", [])
        if len(mols) == 1:
            return mols[0]["molecule_chembl_id"]
    return None


def limpar_funcao(t):
    t = re.sub(r"\s*\((?:PubMed|By similarity|Probable|Potential)[^)]*\)", "", t)
    t = re.sub(r"\s+", " ", t).strip()
    if len(t) > 700:
        corte = t[:700]
        i = corte.rfind(". ")
        t = corte[:i + 1] if i > 300 else corte.rstrip() + "…"
    return t


def proteina(acc):
    with _trava:
        if acc in _uniprot:
            return _uniprot[acc]
    d = pedir(UP + acc + ".json?fields=gene_names,cc_function,protein_name")
    func = ""
    for c in d.get("comments", []):
        if c.get("commentType") == "FUNCTION" and c.get("texts"):
            func = limpar_funcao(c["texts"][0]["value"])
            break
    genes = d.get("genes") or []
    r = {"gene": (genes[0].get("geneName") or {}).get("value", "") if genes else "", "funcaoEn": func}
    with _trava:
        _uniprot[acc] = r
    return r


def coletar_item(nome, termo):
    mid = molecula(nome, termo)
    if not mid:
        return None
    mecs = pedir(CH + "mechanism.json?limit=10&molecule_chembl_id=" + mid).get("mechanisms", [])
    alvos, vistos = [], set()
    for m in mecs:
        tid = m.get("target_chembl_id")
        if not tid or tid in vistos:
            continue
        vistos.add(tid)
        t = pedir(CH + "target/%s.json" % tid)
        if not t:
            continue
        comps = t.get("target_components") or []
        acc = comps[0].get("accession") if comps else None
        info = proteina(acc) if acc and t.get("organism") == "Homo sapiens" else {"gene": "", "funcaoEn": ""}
        acao = (m.get("action_type") or "").upper()
        alvos.append({"nome": t.get("pref_name"), "organismo": t.get("organism"), "uniprot": acc if t.get("organism") == "Homo sapiens" else None,
                      "gene": info["gene"], "acao": ACAO.get(acao, ""), "mecanismoEn": m.get("mechanism_of_action") or "",
                      "funcaoEn": info["funcaoEn"]})
        if len(alvos) >= 3:
            break
    if not alvos:
        return None
    for a in alvos:
        a["nomePt"] = E.para_pt(a["nome"]) if a["nome"] else ""
        a["mecanismoPt"] = E.para_pt(a["mecanismoEn"])
        a["funcaoPt"] = " ".join(E.para_pt(p) for p in re.split(r"(?<=\.)\s+", a["funcaoEn"]) if p) if a["funcaoEn"] else ""
    return {"fontes": "ChEMBL (CC BY-SA 3.0) e UniProt (CC BY 4.0)", "chembl": mid, "alvos": alvos}


def main():
    args = sys.argv[1:]
    so = set(args[args.index("--so") + 1:]) if "--so" in args else set()
    limite = int(args[args.index("--limite") + 1]) if "--limite" in args else 0
    cat = A.catalogo()
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
            if isinstance(r, Exception):
                print("erro", s, r)
            elif r:
                (PASTA / (s + ".json")).write_text(json.dumps(r, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
                idx.add(s)
            if feitos % 50 == 0:
                print(feitos, "/", len(cat), flush=True)
    idx_path.write_text(json.dumps(sorted(idx), separators=(",", ":")), encoding="utf-8")
    E.salvar_cache()
    print("itens com alvos:", len(idx))


if __name__ == "__main__":
    main()
