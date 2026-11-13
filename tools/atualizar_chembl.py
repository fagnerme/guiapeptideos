"""Atualiza o catalogo com moleculas novas do ChEMBL (peptideos em fase clinica) sem mexer no que ja existe.
Fluxo: faltam_chembl -> filtra peptideos (sequencia de 2 a 60 aminoacidos) -> fichas automaticas (incrementais)
-> mesclar_novos -> valida que o catalogo carrega com o numero esperado de itens (senao, desfaz tudo).
Uso: python tools/atualizar_chembl.py [--fase-min 1] [--simular]
Depois rode: python tools/build.py <URL>  (paginas das fichas, comparacoes, sitemap, service worker)."""
import json, re, shutil, subprocess, sys, time
from pathlib import Path

TOOLS = Path(__file__).resolve().parent
RAIZ = TOOLS.parent
NOVOS = TOOLS / "novos"
sys.path.insert(0, str(TOOLS))
import faltam_chembl, auto_fichas, gerar_fichas  # noqa

ARQ = ["data.js", "data-extra.js", "data-detalhes.js", "data-vias.js", "data-farmaco.js", "data-timeline.js",
       "data-mecanismos.js", "data-alvos.js", "core.js"]
EXCL = re.compile(r"insulin|albumin|heparin|aprotinin|immunoglobulin|antithrombin|(cept|leukin|poetin|toxin|toxine|toxina|plasmin|plase|stim|mab|kinra|ase|cog)$|botulinum|interferon|feron", re.I)


def contar():
    d = gerar_fichas.despejar()
    return len(d["P"]) if d else None


def main():
    fmin = int(sys.argv[sys.argv.index("--fase-min") + 1]) if "--fase-min" in sys.argv else 1
    simular = "--simular" in sys.argv
    faltam_chembl.main()
    todos = json.loads((NOVOS / "_chembl_faltam.json").read_text("utf-8"))
    cand = [x for x in todos if 2 <= (x.get("tam") or 0) <= 60 and int(float(x["fase"])) >= fmin
            and not auto_fichas.EXC.search(x["nome"]) and not EXCL.search(x["nome"])]
    if "--limite" in sys.argv:
        cand = cand[:int(sys.argv[sys.argv.index("--limite") + 1])]
    print("candidatos novos:", len(cand), [x["nome"] for x in cand][:15])
    if not cand or simular:
        return 0
    antes = contar()
    if antes is None:
        print("Sem navegador para validar o catalogo; abortando por seguranca."); return 1
    from concurrent.futures import ThreadPoolExecutor
    with ThreadPoolExecutor(6) as ex:
        res = list(ex.map(auto_fichas.uma, cand))
    fichas = [auto_fichas.ficha(*r) for r in res]
    arq = NOVOS / ("novos_auto_inc_%s.py" % time.strftime("%Y%m%d"))
    txt = "# gerado por tools/atualizar_chembl.py (dados do ChEMBL)\nNOVOS = " + json.dumps(fichas, ensure_ascii=False, indent=1) + "\n"
    txt = txt.replace(": true", ": True").replace(": false", ": False").replace(": null", ": None")
    arq.write_text(txt, "utf-8")
    bk = TOOLS / "_bk_chembl"
    bk.mkdir(exist_ok=True)
    for n in ARQ:
        shutil.copy2(RAIZ / n, bk / n)
    marc = NOVOS / "_mesclados.json"
    marc_bk = marc.read_bytes() if marc.exists() else None
    r = subprocess.run([sys.executable, str(TOOLS / "mesclar_novos.py")], capture_output=True, text=True, encoding="utf-8", errors="replace")
    print(r.stdout[-1500:])
    m = re.search(r"mesclados:\s*(\d+)", r.stdout)
    n = int(m.group(1)) if m else 0
    depois = contar()
    if r.returncode != 0 or depois != antes + n:
        print("FALHA na validacao (%s -> %s, esperado +%d). Desfazendo." % (antes, depois, n))
        for f in ARQ:
            shutil.copy2(bk / f, RAIZ / f)
        if marc_bk is not None:
            marc.write_bytes(marc_bk)
        elif marc.exists():
            marc.unlink()
        arq.unlink(missing_ok=True)
        shutil.rmtree(bk, ignore_errors=True)
        return 1
    shutil.rmtree(bk, ignore_errors=True)
    print("OK: %d novos itens (catalogo %d -> %d). Rode tools/build.py para gerar as paginas." % (n, antes, depois))
    return 0


if __name__ == "__main__":
    sys.exit(main())
