montarLayout();
/* Zonas clicáveis sobre a silhueta (viewBox 200x360). */
const D = `fill="none" stroke="#fff" stroke-width="1" stroke-linecap="round" opacity=".8"`;
const ESP = s => `<g transform="translate(200 0) scale(-1 1)">${s}</g>`;
const RIM = `<path d="M80 138c-7-1-12 5-12 13s5 14 11 13c3-1 3-4 1-6-2-3-2-6 0-9 2-3 2-10 0-11z"/><path d="M78 146c-3 1-5 5-5 8M79 142c-4 0-7 4-7 9" ${D}/><path d="M81 150c1 2 1 4 0 6" fill="none" stroke="#7a3b8c" stroke-width="1.6"/>`;
const BICEPS = `<path d="M40 80c4-6 14-6 17 0 2 10 1 28-2 40-3 6-11 6-14 0-3-12-4-30-1-40z"/><path d="M44 84c-2 10-2 22 0 32M48 82c-1 12-1 26 1 38M52 84c0 10 0 22-2 32" ${D}/>`;
const OSSO = `<g transform="translate(-3 0)"><path d="M73 252a5 5 0 0 1 3-9 5 5 0 0 1 5 3h2a5 5 0 0 1 5-3 5 5 0 0 1 3 9v66a5 5 0 0 1-3 9 5 5 0 0 1-5-3h-2a5 5 0 0 1-5 3 5 5 0 0 1-3-9z"/><path d="M80 252v70M84 256v62" ${D}/><ellipse cx="82" cy="247" rx="6" ry="2.5" ${D}/><ellipse cx="82" cy="326" rx="6" ry="2.5" ${D}/></g>`;
const ZONAS = {
  cerebro: `<path d="M84 27c-3-10 5-19 16-19s19 9 16 19c1 6-4 11-10 10-3 3-9 3-12 0-6 1-11-4-10-10z"/><path d="M100 10v24" ${D}/><path d="M88 16c4 1 7 4 6 8M87 26c4-1 7 1 8 4M112 16c-4 1-7 4-6 8M113 26c-4-1-7 1-8 4M91 33c3-1 5 0 6 2M109 33c-3-1-5 0-6 2" ${D}/>`,
  hipofise: `<circle cx="100" cy="42" r="5.5"/><path d="M100 36v-3" fill="none" stroke="#c2185b" stroke-width="1.5"/>`,
  coracao: `<path d="M108 113c-12-9-17-15-17-21a8 8 0 0 1 17-3 8 8 0 0 1 17 3c0 6-5 12-17 21z"/><path d="M104 89c-1-6-1-11 1-15M112 89c1-6 3-10 7-12M100 98c4 3 9 3 12 0M108 100c-2 5-2 9 0 12" ${D}/>`,
  figado: `<path d="M66 120c0-6 8-9 20-9h22c4 0 6 3 5 6-2 9-12 17-26 17-12 0-21-5-21-14z"/><path d="M92 112c1 7 0 14-4 22M78 116c0 5-1 9-4 13" ${D}/><path d="M96 134c2 2 4 3 7 3" fill="none" stroke="#3b7a3b" stroke-width="2"/>`,
  estomago: `<path d="M106 114c8-3 20-1 22 8 2 10-5 18-14 18-8 0-12-6-9-10 2-3 5-2 5-6 0-4-6-4-8-5z"/><path d="M114 122c4 0 8 2 9 6M112 128c4 1 7 3 7 7M116 118c4-1 7 0 9 2" ${D}/>`,
  pancreas: `<path d="M80 147c8-6 20-7 32-4 6 2 11 0 14 3-2 6-9 8-16 7-12-2-22 2-30 1z"/><path d="M88 147c6-2 12-2 18 0M96 151c5-1 10 0 14 1M112 146c4 0 8 0 11 2" ${D}/>`,
  intestino: `<path d="M82 161c0-4 4-6 8-6h20c4 0 8 2 8 6v17c0 5-4 8-8 8H90c-4 0-8-3-8-8z"/><path d="M88 164c8 4 16-4 24 0M88 171c8 4 16-4 24 0M88 178c8 4 16-4 24 0" ${D}/><path d="M86 158v24M114 158v24" ${D} stroke-dasharray="2 3"/>`,
  gordura: `<ellipse cx="70" cy="178" rx="7" ry="14"/><ellipse cx="130" cy="178" rx="7" ry="14"/><circle cx="68" cy="174" r="2" ${D}/><circle cx="72" cy="182" r="2.4" ${D}/><circle cx="128" cy="174" r="2" ${D}/><circle cx="132" cy="182" r="2.4" ${D}/>`,
  rim: RIM + ESP(RIM),
  reprodutor: `<path d="M100 214c-6 0-9-4-9-9 0-5 3-9 9-14 6 5 9 9 9 14 0 5-3 9-9 9z"/><path d="M91 198c-8-2-12-1-16 3M109 198c8-2 12-1 16 3" fill="none" stroke="#7a3b8c" stroke-width="2"/><circle cx="73" cy="202" r="3.5"/><circle cx="127" cy="202" r="3.5"/><path d="M100 196v14" ${D}/>`,
  musculo: BICEPS + ESP(BICEPS),
  osso: OSSO + ESP(OSSO),
  pele: `<circle cx="46" cy="152" r="11"/><path d="M40 150c2-3 4-3 6 0s4 3 6 0M40 156c2-3 4-3 6 0s4 3 6 0" ${D}/>`,
  sangue: `<path d="M152 140c-8 12-12 18-12 24a12 12 0 0 0 24 0c0-6-4-12-12-24z"/><path d="M147 160c0 4 2 7 5 8" ${D}/>`
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
