"""Cruza o ChEMBL (peptideos/proteinas em fase clinica) com o catalogo e lista o que falta.
Uso: python tools\\faltam_chembl.py   -> grava tools\\novos\\_chembl_faltam.json"""
import json, re, time, unicodedata, urllib.request
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent
OUT = Path(__file__).resolve().parent / "novos" / "_chembl_faltam.json"
API = "https://www.ebi.ac.uk/chembl/api/data/"


def get(u):
    for _ in range(4):
        try:
            with urllib.request.urlopen(urllib.request.Request(u, headers={"Accept": "application/json"}), timeout=60) as r:
                return json.load(r)
        except Exception:
            time.sleep(3)
    return {}


def norm(s):
    s = unicodedata.normalize("NFD", s)
    s = "".join(c for c in s if unicodedata.category(c) != "Mn").lower()
    s = re.sub(r"\(.*?\)", " ", s)
    return re.sub(r"[^a-z0-9]+", "", s)


def stem(s):
    s = norm(s)
    return re.sub(r"(ide|ida|ina|ine|in|e|a|o)$", "", s)


SAIS = re.compile(r"\b(acetate|hydrochloride|sulfate|sulphate|mesylate|pamoate|trifluoroacetate|sodium|diethylamine|zinc|tannate|trifutate|trifluate|anhydrous|hcl|human|synthetic|porcine|ovine|alfa|alpha|beta)\b", re.I)


def base(nome):
    return re.sub(r"\s+", " ", SAIS.sub(" ", nome)).strip()


def chaves_catalogo():
    ch = set()
    txt = ""
    for f in RAIZ.glob("*.js"):
        if f.name.startswith(("data", "core")):
            txt += f.read_bytes().decode("utf-8", "ignore")
    for f in (Path(__file__).resolve().parent / "novos").glob("novos_*.py"):
        txt += f.read_bytes().decode("utf-8", "ignore")
    for m in re.findall(r'P\("([^"]+)"', txt):
        for parte in re.split(r"\s*/\s*", m):
            ch.add(stem(parte))
    for m in re.findall(r'"([^"]+)":\s*"([^"]+)"', txt):
        for parte in re.split(r"\s*/\s*", m[0]) + re.split(r"\s*/\s*", m[1]):
            if len(parte) < 60:
                ch.add(stem(parte))
    for m in re.findall(r'"(?:nome|termo_en)":\s*"([^"]+)"', txt):
        for parte in re.split(r"\s*/\s*", m):
            ch.add(stem(parte))
    return ch


def main():
    cat = chaves_catalogo()
    faltam, total, vistos = [], 0, set()
    for tipo in ("Protein",):  # moleculas pequenas (hormonios/suplementos) ficam com a lista curada
        off = 0
        while True:
            d = get(API + "molecule.json?max_phase__gte=1&molecule_type=%s&limit=200&offset=%d" % (tipo, off))
            for m in d.get("molecules", []):
                total += 1
                nome = base((m.get("pref_name") or "").strip())
                if not nome or re.search(r"(technetium|indium|gallium|lutetium|copper|yttrium|iodine|\bI ?1[23]\d|oxodotreotide|pentetreotide|vipivotide|mertiatide|apcitide|depreotide)", nome, re.I):
                    continue
                if nome.upper() in vistos:
                    continue
                vistos.add(nome.upper())
                sins = [s["molecule_synonym"] for s in (m.get("molecule_synonyms") or [])]
                if any(stem(base(x)) in cat for x in [nome] + sins if x):
                    continue
                seq = ""
                for bc in (m.get("biotherapeutic") or {}).get("biocomponents") or []:
                    seq = bc.get("sequence") or seq
                faltam.append({"nome": nome, "chembl": m["molecule_chembl_id"], "fase": m.get("max_phase"),
                               "aprov": m.get("first_approval"), "seq": seq, "tam": len(seq),
                               "sinonimos": sins[:6]})
            if not d.get("page_meta", {}).get("next"):
                break
            off += 200
    OUT.write_text(json.dumps(faltam, ensure_ascii=False, indent=1), "utf-8")
    print("analisados:", total, "faltam:", len(faltam))


if __name__ == "__main__":
    main()
