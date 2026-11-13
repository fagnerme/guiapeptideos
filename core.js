const AUTO_TRAD = localStorage.getItem("lang_auto") === "1";
const LANG = ["pt", "en", "es"].includes(localStorage.getItem("lang")) ? localStorage.getItem("lang") : "pt";
const LOCALE = { pt: "pt-BR", en: "en-US", es: "es-ES" }[LANG];
const esc = s => { const d = document.createElement("div"); d.textContent = s; return d.innerHTML; };
const semAcento = s => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
const slug = nome => semAcento(nome.toLowerCase()).replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
const porSlug = s => PEPTIDES.find(p => slug(p.nome) === s);
const faseClasse = f => "fase-" + semAcento(f.toLowerCase()).replace(/[^a-z0-9]+/g, "");
const urlPeptideo = nome => "peptideo.html?p=" + slug(nome);

function links(nome) {
  const termo = encodeURIComponent(nome.replace(/\s*\(.*\)/, ""));
  return `<a href="https://pubmed.ncbi.nlm.nih.gov/?term=${termo}" target="_blank" rel="noopener">PubMed</a> · ` +
    `<a href="https://clinicaltrials.gov/search?term=${termo}" target="_blank" rel="noopener">ClinicalTrials.gov</a> · ` +
    `<a href="https://go.drugbank.com/unearth/q?searcher=drugs&query=${termo}" target="_blank" rel="noopener">DrugBank</a> · ` +
    `<a href="https://www.uniprot.org/uniprotkb?query=${termo}" target="_blank" rel="noopener">UniProt</a>`;
}

/* Selo de confiança: combina a fase com o nível de evidência descrito */
/* Aprovações oficiais (FDA e EMA, detectadas por tools/atualizar.py em aprovacoes.js) promovem a fase para "Aprovado". */
const autorizadoEma = a => a?.ema?.situacao === "autorizado";
if (typeof APROVACOES_AUTO !== "undefined") {
  PEPTIDES.forEach(p => {
    const a = APROVACOES_AUTO[slug(p.nome)];
    if (!a || p.fase === "Aprovado" || !(a.fda || autorizadoEma(a))) return;
    p.fase = "Aprovado";
    p.faseAutomatica = true;
    const orgaos = [a.fda && "Drugs@FDA", autorizadoEma(a) && "EMA"].filter(Boolean).join(" e ");
    p.status = `Aprovação confirmada no ${orgaos} — detectada automaticamente. Texto anterior do catálogo, a revisar: ${p.status}`;
  });
}
/* Sinais de fase (tools/atualizar.py → revisao-pendente.js) reescrevem fase e status automaticamente, sem fila manual. */
/* Notas automáticas já saem em EN/ES (modelos abaixo); outros idiomas ficam em português para o Google Tradutor. */
const NOTAS_AUTO = {
  en: {
    rotulo: "Automatic update", ant: "Previous text",
    f3: (n, d, a) => `Phase 3 detected automatically (${n} trial(s) on ClinicalTrials.gov on ${d}); the catalog had "${a}"`,
    fases: { "In vitro": "In vitro", "Pré-clínico (animais)": "Preclinical (animals)", "Fase 1": "Phase 1", "Fase 2": "Phase 2" },
    regras: [
      [/^Nova aprovação detectada no Drugs@FDA\.?$/, () => "New approval detected in Drugs@FDA."],
      [/^Situação na EMA mudou: (.*) → (.*)\.$/, (m, a, b) => `EMA status changed: ${a} → ${b}.`],
      [/^(\d+) novo\(s\) recall\(s\) na FDA \(janela de 3 anos\)\.$/, (m, n) => `${n} new FDA recall(s) (3-year window).`],
      [/^(\d+) novo\(s\) ensaio\(s\) de fase 3 registrado\(s\) no ClinicalTrials\.gov\.$/, (m, n) => `${n} new phase 3 trial(s) registered on ClinicalTrials.gov.`],
      [/^Bula da FDA atualizada \((.*) → (.*)\)\. Reveja riscos e status\.$/, (m, a, b) => `FDA label updated (${a} → ${b}). Review risks and status.`],
      [/^A bula da FDA passou a ter alerta em caixa preta \(boxed warning\)\.$/, () => "The FDA label now carries a boxed warning."],
      [/^(\d+) nova\(s\) revisão\(ões\) sistemática\(s\)\/meta-análise\(s\) no PubMed\. Reveja evidência e benefícios\.$/, (m, n) => `${n} new systematic review(s)/meta-analysis(es) on PubMed. Review evidence and benefits.`],
      [/^Aumento de publicações sobre segurança\/efeitos adversos no PubMed \((\d+) → (\d+) no último ano\)\. Reveja riscos\.$/, (m, a, b) => `Increase in PubMed publications on safety/adverse effects (${a} → ${b} in the last year). Review risks.`],
      [/^(\d+) ensaio\(s\) de fase 3 encontrados, catálogo marca '(.*)'\.$/, (m, n, f) => `${n} phase 3 trial(s) found; catalog lists '${NOTAS_AUTO.en.fases[f] || f}'.`],
      [/^há registro na FDA, mas o catálogo marca '(.*)'\.$/, (m, f) => `there is an FDA record, but the catalog lists '${NOTAS_AUTO.en.fases[f] || f}'.`],
    ],
  },
  es: {
    rotulo: "Actualización automática", ant: "Texto anterior",
    f3: (n, d, a) => `Fase 3 detectada automáticamente (${n} ensayo(s) en ClinicalTrials.gov el ${d}); el catálogo indicaba "${a}"`,
    fases: { "In vitro": "In vitro", "Pré-clínico (animais)": "Preclínico (animales)", "Fase 1": "Fase 1", "Fase 2": "Fase 2" },
    regras: [
      [/^Nova aprovação detectada no Drugs@FDA\.?$/, () => "Nueva aprobación detectada en Drugs@FDA."],
      [/^Situação na EMA mudou: (.*) → (.*)\.$/, (m, a, b) => `La situación en la EMA cambió: ${a} → ${b}.`],
      [/^(\d+) novo\(s\) recall\(s\) na FDA \(janela de 3 anos\)\.$/, (m, n) => `${n} nuevo(s) retiro(s) en la FDA (ventana de 3 años).`],
      [/^(\d+) novo\(s\) ensaio\(s\) de fase 3 registrado\(s\) no ClinicalTrials\.gov\.$/, (m, n) => `${n} nuevo(s) ensayo(s) de fase 3 registrado(s) en ClinicalTrials.gov.`],
      [/^Bula da FDA atualizada \((.*) → (.*)\)\. Reveja riscos e status\.$/, (m, a, b) => `Prospecto de la FDA actualizado (${a} → ${b}). Revise riesgos y estado.`],
      [/^A bula da FDA passou a ter alerta em caixa preta \(boxed warning\)\.$/, () => "El prospecto de la FDA ahora tiene una advertencia en recuadro negro (boxed warning)."],
      [/^(\d+) nova\(s\) revisão\(ões\) sistemática\(s\)\/meta-análise\(s\) no PubMed\. Reveja evidência e benefícios\.$/, (m, n) => `${n} nueva(s) revisión(es) sistemática(s)/metaanálisis en PubMed. Revise evidencia y beneficios.`],
      [/^Aumento de publicações sobre segurança\/efeitos adversos no PubMed \((\d+) → (\d+) no último ano\)\. Reveja riscos\.$/, (m, a, b) => `Aumento de publicaciones sobre seguridad/efectos adversos en PubMed (${a} → ${b} en el último año). Revise riesgos.`],
      [/^(\d+) ensaio\(s\) de fase 3 encontrados, catálogo marca '(.*)'\.$/, (m, n, f) => `${n} ensayo(s) de fase 3 encontrado(s); el catálogo indica '${NOTAS_AUTO.es.fases[f] || f}'.`],
      [/^há registro na FDA, mas o catálogo marca '(.*)'\.$/, (m, f) => `hay registro en la FDA, pero el catálogo indica '${NOTAS_AUTO.es.fases[f] || f}'.`],
    ],
  },
};
function notaAuto(texto) {
  const t = NOTAS_AUTO[LANG];
  if (!t) return texto;
  for (const [re, f] of t.regras) {
    const m = texto.match(re);
    if (m) return f(...m);
  }
  return texto;
}
if (typeof REVISAO_PENDENTE !== "undefined") {
  const ordemFase = ["In vitro", "Pré-clínico (animais)", "Fase 1", "Fase 2", "Fase 3", "Aprovado"];
  PEPTIDES.forEach(p => {
    const sinais = REVISAO_PENDENTE[slug(p.nome)];
    const f3 = sinais && sinais.find(x => x.tipo === "fase" && /ensaio\(s\) de fase 3/.test(x.texto));
    if (!f3 || p.faseAutomatica || ordemFase.indexOf(p.fase) < 0 || ordemFase.indexOf(p.fase) >= 4) return;
    const n = (f3.texto.match(/^(\d+)/) || [])[1];
    const antes = p.fase;
    p.fase = "Fase 3";
    p.faseAutomatica = true;
    const t = NOTAS_AUTO[LANG];
    p.status = t
      ? `${t.f3(n, f3.data, t.fases[antes] || antes)}.`
      : `Fase 3 detectada automaticamente (${n} ensaio(s) no ClinicalTrials.gov em ${f3.data}); o catálogo marcava "${antes}". Texto anterior: ${p.status}`;
  });
  /* Demais sinais viram notas automáticas datadas no campo correspondente da ficha. */
  const CAMPO = { seguranca: "riscos", estudos: "evidencia", conteudo: "status", aprovacao: "status" };
  PEPTIDES.forEach(p => {
    (REVISAO_PENDENTE[slug(p.nome)] || []).forEach(x => {
      const c = CAMPO[x.tipo];
      if (!c || typeof p[c] !== "string") return;
      p[c] = `${p[c].replace(/\.?\s*$/, ".")} [${NOTAS_AUTO[LANG]?.rotulo || "Atualização automática"} ${x.data}: ${notaAuto(x.texto).replace(/\.$/, "")}.]`;
    });
  });
}
/* Onde está aprovado: FDA/EMA vêm da coleta automática; outros países (ex.: Anvisa) não têm API pública e não são listados. */
function locaisAprovacao(p) {
  const s = slug(p.nome), a = (typeof APROVACOES_AUTO !== "undefined" && APROVACOES_AUTO[s]) || {};
  const r = [];
  if (a.fda) r.push({ pais: "EUA", orgao: "FDA", marcas: a.fda.marcas, auto: true, url: "https://www.accessdata.fda.gov/scripts/cder/daf/index.cfm?event=BasicSearch.process&searchterm=" + encodeURIComponent(termoEn(p.nome)) });
  if (a.ema) r.push({ pais: "União Europeia", orgao: "EMA", marcas: a.ema.marcas, auto: true, retirado: a.ema.situacao !== "autorizado", url: a.ema.url });
  return r;
}
function htmlLocais(p, completo) {
  const l = locaisAprovacao(p);
  if (!l.length) return `<span class="locais sem">Sem aprovação confirmada nas bases consultadas (FDA, EMA). Confira também diretamente nos órgãos (ex.: Anvisa), que não têm API.</span>`;
  const curto = l.map(x => `<span class="local ${x.retirado ? "ret" : ""}" title="${esc(x.orgao)}${x.auto ? "" : " (informado manualmente)"}">${x.retirado ? "⛔" : "✅"} ${esc(x.pais)}${x.auto ? "" : "*"}</span>`).join(" ");
  if (!completo) return `<span class="locais">${curto}</span>`;
  return `<ul class="locais-lista">${l.map(x => `<li><b>${esc(x.pais)}</b> (${esc(x.orgao)})${x.retirado ? " — sem autorização ativa" : ""}${x.marcas?.length ? ": " + esc(x.marcas.join(", ")) : ""}${x.url ? ` · <a href="${esc(x.url)}" target="_blank" rel="noopener">registro oficial</a>` : ""}${x.auto ? "" : ` <small>(informado manualmente${x.nota ? "; " + esc(x.nota) : ""}; confirme no órgão oficial)</small>`}</li>`).join("")}</ul>
    <small>FDA e EMA são consultadas automaticamente nas bases públicas. Outros órgãos (como a Anvisa, no Brasil) não têm API pública, então não são listados aqui: verifique diretamente em <a href="https://consultas.anvisa.gov.br/" target="_blank" rel="noopener">Anvisa</a>, <a href="https://www.ema.europa.eu/en/medicines" target="_blank" rel="noopener">EMA</a> e <a href="https://www.accessdata.fda.gov/scripts/cder/daf/" target="_blank" rel="noopener">Drugs@FDA</a>.</small>`;
}
/* Perguntas frequentes geradas a partir dos campos da ficha (sem doses). */
function faqDe(p) {
  const loc = locaisAprovacao(p).filter(x => !x.retirado).map(x => x.pais + (x.auto ? "" : "*"));
  const categoria = tr(p.categoria);
  const definicao = tr(`${p.nome} é uma substância da categoria ${categoria}.`);
  return [
    [tr(`O que é ${p.nome}?`), `${definicao} ${tr(p.oQueFaz)}`],
    [`${p.nome} é aprovado?`, `Na fase atual do catálogo (${p.fase}): ${p.status}.${loc.length ? " Aprovação confirmada em: " + loc.join(", ") + "." : ""} Aprovação vale só para indicações específicas, com prescrição.`],
    [`Quais são os riscos de ${p.nome}?`, `${p.riscos} Esta não é uma lista completa; a bula e um profissional de saúde são as fontes para o seu caso.`],
    [`Qual é o nível de evidência sobre ${p.nome}?`, p.evidencia],
    [`Existe dose recomendada de ${p.nome}?`, `${p.protocolo} Este guia não fornece doses: apenas um profissional de saúde pode avaliar se e como usar.`],
  ];
}
/* Verificação por afirmação: links de busca pré-montados no PubMed por tipo de afirmação (não são citações individuais). */
const PUBMED = "https://pubmed.ncbi.nlm.nih.gov/?term=";
const CONSULTAS = {
  mecanismo: ["mecanismo de ação", "(mechanism of action[Title/Abstract])"],
  beneficios: ["ensaios clínicos", "(clinical trial[Publication Type] OR randomized controlled trial[Publication Type])"],
  evidencia: ["revisões sistemáticas e metanálises", "(systematic review[Publication Type] OR meta-analysis[Publication Type])"],
  riscos: ["segurança e efeitos adversos", "(adverse effects[Title/Abstract] OR safety[Title/Abstract] OR toxicity[Title/Abstract])"],
};
function verificar(p, tipo) {
  const c = CONSULTAS[tipo];
  if (!c) return "";
  const url = PUBMED + encodeURIComponent(`${termoEn(p.nome)}[Title/Abstract] AND ${c[1]}`);
  return `<small class="verificar">🔎 Conferir no <a href="${url}" target="_blank" rel="noopener">PubMed: ${c[0]}</a></small>`;
}
const linkFonte = f => `<a href="${PUBMED}${encodeURIComponent(f)}" target="_blank" rel="noopener" title="Buscar esta referência no PubMed">${esc(f)}</a>`;

