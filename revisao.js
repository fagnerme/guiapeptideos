montarLayout();
const total = PEPTIDES.length;
const revisados = Object.keys(REVISOES).length;
const pend = Object.entries(REVISAO_PENDENTE).filter(([s]) => porSlug(s));
const TIPOS_REVISAO = { aprovacao: "✅ Aprovação", seguranca: "⚠️ Segurança", estudos: "🧪 Estudos", conteudo: "✏️ Conteúdo", fase: "🔬 Fase" };
document.getElementById("resumo-revisao").innerHTML =
  `<b>${revisados}</b> de ${total} fichas têm revisão por profissional de saúde registrada. <b>${pend.length}</b> fichas foram atualizadas automaticamente a partir das fontes.`;
document.getElementById("lista-revisao").innerHTML = pend.length
  ? pend.map(([s, l]) => `<section class="boas"><h3><a href="ficha-${esc(s)}.html">${esc(porSlug(s).nome)}</a></h3><ul>${l.map(x => `<li><b>${esc(TIPOS_REVISAO[x.tipo] || x.tipo)}</b> · ${esc(x.data)} — ${esc(notaAuto(x.texto))}</li>`).join("")}</ul></section>`).join("")
  : "<p>Nenhum sinal pendente no momento.</p>";
