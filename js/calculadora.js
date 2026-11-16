montarLayout();
/* Calculadora de reconstituição: só aritmética. Nunca sugere doses; a dose vem da prescrição ou da bula. */
const $c = id => document.getElementById(id);
const OPC = {
  mg: { frasco: [5, 10, 15, 20, 30, 60], pronto: [10, 20, 50, 100, 200, 250, 300], dose: [0.25, 0.5, 1, 1.7, 2, 2.4, 2.5, 4, 5, 7.5, 10, 12, 12.5, 15, 17.5, 20, 25, 30, 50, 100, 200, 250] },
  mcg: { frasco: [100, 250, 500, 1000, 2000, 5000], pronto: [50, 100, 200, 500, 1000], dose: [25, 50, 100, 200, 250, 300, 500, 1000] },
  UI: { frasco: [500, 1000, 2000, 5000, 10000], pronto: [500, 1000, 5000, 10000], dose: [100, 250, 500, 1000, 1500, 2000, 2500, 5000] },
};
const DILUENTE = [0.5, 1, 1.5, 2, 2.5, 3];
const SER = {
  sc: [{ ml: 0.3, un: 30 }, { ml: 0.5, un: 50 }, { ml: 1, un: 100 }],
  im: [{ ml: 1 }, { ml: 3 }, { ml: 5 }],
};
const VIAS_CALC = {
  sc: { t: "Subcutânea", d: "Seringa de insulina U-100 (lida em unidades)", ic: "💉" },
  im: { t: "Intramuscular", d: "Seringa de 1, 3 ou 5 mL (lida em mL)", ic: "💪" },
};
const DICA_VIA = {
  sc: "Aplicada na gordura sob a pele (barriga, coxa, braço). Na seringa de insulina, 1 mL = 100 unidades.",
  im: "Aplicada dentro do músculo (glúteo, coxa, ombro), com agulha mais longa. Seringas comuns são marcadas em mL: o resultado sai direto em mL.",
};
const PADRAO = { tipo: "po", unid: "mg", via: "sc", frasco: 10, diluente: 1, seringa: 1, dose: null, freq: null };
let est = { ...PADRAO };
let ultimoTxt = "";
const nf = (n, d = 2) => Number(n.toFixed(d)).toLocaleString(LOCALE, { maximumFractionDigits: d });

function segmento(id, lista, atual) {
  $c(id).innerHTML = lista.map(([v, t]) => `<button type="button" class="seg-op" data-v="${v}" aria-pressed="${atual === v}">${esc(t)}</button>`).join("");
}
function chips(id, lista, chave, rotulo, unidadeCustom) {
  const alvo = $c(id);
  const custom = est[chave] != null && !lista.includes(est[chave]);
  alvo.innerHTML = lista.map(v => `<button type="button" class="chip" data-v="${v}" aria-pressed="${est[chave] === v}">${rotulo(v)}</button>`).join("") +
    `<button type="button" class="chip" data-outro="1" aria-pressed="${custom}">Outro</button>` +
    (custom || alvo.dataset.aberto ? `<span class="outro"><input type="number" min="0" step="any" inputmode="decimal" aria-label="Valor personalizado" value="${custom ? est[chave] : ""}"> ${unidadeCustom}</span>` : "");
}
function ajustarSeringa() {
  const lista = SER[est.via];
  if (!lista.some(s => s.ml === est.seringa)) est.seringa = lista[lista.length - 1].ml;
}
function desenhar() {
  const { tipo, unid, via } = est, pronto = tipo === "pronto", o = OPC[unid];
  ajustarSeringa();
  segmento("ch-tipo", [["po", "Pó para diluir"], ["pronto", "Solução pronta"]], tipo);
  segmento("ch-unid", [["mg", "mg"], ["mcg", "mcg"], ["UI", "UI"]], unid);
  $c("dica-frasco").textContent = pronto ? "Concentração que está no rótulo (quantidade por mL)" : "Quantidade total do frasco";
  $c("card-dil").hidden = pronto;
  chips("ch-frasco", pronto ? o.pronto : o.frasco, "frasco", v => pronto ? `${nf(v, 2)} ${unid}/mL` : `${nf(v, 2)}${unid}`, pronto ? `${unid}/mL` : unid);
  chips("ch-diluente", DILUENTE, "diluente", v => nf(v, 1) + "mL", "mL");
  chips("ch-dose", o.dose, "dose", v => nf(v, 2) + unid, unid);
  chips("ch-freq", [1, 2, 3, 5, 7], "freq", v => `${v}×/sem`, "×/sem");
  $c("ch-via").innerHTML = Object.entries(VIAS_CALC).map(([k, v]) => `<button type="button" class="via-op" data-via="${k}" aria-pressed="${via === k}"><span class="via-ic" aria-hidden="true">${v.ic}</span><b>${v.t}</b><small>${v.d}</small></button>`).join("");
  $c("ch-seringa").innerHTML = SER[via].map(s => `<button type="button" class="seringa-op" data-ml="${s.ml}" aria-pressed="${est.seringa === s.ml}"><span class="mini-ser"></span><b>${nf(s.ml, 1)}mL</b>${s.un ? `<small>${s.un} unidades</small>` : ""}</button>`).join("");
  $c("dica-via").textContent = DICA_VIA[via];
  $c("th-un").hidden = via !== "sc";
  resultado();
}