/* Alertas de segurança: recalls de medicamentos na base openFDA (janela de 3 anos), da coleta automática. */
function alertasDe(p) {
  const d = _snapshotSync?.itens?.[slug(p.nome)];
  return d?.alertas || null;
}
function htmlAlertas(p) {
  const a = alertasDe(p);
  if (!a) return "<small>Sem dados de alertas disponíveis (rode a coleta automática).</small>";
  if (!a.total) return "<p>Nenhum recall encontrado na FDA nos últimos 3 anos para este nome.</p>";
  return `<p><b>${a.total} recall(s)</b> na FDA nos últimos 3 anos. Mais recentes:</p>
    <ul class="recalls">${a.recentes.map(r => `<li><b>${esc(r.data)}</b> · ${esc(r.classe)} · ${esc(r.empresa)}<br><small>${esc(r.motivo)} (${esc(r.produto)})</small></li>`).join("")}</ul>
    <small>Muitos recalls envolvem produtos <b>manipulados</b> ou lotes específicos, ${tr("e não necessariamente o item em geral.")} Veja também os alertas da <a href="https://www.gov.br/anvisa/pt-br/assuntos/fiscalizacao-e-monitoramento" target="_blank" rel="noopener">Anvisa</a> e da <a href="https://www.fda.gov/drugs/drug-safety-and-availability" target="_blank" rel="noopener">FDA</a>.</small>`;
}
const SELOS = {
  solido:  { icone: "✅", rotulo: "Aprovado · evidência sólida", classe: "selo-solido" },
  aprovado:{ icone: "🟡", rotulo: "Aprovado · evidência variável", classe: "selo-aprovado" },
  estudo:  { icone: "🔵", rotulo: "Em estudo clínico", classe: "selo-estudo" },
  pre:     { icone: "🟠", rotulo: "Sem comprovação em humanos", classe: "selo-pre" },
  desc:    { icone: "⚪", rotulo: "Desenvolvimento descontinuado", classe: "selo-desc" }
};
function seloDe(p) {
  const alta = /^alta/i.test(p.evidencia);
  if (p.fase === "Aprovado") return alta ? SELOS.solido : SELOS.aprovado;
  if (p.fase === "Descontinuado") return SELOS.desc;
  if (["Fase 1", "Fase 2", "Fase 3"].includes(p.fase)) return SELOS.estudo;
  return SELOS.pre;
}
/* Protocolos pessoais (só neste navegador): usados pela calculadora e pela página "Meus protocolos" */
/* Autocompletar próprio (o <datalist> nativo abre em posições aleatórias em alguns navegadores) */
function autoCompletar(input) {
  if (input.dataset.ac) return;
  input.dataset.ac = "1";
  input.removeAttribute("list");
  const norm = s => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  const envol = document.createElement("span");
  envol.style.cssText = "position:relative;display:block";
  input.parentNode.insertBefore(envol, input);
  envol.appendChild(input);
  const ul = document.createElement("ul");
  ul.className = "ac-lista"; ul.hidden = true; ul.setAttribute("role", "listbox");
  envol.appendChild(ul);
  let ativo = -1;
  const fechar = () => { ul.hidden = true; ativo = -1; };
  const marcar = () => [...ul.children].forEach((li, i) => li.classList.toggle("ativo", i === ativo));
  const escolher = li => { input.value = li.dataset.v; fechar(); input.dispatchEvent(new Event("change", { bubbles: true })); };
  const abrir = () => {
    const q = norm(input.value.trim());
    if (!q) return fechar();
    const achados = PEPTIDES.map(p => p.nome).filter(n => norm(n).includes(q))
      .sort((a, b) => (norm(a).startsWith(q) ? 0 : 1) - (norm(b).startsWith(q) ? 0 : 1) || a.localeCompare(b, "pt")).slice(0, 8);
    ul.textContent = "";
    achados.forEach(n => { const li = document.createElement("li"); li.textContent = n; li.dataset.v = n; li.setAttribute("role", "option"); ul.appendChild(li); });
    ativo = -1;
    ul.hidden = !achados.length || (achados.length === 1 && achados[0] === input.value);
  };
  input.addEventListener("input", abrir);
  input.addEventListener("keydown", e => {
    if (ul.hidden) return;
    const n = ul.children.length;
    if (e.key === "ArrowDown") { ativo = (ativo + 1) % n; marcar(); e.preventDefault(); }
    else if (e.key === "ArrowUp") { ativo = (ativo - 1 + n) % n; marcar(); e.preventDefault(); }
    else if (e.key === "Enter" && ativo >= 0) { escolher(ul.children[ativo]); e.preventDefault(); }
    else if (e.key === "Escape") fechar();
  });
  ul.addEventListener("mousedown", e => { const li = e.target.closest("li"); if (li) { e.preventDefault(); escolher(li); } });
  input.addEventListener("blur", fechar);
}const CH_MEUS = "meus_protocolos_v1";
const FREQ_SEM = { 7: "Diária", 5: "5×/semana", 3: "3×/semana", 2: "2×/semana", 1: "1×/semana" };
const novoIdProtocolo = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
function normalizarProtocolo(x) {
  const s = v => (typeof v === "string" ? v.slice(0, 300) : "");
  const d = Number(x.dose);
  const c = x.calc && typeof x.calc === "object" ? x.calc : null;
  const numeroCalc = v => typeof v === "number" && Number.isFinite(v) && v > 0 && v < 1e6 ? v : null;
  const estoqueQuantidade = numeroCalc(x.estoqueQuantidade);
  const estoqueUnidade = ["mg", "mcg", "UI", "mL", "g", "comprimido(s)", "cápsula(s)", "gota(s)", "dose(s)"].includes(x.estoqueUnidade) ? x.estoqueUnidade : "";
  const estoqueApresentacao = ["injecao", "comprimido", "capsula", "outra"].includes(x.estoqueApresentacao)
    ? x.estoqueApresentacao
    : estoqueUnidade === "comprimido(s)" ? "comprimido"
      : estoqueUnidade === "cápsula(s)" ? "capsula"
        : ["sc", "im", "iv"].includes(x.via) ? "injecao" : "outra";
  return {
    id: s(x.id) || novoIdProtocolo(), slug: s(x.slug), nome: s(x.nome).slice(0, 120) || "Sem nome", dose: Number.isFinite(d) && d > 0 ? d : null,
    unid: s(x.unid) || "mg", freq: s(x.freq), via: s(x.via), hora: s(x.hora), horaPrimeira: s(x.horaPrimeira), horaSegunda: s(x.horaSegunda),
    aplicacoesDia: x.freq === "2× ao dia" ? 2 : Math.max(1, Math.min(24, Number(x.aplicacoesDia) || 1)),
    horariosDia: (Array.isArray(x.horariosDia) ? x.horariosDia : [x.horaPrimeira, x.horaSegunda])
      .filter(t => typeof t === "string" && /^\d{2}:\d{2}$/.test(t)).slice(0, 24),
    inicio: s(x.inicio), fim: s(x.fim),
    fimTipo: ["data", "semanas"].includes(x.fimTipo) ? x.fimTipo : x.fim ? "data" : "nenhum",
    fimSemanas: Math.max(1, Math.min(260, Number(x.fimSemanas) || 1)),
    produto: s(x.produto), obs: s(x.obs),
    status: ["ativo", "pausado", "concluido"].includes(x.status) ? x.status : "ativo",
    tomadas: Array.isArray(x.tomadas) ? x.tomadas.filter(t => typeof t === "string" && /^\d{4}-\d{2}-\d{2}$/.test(t)).slice(-8760) : [],
    historicoDose: Array.isArray(x.historicoDose) ? x.historicoDose
      .filter(h => h && typeof h.data === "string" && /^\d{4}-\d{2}-\d{2}$/.test(h.data))
      .slice(-260).map(h => ({
        data: h.data, nome: s(h.nome).slice(0, 120), dose: Number.isFinite(Number(h.dose)) && Number(h.dose) > 0 ? Number(h.dose) : null,
        unid: s(h.unid), via: s(h.via), freq: s(h.freq),
      })).sort((a, b) => a.data.localeCompare(b.data)) : [],
    registrosDose: Array.isArray(x.registrosDose) ? x.registrosDose
      .filter(r => r && typeof r.data === "string" && /^\d{4}-\d{2}-\d{2}$/.test(r.data))
      .slice(-8760).map(r => ({
        id: s(r.id) || novoIdProtocolo(), data: r.data, nome: s(r.nome).slice(0, 120),
        dose: Number.isFinite(Number(r.dose)) && Number(r.dose) > 0 ? Number(r.dose) : null,
        unid: s(r.unid), via: s(r.via), freq: s(r.freq),
      })) : [],
    diasSemana: Array.isArray(x.diasSemana) ? [...new Set(x.diasSemana.filter(d => Number.isInteger(d) && d >= 0 && d <= 6))].sort() :
      (["Diária", "2× ao dia"].includes(x.freq) ? [0, 1, 2, 3, 4, 5, 6] : []),
    calc: c ? {
      tipo: ["po", "pronto"].includes(c.tipo) ? c.tipo : "po",
      unid: ["mg", "mcg", "UI"].includes(c.unid) ? c.unid : "mg",
      via: ["sc", "im"].includes(c.via) ? c.via : "",
      frasco: numeroCalc(c.frasco), diluente: numeroCalc(c.diluente),
      seringa: numeroCalc(c.seringa), dose: numeroCalc(c.dose), freq: numeroCalc(c.freq),
    } : null,
    estoqueQuantidade,
    estoqueUnidade,
    estoqueApresentacao,
    estoquePotencia: numeroCalc(x.estoquePotencia),
    estoqueQuantidadeManual: typeof x.estoqueQuantidadeManual === "boolean" ? x.estoqueQuantidadeManual
      : Boolean(estoqueQuantidade && estoqueQuantidade !== (c?.tipo === "po" ? numeroCalc(c.frasco) : null)),
    estoquePorAplicacao: numeroCalc(x.estoquePorAplicacao),
    estoqueData: typeof x.estoqueData === "string" && /^\d{4}-\d{2}-\d{2}$/.test(x.estoqueData) ? x.estoqueData : "",
    meiaVidaHoras: Number.isFinite(Number(x.meiaVidaHoras)) && Number(x.meiaVidaHoras) > 0 && Number(x.meiaVidaHoras) <= 8760
      ? Number(x.meiaVidaHoras) : null,
    criado: s(x.criado),
  };
}
function lerProtocolos() { try { return (JSON.parse(localStorage.getItem(CH_MEUS)) || []).map(normalizarProtocolo); } catch { return []; } }
function gravarProtocolos(l) { try { localStorage.setItem(CH_MEUS, JSON.stringify(l)); return true; } catch { alert("Não foi possível salvar neste navegador (armazenamento cheio ou bloqueado)."); return false; } }
function migrarProtocolosAntigos() {
  if (localStorage.getItem("meus_protocolos_migrado")) return;
  try {
    const velhos = JSON.parse(localStorage.getItem("calc_protocolos")) || [];
    if (velhos.length) {
      const l = lerProtocolos(), hoje = new Date().toISOString().slice(0, 10);
      velhos.forEach(v => {
        const e = v.est || {}, p = PEPTIDES.find(q => semAcento(q.nome.toLowerCase()) === semAcento(String(v.nome || "").toLowerCase()));
        l.push(normalizarProtocolo({ nome: v.nome, slug: p ? slug(p.nome) : "", dose: e.dose, unid: e.unid, via: e.via, freq: FREQ_SEM[e.freq] || "", calc: e, inicio: hoje, criado: hoje, obs: "Importado da calculadora." }));
      });
      gravarProtocolos(l);
    }
  } catch { /* dados antigos ilegíveis: ignora */ }
  localStorage.setItem("meus_protocolos_migrado", "1");
}
/* Tipo de substância: o que ela é quimicamente (diferente da categoria, que é o uso/área). */
const TIPOS = {
  peptideo: { icone: "🧬", rotulo: "Peptídeo ou proteína", def: "Cadeia curta de aminoácidos que funciona como sinal entre as células, regulando apetite, glicemia, reparo de tecidos e outras funções. Ex.: semaglutida, BPC-157, insulina. Costuma ser injetável, pois o estômago digere peptídeos antes de absorvê-los." },
  hormonio: { icone: "⚗️", rotulo: "Hormônio (não peptídico)", def: "Mensageiro químico produzido por glândulas, que viaja pelo sangue e regula metabolismo, humor, crescimento e reprodução. Aqui entram os de estrutura não peptídica, como esteroides e hormônios da tireoide. Ex.: testosterona, estradiol, levotiroxina. Quase sempre exige prescrição e acompanhamento médico." },
  vitamina: { icone: "🍊", rotulo: "Vitamina", def: "Micronutriente orgânico que o corpo não produz em quantidade suficiente e precisa obter da alimentação, em doses pequenas. Participa de reações do metabolismo, da imunidade e da saúde dos ossos. Ex.: vitaminas D, C e B12." },
  mineral: { icone: "🪨", rotulo: "Mineral", def: "Elemento químico essencial, de origem inorgânica, que o corpo usa em ossos, músculos, nervos e enzimas. Também não é produzido pelo organismo. Ex.: zinco, magnésio, ferro." },
  suplemento: { icone: "💊", rotulo: "Suplemento ou composto", def: "Molécula pequena que não se encaixa nos outros tipos: aminoácidos, ácidos graxos, antioxidantes e metabólitos. Muitas existem naturalmente no corpo ou nos alimentos e são vendidas como complemento. Ex.: creatina, carnitina, NAD+." }
};
const TIPO_FAMILIA = { "hormonios-sexuais": "hormonio", "tireoide-adrenais": "hormonio", "hormonios-metabolicos": "hormonio", "vitaminas-lipo": "vitamina", "vitaminas-hidro": "vitamina", "minerais": "mineral",
  "suplementos-metabolicos": "suplemento", "nad-sirtuinas": "suplemento", "polifenois-longevidade": "suplemento", "mimeticos-exercicio": "suplemento", "antioxidante": "suplemento" };
