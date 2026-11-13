"""Registra revisao humana de fichas. Uso:
  python tools/revisar.py slug1 slug2 --por "Dra. Nome, CRM 0000/UF"   marca como revisadas hoje e limpa os sinais pendentes
  python tools/revisar.py --todos --por "Nome, registro"                 marca todo o catalogo
  python tools/revisar.py slug --limpar-sinais                           so limpa os sinais pendentes (sem marcar revisao)
  python tools/revisar.py --status                                       resume a situacao"""
import re, sys, json, pathlib
from datetime import date

raiz = pathlib.Path(__file__).resolve().parent.parent

def ler(nome, var):
    arq = raiz / nome
    if not arq.exists():
        return {}
    m = re.search(r"=\s*(\{.*\});", arq.read_text(encoding="utf-8"), re.S)
    return json.loads(m.group(1)) if m else {}

def gravar(nome, var, comentario, dados):
    (raiz / nome).write_text(f"/* {comentario} */\nconst {var} = " + json.dumps(dados, ensure_ascii=False, indent=1) + ";\n", encoding="utf-8")

def main():
    a = sys.argv[1:]
    por = a[a.index("--por") + 1] if "--por" in a else ""
    slugs = []
    i = 0
    while i < len(a):
        if a[i] == "--por":
            i += 2
            continue
        if not a[i].startswith("--"):
            slugs.append(a[i])
        i += 1
    rev = ler("revisoes.js", "REVISOES")
    pend = ler("revisao-pendente.js", "REVISAO_PENDENTE")
    if "--status" in a:
        print(f"{len(rev)} fichas com revisao humana registrada; {len(pend)} com sinais pendentes.")
        for s, l in pend.items():
            print(f" - {s}: {len(l)} sinal(is)")
        return
    if "--todos" in a:
        d = (raiz / "tools" / "_pep.json")
        bruto = json.loads(d.read_text(encoding="utf-8"))
        itens = bruto["P"] if isinstance(bruto, dict) else bruto
        import unicodedata
        def slug(n):
            s = "".join(c for c in unicodedata.normalize("NFD", n.lower()) if unicodedata.category(c) != "Mn")
            return re.sub(r"[^a-z0-9]+", "-", s).strip("-")
        slugs = [slug(p["nome"]) for p in itens]
    if not slugs:
        sys.exit(__doc__)
    if "--limpar-sinais" not in a:
        if not por:
            sys.exit("Informe quem revisou com --por \"Nome, registro profissional\"")
        for s in slugs:
            rev[s] = {"por": por, "data": date.today().isoformat()}
    for s in slugs:
        pend.pop(s, None)
    gravar("revisoes.js", "REVISOES", "Revisao humana por profissional de saude (tools/revisar.py). Vazio = ainda nao revisado.", rev)
    gravar("revisao-pendente.js", "REVISAO_PENDENTE", "Sinais nas fontes que pedem revisao humana do texto (tools/atualizar.py).", pend)
    print(f"{len(slugs)} ficha(s) atualizada(s).")

main()
