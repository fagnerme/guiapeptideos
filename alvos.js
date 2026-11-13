montarLayout();
const lista = document.getElementById("lista-alvos");
function desenhar(filtro = "") {
  const f = semAcento(filtro.toLowerCase());
  const itens = Object.entries(ALVOS).filter(([, a]) => semAcento((a.nome + " " + a.tipo + " " + a.oque + " " + a.peps.map(nomeDe).join(" ")).toLowerCase()).includes(f));
  lista.innerHTML = itens.map(([k, a]) => `<article class="boas card-alvo"><h3><a href="alvo.html?a=${k}">${esc(a.nome)}</a></h3><p><span class="tag">${esc(a.tipo)}</span></p><p>${esc(a.oque)}</p>${a.peps.length ? `<p><b>${tr("Substâncias:")}</b> ${a.peps.map(linkPep).join(" · ")}</p>` : ""}</article>`).join("") || "<p>Nada encontrado.</p>";
}
document.getElementById("filtro-alvo").addEventListener("input", e => desenhar(e.target.value));
desenhar();
const pares = [];
Object.entries(ALVOS).forEach(([k, a]) => (a.opoe || []).forEach(([o, nota]) => { if (ALVOS[o] && !pares.some(([x, y]) => x === o && y === k)) pares.push([k, o, nota]); }));
document.getElementById("opostos").innerHTML = pares.map(([a, b, n]) => `<li><a href="alvo.html?a=${a}">${esc(ALVOS[a].nome)}</a> ⇄ <a href="alvo.html?a=${b}">${esc(ALVOS[b].nome)}</a> — ${esc(n)}</li>`).join("");
const contagem = {};
Object.values(ALVOS).forEach(a => a.peps.forEach(s => { contagem[s] = (contagem[s] || 0) + 1; }));
document.getElementById("multialvo").innerHTML = Object.entries(contagem).filter(([, n]) => n > 1).sort((a, b) => b[1] - a[1]).map(([s, n]) => `<li>${linkPep(s)} — ${n} alvos: ${alvosDe(s).map(([k, a]) => `<a href="alvo.html?a=${k}">${esc(a.nome)}</a>`).join(", ")}</li>`).join("");