function chaveTipo(p) {
  if (p.categoria === "Vitamina") return "vitamina";
  if (p.categoria === "Mineral") return "mineral";
  if (p.categoria === "Cosmético" || /glutation|carnosin|anserin/i.test(p.nome)) return "peptideo";
  const fam = typeof MECANISMOS !== "undefined" && MECANISMOS.find(m => m.peptideos.includes(p.nome));
  if (fam && TIPO_FAMILIA[fam.id]) return TIPO_FAMILIA[fam.id];
  if (fam) return "peptideo";
  return { "Hormônio": "hormonio", "Suplemento e metabólito": "suplemento", "NAD e precursores": "suplemento", "Antioxidante": "suplemento", "Mimético de exercício": "suplemento" }[p.categoria] || "peptideo";
}
const tipoDe = p => TIPOS[chaveTipo(p)];
const ORIGENS = {
  auto: { icone: "🏛️", rotulo: "Base de dados: ChEMBL (EMBL-EBI)", classe: "origem-auto", dica: "Fase, mecanismo e indicações vêm do ChEMBL, base de dados pública do EMBL-EBI." },
  dsld: { icone: "🏛️", rotulo: "Base de dados: DSLD (NIH) + Wikipédia", classe: "origem-auto", dica: "Ativo identificado no DSLD (NIH); texto de apresentação adaptado da Wikipédia (CC BY-SA 4.0); fase pelo ClinicalTrials.gov." },
  ia:   { icone: "📝", rotulo: "Texto educativo", classe: "origem-ia", dica: "Resumo educativo baseado em fontes públicas; confira nas fontes primárias." }
};
function origemDe(p) {
  const s = slug(p.nome);
  if (typeof AUTO_DADOS !== "undefined" && AUTO_DADOS.includes(s)) return ORIGENS.auto;
  if (typeof DSLD_DADOS !== "undefined" && DSLD_DADOS.includes(s)) return ORIGENS.dsld;
  return ORIGENS.ia;
}
const htmlSelo = p => { const s = seloDe(p), o = origemDe(p); return `<span class="selo ${s.classe}" title="Critério: fase de desenvolvimento + nível de evidência">${s.icone} ${s.rotulo}</span> <span class="selo ${o.classe}" title="${o.dica}">${o.icone} ${o.rotulo}</span>`; };
const dataBR = iso => new Date(iso + "T12:00:00").toLocaleDateString(LOCALE);
const htmlRevisao = () => `<small class="revisao">Conteúdo atualizado em ${dataBR(DATA_REVISAO)}</small>`;
/* Etapas de desenvolvimento (a etapa atual vem do campo "fase") */
function htmlEtapas(p) {
  if (p.fase === "Descontinuado") return `<p class="etapas-nota">Desenvolvimento descontinuado ou sem benefício comprovado.</p>`;
  const atual = ETAPAS.indexOf(p.fase);
  return `<ol class="etapas">${ETAPAS.map((e, k) => `<li class="${k < atual ? "feita" : k === atual ? "atual" : ""}">${esc(e)}</li>`).join("")}</ol>`;
}
/* Favoritos (guardados no navegador) */
const getFavs = () => { try { return JSON.parse(localStorage.getItem("favoritos") || "[]"); } catch { return []; } };
const ehFav = s => getFavs().includes(s);
function alternarFav(s) {
  const f = getFavs();
  const i = f.indexOf(s);
  i >= 0 ? f.splice(i, 1) : f.push(s);
  localStorage.setItem("favoritos", JSON.stringify(f));
  return i < 0;
}
const rotuloFav = s => ehFav(s) ? "⭐ Favorito" : "☆ Favoritar";

/* Seções completas de um peptídeo (usadas na página do peptídeo e na folha de estudo) */
function secoesCompletas(p) {
  const s = (t, x) => `<section class="boas"><h2>${t}</h2><p>${esc(x)}</p></section>`;
  return s("O que faz", p.oQueFaz) + s("Mecanismo de ação", p.mecanismo) + s("Benefícios observados nos estudos", p.beneficios) +
    s("Nível de evidência", p.evidencia) + s("Riscos", p.riscos) + s("Protocolo / contexto de uso", p.protocolo) +
    s("Fontes", p.fontes.join("; "));
}
/* Tema */
const root = document.documentElement;
if (localStorage.getItem("tema")) root.dataset.tema = localStorage.getItem("tema");
function alternarTema() {
  const escuro = root.dataset.tema ? root.dataset.tema === "escuro" : matchMedia("(prefers-color-scheme: dark)").matches;
  root.dataset.tema = escuro ? "claro" : "escuro";
  localStorage.setItem("tema", root.dataset.tema);
}

if ("serviceWorker" in navigator && location.protocol.startsWith("http")) navigator.serviceWorker.register("sw.js").catch(() => {});

/* ---- Tooltips do glossário (só em português; nas outras línguas o texto é traduzido por nó inteiro) ---- */
const _TERMOS_GL = GLOSSARIO.map(g => g.termo).sort((a, b) => b.length - a.length);
const _RE_GL = new RegExp("(?<![\\p{L}\\d])(" + _TERMOS_GL.map(t => t.replace(/[.*+?^${}()|[\]\\/]/g, "\\$&")).join("|") + ")(?![\\p{L}\\d])", "giu");
function comGlossario(texto) {
  const html = esc(texto);
  if (LANG !== "pt") return html;
  const vistos = new Set();
  return html.replace(_RE_GL, m => {
    const k = m.toLowerCase();
    if (vistos.has(k)) return m;
    vistos.add(k);
    const g = GLOSSARIO.find(x => x.termo.toLowerCase() === k);
    return g ? `<a class="gl" href="termo.html?t=${slug(g.termo)}" title="${esc(g.def)}">${m}</a>` : m;
  });
}

/* ---- Explique fácil ---- */
const FASE_FACIL = [
  ["aprovado", "já foi aprovado por pelo menos uma agência reguladora, para usos específicos e com prescrição"],
  ["fase 3", "está na etapa final de testes, com muitas pessoas, para confirmar se funciona e é seguro"],
  ["fase 2", "está sendo testado em grupos pequenos para ver se funciona"],
  ["fase 1", "está nos primeiros testes em pessoas, focados em segurança"],
  ["pre-clinico", "só foi testado em animais; ainda não se sabe como age em pessoas"],
  ["in vitro", "só foi testado em células no laboratório; é uma ideia muito inicial"],
  ["descontinuado", "os testes foram interrompidos"],
];
function explicaFacil(p) {
  const f = semAcento(p.fase.toLowerCase());
  const par = FASE_FACIL.find(([k]) => f.startsWith(k));
  return `${p.oQueFaz} Em que pé está: ${par ? par[1] : p.fase}. Isso não quer dizer que seja seguro ou indicado para você; converse com um profissional de saúde.`;
}

