montarLayout();
const chaveAlvo = new URLSearchParams(location.search).get("a");
const alvo = ALVOS[chaveAlvo];
const alvoEl = document.getElementById("alvo-conteudo");
if (!alvo) {
  seoNaoIndexar();
  alvoEl.innerHTML = `<h2>Alvo não encontrado</h2><p><a href="alvos.html">Ver todos os hormônios e alvos</a></p>`;
} else {
  document.title = `${alvo.nome} — o que faz e quais substâncias agem nele | Guia Educativo de Peptídeos, Hormônios e Suplementos`;
  const descAlvo = `${alvo.nome}: ${alvo.oque}`.slice(0, 300);
  document.querySelector('meta[name="description"]').content = descAlvo;
  seoAtualizar("alvo.html?a=" + chaveAlvo, [{ "@type": "MedicalWebPage", name: alvo.nome, description: descAlvo, inLanguage: "pt-BR" }]);
  document.getElementById("mig-alvo").textContent = alvo.nome;
  const org = alvo.orgaos.map(o => `<a class="chip-alvo org" href="corpo.html?o=${o}">${esc(ORGAOS[o])}</a>`).join("");
  const opoe = (alvo.opoe || []).filter(([k]) => ALVOS[k]).map(([k, n]) => `<li><a href="alvo.html?a=${k}">${esc(ALVOS[k].nome)}</a> — ${esc(n)}</li>`).join("");
  const vizinhos = [...new Set(alvo.peps.flatMap(s => alvosDe(s).map(([k]) => k)))].filter(k => k !== chaveAlvo);
  alvoEl.innerHTML = `<h2>${esc(alvo.nome)}</h2><p><span class="tag">${esc(alvo.tipo)}</span></p>
    <section class="boas"><h3>O que é e o que faz</h3><p>${esc(alvo.oque)}</p><ul>${alvo.efeitos.map(e => `<li>${esc(e)}</li>`).join("")}</ul></section>
    <section class="boas"><h3>Onde atua</h3><p>${esc(alvo.onde)}</p><p>${org}</p></section>
    <section class="boas"><h3>${tr("Substâncias que agem aqui")}</h3>${listaPeps(alvo)}<p><small>“Ação proposta” indica mecanismo sugerido, sem comprovação sólida em humanos.</small></p></section>
    ${opoe ? `<section class="boas"><h3>Efeito contrário</h3><ul>${opoe}</ul></section>` : ""}
    ${vizinhos.length ? `<section class="boas"><h3>Alvos relacionados</h3><p>${vizinhos.map(k => `<a href="alvo.html?a=${k}">${esc(ALVOS[k].nome)}</a>`).join(" · ")}</p><p><small>${tr("Substâncias que agem em mais de um alvo aparecem nos dois.")}</small></p></section>` : ""}
    <section class="boas"><h3>Veja também</h3><p><a href="interacoes.html">Interações e cuidados</a> · <a href="sinais.html">Sinais de alerta</a> · <a href="duracao.html">Duração e armazenamento</a> · <a href="corpo.html">Mapa do corpo</a> · <a href="classes.html">Comparar classes</a> · <a href="glossario.html">Glossário</a></p></section>
    <p><small>Texto educativo, escrito de forma resumida. Confirme em fontes oficiais. Não é orientação médica.</small></p>`;
}
