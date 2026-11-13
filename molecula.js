/* Estrutura molecular: dados do PubChem (moleculas.js). Mostra a cadeia de aminoácidos como "contas" coloridas. */
const AA3 = { Ala: "A", Arg: "R", Asn: "N", Asp: "D", Cys: "C", Gln: "Q", Glu: "E", Gly: "G", His: "H", Ile: "I", Leu: "L", Lys: "K", Met: "M", Phe: "F", Pro: "P", Ser: "S", Thr: "T", Trp: "W", Tyr: "Y", Val: "V" };
const AA1 = Object.fromEntries(Object.entries(AA3).map(([k, v]) => [v, k]));
const CLASSE_AA = { A: "hid", V: "hid", L: "hid", I: "hid", M: "hid", F: "aro", W: "aro", Y: "aro", S: "pol", T: "pol", N: "pol", Q: "pol", C: "cis", G: "esp", P: "esp", K: "pos", R: "pos", H: "pos", D: "neg", E: "neg" };
const LEGENDA_AA = [["hid", "Hidrofóbico"], ["aro", "Aromático"], ["pol", "Polar"], ["pos", "Carga +"], ["neg", "Carga −"], ["cis", "Cisteína (pontes S–S)"], ["esp", "Glicina / prolina"], ["mod", "Modificado / não padrão"]];

/* Divide a notação condensada (ex.: H-Cys(1)-D-Ala-Tyr(2,6-diMe)-NH2) em resíduos, ignorando hifens dentro de parênteses. */
function resíduosDe(cond) {
  const partes = []; let nivel = 0, atual = "";
  for (const c of cond) {
    if (c === "(") nivel++; if (c === ")") nivel--;
    if (c === "-" && nivel === 0) { partes.push(atual); atual = ""; } else atual += c;
  }
  partes.push(atual);
  const fora = new Set(["H", "Ac", "OH", "NH2", "NHEt", "ol"]);
  const out = [];
  for (let i = 0; i < partes.length; i++) {
    let t = partes[i];
    if (!t || fora.has(t) || /^palmitoyl$/i.test(t)) continue;
    let pref = "";
    if (["D", "L", "DL"].includes(t) && partes[i + 1]) { pref = t; t = partes[++i]; }
    const base = (t.match(/^[A-Za-z]+/) || [""])[0], lig = (t.match(/\((\d+)\)/) || [])[1];
    out.push({ nome: (pref ? pref + "-" : "") + t.replace(/\(\d+\)/, ""), um: AA3[base] || "", d: pref === "D", lig });
  }
  return out;
}
function contas(res) {
  const pontes = {};
  res.forEach((r, i) => { if (r.lig) (pontes[r.lig] ||= []).push(i + 1); });
  const html = res.map((r, i) => {
    const cl = r.um && !/[(]/.test(r.nome) ? CLASSE_AA[r.um] : (r.um ? CLASSE_AA[r.um] : "mod");
    const titulo = `${i + 1}. ${r.nome}${r.d ? " (forma D)" : ""}${r.lig ? " — ponte " + r.lig : ""}`;
    return `<span class="aa aa-${cl || "mod"}${r.d ? " aa-d" : ""}" title="${esc(titulo)}"><b>${esc(r.um || "X")}</b><small>${i + 1}</small></span>`;
  }).join("");
  const nota = Object.values(pontes).filter(v => v.length === 2).map(v => `${v[0]}–${v[1]}`);
  return { html, nota };
}
function resíduosDeSeq(seq) { return [...seq].map(c => ({ nome: AA1[c] || "X", um: AA1[c] ? c : "", d: false })); }

function htmlMolecula(p) {
  let m = typeof MOLECULAS !== "undefined" && MOLECULAS[slug(p.nome)];
  if (m && ((m.seq && m.seq.length < 2) || (m.condensada && m.condensada.split("-").length < 4))) m = { ...m, seq: undefined, condensada: undefined };
  const termo = encodeURIComponent(termoEn(p.nome));
  const links = `<a href="${m && m.cid ? "https://pubchem.ncbi.nlm.nih.gov/compound/" + m.cid : "https://pubchem.ncbi.nlm.nih.gov/#query=" + termo}" target="_blank" rel="noopener">PubChem</a> · <a href="https://www.uniprot.org/uniprotkb?query=${termo}" target="_blank" rel="noopener">UniProt</a>`;
  if (!m) return `<section class="boas"><h2>Estrutura molecular</h2><p>Dados de estrutura não disponíveis para este item nas bases consultadas. Busque em: ${links}.</p></section>`;
  let corpo = "";
  const cadeias = m.cadeias ? Object.entries(m.cadeias).map(([n, s]) => [n, resíduosDeSeq(s)]) : null;
  if (cadeias) corpo = cadeias.map(([n, r]) => `<p><b>Cadeia ${esc(n)}</b></p><div class="cadeia">${contas(r).html}</div>`).join("");
  else {
    const r = m.condensada ? resíduosDe(m.condensada) : (m.seq ? resíduosDeSeq(m.seq) : []);
    if (r.length > 1 && m.seq !== "") { const c = contas(r); corpo = `<div class="cadeia">${c.html}</div><p><small>${r.length} resíduos${c.nota.length ? " · ligações internas (ex.: dissulfeto ou lactama) entre as posições " + c.nota.join(", ") : ""}. Passe o mouse (ou toque) em cada conta para ver o aminoácido.</small></p>`; }
  }
  const seqTxt = m.condensada ? `<p><b>Notação condensada:</b> <code>${esc(m.condensada)}</code></p>` : "";
  const seq1 = m.seq && !m.seq.includes("X") ? `<p><b>Sequência (código de 1 letra):</b> <code>${esc(m.seq)}</code></p>` : "";
  const dados = [m.formula && `<li><b>Fórmula:</b> ${esc(m.formula)}</li>`, m.massa && `<li><b>Massa molecular:</b> ${esc(m.massa)} g/mol</li>`].filter(Boolean).join("");
  const semCadeia = !corpo && !seqTxt && !seq1 ? `<p>${tr("Sem sequência de aminoácidos disponível para exibição. Algumas substâncias do catálogo, como hormônios esteroides, vitaminas e NAD+, não são peptídeos; para outras, o PubChem pode não informar a sequência, especialmente em análogos com modificações químicas complexas. Consulte o registro no PubChem.")}</p>` : "";
  return `<section class="boas"><h2>Estrutura molecular</h2>${corpo}${seq1}${seqTxt}${dados ? `<ul class="dados-mol">${dados}</ul>` : ""}${semCadeia}
    ${m.nota ? `<p><small>${esc(m.nota)}</small></p>` : ""}
    <details><summary>Legenda das cores</summary><p class="legenda-aa">${LEGENDA_AA.map(([c, n]) => `<span class="aa aa-${c}"><b>•</b></span> ${n}`).join(" · ")}</p>
    <p><small>Letras: código de 1 letra do aminoácido; "X" = resíduo modificado ou não padrão; borda tracejada = aminoácido na forma D. Dados: ${links}${m.manual ? " e literatura (ajuste manual)" : ""}. Conferir sempre na fonte.</small></p></details></section>`;
}