/* Seção "Vias de administração" e ilustração dos locais de aplicação (só aprovados injetáveis). */
function silhueta(costas, locais) {
  const on = z => locais.includes(z) ? "zona on" : "zona";
  const corpo = `<circle cx="60" cy="18" r="13" class="corpo"/><rect x="50" y="30" width="20" height="8" class="corpo"/>
    <path d="M36 38h48l6 6v52H30V44z" class="corpo"/><rect x="14" y="40" width="16" height="58" rx="8" class="corpo"/><rect x="90" y="40" width="16" height="58" rx="8" class="corpo"/>
    <rect x="34" y="96" width="24" height="86" rx="10" class="corpo"/><rect x="62" y="96" width="24" height="86" rx="10" class="corpo"/>`;
  const zonas = costas
    ? `<ellipse cx="46" cy="104" rx="11" ry="9" class="${on("gluteo")}"/><ellipse cx="74" cy="104" rx="11" ry="9" class="${on("gluteo")}"/>`
    : `<ellipse cx="60" cy="72" rx="20" ry="13" class="${on("abd")}"/><circle cx="60" cy="72" r="4" class="umbigo"/>
       <rect x="38" y="112" width="18" height="40" rx="8" class="${on("coxa")}"/><rect x="64" y="112" width="18" height="40" rx="8" class="${on("coxa")}"/>
       <rect x="15" y="48" width="14" height="26" rx="7" class="${on("braco")}"/><rect x="91" y="48" width="14" height="26" rx="7" class="${on("braco")}"/>`;
  return `<figure><svg viewBox="0 0 120 184" role="img" aria-label="${costas ? "Vista de costas" : "Vista da frente"}">${corpo}${zonas}</svg><figcaption>${costas ? "Costas" : "Frente"}</figcaption></figure>`;
}
const NOMES_LOCAL = { abd: "Abdômen (evitando ~5 cm ao redor do umbigo)", coxa: "Parte da frente/lateral da coxa", braco: "Parte externa e posterior do braço", gluteo: "Região glútea (quadrante superior externo)" };
function htmlVias(p) {
  const s = slug(p.nome), v = VIAS[s];
  if (!v) return "";
  const linhas = v.map(([via, est]) => `<li><span class="via-tag est-${est}">${esc(VIAS_EST[est])}</span> <b>${esc(VIAS_ROT[via])}</b></li>`).join("");
  const loc = LOCAIS_APLIC[s];
  const fig = loc && p.fase === "Aprovado" ? `<div class="locais-aplic"><div class="silhuetas">${silhueta(false, loc)}${silhueta(true, loc)}</div><div><p><b>Regiões do corpo descritas para este medicamento:</b></p><ul>${loc.map(l => `<li>${esc(NOMES_LOCAL[l])}</li>`).join("")}</ul><p><small>Ilustração esquemática, sem escala. A técnica, o local exato e o rodízio entre os locais devem seguir a bula e a orientação do profissional que prescreveu. Não use como instrução de autoadministração.</small></p></div></div>` : "";
  return `<section class="boas vias"><h2>Vias de administração estudadas</h2><ul class="vias-lista">${linhas}</ul>${fig}<p><small>Lista compilada para fins educativos; confirme na bula e nas fontes oficiais. “Só em animais” ou “só in vitro” significa que não há uso humano estabelecido por essa via.</small></p></section>`;
}