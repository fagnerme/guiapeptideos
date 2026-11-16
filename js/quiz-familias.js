montarLayout();
const area = document.getElementById("quiz-area");
const cert = document.getElementById("certificado");
const embaralhar = a => { a = [...a]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const amostra = (a, n) => embaralhar(a).slice(0, n);
const frase = t => (t.split(/(?<=[.!?])\s/)[0] || t).slice(0, 160);
const FASES_Q = [...new Set(PEPTIDES.map(p => p.fase))];

function perguntas(fam) {
  const membros = fam.peptideos.map(n => PEPTIDES.find(p => p.nome === n)).filter(Boolean);
  const nomes = new Set(fam.peptideos);
  const fora = PEPTIDES.filter(p => !nomes.has(p.nome));
  const q = [];
  amostra(membros, 2).forEach(m => q.push({
    t: `Qual destas substâncias pertence à família "${tr(fam.nome)}"?`,
    o: embaralhar([m.nome, ...amostra(fora, 3).map(p => p.nome)]), c: m.nome,
    e: `${m.nome} pertence a esta família.` }));
  amostra(membros, 2).forEach(m => q.push({
    t: `Em que fase o catálogo coloca ${m.nome}?`,
    o: embaralhar([m.fase, ...amostra(FASES_Q.filter(f => f !== m.fase), 3)]), c: m.fase,
    e: `Fase atual no catálogo: ${m.fase}.` }));
  amostra(membros.filter(m => m.oQueFaz), 2).forEach(m => q.push({
    t: `Qual descrição combina com ${m.nome}?`,
    o: embaralhar([frase(m.oQueFaz), ...amostra(membros.filter(x => x !== m && x.oQueFaz && frase(x.oQueFaz) !== frase(m.oQueFaz)).concat(amostra(fora, 3)), 3).map(x => frase(x.oQueFaz))]),
    c: frase(m.oQueFaz), e: `Veja a ficha de ${m.nome} para mais detalhes.` }));
  return embaralhar(q);
}

function menu() {
  cert.hidden = true;
  area.innerHTML = `<div class="grid">${MECANISMOS.filter(f => f.peptideos.length >= 3).map(f =>
    `<div class="card"><h3>${esc(f.nome)}</h3><p>${f.peptideos.length} substâncias</p><button class="btn" data-f="${esc(f.id)}">Começar</button></div>`).join("")}</div>`;
}
area.addEventListener("click", e => { const b = e.target.closest("[data-f]"); if (b) jogar(MECANISMOS.find(f => f.id === b.dataset.f)); });

function jogar(fam) {
  const fila = perguntas(fam); let i = 0, pontos = 0;
  const ver = () => {
    if (i >= fila.length) return fim();
    const q = fila[i];
    area.innerHTML = `<p class="contagem">${esc(tr(fam.nome))} · Pergunta ${i + 1} de ${fila.length} · Acertos: ${pontos}</p>
      <h3>${esc(q.t)}</h3><div class="opcoes">${q.o.map((t, k) => `<button class="btn opcao" data-k="${k}">${esc(t)}</button>`).join("")}</div><div id="fb" aria-live="polite"></div>`;
    area.querySelectorAll(".opcao").forEach(b => b.addEventListener("click", () => {
      const ok = q.o[b.dataset.k] === q.c; if (ok) pontos++;
      area.querySelectorAll(".opcao").forEach(x => x.disabled = true);
      document.getElementById("fb").innerHTML = `<p><b>${ok ? "✅ Correto!" : "❌ Não foi dessa vez."}</b> ${esc(q.e)}</p><button class="btn" id="prox">${i + 1 < fila.length ? "Próxima" : "Ver resultado"}</button>`;
      document.getElementById("prox").addEventListener("click", () => { i++; ver(); });
    }));
  };
  const fim = () => {
    const pct = Math.round(100 * pontos / fila.length), passou = pct >= 70;
    area.innerHTML = `<h3>${pontos} de ${fila.length} (${pct}%)</h3>
      <p>${passou ? "Aprovado! Você pode gerar um certificado de estudo." : "Abaixo de 70%. Revise as fichas e tente de novo."}</p>
      ${passou ? `<p><label>Seu nome: <input id="nome-cert" maxlength="60"></label> <button class="btn" id="gerar">Gerar certificado</button></p>` : ""}
      <button class="btn" id="voltar">Outras famílias</button>`;
    document.getElementById("voltar").addEventListener("click", menu);
    const g = document.getElementById("gerar");
    if (g) g.addEventListener("click", () => {
      const nome = document.getElementById("nome-cert").value.trim();
      if (!nome) return document.getElementById("nome-cert").focus();
      cert.hidden = false;
      cert.innerHTML = `<h2>Certificado de estudo</h2><p>Certificamos que <b>${esc(nome)}</b> concluiu o quiz educativo da família <b>${esc(tr(fam.nome))}</b> com ${pct}% de acertos, em ${new Date().toLocaleDateString()}.</p>
        <p><small>Documento de autoestudo do Guia Educativo de Peptídeos, Hormônios e Suplementos. Não é certificação profissional nem valida competência clínica.</small></p>
        <p class="nao-imprimir"><button class="btn" id="imp">ðŸ–¨ï¸ Imprimir / salvar em PDF</button></p>`;
      document.getElementById("imp").addEventListener("click", () => { document.body.classList.add("imprimindo-cert"); window.print(); document.body.classList.remove("imprimindo-cert"); });
      cert.scrollIntoView();
    });
  };
  ver();
}
menu();