function svgSeringa(valor, cap, via) {
  const sc = via === "sc", max = sc ? cap * 100 : cap, f = Math.max(0, Math.min(1, valor / max)), h = 110, y = 20 + h * (1 - f);
  const passo = sc ? 20 : (cap <= 1 ? 0.2 : 1);
  const marcas = [];
  for (let m = 0; m <= max + 1e-9; m += passo) {
    const yy = 20 + h * (1 - m / max);
    marcas.push(`<line x1="36" x2="42" y1="${yy}" y2="${yy}" stroke="#888"/><text x="46" y="${yy + 3}" font-size="9" fill="#888">${nf(m, 1)}</text>`);
  }
  const larg = sc ? 20 : 26, x0 = sc ? 16 : 13;
  return `<svg viewBox="0 0 90 170" width="110" role="img" aria-label="Seringa preenchida até ${nf(valor, 2)} ${sc ? "unidades" : "mL"}"><rect x="14" y="2" width="24" height="6" rx="2" fill="#667"/><rect x="24" y="8" width="4" height="12" fill="#667"/>
    <rect x="${x0}" y="20" width="${larg}" height="${h}" rx="2" fill="none" stroke="#667" stroke-width="2"/><rect x="${x0 + 1}" y="${y}" width="${larg - 2}" height="${20 + h - y}" fill="#2563eb"/>${marcas.join("")}<rect x="24" y="${20 + h}" width="4" height="${sc ? 22 : 34}" fill="#667"/></svg>`;
}