/* ---- Estudos recentes (PubMed) ---- */
async function estudosRecentes(nome) {
  const chave = "estudos:" + nome;
  try {
    const c = JSON.parse(localStorage.getItem(chave));
    if (c && Date.now() - c.quando < TTL_LIVE) return c.itens;
  } catch {}
  const t = encodeURIComponent(termoEn(nome) + "[Title/Abstract]");
  const b = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/";
  const ids = (await getJson(`${b}esearch.fcgi?db=pubmed&retmode=json&retmax=5&sort=date&term=${t}`)).esearchresult.idlist;
  if (!ids.length) return [];
  const res = (await getJson(`${b}esummary.fcgi?db=pubmed&retmode=json&id=${ids.join(",")}`)).result;
  const itens = ids.map(id => ({ id, titulo: res[id]?.title || "", revista: res[id]?.source || "", data: res[id]?.pubdate || "" }));
  localStorage.setItem(chave, JSON.stringify({ quando: Date.now(), itens }));
  return itens;
}
async function carregarEstudos(el) {
  try {
    const it = await estudosRecentes(el.dataset.nome);
    el.innerHTML = it.length
      ? `<ul class="estudos">${it.map(e => `<li><a href="https://pubmed.ncbi.nlm.nih.gov/${e.id}/" target="_blank" rel="noopener">${esc(e.titulo)}</a><br><small>${esc(e.revista)} · ${esc(e.data)}</small></li>`).join("")}</ul><small>Fonte: PubMed (títulos em inglês). Ler o título não substitui ler o estudo.</small>`
      : "<small>Nenhum estudo recente encontrado.</small>";
  } catch { el.innerHTML = "<small>Estudos recentes indisponíveis agora (limite de requisições ou sem conexão).</small>"; }
}

/* ---- Alertas de mudança nos favoritos (comparam o live-data.json com a última visita) ---- */
async function alertasFavoritos() {
  const snap = await snapshot();
  const itens = snap?.itens;
  if (!itens) return [];
  const base = JSON.parse(localStorage.getItem("alertas-base") || "{}");
  const msgs = [], novo = { ...base };
  getFavs().forEach(s => {
    const d = itens[s], p = porSlug(s);
    if (!d || !p) return;
    const atual = { ensaios: d.ensaios, fase3: d.fase3, artigosAno: d.artigosAno, fda: d.fdaRegistros, fase: p.fase };
    const ant = base[s];
    if (ant) {
      if (ant.fase !== atual.fase) msgs.push(`${p.nome}: a fase no catálogo mudou de “${ant.fase}” para “${atual.fase}”.`);
      if (atual.fase3 > ant.fase3) msgs.push(`${p.nome}: ${atual.fase3 - ant.fase3} novo(s) ensaio(s) de fase 3 registrado(s).`);
      if (atual.ensaios > ant.ensaios) msgs.push(`${p.nome}: ${atual.ensaios - ant.ensaios} novo(s) ensaio(s) clínico(s) registrado(s).`);
      if (atual.fda > ant.fda) msgs.push(`${p.nome}: novo registro na FDA encontrado.`);
    }
    novo[s] = atual;
  });
  localStorage.setItem("alertas-base", JSON.stringify(novo));
  return msgs;
}
async function mostrarAlertas(el) {
  const msgs = await alertasFavoritos();
  el.innerHTML = msgs.length
    ? `<section class="boas alerta-box"><h2>🔔 Novidades nos seus favoritos</h2><ul>${msgs.map(m => `<li>${esc(m)}</li>`).join("")}</ul><small>Comparado com a sua última visita. Confira nas fontes antes de concluir algo.</small></section>`
    : "";
}

/* Cabeçalho e rodapé compartilhados */
/* Menu: poucos itens sempre visíveis + grupos por objetivo dentro de "Mais" */
const NAV_PRINCIPAL = [
  ["index.html", "Catálogo"], ["comparar.html", "Comparar"], ["calculadora.html", "Calculadora"],
  ["meus-protocolos.html", "Meus protocolos"], ["favoritos.html", "Favoritos"], ["como-usar.html", "Como usar"],
];
const NAV_GRUPOS = [
  ["🔎 Explorar", [["buscar.html", "Buscar no guia"], ["mecanismos.html", "Mecanismos"], ["alvos.html", "Hormônios e alvos"], ["corpo.html", "Mapa do corpo"], ["grafo.html", "Mapa de conexões"], ["classes.html", "Comparar classes"], ["linha-do-tempo.html", "Linha do tempo"], ["glossario.html", "Glossário"], ["estatisticas.html", "Estatísticas"]]],
  ["🛡️ Segurança", [["seguranca.html", "Segurança e legalidade"], ["interacoes.html", "Interações e cuidados"], ["sinais.html", "Sinais de alerta"], ["alertas.html", "Alertas de segurança"], ["alegacoes.html", "Alegações"], ["duracao.html", "Duração e armazenamento"], ["consulta.html", "Levar ao médico"]]],
  ["🎓 Aprender", [["aprender.html", "Aprender"], ["quiz.html", "Quiz"], ["quiz-familias.html", "Quiz por família"], ["leituras.html", "Leituras recomendadas"]]],
  ["ℹ️ Sobre o guia", [["novidades.html", "Novidades"], ["mudancas.html", "O que mudou"], ["revisao.html", "Atualizações automáticas"], ["sobre.html", "Sobre"], ["index.html#fontes", "Fontes"]]],
];
const NAV = [
  ["index.html", "Catálogo"],
  ["comparar.html", "Comparar"],
  ["aprender.html", "Aprender"],
  ["quiz.html", "Quiz"],
  ["favoritos.html", "Favoritos"],
  ["linha-do-tempo.html", "Linha do tempo"],
  ["novidades.html", "Novidades"],
  ["sobre.html", "Sobre"],
  ["mecanismos.html", "Mecanismos"],
  ["alegacoes.html", "Alegações"],
  ["seguranca.html", "Segurança e legalidade"],
  ["estatisticas.html", "Estatísticas"],
  ["glossario.html", "Glossário"],
  ["calculadora.html", "Calculadora"],
  ["meus-protocolos.html", "Meus protocolos"],
  ["index.html#fontes", "Fontes"],
];
const NAV_MAIS = [
  ["alertas.html", "Alertas de segurança"],
  ["mudancas.html", "O que mudou"],
  ["revisao.html", "Atualizações automáticas"],
  ["consulta.html", "Levar ao médico"],
  ["quiz-familias.html", "Quiz por família"],
  ["leituras.html", "Leituras recomendadas"],
  ["grafo.html", "Mapa de conexões"],
  ["buscar.html", "Buscar no guia"],
  ["alvos.html", "Hormônios e alvos"],
  ["corpo.html", "Mapa do corpo"],
  ["interacoes.html", "Interações e cuidados"],
  ["duracao.html", "Duração e armazenamento"],
  ["classes.html", "Comparar classes"],
  ["sinais.html", "Sinais de alerta"],
];
/* Acessibilidade de leitura: tamanho da fonte (A-/A+) e modo leitura, guardados no navegador. */
let _fonte = parseInt(localStorage.getItem("fonte") || "100", 10) || 100;
let _leitura = localStorage.getItem("leitura") === "1";
function aplicarLeitura() {
  document.documentElement.style.fontSize = _fonte + "%";
  document.documentElement.classList.toggle("leitura", _leitura);
}
aplicarLeitura();

