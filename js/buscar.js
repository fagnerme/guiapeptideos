montarLayout();
const q = (new URLSearchParams(location.search).get("q") || "").trim();
const campo = document.getElementById("q");
campo.value = q;
const norm = s => semAcento(String(s).toLowerCase());
const semTags = h => h.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
const trecho = (t, ws) => {
  const n = norm(t), i = Math.max(0, Math.min(...ws.map(w => n.indexOf(w)).filter(x => x >= 0)));
  return (i > 40 ? "…" : "") + t.slice(Math.max(0, i - 40), i + 140) + (t.length > i + 140 ? "…" : "");
};

function buscar(texto) {
  const ws = norm(texto).split(/\s+/).filter(Boolean);
  const bate = campos => { const n = norm(campos.join(" ")); return ws.every(w => n.includes(w)); };
  return {
    ws,
    peptideos: PEPTIDES.filter(p => bate([p.nome, p.categoria, p.fase, p.status, p.mecanismo, p.oQueFaz, p.beneficios, p.riscos])),
    glossario: GLOSSARIO.filter(g => bate([g.termo, g.def])),
    licoes: LICOES.filter(l => bate([l.titulo, semTags(l.html)])),
    alegacoes: ALEGACOES.filter(a => bate([a.texto, a.explicacao])),
    mecanismos: MECANISMOS.filter(m => bate([m.nome, m.desc, m.alvo, m.peptideos.join(" ")])),
  };
}

function secao(titulo, itens) {
  return itens.length ? `<section class="boas"><h2>${titulo} (${itens.length})</h2><ul class="res-busca">${itens.join("")}</ul></section>` : "";
}

if (q.length < 2) {
  document.getElementById("resumo").textContent = "Digite pelo menos 2 letras para buscar.";
} else {
  const r = buscar(q);
  const total = r.peptideos.length + r.glossario.length + r.licoes.length + r.alegacoes.length + r.mecanismos.length;
  document.getElementById("resumo").textContent = `${total} resultado(s) para “${q}”`;
  document.getElementById("resultados").innerHTML = total ? [
    secao(tr("Substâncias"), r.peptideos.map(p => `<li><a href="${urlPeptideo(p.nome)}">${esc(p.nome)}</a> <span class="tag ${faseClasse(p.fase)}">${esc(p.fase)}</span><br><small>${esc(p.oQueFaz)}</small></li>`)),
    secao("Glossário", r.glossario.map(g => `<li><a href="index.html#glossario"><b>${esc(g.termo)}</b></a><br><small>${esc(trecho(g.def, r.ws))}</small></li>`)),
    secao("Lições", r.licoes.map(l => `<li><a href="aprender.html">${esc(l.titulo)}</a><br><small>${esc(trecho(semTags(l.html), r.ws))}</small></li>`)),
    secao("Alegações", r.alegacoes.map(a => `<li><a href="alegacoes.html#${a.id}">${esc(a.texto)}</a> — <small>${esc(VEREDITOS[a.veredito].rotulo)}</small></li>`)),
    secao("Mecanismos", r.mecanismos.map(m => `<li><a href="mecanismos.html#${m.id}">${esc(m.nome)}</a><br><small>${esc(m.desc)}</small></li>`)),
  ].join("") : `<p>${tr("Nenhum resultado. Tente outro termo (por exemplo, o nome da substância ou da condição).")}</p>`;
}