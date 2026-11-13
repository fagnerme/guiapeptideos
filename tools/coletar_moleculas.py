"""Coleta estrutura molecular (formula, massa, sequencia) no PubChem para cada peptideo e grava moleculas.js.
Uso: python tools/coletar_moleculas.py [--so SLUG...]   (nao inventa nada: sem dado na base, o campo fica vazio)"""
import json, re, sys, time, unicodedata, pathlib, urllib.request, urllib.parse

raiz = pathlib.Path(__file__).resolve().parent.parent
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
import atualizar as A

PUG = "https://pubchem.ncbi.nlm.nih.gov/rest/pug"
VIEW = "https://pubchem.ncbi.nlm.nih.gov/rest/pug_view/data/compound"
# nomes alternativos no PubChem (tentados em ordem) quando o nome do catalogo nao acha
ALT = {
    "bpc-157": ["BPC 157", "Bepecin", "pentadecapeptide BPC 157"],
    "tb-500-timosina-beta-4": ["thymosin beta-4", "TB-500", "Ac-SDKP"],
    "ipamorelina-cjc-1295": ["ipamorelin"],
    "melanotan-ii": ["melanotan II", "Melanotan-2"],
    "ghrp-2-pralmorelina": ["pralmorelin", "GHRP-2"],
    "ghrp-6": ["GHRP-6", "growth hormone releasing peptide-6"],
    "epitalon-epithalon": ["epitalon", "epithalon"],
    "mgf-peg-mgf": ["mechano growth factor"],
    "argireline-acetil-hexapeptideo-8": ["acetyl hexapeptide-8", "argireline"],
    "matrixyl-palmitoil-pentapeptideo-4": ["palmitoyl pentapeptide-4", "matrixyl"],
    "hormonio-do-crescimento-somatropina": ["somatropin"],
    "kisspeptina-10": ["kisspeptin-10", "metastin 45-54"],
    "gonadorelina-gnrh": ["gonadorelin"],
    "angiotensina-1-7": ["angiotensin (1-7)", "angiotensin 1-7"],
    "defensinas-humanas": ["human beta-defensin 2"],
    "timosina-alfa-1": ["thymalfasin", "thymosin alpha 1"],
    "bremelanotida-pt-141": ["bremelanotide"],
    "elamipretida-ss-31": ["elamipretide"],
    "cibinetida-ara-290": ["cibinetide"],
    "leuprorrelina": ["leuprolide", "leuprorelin"],
    "folistatina-344": ["follistatin"],
}

def get(url, tentativas=2):
    for i in range(tentativas):
        try:
            with urllib.request.urlopen(urllib.request.Request(url, headers={"User-Agent": "guia-peptideos/1.0"}), timeout=30) as r:
                return json.load(r)
        except urllib.error.HTTPError as e:
            if e.code == 404:
                return None
            time.sleep(2)
        except Exception:
            time.sleep(2)
    return None

def cid_de(nome):
    d = get(f"{PUG}/compound/name/{urllib.parse.quote(nome)}/cids/JSON")
    c = (d or {}).get("IdentifierList", {}).get("CID")
    return c[0] if c else None

def achar(sec, rot):
    """Procura em toda a arvore uma Information cujo Name seja `rot`."""
    if isinstance(sec, dict):
        for inf in sec.get("Information", []):
            if inf.get("Name") == rot:
                v = inf.get("Value", {}).get("StringWithMarkup")
                if v:
                    return v[0]["String"]
        for s in sec.get("Section", []):
            r = achar(s, rot)
            if r:
                return r
    return None

def coletar(slug, nome_en):
    nomes = ALT.get(slug, []) + [nome_en]
    for n in nomes:
        cid = cid_de(n)
        time.sleep(0.25)
        if cid:
            break
    else:
        return None
    p = get(f"{PUG}/compound/cid/{cid}/property/MolecularFormula,MolecularWeight,IsomericSMILES,Title/JSON")
    time.sleep(0.25)
    props = ((p or {}).get("PropertyTable", {}).get("Properties") or [{}])[0]
    r = {"cid": cid, "titulo": props.get("Title", ""), "formula": props.get("MolecularFormula", ""),
         "massa": props.get("MolecularWeight", ""), "buscadoComo": n}
    b = get(f"{VIEW}/{cid}/JSON?heading=Biologic+Description")
    time.sleep(0.25)
    if b:
        rec = b.get("Record", {})
        for k, rot in (("seq", "Sequence"), ("condensada", "IUPAC Condensed")):
            v = achar({"Section": rec.get("Section", [])}, rot)
            if v:
                r[k] = v
    return r

# Correcoes quando o PubChem devolve outra substancia ou registro incompleto. Marcadas com "manual": true.
MANUAL = {
    "kpv": {"titulo": "KPV (alfa-MSH 11-13)", "seq": "KPV", "condensada": "H-Lys-Pro-Val-OH", "nota": "Tripeptideo C-terminal do alfa-MSH.", "remover": ["cid", "formula", "massa"]},
    "ghk-cu": {"seq": "GHK", "condensada": "H-Gly-His-Lys-OH", "nota": "Tripeptideo GHK ligado a um ion de cobre (Cu2+). Formula e massa referem-se ao complexo."},
    "argireline-acetil-hexapeptideo-8": {"seq": "EEMQRR", "condensada": "Ac-Glu-Glu-Met-Gln-Arg-Arg-NH2", "nota": "Acetil hexapeptideo-8, fragmento N-terminal da SNAP-25.", "remover": ["formula", "massa"]},
    "dihexa": {"seq": "", "condensada": "Hexanoil-Tyr-Ile-(6-aminohexanamida)", "nota": "Derivado sintetico da angiotensina IV; nao e uma cadeia de aminoacidos comum."},
    "insulina": {"seq": "", "condensada": "", "cadeias": {"A (21 aa)": "GIVEQCCTSICSLYQLENYCN", "B (30 aa)": "FVNQHLCGSHLVEALYLVCGERGFFYTPKT"},
                 "nota": "Insulina humana: duas cadeias ligadas por duas pontes dissulfeto entre A e B, mais uma ponte dentro da cadeia A.", "remover": ["formula", "massa"]},
}

def aplicar_manuais(d):
    for s, m in MANUAL.items():
        if s in d or s:
            r = d.setdefault(s, {})
            for k in m.get("remover", []):
                r.pop(k, None)
            r.update({k: v for k, v in m.items() if k != "remover"})
            r["manual"] = True

def main():
    so = sys.argv[sys.argv.index("--so") + 1:] if "--so" in sys.argv else None
    arq = raiz / "moleculas.js"
    atual = {}
    if arq.exists():
        t = arq.read_text(encoding="utf-8-sig")
        m = re.search(r"=\s*(\{.*\});", t, re.S)
        if m:
            atual = json.loads(m.group(1))
    for nome, fase, termo in A.catalogo():
        s = A.slug(nome)
        if so and s not in so:
            continue
        r = coletar(s, termo)
        print(f"{s}: {'-' if not r else (r['titulo'] + ' | ' + r.get('seq', 'sem sequencia')[:40])}", flush=True)
        if r:
            atual[s] = r
    aplicar_manuais(atual)
    for r in atual.values():
        r.pop("helm", None)
    arq.write_text("/* Gerado por tools/coletar_moleculas.py a partir do PubChem (dominio publico, NCBI). */\nconst MOLECULAS = "
                   + json.dumps(atual, ensure_ascii=False, indent=1) + ";\n", encoding="utf-8")
    print(len(atual), "com dados")

if __name__ == "__main__":
    main()