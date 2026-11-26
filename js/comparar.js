montarLayout();
const CAMPOS = [
  ["Categoria", "categoria"], ["Fase", "fase"], ["Selo de confiança", "selo"], ["Status regulatório", "status"], ["O que faz", "oQueFaz"],
  ["Mecanismo", "mecanismo"], ["Benefícios observados", "beneficios"], ["Evidência", "evidencia"], ["Riscos", "riscos"]
];
const LINHAS_EXTRA = [
  ["Vias estudadas", p => { const v = (typeof VIAS !== "undefined" && VIAS[slug(p.nome)]) || []; return v.length ? v.map(([x, e]) => `${VIAS_ROT[x]} (${VIAS_EST[e].toLowerCase()})`).join("; ") : "—"; }],
  ["Alvos no corpo", p => { const s = slug(p.nome), k = typeof ALVOS !== "undefined" ? Object.keys(ALVOS).filter(a => ALVOS[a].peps.includes(s)) : []; return k.length ? k.map(a => `<a href="alvo.html?a=${a}">${esc(ALVOS[a].nome)}</a>`).join("; ") : "—"; }],
  ["Duração no corpo", p => { const f = typeof FARMACO !== "undefined" && FARMACO[slug(p.nome)]; return f ? esc(f.txt) : "—"; }],
];
const MAX = 3;
const params = new URLSearchParams(location.search);
let escolhidos = ["a", "b", "c"].map(k => params.get(k) || "");
const opcoes = PEPTIDES.slice().sort((a, b) => a.nome.localeCompare(b.nome, "pt"));

function desenharSeletores() {
  const box = document.getElementById("seletores");
  box.innerHTML = escolhidos.map(() => "<select></select>").join("");
  const alvos = [...box.querySelectorAll("select")];
  const campos = alvos.map((s, i) => combo(s, `${tr("Substância")} ${i + 1}`, () => {
    escolhidos[i] = campos[i].value;
    const q = new URLSearchParams();
    escolhidos.forEach((v, k) => v && q.set("abc"[k], v));
    history.replaceState(null, "", "?" + q);
    desenharTabela();
  }, escolhidos[i]));
}

function desenharTabela() {
  const sel = escolhidos.map(porSlug).filter(Boolean);
  const t = document.getElementById("tabela");
  if (sel.length < 2) { t.innerHTML = `<tr><td>${tr("Escolha pelo menos 2 substâncias para comparar.")}</td></tr>`; return; }
  t.innerHTML = `<thead><tr><th></th>${sel.map(p => `<th><a href="${urlPeptideo(p.nome)}">${esc(p.nome)}</a></th>`).join("")}</tr></thead><tbody>` +
    CAMPOS.map(([rot, k]) => `<tr><th>${rot}</th>${sel.map(p => `<td>${k === "selo" ? htmlSelo(p) : k === "fase" ? `<span class="tag ${faseClasse(p.fase)}">${esc(p.fase)}</span>` : esc(p[k])}</td>`).join("")}</tr>`).join("") + LINHAS_EXTRA.map(([rot, f]) => `<tr><th>${rot}</th>${sel.map(p => `<td>${f(p)}</td>`).join("")}</tr>`).join("") + "</tbody>";
}

desenharSeletores();
desenharTabela();

