montarLayout();
snapshot().then(snap => {
  const itens = snap?.itens || {};
  const linhas = PEPTIDES.map(p => ({ p, a: itens[slug(p.nome)]?.alertas })).filter(x => x.a?.total)
    .sort((x, y) => (y.a.recentes[0]?.data || "").localeCompare(x.a.recentes[0]?.data || ""));
  document.getElementById("resumo-alertas").innerHTML = snap
    ? `<span>${tr("Itens com recalls nos últimos 3 anos:")}</span> <b>${linhas.length}</b><span>.</span> <span>${tr("Coleta de")}</span> <time>${new Date(snap.geradoEm).toLocaleDateString(LOCALE)}</time><span>.</span>`
    : tr("Dados de alertas indisponíveis no momento.");
  document.getElementById("lista-alertas").innerHTML = linhas.map(({ p, a }) => `<article class="card" id="${slug(p.nome)}">
    <h3><a href="${urlPeptideo(p.nome)}">${esc(p.nome)}</a> <span class="tag">${a.total} recall(s)</span></h3>
    <ul class="recalls">${a.recentes.map(r => `<li><b>${esc(r.data)}</b> · ${esc(r.classe)} · ${esc(r.empresa)}<br><small>${esc(r.motivo)}</small></li>`).join("")}</ul></article>`).join("")
    || (snap ? "<p>Nenhum recall encontrado.</p>" : "");
});