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
const CORPO = silhuetaBase();
const GRUPOS = [["🧠 Cabeça", ["cerebro", "hipofise"]], ["🫀 Tórax e abdômen", ["coracao", "figado", "estomago", "pancreas", "intestino", "rim"]], ["💪 Corpo todo", ["gordura", "musculo", "osso", "pele", "sangue", "reprodutor"]]];
const contar = o => new Set(Object.values(ALVOS).filter(a => a.orgaos.includes(o)).flatMap(a => a.peps)).size;
let sel = new URLSearchParams(location.search).get("o");
const svg = document.getElementById("corpo-svg"), painel = document.getElementById("corpo-painel"), botoes = document.getElementById("corpo-botoes"), dica = document.getElementById("corpo-dica");
svg.innerHTML = CORPO + Object.entries(ZONAS).map(([k, g]) => `<g class="zona-org" data-o="${k}" tabindex="0" role="button" aria-label="${esc(ORGAOS[k])}"><title>${esc(ORGAOS[k])}</title>${g}</g>`).join("");
const agrupados = new Set(GRUPOS.flatMap(g => g[1]));
const grupos = GRUPOS.concat([["Outros", Object.keys(ORGAOS).filter(k => !agrupados.has(k))]]).filter(g => g[1].some(k => ORGAOS[k]));
botoes.innerHTML = grupos.map(([t, ks]) => `<div class="corpo-grupo"><h3>${t}</h3><div class="corpo-btns">${ks.filter(k => ORGAOS[k]).map(k => `<button type="button" class="btn corpo-btn" data-o="${k}"><i class="ponto" data-o="${k}"></i>${esc(ORGAOS[k])} <small>${contar(k)}</small></button>`).join("")}</div></div>`).join("");
const textoDica = () => sel && ORGAOS[sel] ? `Selecionado: <b>${esc(ORGAOS[sel])}</b>` : "👆 Toque em um órgão";
const mostrarDica = o => { dica.innerHTML = o && ORGAOS[o] ? `<b>${esc(ORGAOS[o])}</b> · ${contar(o)} substâncias` : textoDica(); };
svg.addEventListener("pointerover", e => mostrarDica(e.target.closest("[data-o]")?.dataset.o));
svg.addEventListener("pointerleave", () => mostrarDica());
svg.addEventListener("focusin", e => mostrarDica(e.target.closest("[data-o]")?.dataset.o));
svg.addEventListener("focusout", () => mostrarDica());
function mostrar(o, rolar) {
  if (!ORGAOS[o]) { painel.innerHTML = `<p>${tr("Toque em um órgão no corpo, ou escolha na lista, para ver os alvos e as substâncias que agem nele.")}</p>`; mostrarDica(); return; }
  sel = o;
  document.querySelectorAll("[data-o]").forEach(e => e.classList.toggle("ativo", e.dataset.o === o));
  const al = Object.entries(ALVOS).filter(([, a]) => a.orgaos.includes(o));
  const peps = [...new Set(al.flatMap(([, a]) => a.peps))];
  painel.innerHTML = `<h3><i class="ponto" data-o="${o}"></i>${esc(ORGAOS[o])}</h3>
    <p><b>Alvos que atuam aqui:</b> ${al.map(([k, a]) => `<a class="chip-alvo" href="alvo.html?a=${k}">${esc(a.nome)}</a>`).join("")}</p>
    <p><b>${tr("Substâncias:")}</b> ${peps.length}</p><ul class="peps-alvo">${peps.map(s => `<li>${linkPep(s)} ${rotuloFase(s)}</li>`).join("") || "<li>Nenhum</li>"}</ul>
    <p><button type="button" class="btn" id="corpo-limpar">✕ Limpar seleção</button></p>
    <p><small>${tr("Mapa simplificado: uma substância pode agir em vários órgãos, e a posição é apenas ilustrativa.")}</small></p>`;
  mostrarDica();
  history.replaceState(null, "", "?o=" + o);
  if (rolar && matchMedia("(max-width:640px)").matches) painel.scrollIntoView({ behavior: "smooth", block: "start" });
}
document.addEventListener("click", e => {
  if (e.target.closest("#corpo-limpar")) { sel = null; document.querySelectorAll("[data-o]").forEach(x => x.classList.remove("ativo")); history.replaceState(null, "", "corpo.html"); mostrar(null); return; }
  const t = e.target.closest("[data-o]:not(.ponto)"); if (t) mostrar(t.dataset.o, true);
});
document.addEventListener("keydown", e => { if ((e.key === "Enter" || e.key === " ") && e.target.dataset && e.target.dataset.o) { e.preventDefault(); mostrar(e.target.dataset.o); } });
mostrar(sel);
