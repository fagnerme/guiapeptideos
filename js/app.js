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
const ITENS_POR_PAGINA = 36;
/* Seleção para comparar: até 3 itens marcados nos cards; a barra fixa abre a comparação. */
const selComparar = new Set();
const barraCmp = document.createElement("div");
barraCmp.id = "barra-comparar";
barraCmp.hidden = true;
document.body.appendChild(barraCmp);
function atualizarBarraCmp() {
  barraCmp.hidden = !selComparar.size;
  const nomes = [...selComparar].map(s => esc(porSlug(s)?.nome || s));
  const href = "comparar.html?" + [...selComparar].map((s, i) => "abc"[i] + "=" + s).join("&");
  barraCmp.innerHTML = `<span><b>${tr("Comparar")}:</b> ${nomes.join(" · ")}${selComparar.size < 2 ? ` <small>(${tr("marque mais 1")})</small>` : ""}</span>
    ${selComparar.size >= 2 ? `<a class="btn btn-prim" href="${href}">${tr("Comparar agora")} →</a>` : ""}
    <button type="button" class="btn" id="cmp-limpar">${tr("Limpar")}</button>`;
}
barraCmp.addEventListener("click", e => { if (e.target.id === "cmp-limpar") { selComparar.clear(); lista.querySelectorAll(".cmp").forEach(c => { c.checked = false; }); atualizarBarraCmp(); } });
lista.addEventListener("change", e => {
  const c = e.target.closest(".cmp");
  if (!c) return;
  if (c.checked && selComparar.size >= 3) { c.checked = false; return; }
  c.checked ? selComparar.add(c.dataset.slug) : selComparar.delete(c.dataset.slug);
  atualizarBarraCmp();
});
let limiteVisivel = ITENS_POR_PAGINA;
Object.entries(TIPOS).forEach(([k, s]) => { const o = document.createElement("option"); o.value = k; o.textContent = `${s.icone} ${s.rotulo}`; tipoSel.appendChild(o); });
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
    (!q || casaBusca(p, q))
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
      ${marcasDe(p).length ? `<p class="card-marcas"><small>${tr("Nomes comerciais")}: ${esc(marcasDe(p).slice(0, 4).join(", "))}${marcasDe(p).length > 4 ? "…" : ""}</small></p>` : ""}
      ${p.combo ? `<p class="card-marcas"><small>💊+💊 <b>${tr("Associação")}</b>: ${esc(p.combo.map(s => porSlug(s)?.nome).filter(Boolean).concat(p.outrosAtivos).join(" + "))}</small></p>` : ""}
      ${p._assoc ? `<p class="card-marcas"><small>💊+💊 ${tr("Em associações")}: ${esc(p._assoc.slice(0, 3).join(", "))}${p._assoc.length > 3 ? "…" : ""}</small></p>` : ""}
      <p class="card-locais">${htmlLocais(p, false)}</p>
      <p class="resumo">${esc(facil ? explicaFacil(p) : p.oQueFaz)}</p>
      <details class="card-detalhes">
        <summary>Detalhes regulatórios e estudos</summary>
        ${htmlLocais(p, true)}
      </details>
      <p class="acoes"><a class="btn btn-prim" href="${urlPeptideo(p.nome)}">Ver detalhes →</a> <label class="btn cmp-sel"><input type="checkbox" class="cmp" data-slug="${slug(p.nome)}"${selComparar.has(slug(p.nome)) ? " checked" : ""}> ⚖️ ${tr("Comparar")}</label>${p.fase === "Aprovado" && !p._med ? ' <a class="btn" href="calculadora.html">🧮 Calculadora</a>' : ""}</p>
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
  const fechar = () => { sug.hidden = true; ativo = -1; };
  const marcar = i => { [...sug.children].forEach((li, k) => li.classList.toggle("ativo", k === i)); ativo = i; };
  busca.addEventListener("input", () => {
    const ws = norm(busca.value).split(/\s+/).filter(Boolean);
    if (!ws.length) return fechar();
    const achados = PEPTIDES.map(p => ({ p, n: buscaNome(p) }))
      .filter(x => casaBusca(x.p, busca.value, false))
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

/* Filtro rápido por tipo, logo abaixo da busca: um clique filtra, outro clique no mesmo tipo (ou em "Todos") limpa. */
(function chipsTipo() {
  const box = document.getElementById("chips-tipo");
  if (!box) return;
  const marcar = () => box.querySelectorAll("[data-tipo]").forEach(b => b.classList.toggle("ativo", b.dataset.tipo === tipoSel.value));
  box.innerHTML = [`<button type="button" class="chip-filtro" data-tipo="">${esc(tr("Todos"))}</button>`]
    .concat(Object.entries(TIPOS).map(([k, s]) => `<button type="button" class="chip-filtro" data-tipo="${k}">${s.icone} ${esc(tr(s.rotulo))}</button>`)).join(" ");
  box.addEventListener("click", e => {
    const b = e.target.closest("[data-tipo]");
    if (!b) return;
    tipoSel.value = b.dataset.tipo === tipoSel.value ? "" : b.dataset.tipo;
    limiteVisivel = ITENS_POR_PAGINA;
    render();
    const alvo = document.getElementById("contagem");
    if (alvo) alvo.scrollIntoView({ behavior: "smooth", block: "start" });
  });
  tipoSel.addEventListener("change", marcar);
  box.addEventListener("click", marcar);
  marcar();
})();
montarSugestoes();
if (matchMedia("(hover:hover)").matches) busca.placeholder += " (tecle /)";
lerFiltrosUrl();
render();





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
    <p class="atual-sub">${esc(tr("Fichas com novidades nas fontes públicas na última coleta automática, em"))} <b>${esc(dataMarco(ultima))}</b>.</p>
    <ul class="atual-lista">${recentes.slice(0, 5).map(([p, l]) => {
      const x = l[0], ct = /estudos \d+ → (\d+).*recrutando \d+ → (\d+)/.exec(x.texto);
      const frase = ct ? `${ct[1]} ${tr("estudos registrados")}, ${ct[2]} ${tr("recrutando agora")}` : notaAuto(x.texto);
      return `<li><a href="${esc(urlPeptideo(p.nome))}"><b>${esc(p.nome)}</b></a><span>${esc(frase)}</span></li>`;
    }).join("")}</ul>
    <p><a class="btn" href="revisao.html">${esc(tr("Ver mais"))}${recentes.length > 5 ? ` (+${recentes.length - 5})` : ""} →</a></p>`;
  document.getElementById("alertas").before(caixa);
})();
