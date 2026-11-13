montarLayout();
const TIPOS_MUDANCAS = { aprovacao: "✅ Aprovação", seguranca: "⚠️ Segurança", estudos: "🧪 Estudos", conteudo: "✏️ Conteúdo", recurso: "🆕 Recurso" };
const todos = [...HISTORICO_AUTO.map(h => ({ ...h, auto: true })), ...MUDANCAS]
  .sort((a, b) => b.data.localeCompare(a.data));
let atual = "";
const filtroPep = new URLSearchParams(location.search).get("p") || "";
const filtro = document.getElementById("filtro-tipo");
filtro.innerHTML = `<button type="button" class="btn" data-t="">Todos</button>` + Object.entries(TIPOS_MUDANCAS).map(([k, v]) => `<button type="button" class="btn" data-t="${k}">${v}</button>`).join("");
function desenhar() {
  const av = document.getElementById("aviso-pep");
  const pp = filtroPep && porSlug(filtroPep);
  if (av) av.innerHTML = pp ? `Mostrando só: <a href="${urlPeptideo(pp.nome)}">${esc(pp.nome)}</a> · <a href="mudancas.html">ver todas</a>` : "";
  filtro.querySelectorAll("button").forEach(b => b.setAttribute("aria-pressed", b.dataset.t === atual));
  const itens = todos.filter(m => (!atual || m.tipo === atual) && (!filtroPep || m.slug === filtroPep));
  document.getElementById("lista-mudancas").innerHTML = itens.length ? itens.map(m => {
    const p = m.slug && porSlug(m.slug);
    return `<li><b>${esc(dataBR(m.data))}</b> · <span class="tag">${TIPOS_MUDANCAS[m.tipo] || m.tipo}</span>${m.auto ? ' <span class="tag">automático</span>' : ""}<br>${p ? `<a href="${urlPeptideo(p.nome)}">${esc(p.nome)}</a>: ` : ""}${esc(m.texto)}</li>`;
  }).join("") : "<li>Nenhuma mudança neste filtro.</li>";
}
filtro.addEventListener("click", e => { const b = e.target.closest("button"); if (b) { atual = b.dataset.t; desenhar(); } });
desenhar();