montarLayout();
const alvo = document.getElementById("conteudo");
function desenhar() {
  const itens = getFavs().map(porSlug).filter(Boolean);
  document.getElementById("pdf").hidden = !itens.length;
  alvo.innerHTML = itens.length ? itens.map(p => `
    <article class="folha">
      <h3><a href="${urlPeptideo(p.nome)}">${esc(p.nome)}</a>
        <button type="button" class="btn fav nao-imprimir" data-slug="${slug(p.nome)}">${rotuloFav(slug(p.nome))}</button></h3>
      <p><span class="tag">${esc(p.categoria)}</span> <span class="tag ${faseClasse(p.fase)}">${esc(p.fase)}</span> ${htmlSelo(p)}</p>
      <p><b>Status:</b> ${esc(p.status)}</p>
      ${secoesCompletas(p)}
    </article>`).join("") + `<p><small>Conteúdo educativo; revisado em ${dataBR(DATA_REVISAO)}. Não substitui orientação médica.</small></p>`
    : `<section class="boas"><p>Você ainda não tem favoritos. Use o botão ☆ nos cards do <a href="index.html">catálogo</a>.</p></section>`;
}
alvo.addEventListener("click", e => {
  const b = e.target.closest(".fav");
  if (b) { alternarFav(b.dataset.slug); desenhar(); }
});
document.getElementById("pdf").addEventListener("click", () => window.print());
desenhar();
mostrarAlertas(document.getElementById("alertas"));
