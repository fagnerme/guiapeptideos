montarLayout();
const lista = document.getElementById("lista-gl"), filtro = document.getElementById("filtro-gl");
const ordenados = GLOSSARIO.slice().sort((a, b) => a.termo.localeCompare(b.termo, "pt"));
const inicial = t => semAcento(t.trim()[0] || "#").toUpperCase();
let nav = document.getElementById("letras-gl");
if (!nav) { nav = document.createElement("nav"); nav.id = "letras-gl"; nav.className = "letras"; nav.setAttribute("aria-label", "Ir para a letra"); lista.before(nav); }
function desenhar() {
  const q = semAcento(filtro.value.toLowerCase().trim());
  const itens = ordenados.filter(g => !q || semAcento((g.termo + " " + g.def).toLowerCase()).includes(q));
  const presentes = new Set(itens.map(g => inicial(g.termo)));
  nav.innerHTML = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("").map(l => presentes.has(l) ? `<a href="#letra-${l}">${l}</a>` : `<span aria-hidden="true">${l}</span>`).join("");
  let atual = "";
  lista.innerHTML = itens.map(g => {
    const l = inicial(g.termo), cab = l !== atual ? `<h3 class="letra-titulo" id="letra-${l}">${l}</h3>` : "";
    atual = l;
    return `${cab}<dt><a href="termo.html?t=${slug(g.termo)}">${esc(g.termo)}</a></dt><dd>${esc(g.def)}</dd>`;
  }).join("") || "<p>Nenhum termo encontrado.</p>";
}
filtro.addEventListener("input", desenhar);
desenhar();