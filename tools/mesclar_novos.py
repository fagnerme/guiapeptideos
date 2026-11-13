"""Mescla tools/novos/novos_*.py no catalogo (idempotente). Uso: python tools\\mesclar_novos.py"""
import json, re, runpy, sys, unicodedata
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent
NOVOS = Path(__file__).resolve().parent / "novos"
MARC = NOVOS / "_mesclados.json"
CATS = {"Hormônio", "Metabolismo", "Vitamina", "Suplemento e metabólito", "Longevidade", "Secretagogos de GH",
        "Imunomodulador", "Antimicrobiano", "Neuroproteção", "Gastrointestinal", "Mineral", "Cardiovascular",
        "Mitocondrial", "Nootrópico", "NAD e precursores", "Experimental", "Opioide", "Cosmético", "Antioxidante",
        "Mimético de exercício", "Muscular", "Sexual", "Antitumoral"}
FASES = {"Aprovado", "Fase 1", "Fase 2", "Fase 3", "Pré-clínico (animais)", "In vitro", "Descontinuado"}


def slug(n):
    s = unicodedata.normalize("NFD", n)
    s = "".join(c for c in s if unicodedata.category(c) != "Mn").lower()
    return re.sub(r"[^a-z0-9]+", "-", s).strip("-")


def js(x):
    return json.dumps(x, ensure_ascii=False)


def ler(nome):
    return (RAIZ / nome).read_bytes().decode("utf-8").replace("\r\n", "\n")


def gravar(nome, txt):
    (RAIZ / nome).write_bytes(txt.encode("utf-8"))


def main():
    feitos = set(json.loads(MARC.read_text("utf-8"))) if MARC.exists() else set()
    itens, vistos = [], set()
    for f in sorted(NOVOS.glob("novos_*.py")):
        try:
            lista = runpy.run_path(str(f))["NOVOS"]
        except Exception as e:
            print("ERRO ao importar", f.name, e)
            continue
        for it in lista:
            s = slug(it["nome"])
            if s in feitos or s in vistos:
                continue
            vistos.add(s)
            itens.append((s, it))
    data = ler("data.js")
    existentes = {slug(m) for m in re.findall(r'P\("([^"]+)"', data)}
    existentes |= {slug(m) for m in re.findall(r'nome:\s*"([^"]+)"', data)}
    mecs = ler("data-mecanismos.js")
    alvos = ler("data-alvos.js")
    ids_fam = set(re.findall(r'id:\s*"([^"]+)"', mecs))
    chaves_alvo = set(re.findall(r'^\s*([a-z0-9_]+):\s*\{\s*nome', alvos, re.M))
    novos = []
    for s, it in itens:
        if s in existentes:
            print("pulado (ja existe):", it["nome"])
            continue
        if it.get("categoria") not in CATS:
            print("categoria invalida", it["nome"], it.get("categoria")); continue
        if it.get("fase") not in FASES:
            print("fase invalida", it["nome"], it.get("fase")); continue
        if it.get("familia") not in ids_fam:
            print("familia invalida", it["nome"], it.get("familia")); continue
        novos.append((s, it))
    if not novos:
        print("nada a mesclar"); return
    ps, extra, det, vias, farm, tl, ten, alv = [], [], [], [], [], [], [], []
    for s, it in novos:
        ps.append("P(%s, %s, %s, %s, %s, %s, %s, %s);" % tuple(js(it[k]) for k in (
            "nome", "categoria", "fase", "status", "mecanismo", "evidencia", "riscos", "fontes")))
        extra.append("  %s: [%s, %s]," % (js(it["nome"]), js(it["oque"]), js(it["beneficios"])))
        d = it["det"]
        det.append("  %s: %s," % (js(s), js({k: d[k] for k in ("oque", "age", "hist", "estudos", "evitar")})))
        if it.get("vias"):
            vias.append("  %s: %s," % (js(s), js(it["vias"])))
        f = it.get("farmaco")
        if f:
            farm.append("  %s: %s," % (js(s), js({"h": f.get("h"), "txt": f.get("txt", ""), "arm": f.get("arm", "")})))
        if it.get("timeline"):
            tl.append("  %s: %s," % (js(it["nome"]), js(it["timeline"])))
        if it.get("termo_en"):
            ten.append("%s: %s" % (js(it["nome"]), js(it["termo_en"])))
        for a in it.get("alvos", []):
            if a in chaves_alvo:
                alv.append('if (ALVOS[%s]) ALVOS[%s].peps.push(%s);' % (js(a), js(a), js(s)))
        # familia
        m = re.search(r'id:\s*"%s".*?peptideos:\s*\[' % re.escape(it["familia"]), mecs, re.S)
        if m:
            i, instr = m.end(), False
            while True:
                c = mecs[i]
                if instr:
                    if c == "\\":
                        i += 1
                    elif c == '"':
                        instr = False
                elif c == '"':
                    instr = True
                elif c == "]":
                    break
                i += 1
            vazio = mecs[m.end():i].strip() == ""
            mecs = mecs[:i] + ("" if vazio else ", ") + js(it["nome"]) + mecs[i:]
    marc = "\nP_NOVOS_ANCORA"
    # data.js: apos a ultima chamada P(
    ult = [m for m in re.finditer(r'^P\(.*$', data, re.M)][-1]
    data = data[:ult.end()] + "\n" + "\n".join(ps) + data[ult.end():]
    gravar("data.js", data)
    gravar("data-mecanismos.js", mecs)
    gravar("data-extra.js", ler("data-extra.js") + "\nObject.assign(EXTRA, {\n" + "\n".join(extra) + "\n});\n")
    gravar("data-detalhes.js", ler("data-detalhes.js") + "\nObject.assign(DETALHES, {\n" + "\n".join(det) + "\n});\n")
    gravar("data-vias.js", ler("data-vias.js") + "\nObject.assign(VIAS, {\n" + "\n".join(vias) + "\n});\n")
    gravar("data-farmaco.js", ler("data-farmaco.js") + "\nObject.assign(FARMACO, {\n" + "\n".join(farm) + "\n});\n")
    gravar("data-timeline.js", ler("data-timeline.js") + "\nObject.assign(TIMELINE, {\n" + "\n".join(tl) + "\n});\n")
    gravar("data-alvos.js", alvos + "\n" + "\n".join(alv) + "\n")
    gravar("core.js", ler("core.js") + "\nObject.assign(TERMO_EN, {" + ", ".join(ten) + "});\n")
    feitos |= {s for s, _ in novos}
    for var, ok in (("AUTO_DADOS", lambda a: a is True), ("DSLD_DADOS", lambda a: a == "dsld")):
        autos = [s for s, it in novos if ok(it.get("auto"))]
        if autos:
            gravar("data-extra.js", ler("data-extra.js") + "\nvar %s = (typeof %s !== \"undefined\" ? %s : []).concat(" % (var, var, var) + js(autos) + ");\n")
    MARC.write_text(json.dumps(sorted(feitos)), "utf-8")
    print("mesclados:", len(novos))
    print("slugs:", " ".join(s for s, _ in novos))


if __name__ == "__main__":
    main()
