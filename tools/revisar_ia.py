"""Revisão automática dos textos das fichas por um modelo de IA (Google Gemini, camada gratuita), sem aprovação manual.

Uso: python tools/revisar_ia.py [--limite N] [--slug nome-do-item]
Em cada execução revisa até N itens (padrão 60), priorizando fichas sinalizadas pela coleta, depois as nunca
revisadas e por fim as revisadas há mais tempo. O modelo recebe o texto atual e os dados oficiais coletados
(FDA, EMA, Anvisa, Health Canada, ClinicalTrials.gov) e só pode corrigir o que esses dados ou o conhecimento
consolidado sustentam. Alterações passam por travas (sem doses, sem recomendação, tamanho, coerência com
aprovações oficiais) e ficam registradas com justificativa em dados/revisao-ia.json.
O resultado é aplicado por um bloco gerado no fim de dados/data-extra.js; as fichas HTML são regeradas pelo build.
Requer a variável GEMINI_API_KEY (chave gratuita do Google AI Studio, guardada em Secrets do GitHub).
Outro serviço compatível com o formato OpenAI funciona trocando IA_ENDPOINT e IA_MODELO."""
import os, re, sys, json, time, argparse, pathlib, urllib.request, urllib.error
from datetime import datetime, timezone

raiz = pathlib.Path(__file__).resolve().parent.parent
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
ARQ_JSON = raiz / "dados" / "revisao-ia.json"
ARQ_EXTRA = raiz / "dados" / "data-extra.js"
ENDPOINT = os.environ.get("IA_ENDPOINT", "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions")
MODELO = os.environ.get("IA_MODELO", "gemini-2.5-flash")
CAMPOS = ("oQueFaz", "beneficios", "mecanismo", "evidencia", "riscos", "status")
LIMITE_CAMPO = {"oQueFaz": 260, "beneficios": 420, "mecanismo": 320, "evidencia": 300, "riscos": 360, "status": 300}
INI, FIM = "/*IA:INICIO*/", "/*IA:FIM*/"

SISTEMA = """Você é revisor de conteúdo de um guia educativo brasileiro sobre peptídeos, hormônios, suplementos e medicamentos.
Revise os textos de UMA ficha. Regras obrigatórias:
- Escreva em português do Brasil, em linguagem simples e neutra, com frases curtas.
- NUNCA inclua doses, posologia, protocolos, instruções de uso, onde comprar ou recomendação de uso.
- Só afirme o que os DADOS OFICIAIS fornecidos ou o conhecimento científico consolidado sustentam. Se não tiver certeza, mantenha o texto atual.
- O campo status deve refletir o estado regulatório. Se os dados oficiais mostrarem aprovação (FDA, EMA, Anvisa ou Health Canada), o status não pode dizer que não é aprovado. Se não houver aprovação nos dados e o item for experimental, não diga que é aprovado.
- Para itens sem estudos em humanos, deixe claro que a evidência é limitada. Nunca exagere benefícios; mantenha os riscos conhecidos.
- Altere somente campos que estejam errados, imprecisos, desatualizados ou vazios de conteúdo útil (por exemplo "Experimental." sozinho). Se a ficha estiver adequada, responda mudou=false.
Responda SOMENTE com JSON: {"mudou": true|false, "justificativa": "motivo curto", "campos": {"campo": "novo texto"}}.
Campos permitidos: oQueFaz, beneficios, mecanismo, evidencia, riscos, status."""

DOSE = re.compile(r"\d\s?(mg|mcg|µg|μg|ug|ui|iu|ml)\b", re.I)
CONSELHO = re.compile(r"\b(recomenda-se|recomendamos|tome|tomar|use |usar |aplique|aplicar|compre|comprar|inje[cç]|dose de)\b", re.I)


def ler_json(caminho, padrao):
    try:
        return json.loads(caminho.read_text(encoding="utf-8"))
    except (OSError, ValueError):
        return padrao


def slug(nome):
    import unicodedata
    s = unicodedata.normalize("NFD", nome.lower())
    return re.sub(r"[^a-z0-9]+", "-", "".join(c for c in s if unicodedata.category(c) != "Mn")).strip("-")


