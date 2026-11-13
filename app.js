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
document.getElementById("legenda-tipos").innerHTML = Object.values(TIPOS).map(s => `<li><b>${s.icone} ${esc(tr(s.rotulo))}:</b> ${esc(tr(s.def))}</li>`).join("");
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
    (!q || (p.nome + " " + p.mecanismo + " " + p.categoria + " " + tipoDe(p).rotulo + " " + p.status).toLowerCase().includes(q))
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
      <h3><a href="${urlPeptideo(p.nome)}">${esc(p.nome)}</a> <button type="button" class="fav" data-slug="${slug(p.nome)}" aria-label="Favoritar">${rotuloFav(slug(p.nome))}</button></h3>
      <p><span class="tag tag-tipo" title="${esc(tr(tipoDe(p).def))}">${tipoDe(p).icone} ${esc(tr(tipoDe(p).rotulo))}</span> <span class="tag">${esc(p.categoria)}</span> <span class="tag ${faseClasse(p.fase)}">${esc(p.fase)}</span></p>
      <p>${htmlSelo(p)}</p>
      <p><b>Status:</b> ${esc(p.status)}</p>
      <p><b>Aprovado em:</b> ${htmlLocais(p)}</p>
      <p class="resumo">${esc(facil ? explicaFacil(p) : p.oQueFaz)}</p>
      <p class="acoes"><a class="btn btn-prim" href="${urlPeptideo(p.nome)}">Ver detalhes →</a> <a class="btn" href="comparar.html?a=${slug(p.nome)}">⚖️ Comparar</a>${p.fase === "Aprovado" ? ' <a class="btn" href="calculadora.html">🧮 Calculadora</a>' : ""}</p>
    </article>`).join("") : `<p>${tr("Nenhum resultado.")}</p><p><small>${tr("Tente outro termo ou limpe os filtros.")}</small></p><p><button type="button" class="btn btn-prim" id="limpar-filtros">${tr("Limpar filtros")}</button></p>`;
  paginacao.hidden = exibidos.length >= itens.length;
  carregarMais.textContent = tr("Carregar mais");
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
render();





document.getElementById("legenda-selos").innerHTML = Object.values(SELOS).map(s => `<li><span class="selo ${s.classe}">${s.icone} ${s.rotulo}</span></li>`).join("") + Object.values(ORIGENS).map(o => `<li><span class="selo ${o.classe}">${o.icone} ${o.rotulo}</span> <small>${o.dica}</small></li>`).join("");


mostrarAlertas(document.getElementById("alertas"));

/* Aviso de fichas atualizadas automaticamente nos últimos 30 dias (fonte: revisao-pendente.js). */
(function avisoAtualizados() {
  if (typeof REVISAO_PENDENTE === "undefined") return;
  const limite = Date.now() - 30 * 864e5;
  const recentes = Object.entries(REVISAO_PENDENTE)
    .map(([s, l]) => [porSlug(s), l.filter(x => Date.parse(x.data) >= limite).sort((a, b) => b.data.localeCompare(a.data))])
    .filter(([p, l]) => p && l.length)
    .sort((a, b) => b[1][0].data.localeCompare(a[1][0].data));
  if (!recentes.length) return;
  const caixa = document.createElement("details");
  caixa.className = "boas legenda-tipos";
  caixa.id = "atualizados-recentes";
  caixa.innerHTML = `<summary>🔄 <b>${esc(tr("Atualizadas recentemente"))}</b> (${recentes.length})</summary>
    <p><small>${esc(tr("Fichas atualizadas automaticamente nos últimos 30 dias a partir das fontes oficiais."))}</small></p>
    <ul>${recentes.slice(0, 6).map(([p, l]) => `<li><a href="ficha-${esc(slug(p.nome))}.html"><b>${esc(p.nome)}</b></a> · ${esc(l[0].data)} — ${esc(notaAuto(l[0].texto))}</li>`).join("")}</ul>
    <p><a href="revisao.html">${esc(tr("Ver todas as atualizações"))} →</a></p>`;
  document.getElementById("alertas").before(caixa);
})();
