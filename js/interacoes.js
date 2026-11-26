montarLayout();
const ord = { alta: 0, media: 1, baixa: 2 };
document.getElementById("lista-int").innerHTML = [...INTERACOES].sort((a, b) => ord[a.g] - ord[b.g]).map(i => `<article class="boas g-${i.g}"><h3>${esc(i.com)} <span class="via-tag">${GRAV[i.g]}</span></h3><p>${esc(i.o)}</p><p><b>${tr("Substâncias:")}</b> ${i.peps.map(linkPep).join(" · ")}</p></article>`).join("");
document.getElementById("lista-cond").innerHTML = CONDICOES.map(c => `<article class="boas"><h3>${esc(c.cond)}</h3><p>${esc(c.o)}</p><p><b>${tr("Substâncias:")}</b> ${c.peps.map(linkPep).join(" · ")}</p></article>`).join("");
const ITENS = PEPTIDES.map(p => { const mc = marcasDe(p); return { s: slug(p.nome), n: p.nome, k: semAcento(p.nome.toLowerCase()), mc, km: mc.map(x => semAcento(x.toLowerCase())), med: !!p._med || mc.length > 0 }; });
/* Campo com busca e sugestões no lugar de um <select> com milhares de opções (que quebra no celular). */
function combo(sel, rotulo) {
  const w = document.createElement("div"); w.className = "combo";
  w.innerHTML = `<input type="search" class="combo-in" placeholder="${esc(tr("Digite para buscar…"))}" aria-label="${esc(rotulo)}" autocomplete="off" role="combobox" aria-expanded="false"><ul class="combo-lista" role="listbox" hidden></ul>`;
  sel.replaceWith(w);
  const inp = w.querySelector("input"), ul = w.querySelector("ul"), est = { value: "" };
  let ativo = -1, lista = [];
  const fechar = () => { ul.hidden = true; inp.setAttribute("aria-expanded", "false"); ativo = -1; };
  const marcar = () => ul.querySelectorAll("li").forEach((li, i) => li.classList.toggle("ativa", i === ativo));
  const escolher = it => { est.value = it.s; inp.value = it.n; fechar(); checarPar(); };
  const listar = () => {
    const q = semAcento(inp.value.trim().toLowerCase());
    if (!q) { fechar(); return; }
    lista = ITENS.filter(i => i.k.startsWith(q)).concat(ITENS.filter(i => !i.k.startsWith(q) && i.k.includes(q))).concat(ITENS.filter(i => !i.k.includes(q) && i.km.some(m => m.includes(q)))).slice(0, 8);
    ul.innerHTML = lista.map((i, n) => `<li role="option" data-i="${n}">${esc(i.n)}${i.med ? " 💊" : ""}${i.k.includes(q) ? "" : ` <small>(${esc(i.mc.find(m => semAcento(m.toLowerCase()).includes(q)) || "")})</small>`}</li>`).join("") || `<li class="combo-vazio">${tr("Nada encontrado")}</li>`;
    ul.hidden = false; inp.setAttribute("aria-expanded", "true"); ativo = -1;
  };
  inp.addEventListener("input", () => { est.value = ""; listar(); checarPar(); });
  inp.addEventListener("focus", () => { if (inp.value && !est.value) listar(); else inp.select(); });
  inp.addEventListener("blur", () => setTimeout(fechar, 150));
  inp.addEventListener("keydown", e => {
    if (e.key === "ArrowDown" || e.key === "ArrowUp") { e.preventDefault(); if (ul.hidden) listar(); ativo = Math.max(0, Math.min(lista.length - 1, ativo + (e.key === "ArrowDown" ? 1 : -1))); marcar(); }
    else if (e.key === "Enter" && !ul.hidden && lista.length) { e.preventDefault(); escolher(lista[ativo >= 0 ? ativo : 0]); }
    else if (e.key === "Escape") fechar();
  });
  ul.addEventListener("pointerdown", e => { const li = e.target.closest("li[data-i]"); if (li) { e.preventDefault(); escolher(lista[+li.dataset.i]); } });
  return est;
}
const A = combo(document.getElementById("va"), "Primeira substância"), B = combo(document.getElementById("vb"), "Segunda substância"), R = document.getElementById("vres");
function checarPar() {
  const a = A.value, b = B.value;
  if (!a || !b) { R.innerHTML = ""; return; }
  if (a === b) { R.innerHTML = "<p>Escolha dois itens diferentes.</p>"; return; }
  const ka = alvosDe(a).map(([k]) => k), kb = alvosDe(b).map(([k]) => k);
  const comuns = ka.filter(k => kb.includes(k));
  const opos = [];
  ka.forEach(k => (ALVOS[k].opoe || []).forEach(([o, n]) => { if (kb.includes(o)) opos.push([k, o, n]); }));
  kb.forEach(k => (ALVOS[k].opoe || []).forEach(([o, n]) => { if (ka.includes(o) && !opos.some(x => x[0] === o && x[1] === k)) opos.push([k, o, n]); }));
  const na = nomeDe(a), nb = nomeDe(b);
  R.innerHTML = `<h3>${esc(na)} + ${esc(nb)}</h3>` +
    (comuns.length ? `<p>⚠️ <b>Agem no mesmo alvo:</b> ${comuns.map(k => `<a href="alvo.html?a=${k}">${esc(ALVOS[k].nome)}</a>`).join(", ")}. Os efeitos e riscos podem se somar.</p>` : "<p>Não encontramos alvo em comum no nosso cadastro.</p>") +
    (opos.length ? `<p>↔️ <b>Alvos com efeito contrário:</b></p><ul>${opos.map(([x, y, n]) => `<li>${esc(ALVOS[x].nome)} × ${esc(ALVOS[y].nome)} — ${esc(n)}</li>`).join("")}</ul>` : "") +
    (ITENS.some(i => (i.s === a || i.s === b) && i.med) ? `<p>💊 <b>Atenção:</b> inclui medicamento. Não combine, troque ou suspenda nada sem orientação do seu médico ou farmacêutico; a bula e a prescrição valem mais que este resumo.</p>` : "") +
    `<p><small>Esta checagem usa apenas o cadastro de alvos do guia. A ausência de alerta não significa que a combinação seja segura. Isto não é recomendação de combinar produtos; consulte um profissional.</small></p>`;
}