def chamar_modelo(mensagens, token):
    corpo = json.dumps({"model": MODELO, "messages": mensagens, "temperature": 0.1, "max_tokens": 4000,
                        "response_format": {"type": "json_object"}}).encode()
    req = urllib.request.Request(ENDPOINT, corpo, {"Authorization": f"Bearer {token}", "Content-Type": "application/json",
                                                    "Accept": "application/json", "X-GitHub-Api-Version": "2022-11-28"})
    for tentativa in range(3):
        try:
            with urllib.request.urlopen(req, timeout=90) as r:
                return json.loads(json.loads(r.read())["choices"][0]["message"]["content"])
        except urllib.error.HTTPError as e:
            if e.code == 429 and tentativa < 2:
                time.sleep(int(e.headers.get("Retry-After", "30")) + 2)
                continue
            if e.code in (401, 403):
                raise SystemExit(f"Chave recusada pelo serviço de IA (HTTP {e.code}). Confira o secret GEMINI_API_KEY.")
            print("   falha HTTP", e.code)
            return None
        except (urllib.error.URLError, ValueError, KeyError, TimeoutError) as e:
            print("   falha:", type(e).__name__)
            time.sleep(3)
    return None


def dados_oficiais(live, aprov):
    """Resumo enxuto das fontes oficiais coletadas para o item."""
    saida = {}
    for k in ("ensaios", "fase1", "fase2", "fase3", "recrutando", "artigos", "fdaRegistros", "fdaAprovacao", "ema", "bula"):
        if live.get(k) not in (None, 0, {}, ""):
            saida[k] = live[k]
    for fonte in ("fda", "ema", "anvisa", "canada"):
        v = aprov.get(fonte)
        if v:
            saida["aprovacao_" + fonte] = v if isinstance(v, (str, bool)) else ({k: x for k, x in v.items() if k in ("situacao", "desde", "marcas", "produto")} or True)
    return saida


def aprovado_oficial(oficial):
    if oficial.get("fdaAprovacao") or oficial.get("aprovacao_fda"):
        return True
    return any(k.startswith("aprovacao_") and (v is True or isinstance(v, str) or (isinstance(v, dict) and v.get("situacao") in ("autorizado", "aprovado"))) for k, v in oficial.items())


def validar(item, campo, texto, oficial):
    if not isinstance(texto, str):
        return "não é texto"
    t = texto.strip()
    if len(t) < 12 or len(t) > LIMITE_CAMPO[campo]:
        return f"tamanho fora do limite ({len(t)})"
    antigo = str(item.get(campo) or "")
    if DOSE.search(t) and not DOSE.search(antigo):
        return "contém dose"
    if CONSELHO.search(t) and not CONSELHO.search(antigo):
        return "contém instrução de uso"
    if campo == "status" and aprovado_oficial(oficial) and re.search(r"não\s+(é\s+)?aprovad|sem\s+aprova", t, re.I):
        return "contradiz aprovação oficial"
    if campo == "status" and not aprovado_oficial(oficial) and re.match(r"\s*aprovad", t, re.I) and item.get("fase") != "Aprovado":
        return "afirma aprovação sem fonte oficial"
    return None


def revisar_item(item, oficial, token):
    atual = {c: item.get(c) for c in CAMPOS}
    usuario = json.dumps({"nome": item["nome"], "categoria": item.get("categoria"), "fase_do_catalogo": item.get("fase"),
                          "textos_atuais": atual, "dados_oficiais_coletados": oficial}, ensure_ascii=False)
    r = chamar_modelo([{"role": "system", "content": SISTEMA}, {"role": "user", "content": usuario}], token)
    if not isinstance(r, dict):
        return None
    aceitos, recusados = {}, {}
    if r.get("mudou") is True and isinstance(r.get("campos"), dict):
        for c, v in r["campos"].items():
            if c not in CAMPOS or (isinstance(v, str) and v.strip() == str(item.get(c) or "").strip()):
                continue
            motivo = validar(item, c, v, oficial)
            (recusados.__setitem__(c, motivo) if motivo else aceitos.__setitem__(c, v.strip()))
    return {"campos": aceitos, "recusados": recusados, "justificativa": str(r.get("justificativa") or "")[:400]}


