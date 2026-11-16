montarLayout();
const g = GLOSSARIO.find(x => slug(x.termo) === new URLSearchParams(location.search).get("t"));
const alvo = document.getElementById("termo-conteudo");
const semTags = h => h.replace(/<[^>]+>/g, " ");
if (!g) {
  seoNaoIndexar();
  alvo.innerHTML = `<h2>Termo não encontrado</h2><p><a href="glossario.html">Ver o glossário completo</a></p>`;
} else {
  document.title = `${g.termo}: o que significa | Guia Educativo de Peptídeos, Hormônios e Suplementos`;
  document.querySelector('meta[name="description"]').content = `${g.termo}: ${g.def}`.slice(0, 300);
  document.getElementById("mig-termo").textContent = g.termo;
  seoAtualizar("termo.html?t=" + new URLSearchParams(location.search).get("t"), [
    { "@type": "DefinedTerm", name: g.termo, description: g.def, inLanguage: "pt-BR", inDefinedTermSet: "Gloss\u00e1rio do Guia Educativo de Pept\u00eddeos, Horm\u00f4nios e Suplementos" }
  ]);
  const n = semAcento(g.termo.toLowerCase());
  const bate = txt => semAcento(txt.toLowerCase()).includes(n);
  const peps = PEPTIDES.filter(p => bate([p.mecanismo, p.evidencia, p.riscos, p.oQueFaz, p.status, p.beneficios].join(" ")));
  const licoes = LICOES.filter(l => bate(l.titulo + " " + semTags(l.html)));
  const alegs = ALEGACOES.filter(a => a.termos.includes(g.termo));
  const outros = GLOSSARIO.filter(x => x !== g).slice().sort((a, b) => a.termo.localeCompare(b.termo, "pt"));
  alvo.innerHTML = `<h2>${esc(g.termo)}</h2>
    <p class="def-termo">${esc(g.def)}</p>
    ${peps.length ? `<h3>Peptídeos que mencionam este termo (${peps.length})</h3><ul class="chips">${peps.slice(0, 12).map(p => `<li><a href="${urlPeptideo(p.nome)}">${esc(p.nome)}</a></li>`).join("")}${peps.length > 12 ? `<li>e mais ${peps.length - 12}</li>` : ""}</ul>` : ""}
    ${licoes.length ? `<h3>Lições relacionadas</h3><ul>${licoes.map(l => `<li><a href="aprender.html">${esc(l.titulo)}</a></li>`).join("")}</ul>` : ""}
    ${alegs.length ? `<h3>Alegações relacionadas</h3><ul>${alegs.map(a => `<li><a href="alegacoes.html#${a.id}">${esc(a.texto)}</a></li>`).join("")}</ul>` : ""}
    <h3>Outros termos</h3><p>${outros.map(x => `<a href="termo.html?t=${slug(x.termo)}">${esc(x.termo)}</a>`).join(" · ")}</p>`;
}