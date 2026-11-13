"""Extrai as strings PT dos novos itens escritos a mao (sem 'auto') para traduzir. Uso: python tools\\extrair_trad_novos.py [N]"""
import json, runpy, sys, glob
from pathlib import Path

NOVOS = Path(__file__).resolve().parent / "novos"
N = int(sys.argv[1]) if len(sys.argv) > 1 else 6
vistos, lista = set(), []


def add(s):
    s = (s or "").strip()
    if s and s not in vistos:
        vistos.add(s)
        lista.append(s)


for f in sorted(glob.glob(str(NOVOS / "novos_*.py"))):
    if "novos_auto" in f:
        continue
    for it in runpy.run_path(f)["NOVOS"]:
        for k in ("status", "mecanismo", "evidencia", "riscos", "oque", "beneficios"):
            add(it.get(k))
        d = it["det"]
        for k in ("oque", "hist", "estudos", "evitar"):
            add(d.get(k))
        for a in d.get("age", []):
            add(a)
        fa = it.get("farmaco") or {}
        add(fa.get("txt")); add(fa.get("arm"))
        for _, t in it.get("timeline", []):
            add(t)
for i in range(N):
    parte = lista[i::N]
    (NOVOS / ("_trad_%d.json" % (i + 1))).write_text(json.dumps(parte, ensure_ascii=False, indent=0), "utf-8")
print(len(lista), "strings em", N, "partes")
