/* Conexões desta ficha com o resto do site. */
function marcosDoItem(p) {
  const auto = marcosOficiais(p.nome).sort((a, b) => a.data.localeCompare(b.data)).map(m => [dataMarco(m.data), `${m.txt} (${m.fonte}${dataAtualizacao(m.atualizado)})`]);
  return (TIMELINE[p.nome] || []).concat(auto);
}
function htmlDetalhes(p) {
  const d = DETALHES[slug(p.nome)];
  if (!d) return "";
  return `<section class="boas detalhes-ricos"><h2>${tr("Entenda melhor esta substância")}</h2>
    ${d.aviso ? `<p class="aviso-det"><b>⚠️ Atenção:</b> ${esc(d.aviso)}</p>` : ""}
    <h3>O que é</h3><p>${comGlossario(d.oque)}</p>
    <h3>Como age no corpo, passo a passo</h3><ol>${d.age.map(a => `<li>${comGlossario(a)}</li>`).join("")}</ol>
    <h3>Histórico</h3><p>${comGlossario(d.hist)}</p>
    <h3>O que os estudos mostraram</h3><p>${comGlossario(d.estudos)}</p>
    <h3>Quem deve ter cuidado</h3><p>${comGlossario(d.evitar)}</p>
    <p><small>Texto educativo resumido; confirme na bula e nas fontes oficiais. Não é orientação médica.</small></p></section>`;
}