/* Boas-vindas na primeira visita (3 passos, pode pular; reabre em "Como usar") */
const ONB_PASSOS = [
  ["👋 Bem-vindo(a)!", "Este guia é um material de estudo sobre peptídeos, hormônios, vitaminas e suplementos. Ele explica evidências, riscos e legalidade. Não receita nem indica doses."],
  ["🧭 Como se orientar", "Use a busca no topo para achar qualquer substância. Cada ficha tem selos que mostram a fase de desenvolvimento e a origem do texto. Compare duas substâncias lado a lado quando quiser."],
  ["📒 Suas ferramentas", "A Calculadora converte a dose que o seu médico prescreveu em unidades de seringa. Em Meus protocolos você anota o que usa e recebe alertas de interação. Tudo fica só no seu aparelho."],
];
function iniciarOnboarding(forcar) {
  if (document.getElementById("onb") || (!forcar && localStorage.getItem("onb_v1"))) return;
  let i = 0;
  const box = document.createElement("div");
  box.id = "onb"; box.className = "onb"; box.setAttribute("role", "dialog"); box.setAttribute("aria-modal", "true"); box.setAttribute("aria-labelledby", "onb-t");
  const fim = () => { localStorage.setItem("onb_v1", "1"); box.remove(); document.removeEventListener("keydown", tecla); };
  const tecla = e => {
    if (e.key === "Escape") fim();
    else if (e.key === "Tab") {
      const bs = [...box.querySelectorAll("button")];
      if (!bs.length) return;
      const k = bs.indexOf(document.activeElement), prox = e.shiftKey ? (k <= 0 ? bs.length - 1 : k - 1) : (k + 1) % bs.length;
      e.preventDefault(); bs[prox].focus();
    }
  };
  const desenhar = () => {
    const [t, p] = ONB_PASSOS[i], ultimo = i === ONB_PASSOS.length - 1;
    box.innerHTML = `<div class="onb-cx"><p class="onb-pt">${i + 1} / ${ONB_PASSOS.length}</p><h2 id="onb-t">${tr(t)}</h2><p>${tr(p)}</p>
      <div class="calc-acoes"><button type="button" class="btn btn-prim" id="onb-prox">${ultimo ? tr("Começar") : tr("Próximo")} →</button> <button type="button" class="btn btn-sec" id="onb-pular">${tr("Pular")}</button></div></div>`;
    box.querySelector("#onb-prox").addEventListener("click", () => { if (ultimo) fim(); else { i++; desenhar(); } });
    box.querySelector("#onb-pular").addEventListener("click", fim);
    box.querySelector("#onb-prox").focus();
  };
  document.body.appendChild(box);
  document.addEventListener("keydown", tecla);
  desenhar();
}
/* Busca do topo com sugestões ao digitar (nome ou categoria); Enter abre a busca completa. */
function sugestoesBusca() {
  const form = document.querySelector(".busca-global"), inp = form && form.querySelector("input");
  if (!inp || form.dataset.sug) return;
  form.dataset.sug = "1";
  inp.setAttribute("autocomplete", "off");
  const lista = document.createElement("ul");
  lista.className = "sug-busca";
  lista.id = "sug-busca";
  lista.hidden = true;
  lista.setAttribute("role", "listbox");
  form.appendChild(lista);
  inp.setAttribute("aria-controls", "sug-busca");
  let ativo = -1;
  const norm = s => semAcento(String(s).toLowerCase());
  const fechar = () => { lista.hidden = true; ativo = -1; };
  const marcar = i => {
    const it = [...lista.children];
    it.forEach((li, k) => li.classList.toggle("ativo", k === i));
    ativo = i;
  };
  inp.addEventListener("input", () => {
    const ws = norm(inp.value).split(/\s+/).filter(Boolean);
    if (inp.value.trim().length < 2) return fechar();
    const pts = PEPTIDES.map(p => ({ p, n: norm(p.nome) })).filter(x => ws.every(w => x.n.includes(w)));
    pts.sort((a, b) => (b.n.startsWith(ws[0]) ? 1 : 0) - (a.n.startsWith(ws[0]) ? 1 : 0) || a.n.length - b.n.length);
    const cats = !pts.length ? PEPTIDES.filter(p => ws.every(w => norm(p.categoria).includes(w))) : [];
    const itens = pts.slice(0, 7).map(x => `<li role="option"><a href="ficha-${esc(slug(x.p.nome))}.html"><b>${esc(x.p.nome)}</b> <small>${esc(tr(x.p.categoria))} · ${esc(tr(x.p.fase))}</small></a></li>`);
    if (cats.length) itens.push(...cats.slice(0, 7).map(p => `<li role="option"><a href="ficha-${esc(slug(p.nome))}.html"><b>${esc(p.nome)}</b> <small>${esc(tr(p.categoria))} · ${esc(tr(p.fase))}</small></a></li>`));
    itens.push(`<li role="option" class="sug-todos"><a href="buscar.html?q=${encodeURIComponent(inp.value.trim())}">🔎 ${esc(tr("Ver todos os resultados no guia"))}${pts.length > 7 ? ` (${pts.length}+)` : ""}</a></li>`);
    lista.innerHTML = itens.join("");
    lista.hidden = false;
    ativo = -1;
  });
  inp.addEventListener("keydown", e => {
    const n = lista.children.length;
    if (lista.hidden || !n) return;
    if (e.key === "ArrowDown") { e.preventDefault(); marcar((ativo + 1) % n); }
    else if (e.key === "ArrowUp") { e.preventDefault(); marcar((ativo - 1 + n) % n); }
    else if (e.key === "Enter" && ativo >= 0) { e.preventDefault(); lista.children[ativo].querySelector("a").click(); }
    else if (e.key === "Escape") fechar();
  });
  document.addEventListener("click", e => { if (!form.contains(e.target)) fechar(); });
}
function montarLayout(titulo) {
  setTimeout(sugestoesBusca, 0);
  const topo = document.getElementById("topo");
  if (topo) {
    topo.innerHTML = `<button id="tema" type="button" aria-label="Alternar tema">🌓</button>
      <h1><a href="index.html" class="home">${esc(titulo || "Guia Educativo de Peptídeos, Hormônios e Suplementos")}</a></h1>
      <p class="aviso"><span class="aviso-1">⚠️ Conteúdo exclusivamente educativo.</span> <span class="aviso-2">Não é recomendação médica nem fornece doses de autoadministração.</span></p>
      <form class="busca-global" action="buscar.html" role="search"><input type="search" name="q" placeholder="Buscar em todo o guia..." aria-label="Buscar em todo o guia"><button type="submit" aria-label="Buscar">🔍</button></form>
      <nav aria-label="Principal">${NAV_PRINCIPAL.map(([h, n]) => `<a href="${h}"${location.pathname.endsWith("/" + h) ? ' aria-current="page"' : ""}>${n}</a>`).join(" ")}
        <details class="nav-mais"><summary>Mais ▾</summary><div class="nav-grupos">${NAV_GRUPOS.map(([g, l]) => `<div><b>${g}</b>${l.map(([h, n]) => `<a href="${h}">${n}</a>`).join("")}</div>`).join("")}</div></details></nav>
      <details class="ajustes"><summary>⚙️ Ajustes</summary><div class="ajustes-corpo">
      <span class="leitura-ctrl"><button type="button" id="fonte-menos" aria-label="Diminuir fonte">A−</button><button type="button" id="fonte-mais" aria-label="Aumentar fonte">A+</button><button type="button" id="modo-leitura" aria-label="Modo leitura" aria-pressed="${_leitura}">📖</button></span>
      <p class="pwa-cta"><button type="button" id="instalar-app" class="btn btn-pwa">📲 Instalar no celular · usar offline</button></p>
      <select id="idioma" aria-label="Idioma / Language"><option value="pt">Português</option><option value="en">English</option><option value="es">Español</option><option value="auto">🌐 Other languages · Otros idiomas</option></select></div></details>
      <dialog id="pwa-ajuda" aria-labelledby="pwa-titulo">
        <div class="pwa-dialog">
          <button type="button" class="pwa-fechar" aria-label="Fechar">×</button>
          <h2 id="pwa-titulo">Instalar o guia e acessar offline</h2>
          <p>Abra este site no navegador do aparelho e use a opção de instalação ou de adicionar à tela inicial:</p>
          <ul>
            <li><b>Android:</b> no Chrome, abra o menu ⋮ e escolha “Instalar app” ou “Adicionar à tela inicial”.</li>
            <li><b>iPhone/iPad:</b> no Safari, toque em Compartilhar e escolha “Adicionar à Tela de Início”.</li>
            <li><b>Computador:</b> no Chrome ou Edge, use o ícone de instalação na barra de endereço ou o menu do navegador.</li>
          </ul>
          <p>Para preparar o acesso offline, mantenha o site aberto com internet até o carregamento terminar. Depois, abra o guia pelo ícone instalado. Conteúdos que dependem de serviços externos, como dados ao vivo, podem não atualizar offline.</p>
          <button type="button" class="btn btn-prim pwa-fechar">Entendi</button>
        </div>
      </dialog>`;
    const ajd = topo.querySelector(".ajustes"); const mq = matchMedia("(min-width:760px)"); const sincAj = () => { ajd.open = mq.matches; }; sincAj(); mq.addEventListener("change", sincAj);
    const sel = document.getElementById("idioma");
    sel.value = AUTO_TRAD ? "auto" : LANG;
    sel.addEventListener("change", () => {
      if (sel.value === "auto") { localStorage.setItem("lang", "pt"); localStorage.setItem("lang_auto", "1"); }
      else { localStorage.setItem("lang", sel.value); localStorage.removeItem("lang_auto"); }
      location.reload();
    });
    if (AUTO_TRAD) iniciarTraducaoAutomatica(document.getElementById("topo"));
    document.getElementById("tema").addEventListener("click", alternarTema);
    const ajustar = d => { _fonte = Math.min(160, Math.max(80, _fonte + d)); localStorage.setItem("fonte", _fonte); aplicarLeitura(); };
    document.getElementById("fonte-menos").addEventListener("click", () => ajustar(-10));
    document.getElementById("fonte-mais").addEventListener("click", () => ajustar(10));
    document.getElementById("modo-leitura").addEventListener("click", e => {
      _leitura = !_leitura; localStorage.setItem("leitura", _leitura ? "1" : "0");
      e.currentTarget.setAttribute("aria-pressed", _leitura); aplicarLeitura();
    });
    ligarInstalacaoPwa();
  }
  const main = document.querySelector("main");
  if (main && !main.id) main.id = "principal";
  if (main && !document.querySelector(".pular")) {
    const a = document.createElement("a");
    a.className = "pular"; a.href = "#principal"; a.textContent = "Pular para o conteúdo";
    document.body.prepend(a);
  }
  const rod = document.getElementById("rodape");
  if (rod) rod.innerHTML = `<p class="mais-links">${NAV_MAIS.map(([h, n]) => `<a href="${h}">${n}</a>`).join(" · ")}</p><a href="privacidade.html">Privacidade e aviso médico</a> · <span>Conteúdo educativo, não é aconselhamento médico.</span> · <a href="sobre.html">Sobre e metodologia</a><p class="credito-desenvolvedor">Desenvolvido por Fagner Felipe Creto Alves</p>`;
  if (typeof iniciarI18n === "function") iniciarI18n();
  if (!/como-usar|privacidade/.test(location.pathname)) setTimeout(() => iniciarOnboarding(false), 600);
}
/* ---- Dados ao vivo (ClinicalTrials.gov, PubMed, openFDA) ---- */
const TERMO_EN = {
  "Semaglutida": "semaglutide", "Tirzepatida": "tirzepatide", "Ocitocina": "oxytocin",
  "Hormônio do crescimento (somatropina)": "somatropin", "Liraglutida": "liraglutide", "Insulina": "insulin",
  "Teriparatida": "teriparatide", "Tesamorelina": "tesamorelin", "Retatrutida": "retatrutide",
  "Cagrilintida": "cagrilintide", "Survodutida": "survodutide", "Mazdutida": "mazdutide",
  "Pramlintida": "pramlintide", "Setmelanotida": "setmelanotide", "Pegbelfermina": "pegbelfermin",
  "Dasiglucagona": "dasiglucagon", "Sermorelina": "sermorelin", "Hexarelina": "hexarelin",
  "Folistatina-344": "follistatin", "Kisspeptina-10": "kisspeptin", "Gonadorelina (GnRH)": "gonadorelin",
  "Leuprorrelina": "leuprolide", "Octreotida": "octreotide", "Abaloparatida": "abaloparatide",
  "Vosoritida": "vosoritide", "Timosina alfa-1": "thymosin alpha 1", "Cibinetida (ARA-290)": "cibinetide",
  "Larazotida": "larazotide", "Teduglutida": "teduglutide", "Apraglutida": "apraglutide",
  "Zilucoplana": "zilucoplan", "Pegcetacoplana": "pegcetacoplan", "Angiotensina-(1-7)": "angiotensin-(1-7)",
  "Elamipretida (SS-31)": "elamipretide", "Humanina": "humanin", "Davunetida": "davunetide",
  "Bremelanotida (PT-141)": "bremelanotide", "Dermorfina": "dermorphin", "Melitina": "melittin",
  "Nisina": "nisin", "Defensinas humanas": "defensin", "Glutationa": "glutathione", "Carnosina": "carnosine",
  "Ipamorelina / CJC-1295": "ipamorelin", "Melanotan II": "melanotan", "TB-500 (Timosina beta-4)": "thymosin beta 4",
  "GHRP-2 (pralmorelina)": "pralmorelin", "MGF / PEG-MGF": "mechano growth factor",
  "Argireline (acetil hexapeptídeo-8)": "acetyl hexapeptide-8", "Matrixyl (palmitoil pentapeptídeo-4)": "palmitoyl pentapeptide",
  "Epitalon (Epithalon)": "epitalon",
  "Testosterona": "testosterone", "Estradiol": "estradiol", "Progesterona": "progesterone", "Hidrocortisona (cortisol)": "hydrocortisone",
  "DHEA (prasterona)": "prasterone", "Levotiroxina (T4)": "levothyroxine", "Liotironina (T3)": "liothyronine", "Melatonina": "melatonin",
  "Gonadotrofina coriônica (hCG)": "chorionic gonadotropin", "Glucagon": "glucagon", "Calcitonina": "calcitonin", "Desmopressina": "desmopressin",
  "Metreleptina": "metreleptin", "Vitamina D3 (colecalciferol)": "cholecalciferol", "Vitamina B12 (cobalamina)": "cyanocobalamin",
  "Vitamina C (ácido ascórbico)": "ascorbic acid", "Vitamina B6 (piridoxina)": "pyridoxine", "Folato (vitamina B9)": "folic acid",
  "Vitamina K2 (menaquinona)": "menatetrenone", "Vitamina A (retinol)": "retinol", "Vitamina E (tocoferol)": "alpha-tocopherol",
  "Niacina (vitamina B3)": "niacin", "NAD+": "nicotinamide adenine dinucleotide", "NMN (mononucleotídeo de nicotinamida)": "nicotinamide mononucleotide",
  "Nicotinamida ribosídeo (NR)": "nicotinamide riboside",
  "L-carnitina": "L-carnitine",
  "Acetil-L-carnitina": "Acetyl-L-carnitine",
  "Ácido alfa-lipoico": "alpha-lipoic acid",
  "N-acetilcisteína (NAC)": "N-acetylcysteine",
  "Coenzima Q10": "Coenzyme Q10",
  "Creatina": "creatine",
  "Taurina": "taurine",
  "Glicina": "glycine",
  "Ômega-3 (EPA/DHA)": "omega-3 fatty acids EPA DHA",
  "Citicolina": "citicoline",
  "Ergotioneína": "L-ergothioneine",
  "Resveratrol": "resveratrol",
  "Pterostilbeno": "pterostilbene",
  "Urolitina A": "urolithin A",
  "Espermidina": "spermidine",
  "PQQ (pirroloquinolina quinona)": "pyrroloquinoline quinone PQQ",
  "Fisetina": "fisetin",
  "Quercetina": "quercetin",
  "SLU-PP-332": "SLU-PP-332 ERR agonist",
  "5-amino-1MQ": "5-amino-1MQ NNMT inhibitor",
  "Magnésio": "magnesium",
  "Zinco": "zinc",
  "Selênio": "selenium",
  "Ferro": "iron",
  "Tiamina (vitamina B1)": "thiamine",
  "Riboflavina (vitamina B2)": "riboflavin",
  "Biotina (vitamina B7)": "biotin",
  "Exenatida": "exenatide",
  "Lixisenatida": "lixisenatide",
  "Dulaglutida": "dulaglutide",
  "Maridebart cafraglutida (MariTide)": "maridebart cafraglutide",
  "Petrelintida": "petrelintide",
  "Eloralintida": "eloralintide",
  "Orforglipron": "orforglipron",
  "Lanreotida": "lanreotide",
  "Pasireotida": "pasireotide",
  "Vasopressina": "vasopressin",
  "Terlipressina": "terlipressin",
  "Degarelix": "degarelix",
  "Cetrorrelix": "cetrorelix",
  "Triptorrelina": "triptorelin",
  "Goserelina": "goserelin",
  "Bivalirudina": "bivalirudin",
  "Ziconotida": "ziconotide",
  "Linaclotida": "linaclotide",
  "Icatibanto": "icatibant",
  "Enfuvirtida": "enfuvirtide",
  "Difelikefalina": "difelikefalin",
  "Cerebrolisina": "cerebrolysin",
  "Timalina": "thymalin",
  "Timopentina": "thymopentin"
};
const termoEn = nome => TERMO_EN[nome] || nome.replace(/\s*\(.*\)/, "");
const TTL_LIVE = 24 * 60 * 60 * 1000;