def escrever_bloco(registros):
    aplicar = {n: {"data": r["data"], "campos": r.get("campos", {})} for n, r in registros.items()}
    bloco = (f"{INI}\n/* Gerado por tools/revisar_ia.py: revisão automática por IA, sem aprovação humana. Histórico em dados/revisao-ia.json. */\n"
             f"const REVISAO_IA = {json.dumps(aplicar, ensure_ascii=False, separators=(',', ':'))};\n"
             "PEPTIDES.forEach(p => {\n  const r = REVISAO_IA[p.nome];\n  if (!r) return;\n  Object.assign(p, r.campos);\n  p.revisaoIA = r.data;\n});\n"
             f"{FIM}\n")
    texto = ARQ_EXTRA.read_text(encoding="utf-8")
    texto = re.sub(re.escape(INI) + r".*?" + re.escape(FIM) + r"\n?", "", texto, flags=re.S).rstrip("\n") + "\n\n" + bloco
    ARQ_EXTRA.write_text(texto, encoding="utf-8")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--limite", type=int, default=int(os.environ.get("IA_LIMITE", "18")))
    ap.add_argument("--slug", default="")
    args = ap.parse_args()
    token = os.environ.get("GEMINI_API_KEY") or os.environ.get("IA_API_KEY")
    if not token:
        print("Sem GEMINI_API_KEY: revisão por IA ignorada.")
        return
    from gerar_fichas import carregar
    catalogo = carregar()["P"]
    live = ler_json(raiz / "dados" / "live-data.json", {}).get("itens", {})
    texto_aprov = (raiz / "dados" / "aprovacoes.js").read_text(encoding="utf-8")
    m = re.search(r"=\s*(\{.*\});", texto_aprov, re.S)
    aprov = json.loads(m.group(1)) if m else {}
    fila_pend = ler_json_js(raiz / "dados" / "revisao-pendente.js")
    reg = ler_json(ARQ_JSON, {"itens": {}})["itens"]

    def prioridade(it):
        s = slug(it["nome"])
        return (0 if s in fila_pend else 1, 0 if it["nome"] not in reg else 1, reg.get(it["nome"], {}).get("data", ""))
    candidatos = [it for it in catalogo if not args.slug or slug(it["nome"]) == args.slug]
    candidatos.sort(key=prioridade)
    feitos = alterados = recusas = 0
    for it in candidatos[:args.limite]:
        s = slug(it["nome"])
        print(f"[{feitos + 1}/{min(args.limite, len(candidatos))}] {it['nome']}", flush=True)
        res = revisar_item(it, dados_oficiais(live.get(s, {}), aprov.get(s, {})), token)
        time.sleep(4)
        if res is None:
            continue
        feitos += 1
        recusas += len(res["recusados"])
        anterior = reg.get(it["nome"], {})
        campos = {**anterior.get("campos", {}), **res["campos"]}
        if res["campos"]:
            alterados += 1
            print("   alterado:", ", ".join(res["campos"]), "|", res["justificativa"])
        reg[it["nome"]] = {"data": datetime.now(timezone.utc).strftime("%Y-%m-%d"), "campos": campos,
                           "justificativa": res["justificativa"], "recusados": res["recusados"]}
        ARQ_JSON.write_text(json.dumps({"itens": reg}, ensure_ascii=False, indent=1), encoding="utf-8")
    escrever_bloco(reg)
    print(f"Revisão por IA: {feitos} itens revisados, {alterados} alterados, {recusas} campos recusados pelas travas.")


def ler_json_js(caminho):
    try:
        m = re.search(r"=\s*(\{.*\});", caminho.read_text(encoding="utf-8"), re.S)
        return json.loads(m.group(1)) if m else {}
    except (OSError, ValueError):
        return {}


if __name__ == "__main__":
    main()