function htmlAssociacao(p) {
  const ativos = p.combo.map(s => porSlug(s)).filter(Boolean);
  const cx = a => /caixa preta|boxed warning/i.test(a.riscos || "");
  const cartao = a => `<div class="assoc-ativo"><h3><a href="${urlPeptideo(a.nome)}">${esc(a.nome)}</a></h3>
    <p><span class="tag">${esc(a.categoria)}</span></p>
    <p><b>${tr("O que faz")}:</b> ${esc((a.oQueFaz || "").slice(0, 220))}</p>
    <p><b>${tr("Mecanismo")}:</b> ${esc((a.mecanismo || "").slice(0, 260))}</p>
    <p><b>${tr("Cuidados")}:</b> ${esc((a.riscos || "").slice(0, 260))}</p>
    ${cx(a) ? `<p class="assoc-alerta">⚠️ ${tr("Este ativo tem alerta de caixa preta; leia a bula.")}</p>` : ""}
    <p><a class="btn" href="${urlPeptideo(a.nome)}">${tr("Ver ficha completa")} →</a></p></div>`;
  const nomes = ativos.map(a => a.nome).concat(p.outrosAtivos || []);
  const q = encodeURIComponent(p.nome);
  return `<section class="boas assoc-box" id="associacao"><h2>💊+💊 ${tr("Associação de")} ${nomes.length} ${tr("princípios ativos")}</h2>
    <p class="assoc-formula">${nomes.map((n, i) => `${i ? '<span class="assoc-mais">+</span>' : ""}<b>${esc(n)}</b>`).join("")}</p>
    <p>${tr("Este nome comercial reúne mais de um ativo no mesmo produto. Os efeitos, os efeitos colaterais e os riscos de cada ativo somam-se, e as interações entre eles também importam.")}</p>
    <div class="assoc-grade">${ativos.map(cartao).join("")}</div>
    ${p.outrosAtivos && p.outrosAtivos.length ? `<p><small>${tr("Sem ficha neste guia")}: ${esc(p.outrosAtivos.join(", "))}.</small></p>` : ""}
    <p class="acoes"><a class="btn" href="interacoes.html">${tr("Checar interações")}</a> <a class="btn" href="https://dailymed.nlm.nih.gov/dailymed/search.cfm?labeltype=all&query=${q}" target="_blank" rel="noopener">DailyMed</a> <a class="btn" href="https://consultas.anvisa.gov.br/#/medicamentos/" target="_blank" rel="noopener">Anvisa</a></p>
    <p><small>${tr("Composição segundo Anvisa e FDA; varia por país e apresentação. Confira a bula.")}</small></p></section>`;
}
function htmlMarcas(p) {
  if (p.combo) return htmlAssociacao(p);
  const marcas = marcasDe(p);
  const assoc = (p._assoc || []).length
    ? `<p class="assoc-em"><b>💊+💊 ${tr("Aparece em associações")}:</b> ${p._assoc.map(n => `<a class="tag tag-assoc" href="${urlPeptideo(n)}">${esc(n)}</a>`).join(" ")}</p><p><small>${tr("Nesses produtos o ativo vem junto com outros; os riscos somam-se.")}</small></p>` : "";
  return `<section class="boas marcas-ficha" id="nomes-comerciais"><h2>${tr("Nomes comerciais")}</h2>${marcas.length
    ? `<p><b>${esc(p.nome)}</b> é o princípio ativo de: ${marcas.map(m => `<span class="tag">${esc(m)}</span>`).join(" ")}</p><p><small>${tr("Nomes do Brasil, EUA, Europa e outros países, segundo ChEMBL e dados abertos da Anvisa. Variam por país e fabricante; confira o produto na bula.")}</small></p>`
    : `<p><small>${tr("Nenhum nome comercial registrado nas fontes consultadas (ChEMBL e Anvisa).")}</small></p>`}${assoc}</section>`;
}
function htmlOficiais(p) {
  const q = encodeURIComponent(termoEn(p.nome).replace(/\s*\(.*\)/, ""));
  const a = (u, t) => `<li><a href="${u}" target="_blank" rel="noopener">${t}</a></li>`;
  return `<section class="boas oficiais"><h2>Conferir nas fontes oficiais</h2>
    <p>Este texto é educativo e resumido. O quadro de situação acima é atualizado semanalmente a partir de bases públicas, mas a cobertura e o nível de detalhe variam por órgão. Confirme o produto e a indicação diretamente nas fontes:</p>
    <ul class="explore">${a(`https://www.accessdata.fda.gov/scripts/cder/daf/index.cfm?event=BasicSearch.process&searchTerm=${q}`, "FDA (EUA): Drugs@FDA")}${a(`https://dailymed.nlm.nih.gov/dailymed/search.cfm?labeltype=all&query=${q}`, "DailyMed: bulas dos EUA")}${a(`https://www.ema.europa.eu/en/search?search_api_fulltext=${q}`, "EMA (Europa)")}${a("https://consultas.anvisa.gov.br/#/medicamentos/", "Anvisa (Brasil): consulta de medicamentos")}${a(`https://health-products.canada.ca/api/drug/activeingredient/?ingredientname=${q}&lang=en&type=json`, "Health Canada: Drug Product Database")}${a(`https://clinicaltrials.gov/search?term=${q}`, "ClinicalTrials.gov: estudos em andamento")}${a(`https://pubchem.ncbi.nlm.nih.gov/#query=${q}`, "PubChem: estrutura e dados químicos")}</ul>
    <p><small>As bases consultadas não representam todos os países nem todas as categorias de produtos. Ausência de resultado não comprova ausência de aprovação.</small></p></section>`;
}
function htmlRevisaoHumana(p) {
  const s = slug(p.nome), rev = typeof REVISOES !== "undefined" && REVISOES[s];
  const linha = rev
    ? `<small class="revisao">✔️ Revisado por ${esc(rev.por)} em ${dataBR(rev.data)}</small>`
    : "";
  const auto = typeof AUTO_DADOS !== "undefined" && AUTO_DADOS.includes(s)
    ? `<section class="boas aviso-det"><h2>Dados do ChEMBL</h2><p>Fase, mecanismo e indicações desta ficha vêm do ChEMBL, base de dados pública do EMBL-EBI. Confira a bula e os órgãos reguladores antes de qualquer decisão.</p></section>` : "";
  const dsld = typeof DSLD_DADOS !== "undefined" && DSLD_DADOS.includes(s)
    ? `<section class="boas aviso-det"><h2>${tr("Ficha automática: DSLD (NIH) e Wikipédia")}</h2><p>${tr("Este ativo foi identificado no DSLD, base pública do NIH sobre rótulos de suplementos. O texto de apresentação é adaptado da Wikipédia (licença CC BY-SA 4.0; link nas fontes) e a fase vem do ClinicalTrials.gov. Não há avaliação editorial de benefícios e riscos: confira as fontes e converse com um profissional de saúde.")}</p></section>` : "";
  return `${linha ? `<p>${linha}</p>` : ""}${auto}${dsld}`;
}
/* Novidades das coletas automáticas em linguagem direta: data, tipo e uma frase curta. Fica depois do conteúdo principal. */
const ROTULO_SINAL = { aprovacao: "✅ Aprovação", seguranca: "⚠️ Segurança", estudos: "🧪 Estudos", conteudo: "📚 Pesquisa", fase: "🔬 Fase" };
function frasesSinal(x) {
  return notaAuto(x.texto);
}
function htmlSinais(p) {
  const pend = ((typeof REVISAO_PENDENTE !== "undefined" && REVISAO_PENDENTE[slug(p.nome)]) || []).slice().sort((a, b) => b.data.localeCompare(a.data));
  if (!pend.length) return "";
  let viuEstudos = false;
  const itens = pend.filter(x => {
    if (!/ClinicalTrials/.test(x.texto)) return true;
    if (viuEstudos) return false;
    viuEstudos = true;
    return true;
  });
  const li = x => `<li class="sinal"><span class="sinal-data">${esc(dataMarco(x.data))}</span><span class="sinal-corpo"><b>${esc(ROTULO_SINAL[x.tipo] || x.tipo)}</b><span>${esc(frasesSinal(x))}</span></span></li>`;
  return `<section class="boas aviso-det sinais"><h2>Novidades nas fontes</h2>
    <p class="sinais-sub">Avisos automáticos de bases públicas, do mais novo para o mais antigo.</p>
    <ul class="sinais-lista">${itens.slice(0, 3).map(li).join("")}</ul>
    ${itens.length > 3 ? `<details class="sinais-mais"><summary>Ver mais ${itens.length - 3} aviso(s)</summary><ul class="sinais-lista">${itens.slice(3).map(li).join("")}</ul></details>` : ""}
    <p><small>Isso é só um aviso de que algo mudou nas fontes: não prova benefício nem segurança. Confira nas fontes oficiais.</small></p></section>`;
}
/* Ícone e cor por tipo de bloco, para a ficha ser escaneável sem ler tudo. */
const BLOCOS_ESTILO = [
  [/resumo r[aá]pido/i, "⚡", "simples"],
  [/como os estudos foram conduzidos/i, "💉", "ciencia"],
  [/riscos|alertas de seguran|interações|cuidados/i, "⚠️", "risco"],
  [/benef[ií]cios/i, "✅", "beneficio"],
  [/evid[eê]ncia/i, "🔬", "ciencia"],
  [/mecanismo|age em|molecular|vias/i, "⚙️", "ciencia"],
  [/palavras simples/i, "💬", "simples"],
  [/o que faz|entenda melhor/i, "🎯", "simples"],
  [/novidades|resumo autom|atualiza[cç][aã]o autom|dados ao vivo|estudos recentes|dados do chembl|ficha autom/i, "🔄", "auto"],
  [/situa[cç][aã]o nas fontes|status/i, "🏛️", "oficial"],
  [/fontes|oficiais|citar/i, "📚", "fontes"],
  [/dura[cç][aã]o|protocolo|linha do tempo/i, "🕰️", "info"],
  [/perguntas/i, "❓", "info"]
];
function decorarBlocos() {
  alvo.querySelectorAll(".conteudo-ficha section.boas").forEach(sec => {
    const h = sec.querySelector(":scope > h2");
    if (!h || sec.dataset.decorado) return;
    const est = BLOCOS_ESTILO.find(([re]) => re.test(h.textContent));
    if (h.textContent.trim() === "Riscos") sec.id = "bloco-riscos";
    sec.dataset.decorado = "1";
    sec.dataset.bloco = est ? est[2] : "info";
    h.insertAdjacentHTML("afterbegin", `<span class="bloco-icone" aria-hidden="true">${est ? est[1] : "📄"}</span> `);
  });
}
/* Blocos técnicos começam fechados: o título vira um botão que abre e fecha o conteúdo. */
const BLOCOS_RECOLHIDOS = /^(fontes|como citar|alertas de seguran[çc]a|estudos recentes|dados ao vivo|conferir nas fontes oficiais|atualiza[çc][ãa]o autom[áa]tica de riscos)/i;
function recolherBlocos() {
  alvo.querySelectorAll(".conteudo-ficha section.boas").forEach(sec => {
    const h = sec.querySelector(":scope > h2");
    if (!h || sec.dataset.recolhivel || !BLOCOS_RECOLHIDOS.test(h.textContent.replace(/^[^\p{L}]+/u, "").trim())) return;
    sec.dataset.recolhivel = "1";
    sec.classList.add("recolhivel", "fechado");
    h.tabIndex = 0;
    h.setAttribute("role", "button");
    h.setAttribute("aria-expanded", "false");
    const alternar = () => { const f = sec.classList.toggle("fechado"); h.setAttribute("aria-expanded", String(!f)); };
    h.addEventListener("click", alternar);
    h.addEventListener("keydown", e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); alternar(); } });
  });
}
function abrirBloco(sec) {
  if (!sec?.classList.contains("recolhivel")) return;
  sec.classList.remove("fechado");
  sec.querySelector(":scope > h2")?.setAttribute("aria-expanded", "true");
}
function htmlCitar(p) {
  const raiz = (document.querySelector('meta[name="site-root"]')?.content || location.origin).replace(/\/$/, "");
  const url = `${raiz}/fichas/${slug(p.nome)}.html`;
  const cit = `GUIA DE PEPTÍDEOS, HORMÔNIOS E SUPLEMENTOS. ${p.nome}. Conteúdo atualizado em ${dataBR(DATA_REVISAO)}. Disponível em: ${url}. Acesso em: ${new Date().toLocaleDateString(LOCALE)}.`;
  return `<section class="boas citar"><h2>Como citar esta ficha</h2><p><small>${esc(cit)}</small></p><p><small>Este guia é um resumo educativo: em trabalhos acadêmicos, cite também as fontes primárias listadas acima.</small></p></section>`;
}
function explorar(p) {
  const s = slug(p.nome), l = [];
  const fam = typeof MECANISMOS !== "undefined" && MECANISMOS.find(m => m.peptideos.includes(p.nome));
  if (fam) l.push([`mecanismos.html#${fam.id}`, `🧬 Família: ${esc(fam.nome)}`]);
  const al = typeof ALEGACOES !== "undefined" ? ALEGACOES.filter(a => a.pep === p.nome) : [];
  al.forEach(a => l.push([`alegacoes.html#${a.id}`, `🔎 Verificar alegação: ${esc(a.texto)}`]));
  const nm = (typeof HISTORICO_AUTO !== "undefined" ? HISTORICO_AUTO : []).concat(typeof MUDANCAS !== "undefined" ? MUDANCAS : []).filter(m => m.slug === s).length;
  if (nm) l.push([`mudancas.html?p=${s}`, `🆕 O que mudou nesta ficha (${nm})`]);
  l.push([`alertas.html#${s}`, "⚠️ Alertas de segurança (recalls FDA)"]);
  const vv = (typeof VIAS !== "undefined" && VIAS[s]) || [], injet = vv.find(x => x[0] === "im") && !vv.find(x => x[0] === "sc") ? "im" : vv.find(x => x[0] === "sc") ? "sc" : vv.find(x => x[0] === "im") ? "im" : "";
  if (injet) l.push([`calculadora.html?p=${s}&via=${injet}`, `🧮 Calculadora de conversão de doses (via ${injet === "im" ? "intramuscular" : "subcutânea"})`]);
  else if (p.fase === "Aprovado") l.push(["calculadora.html", "🧮 Calculadora de conversão de doses"]);
  l.push([`comparar.html?a=${s}`, tr("⚖️ Comparar com outra substância")], ["consulta.html", "👩‍⚕️ Levar perguntas ao médico"], ["seguranca.html", "🛡️ Segurança e legalidade"], ["aprender.html", "🎓 Trilha de aprendizado"]);
  return l;
}
montarLayout();
const alvo = document.getElementById("conteudo");
const p = porSlug(window.PEP_SLUG || new URLSearchParams(location.search).get("p") || "");
/* Item com ficha estática aberto pelo endereço dinâmico: segue para a página indexável. */
if (p && !window.PEP_SLUG && temFichaEstatica(p)) location.replace("fichas/" + slug(p.nome) + ".html" + location.hash);

