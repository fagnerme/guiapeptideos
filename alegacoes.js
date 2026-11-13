montarLayout();
const filtro = document.getElementById("filtro-vered");
const lista = document.getElementById("lista-alegacoes");
let atual = "";
filtro.innerHTML = `<button type="button" class="btn" data-v="">Todas</button>` +
  Object.entries(VEREDITOS).map(([k, v]) => `<button type="button" class="btn" data-v="${k}">${v.icone} ${v.rotulo}</button>`).join("");

function desenhar() {
  filtro.querySelectorAll("button").forEach(b => b.setAttribute("aria-pressed", b.dataset.v === atual));
  lista.innerHTML = ALEGACOES.filter(a => !atual || a.veredito === atual).map(a => {
    const v = VEREDITOS[a.veredito];
    const pep = a.pep ? ` · <a href="${urlPeptideo(a.pep)}">${esc(a.pep)}</a>` : "";
    return `<article class="card alegacao" id="${a.id}">
      <h3>${esc(a.texto)}</h3>
      <p><span class="veredito ${v.classe}">${v.icone} ${v.rotulo}</span></p>
      <p>${comGlossario(a.explicacao)}</p>
      <p><small>Termos: ${a.termos.map(t => `<a href="termo.html?t=${slug(t)}">${esc(t)}</a>`).join(", ")}${pep}</small></p>
    </article>`;
  }).join("");
}
filtro.addEventListener("click", e => { const b = e.target.closest("button"); if (b) { atual = b.dataset.v; desenhar(); } });
desenhar();
if (location.hash) document.getElementById(location.hash.slice(1))?.scrollIntoView();