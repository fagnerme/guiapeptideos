"""Procura peptideos de moleculas 'pequenas' do ChEMBL (sufixos de nome de peptideo) que faltam no catalogo.
Uso: python tools\\faltam_peptideos.py  -> grava tools\\novos\\_chembl_pep_faltam.json (mesmo formato de _chembl_faltam.json)"""
import json, re, sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from faltam_chembl import API, base, chaves_catalogo, get, stem  # noqa

OUT = Path(__file__).resolve().parent / "novos" / "_chembl_pep_faltam.json"
SUFIXOS = ["relin", "relix", "tide", "glutide", "pressin", "tocin", "morelin", "tropin", "ermin", "tide acetate",
           "reotide", "lutide", "cept", "fatide", "sermin", "calcitonin", "tin", "mide", "ptin", "pitant", "parin",
           "relef", "gastrin", "kinin", "crinin", "morphin", "enkephalin", "tapide", "depsin", "mycin"]
RADIO = re.compile(r"(technetium|indium|gallium|lutetium|copper|yttrium|iodine|\bI ?1[23]\d|oxodotreotide|pentetreotide|vipivotide|mertiatide|apcitide|depreotide)", re.I)
# aceita so o que parece peptideo (nome com sufixo tipico) e descarta antibioticos e moleculas pequenas conhecidas
PEPTIDEO = re.compile(r"(relin|relix|glutide|pressin|tocin|morelin|tropin|reotide|lutide|fatide|sermin|calcitonin|tide|enkephalin|kinin|crinin)$", re.I)


def main():
    cat = chaves_catalogo()
    achados, vistos = [], set()
    for suf in dict.fromkeys(SUFIXOS):
        off = 0
        while True:
            d = get(API + "molecule.json?max_phase__gte=1&pref_name__iendswith=%s&limit=200&offset=%d" % (suf, off))
            for m in d.get("molecules", []):
                nome = base((m.get("pref_name") or "").strip())
                if not nome or RADIO.search(nome) or not PEPTIDEO.search(nome) or nome.upper() in vistos:
                    continue
                vistos.add(nome.upper())
                sins = [s["molecule_synonym"] for s in (m.get("molecule_synonyms") or [])]
                if any(stem(base(x)) in cat for x in [nome] + sins if x):
                    continue
                achados.append({"nome": nome, "chembl": m["molecule_chembl_id"], "fase": m.get("max_phase"),
                                "aprov": m.get("first_approval"), "seq": "", "tam": 0, "sinonimos": sins[:6]})
            if not d.get("page_meta", {}).get("next"):
                break
            off += 200
    OUT.write_text(json.dumps(achados, ensure_ascii=False, indent=1), "utf-8")
    print("faltam:", len(achados))
    for a in achados:
        print(" ", a["nome"], a["fase"])


if __name__ == "__main__":
    main()