function resultado() {
  const { tipo, unid, via, frasco, diluente, seringa, dose } = est, pronto = tipo === "pronto", sc = via === "sc";
  const av = $c("avisos-calc"), tb = $c("tab-doses").querySelector("tbody");
  av.innerHTML = ""; tb.innerHTML = ""; ultimoTxt = "";
  const falta = !frasco || !dose || (!pronto && !diluente);
  if (falta) {
    $c("seringa-svg").innerHTML = svgSeringa(0, seringa, via);
    $c("destaque").textContent = "Escolha a dose"; $c("r-conc").textContent = "—"; $c("r-doses").textContent = "—"; $c("r-dur").textContent = "—";
    $c("exemplo-calc").textContent = tr("Exemplo: frasco de 10 mg + 1 mL de diluente = 10 mg/mL; dose de 2,5 mg ÷ 10 mg/mL = 0,25 mL; 0,25 × 100 = 25 unidades."); return;
  }
  const conc = pronto ? frasco : frasco / diluente, ml = dose / conc, un = ml * 100, doses = pronto ? null : frasco / dose;
  $c("seringa-svg").innerHTML = svgSeringa(sc ? un : ml, seringa, via);
  $c("destaque").textContent = sc ? `${nf(ml, 2)}mL | ${nf(un, 0)} unidades` : `${nf(ml, 2)}mL`;
  $c("r-conc").textContent = `${nf(conc, 2)} ${unid}/mL`;
  $c("r-doses").textContent = doses == null ? "—" : `${nf(doses, 1)} de ${nf(dose, 2)}${unid}`;
  const w = [];
  if (doses != null && est.freq) {
    const dur = Math.floor(doses) / est.freq * 7;
    $c("r-dur").textContent = `${nf(dur, 0)} dias`;
    if (dur > 28) w.push("Depois de reconstituído, o frasco costuma ter validade curta (geralmente semanas, refrigerado). Confira o prazo na bula ou com o farmacêutico antes de planejar um frasco longo.");
  } else $c("r-dur").textContent = "—";
  if (!pronto && dose > frasco) w.push("A dose é maior que o conteúdo total do frasco.");
  if (ml > seringa) w.push(`O volume (${nf(ml, 2)} mL) não cabe na seringa escolhida (${nf(seringa, 1)} mL). Escolha outra seringa ou mude o diluente.`);
  if (sc && un < 2) w.push("Menos de 2 unidades: a leitura na seringa fica imprecisa. Converse com o farmacêutico.");
  if (!sc && ml < 0.1) w.push("Menos de 0,1 mL: a leitura na seringa fica imprecisa. Converse com o farmacêutico.");
  if (!sc && ml > 3) w.push("Volumes acima de 3 mL costumam ser divididos em mais de um local de aplicação. Siga a orientação do profissional.");
  if (sc && ml > 1.5) w.push("Volume alto para a via subcutânea. Confirme com o profissional de saúde.");
  av.innerHTML = w.map(x => `<p class="erro-calc">⚠️ ${esc(x)}</p>`).join("");
  const lista = [...new Set([...OPC[unid].dose, dose])].sort((a, b) => a - b);
  const i = lista.indexOf(dose), ini = Math.max(0, Math.min(i - 3, lista.length - 7));
  tb.innerHTML = lista.slice(ini, ini + 7).map(d => { const m = d / conc; return `<tr class="${d === dose ? "sel" : ""}"><td>${d === dose ? "▸" : ""}${nf(d, 2)}${unid}</td><td>${nf(m, 2)}mL</td>${sc ? `<td>${nf(m * 100, 0)}</td>` : ""}</tr>`; }).join("");
  const parteConc = pronto ? `Concentração do rótulo: ${nf(conc, 2)} ${unid}/mL` : `${nf(frasco)} ${unid} ÷ ${nf(diluente)} mL = ${nf(conc, 2)} ${unid}/mL`;
  $c("exemplo-calc").innerHTML = `Com os valores escolhidos: ${parteConc}; ${nf(dose, 2)} ${unid} ÷ ${nf(conc, 2)} ${unid}/mL = ${nf(ml, 2)} mL${sc ? `; ${nf(ml, 2)} × 100 = ${nf(un, 0)} unidades` : ""}.`;
  ultimoTxt = (pronto ? `Frasco em solução pronta (${nf(conc, 2)} ${unid}/mL).` : `Frasco ${nf(frasco)} ${unid} + ${nf(diluente)} mL de diluente (${nf(conc, 2)} ${unid}/mL).`) +
    ` Dose ${nf(dose, 2)} ${unid} = ${nf(ml, 2)} mL` + (sc ? ` = ${nf(un, 0)} unidades (seringa U-100, subcutânea).` : " (seringa em mL, intramuscular).");
}

