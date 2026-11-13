montarLayout();
const ord = { alta: 0, media: 1, baixa: 2 };
document.getElementById("lista-int").innerHTML = [...INTERACOES].sort((a, b) => ord[a.g] - ord[b.g]).map(i => `<article class="boas g-${i.g}"><h3>${esc(i.com)} <span class="via-tag">${GRAV[i.g]}</span></h3><p>${esc(i.o)}</p><p><b>${tr("Substâncias:")}</b> ${i.peps.map(linkPep).join(" · ")}</p></article>`).join("");
document.getElementById("lista-cond").innerHTML = CONDICOES.map(c => `<article class="boas"><h3>${esc(c.cond)}</h3><p>${esc(c.o)}</p><p><b>${tr("Substâncias:")}</b> ${c.peps.map(linkPep).join(" · ")}</p></article>`).join("");
const opts = PEPTIDES.map(p => `<option value="${slug(p.nome)}">${esc(p.nome)}</option>`).join("");
const A = document.getElementById("va"), B = document.getElementById("vb"), R = document.getElementById("vres");
A.innerHTML = `<option value="">Escolha…</option>` + opts; B.innerHTML = `<option value="">Escolha…</option>` + opts;
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
    `<p><small>Esta checagem usa apenas o cadastro de alvos do guia. A ausência de alerta não significa que a combinação seja segura. Isto não é recomendação de combinar produtos; consulte um profissional.</small></p>`;
}
A.addEventListener("change", checarPar); B.addEventListener("change", checarPar);
