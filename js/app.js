montarLayout();
const lista = document.getElementById("lista");
const paginacao = document.getElementById("paginacao");
const carregarMais = document.getElementById("carregar-mais");
const busca = document.getElementById("busca");
const catSel = document.getElementById("categoria");
const faseSel = document.getElementById("fase");
const favSel = document.getElementById("so-fav");
const seloSel = document.getElementById("selo");
const ordemSel = document.getElementById("ordem");
const origemSel = document.getElementById("origem");
const tipoSel = document.getElementById("tipo");
const ITENS_POR_PAGINA = 40;
let limiteVisivel = ITENS_POR_PAGINA;
Object.entries(TIPOS).forEach(([k, s]) => { const o = document.createElement("option"); o.value = k; o.textContent = `${s.icone} ${s.rotulo}`; tipoSel.appendChild(o); });
document.getElementById("legenda-tipos").innerHTML = Object.entries(TIPOS).map(([k, s]) => `<li><b>${s.icone} ${esc(tr(s.rotulo))}</b> (${PEPTIDES.filter(p => chaveTipo(p) === k).length}): ${esc(tr(s.def))}</li>`).join("");
const tituloTipos = document.getElementById("titulo-tipos");
if (tituloTipos) tituloTipos.textContent = tr("Qual a diferença entre") + " " + Object.values(TIPOS).map(s => s.curto).join(", ").replace(/, ([^,]*)$/, " e $1") + "?";
Object.entries(ORIGENS).forEach(([k, s]) => { const o = document.createElement("option"); o.value = k; o.textContent = `${s.icone} ${s.rotulo}`; origemSel.appendChild(o); });
const chaveOrigem = p => Object.keys(ORIGENS).find(k => ORIGENS[k] === origemDe(p));
const facilChk = document.getElementById("facil-idx");
facilChk.checked = localStorage.getItem("facil") === "1";
Object.entries(SELOS).forEach(([k, s]) => { const o = document.createElement("option"); o.value = k; o.textContent = `${s.icone} ${s.rotulo}`; seloSel.appendChild(o); });
const chaveSelo = p => Object.keys(SELOS).find(k => SELOS[k] === seloDe(p));
const ORDEM_SELO = Object.keys(SELOS);


function preencher(sel, valores) {
  valores.forEach(v => {
    const o = document.createElement("option");
    o.value = v;
    o.textContent = tr(v);
    sel.appendChild(o);
  });
}
preencher(faseSel, FASES.filter(f => PEPTIDES.some(p => p.fase === f)));
const categoriasPrioritarias = ["Hormônio", "Vitamina", "Mineral", "NAD e precursores", "Suplemento e metabólito", "Mimético de exercício"];
const categorias = [...new Set(PEPTIDES.map(p => p.categoria))];
categorias.sort((a, b) => {
  const ia = categoriasPrioritarias.indexOf(a), ib = categoriasPrioritarias.indexOf(b);
  if (ia !== -1 || ib !== -1) return ia === -1 ? 1 : ib === -1 ? -1 : ia - ib;
  return a.localeCompare(b, "pt");
});
preencher(catSel, categorias);

document.getElementById("boas").innerHTML = BOAS_PRATICAS.map(b => `<li>${esc(b)}</li>`).join("");
document.getElementById("gloss").innerHTML = GLOSSARIO
  .slice().sort((a, b) => a.termo.localeCompare(b.termo, "pt"))
  .map(g => `<dt><a href="termo.html?t=${slug(g.termo)}">${esc(g.termo)}</a></dt><dd>${esc(g.def)}</dd>`).join("");
document.getElementById("fontes-lista").innerHTML = FONTES_REF
  .map(f => `<li><a href="${f.url}" target="_blank" rel="noopener">${esc(f.nome)}</a> — ${esc(f.desc)}</li>`).join("");


document.getElementById("az").innerHTML = PEPTIDES.map(p => p.nome)
  .sort((a, b) => a.localeCompare(b, "pt"))
  .map(n => `<a href="#${slug(n)}" data-nome="${esc(n)}" class="az-link">${esc(n)}</a>`).join(" · ");