/* As notas automáticas coladas no texto ([Atualização automática ...]) aparecem no bloco "Novidades nas fontes"; no texto corrido elas só atrapalham a leitura. */
const semNotasAuto = t => String(t).replace(/\s*\[Atualização automática[^\]]*\]/g, "").replace(/\.(\s*\.)+/g, ".").trim();
/* Resumo no topo da ficha: o essencial em três linhas antes dos blocos longos. */
const primeirasFrases = (t, n, max) => {
  const fr = semNotasAuto(t).split(/(?<=[.!?])\s+/).filter(Boolean);
  let out = fr.slice(0, n).join(" ");
  if (out.length > max) out = out.slice(0, max).replace(/\s+\S*$/, "") + "…";
  return out;
};
/* Doses, via e duração usadas nos ensaios (ClinicalTrials.gov), carregadas só na ficha: dados/estudos/<slug>.json. */
function htmlEstudoDose(e) {
  const linha = (rot, v) => v && v.length ? `<div><dt>${rot}</dt><dd>${Array.isArray(v) ? v.map(esc).join(" · ") : esc(v)}</dd></div>` : "";
  const anos = e.inicio && e.fim && e.inicio !== e.fim ? `${e.inicio}–${e.fim}` : (e.inicio || "");
  const durRot = e.duracaoOrigem === "desfecho" ? "Acompanhamento até a avaliação principal" : "Duração segundo o braço do estudo";
  const b = e.braco || {};
  const nomePt = b.nomePt || b.nome, textoPt = b.textoPt || b.texto;
  const nome = nomePt ? `<b>${esc(nomePt)}</b>${textoPt ? ": " + esc(textoPt) : ""}` : "";
  const orig = b.nome ? `<p lang="en"><b>${esc(b.nome)}</b>${b.texto ? ": " + esc(b.texto) : ""}</p>` : "";
  const trechos = e.esquema ? (e.esquema.trechosPt || e.esquema.trechos) : [];
  const tit = e.tituloPt || e.titulo;
  return `<article class="estudo-dose">
    <header><b>${esc(e.fase)}</b>${e.n ? ` · ${e.n.toLocaleString(LOCALE)} participantes` : ""}${anos ? ` · ${esc(anos)}` : ""} · <a href="https://clinicaltrials.gov/study/${esc(e.nct)}" target="_blank" rel="noopener">${esc(e.nct)}</a></header>
    ${tit ? `<p class="estudo-cond"><b>Estudo:</b> ${esc(tit)}</p>` : ""}
    ${e.condicoes?.length ? `<p class="estudo-cond">Condição estudada: ${e.condicoes.map(esc).join(", ")}</p>` : ""}
    <dl class="estudo-dl">${linha("Dose testada", e.doses)}${linha("Frequência", e.frequencia)}${linha("Via", e.via)}${linha(durRot, e.duracao)}</dl>
    ${e.esquema ? `<div class="estudo-esquema"><b>Esquema (ciclos, pausas e fases)</b><p>${e.esquema.tags.map(t => `<span class="tag">${esc(t)}</span>`).join(" ")}</p>${trechos.map(t => `<blockquote>${esc(t)}</blockquote>`).join("")}</div>` : ""}
    ${nome ? `<details class="estudo-orig"><summary>Ver descrição do estudo e texto original</summary><p>${nome}</p><p><small>${esc(e.tituloPt ? e.titulo : "")}</small></p>${orig}</details>` : ""}
  </article>`;
}
async function carregarEstudosDose(p) {
  const s = slug(p.nome);
  try {
    const idx = await getJson("dados/estudos/index.json");
    if (!idx.includes(s)) return;
    const lista = await getJson(`dados/estudos/${s}.json`);
    if (!lista.length) return;
    const caixa = document.getElementById("estudos-dose");
    if (!caixa) return;
    caixa.innerHTML = `<section class="boas estudos-dose"><h2>Como os estudos foram conduzidos</h2>
      <p class="aviso-dose"><b>Só para entender a pesquisa.</b> Estas são as doses e os tempos usados em estudos clínicos, com acompanhamento de equipe de saúde. Não são recomendação de uso nem orientação de dose para você: quem define isso é o profissional que prescreve.</p>
      ${lista.map(htmlEstudoDose).join("")}
      <p><small>Dados extraídos automaticamente do registro público ClinicalTrials.gov (estudos concluídos de maior porte). A leitura automática pode errar: confira sempre no registro de cada estudo.</small></p></section>`;
    decorarBlocos();
    recolherBlocos();
    montarMenuFicha();
  } catch { /* sem dados de dose para este item */ }
}
const RE_ANIMAL = /(?<![\p{L}])(roedor|rato|ratazana|camundong|coelho|cães|cão|cachorro|macaco|primata|porco|suíno|animai|animal|in vitro|não clínic|pré-clínic|ex vivo|rodent|mice|mouse|rats?\b|rabbit|dogs?\b|monkey|nonclinical|animal)/iu;
// separa o texto da bula em trechos de humanos e de animais/laboratório
function dividirAnimais(txt) {
  const unidades = /•/.test(txt) ? txt.split(/\s*•\s*/) : txt.split(/(?<=[.;])\s+/);
  const humanos = [], animais = [];
  unidades.map(u => u.trim()).filter(Boolean).forEach(u => (RE_ANIMAL.test(u) ? animais : humanos).push(u));
  return { humanos, animais };
}
async function carregarBula(p) {
  const s = slug(p.nome);
  try {
    const idx = await getJson("dados/bulas/index.json");
    if (!idx.includes(s)) return;
    const d = await getJson(`dados/bulas/${s}.json`);
    const caixa = document.getElementById("bula-oficial");
    if (!caixa || !d.bulas) return;
    const ROT = { caixa: "⚠️ Alerta de caixa preta", contraindicacoes: "Contraindicações", interacoes: "Interações com outros medicamentos" };
    const grupos = d.bulas.map(b => {
      const blocos = ["caixa", "contraindicacoes", "interacoes"].filter(k => b.secoes[k]).map(k => {
        const x = b.secoes[k], txt = x.pt || x.en;
        const { humanos, animais } = dividirAnimais(txt);
        const lista = us => us.length > 1 || /•/.test(txt) ? `<ul>${us.map(t => `<li>${esc(t)}</li>`).join("")}</ul>` : `<p>${esc(us[0])}</p>`;
        const corpo = (humanos.length ? `<div class="bula-humanos"><h4>👤 Em humanos</h4>${lista(humanos)}</div>` : "")
          + (animais.length ? `<div class="bula-animais"><h4>🐭 Em animais e laboratório</h4>${lista(animais)}<p><small>Resultados de animais não valem como prova de efeito ou segurança em pessoas.</small></p></div>` : "");
        return `<details${k === "caixa" ? " open" : ""}><summary>${ROT[k]}</summary>${corpo}${x.cortado ? "<p><small><i>Trecho inicial; a bula completa tem mais.</i></small></p>" : ""}${x.pt ? "" : "<p><small>Em inglês: tradução indisponível.</small></p>"}</details>`;
      });
      if (!blocos.length) return "";
      return `<div class="bula-via"><h3>💉 Bula para uso ${esc(b.via.toLowerCase())}</h3>${blocos.join("")}
        <p><small>Bula de ${esc(b.titulo)}${b.publicado ? `, publicada em ${esc(b.publicado)}` : ""}. <a href="https://dailymed.nlm.nih.gov/dailymed/lookup.cfm?setid=${esc(b.setid)}" target="_blank" rel="noopener">Ver a bula original</a>.</small></p></div>`;
    }).filter(Boolean);
    if (!grupos.length) return;
    caixa.innerHTML = `<section class="boas bula-oficial"><h2>O que diz a bula oficial</h2>
      <p><small>A bula depende da via de administração (oral, subcutânea, intravenosa etc.): cada uma tem indicação, dose e cuidados próprios. Por isso as bulas abaixo estão separadas por via.</small></p>
      ${grupos.join("")}
      <p><small>Fonte: ${esc(d.fonte)}. Tradução automática do inglês, pode conter erros. Bulas dos EUA: as de outros países podem diferir. Não substitui a orientação de um profissional de saúde.</small></p></section>`;
    decorarBlocos();
    recolherBlocos();
    montarMenuFicha();
  } catch { /* sem bula para este item */ }
}
async function carregarAlvos(p) {
  const s = slug(p.nome);
  try {
    const idx = await getJson("dados/alvos-bio/index.json");
    if (!idx.includes(s)) return;
    const d = await getJson(`dados/alvos-bio/${s}.json`);
    const caixa = document.getElementById("alvos-bio");
    if (!caixa || !d.alvos || !d.alvos.length) return;
    const itens = d.alvos.map(a => `<li><b>${esc(a.acao ? a.acao + ": " : "")}${esc(a.nomePt || a.nome)}</b>${a.gene ? ` <small>(gene ${esc(a.gene)})</small>` : ""}
      ${a.mecanismoPt ? `<br>${esc(a.mecanismoPt)}` : ""}${a.funcaoPt ? `<details><summary>O que essa proteína faz no corpo</summary><p>${esc(a.funcaoPt)}</p></details>` : ""}</li>`).join("");
    caixa.innerHTML = `<section class="boas alvos-bio"><h2>🧪 Laboratório / molecular: onde atua</h2>
      <p><small>Dados de bancos de pesquisa sobre a proteína-alvo. Descrevem o mecanismo, não provam efeito em pessoas.</small></p><ul>${itens}</ul>
      <p><small>Fonte: ${esc(d.fontes)}. Tradução automática do inglês, pode conter erros.</small></p></section>`;
    decorarBlocos();
    recolherBlocos();
    montarMenuFicha();
  } catch { /* sem alvos para este item */ }
}
function htmlResumoRapido(p) {
  return `<section class="boas resumo-rapido"><h2>Resumo rápido</h2><dl>
    <dt>O que é</dt><dd>${esc(primeirasFrases(p.oQueFaz, 1, 200))}</dd>
    <dt>Situação</dt><dd>${htmlLocais(p, false)} <small>${tr("Fase")}: ${esc(p.fase)}</small></dd>
    <dt>Atenção</dt><dd>${esc(primeirasFrases(p.riscos, 2, 240))}</dd></dl>
    <p><small><a href="#bloco-riscos">${tr("Ver todos os riscos")} →</a></small></p></section>`;
}
function secao(titulo, texto, classe = "", tipo = "") {
  return `<section class="boas ${classe}"><h2>${titulo}</h2><p>${comGlossario(semNotasAuto(texto))}</p>${tipo ? `<p>${verificar(p, tipo)}</p>` : ""}</section>`;
}

