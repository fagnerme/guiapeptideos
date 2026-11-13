montarLayout();
const conta = (arr, f) => arr.reduce((m, x) => (m.set(f(x), (m.get(f(x)) || 0) + 1), m), new Map());
function barras(id, mapa, ordem) {
  const total = PEPTIDES.length;
  const chaves = ordem || [...mapa.keys()].sort((a, b) => mapa.get(b) - mapa.get(a));
  document.getElementById(id).innerHTML = chaves.filter(k => mapa.get(k)).map(k => {
    const n = mapa.get(k), pct = Math.round(n / total * 100);
    return `<div class="barra-linha"><span class="barra-rot">${esc(k)}</span><span class="barra-trilho" role="img" aria-label="${n} de ${total}"><span class="barra-cheia" style="width:${pct}%"></span></span><span class="barra-num">${n} (${pct}%)</span></div>`;
  }).join("");
}
document.getElementById("resumo-est").textContent = tr(`${PEPTIDES.length} substâncias em ${new Set(PEPTIDES.map(p => p.categoria)).size} categorias.`);
barras("g-fase", conta(PEPTIDES, p => p.fase), FASES);
barras("g-selo", conta(PEPTIDES, p => { const s = seloDe(p); return s.icone + " " + s.rotulo; }));
barras("g-cat", conta(PEPTIDES, p => p.categoria));

snapshot().then(snap => {
  const itens = snap?.itens || {};
  document.getElementById("quando-est").textContent = snap?.geradoEm
    ? `Coleta automática mais recente: ${new Date(snap.geradoEm).toLocaleString(LOCALE)}. Conteúdo editorial revisado em ${dataBR(DATA_REVISAO)}.`
    : `Sem coleta automática disponível. Conteúdo editorial revisado em ${dataBR(DATA_REVISAO)}.`;
  document.querySelector("#tab-verif tbody").innerHTML = PEPTIDES.slice().sort((a, b) => a.nome.localeCompare(b.nome, "pt")).map(p => {
    const d = itens[slug(p.nome)];
    return `<tr><td><a href="${urlPeptideo(p.nome)}">${esc(p.nome)}</a></td><td>${esc(p.fase)}</td><td>${d?.quando ? new Date(d.quando).toLocaleDateString(LOCALE) : "—"}</td><td>${num(d?.ensaios ?? null)}</td><td>${num(d?.artigosAno ?? null)}</td></tr>`;
  }).join("");
});