function render(alvoSlug = "") {
  const q = busca.value.trim().toLowerCase();
  const cmpNome = (a, b) => (/^\p{L}/u.test(a.nome) ? 0 : 1) - (/^\p{L}/u.test(b.nome) ? 0 : 1) || a.nome.localeCompare(b.nome, "pt");
  const itens = PEPTIDES.filter(p =>
    (!tipoSel.value || chaveTipo(p) === tipoSel.value) &&
    (!catSel.value || p.categoria === catSel.value) &&
    (!faseSel.value || p.fase === faseSel.value) &&
    (!favSel.checked || ehFav(slug(p.nome))) &&
    (!seloSel.value || chaveSelo(p) === seloSel.value) &&
    (!origemSel.value || chaveOrigem(p) === origemSel.value) &&
    (!q || ((t, c) => t.includes(q) || c.includes(q.replace(/[^a-z0-9]/g, "")))((p.nome + " " + p.mecanismo + " " + p.categoria + " " + tipoDe(p).rotulo + " " + p.status).toLowerCase(), (p.nome + " " + p.mecanismo).toLowerCase().replace(/[^a-z0-9]/g, "")))
  );
  if (ordemSel.value === "fase") itens.sort((a, b) => FASES.indexOf(a.fase) - FASES.indexOf(b.fase) || cmpNome(a, b));
  else if (ordemSel.value === "confianca") itens.sort((a, b) => ORDEM_SELO.indexOf(chaveSelo(a)) - ORDEM_SELO.indexOf(chaveSelo(b)) || cmpNome(a, b));
  else itens.sort((a, b) => cmpNome(a, b));
  if (alvoSlug) {
    const indiceAlvo = itens.findIndex(p => slug(p.nome) === alvoSlug);
    if (indiceAlvo >= 0) limiteVisivel = Math.ceil((indiceAlvo + 1) / ITENS_POR_PAGINA) * ITENS_POR_PAGINA;
  }
  const exibidos = itens.slice(0, limiteVisivel);
  const facil = facilChk.checked;
  document.getElementById("contagem").textContent = `${exibidos.length} ${tr("itens exibidos")} · ${itens.length} de ${PEPTIDES.length} ${tr("substâncias")}`;
  lista.innerHTML = exibidos.length ? exibidos.map(p => `
    <article class="card" id="${slug(p.nome)}">
      <div class="card-cabecalho">
        <h3><a href="${urlPeptideo(p.nome)}">${esc(p.nome)}</a></h3>
        <button type="button" class="fav" data-slug="${slug(p.nome)}" aria-label="Favoritar">${rotuloFav(slug(p.nome))}</button>
      </div>
      <div class="card-tags"><span class="tag tag-tipo" title="${esc(tr(tipoDe(p).def))}">${tipoDe(p).icone} ${esc(tr(tipoDe(p).rotulo))}</span> <span class="tag">${esc(p.categoria)}</span> ${p.fase !== "Aprovado" ? `<span class="tag ${faseClasse(p.fase)}">${esc(p.fase)}</span>` : ""}</div>
      <p class="card-selo">${htmlSelo(p)}</p>
      <p class="card-locais">${htmlLocais(p, false)}</p>
      <p class="resumo">${esc(facil ? explicaFacil(p) : p.oQueFaz)}</p>
      <details class="card-detalhes">
        <summary>Detalhes regulatórios e estudos</summary>
        ${htmlLocais(p, true)}
      </details>
      <p class="acoes"><a class="btn btn-prim" href="${urlPeptideo(p.nome)}">Ver detalhes →</a> <a class="btn" href="comparar.html?a=${slug(p.nome)}">⚖️ Comparar</a>${p.fase === "Aprovado" ? ' <a class="btn" href="calculadora.html">🧮 Calculadora</a>' : ""}</p>
    </article>`).join("") : `<p>${tr("Nenhum resultado.")}</p><p><small>${tr("Tente outro termo ou limpe os filtros.")}</small></p><p><button type="button" class="btn btn-prim" id="limpar-filtros">${tr("Limpar filtros")}</button></p>`;
  paginacao.hidden = exibidos.length >= itens.length;
  carregarMais.textContent = tr("Carregar mais");
  atualizarFiltrosAtivos();
}