function htmlResumoAtualizacao(p, d) {
  if (!d) return `<section class="boas atualizacao-auto"><h2>${tr("Resumo automático da pesquisa")}</h2><p>${tr("Dados automáticos indisponíveis.")}</p></section>`;
  const termo = encodeURIComponent(termoEn(p.nome).replace(/\s*\(.*\)/, ""));
  const data = d.quando ? new Date(d.quando).toLocaleString(LOCALE) : "—";
  return `<section class="boas atualizacao-auto"><h2>${tr("Resumo automático da pesquisa")}</h2>
    <p>${tr("Coleta registrada em")} ${esc(data)}.</p>
    <ul>
      <li>ClinicalTrials.gov: ${num(d.ensaios)} ${tr("estudos registrados")}; ${num(d.recrutando)} ${tr("recrutando")}; ${tr("última atualização do registro")}: ${esc(d.ultimaAtualizacao || "—")}.<br>${chipsFases(d)}</li>
      <li>PubMed: ${num(d.artigosAno)} ${tr("artigos nos últimos 12 meses")}; ${num(d.revisoesAno)} ${tr("revisões sistemáticas/meta-análises")}.</li>
    </ul>
    <p><small>${tr("Busca textual por nome: os números descrevem atividade de pesquisa, não comprovam eficácia, benefício ou segurança.")}</small></p>
    <p><small>${tr("Fontes")}: <a href="https://clinicaltrials.gov/search?term=${termo}" target="_blank" rel="noopener">ClinicalTrials.gov</a> · <a href="https://pubmed.ncbi.nlm.nih.gov/?term=${termo}" target="_blank" rel="noopener">PubMed</a></small></p></section>`;
}

