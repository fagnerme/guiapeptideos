"""Gera o catálogo JSON estático da API v1 a partir dos dados públicos do guia."""
import json
import pathlib
import sys
from urllib.parse import quote

RAIZ = pathlib.Path(__file__).resolve().parent.parent
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
from atualizar import catalogo, slug

CACHE = RAIZ / "tools" / "_pep.json"
LIVE = RAIZ / "dados" / "live-data.json"
SAIDA = RAIZ / "api" / "v1" / "catalog.json"

FONTES = {
    "fda": {
        "nome": "U.S. Food and Drug Administration (FDA)",
        "url": "https://www.fda.gov/",
    },
    "ema": {
        "nome": "European Medicines Agency (EMA)",
        "url": "https://www.ema.europa.eu/en/medicines",
    },
    "anvisa": {
        "nome": "Agência Nacional de Vigilância Sanitária (Anvisa)",
        "url": "https://consultas.anvisa.gov.br/#/medicamentos/",
    },
    "healthCanada": {
        "nome": "Health Canada",
        "url": "https://health-products.canada.ca/dpd-bdpp/index-eng.jsp",
    },
    "clinicalTrials": {
        "nome": "ClinicalTrials.gov",
        "url": "https://clinicaltrials.gov/",
    },
    "pubmed": {
        "nome": "PubMed",
        "url": "https://pubmed.ncbi.nlm.nih.gov/",
    },
}


def _consulta(item, fonte, ultima_verificada=None):
    estados = item.get("fontesStatus", {})
    estado = estados.get(fonte) if isinstance(estados, dict) else None
    if estado:
        return {
            "status": estado.get("status", "desconhecido"),
            "attemptedAt": estado.get("tentadoEm"),
            "lastCompleteAt": estado.get("ultimaConsultaCompletaEm"),
            "unansweredQueries": estado.get("consultasSemResposta", []),
        }
    return {
        "status": "legacy_untracked",
        "attemptedAt": None,
        "lastCompleteAt": ultima_verificada,
        "unansweredQueries": [],
    }


def _registro(item, chave, nome, url, estado=None, verificado=None, dados=None):
    return {
        "source": nome,
        "url": url,
        "result": estado,
        "verifiedAt": verificado,
        "data": dados,
        "collection": _consulta(item, chave, verificado),
    }


def construir(live, peptideos, catalogo_itens):
    dados_live = live.get("itens", {})
    peps = {p["nome"]: p for p in peptideos}
    itens = []
    for nome, fase, termo in catalogo_itens:
        item = dados_live.get(slug(nome), {})
        pep = peps.get(nome, {})
        fda_data = item.get("fdaAprovacao")
        fda_verificado = item.get("fdaVerificadoEm")
        fda_url = "https://www.accessdata.fda.gov/scripts/cder/daf/index.cfm?event=BasicSearch.process&searchterm=" + quote(termo)
        ema = item.get("ema")
        ema_verificado = item.get("emaVerificadoEm")
        ema_url = (ema or {}).get("url") or FONTES["ema"]["url"]
        anvisa = item.get("anvisa")
        canada = item.get("canada")
        itens.append({
            "id": slug(nome),
            "name": nome,
            "category": pep.get("categoria"),
            "phase": fase,
            "regulatory": {
                "fda": _registro(
                    item, "fda", FONTES["fda"]["nome"], fda_url,
                    "approval_found" if fda_data else "no_approval_match" if fda_verificado else "not_verified",
                    fda_verificado,
                    {"approval": fda_data, "recordsFound": item.get("fdaRegistros"), "label": item.get("bula")},
                ),
                "ema": _registro(
                    item, "ema", FONTES["ema"]["nome"], ema_url,
                    (ema or {}).get("situacao") or ("no_match" if item.get("emaVerificado") else "not_verified"),
                    ema_verificado,
                    ema,
                ),
                "anvisa": _registro(
                    item, "anvisa", FONTES["anvisa"]["nome"], FONTES["anvisa"]["url"],
                    (anvisa or {}).get("situacao") or "not_verified",
                    (anvisa or {}).get("verificadoEm"),
                    anvisa,
                ),
                "healthCanada": _registro(
                    item, "healthCanada", FONTES["healthCanada"]["nome"], FONTES["healthCanada"]["url"],
                    (canada or {}).get("situacao") or "not_verified",
                    (canada or {}).get("verificadoEm"),
                    canada,
                ),
            },
            "research": {
                "clinicalTrials": {
                    "source": FONTES["clinicalTrials"]["nome"],
                    "url": "https://clinicaltrials.gov/search?term=" + quote(termo),
                    "counts": {
                        "studies": item.get("ensaios"),
                        "phase1": item.get("fase1"),
                        "phase2": item.get("fase2"),
                        "phase3": item.get("fase3"),
                        "recruiting": item.get("recrutando"),
                    },
                    "latestRegistryUpdate": item.get("ultimaAtualizacao"),
                    "collection": _consulta(item, "clinicalTrials"),
                },
                "pubmed": {
                    "source": FONTES["pubmed"]["nome"],
                    "url": "https://pubmed.ncbi.nlm.nih.gov/?term=" + quote(termo),
                    "counts": {
                        "articles": item.get("artigos"),
                        "articlesLast12Months": item.get("artigosAno"),
                        "safetyArticlesLast12Months": item.get("segurancaAno"),
                        "systematicReviewsLast12Months": item.get("revisoesAno"),
                    },
                    "collection": _consulta(item, "pubmed"),
                },
            },
            "limitations": [
                "A ausência de resultados em uma busca não prova ausência de aprovação.",
                "Contagens de estudos e artigos não demonstram eficácia, benefício ou segurança.",
                "O catálogo não é aconselhamento médico, jurídico ou regulatório.",
            ],
        })
    return {
        "apiVersion": "1.0.0",
        "generatedAt": live.get("geradoEm"),
        "access": "public_free_read_only",
        "lastCollection": {
            k: live.get("execucao", {}).get(k)
            for k in ("iniciadaEm", "concluidaEm", "status", "escopo", "itensProcessados", "itensNoCatalogo", "consultasSemResposta")
        },
        "sources": FONTES,
        "items": sorted(itens, key=lambda x: x["name"].casefold()),
    }


def gerar():
    if not CACHE.exists():
        raise SystemExit("Catálogo temporário ausente; execute python tools/build.py para gerar a API.")
    if not LIVE.exists():
        raise SystemExit("dados/live-data.json ausente; execute a coleta antes de gerar a API.")
    bruto = json.loads(CACHE.read_text(encoding="utf-8"))
    live = json.loads(LIVE.read_text(encoding="utf-8"))
    peptideos = bruto.get("P", []) if isinstance(bruto, dict) else bruto
    resultado = construir(live, peptideos, catalogo())
    ids = [item["id"] for item in resultado["items"]]
    if len(ids) != len(set(ids)) or len(ids) != len(catalogo()):
        raise ValueError("A API contém IDs duplicados ou o total não corresponde ao catálogo.")
    SAIDA.parent.mkdir(parents=True, exist_ok=True)
    SAIDA.write_text(json.dumps(resultado, ensure_ascii=False, separators=(",", ":")) + "\n", encoding="utf-8")
    print(f"API v{resultado['apiVersion']}: {len(ids)} itens em {SAIDA.relative_to(RAIZ)}")
    return resultado


if __name__ == "__main__":
    gerar()