/* Filtros ativos como chips removíveis, contador no resumo e estado compartilhável na URL. */
const FILTROS_URL = [["q", busca], ["tipo", tipoSel], ["cat", catSel], ["fase", faseSel], ["selo", seloSel], ["origem", origemSel], ["ordem", ordemSel]];
function filtrosAtivos() {
  const sel = s => s.selectedOptions[0]?.textContent || s.value;
  const l = [];
  if (busca.value.trim()) l.push(["busca", `“${busca.value.trim()}”`]);
  [["tipo", tipoSel], ["categoria", catSel], ["fase", faseSel], ["selo", seloSel], ["origem", origemSel]].forEach(([k, s]) => { if (s.value) l.push([k, sel(s)]); });
  if (favSel.checked) l.push(["fav", "⭐ " + tr("Só favoritos")]);
  return l;
}
function limparFiltro(k) {
  if (k === "busca") busca.value = "";
  else if (k === "fav") favSel.checked = false;
  else ({ tipo: tipoSel, categoria: catSel, fase: faseSel, selo: seloSel, origem: origemSel })[k].value = "";
}
function atualizarFiltrosAtivos() {
  const ativos = filtrosAtivos();
  const box = document.getElementById("filtros-ativos");
  box.hidden = !ativos.length;
  box.innerHTML = ativos.length ? ativos.map(([k, r]) => `<button type="button" class="chip-filtro" data-limpar="${k}" aria-label="${esc(tr("Remover filtro"))}: ${esc(r)}">${esc(r)} <span aria-hidden="true">✕</span></button>`).join("") + `<button type="button" class="chip-filtro chip-limpar" data-limpar="tudo">${esc(tr("Limpar tudo"))}</button>` : "";
  const nFiltros = ativos.filter(([k]) => k !== "busca").length;
  document.getElementById("filtros-resumo").textContent = tr("Filtros e ordenação") + (nFiltros ? ` (${nFiltros})` : "");
  const rec = document.getElementById("recentes");
  if (rec.dataset.tem) rec.hidden = ativos.length > 0;
  const u = new URLSearchParams();
  FILTROS_URL.forEach(([k, el]) => { const v = el.value.trim(); if (v && !(k === "ordem" && v === "az")) u.set(k, v); });
  if (favSel.checked) u.set("fav", "1");
  const qs = u.toString();
  history.replaceState(null, "", location.pathname + (qs ? "?" + qs : "") + location.hash);
}
function lerFiltrosUrl() {
  const u = new URLSearchParams(location.search);
  FILTROS_URL.forEach(([k, el]) => { if (u.has(k)) el.value = u.get(k); });
  favSel.checked = u.get("fav") === "1";
  if (filtrosAtivos().some(([k]) => k !== "busca") || ordemSel.value !== "az") document.getElementById("filtros-avancados").open = true;
}
document.getElementById("filtros-ativos").addEventListener("click", e => {
  const b = e.target.closest("[data-limpar]");
  if (!b) return;
  if (b.dataset.limpar === "tudo") filtrosAtivos().forEach(([k]) => limparFiltro(k));
  else limparFiltro(b.dataset.limpar);
  limiteVisivel = ITENS_POR_PAGINA;
  render();
});
/* Últimas fichas abertas neste aparelho, para voltar rápido. */
(function recentes() {
  let l = [];
  try { l = JSON.parse(localStorage.getItem("recentes_v1") || "[]").map(porSlug).filter(Boolean).slice(0, 6); } catch { /* sem armazenamento */ }
  if (!l.length) return;
  const box = document.getElementById("recentes");
  box.dataset.tem = "1";
  box.innerHTML = `<span class="recentes-rotulo">🕘 ${esc(tr("Vistos recentemente"))}:</span> ` + l.map(p => `<a class="chip-filtro" href="${urlPeptideo(p.nome)}">${esc(p.nome)}</a>`).join(" ");
  box.hidden = false;
})();