async function getJson(url) {
  const r = await fetch(url);
  if (!r.ok) throw new Error(r.status);
  return r.json();
}

async function buscarLive(nome) {
  const t = termoEn(nome);
  const e = encodeURIComponent(t);
  const ct = (extra = "") => getJson(`https://clinicaltrials.gov/api/v2/studies?query.intr=${e}&pageSize=1&countTotal=true${extra}`);
  const pm = (extra = "") => getJson(`https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?db=pubmed&retmode=json&retmax=0&term=${encodeURIComponent(t + "[Title/Abstract]")}${extra}`);
  const fda = fetch(`https://api.fda.gov/drug/drugsfda.json?search=openfda.generic_name:%22${e}%22&limit=1`)
    .then(r => r.status === 404 ? { meta: { results: { total: 0 } } } : r.ok ? r.json() : null).catch(() => null);

  const [total, ph3, ph2, ph1, recrut, ultimo, pmTotal, pmAno, fdaRes] = await Promise.all([
    ct(), ct("&filter.advanced=AREA%5BPhase%5DPHASE3"), ct("&filter.advanced=AREA%5BPhase%5DPHASE2"),
    ct("&filter.advanced=AREA%5BPhase%5DPHASE1"), ct("&filter.overallStatus=RECRUITING"),
    ct("&sort=LastUpdatePostDate%3Adesc&fields=LastUpdatePostDate"), pm(), pm("&datetype=pdat&reldate=365"), fda
  ].map(p => p.catch(() => null)));

  return {
    quando: Date.now(),
    ensaios: total?.totalCount ?? null, fase3: ph3?.totalCount ?? null, fase2: ph2?.totalCount ?? null,
    fase1: ph1?.totalCount ?? null, recrutando: recrut?.totalCount ?? null,
    ultimaAtualizacao: ultimo?.studies?.[0]?.protocolSection?.statusModule?.lastUpdatePostDateStruct?.date ?? null,
    artigos: Number(pmTotal?.esearchresult?.count ?? NaN), artigosAno: Number(pmAno?.esearchresult?.count ?? NaN),
    fdaRegistros: fdaRes?.meta?.results?.total ?? 0, fdaOk: fdaRes !== null
  };
}

let _snapshot, _snapshotSync = null;
async function snapshot() {
  if (_snapshot === undefined) {
    try { _snapshot = await getJson("live-data.json"); } catch { _snapshot = null; }
    _snapshotSync = _snapshot;
  }
  return _snapshot;
}
const TTL_SNAPSHOT = 14 * 24 * 60 * 60 * 1000;

async function obterLive(nome) {
  const chave = "live:" + nome;
  try {
    const c = JSON.parse(localStorage.getItem(chave));
    if (c && Date.now() - c.quando < TTL_LIVE) return c;
  } catch {}
  // Prioriza o arquivo gerado pelo script agendado (evita limites de requisição no navegador)
  const snap = (await snapshot())?.itens?.[slug(nome)];
  if (snap && Date.now() - snap.quando < TTL_SNAPSHOT) return snap;
  const dados = await buscarLive(nome);
  if (dados.ensaios !== null && !isNaN(dados.artigos) && !isNaN(dados.artigosAno)) localStorage.setItem(chave, JSON.stringify(dados));
  return dados;
}
const num = n => (n === null || Number.isNaN(n)) ? "—" : n.toLocaleString(LOCALE);

function htmlLive(p, d) {
  let aviso = "";
  if (d.fdaRegistros > 0 && p.fase !== "Aprovado") {
    aviso = `<p class="alerta">🔔 Há registro na FDA (openFDA) para este princípio ativo, mas o catálogo o marca como "${esc(p.fase)}". Revise o status.</p>`;
  } else if (d.fase3 > 0 && ["Fase 2", "Fase 1", "Pré-clínico (animais)", "In vitro"].includes(p.fase)) {
    aviso = `<p class="alerta">🔔 Há ${num(d.fase3)} ensaio(s) de fase 3 registrado(s), mais avançado que "${esc(p.fase)}". Revise a fase.</p>`;
  }
  return `<div class="live-box">
    <b>📡 Dados ao vivo</b> <small>(consultado em ${new Date(d.quando).toLocaleString(LOCALE)})</small>
    <ul>
      <li>ClinicalTrials.gov: ${num(d.ensaios)} ensaios (fase 1: ${num(d.fase1)}, fase 2: ${num(d.fase2)}, fase 3: ${num(d.fase3)}); ${num(d.recrutando)} recrutando; última atualização: ${esc(d.ultimaAtualizacao || "—")}</li>
      <li>PubMed: ${num(d.artigos)} artigos (${num(d.artigosAno)} nos últimos 12 meses)</li>
      <li>FDA: ${d.fdaOk ? (d.fdaRegistros > 0 ? `${num(d.fdaRegistros)} registro(s) de medicamento encontrados` : "nenhum medicamento registrado encontrado") : "indisponível"}</li>
    </ul>${aviso}
    <small>Contagens por busca textual no termo "${esc(termoEn(p.nome))}"; podem incluir estudos que apenas citam a substância.</small>
  </div>`;
}

async function carregarLive(el) {
  const box = el.matches(".live") ? el : el.querySelector(".live");
  if (!box || box.dataset.ok) return;
  const p = PEPTIDES.find(x => x.nome === box.dataset.nome);
  box.dataset.ok = "1";
  try {
    box.innerHTML = htmlLive(p, await obterLive(p.nome));
  } catch {
    delete box.dataset.ok;
    box.innerHTML = "<small>Não foi possível consultar os dados ao vivo agora (offline ou limite de requisições).</small>";
  }
}

















/* Tradução automática (opcional): carrega o widget do Google só se o usuário escolher "Outros idiomas".
   Avisos de segurança e a calculadora ficam de fora (translate="no") para não alterar números e alertas. */
function marcarNaoTraduzir() {
  document.querySelectorAll(".aviso, .aviso-det, .erro-calc, .calc-layout, .alertas-box, .aviso-idioma, #seringa-svg").forEach(e => {
    if (e.getAttribute("translate") !== "no") { e.setAttribute("translate", "no"); e.classList.add("notranslate"); }
  });
}
function iniciarTraducaoAutomatica(topo) {
  if (!topo) return;
  const caixa = document.createElement("div");
  caixa.className = "auto-trad nao-imprimir";
  caixa.innerHTML = `<p><small>🌐 Tradução automática do Google, sem revisão humana: o texto da página é enviado ao Google. Em saúde, confira termos e avisos no original em português. Avisos de segurança e a calculadora não são traduzidos.</small></p><div id="google_translate_element"></div>`;
  topo.appendChild(caixa);
  marcarNaoTraduzir();
  new MutationObserver(() => marcarNaoTraduzir()).observe(document.body, { childList: true, subtree: true });
  window.googleTranslateElementInit = () => new google.translate.TranslateElement({ pageLanguage: "pt", layout: google.translate.TranslateElement.InlineLayout.SIMPLE, autoDisplay: false }, "google_translate_element");
  const s = document.createElement("script");
  s.src = "https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit";
  s.async = true;
  document.head.appendChild(s);
}

// SEO dinamico: atualiza canonical, Open Graph e JSON-LD (substitui os existentes, sem duplicar).
function seoAtualizar(caminho, ld) {
  const raiz = (document.querySelector('meta[name="site-root"]')?.content || location.origin).replace(/\/$/, "");
  const url = raiz + "/" + caminho;
  let c = document.querySelector('link[rel="canonical"]');
  if (!c) { c = document.createElement("link"); c.rel = "canonical"; document.head.appendChild(c); }
  c.href = url;
  const desc = document.querySelector('meta[name="description"]')?.content || "";
  const meta = (prop, v) => {
    let m = document.querySelector(`meta[property="${prop}"]`);
    if (!m) { m = document.createElement("meta"); m.setAttribute("property", prop); document.head.appendChild(m); }
    m.content = v;
  };
  meta("og:title", document.title); meta("og:description", desc); meta("og:url", url);
  document.querySelectorAll('script[data-seo="1"]').forEach(s => s.remove());
  (ld || []).forEach(obj => {
    const s = document.createElement("script");
    s.type = "application/ld+json"; s.dataset.seo = "1";
    s.textContent = JSON.stringify({ "@context": "https://schema.org", ...obj });
    document.head.appendChild(s);
  });
}
function seoNaoIndexar() {
  const m = document.createElement("meta"); m.name = "robots"; m.content = "noindex"; document.head.appendChild(m);
}

