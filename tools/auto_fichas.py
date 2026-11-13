"""Gera fichas 'dados automaticos' a partir do ChEMBL para os itens de tools/novos/_chembl_pep.json.
Uso: python tools\\auto_fichas.py [--fase-min 1]  -> grava tools\\novos\\novos_auto_<n>.py"""
import json, re, sys
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from faltam_chembl import get, API  # noqa

NOVOS = Path(__file__).resolve().parent / "novos"
FASE = {4: "Aprovado", 3: "Fase 3", 2: "Fase 2", 1: "Fase 1"}
EXC = re.compile(r"(cog\b|theophylline|aminophylline|dactinomycin|carfilzomib|protein|prothrombin|romidepsin|trolamine|"
                 r"efgartigimod|tagraxofusp|cenegermin|fusp\b|\bLH \(|menotropins|lutropin|follitropin|trafermin|desirudin)", re.I)


def cat_de(moa, ind, fase):
    t = (moa + " " + ind).lower()
    if re.search(r"bacteri|antibiotic|cell wall|ribosom", t):
        return "Antimicrobiano"
    if re.search(r"opioid", t):
        return "Opioide"
    if re.search(r"tumor|cancer|neoplas|carcinoma|leuk|lymphom|myeloma", t):
        return "Antitumoral"
    if re.search(r"diabet|obes|insulin|glucagon|glp-1", t):
        return "Metabolismo"
    if re.search(r"heart|hypertens|thromb|coagul|platelet|angiotensin|natriuretic", t):
        return "Cardiovascular"
    if re.search(r"gonadotropin|gnrh|lhrh|oxytocin|vasopressin|growth hormone|somatostatin|calcitonin|parathyroid|thyrotropin|corticotropin|hormone", t):
        return "Hormônio"
    return "Experimental"


def titulo(n):
    return " ".join(p.capitalize() if p.isupper() else p for p in n.split())


def uma(x):
    mol = get(API + "molecule/%s.json" % x["chembl"])
    mec = get(API + "mechanism.json?molecule_chembl_id=%s&limit=10" % x["chembl"]).get("mechanisms", [])
    ind = get(API + "drug_indication.json?molecule_chembl_id=%s&limit=30" % x["chembl"]).get("drug_indications", [])
    moas = []
    for m in mec:
        s = (m.get("mechanism_of_action") or "").strip()
        if s and s not in moas:
            moas.append(s)
    inds = []
    for i in sorted(ind, key=lambda i: -(float(i.get("max_phase_for_ind") or 0))):
        h = i.get("mesh_heading") or i.get("efo_term")
        if h and h not in inds:
            inds.append(h)
    return x, mol, moas, inds[:8]


def ficha(x, mol, moas, inds):
    fase_n = int(float(x["fase"]))
    nome = titulo(x["nome"])
    retirado = bool(mol.get("withdrawn_flag"))
    caixa = str(mol.get("black_box_warning")) in ("1", "True", "true")
    ano = mol.get("first_approval")
    fase = "Descontinuado" if retirado else FASE[fase_n]
    moa_txt = "; ".join(moas) if moas else ""
    ind_txt = ", ".join(inds)
    if fase_n == 4:
        status = "Aprovado em pelo menos um país segundo o ChEMBL%s; o status varia por país, então confira o órgão regulador (FDA, EMA, Anvisa)." % (" (primeira aprovação registrada: %s)" % ano if ano else "")
    else:
        status = "Em desenvolvimento clínico (fase máxima registrada no ChEMBL: %d); não aprovado segundo esta base. Confira o ClinicalTrials.gov." % fase_n
    if retirado:
        status = "Retirado do mercado em pelo menos um país segundo o ChEMBL. " + status
    mec = ("Segundo o ChEMBL: %s." % moa_txt) if moa_txt else "O mecanismo não está catalogado no ChEMBL para este item; consulte as fontes."
    ev = "Ficha de dados automáticos, sem avaliação editorial da qualidade das evidências. Fase máxima de desenvolvimento no ChEMBL: %d.%s" % (
        fase_n, (" Indicações registradas: %s." % ind_txt) if ind_txt else "")
    riscos = "Os riscos não foram organizados automaticamente; consulte a bula ou o órgão regulador."
    if caixa:
        riscos = "O ChEMBL registra alerta de caixa preta (boxed warning) para este composto; leia a bula. " + riscos
    return {
        "nome": nome, "termo_en": x["nome"].lower(), "categoria": cat_de(moa_txt, ind_txt, fase_n), "fase": fase,
        "status": status, "mecanismo": mec, "evidencia": ev, "riscos": riscos,
        "fontes": ["ChEMBL %s (https://www.ebi.ac.uk/chembl/compound_report_card/%s/)" % (x["chembl"], x["chembl"]), "ClinicalTrials.gov", "openFDA / EMA"],
        "oque": "Peptídeo ou composto peptídico catalogado no ChEMBL%s." % ((", indicado em: %s" % ind_txt) if ind_txt else ""),
        "beneficios": "Esta ficha foi gerada a partir de bases oficiais e ainda não tem texto editorial sobre benefícios; veja as indicações e as fontes.",
        "det": {
            "oque": "Ficha gerada automaticamente a partir do ChEMBL. %s" % (("Indicações registradas: %s." % ind_txt) if ind_txt else "Não há indicações registradas na base."),
            "age": [mec if moa_txt else "Mecanismo ainda não organizado nesta ficha.", "Os detalhes de como age ainda não foram revisados editorialmente.", "Consulte a bula, o ChEMBL e as publicações para o mecanismo completo."],
            "hist": ("Primeira aprovação registrada: %s." % ano) if ano else "Sem data de aprovação registrada na base.",
            "estudos": "Fase máxima de desenvolvimento registrada: %d. Consulte o ClinicalTrials.gov para ensaios em andamento." % fase_n,
            "evitar": "Consulte a bula e um profissional de saúde; esta ficha automática não lista contraindicações.",
        },
        "timeline": [[int(ano), "Primeira aprovação registrada no ChEMBL"]] if ano else [],
        "familia": "peptideos-terapeuticos", "alvos": [], "auto": True,
    }


def main():
    fmin = int(sys.argv[sys.argv.index("--fase-min") + 1]) if "--fase-min" in sys.argv else 1
    lista = json.loads((NOVOS / "_chembl_pep.json").read_text("utf-8"))
    lista = [x for x in lista if int(float(x["fase"])) >= fmin and not EXC.search(x["nome"])]
    print("itens:", len(lista))
    with ThreadPoolExecutor(6) as ex:
        res = list(ex.map(uma, lista))
    for f in NOVOS.glob("novos_auto_*.py"):
        f.unlink()
    fichas = [ficha(*r) for r in res]
    for i in range(0, len(fichas), 25):
        txt = "# gerado por tools/auto_fichas.py (dados do ChEMBL)\nNOVOS = " + json.dumps(fichas[i:i + 25], ensure_ascii=False, indent=1) + "\n"
        txt = txt.replace(": true", ": True").replace(": false", ": False").replace(": null", ": None")
        (NOVOS / ("novos_auto_%d.py" % (i // 25 + 1))).write_text(txt, "utf-8")
    print("arquivos:", (len(fichas) + 24) // 25)


if __name__ == "__main__":
    main()
