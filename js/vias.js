/* Seção "Vias de administração" e ilustração dos locais de aplicação (só aprovados injetáveis). */
function silhueta(costas, locais) {
  const on = z => locais.includes(z) ? "zona on" : "zona";
  const corpo = silhuetaBase();
  const zonas = costas
    ? `<path d="M100 60V222" class="coluna"/><ellipse cx="81" cy="222" rx="19" ry="16" class="${on("gluteo")}"/><ellipse cx="119" cy="222" rx="19" ry="16" class="${on("gluteo")}"/>`
    : `<ellipse cx="100" cy="172" rx="30" ry="22" class="${on("abd")}"/><circle cx="100" cy="174" r="3.5" class="umbigo"/>
       <rect x="64" y="246" width="22" height="58" rx="10" class="${on("coxa")}"/><rect x="114" y="246" width="22" height="58" rx="10" class="${on("coxa")}"/>
       <rect x="36" y="94" width="14" height="42" rx="7" class="${on("braco")}"/><rect x="150" y="94" width="14" height="42" rx="7" class="${on("braco")}"/>`;
  return `<figure><svg viewBox="0 0 200 360" role="img" aria-label="${costas ? "Vista de costas" : "Vista da frente"}">${corpo}${zonas}</svg><figcaption>${costas ? "Costas" : "Frente"}</figcaption></figure>`;
}
const NOMES_LOCAL = { abd: "Abdômen (evitando ~5 cm ao redor do umbigo)", coxa: "Parte da frente/lateral da coxa", braco: "Parte externa e posterior do braço", gluteo: "Região glútea (quadrante superior externo)" };
function htmlVias(p) {
  const s = slug(p.nome), v = VIAS[s];
  if (!v) return "";
  const linhas = v.map(([via, est]) => `<li><span class="via-tag est-${est}">${esc(VIAS_EST[est])}</span> <b>${esc(VIAS_ROT[via])}</b></li>`).join("");
  const loc = LOCAIS_APLIC[s];
  const fig = loc && p.fase === "Aprovado" ? `<div class="locais-aplic"><div class="silhuetas">${silhueta(false, loc)}${silhueta(true, loc)}</div><div><p><b>Regiões do corpo descritas para este medicamento:</b></p><ul class="locais-lista">${loc.map(l => `<li>${esc(NOMES_LOCAL[l])}</li>`).join("")}</ul><p><small>Ilustração esquemática, sem escala. A técnica, o local exato e o rodízio entre os locais devem seguir a bula e a orientação do profissional que prescreveu. Não use como instrução de autoadministração.</small></p></div></div>` : "";
  return `<section class="boas vias"><h2>Vias de administração estudadas</h2><ul class="vias-lista">${linhas}</ul>${fig}<p><small>Lista compilada para fins educativos; confirme na bula e nas fontes oficiais. “Só em animais” ou “só in vitro” significa que não há uso humano estabelecido por essa via.</small></p></section>`;
}