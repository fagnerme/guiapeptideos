montarLayout();
const alvo = document.getElementById("consulta");
const CH = "consulta-estado";
const estado = (() => { try { return JSON.parse(localStorage.getItem(CH)) || {}; } catch { return {}; } })();
const salvar = () => localStorage.setItem(CH, JSON.stringify(estado));

const GERAIS = [
  "Quais medicamentos, suplementos e condições de saúde eu devo informar? (levar a lista completa)",
  "Tenho alergias, estou grávida, amamentando ou planejando engravidar?",
  "Há exames que eu deveria fazer antes e durante o acompanhamento?",
  "O que fazer e quem procurar se eu tiver uma reação adversa?",
  "Existem alternativas com aprovação e evidência mais sólida para o meu objetivo?",
];
function perguntasDe(p) {
  const aprovado = p.fase === "Aprovado";
  const q = [
    `Para qual problema de saúde ${p.nome} poderia ser indicado no meu caso?`,
    aprovado
      ? `${p.nome} é aprovado para essa indicação ou seria uso fora da bula (off-label)?`
      : `${p.nome} não tem aprovação confirmada (fase: ${p.fase}). Existe algum ensaio clínico sério do qual eu possa participar?`,
    `Quais riscos se aplicam a mim? Pontos citados no catálogo: ${p.riscos}`,
  ];
  if (/WADA|doping/i.test([p.status, p.evidencia, p.riscos].join(" ")) || ["Secretagogos de GH", "Muscular"].includes(p.categoria))
    q.push("Pratico esporte com testes antidoping? Isso é proibido pela lista da WADA?");
  if (!aprovado) q.push("Como saber se um produto à venda é legal e de qualidade, já que não tem registro como medicamento?");
  return q;
}
const chk = (id, txt) => `<li><label><input type="checkbox" data-k="${esc(id)}" ${estado.ok?.[id] ? "checked" : ""}> ${esc(txt)}</label></li>`;

function desenhar() {
  const favs = getFavs().map(porSlug).filter(Boolean);
  alvo.innerHTML = `
    <section class="boas">
      <p><label>Nome (opcional): <input data-c="nome" value="${esc(estado.nome || "")}"></label>
         <label>Data da consulta: <input type="date" data-c="data" value="${esc(estado.data || "")}"></label></p>
    </section>
    <section class="boas"><h2>Perguntas gerais</h2><ul class="checklist">${GERAIS.map((t, i) => chk("g" + i, t)).join("")}</ul></section>
    ${favs.length ? favs.map(p => `<section class="boas"><h2><a href="${urlPeptideo(p.nome)}">${esc(p.nome)}</a> <span class="tag ${faseClasse(p.fase)}">${esc(p.fase)}</span></h2>
      <ul class="checklist">${perguntasDe(p).map((t, i) => chk(slug(p.nome) + i, t)).join("")}</ul></section>`).join("")
      : `<section class="boas"><p>${tr("Você ainda não tem favoritos. Favorite substâncias no")} <a href="index.html">${tr("Catálogo")}</a> ${tr("para gerar perguntas específicas.")}</p></section>`}
    <section class="boas"><h2>Minhas anotações</h2><textarea data-c="notas" rows="6" aria-label="Anotações" style="width:100%">${esc(estado.notas || "")}</textarea></section>
    <p><small>Este material é educativo e não substitui orientação profissional. Não contém doses.</small></p>`;
}
alvo.addEventListener("input", e => { const c = e.target.dataset.c; if (c) { estado[c] = e.target.value; salvar(); } });
alvo.addEventListener("change", e => { const k = e.target.dataset.k; if (k) { (estado.ok ||= {})[k] = e.target.checked; salvar(); } });
document.getElementById("pdf").addEventListener("click", () => window.print());
desenhar();