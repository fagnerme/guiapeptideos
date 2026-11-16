montarLayout();
const manuais = Object.entries(TIMELINE).flatMap(([nome, ms]) => ms.map(([ano, txt]) => ({ ano, nome, txt })));
const catalogo = new Set(Object.keys(TIMELINE).concat(PEPTIDES.map(p => p.nome)));
const automaticos = [...catalogo].flatMap(nome => marcosOficiais(nome).map(m => ({ ano: +m.data.slice(0, 4), data: m.data, nome, txt: m.txt, auto: m.fonte, atualizado: m.atualizado })));
const eventos = manuais.concat(automaticos)
  .sort((a, b) => a.ano - b.ano || (a.data || "").localeCompare(b.data || "") || a.nome.localeCompare(b.nome, "pt"));
const porAno = {};
eventos.forEach(e => (porAno[e.ano] ||= []).push(e));
document.getElementById("conteudo").innerHTML = `<p><small>Marcos cadastrados e datas oficiais lidas das fontes (FDA, EMA, Health Canada, ClinicalTrials.gov), atualizadas a cada coleta semanal.</small></p><div class="timeline">` + Object.entries(porAno).map(([ano, es]) =>
  `<section class="t-ano"><h3>${ano}</h3><ul>${es.map(e => `<li><a href="${urlPeptideo(e.nome)}">${esc(e.nome)}</a>: ${e.auto ? `<b>${e.auto} · ${dataMarco(e.data)}</b> — ` : ""}<span>${esc(e.txt)}</span>${e.auto && e.atualizado ? ` <small>(${tr("atualizado automaticamente em")} ${new Date(e.atualizado).toLocaleDateString(LOCALE)})</small>` : ""}</li>`).join("")}</ul></section>`).join("") + `</div>`;
