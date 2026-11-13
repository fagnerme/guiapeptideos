/* Conexões desta ficha com o resto do site. */
function htmlDetalhes(p) {
  const d = (LANG !== "pt" && typeof DETALHES_I18N !== "undefined" && DETALHES_I18N[LANG] && DETALHES_I18N[LANG][slug(p.nome)]) || DETALHES[slug(p.nome)];
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

const DATA_CONFERENCIA = "2026-11-05";
function htmlOficiais(p) {
  const q = encodeURIComponent(termoEn(p.nome).replace(/\s*\(.*\)/, ""));
  const a = (u, t) => `<li><a href="${u}" target="_blank" rel="noopener">${t}</a></li>`;
  return `<section class="boas oficiais"><h2>Conferir nas fontes oficiais</h2>
    <p>Este texto é educativo e resumido. Antes de qualquer decisão, confirme nos órgãos abaixo (os links abrem a busca pelo nome do item):</p>
    <ul class="explore">${a(`https://www.accessdata.fda.gov/scripts/cder/daf/index.cfm?event=BasicSearch.process&searchTerm=${q}`, "FDA (EUA): Drugs@FDA")}${a(`https://dailymed.nlm.nih.gov/dailymed/search.cfm?labeltype=all&query=${q}`, "DailyMed: bulas dos EUA")}${a(`https://www.ema.europa.eu/en/search?search_api_fulltext=${q}`, "EMA (Europa)")}${a("https://consultas.anvisa.gov.br/#/medicamentos/", "Anvisa (Brasil): consulta de medicamentos")}${a(`https://pubchem.ncbi.nlm.nih.gov/#query=${q}`, "PubChem: estrutura e dados químicos")}${a(`https://clinicaltrials.gov/search?term=${q}`, "ClinicalTrials.gov: estudos em andamento")}</ul>
    <p><small>Última conferência geral do catálogo: ${DATA_CONFERENCIA}. A Anvisa não tem API pública: faça a busca diretamente no site.</small></p></section>`;
}
function htmlRevisaoHumana(p) {
  const s = slug(p.nome), rev = typeof REVISOES !== "undefined" && REVISOES[s];
  const pend = (typeof REVISAO_PENDENTE !== "undefined" && REVISAO_PENDENTE[s]) || [];
  const linha = rev
    ? `<small class="revisao">✔️ Revisado por ${esc(rev.por)} em ${dataBR(rev.data)}</small>`
    : "";
  const aviso = pend.length ? `<section class="boas aviso-det"><h2>Atualizado automaticamente: sinais nas fontes</h2><ul>${pend.slice(0, 4).map(x => `<li>${esc(x.data)} — ${esc(typeof notaAuto === "function" ? notaAuto(x.texto) : x.texto)}</li>`).join("")}</ul><p><small>Fase, situação de aprovação, riscos, evidência e status são atualizados automaticamente com notas datadas a partir das fontes. Confira nas fontes oficiais.</small></p></section>` : "";
  const auto = typeof AUTO_DADOS !== "undefined" && AUTO_DADOS.includes(s)
    ? `<section class="boas aviso-det"><h2>Dados do ChEMBL</h2><p>Fase, mecanismo e indicações desta ficha vêm do ChEMBL, base de dados pública do EMBL-EBI. Confira a bula e os órgãos reguladores antes de qualquer decisão.</p></section>` : "";
  const dsld = typeof DSLD_DADOS !== "undefined" && DSLD_DADOS.includes(s)
    ? `<section class="boas aviso-det"><h2>${tr("Ficha automática: DSLD (NIH) e Wikipédia")}</h2><p>${tr("Este ativo foi identificado no DSLD, base pública do NIH sobre rótulos de suplementos. O texto de apresentação é adaptado da Wikipédia (licença CC BY-SA 4.0; link nas fontes) e a fase vem do ClinicalTrials.gov. Não há avaliação editorial de benefícios e riscos: confira as fontes e converse com um profissional de saúde.")}</p></section>` : "";
  return `${linha ? `<p>${linha}</p>` : ""}${auto}${dsld}${aviso}`;
}
function htmlCitar(p) {
  const raiz = (document.querySelector('meta[name="site-root"]')?.content || location.origin).replace(/\/$/, "");
  const url = `${raiz}/ficha-${slug(p.nome)}.html`;
  const cit = `GUIA EDUCATIVO DE PEPTÍDEOS, HORMÔNIOS E SUPLEMENTOS. ${p.nome}. Conteúdo atualizado em ${dataBR(DATA_REVISAO)}. Disponível em: ${url}. Acesso em: ${new Date().toLocaleDateString(LOCALE)}.`;
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

function secao(titulo, texto, classe = "", tipo = "") {
  return `<section class="boas ${classe}"><h2>${titulo}</h2><p>${comGlossario(texto)}</p>${tipo ? `<p>${verificar(p, tipo)}</p>` : ""}</section>`;
}

if (!p) {
  seoNaoIndexar();
  document.title = "Item não encontrado — Guia Educativo de Peptídeos, Hormônios e Suplementos";
  alvo.innerHTML = `<section class="boas"><h2>${tr("Item não encontrado")}</h2><p><a href="index.html">${tr("Voltar ao catálogo")}</a></p></section>`;
} else {
  const desc = `${p.nome}: ${p.oQueFaz} Fase: ${p.fase}. Conteúdo educativo.`;
  document.title = `${p.nome} — o que é, evidências e riscos | Guia Educativo de Peptídeos, Hormônios e Suplementos`;
  document.querySelector('meta[name="description"]').content = desc;
  const faq = faqDe(p);
  seoAtualizar("ficha-" + slug(p.nome) + ".html", [
    { "@type": "MedicalWebPage", name: p.nome, description: desc, inLanguage: "pt-BR", isPartOf: { "@type": "WebSite", name: "Guia Educativo de Pept\u00eddeos, Horm\u00f4nios e Suplementos" }, about: { "@type": "Drug", name: p.nome } },
    { "@type": "FAQPage", mainEntity: faq.map(([q, a]) => ({ "@type": "Question", name: q, acceptedAnswer: { "@type": "Answer", text: a } })) },
    { "@type": "BreadcrumbList", itemListElement: [{ "@type": "ListItem", position: 1, name: "In\u00edcio", item: (document.querySelector('meta[name="site-root"]')?.content || location.origin) + "/index.html" }, { "@type": "ListItem", position: 2, name: p.nome }] }
  ]);

  const lista = PEPTIDES.slice().sort((a, b) => a.nome.localeCompare(b.nome, "pt"));
  const i = lista.indexOf(p);
  const ant = lista[i - 1], prox = lista[i + 1];
  const relac = PEPTIDES.filter(x => x.categoria === p.categoria && x !== p).slice(0, 6);

  alvo.innerHTML = `
    <nav class="migalhas"><a href="index.html">Catálogo</a> › ${esc(p.categoria)} › ${esc(p.nome)}</nav>
    <article class="pagina-pep" id="pep-topo">
      <h2 class="titulo-pep">${esc(p.nome)}</h2>
      <p><span class="tag tag-tipo" title="${esc(tr(tipoDe(p).def))}">${tipoDe(p).icone} ${esc(tr(tipoDe(p).rotulo))}</span> <span class="tag">${esc(p.categoria)}</span> <span class="tag ${faseClasse(p.fase)}">${esc(p.fase)}</span> ${htmlSelo(p)}</p>
      <p>${htmlRevisao()}</p>
      ${htmlRevisaoHumana(p)}
      <p><b>Status regulatório:</b> ${esc(p.status)}</p>
      <section class="boas"><h2>Aprovado em</h2>${htmlLocais(p, true)}</section>
      <p class="acoes"><button type="button" class="btn fav" data-slug="${slug(p.nome)}">${rotuloFav(slug(p.nome))}</button> <a class="btn" href="comparar.html?a=${slug(p.nome)}">⚖️ Comparar</a> <a class="btn btn-prim" href="meus-protocolos.html?add=${slug(p.nome)}">📒 Adicionar aos Meus protocolos</a> <a class="btn" href="calculadora.html?p=${slug(p.nome)}">🧮 Calculadora</a> <button type="button" class="btn" id="pdf">🖨️ Salvar em PDF / imprimir</button> <button type="button" class="btn" id="facil" aria-pressed="false">🧒 Explique fácil</button> <button type="button" class="btn" id="compartilhar">🔗 Compartilhar</button></p>
      <section class="boas facil-box"><h2>Em palavras simples</h2><p>${esc(explicaFacil(p))}</p></section>
      ${secao("O que faz", p.oQueFaz)}
      ${htmlDetalhes(p)}
      ${secao("Mecanismo de ação", p.mecanismo, "tecnico", "mecanismo")}
      ${secao("Benefícios observados nos estudos", p.beneficios, "", "beneficios")}
      ${htmlAgeEm(p)}
      ${htmlVias(p)}
      ${htmlInteracoes(p)}
      ${htmlFarmaco(p)}
      ${secao("Nível de evidência", p.evidencia, "tecnico", "evidencia")}
      ${secao("Riscos", p.riscos, "", "riscos")}
      ${secao("Protocolo / contexto de uso", p.protocolo, "tecnico")}
      <section class="boas"><h2>Perguntas frequentes</h2>${faq.map(([q, a]) => `<details class="faq"><summary>${esc(q)}</summary><p>${esc(a)}</p></details>`).join("")}</section>
      <section class="boas"><h2>Linha do tempo</h2>${htmlEtapas(p)}${(TIMELINE[p.nome] || []).length ? `<ul class="marcos">${TIMELINE[p.nome].map(([a, t]) => `<li><b>${a}</b> — ${esc(t)}</li>`).join("")}</ul>` : "<p><small>Sem marcos históricos cadastrados para este item.</small></p>"}</section>
      <section class="boas"><h2>Fontes</h2><p>${p.fontes.map(linkFonte).join("; ")}</p><p><b>Buscar:</b> ${links(p.nome)}</p></section>
      ${htmlOficiais(p)}
      ${htmlCitar(p)}
      <section class="boas"><h2>Alertas de segurança</h2><div class="alertas-box"><small>Carregando...</small></div></section>
      <section class="boas"><h2>Estudos recentes</h2><div class="estudos-box" data-nome="${esc(p.nome)}"><small>Carregando...</small></div></section>
      <section class="boas"><h2>Dados ao vivo</h2><div class="live" data-nome="${esc(p.nome)}"><small>Carregando...</small></div></section>
    </article>
    ${htmlMolecula(p)}
    <section class="boas"><h2>Explore mais sobre ${esc(p.nome)}</h2><ul class="explore">${explorar(p).map(([h, tx]) => `<li><a href="${h}">${tx}</a></li>`).join("")}</ul></section>
    ${relac.length ? `<section class="boas"><h2>Veja também (${esc(p.categoria)})</h2><p>${relac.map(r => `<a href="${urlPeptideo(r.nome)}">${esc(r.nome)}</a>`).join(" · ")}</p></section>` : ""}
    <p class="prox-ant">${ant ? `<a href="${urlPeptideo(ant.nome)}">← ${esc(ant.nome)}</a>` : "<span></span>"}${prox ? `<a href="${urlPeptideo(prox.nome)}">${esc(prox.nome)} →</a>` : ""}</p>`;
  carregarLive(alvo.querySelector(".live"));
  carregarEstudos(alvo.querySelector(".estudos-box"));
  snapshot().then(() => { alvo.querySelector(".alertas-box").innerHTML = htmlAlertas(p); });
  document.getElementById("compartilhar").addEventListener("click", async e => {
    const url = new URL("ficha-" + slug(p.nome) + ".html", location.href).href;
    if (navigator.share) { try { await navigator.share({ title: p.nome + " — Guia Educativo de Peptídeos, Hormônios e Suplementos", url }); return; } catch { return; } }
    try { await navigator.clipboard.writeText(url); e.currentTarget.textContent = "✅ Link copiado"; } catch { prompt("Copie o link:", url); }
  });
  const art = alvo.querySelector(".pagina-pep"), btnF = document.getElementById("facil");
  const aplicarFacil = on => { art.classList.toggle("modo-facil", on); btnF.setAttribute("aria-pressed", on); };
  aplicarFacil(localStorage.getItem("facil") === "1");
  btnF.addEventListener("click", () => { const on = !art.classList.contains("modo-facil"); localStorage.setItem("facil", on ? "1" : "0"); aplicarFacil(on); });
}




alvo.addEventListener("click", e => {
  const b = e.target.closest(".fav");
  if (b) { alternarFav(b.dataset.slug); b.textContent = rotuloFav(b.dataset.slug); }
  if (e.target.id === "pdf") window.print();
});