/* Menu lateral: atalhos para as seções da página. */
const SECOES_MENU = [["filtros-topo", "🔎 Buscar e filtrar"], ["lista", "🧬 Catálogo"], ["indice", "🔤 Índice A–Z"], ["glossario", "📖 Glossário"], ["fontes", "🏛️ Fontes de referência"], ["selos", "🏷️ Selos de confiança"], ["boas-praticas", "✅ Boas práticas"]];
function montarMenu() {
  const alvo = document.getElementById("menu-lateral-corpo");
  alvo.innerHTML = `<ul>${SECOES_MENU.map(([id, r]) => `<li><a href="#${id}" data-secao="${id}">${esc(tr(r))}</a></li>`).join("")}</ul>`;
  const det = document.getElementById("menu-lateral-det");
  const mq = matchMedia("(min-width:1000px)");
  alvo.addEventListener("click", e => {
    const a = e.target.closest("a[data-secao]");
    if (!a) return;
    e.preventDefault();
    document.getElementById(a.dataset.secao)?.scrollIntoView({ behavior: "smooth" });
    if (!mq.matches) det.open = false;
  });
  const sinc = () => { det.open = mq.matches; };
  sinc();
  mq.addEventListener("change", sinc);
}
/* Sugestões ao digitar no campo do catálogo: nomes que combinam; clicar abre a ficha, Enter mantém o filtro da lista. */
function montarSugestoes() {
  const sug = document.createElement("ul");
  sug.className = "sug-busca";
  sug.id = "sug-catalogo";
  sug.hidden = true;
  sug.setAttribute("role", "listbox");
  busca.parentElement.appendChild(sug);
  let ativo = -1;
  const norm = s => semAcento(String(s).toLowerCase());
  const so = s => s.replace(/[^a-z0-9]/g, "");
  const fechar = () => { sug.hidden = true; ativo = -1; };
  const marcar = i => { [...sug.children].forEach((li, k) => li.classList.toggle("ativo", k === i)); ativo = i; };
  busca.addEventListener("input", () => {
    const ws = norm(busca.value).split(/\s+/).filter(Boolean);
    if (!ws.length) return fechar();
    const achados = PEPTIDES.map(p => ({ p, n: norm(p.nome) }))
      .filter(x => ws.every(w => x.n.includes(w) || (so(w).length > 2 && so(x.n).includes(so(w)))))
      .sort((a, b) => (b.n.startsWith(ws[0]) ? 1 : 0) - (a.n.startsWith(ws[0]) ? 1 : 0) || a.n.length - b.n.length);
    if (!achados.length) return fechar();
    sug.innerHTML = achados.slice(0, 8).map(x => `<li role="option"><a href="${urlPeptideo(x.p.nome)}"><b>${esc(x.p.nome)}</b> <small>${esc(tr(x.p.categoria))} · ${esc(tr(x.p.fase))}</small></a></li>`).join("")
      + `<li role="option" class="sug-todos"><a href="#lista" data-lista="1">${esc(tr("Ver os resultados na lista"))} (${achados.length})</a></li>`;
    sug.hidden = false;
    ativo = -1;
  });
  busca.addEventListener("keydown", e => {
    const n = sug.children.length;
    if (sug.hidden || !n) return;
    if (e.key === "ArrowDown") { e.preventDefault(); marcar((ativo + 1) % n); }
    else if (e.key === "ArrowUp") { e.preventDefault(); marcar((ativo - 1 + n) % n); }
    else if (e.key === "Enter" && ativo >= 0) { e.preventDefault(); sug.children[ativo].querySelector("a").click(); }
    else if (e.key === "Enter") { fechar(); lista.scrollIntoView({ behavior: "smooth" }); }
    else if (e.key === "Escape") fechar();
  });
  sug.addEventListener("click", e => {
    if (!e.target.closest("[data-lista]")) return;
    e.preventDefault();
    fechar();
    lista.scrollIntoView({ behavior: "smooth" });
  });
  document.addEventListener("click", e => { if (!busca.parentElement.contains(e.target)) fechar(); });
}