/* PWA: instalação nativa quando disponível e instruções para os demais navegadores. */
let _instalarApp = null;
function ligarInstalacaoPwa() {
  const botao = document.getElementById("instalar-app");
  const dialogo = document.getElementById("pwa-ajuda");
  if (!botao || !dialogo || botao.dataset.pwaLigado) return;
  botao.dataset.pwaLigado = "1";
  if (window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone) {
    botao.textContent = tr("✅ Instalado · acessar offline");
  }
  botao.addEventListener("click", async () => {
    if (_instalarApp) {
      const evento = _instalarApp;
      _instalarApp = null;
      try {
        await evento.prompt();
        const escolha = await evento.userChoice;
        if (escolha.outcome === "accepted") botao.textContent = tr("✅ App instalado");
      } catch (erro) {
        console.error("Não foi possível iniciar a instalação do guia.", erro);
        dialogo.showModal();
      }
      return;
    }
    dialogo.showModal();
  });
  dialogo.querySelectorAll(".pwa-fechar").forEach(b => b.addEventListener("click", () => dialogo.close()));
  dialogo.addEventListener("click", e => { if (e.target === dialogo) dialogo.close(); });
}
window.addEventListener("beforeinstallprompt", e => {
  e.preventDefault();
  _instalarApp = e;
  const botao = document.getElementById("instalar-app");
  if (botao) botao.textContent = tr("📲 Instalar o app");
});
window.addEventListener("appinstalled", () => {
  _instalarApp = null;
  const botao = document.getElementById("instalar-app");
  if (botao) botao.textContent = tr("✅ Instalado · acessar offline");
});
Object.assign(TERMO_EN, {"VIP (peptídeo intestinal vasoativo) / aviptadil": "vasoactive intestinal peptide", "Timogeno (Thymogen)": "thymogen (alpha-glutamyl-tryptophan)", "Cortexina (Cortexin)": "cortexin", "Cortagen": "cortagen (synthetic tetrapeptide)", "Vilon (Lys-Glu)": "vilon (lysyl-glutamate)", "Cartalax": "cartalax", "Livagen": "livagen", "Chonluten": "chonluten", "Ovagen": "ovagen", "Vesugen": "vesugen", "Prostamax": "prostamax", "Crystagen": "crystagen", "Bronchogen": "bronchogen", "Pancragen": "pancragen", "Testagen": "testagen", "Cardiogen": "cardiogen", "DSIP (peptídeo indutor do sono delta)": "delta sleep-inducing peptide", "P21": "P21 peptide", "Noopept (GVS-111, dipeptídeo sintético)": "omberacetam (Noopept; GVS-111)", "Trofinetida (Trofinetide, análogo do GPE)": "trofinetide", "Goralatida (Ac-SDKP)": "N-acetyl-seryl-aspartyl-lysyl-proline (Ac-SDKP)", "Ciclo-His-Pro (cHP)": "cyclo(His-Pro)", "Substância P": "substance P", "Neuropeptídeo Y": "neuropeptide Y", "Orexina-A (hipocretina-1)": "orexin-A (hypocretin-1)", "Galanina": "galanin", "Encefalinas (Met/Leu-encefalina)": "methionine-enkephalin and leucine-enkephalin", "Dinorfina A": "dynorphin A", "Beta-endorfina": "beta-endorphin", "Nociceptina": "nociceptin (orphanin FQ)", "Apamina": "apamin", "Cecropina": "cecropin", "Magainina / Pexiganan": "magainin; pexiganan", "Lactoferricina": "lactoferricin", "Histatina-5": "histatin-5", "Palmitoil tripeptídeo-1 (Pal-GHK)": "palmitoyl tripeptide-1", "Palmitoil tetrapeptídeo-7": "palmitoyl tetrapeptide-7", "Snap-8 (acetil octapeptídeo-3)": "acetyl octapeptide-3", "Acetil tetrapeptídeo-3 (Redensyl)": "acetyl tetrapeptide-3", "Leuphasyl (pentapeptídeo-18)": "pentapeptide-18", "Syn-Ake (dipeptídeo diaminobutiroil benzilamida diacetato)": "dipeptide diaminobutyroyl benzylamide diacetate", "Palmitoil tripeptídeo-5": "palmitoyl tripeptide-5", "Macimorelina": "macimorelin", "Anamorelina": "anamorelin", "Capromorelina": "capromorelin", "Alexamorelina": "alexamorelin", "Ibutamoren (MK-677; não peptideo, secretagogo oral)": "ibutamoren (MK-677)", "Fragmento 176-191 do hormônio do crescimento (HGH Frag)": "human growth hormone fragment 176-191", "IGF-1 DES(1-3)": "des(1-3) IGF-I", "Mecasermina (IGF-1 recombinante)": "mecasermin (recombinant human IGF-1)", "Estrona (E1)": "estrone", "Estriol (E3)": "estriol", "Pregnenolona": "pregnenolone", "Androstenediona": "androstenedione", "Di-hidrotestosterona (DHT)": "dihydrotestosterone", "Nandrolona": "nandrolone", "Oxandrolona": "oxandrolone", "Estanozolol": "stanozolol", "Trembolona": "trenbolone", "Cortisona": "cortisone", "Prednisona": "prednisone", "Dexametasona": "dexamethasone", "Fludrocortisona": "fludrocortisone", "Aldosterona": "aldosterone", "Adrenalina (epinefrina)": "epinephrine", "Noradrenalina (norepinefrina)": "norepinephrine", "Dopamina": "dopamine", "Serotonina (5-HT)": "serotonin", "Prolactina": "prolactin", "FSH (hormônio folículo-estimulante)": "follicle-stimulating hormone", "LH (hormônio luteinizante)": "luteinizing hormone", "TSH (tireotropina)": "thyrotropin alfa", "ACTH / cosintropina": "corticotropin cosyntropin", "Eritropoetina (EPO)": "erythropoietin", "Paratormônio (PTH 1-84)": "parathyroid hormone 1-84", "Cabergolina": "cabergoline", "Bromocriptina": "bromocriptine", "Anastrozol": "anastrozole", "Letrozol": "letrozole", "Tamoxifeno": "tamoxifen", "Clomifeno": "clomiphene citrate", "Enclomifeno": "enclomiphene", "Raloxifeno": "raloxifene", "Finasterida": "finasteride", "Dutasterida": "dutasteride", "Espironolactona": "spironolactone", "Calcitriol (1,25-di-hidroxivitamina D)": "calcitriol", "Tibolona": "tibolone", "Medroxiprogesterona": "medroxyprogesterone acetate", "Drospirenona": "drospirenone", "Etinilestradiol": "ethinylestradiol", "Relaxina (serelaxin)": "relaxin serelaxin", "Metformina": "metformin", "Sulfato de DHEA (DHEA-S)": "dehydroepiandrosterone sulfate", "Vitamina B5 (ácido pantotênico)": "pantothenic acid", "Vitamina K1 (filoquinona)": "phylloquinone", "Vitamina D2 (ergocalciferol)": "ergocalciferol", "Colina": "choline", "Mio-inositol": "myo-inositol", "Cálcio": "calcium", "Potássio": "potassium", "Iodo": "iodine", "Cobre": "copper", "Manganês": "manganese", "Cromo": "chromium", "Boro": "boron", "Lítio (microdoses/orotato)": "lithium orotate", "L-arginina": "L-arginine", "L-citrulina": "L-citrulline", "L-glutamina": "L-glutamine", "Leucina / BCAA": "leucine / branched-chain amino acids", "L-triptofano": "L-tryptophan", "5-HTP": "5-hydroxytryptophan", "L-teanina": "L-theanine", "L-tirosina": "L-tyrosine", "Beta-alanina": "beta-alanine", "HMB (beta-hidroxi-beta-metilbutirato)": "beta-hydroxy beta-methylbutyrate", "GABA": "gamma-aminobutyric acid", "Ashwagandha (Withania somnifera)": "Withania somnifera", "Curcumina": "curcumin", "Berberina": "berberine", "Rhodiola rosea": "Rhodiola rosea", "Ginseng (Panax)": "Panax ginseng", "Maca (Lepidium meyenii)": "Lepidium meyenii", "Tribulus terrestris": "Tribulus terrestris", "Cafeína": "caffeine", "Colágeno hidrolisado": "hydrolyzed collagen", "Probióticos": "probiotics", "Apigenina": "apigenin", "Sulforafano": "sulforaphane", "EGCG (epigalocatequina galato, chá verde)": "epigallocatechin gallate", "Astaxantina": "astaxanthin", "Luteína": "lutein", "Alfa-cetoglutarato": "alpha-ketoglutarate", "Ácido hialurônico": "hyaluronic acid", "Glucosamina": "glucosamine", "Condroitina": "chondroitin sulfate", "Lactoferrina": "lactoferrin", "Rapamicina (sirolimo)": "sirolimus (rapamycin)", "Acarbose": "acarbose", "Éster de cetona (beta-hidroxibutirato)": "ketone ester (beta-hydroxybutyrate)", "Tongkat ali (Eurycoma longifolia)": "Eurycoma longifolia", "Espirulina": "Arthrospira platensis", "Piracetam": "piracetam", "Aniracetam": "aniracetam"});

Object.assign(TERMO_EN, {"Folistatina-315": "follistatin 315", "Ramatercepte (ACE-031)": "ramatercept (ACE-031)", "Adipotide": "adipotide (FTPP)", "Afamelanotida": "afamelanotide", "Melanotan I": "melanotan I (NDP-MSH)", "Carbetocina": "carbetocin", "Ganirrelix": "ganirelix", "Abarelix": "abarelix", "Nafarelina": "nafarelin", "Buserrelina": "buserelin", "Histrelina": "histrelin", "Deslorrelina": "deslorelin", "Efpeglenatida": "efpeglenatide", "Albiglutida": "albiglutide", "Pemvidutida": "pemvidutide", "Cotadutida": "cotadutide (MEDI0382)", "Efinopegdutida": "efinopegdutide (MK-6024)", "Ecnoglutida": "ecnoglutide (XW003)", "Amicretina": "amycretin", "Pegvisomanto": "pegvisomant", "Glepaglutida": "glepaglutide", "Efruxifermina": "efruxifermin", "Pegozafermina": "pegozafermin", "Plecanatida": "plecanatide", "Secretina": "secretin", "Sincalida (CCK-8)": "sincalide (cholecystokinin octapeptide)", "GIP (polipeptídeo insulinotrópico dependente de glicose)": "glucose-dependent insulinotropic polypeptide", "Oxintomodulina": "oxyntomodulin", "PYY(3-36)": "peptide YY 3-36", "Grelina": "ghrelin", "Insulina glargina": "insulin glargine", "Insulina lispro": "insulin lispro", "Insulina asparte": "insulin aspart", "Insulina degludeca": "insulin degludec", "Insulina icodeca": "insulin icodec"});

