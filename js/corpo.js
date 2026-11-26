montarLayout();
/* Zonas clicáveis sobre a silhueta (viewBox 200x360). */
const ZONAS = {
  cerebro: `<ellipse cx="100" cy="24" rx="16" ry="12"/>`, hipofise: `<circle cx="100" cy="41" r="7"/>`,
  coracao: `<ellipse cx="108" cy="98" rx="12" ry="13"/>`, figado: `<ellipse cx="84" cy="125" rx="17" ry="9"/>`,
  estomago: `<ellipse cx="114" cy="128" rx="12" ry="9"/>`, pancreas: `<ellipse cx="100" cy="146" rx="20" ry="7"/>`,
  intestino: `<rect x="82" y="156" width="36" height="28" rx="12"/>`, gordura: `<ellipse cx="70" cy="178" rx="7" ry="14"/><ellipse cx="130" cy="178" rx="7" ry="14"/>`,
  rim: `<ellipse cx="78" cy="150" rx="8" ry="11"/><ellipse cx="122" cy="150" rx="8" ry="11"/>`,
  reprodutor: `<ellipse cx="100" cy="205" rx="14" ry="9"/>`, musculo: `<rect x="40" y="76" width="16" height="44" rx="8"/><rect x="144" y="76" width="16" height="44" rx="8"/>`,
  osso: `<rect x="72" y="250" width="14" height="80" rx="7"/><rect x="114" y="250" width="14" height="80" rx="7"/>`,
  pele: `<circle cx="46" cy="152" r="11"/>`, sangue: `<path d="M152 140c-8 12-12 18-12 24a12 12 0 0 0 24 0c0-6-4-12-12-24z"/>`
};
const CORPO = silhuetaBase();
const GRUPOS = [["🧠 Cabeça", ["cerebro", "hipofise"]], ["🫀 Tórax e abdômen", ["coracao", "figado", "estomago", "pancreas", "intestino", "rim"]], ["💪 Corpo todo", ["gordura", "musculo", "osso", "pele", "sangue", "reprodutor"]]];
const contar = o => new Set(Object.values(ALVOS).filter(a => a.orgaos.includes(o)).flatMap(a => a.peps)).size;
let sel = new URLSearchParams(location.search).get("o");
const svg = document.getElementById("corpo-svg"), painel = document.getElementById("corpo-painel"), botoes = document.getElementById("corpo-botoes"), dica = document.getElementById("corpo-dica");
svg.innerHTML = CORPO + Object.entries(ZONAS).map(([k, g]) => `<g class="zona-org" data-o="${k}" tabindex="0" role="button" aria-label="${esc(ORGAOS[k])}"><title>${esc(ORGAOS[k])}</title>${g}</g>`).join("");
const agrupados = new Set(GRUPOS.flatMap(g => g[1]));
const grupos = GRUPOS.concat([["Outros", Object.keys(ORGAOS).filter(k => !agrupados.has(k))]]).filter(g => g[1].some(k => ORGAOS[k]));
botoes.innerHTML = `<label for="corpo-sel" class="corpo-sel-rot">${tr("Escolha o órgão")}</label><select id="corpo-sel" class="corpo-sel"><option value="">${tr("— Selecione um órgão —")}</option>${grupos.map(([t, ks]) => `<optgroup label="${esc(t)}">${ks.filter(k => ORGAOS[k]).map(k => `<option value="${k}">${esc(ORGAOS[k])} (${contar(k)})</option>`).join("")}</optgroup>`).join("")}</select>`;
const selOrg = document.getElementById("corpo-sel");
selOrg.addEventListener("change", () => selOrg.value ? mostrar(selOrg.value, true) : limpar());
const textoDica = () => sel && ORGAOS[sel] ? `Selecionado: <b>${esc(ORGAOS[sel])}</b>` : "👆 Toque em um órgão";
const mostrarDica = o => { dica.innerHTML = o && ORGAOS[o] ? `<b>${esc(ORGAOS[o])}</b> · ${contar(o)} substâncias` : textoDica(); };
svg.addEventListener("pointerover", e => mostrarDica(e.target.closest("[data-o]")?.dataset.o));
svg.addEventListener("pointerleave", () => mostrarDica());
svg.addEventListener("focusin", e => mostrarDica(e.target.closest("[data-o]")?.dataset.o));
svg.addEventListener("focusout", () => mostrarDica());
function mostrar(o, rolar) {
  if (!ORGAOS[o]) { painel.innerHTML = `<p>${tr("Toque em um órgão no corpo, ou escolha na lista, para ver os alvos e as substâncias que agem nele.")}</p>`; mostrarDica(); return; }
  sel = o; selOrg.value = o;
  document.querySelectorAll("[data-o]").forEach(e => e.classList.toggle("ativo", e.dataset.o === o));
  const al = Object.entries(ALVOS).filter(([, a]) => a.orgaos.includes(o));
  const peps = [...new Set(al.flatMap(([, a]) => a.peps))];
  const alvosHtml = al.map(([k, a]) => `<a class="chip-alvo" href="alvo.html?a=${k}">${esc(a.nome)}</a>`).join("");
  painel.innerHTML = `<div class="corpo-cab"><h3><i class="ponto" data-o="${o}"></i>${esc(ORGAOS[o])}</h3><button type="button" class="btn corpo-limpar" id="corpo-limpar">✕ ${tr("Limpar")}</button></div>
    ${al.length > 5 ? `<details class="corpo-alvos"><summary><b>${tr("Alvos que atuam aqui")}</b> (${al.length})</summary><p>${alvosHtml}</p></details>` : `<p><b>${tr("Alvos que atuam aqui:")}</b> ${alvosHtml}</p>`}
    <div class="corpo-filtro"><input type="search" id="corpo-q" placeholder="${esc(tr("Filtrar substâncias"))}" aria-label="${esc(tr("Filtrar substâncias"))}" autocomplete="off">
      <select id="corpo-fase" aria-label="${esc(tr("Situação"))}"><option value="">${tr("Todas")}</option><option value="ap">${tr("Aprovadas")}</option><option value="est">${tr("Em estudo")}</option></select></div>
    <p class="corpo-cont" id="corpo-cont" aria-live="polite"></p>
    <ul class="peps-alvo peps-grade" id="corpo-lista">${peps.map(s => `<li data-s="${esc(semAcento(nomeDe(s).toLowerCase()))}" data-f="${/aprovad/i.test((porSlug(s) || {}).fase || "") ? "ap" : "est"}">${linkPep(s)} ${rotuloFase(s)}</li>`).join("") || "<li>Nenhum</li>"}</ul>
    <p class="corpo-voltar"><a href="#corpo-svg" class="btn">↑ ${tr("Voltar ao mapa")}</a></p><p><small>${tr("Mapa simplificado: uma substância pode agir em vários órgãos, e a posição é apenas ilustrativa.")}</small></p>`;
  const q = document.getElementById("corpo-q"), fs = document.getElementById("corpo-fase"), cont = document.getElementById("corpo-cont");
  const filtrar = () => {
    const t = semAcento(q.value.trim().toLowerCase()); let n = 0;
    painel.querySelectorAll("#corpo-lista li[data-s]").forEach(li => { const ok = li.dataset.s.includes(t) && (!fs.value || li.dataset.f === fs.value); li.hidden = !ok; if (ok) n++; });
    cont.textContent = `${n} ${tr("de")} ${peps.length} ${tr("substâncias")}`;
  };
  q.addEventListener("input", filtrar); fs.addEventListener("change", filtrar); filtrar();
  svg.classList.add("tem-sel");
  mostrarDica();
  history.replaceState(null, "", "?o=" + o);
  if (rolar && painel.getBoundingClientRect().top > innerHeight * 0.6) painel.scrollIntoView({ behavior: "smooth", block: "start" });
}
function limpar() { sel = null; selOrg.value = ""; svg.classList.remove("tem-sel"); document.querySelectorAll("[data-o]").forEach(x => x.classList.remove("ativo")); history.replaceState(null, "", "corpo.html"); mostrar(null); }
document.addEventListener("click", e => {
  if (e.target.closest("#corpo-limpar")) { limpar(); return; }
  const t = e.target.closest("[data-o]:not(.ponto)"); if (t) mostrar(t.dataset.o, true);
});
document.addEventListener("keydown", e => { if ((e.key === "Enter" || e.key === " ") && e.target.dataset && e.target.dataset.o) { e.preventDefault(); mostrar(e.target.dataset.o); } });
mostrar(sel);
