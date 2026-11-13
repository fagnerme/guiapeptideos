montarLayout();
const mapa = document.getElementById("mapa");
const detalhe = document.getElementById("detalhe");
const GRUPOS = MECANISMOS;

mapa.innerHTML = GRUPOS.map(m => `<button type="button" class="no-mapa" data-id="${m.id}" aria-pressed="false"><b>${esc(m.nome)}</b><small>${m.peptideos.length} substâncias</small></button>`).join("");

function mostrar(id) {
  const m = GRUPOS.find(x => x.id === id) || GRUPOS[0];
  mapa.querySelectorAll(".no-mapa").forEach(b => { const on = b.dataset.id === m.id; b.classList.toggle("ativo", on); b.setAttribute("aria-pressed", on); });
  detalhe.innerHTML = `<h2>${esc(m.nome)}</h2>
    <p><b>Alvo principal:</b> ${esc(m.alvo)}</p>
    <p>${esc(m.desc)}</p>
    <ul class="chips">${m.peptideos.map(n => { const p = PEPTIDES.find(x => x.nome === n); return p ? `<li><a href="${urlPeptideo(n)}">${esc(n)}</a> <span class="tag ${faseClasse(p.fase)}">${esc(p.fase)}</span></li>` : ""; }).join("")}</ul>`;
  history.replaceState(null, "", "#" + m.id);
}
mapa.addEventListener("click", e => { const b = e.target.closest(".no-mapa"); if (b) mostrar(b.dataset.id); });
mostrar(location.hash.slice(1));