montarLayout();
const total = PEPTIDES.length;
const revisados = Object.keys(REVISOES).length;
const pend = Object.entries(REVISAO_PENDENTE).filter(([s]) => porSlug(s));
const TIPOS_REVISAO = { aprovacao: "✅ Aprovação", seguranca: "⚠️ Segurança", estudos: "🧪 Estudos", conteudo: "✏️ Conteúdo", fase: "🔬 Fase" };
document.getElementById("resumo-revisao").innerHTML =
  `<b>${revisados}</b> ${tr("de")} <b>${total}</b> ${tr("fichas têm revisão por profissional de saúde registrada.")} <b>${pend.length}</b> ${tr("fichas têm sinais automáticos pendentes de revisão.")}`;
document.getElementById("lista-revisao").innerHTML = pend.length
  ? pend.map(([s, l]) => `<section class="boas"><h3><a href="fichas/${esc(s)}.html">${esc(porSlug(s).nome)}</a></h3><ul>${l.map(x => `<li><b>${esc(TIPOS_REVISAO[x.tipo] || x.tipo)}</b> · ${esc(x.data)} — ${esc(notaAuto(x.texto))}</li>`).join("")}</ul></section>`).join("")
  : "<p>Nenhum sinal pendente no momento.</p>";

snapshot().then(snap => {
  const status = document.getElementById("status-coleta");
  const log = document.getElementById("log-coletas");
  if (!snap || (!snap.geradoEm && !Array.isArray(snap.execucoes))) {
    status.textContent = tr("Nenhuma execução da coleta está registrada.");
    log.innerHTML = "";
    return;
  }

  const execucoes = Array.isArray(snap.execucoes) ? snap.execucoes : [];
  const maisRecente = execucoes[0] || null;
  status.textContent = maisRecente
    ? `${tr(maisRecente.status === "falhou" ? "Última execução falhou" : "Última execução registrada")}: ${new Date(maisRecente.concluidaEm).toLocaleString(LOCALE)}.`
    : `${tr("Última coleta registrada")}: ${new Date(snap.geradoEm).toLocaleString(LOCALE)}. ${tr("Esta execução ainda não tem log detalhado.")}`;
  if (snap.geradoEm && Date.now() - new Date(snap.geradoEm).getTime() > 8 * 24 * 60 * 60 * 1000) {
    status.textContent += ` ${tr("A coleta está atrasada; os dados exibidos são da última execução registrada.")}`;
  }
  const linhas = execucoes.length ? execucoes : [{
    concluidaEm: snap.geradoEm,
    status: "sem_log",
    escopo: "desconhecido",
    itensProcessados: null,
    itensNoCatalogo: null,
    consultasSemResposta: null,
  }];
  const rotulos = {
    concluida: tr("Concluída"),
    concluida_com_falhas: tr("Concluída com consultas sem resposta"),
    falhou: tr("Falhou"),
    sem_log: tr("Sem log detalhado"),
  };
  log.innerHTML = linhas.map(x => {
    const data = new Date(x.concluidaEm).toLocaleString(LOCALE);
    const total = x.itensProcessados === null ? "" : ` · ${x.itensProcessados}/${x.itensNoCatalogo} ${tr("itens processados")}`;
    const falhas = x.consultasSemResposta === null ? "" : ` · ${x.consultasSemResposta} ${tr("consultas sem resposta")}`;
    const escopo = x.escopo === "parcial" ? tr("execução parcial") : x.escopo === "catalogo" ? tr("catálogo completo") : "";
    const erro = x.erro ? ` · ${esc(x.erro)}` : "";
    return `<li><time>${esc(data)}</time> · ${esc(rotulos[x.status] || x.status)}${escopo ? ` · ${esc(escopo)}` : ""}${total}${falhas}${erro}</li>`;
  }).join("");
});