Object.assign(TERMO_EN, {"Intermedine": "intermedine", "Teprotide": "teprotide", "Endothelin": "endothelin", "Thymosin": "thymosin", "Gastrin": "gastrin", "Cyclosporine": "cyclosporine", "Oxeclosporin": "oxeclosporin", "Saralasin": "saralasin", "Angiotensin Amide": "angiotensin amide", "Bradykinin": "bradykinin", "Seglitide": "seglitide", "Glaspimod": "glaspimod", "Netazepide": "netazepide", "Eptifibatide": "eptifibatide", "Ovemotide": "ovemotide", "Disomotide": "disomotide", "Prazarelix": "prazarelix", "Acyline": "acyline", "Demoxytocin": "demoxytocin", "Peptide T": "peptide t", "Abt-510": "abt-510", "Atosiban": "atosiban", "Gramicidin S": "gramicidin s", "Eledoisin": "eledoisin", "Kisspeptin-10": "kisspeptin-10", "Glucagon-like Peptide Ii": "glucagon-like peptide ii", "Act-1 Peptide": "act-1 peptide", "Calcitonin Eel": "calcitonin eel", "Aldafermin": "aldafermin", "Canoctakin": "canoctakin", "Anpocogin": "anpocogin", "Baloramotide": "baloramotide", "Lonapegsomatropin": "lonapegsomatropin", "Pancreatic Polypeptide": "pancreatic polypeptide", "Fe 203799": "fe 203799", "Sulfomyxin": "sulfomyxin", "Timbetasin": "timbetasin", "Amlisimod": "amlisimod", "C-peptide": "c-peptide", "Tzp-102": "tzp-102", "Navepegritide": "navepegritide", "Eflepedocokin": "eflepedocokin", "Sulfomyxin Free Acid": "sulfomyxin free acid", "Hepalatide": "hepalatide", "Lerodalcibep": "lerodalcibep", "Pegsebrenatide": "pegsebrenatide", "Balixafortide": "balixafortide", "Ea-230": "ea-230", "Ensovibep": "ensovibep", "Motixafortide": "motixafortide", "Selcopintide": "selcopintide", "Lefleuganan": "lefleuganan", "Gersizangitide": "gersizangitide", "Palsucibep Pegol": "palsucibep pegol", "Peceleganan": "peceleganan", "Pezadeftide": "pezadeftide", "Rilunermin": "rilunermin", "Rimtoregtide": "rimtoregtide", "Sudocetaxel Zendusortide": "sudocetaxel zendusortide", "Utreglutide": "utreglutide", "Zendusortide": "zendusortide", "Pegloprastide": "pegloprastide", "Eneboparatide": "eneboparatide", "Elarekibep": "elarekibep", "Ensereptide": "ensereptide", "Palopegteriparatide": "palopegteriparatide", "Pexipepimut-s": "pexipepimut-s", "Polymyxin B": "polymyxin b", "Voclosporin": "voclosporin", "Fequesetide": "fequesetide", "Milpocitide": "milpocitide", "Pimrocktakin (bovine)": "pimrocktakin (bovine)", "Ederimotide": "ederimotide", "Etimumotide": "etimumotide", "Imsamotide": "imsamotide", "Inpegsomatropin": "inpegsomatropin", "Marlumotide": "marlumotide", "Pegtarazimod": "pegtarazimod", "Quazomotide": "quazomotide", "Vorumotide": "vorumotide", "Efpegerglucagon": "efpegerglucagon", "Enavermotide": "enavermotide", "Ganipatide": "ganipatide", "Irucalantide": "irucalantide", "Limaresiquimod": "limaresiquimod", "Lucicebtide": "lucicebtide", "Omramotide": "omramotide", "Oximbomotide": "oximbomotide", "Pegmispotide": "pegmispotide", "Pobrolitide": "pobrolitide", "Sucantomotide": "sucantomotide", "Ucasareotide Dasaroxetan": "ucasareotide dasaroxetan", "Vicatertide": "vicatertide", "Visepegenatide": "visepegenatide", "Zalfermin": "zalfermin", "Zaloganan": "zaloganan", "Zeleciment Basivarsen": "zeleciment basivarsen", "Zelenectide": "zelenectide", "Zelenectide Pevedotin": "zelenectide pevedotin", "Cn-105": "cn-105", "Invopressin": "invopressin", "Dapiglutide": "dapiglutide", "Froniglutide": "froniglutide", "Lsalt Peptide": "lsalt peptide", "Certepetide": "certepetide", "Nisotirostide": "nisotirostide", "Enlicitide Chloride": "enlicitide chloride", "Lead (212pb) Bamzireotide Navoxetan": "lead (212pb) bamzireotide navoxetan", "Lead (212pb) Lapemelanotide Zapixetan": "lead (212pb) lapemelanotide zapixetan", "Azirkitug": "azirkitug", "Bofanglutide": "bofanglutide", "Brivekimig": "brivekimig", "Lorutengitide": "lorutengitide", "Mifomelatide": "mifomelatide", "Olatorepatide": "olatorepatide", "Paluratide": "paluratide", "Sonefpeglutide": "sonefpeglutide", "Vezocolmitide": "vezocolmitide", "Zifogaptide": "zifogaptide", "Amezosvatein": "amezosvatein", "Canvuparatide": "canvuparatide", "Efmedaglutide": "efmedaglutide", "Glemtimbetasin": "glemtimbetasin", "Vensemaglutide": "vensemaglutide", "Xelafaslatide": "xelafaslatide", "Noraramtide": "noraramtide", "Etimupepimut": "etimupepimut", "Imsapepimut": "imsapepimut", "Actinium Ac 225 Dotatate": "actinium ac 225 dotatate", "Enlicitide Decanoate": "enlicitide decanoate", "Spx-101": "spx-101", "Adrenomedullin": "adrenomedullin", "Chf-6467": "chf-6467", "Irl-201104": "irl-201104", "Gelsolin": "gelsolin", "Lead Bamzireotide Navoxetan": "lead bamzireotide navoxetan", "Lead Lapemelanotide Zapixetan": "lead lapemelanotide zapixetan", "Actinium Dotatate": "actinium dotatate", "Enlicitide": "enlicitide", "Protirelin": "protirelin", "Angiotensin Ii": "angiotensin ii", "Cilengitide": "cilengitide", "Efegatran": "efegatran", "Rotigaptide": "rotigaptide", "Nerinetide": "nerinetide", "Telavancin": "telavancin", "Tt-232": "tt-232", "Tyrothricin": "tyrothricin", "Ang1005": "ang1005", "Valspodar": "valspodar", "Bacitracin": "bacitracin", "Lypressin": "lypressin", "Ceruletide": "ceruletide", "Corticorelin Triflutate": "corticorelin triflutate", "Nesiritide": "nesiritide", "Seractide": "seractide", "Ecallantide": "ecallantide", "Bleomycin A6": "bleomycin a6", "Glp-1": "glp-1", "Scy 635": "scy 635", "Omiganan": "omiganan", "Alisporivir": "alisporivir", "Nim811": "nim811", "Selepressin": "selepressin", "Ornipressin": "ornipressin", "Somatostatin": "somatostatin", "Nepadutant": "nepadutant", "Livoletide": "livoletide", "Cosyntropin": "cosyntropin", "Sinapultide": "sinapultide", "Tosactide": "tosactide", "Ularitide": "ularitide", "Amphomycin": "amphomycin", "Tricosactide": "tricosactide", "Norleusactide": "norleusactide", "Teverelix": "teverelix", "Deltibant": "deltibant", "Semparatide": "semparatide", "Avorelin": "avorelin", "Codactide": "codactide", "Aspartocin": "aspartocin", "Carperitide": "carperitide", "Cemadotin": "cemadotin", "Elcatonin": "elcatonin", "Thymocartin": "thymocartin", "Azetirelin": "azetirelin", "Posatirelin": "posatirelin", "Thymotrinan": "thymotrinan", "Triletide": "triletide", "Davalintide": "davalintide", "Dirucotide": "dirucotide", "Efepristin": "efepristin", "Iseganan": "iseganan", "Labradimil": "labradimil", "Ambomycin": "ambomycin", "Thymoctonan": "thymoctonan", "Casokefamide": "casokefamide", "Ebiratide": "ebiratide", "Desglugastrin": "desglugastrin", "Detirelix": "detirelix", "Nonathymulin": "nonathymulin", "Taltirelin": "taltirelin", "Corticorelin": "corticorelin", "Rusalatide": "rusalatide", "Tasidotin": "tasidotin", "Geclosporin": "geclosporin", "Edratide": "edratide", "Icrocaptide": "icrocaptide", "Nemifitide": "nemifitide", "Dulanermin": "dulanermin", "Denenicokin": "denenicokin", "Taspoglutide": "taspoglutide", "Somatosalm": "somatosalm", "Somenopor": "somenopor", "Peforelin": "peforelin", "Sulglicotide": "sulglicotide", "Somagrebove": "somagrebove", "Sometribove": "sometribove", "Plusonermin": "plusonermin", "Ersofermin": "ersofermin", "Elpamotide": "elpamotide", "Lenomorelin": "lenomorelin", "Tertomotide": "tertomotide", "Ozarelix": "ozarelix", "Nepidermin": "nepidermin", "Elsiglutide": "elsiglutide", "Lancovutide": "lancovutide", "Obinepitide": "obinepitide", "Tridecactide": "tridecactide", "Disitertide": "disitertide", "Dumorelin": "dumorelin", "Leconotide": "leconotide", "Mobenakin": "mobenakin", "Delmitide": "delmitide", "Tifuvirtide": "tifuvirtide", "Somavubove": "somavubove", "Sometripor": "sometripor", "Somidobove": "somidobove", "Cenderitide": "cenderitide", "Somalapor": "somalapor", "Somatorelin": "somatorelin", "Sonermin": "sonermin", "Tiplimotide": "tiplimotide", "Anaritide": "anaritide", "Argipressin": "argipressin", "Atexakin": "atexakin", "Amlintide": "amlintide", "Betiatide": "betiatide", "Doreptide": "doreptide", "Gonadotropin, Serum": "gonadotropin, serum", "Murodermin": "murodermin", "Pareptide": "pareptide", "Enviomycin": "enviomycin", "Procalcitonin": "procalcitonin", "Lagatide": "lagatide", "Cargutocin": "cargutocin", "Barusiban": "barusiban", "Nacartocin": "nacartocin", "Lusupultide": "lusupultide", "Capreomycin": "capreomycin", "Arfalasin": "arfalasin", "Metkephamid": "metkephamid", "Pentigetide": "pentigetide", "Montirelin": "montirelin", "Atilmotin": "atilmotin", "Giractide": "giractide", "Argiprestocin": "argiprestocin", "Lutrelin": "lutrelin", "Surotomycin": "surotomycin", "Tecemotide": "tecemotide", "Tigapotide": "tigapotide", "Viomycin": "viomycin", "Benpenolisin": "benpenolisin", "Felypressin": "felypressin", "Sovatelitide": "sovatelitide", "Fertirelin": "fertirelin", "Dalbavancin": "dalbavancin", "Vapreotide": "vapreotide", "Rapastinel": "rapastinel", "Ctce-9908": "ctce-9908", "Zoptarelin Doxorubicin": "zoptarelin doxorubicin", "Tavilermide": "tavilermide", "Fexapotide": "fexapotide", "Modimelanotide": "modimelanotide", "Dolcanatide": "dolcanatide", "Etelcalcetide": "etelcalcetide", "Dusquetide": "dusquetide", "Recanaclotide": "recanaclotide", "Ruclosporin": "ruclosporin", "Fexapotide Triflutate": "fexapotide triflutate", "Murepavadin": "murepavadin", "Pl-8177": "pl-8177", "Forigerimod": "forigerimod", "Alsactide": "alsactide", "Iturelix": "iturelix", "Frakefamide": "frakefamide", "Fluciclatide F 18": "fluciclatide f 18", "Basifungin": "basifungin", "Maraciclatide": "maraciclatide", "Colimecycline": "colimecycline", "Ramorelix": "ramorelix", "Apimostinel": "apimostinel", "Veldoreotide": "veldoreotide", "Reltecimod": "reltecimod", "Pegilodecakin": "pegilodecakin", "Fluciclatide": "fluciclatide", "Ociltide": "ociltide", "Albuvirtide": "albuvirtide", "Amy-101": "amy-101", "Foxy-5": "foxy-5", "Bezisterim": "bezisterim", "Nerofe": "nerofe", "Pl-3994": "pl-3994", "Pz-128": "pz-128", "Brimapitide, C-terminal Acid": "brimapitide, c-terminal acid", "Cbp-501": "cbp-501", "Ser-100": "ser-100", "Trv-120027": "trv-120027", "Atn-161": "atn-161", "Zetomipzomib": "zetomipzomib", "Risuteganib": "risuteganib", "Satoreotide Tetraxetan": "satoreotide tetraxetan", "Satoreotide Trizoxetan": "satoreotide trizoxetan", "Troriluzole": "troriluzole", "Mibenratide": "mibenratide", "Ruxotemitide": "ruxotemitide", "Brimapitide": "brimapitide", "Nogapendekin": "nogapendekin", "Anfibatide": "anfibatide", "Bulevirtide": "bulevirtide", "Dalazatide": "dalazatide", "Onvitrelin Ucalontide": "onvitrelin ucalontide", "Nangibotide": "nangibotide", "Somatrogon": "somatrogon", "Efmitermant": "efmitermant", "Solnatide": "solnatide", "Taldefgrobep": "taldefgrobep", "Aclerastide": "aclerastide", "Avexitide": "avexitide"});

Object.assign(TERMO_EN, {"Penetratin": "penetratin", "Gi Heptapeptide": "gi heptapeptide", "Peptide B27pd": "peptide b27pd", "Anx-042": "anx-042", "Glucagon-like Peptide 1": "glucagon-like peptide 1", "Rusfertide": "rusfertide", "Nendratareotide Uzatansine": "nendratareotide uzatansine", "Zelpultide": "zelpultide", "Bms-686117": "bms-686117", "Pegloxenatide": "pegloxenatide", "Sulanemadlin": "sulanemadlin", "Cobitolimod": "cobitolimod", "Peltopepimut-s": "peltopepimut-s", "Zetomipzomib Maleate": "zetomipzomib maleate", "Bt-5528": "bt-5528", "Tindupepimut": "tindupepimut", "Colulintide": "colulintide", "Fulipiftide": "fulipiftide", "Macupatide": "macupatide", "Alm-201": "alm-201", "Bt-1718": "bt-1718", "Imcy-0098": "imcy-0098", "Lti-03": "lti-03", "Silk Fibroin": "silk fibroin", "Tifalibep": "tifalibep", "G-3215": "g-3215", "Rugecitide": "rugecitide", "Medi-7219": "medi-7219", "Bombesin": "bombesin", "[18f]-fba-a20fmdv2": "[18f]-fba-a20fmdv2", "Spr-741": "spr-741", "Friulimicin B": "friulimicin b", "Fba-a20fmdv2": "fba-a20fmdv2", "Gdc-0152": "gdc-0152", "Tigapotide Triflutate": "tigapotide triflutate", "Mmi-0100": "mmi-0100", "Adh-1": "adh-1", "Px-478": "px-478", "Sor-c13": "sor-c13", "Nbi-6024": "nbi-6024", "Go-203-2c": "go-203-2c"});

Object.assign(TERMO_EN, {"Alfa-Caroteno": "alpha-carotene", "Ômega 9": "omega-9", "Ácido oleico": "oleic acid", "Ácido málico": "malic acid", "Ácido láctico": "lactic acid", "Carotenoide": "carotenoids", "Benfotiamina": "benfotiamine", "Crocetina": "crocetin", "Flavonoide": "flavonoids", "Molibdênio": "molybdenum", "Diosmina": "diosmin", "Inositol": "inositol", "Ácido lipoico": "lipoic acid", "Ácido linoleico": "linoleic acid", "Cisteína": "cysteine", "Hesperidina": "hesperidin", "Crisina": "chrysin", "Flavan-3-ol": "flavanols"});