[busca, tipoSel, catSel, faseSel, favSel, seloSel, origemSel, ordemSel].forEach(el => el.addEventListener(el === busca ? "input" : "change", () => {
  limiteVisivel = ITENS_POR_PAGINA;
  render();
}));
carregarMais.addEventListener("click", () => {
  limiteVisivel += ITENS_POR_PAGINA;
  render();
});
facilChk.addEventListener("change", () => { localStorage.setItem("facil", facilChk.checked ? "1" : "0"); render(); });
lista.addEventListener("click", e => {
  if (e.target.closest("#limpar-filtros")) {
    busca.value = ""; [tipoSel, catSel, faseSel, seloSel, origemSel].forEach(s => { s.value = ""; }); favSel.checked = false; limiteVisivel = ITENS_POR_PAGINA; render(); return;
  }
  const b = e.target.closest(".fav");
  if (!b) return;
  alternarFav(b.dataset.slug);
  b.textContent = rotuloFav(b.dataset.slug);
});

// Link do índice A–Z limpa filtros para garantir que o card exista e o abre
document.getElementById("az").addEventListener("click", e => {
  const a = e.target.closest(".az-link");
  if (!a) return;
  e.preventDefault();
  busca.value = ""; tipoSel.value = ""; catSel.value = ""; faseSel.value = ""; favSel.checked = false; seloSel.value = "";   origemSel.value = "";
  const id = a.getAttribute("href").slice(1);
  render(id);
  document.getElementById(id).scrollIntoView({ behavior: "smooth" });
});
montarMenu();
montarSugestoes();
if (matchMedia("(hover:hover)").matches) busca.placeholder += " (tecle /)";
lerFiltrosUrl();
render();





document.getElementById("legenda-selos").innerHTML = Object.values(SELOS).map(s => `<li><span class="selo ${s.classe}">${s.icone} ${s.rotulo}</span></li>`).join("") + Object.values(ORIGENS).map(o => `<li><span class="selo ${o.classe}">${o.icone} ${o.rotulo}</span> <small>${o.dica}</small></li>`).join("");


mostrarAlertas(document.getElementById("alertas"));

/* Aviso das fichas atualizadas na coleta automática mais recente (fonte: revisao-pendente.js). O histórico completo fica em revisao.html. */
(function avisoAtualizados() {
  if (typeof REVISAO_PENDENTE === "undefined") return;
  const ultima = Object.values(REVISAO_PENDENTE).flat().map(x => x.data).sort().pop();
  if (!ultima) return;
  const recentes = Object.entries(REVISAO_PENDENTE)
    .map(([s, l]) => [porSlug(s), l.filter(x => x.data === ultima)])
    .filter(([p, l]) => p && l.length);
  if (!recentes.length) return;
  const caixa = document.createElement("details");
  caixa.className = "boas legenda-tipos";
  caixa.id = "atualizados-recentes";
  caixa.innerHTML = `<summary>🔄 <b>${esc(tr("Atualizadas recentemente"))}</b> (${recentes.length})</summary>
    <p><small>${esc(tr("Fichas atualizadas automaticamente na última coleta, em"))} ${esc(ultima)}.</small></p>
    <ul>${recentes.slice(0, 5).map(([p, l]) => `<li><a href="fichas/${esc(slug(p.nome))}.html"><b>${esc(p.nome)}</b></a> · ${esc(l[0].data)} — ${esc(notaAuto(l[0].texto))}</li>`).join("")}</ul>
    <p><a class="btn" href="revisao.html">${esc(tr("Ver mais"))}${recentes.length > 5 ? ` (+${recentes.length - 5})` : ""} →</a></p>`;
  document.getElementById("alertas").before(caixa);
})();