const CHAVES = { "ch-frasco": "frasco", "ch-diluente": "diluente", "ch-dose": "dose", "ch-freq": "freq" };
document.querySelector(".calc-form").addEventListener("click", e => {
  const ch = e.target.closest(".chip"), se = e.target.closest(".seringa-op"), vi = e.target.closest(".via-op"), sg = e.target.closest(".seg-op");
  if (vi) { est.via = vi.dataset.via; return desenhar(); }
  if (se) { est.seringa = parseFloat(se.dataset.ml); return desenhar(); }
  if (sg) {
    const g = sg.parentElement.id;
    if (g === "ch-tipo" && est.tipo !== sg.dataset.v) { est.tipo = sg.dataset.v; est.frasco = null; }
    if (g === "ch-unid" && est.unid !== sg.dataset.v) { est.unid = sg.dataset.v; est.frasco = null; est.dose = null; }
    document.querySelectorAll(".chips").forEach(c => delete c.dataset.aberto);
    return desenhar();
  }
  if (!ch) return;
  const grupo = ch.parentElement, chave = CHAVES[grupo.id];
  if (ch.dataset.outro) { grupo.dataset.aberto = "1"; est[chave] = null; desenhar(); const inp = grupo.querySelector("input"); if (inp) inp.focus(); return; }
  delete grupo.dataset.aberto; est[chave] = parseFloat(ch.dataset.v); desenhar();
});
document.querySelector(".calc-form").addEventListener("input", e => {
  if (e.target.tagName !== "INPUT") return;
  const chave = CHAVES[e.target.closest(".chips").id];
  const v = parseFloat(String(e.target.value).replace(",", "."));
  est[chave] = Number.isFinite(v) && v > 0 ? v : null; resultado();
});
$c("copiar").addEventListener("click", async e => {
  if (!ultimoTxt) return;
  try { await navigator.clipboard.writeText(ultimoTxt); e.currentTarget.textContent = "✅ Copiado"; } catch { prompt("Copie:", ultimoTxt); }
});
$c("whats").addEventListener("click", () => { if (ultimoTxt) window.open("https://wa.me/?text=" + encodeURIComponent(ultimoTxt), "_blank", "noopener"); });
$c("pdf").addEventListener("click", () => window.print());
$c("link").addEventListener("click", async e => {
  const u = new URL(location.href);
  u.search = ""; u.hash = "";
  u.searchParams.set("c", JSON.stringify(est));
  const p = new URLSearchParams(location.search).get("p");
  if (p) u.searchParams.set("p", p);
  try { await navigator.clipboard.writeText(u.href); e.currentTarget.textContent = "✅ Link copiado"; } catch { prompt("Copie o link:", u.href); }
});
$c("resetar").addEventListener("click", () => { est = { ...PADRAO }; document.querySelectorAll(".chips").forEach(c => delete c.dataset.aberto); $c("copiar").textContent = "📋 Copiar"; desenhar(); });
/* Contexto vindo da ficha: ?p=slug&via=sc|im */
(function contexto() {
  const q = new URLSearchParams(location.search), s = q.get("p"), pep = s ? porSlug(s) : null;
  if (q.get("via") && VIAS_CALC[q.get("via")]) est.via = q.get("via");
  if (s === "gonadotrofina-corionica-hcg") { est.unid = "UI"; est.frasco = null; est.dose = null; }
  if (pep) {
    const el = $c("calc-ctx");
    el.hidden = false;
    el.innerHTML = `Calculando para <a href="${urlPeptideo(pep.nome)}"><b>${esc(pep.nome)}</b></a>. A via ${est.via === "im" ? "intramuscular" : "subcutânea"} foi pré-selecionada conforme as vias descritas na ficha; a dose é sempre a da sua prescrição ou bula.`;
  }
})();
/* Estado compartilhado por link (?c=...): só aceita campos conhecidos, com tipos validados */
(function estadoDoLink() {
  try {
    const c = JSON.parse(new URLSearchParams(location.search).get("c") || "null");
    if (!c || typeof c !== "object") return;
    const num = v => (typeof v === "number" && Number.isFinite(v) && v > 0 && v < 1e6 ? v : null);
    if (["po", "pronto"].includes(c.tipo)) est.tipo = c.tipo;
    if (OPC[c.unid]) est.unid = c.unid;
    if (VIAS_CALC[c.via]) est.via = c.via;
    for (const k of ["frasco", "diluente", "seringa", "dose", "freq"]) est[k] = num(c[k]);
  } catch { /* link inválido: ignora */ }
})();
/* Salvar na lista "Meus protocolos" (mesmo armazenamento da página própria) */
const slugCtx = new URLSearchParams(location.search).get("p");
(function () {
  autoCompletar($c("prot-nome"));
  const pep = slugCtx ? porSlug(slugCtx) : null;
  if (pep) $c("prot-nome").value = pep.nome;
})();
function desenharProt() {
  const l = lerProtocolos().filter(x => x.calc).slice(-5).reverse();
  $c("prot-lista").innerHTML = l.length ? l.map(x => `<li><b>${esc(x.nome)}</b> <small>${esc(x.dose ? nf(x.dose, 2) + " " + x.unid : "")}</small> <button type="button" class="btn" data-ac="abrir" data-id="${x.id}">Abrir</button></li>`).join("") : "<li><small>Nenhum protocolo salvo ainda.</small></li>";
}
$c("prot-salvar").addEventListener("click", () => {
  const nome = $c("prot-nome").value.trim() || "Sem nome", cat = PEPTIDES.find(p => semAcento(p.nome.toLowerCase()) === semAcento(nome.toLowerCase())), l = lerProtocolos(), hoje = new Date().toISOString().slice(0, 10);
  const calc = { ...est };
  const estoqueUnidade = est.tipo === "pronto" ? "mL" : est.unid;
  const estoqueUso = est.tipo === "pronto" && est.frasco && est.dose
    ? est.dose / est.frasco
    : est.dose;
  l.push(normalizarProtocolo({
    nome: cat ? cat.nome : nome, slug: cat ? slug(cat.nome) : "", dose: est.dose, unid: est.unid, via: est.via,
    freq: FREQ_SEM[est.freq] || "", calc, inicio: hoje, criado: hoje,
    estoqueQuantidade: est.tipo === "po" ? est.frasco : null,
    estoqueUnidade, estoquePorAplicacao: estoqueUso, estoqueApresentacao: "injecao",
    estoqueQuantidadeManual: false, estoqueData: hoje,
  }));
  if (!gravarProtocolos(l)) return;
  try { navigator.storage && navigator.storage.persist && navigator.storage.persist(); } catch { /* sem suporte */ }
  $c("prot-nome").value = ""; $c("prot-ok").hidden = false; desenharProt();
});
$c("prot-lista").addEventListener("click", e => {
  const b = e.target.closest("button"); if (!b) return;
  const x = lerProtocolos().find(q => q.id === b.dataset.id);
  if (b.dataset.ac === "abrir" && x && x.calc) { est = { ...PADRAO, ...x.calc }; document.querySelectorAll(".chips").forEach(c => delete c.dataset.aberto); desenhar(); window.scrollTo({ top: 0, behavior: "smooth" }); }
});
migrarProtocolosAntigos();/* Conversor UI <-> mg: direção, referência opcional e resultado em destaque */
const CONV_REF = [
  ["", "Digitar a potência do meu rótulo", 0, ""],
  ["somatropina", "Somatropina (hormônio do crescimento)", 3, "Padrão atual da OMS: 1 mg ≈ 3 UI (alguns produtos antigos usam 2,6 UI/mg)."],
  ["insulina", "Insulina humana", 28.8, "Cerca de 28,8 UI por mg (1 UI ≈ 0,0347 mg)."],
  ["vitd", "Vitamina D3 (colecalciferol)", 40000, "1 UI = 0,025 mcg, ou seja, 40.000 UI por mg."],
  ["vita", "Vitamina A (retinol)", 3333, "1 UI = 0,3 mcg de retinol, ou seja, ≈ 3.333 UI por mg."],
  ["vite", "Vitamina E natural (d-alfa-tocoferol)", 1.49, "1 UI = 0,67 mg, ou seja, ≈ 1,49 UI por mg. A forma sintética (dl) é diferente (1 UI = 0,9 mg)."],
];
let convDir = "ui";
function converter() {
  const pot = parseFloat($c("conv-pot").value), v = parseFloat($c("conv-val").value);
  const saida = $c("conv-saida"), vazio = $c("conv-vazio");
  if (!(pot > 0) || !(v >= 0)) { saida.hidden = true; vazio.hidden = false; return; }
  const ui = convDir === "ui";
  const res = ui ? v / pot : v * pot;
  $c("conv-big").textContent = ui ? `${nf(res, 4)} mg` : `${nf(res, 2)} UI`;
  $c("conv-conta").textContent = ui ? `${nf(v, 2)} UI ÷ ${nf(pot, 2)} UI/mg = ${nf(res, 4)} mg` : `${nf(v, 4)} mg × ${nf(pot, 2)} UI/mg = ${nf(res, 2)} UI`;
  saida.hidden = false; vazio.hidden = true;
}
function direcaoConv(d) {
  convDir = d;
  $c("conv-d-ui").setAttribute("aria-pressed", d === "ui");
  $c("conv-d-mg").setAttribute("aria-pressed", d === "mg");
  $c("conv-q").textContent = tr(d === "ui" ? "Quantas UI?" : "Quantos mg?");
  $c("conv-lab").textContent = tr(d === "ui" ? "Valor em UI" : "Valor em mg");
  converter();
}
$c("conv-ref").innerHTML = CONV_REF.map((r, i) => `<option value="${i}">${esc(tr(r[1]))}</option>`).join("");
$c("conv-ref").addEventListener("change", () => {
  const r = CONV_REF[+$c("conv-ref").value];
  if (r[2]) $c("conv-pot").value = r[2];
  $c("conv-ref-nota").textContent = r[3] ? tr(r[3]) : "";
  converter();
});
$c("conv-pot").addEventListener("input", () => { $c("conv-ref").value = "0"; $c("conv-ref-nota").textContent = ""; converter(); });
$c("conv-val").addEventListener("input", converter);
$c("conv-d-ui").addEventListener("click", () => direcaoConv("ui"));
$c("conv-d-mg").addEventListener("click", () => direcaoConv("mg"));
desenharProt();
desenhar();
