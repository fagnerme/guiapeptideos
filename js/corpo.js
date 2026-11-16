montarLayout();
/* Zonas clicáveis sobre a silhueta (viewBox 200x360). */
const ZONAS = {
  cerebro: `<ellipse cx="100" cy="24" rx="16" ry="12"/>`, hipofise: `<circle cx="100" cy="41" r="5"/>`,
  coracao: `<ellipse cx="108" cy="98" rx="10" ry="11"/>`, figado: `<ellipse cx="84" cy="125" rx="17" ry="9"/>`,
  estomago: `<ellipse cx="114" cy="128" rx="12" ry="9"/>`, pancreas: `<ellipse cx="100" cy="146" rx="19" ry="5"/>`,
  intestino: `<rect x="82" y="156" width="36" height="28" rx="12"/>`, gordura: `<ellipse cx="70" cy="178" rx="7" ry="14"/><ellipse cx="130" cy="178" rx="7" ry="14"/>`,
  rim: `<ellipse cx="80" cy="150" rx="6" ry="9"/><ellipse cx="120" cy="150" rx="6" ry="9"/>`,
  reprodutor: `<ellipse cx="100" cy="205" rx="14" ry="9"/>`, musculo: `<rect x="40" y="76" width="16" height="44" rx="8"/><rect x="144" y="76" width="16" height="44" rx="8"/>`,
  osso: `<rect x="72" y="250" width="14" height="80" rx="7"/><rect x="114" y="250" width="14" height="80" rx="7"/>`,
  pele: `<circle cx="48" cy="150" r="9"/>`, sangue: `<path d="M152 140c-8 12-12 18-12 24a12 12 0 0 0 24 0c0-6-4-12-12-24z"/>`
};
const CORPO = `<circle class="corpo" cx="100" cy="30" r="22"/><rect class="corpo" x="90" y="50" width="20" height="14"/>
  <path class="corpo" d="M64 64h72l6 10v118c0 14-6 30-8 40H66c-2-10-8-26-8-40V74z"/>
  <rect class="corpo" x="38" y="70" width="22" height="100" rx="11"/><rect class="corpo" x="140" y="70" width="22" height="100" rx="11"/>
  <rect class="corpo" x="68" y="226" width="30" height="124" rx="14"/><rect class="corpo" x="102" y="226" width="30" height="124" rx="14"/>`;
let sel = new URLSearchParams(location.search).get("o");
const svg = document.getElementById("corpo-svg"), painel = document.getElementById("corpo-painel"), botoes = document.getElementById("corpo-botoes");
svg.innerHTML = CORPO + Object.entries(ZONAS).map(([k, g]) => `<g class="zona-org" data-o="${k}" tabindex="0" role="button" aria-label="${esc(ORGAOS[k])}"><title>${esc(ORGAOS[k])}</title>${g}</g>`).join("");
botoes.innerHTML = Object.entries(ORGAOS).map(([k, n]) => `<button type="button" class="btn" data-o="${k}">${esc(n)}</button>`).join("");
function mostrar(o) {
  if (!ORGAOS[o]) { painel.innerHTML = `<p>${tr("Toque em um órgão no corpo, ou escolha na lista, para ver os alvos e as substâncias que agem nele.")}</p>`; return; }
  sel = o;
  document.querySelectorAll("[data-o]").forEach(e => e.classList.toggle("ativo", e.dataset.o === o));
  const al = Object.entries(ALVOS).filter(([, a]) => a.orgaos.includes(o));
  const peps = [...new Set(al.flatMap(([, a]) => a.peps))];
  painel.innerHTML = `<h3>${esc(ORGAOS[o])}</h3>
    <p><b>Alvos que atuam aqui:</b> ${al.map(([k, a]) => `<a class="chip-alvo" href="alvo.html?a=${k}">${esc(a.nome)}</a>`).join("")}</p>
    <p><b>${tr("Substâncias:")}</b> ${peps.length}</p><ul class="peps-alvo">${peps.map(s => `<li>${linkPep(s)} ${rotuloFase(s)}</li>`).join("") || "<li>Nenhum</li>"}</ul>
    <p><small>${tr("Mapa simplificado: uma substância pode agir em vários órgãos, e a posição é apenas ilustrativa.")}</small></p>`;
  history.replaceState(null, "", "?o=" + o);
}
document.addEventListener("click", e => { const t = e.target.closest("[data-o]"); if (t) mostrar(t.dataset.o); });
document.addEventListener("keydown", e => { if ((e.key === "Enter" || e.key === " ") && e.target.dataset && e.target.dataset.o) { e.preventDefault(); mostrar(e.target.dataset.o); } });
mostrar(sel);