function htmlRiscosAtualizados(p, d) {
  if (!d) return `<section class="boas atualizacao-auto aviso-det"><h2>${tr("Atualização automática de riscos e segurança")}</h2><p>${tr("Dados automáticos indisponíveis.")}</p></section>`;
  const termo = encodeURIComponent(termoEn(p.nome).replace(/\s*\(.*\)/, ""));
  const bula = d.bula
    ? `${tr("Rótulo FDA consultado")}${d.bula.atualizada ? ` (${esc(d.bula.atualizada)})` : ""}: ${tr(d.bula.caixaPreta ? "inclui alerta em caixa preta." : "não inclui alerta em caixa preta; isso não significa ausência de riscos.")}`
    : tr("Nenhum rótulo FDA foi localizado nesta busca por nome; isso não indica ausência de riscos.");
  const alertas = d.alertas;
  const recalls = !alertas
    ? `<li>${tr("Dados de recall da FDA indisponíveis nesta coleta.")}</li>`
    : alertas.total
      ? `<li>openFDA: ${num(alertas.total)} ${tr("recalls correspondentes nos últimos 3 anos.")}</li>${(alertas.recentes || []).slice(0, 3).map(r => `<li>${esc(r.data)} · ${esc(r.classe)} · ${esc(r.empresa)}: ${esc(r.motivo)} <small>${esc(r.produto)}</small></li>`).join("")}`
      : `<li>${tr("A busca openFDA não encontrou recalls correspondentes nos últimos 3 anos.")}</li>`;
  const publicacoes = d.segurancaAno === null || d.segurancaAno === undefined
    ? ""
    : `<li>PubMed: ${num(d.segurancaAno)} ${tr("publicações encontradas com termos de segurança nos últimos 12 meses.")}</li>`;
  return `<section class="boas atualizacao-auto aviso-det"><h2>${tr("Atualização automática de riscos e segurança")}</h2>
    <ul><li>${bula}</li>${recalls}${publicacoes}</ul>
    <p><small>${tr("As buscas por nome podem incluir formulações ou lotes específicos. Ausência de resultados não significa ausência de risco; confira a bula da apresentação específica.")}</small></p>
    <p><small>${tr("Fontes")}: <a href="https://open.fda.gov/data/drug/label/" target="_blank" rel="noopener">FDA</a> · <a href="https://www.fda.gov/safety/recalls-market-withdrawals-safety-alerts" target="_blank" rel="noopener">recalls FDA</a> · <a href="https://pubmed.ncbi.nlm.nih.gov/?term=${termo}" target="_blank" rel="noopener">PubMed</a></small></p></section>`;
}

