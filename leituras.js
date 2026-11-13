montarLayout();
const raiz = document.getElementById("lista-leituras");
const href = l => l.url || ("https://www.amazon.com.br/s?k=" + encodeURIComponent(l.busca) + (AFILIADOS.amazonTag ? "&tag=" + encodeURIComponent(AFILIADOS.amazonTag) : ""));
const avisoAf = document.createElement("p");
avisoAf.className = "boas";
avisoAf.innerHTML = `<b>Divulgação:</b> alguns links podem ser de afiliado. Se você comprar por eles, o guia pode receber uma pequena comissão, sem custo extra para você. Isso não influencia o conteúdo das fichas. Veja a <a href="privacidade.html">política de privacidade</a>.`;
raiz.before(avisoAf);
raiz.innerHTML = LEITURAS.map(l => `<div class="card"><span class="tag">${esc(l.tipo)}</span><h3>${esc(l.titulo)}</h3><p><small>${esc(l.autor)}</small></p><p>${esc(l.nota)}</p>
  <a class="btn" href="${esc(href(l))}" target="_blank" rel="sponsored noopener noreferrer">Ver ${l.tipo === "Curso" ? "curso" : "livro"} ↗</a></div>`).join("");