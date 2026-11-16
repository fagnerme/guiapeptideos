montarLayout();
const eventos = Object.entries(TIMELINE).flatMap(([nome, ms]) => ms.map(([ano, txt]) => ({ ano, nome, txt })))
  .sort((a, b) => a.ano - b.ano || a.nome.localeCompare(b.nome, "pt"));
const porAno = {};
eventos.forEach(e => (porAno[e.ano] ||= []).push(e));
document.getElementById("conteudo").innerHTML = `<div class="timeline">` + Object.entries(porAno).map(([ano, es]) =>
  `<section class="t-ano"><h3>${ano}</h3><ul>${es.map(e => `<li><a href="${urlPeptideo(e.nome)}">${esc(e.nome)}</a>: <span>${esc(e.txt)}</span></li>`).join("")}</ul></section>`).join("") + `</div>`;