/* Menu lateral da ficha: lista todos os blocos (h2) e destaca o bloco visível. Pode ser chamada de novo quando entram blocos carregados depois. */
let observadorMenu = null;
/* Capítulos da ficha: dão uma sequência de história (quem é → como age → o que se descobriu → como é usado → riscos → situação oficial → ir além). */
function capitulo(n, titulo, pergunta) {
  return `<div class="capitulo" id="cap-${n}"><span class="cap-num">Capítulo ${n}</span><h3>${esc(titulo)}</h3><p>${esc(pergunta)}</p></div>`;
}
function montarMenuFicha() {
  const corpo = document.getElementById("menu-ficha-corpo");
  if (!corpo) return;
  const blocos = [...alvo.querySelectorAll(".conteudo-ficha section.boas > h2")];
  blocos.forEach((h, n) => {
    const sec = h.parentElement;
    if (!sec.id || sec.dataset.menuAuto) { sec.id = `bloco-${n + 1}`; sec.dataset.menuAuto = "1"; }
  });
  const itens = [...alvo.querySelectorAll(".conteudo-ficha .capitulo, .conteudo-ficha section.boas > h2")].map(el => el.classList.contains("capitulo")
    ? `<li class="menu-cap"><a href="#${el.id}">${esc(el.querySelector(".cap-num").textContent.replace("Capítulo ", ""))}. ${esc(el.querySelector("h3").textContent)}</a></li>`
    : `<li><a href="#${el.parentElement.id}">${esc(el.textContent)}</a></li>`);
  corpo.innerHTML = `<ul>${itens.join("")}</ul><p class="menu-topo"><a href="#pep-topo">↑ ${tr("Voltar ao topo")}</a></p>`;
  if (observadorMenu) observadorMenu.disconnect();
  observadorMenu = new IntersectionObserver(es => {
    es.filter(x => x.isIntersecting).forEach(x => {
      corpo.querySelectorAll("a").forEach(a => a.classList.toggle("ativo", a.getAttribute("href") === "#" + x.target.id));
    });
  }, { rootMargin: "-10% 0px -75% 0px" });
  blocos.forEach(h => observadorMenu.observe(h.parentElement));
  if (!corpo.dataset.pronto) {
    corpo.dataset.pronto = "1";
    const det = document.getElementById("menu-ficha-det"), mq = matchMedia("(min-width:1000px)");
    const sinc = () => { det.open = mq.matches; };
    sinc();
    mq.addEventListener("change", sinc);
    corpo.addEventListener("click", e => {
      const a = e.target.closest("a[href^='#']");
      if (!a) return;
      e.preventDefault();
      const alvoBloco = document.getElementById(a.getAttribute("href").slice(1));
      abrirBloco(alvoBloco);
      alvoBloco?.scrollIntoView({ behavior: "smooth" });
      if (!mq.matches) det.open = false;
    });
  }
}

