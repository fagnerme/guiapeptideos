montarLayout();
/* Mapa de conexões: peptídeo/hormônio <-> alvo. Clique em um nó para recentrar o mapa. */
const NS = "http://www.w3.org/2000/svg";
const W = 760, H = 560, CX = W / 2, CY = H / 2;
const alvosDe = s => Object.keys(ALVOS).filter(k => ALVOS[k].peps.includes(s));
const nomeDe = s => (porSlug(s) || { nome: s }).nome;
const curto = (t, n = 22) => t.length > n ? t.slice(0, n - 1) + "…" : t;
let centro = null;

function lerParametros() {
  const q = new URLSearchParams(location.search);
  if (q.get("a") && ALVOS[q.get("a")]) return ["a", q.get("a")];
  if (q.get("p") && porSlug(q.get("p"))) return ["p", q.get("p")];
  return ["p", "semaglutida"];
}

function posicoes(n, raio, inicio = -Math.PI / 2) {
  return Array.from({ length: n }, (_, i) => {
    const ang = inicio + (2 * Math.PI * i) / Math.max(n, 1);
    return [CX + raio * 1.35 * Math.cos(ang), CY + raio * Math.sin(ang)];
  });
}

function no(x, y, rotulo, tipo, chave, extra = "") {
  const larg = Math.max(70, Math.min(150, rotulo.length * 6.4 + 18));
  return `<g class="gno gno-${tipo}${extra}" data-tipo="${tipo}" data-chave="${chave}" tabindex="0" role="button" aria-label="${esc(rotulo)}: centralizar o mapa">
    <rect x="${x - larg / 2}" y="${y - 14}" width="${larg}" height="28" rx="14"/><text x="${x}" y="${y + 4}" text-anchor="middle">${esc(rotulo)}</text></g>`;
}
const linha = (a, b) => `<line class="garesta" x1="${a[0]}" y1="${a[1]}" x2="${b[0]}" y2="${b[1]}"/>`;

function montar() {
  const [tipo, chave] = centro;
  let arestas = "", nos = "", lista = [], extras = [];
  if (tipo === "p") {
    const meus = alvosDe(chave), pos = posicoes(meus.length, 130);
    meus.forEach((k, i) => { arestas += linha([CX, CY], pos[i]); nos += no(pos[i][0], pos[i][1], curto(ALVOS[k].nome), "a", k); });
    const vistos = new Set([chave]);
    const externos = [];
    meus.forEach((k, i) => {
      ALVOS[k].peps.filter(s => !vistos.has(s)).slice(0, 2).forEach(s => { vistos.add(s); externos.push([s, i]); });
    });
    const lim = externos.slice(0, 16), pe = posicoes(lim.length, 235, -Math.PI / 2 + 0.2);
    lim.forEach(([s, i], j) => { arestas += linha(pos[i], pe[j]); nos += no(pe[j][0], pe[j][1], curto(nomeDe(s), 18), "p", s); });
    nos += no(CX, CY, curto(nomeDe(chave), 24), "p", chave, " gno-centro");
    lista = meus.map(k => `<li><a href="alvo.html?a=${k}">${esc(ALVOS[k].nome)}</a> <small>(${esc(ALVOS[k].tipo)})</small></li>`);
    extras = [`<a class="btn" href="${urlPeptideo(nomeDe(chave))}">📄 Abrir a ficha de ${esc(nomeDe(chave))}</a>`, `<a class="btn" href="interacoes.html">⚕️ Interações e cuidados</a>`];
    document.getElementById("g-titulo").textContent = `${nomeDe(chave)}: alvos e itens relacionados`;
    document.getElementById("g-lista-t").textContent = "Alvos e hormônios em que este item age";
  } else {
    const a = ALVOS[chave], pep = a.peps.slice(0, 16), pos = posicoes(pep.length, 150);
    pep.forEach((s, i) => { arestas += linha([CX, CY], pos[i]); nos += no(pos[i][0], pos[i][1], curto(nomeDe(s), 18), "p", s); });
    const viz = Object.keys(ALVOS).filter(k => k !== chave && ALVOS[k].peps.some(s => a.peps.includes(s))).slice(0, 10), pv = posicoes(viz.length, 245, -Math.PI / 2 + 0.3);
    viz.forEach((k, i) => { arestas += linha([CX, CY], pv[i]); nos += no(pv[i][0], pv[i][1], curto(ALVOS[k].nome), "a", k); });
    nos += no(CX, CY, curto(a.nome, 26), "a", chave, " gno-centro");
    lista = a.peps.map(s => `<li><a href="${urlPeptideo(nomeDe(s))}">${esc(nomeDe(s))}</a></li>`);
    extras = [`<a class="btn" href="alvo.html?a=${chave}">📄 Abrir a página de ${esc(a.nome)}</a>`];
    document.getElementById("g-titulo").textContent = `${a.nome}: o que age aqui`;
    document.getElementById("g-lista-t").textContent = `Itens que atuam neste alvo (${a.peps.length})`;
  }
  document.getElementById("g-svg").innerHTML = `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Mapa de conexões">${arestas}${nos}</svg>`;
  document.getElementById("g-lista").innerHTML = lista.join("");
  document.getElementById("g-acoes").innerHTML = extras.join(" ");
  const u = new URL(location.href); u.search = ""; u.searchParams.set(tipo, chave); history.replaceState(null, "", u);
}

function opcoes() {
  const p = PEPTIDES.slice().sort((a, b) => a.nome.localeCompare(b.nome, "pt")).map(x => `<option value="${esc(x.nome)}">`);
  const a = Object.keys(ALVOS).map(k => `<option value="${esc(ALVOS[k].nome)}">`);
  document.getElementById("g-opcoes").innerHTML = p.concat(a).join("");
}
function irPara(texto) {
  const t = texto.trim().toLowerCase();
  const p = PEPTIDES.find(x => x.nome.toLowerCase() === t);
  if (p) { centro = ["p", slug(p.nome)]; return montar(); }
  const k = Object.keys(ALVOS).find(k => ALVOS[k].nome.toLowerCase() === t);
  if (k) { centro = ["a", k]; montar(); }
}
document.getElementById("g-busca").addEventListener("change", e => irPara(e.target.value));
const ativar = el => { const g = el.closest(".gno"); if (g) { centro = [g.dataset.tipo, g.dataset.chave]; montar(); } };
document.getElementById("g-svg").addEventListener("click", e => ativar(e.target));
document.getElementById("g-svg").addEventListener("keydown", e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); ativar(e.target); } });
opcoes();
centro = lerParametros();
montar();
