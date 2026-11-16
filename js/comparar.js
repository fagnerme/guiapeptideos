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
  document.getElementById("seletores").innerHTML = escolhidos.map((v, i) =>
    `<select data-i="${i}" aria-label="${tr("Substância")}"><option value="">${tr("— Substância " + (i + 1) + " —")}</option>` +
    opcoes.map(p => `<option value="${slug(p.nome)}"${slug(p.nome) === v ? " selected" : ""}>${esc(p.nome)}</option>`).join("") + `</select>`
  ).join("");
}

function desenharTabela() {
  const sel = escolhidos.map(porSlug).filter(Boolean);
  const t = document.getElementById("tabela");
  if (sel.length < 2) { t.innerHTML = `<tr><td>${tr("Escolha pelo menos 2 substâncias para comparar.")}</td></tr>`; return; }
  t.innerHTML = `<thead><tr><th></th>${sel.map(p => `<th><a href="${urlPeptideo(p.nome)}">${esc(p.nome)}</a></th>`).join("")}</tr></thead><tbody>` +
    CAMPOS.map(([rot, k]) => `<tr><th>${rot}</th>${sel.map(p => `<td>${k === "selo" ? htmlSelo(p) : k === "fase" ? `<span class="tag ${faseClasse(p.fase)}">${esc(p.fase)}</span>` : esc(p[k])}</td>`).join("")}</tr>`).join("") + LINHAS_EXTRA.map(([rot, f]) => `<tr><th>${rot}</th>${sel.map(p => `<td>${f(p)}</td>`).join("")}</tr>`).join("") + "</tbody>";
}

document.getElementById("seletores").addEventListener("change", e => {
  escolhidos[+e.target.dataset.i] = e.target.value;
  const q = new URLSearchParams();
  escolhidos.forEach((v, i) => v && q.set("abc"[i], v));
  history.replaceState(null, "", "?" + q);
  desenharTabela();
});
desenharSeletores();
desenharTabela();