if (!p) {
  seoNaoIndexar();
  document.title = "Item não encontrado — Guia de Peptídeos, Hormônios, Suplementos e Medicamentos";
  alvo.innerHTML = `<section class="boas"><h2>${tr("Item não encontrado")}</h2><p><a href="index.html">${tr("Voltar ao catálogo")}</a></p></section>`;
} else {
  const desc = `${p.nome}: ${p.oQueFaz} Fase: ${p.fase}. Conteúdo educativo.`;
  document.title = `${p.nome} — o que é, evidências e riscos | Guia de Peptídeos, Hormônios, Suplementos e Medicamentos`;
  document.querySelector('meta[name="description"]').content = desc;
  const faq = faqDe(p);
  seoAtualizar("fichas/" + slug(p.nome) + ".html", [
    { "@type": "MedicalWebPage", name: p.nome, description: desc, inLanguage: "pt-BR", isPartOf: { "@type": "WebSite", name: "Guia de Pept\u00eddeos, Horm\u00f4nios e Suplementos" }, about: { "@type": "Drug", name: p.nome } },
    { "@type": "FAQPage", mainEntity: faq.map(([q, a]) => ({ "@type": "Question", name: q, acceptedAnswer: { "@type": "Answer", text: a } })) },
    { "@type": "BreadcrumbList", itemListElement: [{ "@type": "ListItem", position: 1, name: "In\u00edcio", item: (document.querySelector('meta[name="site-root"]')?.content || location.origin) + "/index.html" }, { "@type": "ListItem", position: 2, name: p.nome }] }
  ]);

  const lista = PEPTIDES.slice().sort((a, b) => a.nome.localeCompare(b.nome, "pt"));
  const i = lista.indexOf(p);
  const ant = lista[i - 1], prox = lista[i + 1];
  const relac = PEPTIDES.filter(x => x.categoria === p.categoria && x !== p).slice(0, 6);

  alvo.innerHTML = `
    <div class="layout-ficha"><aside class="menu-ficha" aria-label="${tr("Seções desta ficha")}"><details id="menu-ficha-det" open><summary>☰ ${tr("Seções")}</summary><nav id="menu-ficha-corpo"></nav></details></aside>
    <div class="conteudo-ficha">
    <nav class="migalhas"><a href="index.html">Catálogo</a> › ${esc(p.categoria)} › ${esc(p.nome)}</nav>
    <article class="pagina-pep" id="pep-topo">
      <h2 class="titulo-pep">${esc(p.nome)}</h2>
      <p><span class="tag tag-tipo" title="${esc(tr(tipoDe(p).def))}">${tipoDe(p).icone} ${esc(tr(tipoDe(p).rotulo))}</span> <span class="tag">${esc(p.categoria)}</span> <span class="tag ${faseClasse(p.fase)}">${esc(p.fase)}</span> ${htmlSelo(p)}</p>
      <p>${htmlRevisao()}</p>
      ${p.revisaoIA ? `<p><small>🤖 Texto revisado automaticamente por IA em ${esc(dataBR(p.revisaoIA))}, sem revisão humana. Confira nas fontes antes de decidir qualquer coisa.</small></p>` : ""}
      ${htmlRevisaoHumana(p)}
      ${htmlResumoRapido(p)}
      <p class="acoes"><button type="button" class="btn fav" data-slug="${slug(p.nome)}">${rotuloFav(slug(p.nome))}</button> <a class="btn" href="comparar.html?a=${slug(p.nome)}">⚖️ Comparar</a> <a class="btn btn-prim" href="meus-protocolos.html?add=${slug(p.nome)}">📒 Adicionar aos Meus protocolos</a> <a class="btn" href="calculadora.html?p=${slug(p.nome)}">🧮 Calculadora</a> <button type="button" class="btn" id="pdf">🖨️ Salvar em PDF / imprimir</button> <button type="button" class="btn" id="leitura" aria-pressed="false">🔎 Modo leitura</button> <button type="button" class="btn" id="compartilhar">🔗 Compartilhar</button></p>
      ${capitulo(1, "Quem é", "O que é isso, em palavras simples?")}
      <section class="boas facil-box"><h2>Em palavras simples</h2><p>${esc(explicaFacil(p))}</p></section>
      ${secao("O que faz", p.oQueFaz)}
      ${htmlMarcas(p)}
      ${htmlDetalhes(p)}
      ${capitulo(2, "Como age no corpo", "Onde atua e como o corpo lida com isso?")}
      ${secao("Mecanismo de ação", p.mecanismo, "tecnico", "mecanismo")}
      <div id="alvos-bio"></div>
      ${htmlAgeEm(p)}
      ${htmlFarmaco(p)}
      ${htmlMolecula(p)}
      ${capitulo(3, "O que a ciência encontrou", "Funciona? Qual a força das provas?")}
      ${secao("Benefícios observados nos estudos", p.beneficios, "", "beneficios")}
      <div id="resumo-auto"></div>
      ${secao("Nível de evidência", p.evidencia, "tecnico", "evidencia")}
      <div class="ad-slot" data-slot="conteudo"></div>
      ${capitulo(4, "Como é usado", "Em que vias, doses e por quanto tempo nos estudos e nas bulas?")}
      ${htmlVias(p)}
      <div id="estudos-dose"></div>
      <div id="bula-oficial"></div>
      ${secao("Protocolo / contexto de uso", p.protocolo, "tecnico")}
      ${capitulo(5, "O que pode dar errado", "Quais os riscos, as interações e os sinais de alerta?")}
      ${secao("Riscos", p.riscos, "", "riscos")}
      <div id="riscos-auto"></div>
      ${htmlInteracoes(p)}
      ${htmlSinais(p)}
      <section class="boas"><h2>Alertas de segurança</h2><div class="alertas-box"><small>Carregando...</small></div></section>
      <div class="ad-slot" data-slot="conteudo"></div>
      ${capitulo(6, "Situação oficial", "É aprovado? Onde e para quê?")}
      <section class="boas"><h2>${tr("Situação nas fontes regulatórias")}</h2><p><b>Status regulatório:</b> ${esc(semNotasAuto(p.status))}</p>${htmlLocais(p, true)}</section>
      ${htmlOficiais(p)}
      ${capitulo(7, "Para ir além", "Dúvidas comuns, história, fontes e novidades")}
      <section class="boas"><h2>Perguntas frequentes</h2>${faq.map(([q, a]) => `<details class="faq"><summary>${esc(q)}</summary><p>${esc(a)}</p></details>`).join("")}</section>
      <section class="boas"><h2>Linha do tempo</h2>${htmlEtapas(p)}${marcosDoItem(p).length ? `<ul class="marcos">${marcosDoItem(p).map(([a, t]) => `<li><b>${a}</b> — ${esc(t)}</li>`).join("")}</ul>` : "<p><small>Sem marcos históricos cadastrados para este item.</small></p>"}</section>
      <section class="boas"><h2>Fontes</h2><p>${p.fontes.map(linkFonte).join("; ")}</p><p><b>Buscar:</b> ${links(p.nome)}</p></section>
      ${htmlCitar(p)}
      <section class="boas"><h2>Estudos recentes</h2><div class="estudos-box" data-nome="${esc(p.nome)}"><small>Carregando...</small></div></section>
      <section class="boas"><h2>Dados ao vivo</h2><div class="live" data-nome="${esc(p.nome)}"><small>Carregando...</small></div></section>
    </article>
    <section class="boas"><h2>Explore mais sobre ${esc(p.nome)}</h2><ul class="explore">${explorar(p).map(([h, tx]) => `<li><a href="${h}">${tx}</a></li>`).join("")}</ul></section>
    ${relac.length ? `<section class="boas"><h2>Veja também (${esc(p.categoria)})</h2><p>${relac.map(r => `<a href="${urlPeptideo(r.nome)}">${esc(r.nome)}</a>`).join(" · ")}</p></section>` : ""}
    <p class="prox-ant">${ant ? `<a href="${urlPeptideo(ant.nome)}">← ${esc(ant.nome)}</a>` : "<span></span>"}${prox ? `<a href="${urlPeptideo(prox.nome)}">${esc(prox.nome)} →</a>` : ""}</p>
    </div></div>`;
  document.body.classList.add("pagina-ficha");
  decorarBlocos();
  recolherBlocos();
  try {
    const rec = JSON.parse(localStorage.getItem("recentes_v1") || "[]").filter(s => s !== slug(p.nome));
    rec.unshift(slug(p.nome));
    localStorage.setItem("recentes_v1", JSON.stringify(rec.slice(0, 8)));
  } catch { /* armazenamento indisponível */ }
  montarMenuFicha();
  carregarLive(alvo.querySelector(".live"));
  carregarEstudosDose(p);
  carregarBula(p);
  carregarAlvos(p);
  carregarEstudos(alvo.querySelector(".estudos-box"));
  snapshot().then(snap => {
    alvo.querySelector(".alertas-box").innerHTML = htmlAlertas(p);
    const automatico = snap?.itens?.[slug(p.nome)] || null;
    document.getElementById("resumo-auto").innerHTML = htmlResumoAtualizacao(p, automatico);
    document.getElementById("riscos-auto").innerHTML = htmlRiscosAtualizados(p, automatico);
    decorarBlocos();
    recolherBlocos();
    montarMenuFicha();
  });
  document.getElementById("compartilhar").addEventListener("click", async e => {
    const url = new URL("fichas/" + slug(p.nome) + ".html", document.baseURI).href;
    if (navigator.share) { try { await navigator.share({ title: p.nome + " — Guia de Peptídeos, Hormônios, Suplementos e Medicamentos", url }); return; } catch { return; } }
    try { await navigator.clipboard.writeText(url); e.currentTarget.textContent = "✅ Link copiado"; } catch { prompt("Copie o link:", url); }
  });
  const art = alvo.querySelector(".pagina-pep");
  art.classList.toggle("modo-facil", localStorage.getItem("facil") === "1");
  const btnL = document.getElementById("leitura");
  const aplicarLeitura = on => { document.body.classList.toggle("modo-leitura", on); btnL.setAttribute("aria-pressed", on); };
  try { aplicarLeitura(localStorage.getItem("leitura") === "1"); } catch { /* armazenamento indisponível */ }
  btnL.addEventListener("click", () => { const on = !document.body.classList.contains("modo-leitura"); try { localStorage.setItem("leitura", on ? "1" : "0"); } catch { /* ignora */ } aplicarLeitura(on); });
}




alvo.addEventListener("click", e => {
  const b = e.target.closest(".fav");
  if (b) { alternarFav(b.dataset.slug); b.textContent = rotuloFav(b.dataset.slug); }
  if (e.target.id === "pdf") window.print();
});

