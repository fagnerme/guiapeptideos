montarLayout();
/* Meus protocolos: diário pessoal guardado só neste aparelho. Não sugere doses; registra o que a pessoa já usa por orientação profissional. */
const $p = id => document.getElementById(id);
const UNIDS = ["mg", "mcg", "UI", "mL", "g", "comprimido(s)", "cápsula(s)", "gota(s)", "dose(s)"];
const FREQS = ["Diária", "2× ao dia", "Dias alternados", "1×/semana", "2×/semana", "3×/semana", "5×/semana", "Se necessário", "Outra"];
const HORARIOS = ["", "Ao acordar", "Em jejum", "Manhã", "Com refeição", "Tarde", "Noite", "Antes de dormir"];
const CH_EVOLUCAO = "meus_protocolos_evolucao_v1";
const INDICADORES = {
  peso: ["Peso", "kg"], cintura: ["Circunferência abdominal", "cm"], "gordura-corporal": ["Gordura corporal (estimativa)", "%"],
  "gordura-visceral": ["Gordura visceral (estimativa da balança)", "índice"], "massa-magra": ["Massa magra (estimativa)", "kg"],
  forca: ["Força / desempenho", "unid."], sono: ["Sono", "horas"], energia: ["Energia percebida", "escala 1–10"],
  sintomas: ["Sintomas / bem-estar", "escala 1–10"], outro: ["Outro indicador", ""],
};
const VIAS_P = { sc: "Subcutânea", im: "Intramuscular", iv: "Intravenosa", oral: "Oral", nasal: "Nasal", top: "Tópica (pele)", inal: "Inalada", outra: "Outra" };
const STATUS_P = { ativo: "Ativo", pausado: "Pausado", concluido: "Concluído" };
const DIAS_SEMANA = [[1, "segunda"], [2, "terça"], [3, "quarta"], [4, "quinta"], [5, "sexta"], [6, "sábado"], [0, "domingo"]];
const hojeISO = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`; };
const fmtData = iso => iso ? new Date(iso + "T12:00:00").toLocaleDateString(LOCALE) : "";
const dias = iso => Math.max(0, Math.round((Date.now() - new Date(iso + "T12:00:00")) / 864e5));
let filtro = "ativo", editando = null, diasAutomaticos = false;
let horariosFormulario = [];
let apresentacaoEstoqueManual = false, estoqueQuantidadeManual = false, ultimaApresentacaoEstoque = "";
let quantidadeEstoqueAutoAnterior = null, ultimaUnidadeEstoque = "";
let meiaVidaEditada = false, meiaVidaGraficoSelecionado = "";
let mesAcompanhamento = hojeISO().slice(0, 7);
let mesAtualConhecido = mesAcompanhamento;
let diaSelecionadoCalendario = hojeISO();
let indicadorGraficoAtual = null;
let protocolosVisiveisGrafico = new Set();
let protocolosVinculadosGrafico = new Set();
let coresProtocolos = new Map();
let registroDosePendente = null;
let exclusaoPendente = null;

function opcoes(lista, atual, rot) { return lista.map(v => `<option value="${esc(v)}"${v === atual ? " selected" : ""}>${esc(rot ? rot(v) : v) || "—"}</option>`).join(""); }
function atualizarCoresProtocolos(protocolos) {
  const ids = [...new Set(protocolos.map(x => x.id))].sort();
  coresProtocolos = new Map(ids.map((id, i) => {
    const tom = Math.round((215 + i * 137.508) % 360);
    return [id, `hsl(${tom} 68% 42%)`];
  }));
}
function corProtocolo(id) {
  return coresProtocolos.get(id) || "hsl(215 68% 42%)";
}
function guardarPersistente() { try { navigator.storage && navigator.storage.persist && navigator.storage.persist(); } catch { /* sem suporte */ } }
function dadosBackup() {
  return { versao: 2, exportado: new Date().toISOString(), itens: lerProtocolos(), medidas: lerMedidas() };
}
function baixarBackup() {
  try {
    const blob = new Blob([JSON.stringify(dadosBackup(), null, 1)], { type: "application/json" });
    const url = URL.createObjectURL(blob), a = document.createElement("a");
    a.href = url;
    a.download = `meus-protocolos-${hojeISO()}.json`;
    document.body.append(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    return true;
  } catch {
    $p("msg-imp").textContent = tr("Não foi possível gerar a cópia de segurança.");
    return false;
  }
}
function atualizacaoDialogoExclusao(tipo, dados = { protocolos: lerProtocolos(), medidas: lerMedidas() }) {
  exclusaoPendente = { tipo, snapshot: JSON.stringify(dados), backupBaixado: false };
  const apagarProtocolos = tipo !== "medidas", apagarMedidas = tipo !== "protocolos";
  $p("exclusao-contagem").textContent = [
    `${tr(apagarProtocolos ? "Protocolos a apagar:" : "Protocolos que serão mantidos:")} ${dados.protocolos.length}`,
    `${tr(apagarMedidas ? "Medições a apagar:" : "Medições que serão mantidas:")} ${dados.medidas.length}`,
  ].join(" · ");
  $p("exclusao-contexto").textContent = tr({
    protocolos: "Serão removidos os protocolos e seus registros de aplicações. As medições serão mantidas.",
    medidas: "Serão removidas as medições. Os protocolos e registros de aplicações serão mantidos.",
    tudo: "Serão removidos protocolos, registros de aplicações e medições.",
  }[tipo]);
  $p("exclusao-backup-confirmada").checked = false;
  $p("exclusao-frase").value = "";
  $p("exclusao-erro").hidden = true;
  $p("exclusao-confirmar").disabled = true;
}
function atualizarConfirmacaoExclusao() {
  $p("exclusao-confirmar").disabled = !exclusaoPendente?.backupBaixado
    || !$p("exclusao-backup-confirmada").checked
    || $p("exclusao-frase").value.trim().toLocaleUpperCase() !== tr("APAGAR").toLocaleUpperCase();
}
function limparDadosExclusao(tipo) {
  const apagarProtocolos = tipo !== "medidas", apagarMedidas = tipo !== "protocolos";
  const protocolosApagados = !apagarProtocolos || gravarProtocolos([]);
  const medidasApagadas = !apagarMedidas || gravarMedidas([]);
  const protocolosConfirmados = !apagarProtocolos || protocolosApagados && lerProtocolos().length === 0;
  const medidasConfirmadas = !apagarMedidas || medidasApagadas && lerMedidas().length === 0;
  desenhar();
  if (protocolosConfirmados && medidasConfirmadas) {
    $p("msg-imp").textContent = tr({
      protocolos: "Protocolos e registros de aplicações apagados. As medições foram mantidas.",
      medidas: "Medições apagadas. Os protocolos e registros de aplicações foram mantidos.",
      tudo: "Protocolos, registros de aplicações e medições apagados deste aparelho.",
    }[tipo]);
  } else if (apagarProtocolos && protocolosConfirmados) {
    $p("msg-imp").textContent = tr("Protocolos apagados, mas não foi possível apagar as medições.");
  } else if (apagarMedidas && medidasConfirmadas) {
    $p("msg-imp").textContent = tr("Medições apagadas, mas não foi possível apagar os protocolos.");
  } else if (tipo === "protocolos") {
    $p("msg-imp").textContent = tr("Não foi possível apagar os protocolos.");
  } else if (tipo === "medidas") {
    $p("msg-imp").textContent = tr("Não foi possível apagar as medições.");
  } else {
    $p("msg-imp").textContent = tr("Não foi possível apagar os dados. Tente novamente.");
  }
}
function definirDias(dias = []) {
  const selecionados = new Set(dias);
  $p("f-dias").querySelectorAll('input[type="checkbox"]').forEach(c => { c.checked = selecionados.has(Number(c.value)); });
}
function dataFinalSemanas(inicio, semanas) {
  if (!inicio || !Number.isInteger(semanas) || semanas < 1) return "";
  const data = new Date(inicio + "T12:00:00");
  data.setDate(data.getDate() + semanas * 7 - 1);
  return `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, "0")}-${String(data.getDate()).padStart(2, "0")}`;
}
function atualizarFimFormulario(tipo) {
  $p("f-fim-data-wrap").hidden = tipo !== "data";
  $p("f-fim").required = tipo === "data";
  $p("f-fim-semanas-wrap").hidden = tipo !== "semanas";
  $p("f-fim-semanas").required = tipo === "semanas";
}
function atualizarDiasFormulario(freq) {
  const automatico = ["Dias alternados", "Se necessário"].includes(freq);
  $p("f-dias").querySelectorAll('input[type="checkbox"]').forEach(c => { c.disabled = automatico; });
  $p("f-dias-dica").textContent = automatico
    ? tr(freq === "Dias alternados"
      ? "Em dias alternados, o acompanhamento usa a data de início como referência e alterna a cada dois dias."
      : "Se necessário não gera lembretes; o calendário registra as marcações feitas.")
    : tr("Marque somente os dias combinados com o profissional. Sem dias definidos, não haverá lembrete de aplicação.");
}
function atualizarHorariosFormulario(freq) {
  const diaria = freq === "Diária", duplo = freq === "2× ao dia";
  $p("f-aplicacoes-dia-wrap").hidden = !diaria;
  if (duplo) $p("f-aplicacoes-dia").value = "2";
  const quantidade = duplo ? 2 : Number($p("f-aplicacoes-dia").value) || 1;
  const multiplas = diaria && quantidade > 1 || duplo;
  $p("f-horarios-dia").hidden = !diaria && !duplo;
  $p("f-hora").closest("label").hidden = multiplas;
  if (multiplas) desenharCamposHorario(quantidade);
  else $p("f-horarios-dia-lista").replaceChildren();
}
function desenharCamposHorario(quantidade) {
  horariosFormulario = horariosFormulario.slice(0, quantidade);
  while (horariosFormulario.length < quantidade) horariosFormulario.push("");
  const rotulos = ["Primeira aplicação", "Segunda aplicação"];
  $p("f-horarios-dia-lista").innerHTML = horariosFormulario.map((hora, i) =>
    `<label>${tr(rotulos[i] || "Aplicação")} ${i + 1 > 2 ? i + 1 : ""}<input type="time" data-horario-dia="${i}" value="${esc(hora)}" required></label>`
  ).join("");
}
function diasSelecionados() {
  if (["Dias alternados", "Se necessário"].includes($p("f-freq").value)) return [];
  return [...$p("f-dias").querySelectorAll('input:checked')].map(c => Number(c.value)).sort();
}

/* Datalist com o catálogo inteiro */
autoCompletar($p("f-nome"));
const acharPorNome = n => { const t = semAcento((n || "").trim().toLowerCase()); return t ? PEPTIDES.find(p => semAcento(p.nome.toLowerCase()) === t) : null; };

function numeroPositivo(valor) {
  const numero = parseFloat(String(valor || "").replace(",", "."));
  return Number.isFinite(numero) && numero > 0 ? numero : null;
}
function meiaVidaCatalogo(nome) {
  const p = acharPorNome(nome);
  if (!p || typeof FARMACO === "undefined") return null;
  const horas = FARMACO[slug(p.nome)]?.h;
  return Number.isFinite(horas) && horas > 0 && horas <= 8760 ? horas : null;
}
function atualizarSugestaoMeiaVida() {
  if (meiaVidaEditada) {
    $p("f-meia-vida-ajuda").textContent = tr("Este valor será usado somente na curva teórica deste protocolo.");
    return;
  }
  const horas = meiaVidaCatalogo($p("f-nome").value);
  $p("f-meia-vida").value = horas ?? "";
  $p("f-meia-vida-ajuda").textContent = horas
    ? `${tr("Sugestão aproximada do catálogo")}: ${nfp(horas)} ${tr("horas")}. ${tr("Confirme para a apresentação específica; você pode editar este valor.")}`
    : tr("Sem valor confiável no catálogo. Informe a meia-vida apenas se tiver uma fonte para a apresentação específica.");
}
function atualizarFormularioDiluicao() {
  const emPo = $p("f-calc-tipo").value === "po";
  $p("f-calc-diluente-wrap").hidden = !emPo;
  $p("f-calc-diluente").disabled = !emPo;
  atualizarResumoCalculadoraFormulario();
}
function dadosCalculadoraDoFormulario(dose, unid, anterior) {
  const frasco = numeroPositivo($p("f-calc-frasco").value);
  const diluente = $p("f-calc-tipo").value === "po" ? numeroPositivo($p("f-calc-diluente").value) : null;
  const seringa = numeroPositivo($p("f-calc-seringa").value);
  if (!frasco && !diluente && !seringa) return null;
  const calcUnid = $p("f-calc-unid").value;
  return {
    tipo: $p("f-calc-tipo").value,
    unid: calcUnid,
    via: ["sc", "im"].includes($p("f-via").value) ? $p("f-via").value : anterior?.via || "",
    frasco, diluente, seringa,
    dose: calcUnid === unid ? dose : null,
    freq: anterior?.freq || null,
  };
}
function padraoEstoqueProtocolo(f) {
  if (!f.calc) return { quantidade: "", unidade: f.unid || "mg", uso: "", data: f.estoqueData || hojeISO() };
  if (f.calc.tipo === "po" && f.calc.frasco) {
    return {
      quantidade: f.calc.frasco,
      unidade: f.calc.unid,
      uso: f.calc.unid === f.unid ? f.dose ?? "" : "",
      data: f.estoqueData || hojeISO(),
    };
  }
  if (f.calc.tipo === "pronto" && f.calc.frasco && f.unid === f.calc.unid && f.dose) {
    return { quantidade: "", unidade: "mL", uso: f.dose / f.calc.frasco, data: f.estoqueData || hojeISO() };
  }
  return { quantidade: "", unidade: f.unid || "mg", uso: "", data: f.estoqueData || hojeISO() };
}
function formaEstoquePadrao(f = {}) {
  if (["injecao", "comprimido", "capsula", "outra"].includes(f.estoqueApresentacao)) return f.estoqueApresentacao;
  if (f.estoqueUnidade === "comprimido(s)") return "comprimido";
  if (f.estoqueUnidade === "cápsula(s)") return "capsula";
  if (["sc", "im", "iv"].includes(f.via)) return "injecao";
  return f.via === "oral" ? "comprimido" : "outra";
}
function formaEstoquePelaVia(via) {
  if (["sc", "im", "iv"].includes(via)) return "injecao";
  return via === "oral" ? "comprimido" : "outra";
}
function sincronizarModoEstoquePelaVia() {
  if (apresentacaoEstoqueManual) return;
  const forma = formaEstoquePelaVia($p("f-via").value);
  if (forma === ultimaApresentacaoEstoque) return;
  $p("f-estoque-forma").value = forma;
  ultimaApresentacaoEstoque = forma;
  estoqueQuantidadeManual = false;
  quantidadeEstoqueAutoAnterior = null;
  $p("f-estoque-quantidade").value = "";
  $p("f-estoque-potencia").value = "";
  $p("f-estoque-uso").value = "";
  if (forma === "outra") $p("f-estoque-unidade").innerHTML = opcoes(UNIDS, $p("f-unid").value);
}
function sincronizarCamposEstoqueFormulario() {
  const forma = $p("f-estoque-forma").value;
  const dose = numeroPositivo($p("f-dose").value);
  const unidadeDose = $p("f-unid").value;
  const frasco = numeroPositivo($p("f-calc-frasco").value);
  const unidadeRotulo = $p("f-calc-unid").value;
  const potencia = numeroPositivo($p("f-estoque-potencia").value);
  let unidade = $p("f-estoque-unidade").value || unidadeDose || "mg";
  let consumo = null, unidadeFixa = "";
  const calcCompativel = frasco && dose && unidadeRotulo === unidadeDose;
  const poAtivo = forma === "injecao" && $p("f-calc-tipo").value === "po" && frasco
    && (!dose || unidadeRotulo === unidadeDose);

  if (!estoqueQuantidadeManual && quantidadeEstoqueAutoAnterior !== null
    && (!poAtivo || frasco !== quantidadeEstoqueAutoAnterior)
    && Number($p("f-estoque-quantidade").value) === quantidadeEstoqueAutoAnterior) {
    $p("f-estoque-quantidade").value = "";
    quantidadeEstoqueAutoAnterior = null;
  }

  if (forma === "injecao") {
    if (calcCompativel && $p("f-calc-tipo").value === "pronto") {
      unidade = "mL";
      consumo = dose / frasco;
      unidadeFixa = unidade;
    } else if (calcCompativel && $p("f-calc-tipo").value === "po") {
      unidade = unidadeRotulo;
      consumo = dose;
      unidadeFixa = unidade;
    } else if (dose && UNIDS.includes(unidadeDose) && !["comprimido(s)", "cápsula(s)"].includes(unidadeDose)) {
      unidade = unidadeDose;
      consumo = dose;
      unidadeFixa = unidade;
    } else if (frasco && $p("f-calc-tipo").value === "po" && !dose) {
      unidade = unidadeRotulo;
      unidadeFixa = unidade;
    }
  } else if (forma === "comprimido" || forma === "capsula") {
    unidade = forma === "comprimido" ? "comprimido(s)" : "cápsula(s)";
    unidadeFixa = unidade;
    if (dose && unidadeDose === unidade) consumo = dose;
    else if (dose && potencia) consumo = dose / potencia;
  } else if (unidade === unidadeDose && dose) {
    consumo = dose;
  }

  if (ultimaUnidadeEstoque && ultimaUnidadeEstoque !== unidade) {
    $p("f-estoque-quantidade").value = "";
    $p("f-estoque-uso").value = "";
    estoqueQuantidadeManual = false;
    quantidadeEstoqueAutoAnterior = null;
  }
  if (forma === "injecao" && $p("f-calc-tipo").value === "po" && frasco
    && (!dose || unidadeRotulo === unidadeDose) && !estoqueQuantidadeManual) {
    $p("f-estoque-quantidade").value = String(frasco);
    quantidadeEstoqueAutoAnterior = frasco;
  }
  ultimaUnidadeEstoque = unidade;

  const unidadeWrap = $p("f-estoque-unidade-wrap");
  unidadeWrap.hidden = Boolean(unidadeFixa);
  const unidadeSelect = $p("f-estoque-unidade");
  const opcoesUnidade = unidadeFixa ? [unidadeFixa] : UNIDS;
  if (unidadeSelect.options.length !== opcoesUnidade.length
    || [...unidadeSelect.options].some((option, i) => option.value !== opcoesUnidade[i])) {
    unidadeSelect.innerHTML = opcoes(opcoesUnidade, unidade, tr);
  }
  if (!unidadeFixa && !opcoesUnidade.includes(unidadeSelect.value)) {
    unidadeSelect.value = opcoesUnidade.includes(unidadeDose) ? unidadeDose : opcoesUnidade[0];
    unidade = unidadeSelect.value;
    if (unidade === unidadeDose && dose) consumo = dose;
  } else if (unidadeFixa) {
    unidadeSelect.value = unidadeFixa;
  } else {
    unidade = unidadeSelect.value;
  }

  $p("f-estoque-potencia-wrap").hidden = !["comprimido", "capsula"].includes(forma) || unidadeDose === unidade;
  $p("f-estoque-potencia-unidade").textContent = unidadeDose;
  $p("f-estoque-quantidade-label").firstChild.textContent = tr({
    injecao: "Quantidade total disponível (some os frascos)",
    comprimido: "Comprimidos disponíveis",
    capsula: "Cápsulas disponíveis",
    outra: "Quantidade disponível",
  }[forma]) + " ";
  $p("f-estoque-uso-label").firstChild.textContent = tr({
    injecao: "Consumo calculado por aplicação",
    comprimido: consumo !== null ? "Comprimidos por aplicação" : "Comprimidos usados por aplicação",
    capsula: consumo !== null ? "Cápsulas por aplicação" : "Cápsulas usadas por aplicação",
    outra: "Quantidade usada por aplicação",
  }[forma]) + " ";

  const ajuda = forma === "injecao"
    ? calcCompativel && $p("f-calc-tipo").value === "pronto"
      ? "A dose e a concentração calculam o consumo em mL. Informe o volume total disponível; a concentração não informa o volume do frasco."
      : calcCompativel && $p("f-calc-tipo").value === "po"
        ? "O consumo é calculado pela dose. A quantidade sugerida corresponde a um frasco; ajuste para somar o estoque disponível."
        : dose
          ? "O consumo é considerado na mesma unidade da dose. Informe o total disponível usando essa unidade."
          : "Informe a dose e os dados do rótulo para calcular o consumo quando possível."
    : forma === "comprimido"
      ? "Informe quantos comprimidos estão disponíveis. Se a dose estiver em mg, mcg ou UI, informe o conteúdo de cada comprimido para calcular quantos são usados por aplicação."
      : forma === "capsula"
        ? "Informe quantas cápsulas estão disponíveis. Se a dose estiver em mg, mcg ou UI, informe o conteúdo de cada cápsula para calcular quantas são usadas por aplicação."
        : "Informe o total, a unidade e o consumo por aplicação. A unidade do estoque e a do consumo precisam ser iguais.";
  $p("f-estoque-ajuda").textContent = tr(ajuda);
  const usoInput = $p("f-estoque-uso");
  usoInput.readOnly = consumo !== null;
  if (consumo !== null && Number.isFinite(consumo) && consumo > 0) usoInput.value = String(consumo);
  return { unidade, consumo: consumo ?? numeroPositivo(usoInput.value) };
}
function atualizarResumoEstoqueFormulario() {
  const el = $p("f-estoque-resumo");
  if (!el) return;
  const campos = sincronizarCamposEstoqueFormulario();
  const quantidade = numeroPositivo($p("f-estoque-quantidade").value);
  const uso = campos.consumo;
  const unidade = campos.unidade;
  const data = $p("f-estoque-data").value || hojeISO();
  const inicio = $p("f-inicio").value;
  const fimTipo = $p("f-fim-tipo").value;
  const fim = fimTipo === "data" ? $p("f-fim").value
    : fimTipo === "semanas" ? dataFinalSemanas(inicio, Number($p("f-fim-semanas").value))
      : "";
  if (!quantidade || !uso || !unidade) {
    el.textContent = tr("Preencha quantidade disponível, unidade e consumo por aplicação para ver uma previsão.");
    return;
  }
  const usos = quantidade / uso;
  const estimativa = previsaoFimEstoque({
    ...normalizarProtocolo({
      freq: $p("f-freq").value,
      inicio,
      fim,
      fimTipo,
      aplicacoesDia: $p("f-aplicacoes-dia").value,
      diasSemana: diasSelecionados(),
      tomadas: [],
      status: "ativo",
    }),
    estoqueQuantidade: quantidade,
    estoqueUnidade: unidade,
    estoquePorAplicacao: uso,
    estoqueData: data,
  });
  el.textContent = `${tr("Estoque equivalente a")} ${nfp(usos)} ${tr("aplicações")}${estimativa ? ` · ${tr("Previsão de término")}: ${fmtData(estimativa)}` : ` · ${tr("Não foi possível estimar com esta programação")}`}. ${tr("Previsão aproximada; confira o estoque real.")}`;
}
function aplicacoesPorSemanaFormulario() {
  const freq = $p("f-freq").value;
  if (freq === "Diária" || freq === "2× ao dia") {
    const diasMarcados = $p("f-dias").querySelectorAll('input[type="checkbox"]:checked').length;
    const porDia = freq === "2× ao dia" ? 2 : Math.max(1, Math.min(24, Number($p("f-aplicacoes-dia").value) || 1));
    return diasMarcados * porDia;
  }
  const semanal = freq.match(/^([1-5])×\/semana$/);
  return semanal ? Number(semanal[1]) : null;
}
function atualizarResumoCalculadoraFormulario() {
  const el = $p("f-calc-resumo");
  if (!el) return;
  const frasco = numeroPositivo($p("f-calc-frasco").value);
  if (!frasco) {
    el.textContent = tr("Informe a quantidade total do rótulo para ver os cálculos.");
    return;
  }
  const tipo = $p("f-calc-tipo").value, unid = $p("f-calc-unid").value;
  const parteQuantidade = tipo === "pronto"
    ? `${tr("Concentração no rótulo")}: ${nfp(frasco)} ${unid}/mL.`
    : `${tr("Quantidade total no frasco")}: ${nfp(frasco)} ${unid}.`;
  if (tipo === "po" && !numeroPositivo($p("f-calc-diluente").value)) {
    el.textContent = `${parteQuantidade} ${tr("Informe o volume de diluente registrado para calcular a concentração.")}`;
    return;
  }
  const concentracao = tipo === "pronto" ? frasco : frasco / numeroPositivo($p("f-calc-diluente").value);
  const partes = [parteQuantidade];
  if (tipo === "po") partes.push(`${tr("Concentração calculada")}: ${nfp(concentracao)} ${unid}/mL.`);
  const dose = numeroPositivo($p("f-dose").value);
  if (dose && $p("f-unid").value === unid) {
    const volume = dose / concentracao;
    partes.push(`${tr("Volume aritmético por aplicação")}: ${nfp(volume)} mL${$p("f-via").value === "sc" ? ` (${nfp(volume * 100, 1)} ${tr("unidades U-100")})` : ""}.`);
    if (tipo === "po") {
      const doses = frasco / dose;
      partes.push(`${tr("Rendimento aritmético")}: ${nfp(doses)} ${tr("doses por frasco")}.`);
      const porSemana = aplicacoesPorSemanaFormulario();
      if (porSemana > 0) {
        const duracao = Math.floor(doses) / porSemana * 7;
        partes.push(`${tr("Duração estimada pelo calendário")}: ${nfp(duracao)} ${tr("dias")}.`);
      }
    }
  } else {
    partes.push(tr("Para calcular o volume, a unidade da dose deve corresponder à unidade do rótulo."));
  }
  partes.push(tr("Estimativa aritmética; confira o rótulo e as orientações profissionais."));
  el.textContent = partes.join(" ");
}

function preencherForm(it) {
  const f = it || {};
  $p("f-nome").value = f.nome || "";
  meiaVidaEditada = Number.isFinite(Number(f.meiaVidaHoras)) && Number(f.meiaVidaHoras) > 0;
  $p("f-meia-vida").value = f.meiaVidaHoras ?? "";
  atualizarSugestaoMeiaVida();
  $p("f-dose").value = f.dose ?? "";
  $p("f-unid").innerHTML = opcoes(UNIDS, f.unid || "mg");
  $p("f-calc-tipo").value = f.calc?.tipo || "po";
  $p("f-calc-unid").value = f.calc?.unid || (f.calc && ["mg", "mcg", "UI"].includes(f.unid) ? f.unid : "mg");
  $p("f-calc-frasco").value = f.calc?.frasco ?? "";
  $p("f-calc-diluente").value = f.calc?.diluente ?? "";
  $p("f-calc-seringa").value = f.calc?.seringa ?? "";
  $p("f-via").innerHTML = opcoes(Object.keys(VIAS_P), f.via || "sc", k => tr(VIAS_P[k]));
  const formaEstoque = formaEstoquePadrao({ ...f, via: f.via || "sc" });
  apresentacaoEstoqueManual = Boolean(it);
  ultimaApresentacaoEstoque = formaEstoque;
  $p("f-estoque-forma").value = formaEstoque;
  const possuiEstoqueSalvo = f.estoqueQuantidade || f.estoqueUnidade || f.estoquePorAplicacao || f.estoqueQuantidadeManual;
  const estoque = possuiEstoqueSalvo
    ? { quantidade: f.estoqueQuantidade ?? "", unidade: f.estoqueUnidade || f.unid, uso: f.estoquePorAplicacao ?? "", data: f.estoqueData || hojeISO() }
    : padraoEstoqueProtocolo(f);
  $p("f-estoque-quantidade").value = estoque.quantidade;
  $p("f-estoque-unidade").innerHTML = opcoes(UNIDS, estoque.unidade || f.unid || "mg", tr);
  $p("f-estoque-uso").value = estoque.uso;
  $p("f-estoque-data").value = estoque.data;
  $p("f-estoque-potencia").value = f.estoquePotencia ?? "";
  estoqueQuantidadeManual = it ? Boolean(f.estoqueQuantidadeManual) : false;
  quantidadeEstoqueAutoAnterior = null;
  ultimaUnidadeEstoque = estoque.unidade || f.unid || "mg";
  $p("f-freq").innerHTML = opcoes(FREQS, f.freq || "Diária", tr);
  diasAutomaticos = ["Diária", "2× ao dia"].includes(f.freq || "Diária") &&
    ((!it?.id && !f.diasSemana) || f.diasSemana?.length === 7);
  definirDias(f.diasSemana || (diasAutomaticos && ["Diária", "2× ao dia"].includes(f.freq || "Diária") ? [0, 1, 2, 3, 4, 5, 6] : []));
  atualizarDiasFormulario($p("f-freq").value);
  $p("f-hora").innerHTML = opcoes(HORARIOS, f.hora || "", v => v ? tr(v) : "");
  horariosFormulario = f.horariosDia?.length ? f.horariosDia.slice() : [f.horaPrimeira || "", f.horaSegunda || ""].filter(Boolean);
  $p("f-aplicacoes-dia").value = String(f.aplicacoesDia || (f.freq === "2× ao dia" ? 2 : 1));
  atualizarHorariosFormulario($p("f-freq").value);
  $p("f-inicio").value = f.inicio || hojeISO();
  $p("f-fim").value = f.fim || "";
  const fimTipo = f.fimTipo || (f.fim ? "data" : "nenhum");
  $p("f-fim-tipo").value = fimTipo;
  $p("f-fim-semanas").value = f.fimSemanas || (fimTipo === "semanas" && f.inicio && f.fim
    ? Math.max(1, Math.round((new Date(f.fim + "T12:00:00") - new Date(f.inicio + "T12:00:00")) / 6048e5) + 1)
    : "");
  atualizarFimFormulario(fimTipo);
  $p("f-produto").value = f.produto || "";
  $p("f-obs").value = f.obs || "";
  $p("f-status").innerHTML = opcoes(Object.keys(STATUS_P), f.status || "ativo", k => tr(STATUS_P[k]));
  $p("f-calculadora").hidden = !["sc", "im"].includes($p("f-via").value);
  $p("f-calculadora").open = Boolean(f.calc && !$p("f-calculadora").hidden);
  $p("f-estoque").open = Boolean(estoque.quantidade || f.calc);
  atualizarFormularioDiluicao();
  atualizarResumoEstoqueFormulario();
  dicaSubstancia();
}
function dicaSubstancia() {
  const p = acharPorNome($p("f-nome").value), el = $p("f-dica");
  if (!p) { el.innerHTML = $p("f-nome").value.trim() ? `<small>${tr("Item fora do catálogo: será guardado só como texto, sem links.")}</small>` : ""; return; }
  const v = (typeof VIAS !== "undefined" && VIAS[slug(p.nome)]) || [];
  el.innerHTML = `<small>${htmlSelo(p)} · <a href="${urlPeptideo(p.nome)}">${tr("Abrir a ficha")}</a>${v.length ? ` · ${tr("Vias descritas na ficha:")} ${v.map(x => tr(VIAS_ROT[x[0]] || x[0])).join(", ")}` : ""}</small>`;
}
function abrirForm(it) {
  editando = it ? it.id : null;
  $p("msg-prot").textContent = "";
  $p("msg-prot").hidden = true;
  $p("form-titulo").textContent = it ? tr("Editar protocolo") : tr("Novo protocolo");
  preencherForm(it);
  $p("secao-form").hidden = false;
  atualizarAlertasFormulario();
  $p("f-nome").focus();
  $p("secao-form").scrollIntoView({ behavior: "smooth", block: "start" });
}
function fecharForm() { $p("secao-form").hidden = true; editando = null; }
function abrirEstoqueSeCalculavel() {
  if (["sc", "im"].includes($p("f-via").value) && numeroPositivo($p("f-calc-frasco").value)) {
    $p("f-estoque").open = true;
  }
}

function snapshotDose(x, data) {
  return {
    data, nome: x.nome, dose: x.dose, unid: x.unid, via: x.via, freq: x.freq,
  };
}
function registrarConfiguracaoDose(x, data = hojeISO()) {
  x.historicoDose = [...(x.historicoDose || []), snapshotDose(x, data)]
    .sort((a, b) => a.data.localeCompare(b.data)).slice(-260);
}
function doseNoDia(x, data) {
  const historico = x.historicoDose || [];
  const registro = historico.filter(h => h.data <= data).pop();
  if (registro) return registro;
  return data === hojeISO() ? snapshotDose(x, data) : null;
}
function mudouDose(a, b) {
  return ["dose", "unid", "via", "freq", "aplicacoesDia"].some(k => a[k] !== b[k]) ||
    JSON.stringify(a.horariosDia || []) !== JSON.stringify(b.horariosDia || []) ||
    JSON.stringify(a.diasSemana || []) !== JSON.stringify(b.diasSemana || []);
}

$p("f-nome").addEventListener("input", () => {
  const p = acharPorNome($p("f-nome").value);
  const v = p && typeof VIAS !== "undefined" ? VIAS[slug(p.nome)] : null;
  if (v && v.length && !editando) {
    const k = v[0][0];
    if (VIAS_P[k]) {
      $p("f-via").value = k;
      $p("f-calculadora").hidden = !["sc", "im"].includes(k);
      sincronizarModoEstoquePelaVia();
      atualizarResumoCalculadoraFormulario();
      atualizarResumoEstoqueFormulario();
    }
  }
  atualizarAlertasFormulario();
  atualizarSugestaoMeiaVida();
  dicaSubstancia();
});
$p("f-meia-vida").addEventListener("input", () => {
  meiaVidaEditada = true;
  $p("f-meia-vida-ajuda").textContent = tr("Este valor será usado somente na curva teórica deste protocolo.");
});
$p("f-via").addEventListener("change", () => {
  $p("f-calculadora").hidden = !["sc", "im"].includes($p("f-via").value);
  sincronizarModoEstoquePelaVia();
  atualizarResumoCalculadoraFormulario();
  atualizarResumoEstoqueFormulario();
  atualizarAlertasFormulario();
});
$p("f-freq").addEventListener("change", () => {
  if (diasAutomaticos) definirDias(["Diária", "2× ao dia"].includes($p("f-freq").value) ? [0, 1, 2, 3, 4, 5, 6] : []);
  atualizarDiasFormulario($p("f-freq").value);
  atualizarHorariosFormulario($p("f-freq").value);
  atualizarResumoCalculadoraFormulario();
  atualizarResumoEstoqueFormulario();
});
$p("f-aplicacoes-dia").addEventListener("input", () => {
  atualizarHorariosFormulario($p("f-freq").value);
  atualizarResumoCalculadoraFormulario();
  atualizarResumoEstoqueFormulario();
});
$p("f-inicio").addEventListener("change", atualizarResumoEstoqueFormulario);
$p("f-fim").addEventListener("change", atualizarResumoEstoqueFormulario);
$p("f-calculadora").addEventListener("input", () => {
  abrirEstoqueSeCalculavel();
  atualizarResumoCalculadoraFormulario();
  atualizarResumoEstoqueFormulario();
});
$p("f-calculadora").addEventListener("change", () => {
  abrirEstoqueSeCalculavel();
  atualizarFormularioDiluicao();
  atualizarResumoEstoqueFormulario();
});
["f-dose", "f-unid", "f-via"].forEach(id => $p(id).addEventListener("input", () => {
  abrirEstoqueSeCalculavel();
  atualizarResumoCalculadoraFormulario();
  atualizarResumoEstoqueFormulario();
}));
["f-unid", "f-via"].forEach(id => $p(id).addEventListener("change", () => {
  abrirEstoqueSeCalculavel();
  atualizarResumoCalculadoraFormulario();
  atualizarResumoEstoqueFormulario();
}));
$p("f-dose").addEventListener("change", abrirEstoqueSeCalculavel);
$p("f-estoque").addEventListener("input", atualizarResumoEstoqueFormulario);
$p("f-estoque").addEventListener("change", atualizarResumoEstoqueFormulario);
$p("f-estoque-forma").addEventListener("change", () => {
  const forma = $p("f-estoque-forma").value;
  if (forma !== ultimaApresentacaoEstoque) {
    estoqueQuantidadeManual = false;
    quantidadeEstoqueAutoAnterior = null;
    $p("f-estoque-quantidade").value = "";
    $p("f-estoque-potencia").value = "";
    $p("f-estoque-uso").value = "";
    if (forma === "outra") $p("f-estoque-unidade").innerHTML = opcoes(UNIDS, $p("f-unid").value);
  }
  apresentacaoEstoqueManual = true;
  ultimaApresentacaoEstoque = forma;
  atualizarResumoEstoqueFormulario();
});
$p("f-estoque-quantidade").addEventListener("input", () => {
  estoqueQuantidadeManual = true;
  quantidadeEstoqueAutoAnterior = null;
  atualizarResumoEstoqueFormulario();
});
$p("f-fim-tipo").addEventListener("change", () => {
  atualizarFimFormulario($p("f-fim-tipo").value);
  atualizarResumoEstoqueFormulario();
});
$p("f-fim-semanas").addEventListener("input", atualizarResumoEstoqueFormulario);
$p("f-fim-semanas").addEventListener("change", atualizarResumoEstoqueFormulario);
$p("f-horarios-dia-lista").addEventListener("input", e => {
  const input = e.target.closest("input[data-horario-dia]");
  if (input) {
    input.setCustomValidity("");
    horariosFormulario[Number(input.dataset.horarioDia)] = input.value;
  }
});
$p("f-dias").addEventListener("change", e => {
  if (e.target.matches('input[type="checkbox"]')) {
    diasAutomaticos = false;
    atualizarResumoCalculadoraFormulario();
    atualizarResumoEstoqueFormulario();
  }
});
$p("novo").addEventListener("click", () => abrirForm(null));
$p("f-cancelar").addEventListener("click", fecharForm);
$p("form-prot").addEventListener("submit", e => {
  e.preventDefault();
  const nomeDig = $p("f-nome").value.trim();
  if (!nomeDig) { $p("f-nome").focus(); return; }
  const freq = $p("f-freq").value;
  const fimTipo = $p("f-fim-tipo").value;
  const fimSemanas = fimTipo === "semanas" ? Number($p("f-fim-semanas").value) : null;
  if (fimTipo === "semanas" && !$p("f-inicio").value) {
    $p("f-inicio").focus();
    return;
  }
  const fim = fimTipo === "data" ? $p("f-fim").value : fimTipo === "semanas"
    ? dataFinalSemanas($p("f-inicio").value, fimSemanas) : "";
  if (fimTipo === "semanas" && (!Number.isInteger(fimSemanas) || fimSemanas < 1 || fimSemanas > 260)) {
    $p("f-fim-semanas").focus();
    return;
  }
  const aplicacoesDia = freq === "2× ao dia" ? 2 : freq === "Diária" ? Math.max(1, Math.min(24, Number($p("f-aplicacoes-dia").value) || 1)) : 1;
  const horariosDia = freq === "2× ao dia" || freq === "Diária" && aplicacoesDia > 1
    ? [...$p("f-horarios-dia-lista").querySelectorAll('input[type="time"]')].map(input => input.value) : [];
  if (horariosDia.length && (new Set(horariosDia).size !== horariosDia.length)) {
    const repetido = [...$p("f-horarios-dia-lista").querySelectorAll('input[type="time"]')].find((input, i) => horariosDia.indexOf(input.value) !== i);
    repetido.setCustomValidity(tr("Escolha horários diferentes."));
    repetido.reportValidity();
    return;
  }
  const cat = acharPorNome(nomeDig), d = parseFloat(String($p("f-dose").value).replace(",", "."));
  const l = lerProtocolos(), edicao = Boolean(editando);
  const protocoloAnterior = l.find(x => x.id === editando);
  const dose = Number.isFinite(d) && d > 0 ? d : null;
  const unidadeDose = $p("f-unid").value;
  const calc = dadosCalculadoraDoFormulario(dose, unidadeDose, protocoloAnterior?.calc);
  const camposEstoque = sincronizarCamposEstoqueFormulario();
  const estoqueUnidade = camposEstoque.unidade;
  const estoqueQuantidade = numeroPositivo($p("f-estoque-quantidade").value);
  const estoquePorAplicacao = numeroPositivo($p("f-estoque-uso").value);
  const dados = {
    slug: cat ? slug(cat.nome) : "", nome: cat ? cat.nome : nomeDig, dose, unid: unidadeDose,
    meiaVidaHoras: numeroPositivo($p("f-meia-vida").value),
    calc,
    estoqueQuantidade,
    estoqueUnidade: estoqueUnidade || "",
    estoquePorAplicacao,
    estoqueApresentacao: $p("f-estoque-forma").value,
    estoquePotencia: numeroPositivo($p("f-estoque-potencia").value),
    estoqueQuantidadeManual,
    estoqueData: $p("f-estoque-data").value || hojeISO(),
    freq, aplicacoesDia, horariosDia, diasSemana: diasSelecionados(), via: $p("f-via").value,
    hora: horariosDia.length ? "" : $p("f-hora").value,
    horaPrimeira: horariosDia[0] || "", horaSegunda: horariosDia[1] || "",
    inicio: $p("f-inicio").value, fim, fimTipo, fimSemanas: fimTipo === "semanas" ? fimSemanas : null,
    produto: $p("f-produto").value.trim(), obs: $p("f-obs").value.trim(), status: $p("f-status").value,
  };
  let idSalvo = editando;
  if (editando) {
    const i = l.findIndex(x => x.id === editando);
    if (i >= 0) {
      const mudou = mudouDose(l[i], dados);
      l[i] = { ...l[i], ...dados };
      if (mudou) registrarConfiguracaoDose(l[i]);
    }
  } else {
    const protocolo = { id: novoIdProtocolo(), tomadas: [], criado: hojeISO(), ...dados, historicoDose: [] };
    registrarConfiguracaoDose(protocolo, protocolo.inicio > hojeISO() ? protocolo.inicio : hojeISO());
    idSalvo = protocolo.id;
    l.push(protocolo);
  }
  if (!gravarProtocolos(l)) return;
  guardarPersistente(); fecharForm(); filtro = dados.status; desenhar();
  $p("msg-prot").textContent = tr(edicao ? "Protocolo atualizado." : "Protocolo salvo.");
  $p("msg-prot").hidden = false;
  if (idSalvo) $p("lista-prot").querySelector(`.prot-card[data-id="${CSS.escape(idSalvo)}"]`)?.scrollIntoView({ behavior: "smooth", block: "nearest" });
});

function resumoItem(x) {
  const partes = [];
  if (x.dose) partes.push(`${nfp(x.dose)} ${x.unid}`);
  if (x.freq) partes.push(tr(x.freq));
  if (x.via) partes.push(tr(VIAS_P[x.via] || x.via));
  const quantidade = doseDiariaProgramada(x);
  if (quantidade > 1) {
    partes.push(`${quantidade} ${tr("aplicações por dia")}`);
    (x.horariosDia || []).forEach((hora, i) => partes.push(`${tr(i === 0 ? "Primeira aplicação" : i === 1 ? "Segunda aplicação" : "Aplicação")} ${i + 1}: ${hora}`));
  } else if (x.hora) partes.push(tr(x.hora));
  return partes.join(" · ");
}
const nfp = n => Number(n.toFixed(3)).toLocaleString(LOCALE, { maximumFractionDigits: 3 });
function resumoDadosFrasco(x) {
  const c = x.calc;
  if (!c || !c.frasco) return "";
  const partes = [c.tipo === "pronto"
    ? `${tr("Concentração no rótulo")}: ${nfp(c.frasco)} ${c.unid}/mL`
    : `${tr("Conteúdo do frasco / ampola")}: ${nfp(c.frasco)} ${c.unid}`];
  if (c.seringa) partes.push(`${tr("Seringa")}: ${nfp(c.seringa)} mL`);
  if (c.tipo === "po") {
    if (c.diluente) partes.push(`${tr("Diluente registrado")}: ${nfp(c.diluente)} mL`);
    else return partes.join(" · ");
  }
  const concentracao = c.tipo === "pronto" ? c.frasco : c.frasco / c.diluente;
  if (c.tipo === "po") partes.push(`${tr("Concentração calculada")}: ${nfp(concentracao)} ${c.unid}/mL`);
  if (!(x.dose > 0) || x.unid !== c.unid) return partes.join(" · ");
  const volume = x.dose / concentracao, doses = c.tipo === "po" ? c.frasco / x.dose : null;
  partes.push(`${tr("Volume aritmético por aplicação")}: ${nfp(volume)} mL${x.via === "sc" ? ` (${nfp(volume * 100, 1)} ${tr("unidades U-100")})` : ""}`);
  if (doses !== null) {
    partes.push(`${tr("Rendimento aritmético")}: ${nfp(doses)} ${tr("doses por frasco")}`);
    let porSemana = null;
    if (["Diária", "2× ao dia"].includes(x.freq)) porSemana = (x.diasSemana?.length || 0) * (x.freq === "2× ao dia" ? 2 : Math.max(1, Number(x.aplicacoesDia) || 1));
    else {
      const semanal = x.freq?.match(/^([1-5])×\/semana$/);
      if (semanal) porSemana = Number(semanal[1]);
    }
    if (porSemana > 0) partes.push(`${tr("Duração estimada pelo calendário")}: ${nfp(Math.floor(doses) / porSemana * 7)} ${tr("dias")}`);
  }
  return partes.join(" · ");
}
function resumoPrevisaoEstoque(x) {
  const data = previsaoFimEstoque(x);
  if (!data) return "";
  const quantidade = Number(x.estoqueQuantidade), uso = Number(x.estoquePorAplicacao);
  return `${tr("Estoque")}: ${nfp(quantidade)} ${tr(x.estoqueUnidade)} · ${nfp(uso)} ${tr(x.estoqueUnidade)} ${tr("por aplicação")} · ${tr("Término previsto")}: ${fmtData(data)}`;
}

function inicioSemana(iso = hojeISO()) {
  const d = new Date(iso + "T12:00:00");
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
function dataProgramada(x, iso) {
  if (!x.inicio || iso < x.inicio || (x.fim && iso > x.fim) || x.freq === "Se necessário") return false;
  if (x.freq === "Dias alternados") {
    const inicio = new Date(x.inicio + "T12:00:00"), data = new Date(iso + "T12:00:00");
    return Math.round((data - inicio) / 864e5) % 2 === 0;
  }
  return x.diasSemana.includes(new Date(iso + "T12:00:00").getDay());
}
function doseDiariaProgramada(x) {
  return x.freq === "2× ao dia" ? 2 : x.freq === "Diária" ? Math.max(1, Math.min(24, Number(x.aplicacoesDia) || 1)) : 1;
}
function deslocarDia(iso, quantidade) {
  const data = new Date(iso + "T12:00:00");
  data.setDate(data.getDate() + quantidade);
  return `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, "0")}-${String(data.getDate()).padStart(2, "0")}`;
}
function previsaoFimEstoque(x) {
  const quantidade = Number(x.estoqueQuantidade), uso = Number(x.estoquePorAplicacao);
  const referencia = x.estoqueData || hojeISO(), hoje = hojeISO();
  if (x.status !== "ativo" || !(quantidade > 0) || !(uso > 0) || !x.estoqueUnidade
    || x.freq === "Se necessário" || x.freq === "Outra" && !x.diasSemana?.length) return null;
  const tolerancia = Math.max(1, quantidade, uso) * 1e-10;
  let restante = quantidade;
  const usosRegistrados = (x.tomadas || []).filter(data => data >= referencia && data <= hoje).sort();
  for (const data of usosRegistrados) {
    if (restante <= uso + tolerancia) return data;
    restante -= uso;
  }
  if (restante <= tolerancia) return hoje;
  let data = [hoje, referencia, x.inicio || hoje].sort().pop();
  for (let i = 0; i < 3650; i++, data = deslocarDia(data, 1)) {
    if (x.fim && data > x.fim) return null;
    if (!dataProgramada(x, data)) continue;
    const aplicacoesProgramadas = doseDiariaProgramada(x);
    const jaRegistradas = data <= hoje ? (x.tomadas || []).filter(registro => registro === data).length : 0;
    const aplicacoes = Math.max(0, aplicacoesProgramadas - jaRegistradas);
    for (let n = 0; n < aplicacoes; n++) {
      if (restante <= uso + tolerancia) return data;
      restante -= uso;
    }
    if (restante <= tolerancia) return data;
  }
  return null;
}
function objetivoSemanal(x) {
  if (x.freq === "Se necessário") return null;
  const { inicio, fimISO } = tomadasSemana(x);
  let total = 0;
  for (let i = 0; i < 7; i++) {
    const d = new Date(inicio + "T12:00:00");
    d.setDate(d.getDate() + i);
    const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    if (iso <= fimISO && dataProgramada(x, iso)) total += doseDiariaProgramada(x);
  }
  return total || null;
}
function tomadasSemana(x) {
  const inicio = inicioSemana(), fim = new Date(inicio + "T12:00:00");
  fim.setDate(fim.getDate() + 6);
  const fimISO = `${fim.getFullYear()}-${String(fim.getMonth() + 1).padStart(2, "0")}-${String(fim.getDate()).padStart(2, "0")}`;
  const registros = (x.tomadas || []).filter(d => d >= inicio && d <= fimISO && d <= hojeISO());
  const futuras = (x.tomadas || []).filter(d => d >= inicio && d <= fimISO && d > hojeISO()).length;
  const porDia = new Map();
  registros.forEach(d => porDia.set(d, (porDia.get(d) || 0) + 1));
  return { registros, futuras, porDia, inicio, fimISO };
}
function acompanhamentoSemanal(x) {
  const { registros, futuras, porDia } = tomadasSemana(x), meta = objetivoSemanal(x);
  const percentual = meta ? Math.min(100, Math.round(registros.length / meta * 100)) : 0;
  const dias = DIAS_SEMANA.map(([dia, nome]) => {
    const n = porDia.get(dataSemanaDia(dia)) || 0;
    return `<span class="prot-dia${n ? " feito" : ""}" title="${tr(nome)}: ${n}">${tr(nome).slice(0, 3)} <b>${n}</b></span>`;
  }).join("");
  return `<div class="prot-semana"><div class="prot-semana-topo"><b>${tr("Esta semana")}: ${registros.length}${meta ? ` / ${meta} ${tr("aplicações")}` : ` ${tr("aplicações")}`}</b><small>${fmtData(inicioSemana())} – ${fmtData(dataSemanaDia(0))}</small></div>
    ${meta ? `<progress max="100" value="${percentual}" aria-label="${percentual}%">${percentual}%</progress>` : ""}
    <div class="prot-semana-dias">${dias}</div>${futuras ? `<small class="prot-futuras-aviso">${futuras} ${tr("marcações futuras não contam como feitas")}</small>` : ""}</div>`;
}
function deslocarMes(mes, delta) {
  const [ano, numero] = mes.split("-").map(Number);
  const data = new Date(ano, numero - 1 + delta, 1, 12);
  return `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, "0")}`;
}
function dataDoMes(mes, dia) { return `${mes}-${String(dia).padStart(2, "0")}`; }
function rotuloMesAtual() {
  const [ano, numero] = mesAcompanhamento.split("-").map(Number);
  return new Date(ano, numero - 1, 1, 12).toLocaleDateString(LOCALE, { month: "long", year: "numeric" });
}
function detalhesDiaCalendario(ativos, iso) {
  const itens = ativos.map(x => {
    const contagem = (x.tomadas || []).filter(t => t === iso).length;
    const programado = dataProgramada(x, iso), meta = programado ? doseDiariaProgramada(x) : 0;
    const terminaEstoque = previsaoFimEstoque(x) === iso;
    let estado = tr("Sem aplicação programada"), classe = "sem-agenda";
    if (iso > hojeISO() && contagem) {
      estado = `${tr(programado ? "Programada" : "Marcação futura")} · ${contagem} ${tr("marcações antecipadas")}`;
      classe = "futura";
    } else if (programado && iso > hojeISO()) {
      estado = tr("Programada");
      classe = "futura";
    } else if (programado && contagem >= meta) {
      estado = `${tr("Feita")}: ${Math.min(contagem, meta)}/${meta}`;
      classe = "feita";
    } else if (programado && contagem > 0) {
      estado = `${tr("Parcial")}: ${contagem}/${meta}`;
      classe = "parcial";
    } else if (programado && iso < hojeISO()) {
      estado = tr("Não registrada");
      classe = "perdida";
    } else if (programado && iso === hojeISO()) {
      estado = tr("Pendente hoje");
      classe = "pendente";
    } else if (programado) {
      estado = tr("Programada");
      classe = "futura";
    } else if (contagem && x.freq === "Se necessário") {
      estado = `${tr("Registro feito")}: ${contagem}`;
      classe = "feita";
    } else if (contagem) {
      estado = `${tr("Registro fora dos dias selecionados")}: ${contagem}`;
      classe = "fora-agenda";
    }
    const textoEstoque = terminaEstoque ? ` · 📦 ${tr("Término previsto do estoque")}` : "";
    const controles = `<span class="prot-cal-controles">${programado && iso <= hojeISO() && contagem < meta ? `<button type="button" class="btn" data-protocolo="${esc(x.id)}" data-acao-tomada="marcar" aria-label="${esc(`${tr("Registrar aplicação")} · ${x.nome} · ${fmtData(iso)}`)}" title="${tr("Marcar")}">＋</button>` : ""}${contagem > 0 ? `<button type="button" class="btn" data-protocolo="${esc(x.id)}" data-acao-tomada="desfazer" aria-label="${esc(`${tr("Desmarcar aplicação")} · ${x.nome} · ${fmtData(iso)}`)}" title="${tr("Desmarcar")}">↩</button>` : ""}</span>`;
    return `<li><span class="prot-cal-identificacao"><b title="${esc(x.nome)}">${esc(x.nome)}</b><span class="prot-cal-item ${classe}${terminaEstoque ? " prot-cal-fim-estoque" : ""}" title="${esc(estado + textoEstoque)}">${esc(estado + textoEstoque)}</span></span>${controles}</li>`;
  });
  return `<section class="prot-cal-detalhes" aria-live="polite"><h4>${esc(fmtData(iso))} · ${tr("Detalhes do dia")}</h4><ul>${itens.join("")}</ul></section>`;
}
function calendarioMensal(ativos) {
  const [ano, numeroMes] = mesAcompanhamento.split("-").map(Number);
  if (diaSelecionadoCalendario.slice(0, 7) !== mesAcompanhamento) diaSelecionadoCalendario = dataDoMes(mesAcompanhamento, 1);
  const primeiroDia = new Date(ano, numeroMes - 1, 1, 12);
  const diasNoMes = new Date(ano, numeroMes, 0).getDate();
  const deslocamento = (primeiroDia.getDay() + 6) % 7;
  const hoje = hojeISO();
  const previsoesEstoque = ativos.map(x => ({ id: x.id, nome: x.nome, data: previsaoFimEstoque(x) })).filter(x => x.data);
  const previsoesPorData = new Map();
  previsoesEstoque.forEach(x => previsoesPorData.set(x.data, [...(previsoesPorData.get(x.data) || []), x]));
  let previstas = 0, feitas = 0, naoRegistradas = 0, programadasFuturas = 0;
  let registrosNoMes = 0;
  const cabecalhos = ["segunda", "terça", "quarta", "quinta", "sexta", "sábado", "domingo"]
    .map(d => `<span class="prot-cal-dia-nome">${esc(tr(d).slice(0, 3))}</span>`).join("");
  const celulas = Array.from({ length: deslocamento }, () => '<span class="prot-cal-vazio" aria-hidden="true"></span>');
  for (let dia = 1; dia <= diasNoMes; dia++) {
    const data = dataDoMes(mesAcompanhamento, dia);
    const estoqueTerminaHoje = previsoesPorData.get(data) || [];
    let previstasDia = 0, feitasDia = 0, registradasDia = 0, protocolosProgramados = 0;
    const resumos = [];
    ativos.forEach(x => {
      const contagem = (x.tomadas || []).filter(t => t === data).length;
      const programado = dataProgramada(x, data), meta = programado ? doseDiariaProgramada(x) : 0;
      registradasDia += contagem;
      if (data.startsWith(mesAcompanhamento)) registrosNoMes += contagem;
      if (programado) {
        protocolosProgramados++;
        previstasDia += meta;
        if (data <= hoje) {
          feitasDia += Math.min(contagem, meta);
          resumos.push(`${x.nome}: ${Math.min(contagem, meta)}/${meta}`);
        } else {
          resumos.push(`${x.nome}: ${tr("Programada")}${contagem ? ` · ${contagem} ${tr("marcações antecipadas")}` : ""}`);
        }
      } else if (contagem) {
        resumos.push(`${x.nome}: ${contagem} · ${tr(x.freq === "Se necessário" ? "Registro feito" : "Registro fora dos dias selecionados")}`);
      }
    });
    if (data <= hoje) {
      previstas += previstasDia;
      feitas += feitasDia;
      if (data < hoje) naoRegistradas += Math.max(0, previstasDia - feitasDia);
    } else {
      programadasFuturas += previstasDia;
    }
    let classe = "sem-agenda", estado = tr("Sem aplicação programada");
    if (protocolosProgramados && feitasDia >= previstasDia) {
      classe = "feita";
      estado = tr("Aplicação registrada");
    } else if (protocolosProgramados && feitasDia > 0) {
      classe = "parcial";
      estado = `${tr("Parcial")}: ${feitasDia}/${previstasDia}`;
    } else if (protocolosProgramados && data < hoje) {
      classe = "perdida";
      estado = tr("Não registrada");
    } else if (protocolosProgramados && data === hoje) {
      classe = "pendente";
      estado = tr("Pendente hoje");
    } else if (protocolosProgramados) {
      classe = "futura";
      estado = tr("Programada");
    } else if (data > hoje && registradasDia > 0) {
      classe = "futura";
      estado = `${tr("Marcação futura")}: ${registradasDia} ${tr("marcações antecipadas")}`;
    } else if (registradasDia > 0 && ativos.some(x => x.freq === "Se necessário" && x.tomadas.includes(data))) {
      classe = "feita";
      estado = tr("Registro feito");
    } else if (registradasDia > 0) {
      classe = "fora-agenda";
      estado = tr("Registro fora dos dias selecionados");
    }
    const resumo = registradasDia ? `${registradasDia} ${tr("aplicações")}` : estado;
    const descricaoEstoque = estoqueTerminaHoje.map(x => `${tr("Término previsto do estoque")}: ${x.nome}`).join(" · ");
    const dica = [fmtData(data), resumos.join(" · ") || resumo, descricaoEstoque].filter(Boolean).join(" · ");
    celulas.push(`<button type="button" class="prot-cal-dia ${classe}${estoqueTerminaHoje.length ? " prot-cal-dia-estoque" : ""}${data === hoje ? " hoje" : ""}${data === diaSelecionadoCalendario ? " selecionado" : ""}" data-dia="${data}" title="${esc(dica)}" aria-label="${esc(dica)}" aria-pressed="${data === diaSelecionadoCalendario}">${dia}${protocolosProgramados || registradasDia ? `<small>${feitasDia}/${previstasDia}${registradasDia > previstasDia ? ` · +${registradasDia - previstasDia}` : ""}</small>` : ""}${estoqueTerminaHoje.length ? `<span class="prot-cal-estoque-marca" aria-hidden="true">📦</span>` : ""}</button>`);
  }
  const totalCelulas = Math.ceil((deslocamento + diasNoMes) / 7) * 7;
  while (celulas.length < totalCelulas) celulas.push('<span class="prot-cal-vazio" aria-hidden="true"></span>');
  const totalMes = `<p class="prot-cal-resumo"><b>${tr(mesAcompanhamento === hoje.slice(0, 7) ? "Até hoje" : "No mês")}: ${feitas}/${previstas} ${tr("aplicações registradas")}</b>${naoRegistradas ? ` · ${naoRegistradas} ${tr("aplicações pendentes de dias anteriores")}` : ""}${programadasFuturas ? ` · ${programadasFuturas} ${tr("programadas depois de hoje")}` : ""} · ${registrosNoMes} ${tr("marcações no mês")}</p>`;
  const resumoEstoque = previsoesEstoque.length
    ? `<div class="prot-estoque-previsoes"><b>📦 ${tr("Previsão de término do estoque")}</b><ul>${previsoesEstoque.sort((a, b) => a.data.localeCompare(b.data)).map(x => `<li><button type="button" class="btn btn-sec" data-estoque-data="${x.data}">${esc(x.nome)} · ${fmtData(x.data)}</button></li>`).join("")}</ul><small>${tr("Estimativa baseada no estoque conferido, consumo e programação; não considera alterações futuras de uso.")}</small></div>`
    : "";
  return `<section class="prot-calendario" aria-label="${esc(tr("Evolução mensal"))}">
    ${totalMes}${resumoEstoque}<p><small>${tr("Selecione um dia para ver o resumo de todos os protocolos ativos.")} ${tr("📦 marca o dia previsto para terminar o estoque.")}</small></p><div class="prot-cal-grade">${cabecalhos}${celulas.join("")}</div>
    ${detalhesDiaCalendario(ativos, diaSelecionadoCalendario)}
  </section>`;
}
function dataSemanaDia(dia) {
  const d = new Date(inicioSemana() + "T12:00:00");
  d.setDate(d.getDate() + ((dia + 6) % 7));
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
function lembretesHoje(ativos) {
  const hoje = hojeISO();
  const agora = new Date(), minutosAgora = agora.getHours() * 60 + agora.getMinutes();
  const lembretes = [], horariosIncompletos = [];
  ativos.forEach(x => {
    if (!dataProgramada(x, hoje)) return;
    const feitas = (x.tomadas || []).filter(d => d === hoje).length;
    if (doseDiariaProgramada(x) > 1) {
      const horarios = x.horariosDia?.length ? x.horariosDia : [x.horaPrimeira, x.horaSegunda].filter(Boolean);
      if (horarios.length !== doseDiariaProgramada(x) || new Set(horarios).size !== horarios.length) {
        horariosIncompletos.push(x.nome);
        return;
      }
      horarios.forEach((hora, i) => {
        const [h, m] = hora.split(":").map(Number);
        if (i >= feitas && h * 60 + m <= minutosAgora) lembretes.push({ x, rotulo: i === 0 ? "Primeira aplicação" : i === 1 ? "Segunda aplicação" : "Aplicação", numero: i + 1, hora });
      });
      return;
    }
    if (feitas < doseDiariaProgramada(x)) lembretes.push({ x, hora: "" });
  });
  const semDias = ativos.filter(x => !["Se necessário", "Dias alternados"].includes(x.freq) &&
    ["Diária", "2× ao dia", "1×/semana", "2×/semana", "3×/semana", "5×/semana", "Outra"].includes(x.freq) && !x.diasSemana.length);
  const avisos = [];
  const itensLembrete = lembretes.map(({ x, rotulo, numero, hora }) => `<li><b>${esc(x.nome)}</b>${rotulo ? ` · ${tr(rotulo)}${numero > 2 ? ` ${numero}` : ""}` : ""}${hora ? ` · ${hora}` : x.hora ? ` · ${esc(tr(x.hora))}` : ""}${x.dose ? ` · ${nfp(x.dose)} ${esc(x.unid)}` : ""}</li>`);
  if (itensLembrete.length) avisos.push(`<article class="boas prot-lembrete"><h3>⏰ ${tr("Lembretes para hoje")}</h3><p>${tr("Estes itens estão marcados para hoje no seu calendário. Este aviso não confirma uma dose nem substitui sua prescrição.")}</p><ul>${itensLembrete.join("")}</ul></article>`);
  if (semDias.length) avisos.push(`<article class="boas prot-lembrete"><h3>${tr("Agenda incompleta")}</h3><p>${tr("Escolha os dias da semana nos protocolos abaixo para ativar os lembretes.")} ${semDias.map(x => esc(x.nome)).join(", ")}</p></article>`);
  if (horariosIncompletos.length) avisos.push(`<article class="boas prot-lembrete"><h3>${tr("Horários incompletos")}</h3><p>${tr("Edite estes protocolos e informe todos os horários para ativar os lembretes.")} ${horariosIncompletos.map(esc).join(", ")}</p></article>`);
  return avisos.join("");
}
function registrarTomada(x, data = hojeISO(), doseSubstituta = null) {
  if (data > hojeISO()) return false;
  if (x.freq !== "Se necessário" && (!dataProgramada(x, data) ||
    (x.tomadas || []).filter(d => d === data).length >= doseDiariaProgramada(x))) return false;
  const dose = doseSubstituta || doseNoDia(x, data);
  x.tomadas = [...(x.tomadas || []), data].sort().slice(-8760);
  x.registrosDose = [...(x.registrosDose || []), {
    id: novoIdProtocolo(), data, nome: dose?.nome || x.nome, dose: dose?.dose ?? null,
    unid: dose?.unid || "", via: dose?.via || "", freq: dose?.freq || "",
  }].slice(-8760);
  return true;
}
function abrirRegistroDose(id, data = hojeISO()) {
  const x = lerProtocolos().find(item => item.id === id);
  if (!x || data > hojeISO()) return;
  if (x.freq !== "Se necessário" && (!dataProgramada(x, data) ||
    (x.tomadas || []).filter(d => d === data).length >= doseDiariaProgramada(x))) return;
  registroDosePendente = { id, data };
  const dose = doseNoDia(x, data);
  $p("dialogo-dose-contexto").textContent = `${x.nome} · ${fmtData(data)} · ${dose?.dose !== null && dose?.dose !== undefined ? `${nfp(dose.dose)} ${dose.unid}` : tr("Dose não detalhada")}`;
  $p("dose-nova").value = x.dose ?? "";
  $p("dose-nova").required = false;
  $p("dose-nova-unidade").textContent = x.unid || "";
  $p("dose-registro-erro").hidden = true;
  $p("dose-nova-wrap").hidden = true;
  $p("form-registro-dose").querySelector('input[name="dose-mudou"][value="nao"]').checked = true;
  $p("dialogo-dose").showModal();
}
function confirmarRegistroDose(e) {
  e.preventDefault();
  if (!registroDosePendente) return;
  const l = lerProtocolos(), x = l.find(item => item.id === registroDosePendente.id);
  if (!x) {
    $p("dose-registro-erro").textContent = tr("Este protocolo não está mais disponível. Feche e tente novamente.");
    $p("dose-registro-erro").hidden = false;
    return;
  }
  const mudou = $p("form-registro-dose").querySelector('input[name="dose-mudou"]:checked')?.value === "sim";
  let doseRegistrada = doseNoDia(x, registroDosePendente.data);
  if (mudou) {
    const novaDose = Number(String($p("dose-nova").value).replace(",", "."));
    if (!Number.isFinite(novaDose) || novaDose <= 0) {
      $p("dose-registro-erro").textContent = tr("Informe uma dose maior que zero.");
      $p("dose-registro-erro").hidden = false;
      $p("dose-nova").focus();
      return;
    }
    x.dose = novaDose;
    if (x.calc && x.calc.unid === x.unid) x.calc.dose = novaDose;
    if (["comprimido", "capsula"].includes(x.estoqueApresentacao)) {
      if (x.estoqueUnidade === x.unid) x.estoquePorAplicacao = novaDose;
      else if (x.estoquePotencia > 0) x.estoquePorAplicacao = novaDose / x.estoquePotencia;
    } else if (x.estoqueUnidade === x.unid) x.estoquePorAplicacao = novaDose;
    else if (x.estoqueUnidade === "mL" && x.calc?.tipo === "pronto" && x.calc.unid === x.unid && x.calc.frasco > 0) {
      x.estoquePorAplicacao = novaDose / x.calc.frasco;
    }
    registrarConfiguracaoDose(x, hojeISO());
    doseRegistrada = { ...snapshotDose(x, registroDosePendente.data) };
  }
  if (!registrarTomada(x, registroDosePendente.data, doseRegistrada)) {
    $p("dose-registro-erro").textContent = tr("Não foi possível registrar esta aplicação. Confira a programação do protocolo.");
    $p("dose-registro-erro").hidden = false;
    return;
  }
  if (!gravarProtocolos(l)) {
    $p("dose-registro-erro").textContent = tr("Não foi possível salvar neste navegador. Libere espaço e tente novamente.");
    $p("dose-registro-erro").hidden = false;
    return;
  }
  guardarPersistente();
  registroDosePendente = null;
  $p("dialogo-dose").close();
  desenhar();
}
function desfazerTomada(x, data = hojeISO()) {
  const idx = (x.tomadas || []).lastIndexOf(data);
  if (idx >= 0) x.tomadas.splice(idx, 1);
  const registroIdx = (x.registrosDose || []).map(r => r.data).lastIndexOf(data);
  if (registroIdx >= 0) x.registrosDose.splice(registroIdx, 1);
}

function cartao(x) {
  const p = x.slug ? porSlug(x.slug) : null, hoje = hojeISO(), feitasHoje = (x.tomadas || []).filter(d => d === hoje).length, ult = (x.tomadas || []).filter(d => d <= hoje).sort().pop();
  const resumoFrasco = resumoDadosFrasco(x);
  const previsaoEstoque = resumoPrevisaoEstoque(x);
  const marcacoesFuturas = (x.tomadas || []).filter(d => d > hoje).length;
  const maxHoje = x.freq === "Se necessário" ? Infinity : dataProgramada(x, hoje) ? doseDiariaProgramada(x) : 0;
  const limiteAtingido = feitasHoje >= maxHoje;
  const podeRegistrarHoje = x.freq === "Se necessário" || dataProgramada(x, hoje);
  const estadoHoje = x.inicio && x.inicio > hoje
    ? `${tr("Inicia em")} ${fmtData(x.inicio)}`
    : !podeRegistrarHoje ? tr("Sem aplicação programada hoje")
      : limiteAtingido ? tr("Meta de hoje atingida") : "";
  const calc = p ? `calculadora.html?p=${encodeURIComponent(x.slug)}${x.via === "im" || x.via === "sc" ? "&via=" + x.via : ""}${x.calc ? "&c=" + encodeURIComponent(JSON.stringify(x.calc)) : ""}` : (x.calc ? `calculadora.html?c=${encodeURIComponent(JSON.stringify(x.calc))}` : "");
  return `<article class="prot-card st-${x.status}" data-id="${x.id}">
    <h3>${p ? `<a href="${urlPeptideo(p.nome)}">${esc(x.nome)}</a>` : esc(x.nome)} <span class="via-tag">${tr(STATUS_P[x.status] || x.status)}</span></h3>
    ${p ? `<p>${htmlSelo(p)}</p>` : ""}
    <p class="prot-resumo">${esc(resumoItem(x)) || `<small>${tr("Sem dose registrada")}</small>`}</p>
    ${resumoFrasco ? `<p class="prot-calc-resumo"><small>${esc(resumoFrasco)} · ${tr("Estimativa aritmética; confira o rótulo e as orientações profissionais.")}</small></p>` : ""}
    ${previsaoEstoque ? `<p class="prot-estoque-cartao">📦 ${esc(previsaoEstoque)} · ${tr("Previsão aproximada; confira o estoque real.")}</p>` : ""}
    ${acompanhamentoSemanal(x)}
    ${marcacoesFuturas ? `<p class="prot-futuras-aviso"><small>${marcacoesFuturas} ${tr("marcações futuras não contam como feitas")}</small></p>` : ""}
    ${x.produto ? `<p><small>${tr("Produto / marca / lote:")} ${esc(x.produto)}</small></p>` : ""}
    <p><small>${x.inicio ? `${tr("Início:")} ${fmtData(x.inicio)} (${dias(x.inicio)} ${tr("dias")})` : ""}${x.fim ? ` · ${tr("Fim previsto:")} ${fmtData(x.fim)}` : ""}${ult ? ` · ${tr("Última marcação:")} ${fmtData(ult)}` : ""}</small></p>
    ${x.obs ? `<p class="prot-obs">${esc(x.obs)}</p>` : ""}
    <div class="prot-acoes nao-imprimir">
      ${x.status === "ativo" ? `${podeRegistrarHoje ? `<button type="button" class="btn ${limiteAtingido ? "" : "btn-prim"}" data-ac="tomei"${limiteAtingido ? " disabled" : ""}>${limiteAtingido ? "✓ " + tr("Meta de hoje atingida") : "☑️ " + tr("Registrar aplicação")}${feitasHoje ? ` (${feitasHoje} ${tr("hoje")})` : ""}</button>` : `<span class="prot-hoje-status">${esc(estadoHoje)}</span>`}${feitasHoje ? `<button type="button" class="btn" data-ac="desfazer-tomada">↩️ ${tr("Desfazer última marcação")}</button>` : ""}` : ""}
      <button type="button" class="btn" data-ac="editar">✏️ ${tr("Editar")}</button>
      ${x.status === "ativo" ? `<button type="button" class="btn" data-ac="pausar">⏸️ ${tr("Pausar")}</button><button type="button" class="btn" data-ac="concluir">🏁 ${tr("Concluir")}</button>` : `<button type="button" class="btn" data-ac="reativar">▶️ ${tr("Reativar")}</button>`}
      <button type="button" class="btn" data-ac="duplicar">⧉ ${tr("Duplicar")}</button>
      ${calc ? `<a class="btn" href="${calc}">🧮 ${tr("Calculadora")}</a>` : ""}
      <button type="button" class="btn btn-perigo" data-ac="apagar" aria-label="${tr("Apagar")}">🗑️</button>
    </div></article>`;
}

function alertas(ativos) {
  const out = [], slugs = ativos.filter(x => x.slug);
  const dup = {};
  slugs.forEach(x => { dup[x.slug] = (dup[x.slug] || 0) + 1; });
  Object.entries(dup).filter(([, n]) => n > 1).forEach(([s]) => out.push(`<article class="boas g-media"><h3>${esc(porSlug(s).nome)} <span class="via-tag">${tr("Repetido")}</span></h3><p>${tr("Este item aparece mais de uma vez entre os ativos. Confira se não é duplicidade.")}</p></article>`));
  const set = new Set(slugs.map(x => x.slug));
  const GRAV = { alta: tr("Gravidade alta"), media: tr("Gravidade média"), baixa: tr("Gravidade baixa") }, ord = { alta: 0, media: 1, baixa: 2 };
  if (typeof INTERACOES !== "undefined") {
    INTERACOES.filter(i => i.peps.some(s => set.has(s))).sort((a, b) => ord[a.g] - ord[b.g]).forEach(i => {
      const meus = [...new Set(i.peps.filter(s => set.has(s)).map(s => porSlug(s)?.nome).filter(Boolean))];
      out.push(`<article class="boas g-${i.g}"><h3>${esc(i.com)} <span class="via-tag">${GRAV[i.g]}</span></h3><p>${esc(i.o)}</p><p><b>${tr("Nos seus protocolos:")}</b> ${meus.map(esc).join(" · ")}</p></article>`);
    });
  }
  if (typeof MECANISMOS !== "undefined") {
    const nomes = new Set(slugs.map(x => porSlug(x.slug)?.nome));
    MECANISMOS.filter(f => f.id !== "peptideos-terapeuticos").forEach(f => {
      const m = f.peptideos.filter(n => nomes.has(n));
      if (m.length > 1) out.push(`<article class="boas g-baixa"><h3>${esc(f.nome)} <span class="via-tag">${tr("Mesma família")}</span></h3><p>${tr("Estes itens atuam por mecanismos parecidos, então os efeitos (e os efeitos adversos) podem se somar. Converse com o profissional que acompanha você.")}</p><p>${m.map(esc).join(" · ")}</p></article>`);
    });
  }
  const sem = slugs.map(x => porSlug(x.slug)).filter(p => p && !["Aprovado"].includes(p.fase));
  if (sem.length) out.push(`<article class="boas g-media"><h3>${tr("Itens sem aprovação como medicamento")} <span class="via-tag">${tr("Atenção")}</span></h3><p>${tr("Não há dose ou protocolo validados para estes itens. Use somente com acompanhamento de profissional de saúde e conforme a lei do seu país.")}</p><p>${sem.map(p => `<a href="${urlPeptideo(p.nome)}">${esc(p.nome)}</a>`).join(" · ")}</p></article>`);
  return out;
}

function atualizarAlertasFormulario() {
  const painel = $p("f-alertas");
  const nome = $p("f-nome").value.trim();
  const catalogado = acharPorNome(nome);
  if (!nome) {
    painel.replaceChildren();
    painel.hidden = true;
    return;
  }

  const todos = lerProtocolos();
  const ativos = todos.filter(x => x.status === "ativo" && x.id !== editando);
  const candidato = {
    id: editando || "__novo_protocolo__",
    slug: catalogado ? slug(catalogado.nome) : "",
    nome: catalogado ? catalogado.nome : nome,
    status: "ativo",
    via: $p("f-via").value,
  };
  const avisosVia = [];
  const cards = [];

  if (catalogado) {
    const slugItem = slug(catalogado.nome);
    const duplicados = ativos.filter(x => x.slug === slugItem);
    if (duplicados.length && duplicados.every(x => x.via === candidato.via)) {
      cards.push(`<article class="prot-alerta-item prot-alerta-atencao"><b>⚠️ ${tr("Já existe protocolo ativo para esta substância")}</b><span>${esc(duplicados.map(x => x.nome).join(", "))} · ${tr("Confira se não é duplicidade.")}</span></article>`);
    }

    if (typeof INTERACOES !== "undefined") {
      const normalizarTexto = texto => semAcento(String(texto || "").toLocaleLowerCase());
      const companheiroDescrito = (interacao, item) => {
        const descricao = normalizarTexto(interacao.com);
        const nomes = [item.nome, item.slug, item.slug.replace(/-/g, " "), porSlug(item.slug)?.nome]
          .filter(Boolean).map(normalizarTexto);
        return nomes.some(n => n.length > 2 && descricao.includes(n))
          || item.via === "oral" && (descricao.includes("medicamentos orais") || descricao.includes("medicamentos orales"));
      };
      INTERACOES.map(i => {
        const interacaoAtiva = i.peps.includes(slugItem)
          ? ativos.filter(a => a.slug !== slugItem && companheiroDescrito(i, a))
          : companheiroDescrito(i, candidato) ? ativos.filter(a => i.peps.includes(a.slug)) : [];
        return { interacao: i, relacionados: interacaoAtiva };
      }).filter(item => item.relacionados.length)
        .sort((a, b) => ({ alta: 0, media: 1, baixa: 2 }[a.interacao.g] ?? 3) - ({ alta: 0, media: 1, baixa: 2 }[b.interacao.g] ?? 3))
        .forEach(({ interacao: i, relacionados }) => {
          const gravidade = i.g === "alta" ? "prot-alerta-vermelho" : "prot-alerta-atencao";
          cards.push(`<article class="prot-alerta-item ${gravidade}"><b>⚠️ ${tr(i.g === "alta" ? "Atenção prioritária" : "Possível interação a conferir")}</b><span>${esc(candidato.nome)} · ${tr("com")} ${[...new Set(relacionados.map(a => a.nome))].map(esc).join(", ")}.</span><details><summary>${tr("Ver detalhe")}</summary><p>${esc(i.o)}</p></details></article>`);
        });
    }

    if (typeof MECANISMOS !== "undefined") {
      MECANISMOS.filter(f => f.id !== "peptideos-terapeuticos").forEach(f => {
        const membros = f.peptideos.filter(n => n === catalogado.nome || ativos.some(a => porSlug(a.slug)?.nome === n));
        if (membros.includes(catalogado.nome) && membros.length > 1) {
          cards.push(`<article class="prot-alerta-item prot-alerta-atencao"><b>⚠️ ${tr("Possível sobreposição de mecanismo")}</b><span>${membros.map(esc).join(", ")} · ${tr("Pode haver efeitos somados; não confirma interação.")}</span></article>`);
        }
      });
    }

    const vias = typeof VIAS !== "undefined" ? VIAS[slugItem] || [] : [];
    const mesmaSubstanciaOutraVia = ativos.filter(x => x.slug === slugItem && x.via !== candidato.via);
    if (mesmaSubstanciaOutraVia.length) {
      const rotasSalvas = [...new Set(mesmaSubstanciaOutraVia.map(x => tr(VIAS_P[x.via] || x.via)))];
      cards.push(`<article class="prot-alerta-item prot-alerta-atencao"><b>⚠️ ${tr("Vias diferentes em protocolos ativos")}</b><span>${esc(candidato.nome)}: ${rotasSalvas.map(esc).join(", ")} e ${esc(tr(VIAS_P[candidato.via] || candidato.via))}. ${tr("Confira se é intencional.")}</span></article>`);
    }

    if (!vias.length) {
      cards.push(`<article class="prot-alerta-item prot-alerta-neutro"><b>${tr("Via sem dados na ficha")}</b><span>${tr("Confira a apresentação e a orientação profissional.")}</span></article>`);
    } else {
      const viasSelecionadas = vias.filter(([via]) => via === candidato.via);
      if (!viasSelecionadas.length) {
        const listaVias = [...new Set(vias.map(([via]) => tr(VIAS_ROT[via] || via)))].map(esc).join(", ");
        cards.push(`<article class="prot-alerta-item prot-alerta-atencao"><b>⚠️ ${tr("Via não listada na ficha")}</b><span>${esc(tr(VIAS_P[candidato.via] || candidato.via))} · ${tr("Vias descritas")}: ${listaVias}.</span></article>`);
      } else if (!viasSelecionadas.some(([, evid]) => evid === "h")) {
        const evidencias = [...new Set(viasSelecionadas.map(([, evid]) => tr(VIAS_EST[evid] || evid)))].map(esc).join(", ");
        cards.push(`<article class="prot-alerta-item prot-alerta-atencao"><b>⚠️ ${tr("Evidência limitada para esta via")}</b><span>${evidencias} · ${tr("Confira com profissional de saúde.")}</span></article>`);
      }
    }
  } else {
    cards.push(`<article class="prot-alerta-item prot-alerta-neutro"><b>${tr("Substância fora do catálogo")}</b><span>${tr("Não foi possível verificar interações ou vias no guia.")}</span></article>`);
  }

  painel.innerHTML = `<h3>${tr("Confira antes de salvar")}</h3>${cards.length ? cards.join("") : `<p class="prot-alerta-neutro">${tr("Nenhum alerta identificado na base do guia. Isso não garante segurança.")}</p>`}`;
  painel.hidden = false;
}

function textoResumo(l) {
  const at = l.filter(x => x.status === "ativo");
  return `${tr("Meus protocolos")} (${fmtData(hojeISO())})\n` + (at.length ? at.map(x => `- ${x.nome}: ${resumoItem(x) || "—"}${x.produto ? " [" + x.produto + "]" : ""}${x.inicio ? " (" + tr("início") + " " + fmtData(x.inicio) + ")" : ""}`).join("\n") : tr("Nenhum protocolo ativo."));
}

function normalizarMedida(x) {
  const valor = Number(x.valor);
  return {
    id: typeof x.id === "string" ? x.id.slice(0, 100) : novoIdProtocolo(),
    indicador: Object.prototype.hasOwnProperty.call(INDICADORES, x.indicador) ? x.indicador : "outro",
    nome: typeof x.nome === "string" ? x.nome.trim().slice(0, 60) : "",
    valor: Number.isFinite(valor) ? valor : null,
    unidade: typeof x.unidade === "string" ? x.unidade.trim().slice(0, 20) : "",
    data: typeof x.data === "string" && /^\d{4}-\d{2}-\d{2}$/.test(x.data) ? x.data : "",
    notas: typeof x.notas === "string" ? x.notas.slice(0, 240) : "",
    protocoloIds: Array.isArray(x.protocoloIds) ? [...new Set(x.protocoloIds.filter(id => typeof id === "string").slice(0, 100))] : [],
    protocoloNomes: x.protocoloNomes && typeof x.protocoloNomes === "object" ? x.protocoloNomes : {},
  };
}
function lerMedidas() {
  try { return (JSON.parse(localStorage.getItem(CH_EVOLUCAO)) || []).map(normalizarMedida).filter(x => x.data && x.valor !== null && x.unidade && (x.indicador !== "outro" || x.nome)); }
  catch { return []; }
}
function gravarMedidas(lista) {
  try { localStorage.setItem(CH_EVOLUCAO, JSON.stringify(lista)); return true; }
  catch { alert(tr("Não foi possível salvar as medições neste navegador.")); return false; }
}
function chaveIndicador(m) { return `${m.indicador}|${m.indicador === "outro" ? m.nome : ""}|${m.unidade}`; }
function nomeIndicador(m) { return m.indicador === "outro" ? m.nome : tr(INDICADORES[m.indicador]?.[0] || m.indicador); }
function atualizarResumoProtocolosMedida(protocolos) {
  const entradas = [...$p("ev-protocolos-opcoes").querySelectorAll("input")];
  const selecionados = entradas.filter(e => e.checked).map(e => e.value);
  const porId = new Map(protocolos.map(x => [x.id, x]));
  entradas.forEach(input => input.closest(".prot-protocolo-opcao").classList.toggle("selecionado", input.checked));
  $p("ev-protocolos-resumo").textContent = `${tr("Selecionados")}: ${selecionados.length}`;
  $p("ev-protocolos-limpar").disabled = selecionados.length === 0;
  $p("ev-protocolos-selecionados").innerHTML = selecionados.length
    ? selecionados.map(id => {
      const x = porId.get(id);
      return `<span class="prot-relacao-chip" style="--prot-cor:${corProtocolo(id)}">${esc(x?.nome || tr("Protocolo indisponível"))}</span>`;
    }).join("")
    : `<span class="prot-relacao-vazio">${tr("Sem protocolo associado")}</span>`;
}
function desenharOpcoesProtocolosMedida(protocolos) {
  const selecionados = new Set([...$p("ev-protocolos-opcoes").querySelectorAll("input:checked")].map(e => e.value));
  $p("ev-protocolos-opcoes").innerHTML = protocolos.length
    ? protocolos.map(x => `<label class="prot-protocolo-opcao${selecionados.has(x.id) ? " selecionado" : ""}" style="--prot-cor:${corProtocolo(x.id)}"><input type="checkbox" value="${esc(x.id)}"${selecionados.has(x.id) ? " checked" : ""}><span class="prot-protocolo-opcao-texto"><b>${esc(x.nome)}</b><small>${x.dose !== null && x.dose !== undefined ? `${nfp(x.dose)} ${esc(x.unid || "")} · ${tr("Dose por aplicação")}` : tr("Dose não registrada")}${x.status !== "ativo" ? ` · ${tr(STATUS_P[x.status])}` : ""}</small></span></label>`).join("")
    : `<small>${tr("Cadastre protocolos para poder associá-los às medições.")}</small>`;
  atualizarResumoProtocolosMedida(protocolos);
}
function eventosDeDose(protocolos) {
  const eventos = [];
  protocolos.forEach(x => {
    const registros = x.registrosDose || [];
    const porData = new Map();
    registros.forEach(r => {
      porData.set(r.data, (porData.get(r.data) || 0) + 1);
      eventos.push({ ...r, protocoloId: x.id, protocolo: r.nome || x.nome, detalhado: r.dose !== null });
    });
    const ocorrencias = new Map();
    (x.tomadas || []).forEach(data => ocorrencias.set(data, (ocorrencias.get(data) || 0) + 1));
    ocorrencias.forEach((total, data) => {
      const semDetalhe = Math.max(0, total - (porData.get(data) || 0));
      const referencia = doseNoDia(x, data);
      for (let i = 0; i < semDetalhe; i++) eventos.push({
        id: `${x.id}-${data}-${i}`, data, protocoloId: x.id, protocolo: x.nome,
        dose: referencia?.dose ?? null, unid: referencia?.unid || "", freq: referencia?.freq || "",
        detalhado: false, doseReferencia: Boolean(referencia?.dose),
      });
    });
  });
  return eventos.filter(r => r.data <= hojeISO()).sort((a, b) => a.data.localeCompare(b.data));
}
const FATORES_MASSA_MG = { mg: 1, mcg: 0.001, g: 1000 };
function converterUnidadeMassa(valor, origem, destino) {
  const fatorOrigem = Object.prototype.hasOwnProperty.call(FATORES_MASSA_MG, origem) ? FATORES_MASSA_MG[origem] : null;
  const fatorDestino = Object.prototype.hasOwnProperty.call(FATORES_MASSA_MG, destino) ? FATORES_MASSA_MG[destino] : null;
  return fatorOrigem && fatorDestino
    ? valor * fatorOrigem / fatorDestino
    : null;
}
function dataComHora(iso, hora = "12:00") {
  const segura = /^\d{2}:\d{2}$/.test(hora) ? hora : "12:00";
  return new Date(`${iso}T${segura}:00`).getTime();
}
function horaProgramadaMeiaVida(x, indice, total) {
  const explicita = x.horariosDia?.[indice] || (indice === 0 ? x.horaPrimeira : x.horaSegunda) || (total === 1 ? x.hora : "");
  if (/^\d{2}:\d{2}$/.test(explicita || "")) return explicita;
  const minutos = Math.floor(indice * 1440 / total);
  return `${String(Math.floor(minutos / 60)).padStart(2, "0")}:${String(minutos % 60).padStart(2, "0")}`;
}
function horizonteAgendaMeiaVida(x) {
  if (x.status !== "ativo" || x.freq === "Se necessário" || x.freq === "Outra" && !x.diasSemana.length) return 0;
  const hoje = hojeISO();
  let datas = 0;
  let ultimaData = 0;
  for (let i = 1; i <= 365; i++) {
    const data = deslocarDia(hoje, i);
    if (dataProgramada(x, data)) {
      ultimaData = i;
      if (++datas === 3) return i;
    }
  }
  return ultimaData;
}
function renderizarGraficoMeiaVida(protocolos) {
  const seletor = $p("meia-vida-protocolo");
  const elegiveis = protocolos.map(x => ({
    protocolo: x,
    horas: x.meiaVidaHoras || meiaVidaCatalogo(x.nome),
  })).filter(item => item.horas > 0 && item.protocolo.dose > 0
    && Object.prototype.hasOwnProperty.call(FATORES_MASSA_MG, item.protocolo.unid));
  seletor.innerHTML = elegiveis.map(({ protocolo: x, horas }) => `<option value="${esc(x.id)}">${esc(x.nome)} · ${nfp(horas)} ${tr("horas")}${x.meiaVidaHoras ? "" : ` · ${tr("catálogo")}`}</option>`).join("")
    || `<option value="">${tr("Nenhum protocolo com dose em mg, mcg ou g e meia-vida disponível.")}</option>`;
  if (!elegiveis.some(item => item.protocolo.id === meiaVidaGraficoSelecionado)) meiaVidaGraficoSelecionado = elegiveis[0]?.protocolo.id || "";
  seletor.value = meiaVidaGraficoSelecionado;
  const painel = $p("meia-vida-grafico");
  const resumo = $p("meia-vida-resumo");
  if (!elegiveis.length) {
    resumo.textContent = "";
    painel.innerHTML = `<p>${tr("Edite um protocolo e informe a meia-vida para habilitar a curva. O gráfico aceita doses em mg, mcg ou g.")}</p>`;
    return;
  }
  const escolhido = elegiveis.find(item => item.protocolo.id === meiaVidaGraficoSelecionado);
  const x = escolhido.protocolo, hl = escolhido.horas, unidade = x.unid, hoje = hojeISO(), agora = dataComHora(hoje);
  const meiaVidaDias = hl / 24;
  const horizonteDias = Math.min(180, Math.max(1, meiaVidaDias * 5, horizonteAgendaMeiaVida(x)));
  const inicio = agora - horizonteDias * 864e5, fim = agora + horizonteDias * 864e5;
  const eventos = eventosDeDose([x]).flatMap(r => {
    let dose = r.dose, unid = r.unid;
    if (!(dose > 0)) {
      const referencia = doseNoDia(x, r.data);
      dose = referencia?.dose;
      unid = referencia?.unid || "";
    }
    const valor = dose > 0 ? converterUnidadeMassa(dose, unid, unidade) : null;
    return valor > 0 ? [{ t: dataComHora(r.data), dose: valor, previsto: false }] : [];
  });
  let datasPrevistas = 0;
  if (x.status === "ativo" && x.freq !== "Se necessário" && !(x.freq === "Outra" && !x.diasSemana.length)) {
    for (let i = 1; i <= Math.ceil(horizonteDias) && eventos.length < 10000; i++) {
      const data = deslocarDia(hoje, i);
      if (x.fim && data > x.fim) break;
      if (!dataProgramada(x, data)) continue;
      const configuracao = doseNoDia(x, data) || snapshotDose(x, data);
      const dose = configuracao?.dose || x.dose;
      const fator = converterUnidadeMassa(dose, configuracao?.unid || x.unid, unidade);
      if (!(fator > 0)) continue;
      const quantidade = doseDiariaProgramada(x);
      for (let n = 0; n < quantidade; n++) {
        eventos.push({ t: dataComHora(data, horaProgramadaMeiaVida(x, n, quantidade)), dose: fator, previsto: true });
        datasPrevistas++;
      }
    }
  }
  eventos.sort((a, b) => a.t - b.t);
  if (!eventos.length) {
    resumo.textContent = `${tr("Meia-vida")}: ${nfp(hl)} ${tr("horas")}.`;
    painel.innerHTML = `<p>${tr("Não há aplicações registradas nem datas futuras previsíveis para desenhar a curva.")}</p>`;
    return;
  }
  const estimar = tempo => eventos.reduce((total, evento) => evento.t <= tempo
    ? total + evento.dose * Math.pow(0.5, (tempo - evento.t) / (hl * 36e5))
    : total, 0);
  const pontosTempo = new Set(Array.from({ length: 181 }, (_, i) => inicio + (fim - inicio) * i / 180));
  pontosTempo.add(agora);
  eventos.forEach(evento => {
    if (evento.t < inicio || evento.t > fim) return;
    pontosTempo.add(evento.t);
    pontosTempo.add(Math.max(inicio, evento.t - 1));
    for (const meiasVidas of [0.25, 0.5, 1, 2, 3, 5]) {
      const t = evento.t + hl * 36e5 * meiasVidas;
      if (t <= fim) pontosTempo.add(t);
    }
  });
  const serie = [...pontosTempo].sort((a, b) => a - b).map(t => ({ t, valor: estimar(t) }));
  const maxValor = Math.max(...serie.map(p => p.valor), 0);
  const yMax = maxValor > 0 ? maxValor * 1.08 : 1;
  const x0 = 70, x1 = 740, y0 = 26, y1 = 226;
  const xPos = t => x0 + (t - inicio) / (fim - inicio) * (x1 - x0);
  const yPos = v => y1 - v / yMax * (y1 - y0);
  const fmt = n => Number(n.toPrecision(3)).toLocaleString(LOCALE, { maximumSignificantDigits: 3 });
  const intervaloHoras = (fim - inicio) / 36e5;
  const rotuloDataEixo = t => {
    const data = new Date(t);
    const opcoesData = { day: "2-digit", month: "2-digit", year: "numeric" };
    if (intervaloHoras <= 72) {
      opcoesData.hour = "2-digit";
      opcoesData.minute = "2-digit";
    }
    return data.toLocaleString(LOCALE, opcoesData);
  };
  const grades = Array.from({ length: 4 }, (_, i) => {
    const valor = yMax * (3 - i) / 3, y = y0 + i * (y1 - y0) / 3;
    return `<line x1="${x0}" y1="${y}" x2="${x1}" y2="${y}" class="prot-grafico-grade"/><text x="${x0 - 8}" y="${y + 4}" text-anchor="end">${esc(fmt(valor))}</text>`;
  }).join("");
  const datasEixo = Array.from({ length: 5 }, (_, i) => {
    const tempo = inicio + (fim - inicio) * i / 4, xTick = xPos(tempo);
    return `<line x1="${xTick}" y1="${y1}" x2="${xTick}" y2="${y1 + 5}" class="prot-grafico-eixo"/><text x="${xTick}" y="${y1 + 20}" text-anchor="middle">${esc(rotuloDataEixo(tempo))}</text>`;
  }).join("");
  const caminho = itens => itens.map((p, i) => `${i ? "L" : "M"}${xPos(p.t)},${yPos(p.valor)}`).join(" ");
  const historico = serie.filter(p => p.t <= agora);
  const projecao = serie.filter(p => p.t >= agora);
  const marcadorAgora = `<line x1="${xPos(agora)}" y1="${y0}" x2="${xPos(agora)}" y2="${y1}" class="prot-meia-vida-agora"/><text x="${xPos(agora) + 4}" y="${y0 + 12}">${tr("Hoje")}</text>`;
  const svg = `<svg class="prot-grafico-svg prot-meia-vida-svg" viewBox="0 0 760 270" role="img" aria-label="${esc(tr("Curva teórica da quantidade estimada remanescente"))}"><title>${esc(`${x.nome} · ${tr("meia-vida")} ${nfp(hl)} ${tr("horas")}`)}</title>${grades}<line x1="${x0}" y1="${y1}" x2="${x1}" y2="${y1}" class="prot-grafico-eixo"/>${datasEixo}<path d="${caminho(historico)}" class="prot-meia-vida-linha"/><path d="${caminho(projecao)}" class="prot-meia-vida-projecao"/>${marcadorAgora}<text x="12" y="${(y0 + y1) / 2}" transform="rotate(-90 12 ${(y0 + y1) / 2})" text-anchor="middle">${esc(`${tr("Quantidade estimada")} (${unidade})`)}</text></svg>`;
  const estimativaAtual = estimar(agora);
  const cincoMeiasVidas = hl * 5 / 24;
  const origemMeiaVida = x.meiaVidaHoras ? tr("Meia-vida informada") : tr("Sugestão aproximada do catálogo");
  resumo.textContent = `${origemMeiaVida}: ${nfp(hl)} ${tr("horas")} · ${tr("Quantidade estimada hoje ao meio-dia")}: ${fmt(estimativaAtual)} ${unidade}${datasPrevistas ? ` · ${tr("Aplicações futuras simuladas")}: ${datasPrevistas}` : ""}.`;
  painel.innerHTML = `<div class="prot-grafico-legenda prot-meia-vida-legenda"><span><i class="prot-meia-vida-legenda-real"></i>${tr("Estimativa com aplicações registradas")}</span><span><i class="prot-meia-vida-legenda-prevista"></i>${tr("Projeção da programação")}</span></div><div class="prot-meia-vida-rolagem">${svg}</div><p><small>${tr("Cinco meias-vidas")}: ${fmt(cincoMeiasVidas)} ${tr("dias")}. ${tr("Aplicações registradas usam o meio-dia quando não há horário salvo; as datas futuras são uma simulação da programação ativa.")}</small></p>`;
}
function renderizarGrafico(medidas, protocolos) {
  const seletor = $p("ev-grafico-indicador"), atual = seletor.value;
  const medidasGrafico = medidas.filter(m => m.data <= hojeISO());
  const historico = medidas.slice().sort((a, b) => b.data.localeCompare(a.data)).slice(0, 30);
  $p("ev-historico").innerHTML = historico.map(m => {
    const associados = m.protocoloIds.map(id => ({
      id, nome: m.protocoloNomes[id] || protocolos.find(x => x.id === id)?.nome,
    })).filter(x => x.nome);
    const rotulosVinculo = associados.length
      ? associados.map(x => `<span class="prot-historico-vinculo" style="--prot-cor:${corProtocolo(x.id)}">${esc(x.nome)}</span>`).join("")
      : `<span class="prot-historico-sem-vinculo">${tr("Sem protocolo associado")}</span>`;
    return `<li><div><b>${esc(nomeIndicador(m))}: ${nfp(m.valor)} ${esc(m.unidade)}</b><small>${fmtData(m.data)}${m.data > hojeISO() ? ` · ${tr("Fora do gráfico: data futura")}` : ""}${m.notas ? ` · ${esc(m.notas)}` : ""}</small><span class="prot-historico-vinculos">${rotulosVinculo}</span></div><button type="button" class="btn" data-apagar-medida="${esc(m.id)}" aria-label="${esc(tr("Apagar medição"))}">🗑️</button></li>`;
  }).join("") || `<li>${tr("Ainda não há medições.")}</li>`;
  const grupos = new Map();
  medidasGrafico.forEach(m => grupos.set(chaveIndicador(m), m));
  const opcoesGrafico = [...grupos.entries()].sort((a, b) => nomeIndicador(a[1]).localeCompare(nomeIndicador(b[1])))
    .map(([chave, m]) => `<option value="${esc(chave)}">${esc(nomeIndicador(m))} (${esc(m.unidade)})</option>`);
  seletor.innerHTML = opcoesGrafico.join("") || `<option value="">${tr("Ainda não há medições")}</option>`;
  if ([...grupos.keys()].includes(atual)) seletor.value = atual;
  const selecionado = seletor.value;
  const serie = medidasGrafico.filter(m => chaveIndicador(m) === selecionado).sort((a, b) => a.data.localeCompare(b.data));
  const idsAssociados = new Set(serie.flatMap(m => m.protocoloIds));
  $p("ev-grafico-ajuda").textContent = idsAssociados.size
    ? tr("O gráfico mostra somente os protocolos associados às medições deste indicador. Use as caixas coloridas para filtrar as faixas.")
    : tr("Nenhuma medição deste indicador tem protocolo associado. As doses não serão exibidas; relacione protocolos ao registrar uma medição.");
  if (indicadorGraficoAtual !== selecionado) {
    indicadorGraficoAtual = selecionado;
    protocolosVisiveisGrafico = new Set(idsAssociados);
  } else {
    idsAssociados.forEach(id => {
      if (!protocolosVinculadosGrafico.has(id)) protocolosVisiveisGrafico.add(id);
    });
    protocolosVisiveisGrafico = new Set([...protocolosVisiveisGrafico].filter(id => idsAssociados.has(id)));
  }
  protocolosVinculadosGrafico = idsAssociados;
  if (!serie.length) {
    const mensagem = medidas.length
      ? tr("Há medições no histórico, mas nenhuma delas tem uma data até hoje para desenhar o gráfico.")
      : tr("Adicione uma medição para começar a acompanhar sua evolução.");
    $p("ev-grafico").innerHTML = `<p>${mensagem}</p>`;
    return;
  }
  const todosEventos = eventosDeDose(protocolos);
  const eventos = todosEventos.filter(r => protocolosVisiveisGrafico.has(r.protocoloId) &&
    r.data >= serie[0].data && r.data <= serie[serie.length - 1].data);
  const x0 = 210, x1 = 700, y0 = 24, y1 = 224;
  const dataNum = d => new Date(d + "T12:00:00").getTime();
  const minData = dataNum(serie[0].data), maxData = dataNum(serie[serie.length - 1].data);
  const xPos = d => x0 + (maxData === minData ? .5 : (dataNum(d) - minData) / (maxData - minData)) * (x1 - x0);
  const valores = serie.map(m => m.valor), minValor = Math.min(...valores), maxValor = Math.max(...valores);
  const folga = Math.max((maxValor - minValor) * .12, Math.abs(maxValor) * .03, .5);
  const yMin = minValor - folga, yMax = maxValor + folga;
  const yPos = v => y1 - ((v - yMin) / (yMax - yMin)) * (y1 - y0);
  const grades = Array.from({ length: 4 }, (_, i) => {
    const v = yMin + (yMax - yMin) * (3 - i) / 3, y = y0 + i * (y1 - y0) / 3;
    return `<line x1="${x0}" y1="${y}" x2="${x1}" y2="${y}" class="prot-grafico-grade"/><text x="${x0 - 8}" y="${y + 4}" text-anchor="end">${esc(nfp(v))}</text>`;
  }).join("");
  const pontos = serie.map(m => `${xPos(m.data)},${yPos(m.valor)}`).join(" ");
  const marcadores = serie.map(m => `<circle cx="${xPos(m.data)}" cy="${yPos(m.valor)}" r="5" class="prot-grafico-ponto"><title>${esc(`${fmtData(m.data)} · ${nfp(m.valor)} ${m.unidade}`)}</title></circle>`).join("");
  const eventosGrafico = eventos.slice(-300);
  const rotuloDoseEvento = r => r.dose !== null && r.dose !== undefined
    ? `${nfp(r.dose)} ${r.unid}${r.doseReferencia ? ` · ${tr("dose cadastrada no protocolo; referência")}` : ""}`
    : tr("Dose não detalhada");
  const faixasDose = new Map();
  const protocolosRelacionados = protocolos.filter(x => protocolosVisiveisGrafico.has(x.id));
  const protocolosDisponiveis = protocolos.filter(x => idsAssociados.has(x.id));
  const idsAssociadosVisiveis = new Set(protocolosDisponiveis.map(x => x.id));
  const protocolosComEvento = new Set(eventos.map(r => r.protocoloId));
  protocolosRelacionados.filter(x => !protocolosComEvento.has(x.id)).forEach(x => {
    const chave = `${x.id}|${x.unid || ""}`;
    const temRegistroFuturo = (x.tomadas || []).some(data => data > hojeISO() && data >= serie[0].data && data <= serie[serie.length - 1].data);
    faixasDose.set(chave, {
      protocoloId: x.id, protocolo: x.nome, unidade: x.unid || "", cor: corProtocolo(x.id), eventos: [],
      aviso: temRegistroFuturo ? tr("Há marcação futura, não exibida no gráfico.") : tr("Sem aplicações registradas neste período."),
    });
  });
  eventosGrafico.forEach(r => {
    const chave = `${r.protocoloId}|${r.unid || ""}`;
    if (!faixasDose.has(chave)) faixasDose.set(chave, { protocoloId: r.protocoloId, protocolo: r.protocolo, unidade: r.unid || "", cor: corProtocolo(r.protocoloId), eventos: [], contagensData: new Map() });
    const faixa = faixasDose.get(chave);
    faixa.eventos.push(r);
    faixa.aviso = "";
    faixa.contagensData.set(r.data, (faixa.contagensData.get(r.data) || 0) + 1);
  });
  const inicioFaixas = 282, alturaFaixa = 42;
  const linhasDose = [...faixasDose.values()].map((faixa, i) => {
    const topo = inicioFaixas + i * alturaFaixa;
    const valoresDose = faixa.eventos.map(r => r.dose === null || r.dose === undefined ? NaN : Number(r.dose)).filter(Number.isFinite);
    const minDose = Math.min(...valoresDose), maxDose = Math.max(...valoresDose);
    const ocorrenciasData = new Map();
    const pontosDose = faixa.eventos.map(r => {
      const total = faixa.contagensData.get(r.data);
      const indice = ocorrenciasData.get(r.data) || 0;
      ocorrenciasData.set(r.data, indice + 1);
      const deslocamento = (indice - (total - 1) / 2) * 5;
      const x = Math.max(x0, Math.min(x1, xPos(r.data) + deslocamento));
      const temDose = r.dose !== null && r.dose !== undefined && Number.isFinite(Number(r.dose));
      const proporcao = temDose && maxDose !== minDose ? (Number(r.dose) - minDose) / (maxDose - minDose) : .5;
      const y = topo + 30 - proporcao * 22;
      return `<circle cx="${x}" cy="${y}" r="4" style="--prot-cor:${faixa.cor}" class="prot-grafico-dose-ponto${temDose ? "" : " prot-grafico-dose-indefinida"}"><title>${esc(`${fmtData(r.data)} · ${r.protocolo} · ${rotuloDoseEvento(r)}`)}</title></circle>`;
    }).join("");
    const rotulo = `${faixa.protocolo}${faixa.unidade ? ` · ${faixa.unidade}` : ""}`;
    return `<title>${esc(rotulo)}</title><text x="4" y="${topo + 20}" style="--prot-cor:${faixa.cor}" class="prot-grafico-dose-rotulo" aria-label="${esc(rotulo)}">${esc(rotulo.length > 32 ? `${rotulo.slice(0, 29)}…` : rotulo)}</text>${faixa.aviso ? `<text x="${x0 + 8}" y="${topo + 20}" class="prot-grafico-dose-vazia">${esc(faixa.aviso)}</text>` : ""}<line x1="${x0}" y1="${topo + 36}" x2="${x1}" y2="${topo + 36}" style="--prot-cor:${faixa.cor}" class="prot-grafico-dose"/>${pontosDose}`;
  }).join("");
  const linhasAlinhamento = faixasDose.size ? [...new Set(serie.map(m => m.data))].map(d =>
    `<line x1="${xPos(d)}" y1="${inicioFaixas - 3}" x2="${xPos(d)}" y2="${inicioFaixas + faixasDose.size * alturaFaixa - 6}" class="prot-grafico-alinhamento"/>`
  ).join("") : "";
  const labelsDatas = [...new Set([serie[0].data, serie[serie.length - 1].data])].map(d =>
    `<text x="${xPos(d)}" y="242" text-anchor="${d === serie[0].data ? "start" : "end"}">${esc(fmtData(d))}</text>`
  ).join("");
  const alturaGrafico = Math.max(300, inicioFaixas + faixasDose.size * alturaFaixa + 8);
  const svg = `<svg class="prot-grafico-svg" viewBox="0 0 720 ${alturaGrafico}" role="img" aria-label="${esc(`${nomeIndicador(serie[0])}: ${serie.length} ${tr("medições")}`)}">
    ${grades}<line x1="${x0}" y1="${y1}" x2="${x1}" y2="${y1}" class="prot-grafico-eixo"/>
    ${serie.length > 1 ? `<polyline points="${pontos}" class="prot-grafico-linha"/>` : ""}${marcadores}${labelsDatas}
    ${faixasDose.size ? `<text x="4" y="264">${tr("Doses registradas · mesma linha do tempo")}</text>${linhasAlinhamento}${linhasDose}` : ""}
  </svg>`;
  const listaDoses = eventos.slice().reverse().slice(0, 20).map(r =>
    `<li><time>${fmtData(r.data)}</time><b>${esc(r.protocolo)}</b><span>${esc(rotuloDoseEvento(r))}</span></li>`
  ).join("");
  const controlesProtocolos = [...idsAssociadosVisiveis].map(id => {
    const x = protocolos.find(item => item.id === id);
    if (!x) return "";
    return `<label class="prot-grafico-filtro" style="--prot-cor:${corProtocolo(id)}"><input type="checkbox" data-protocolo-grafico="${esc(id)}"${protocolosVisiveisGrafico.has(id) ? " checked" : ""}><span>${esc(x.nome)}</span></label>`;
  }).join("");
  const filtrosGrafico = controlesProtocolos
    ? `<fieldset class="prot-grafico-filtros"><legend>${tr("Protocolos no gráfico")}</legend>${controlesProtocolos}</fieldset>`
    : "";
  const mensagemProtocolos = !idsAssociados.size
    ? `<p class="prot-grafico-sem-vinculo">${tr("Associe um protocolo a uma medição para exibir suas aplicações junto ao indicador.")}</p>`
    : !protocolosVisiveisGrafico.size
      ? `<p class="prot-grafico-sem-vinculo">${tr("Selecione ao menos um protocolo para exibir as doses no gráfico.")}</p>`
      : "";
  const legendasGrafico = `<div class="prot-grafico-legenda"><span><i class="prot-legenda-medida"></i>${tr("Medições")}</span><span><i class="prot-legenda-dose"></i>${tr("Protocolos associados (uma cor por item)")}</span></div>`;
  const avisoMedidasFuturas = medidas.some(m => m.data > hojeISO()) ? `<p><small>${tr("Medições com data futura ficam no histórico, mas não entram no gráfico.")}</small></p>` : "";
  $p("ev-grafico").innerHTML = `${legendasGrafico}${filtrosGrafico}${mensagemProtocolos}${svg}<p><small>${tr("A linha mostra as medições; as faixas coloridas mostram as aplicações dos protocolos selecionados. Cada dose usa escala própria e não deve ser comparada numericamente à medição.")}</small></p>${avisoMedidasFuturas}${listaDoses ? `<h4>${tr("Uso registrado no período")}</h4><ul class="prot-dose-linha">${listaDoses}</ul>` : protocolosVisiveisGrafico.size ? `<p><small>${tr("Não há marcações de uso desses protocolos no intervalo das medições.")}</small></p>` : ""}`;
}
function desenharEvolucao(protocolos) {
  atualizarCoresProtocolos(protocolos);
  desenharOpcoesProtocolosMedida(protocolos);
  renderizarGrafico(lerMedidas(), protocolos);
}
function configurarIndicador() {
  const indicador = $p("ev-indicador").value, custom = indicador === "outro";
  $p("ev-nome-wrap").hidden = !custom;
  $p("ev-nome").required = custom;
  $p("ev-unidade").value = custom ? "" : tr(INDICADORES[indicador][1]);
}

function desenhar() {
  const l = lerProtocolos(), at = l.filter(x => x.status === "ativo");
  const medidas = lerMedidas();
  const cont = s => l.filter(x => x.status === s).length;
  $p("abas").innerHTML = Object.entries(STATUS_P).map(([k, v]) => `<button type="button" class="seg-op" data-f="${k}" aria-pressed="${filtro === k}">${tr(v)} (${cont(k)})</button>`).join("") +
    `<button type="button" class="seg-op" data-f="todos" aria-pressed="${filtro === "todos"}">${tr("Todos")} (${l.length})</button>`;
  const lista = filtro === "todos" ? l : l.filter(x => x.status === filtro);
  $p("lista-prot").innerHTML = lista.length ? lista.slice().reverse().map(cartao).join("") : `<p class="vazio">${tr("Nada por aqui ainda. Use “Novo protocolo” para registrar o que você usa.")}</p>`;
  const hoje = hojeISO(), feitos = at.reduce((n, x) => n + (x.tomadas || []).filter(d => d === hoje).length, 0);
  $p("resumo-prot").textContent = at.length ? `${at.length} ${tr("ativo(s)")} · ${feitos} ${tr("aplicações registradas hoje")}` : tr("Nenhum protocolo ativo.");
  $p("painel-acompanhamento").classList.toggle("sem-protocolos", !at.length);
  $p("acomp-semanal").hidden = !at.length;
  $p("acomp-semanal").innerHTML = at.length ? `<h3>${tr("Acompanhamento semanal e mensal")}</h3><p>${tr("A semana começa na segunda-feira e a contagem reinicia ao mudar de semana. O calendário reúne os protocolos ativos; selecione um dia para ver e atualizar cada aplicação.")}</p>${lembretesHoje(at)}<div class="prot-mes-controle"><button type="button" class="btn" data-mes="-1" aria-label="${tr("Mês anterior")}">← ${tr("Mês anterior")}</button><b>${esc(rotuloMesAtual())}</b><button type="button" class="btn" data-mes="1" aria-label="${tr("Próximo mês")}">${tr("Próximo mês")} →</button></div><p class="prot-legenda"><span class="feita">✓ ${tr("Feita")}</span><span class="parcial">◐ ${tr("Parcial")}</span><span class="perdida">! ${tr("Não registrada")}</span><span class="futura">○ ${tr("Programada")}</span><span class="sem-agenda">— ${tr("Sem aplicação programada")}</span></p>${calendarioMensal(at)}` : "";
  const al = alertas(at);
  $p("alertas-prot").innerHTML = al.length ? `<h3>${tr("Pontos de atenção nos seus protocolos")}</h3>` + al.join("") : "";
  $p("apagar-protocolos").disabled = l.length === 0;
  $p("apagar-medidas").disabled = medidas.length === 0;
  $p("apagar-tudo").disabled = l.length === 0 && medidas.length === 0;
  $p("titulo-protocolos").textContent = tr(filtro === "ativo" ? "Protocolos ativos" : "Seus protocolos");
  $p("abas").setAttribute("aria-label", tr("Filtrar por situação"));
  $p("ev-data").max = hojeISO();
  $p("secao-meia-vida").hidden = l.length === 0;
  renderizarGraficoMeiaVida(l);
  desenharEvolucao(l);
  document.querySelectorAll("#prot-vazio").forEach(e => { e.hidden = l.length > 0; });
}
window.addEventListener("focus", atualizarAcompanhamento);
document.addEventListener("visibilitychange", () => { if (!document.hidden) atualizarAcompanhamento(); });
setInterval(() => {
  if (!document.hidden) atualizarAcompanhamento();
}, 60000);
function atualizarAcompanhamento() {
  const mesAtual = hojeISO().slice(0, 7);
  if (mesAcompanhamento === mesAtualConhecido) mesAcompanhamento = mesAtual;
  mesAtualConhecido = mesAtual;
  desenhar();
}
function agendarAtualizacaoDiaria() {
  const agora = new Date(), amanha = new Date(agora.getFullYear(), agora.getMonth(), agora.getDate() + 1);
  setTimeout(() => { atualizarAcompanhamento(); agendarAtualizacaoDiaria(); }, amanha.getTime() - agora.getTime() + 50);
}

$p("abas").addEventListener("click", e => { const b = e.target.closest("button"); if (b) { filtro = b.dataset.f; desenhar(); } });
$p("form-registro-dose").addEventListener("change", e => {
  if (!e.target.matches('input[name="dose-mudou"]')) return;
  const mudou = e.target.value === "sim";
  $p("dose-nova-wrap").hidden = !mudou;
  $p("dose-nova").required = mudou;
  $p("dose-registro-erro").hidden = true;
  if (mudou) $p("dose-nova").focus();
});
$p("form-registro-dose").addEventListener("submit", confirmarRegistroDose);
$p("dose-cancelar").addEventListener("click", () => {
  registroDosePendente = null;
  $p("dialogo-dose").close();
});
$p("dialogo-dose").addEventListener("cancel", () => { registroDosePendente = null; });
$p("acomp-semanal").addEventListener("click", e => {
  const acaoTomada = e.target.closest("button[data-protocolo][data-acao-tomada]");
  if (acaoTomada) {
    const l = lerProtocolos(), x = l.find(item => item.id === acaoTomada.dataset.protocolo);
    if (!x) return;
    if (acaoTomada.dataset.acaoTomada === "marcar") return abrirRegistroDose(x.id, diaSelecionadoCalendario);
    else if (acaoTomada.dataset.acaoTomada === "desfazer") desfazerTomada(x, diaSelecionadoCalendario);
    else return;
    gravarProtocolos(l);
    desenhar();
    return;
  }
  const dia = e.target.closest("button[data-dia]");
  if (dia) {
    diaSelecionadoCalendario = dia.dataset.dia;
    desenhar();
    return;
  }
  const previsao = e.target.closest("button[data-estoque-data]");
  if (previsao) {
    diaSelecionadoCalendario = previsao.dataset.estoqueData;
    mesAcompanhamento = diaSelecionadoCalendario.slice(0, 7);
    desenhar();
    return;
  }
  const b = e.target.closest("button[data-mes]");
  if (!b) return;
  mesAcompanhamento = deslocarMes(mesAcompanhamento, Number(b.dataset.mes));
  if (diaSelecionadoCalendario.slice(0, 7) !== mesAcompanhamento) diaSelecionadoCalendario = dataDoMes(mesAcompanhamento, 1);
  desenhar();
});
$p("lista-prot").addEventListener("click", e => {
  const b = e.target.closest("button"); if (!b) return;
  const id = b.closest(".prot-card").dataset.id, l = lerProtocolos(), i = l.findIndex(x => x.id === id); if (i < 0) return;
  const x = l[i], ac = b.dataset.ac;
  if (ac === "editar") return abrirForm(x);
  if (ac === "tomei") return abrirRegistroDose(x.id);
  if (ac === "desfazer-tomada") desfazerTomada(x);
  if (ac === "pausar") x.status = "pausado";
  if (ac === "concluir") { x.status = "concluido"; if (!x.fim) x.fim = hojeISO(); }
  if (ac === "reativar") x.status = "ativo";
  if (ac === "duplicar") {
    const duplicado = { ...x, id: novoIdProtocolo(), tomadas: [], registrosDose: [], historicoDose: [], criado: hojeISO(), inicio: hojeISO(), fim: "", fimTipo: "nenhum", status: "ativo" };
    registrarConfiguracaoDose(duplicado);
    l.splice(i + 1, 0, duplicado);
  }
  if (ac === "apagar") { if (!confirm(tr("Apagar este protocolo? Isso não pode ser desfeito."))) return; l.splice(i, 1); }
  gravarProtocolos(l); desenhar();
});
$p("exportar").addEventListener("click", () => {
  if (baixarBackup()) $p("msg-imp").textContent = tr("Cópia de segurança gerada. Guarde o arquivo em local seguro.");
});
$p("importar").addEventListener("change", async e => {
  const f = e.target.files[0]; if (!f) return;
  let d;
  try {
    d = JSON.parse(await f.text());
  } catch {
    $p("msg-imp").textContent = tr("Arquivo inválido.");
    e.target.value = "";
    return;
  }
  const registrosProtocolo = Array.isArray(d) ? d : d && typeof d === "object" ? d.itens : null;
  const registrosMedida = Array.isArray(d) ? [] : d && typeof d === "object"
    ? d.medidas === undefined ? [] : d.medidas : null;
  if (!Array.isArray(registrosProtocolo) || !Array.isArray(registrosMedida)
    || registrosProtocolo.some(x => !x || typeof x !== "object" || typeof x.nome !== "string")
    || registrosMedida.some(x => !x || typeof x !== "object")) {
    $p("msg-imp").textContent = tr("Arquivo inválido.");
    e.target.value = "";
    return;
  }
  const novos = registrosProtocolo.map(normalizarProtocolo);
  const medidasImportadas = registrosMedida.map(normalizarMedida).filter(x => x.data && x.valor !== null && x.unidade);
  const protocolosAtuais = lerProtocolos(), ids = new Set(protocolosAtuais.map(x => x.id));
  const listaProtocolos = [...protocolosAtuais];
  let n = 0;
  novos.forEach(x => { if (!ids.has(x.id)) { listaProtocolos.push(x); ids.add(x.id); n++; } });
  if (!gravarProtocolos(listaProtocolos)) {
    $p("msg-imp").textContent = tr("A importação não foi concluída. Verifique os dados salvos e tente novamente.");
    e.target.value = "";
    return;
  }
  const medidasAtuais = lerMedidas(), medidasIds = new Set(medidasAtuais.map(x => x.id));
  const medidasNovas = medidasImportadas.filter(x => {
    if (medidasIds.has(x.id)) return false;
    medidasIds.add(x.id);
    return true;
  });
  if (medidasNovas.length && !gravarMedidas([...medidasAtuais, ...medidasNovas])) {
    const protocolosRestaurados = gravarProtocolos(protocolosAtuais);
    desenhar();
    $p("msg-imp").textContent = tr(protocolosRestaurados
      ? "Importação cancelada: não foi possível salvar as medições; os protocolos foram mantidos."
      : "Protocolos importados, mas não foi possível salvar as medições.");
    e.target.value = "";
    return;
  }
  desenhar();
  $p("msg-imp").textContent = `${n} ${tr("protocolo(s) importado(s).")} · ${medidasNovas.length} ${tr("medição(ões) importada(s).")}`;
  e.target.value = "";
});
$p("copiar-res").addEventListener("click", async e => {
  const t = textoResumo(lerProtocolos());
  try { await navigator.clipboard.writeText(t); e.currentTarget.textContent = "✅ " + tr("Copiado"); } catch { prompt(tr("Copie:"), t); }
});
$p("imprimir").addEventListener("click", () => { filtro = "ativo"; desenhar(); window.print(); });
[
  ["apagar-protocolos", "protocolos"],
  ["apagar-medidas", "medidas"],
  ["apagar-tudo", "tudo"],
].forEach(([id, tipo]) => $p(id).addEventListener("click", () => {
  atualizacaoDialogoExclusao(tipo);
  $p("dialogo-exclusao").showModal();
}));
$p("exclusao-baixar-backup").addEventListener("click", () => {
  const tipo = exclusaoPendente?.tipo;
  if (!tipo) return;
  const dados = { protocolos: lerProtocolos(), medidas: lerMedidas() };
  atualizacaoDialogoExclusao(tipo, dados);
  if (!baixarBackup()) {
    $p("exclusao-erro").textContent = tr("Não foi possível gerar a cópia de segurança.");
    $p("exclusao-erro").hidden = false;
    return;
  }
  exclusaoPendente.backupBaixado = true;
  $p("exclusao-erro").hidden = true;
  atualizarConfirmacaoExclusao();
});
$p("exclusao-backup-confirmada").addEventListener("change", atualizarConfirmacaoExclusao);
$p("exclusao-frase").addEventListener("input", atualizarConfirmacaoExclusao);
$p("exclusao-cancelar").addEventListener("click", () => {
  exclusaoPendente = null;
  $p("dialogo-exclusao").close();
});
$p("dialogo-exclusao").addEventListener("cancel", () => { exclusaoPendente = null; });
$p("form-exclusao").addEventListener("submit", e => {
  e.preventDefault();
  if (!exclusaoPendente) return;
  const tipo = exclusaoPendente.tipo;
  const dadosAtuais = { protocolos: lerProtocolos(), medidas: lerMedidas() };
  if (JSON.stringify(dadosAtuais) !== exclusaoPendente.snapshot) {
    atualizacaoDialogoExclusao(tipo, dadosAtuais);
    $p("exclusao-erro").textContent = tr("Os dados mudaram. Confira as quantidades e baixe uma nova cópia antes de confirmar.");
    $p("exclusao-erro").hidden = false;
    return;
  }
  if (!exclusaoPendente.backupBaixado || !$p("exclusao-backup-confirmada").checked
    || $p("exclusao-frase").value.trim().toLocaleUpperCase() !== tr("APAGAR").toLocaleUpperCase()) return;
  limparDadosExclusao(tipo);
  exclusaoPendente = null;
  $p("dialogo-exclusao").close();
});
$p("ev-indicador").addEventListener("change", configurarIndicador);
$p("meia-vida-protocolo").addEventListener("change", () => {
  meiaVidaGraficoSelecionado = $p("meia-vida-protocolo").value;
  renderizarGraficoMeiaVida(lerProtocolos());
});
$p("ev-grafico-indicador").addEventListener("change", () => renderizarGrafico(lerMedidas(), lerProtocolos()));
$p("ev-protocolos-opcoes").addEventListener("change", () => atualizarResumoProtocolosMedida(lerProtocolos()));
$p("ev-protocolos-limpar").addEventListener("click", () => {
  $p("ev-protocolos-opcoes").querySelectorAll('input[type="checkbox"]').forEach(input => { input.checked = false; });
  atualizarResumoProtocolosMedida(lerProtocolos());
});
$p("ev-grafico").addEventListener("change", e => {
  if (!e.target.matches("input[data-protocolo-grafico]")) return;
  const visiveis = new Set([...$p("ev-grafico").querySelectorAll("input[data-protocolo-grafico]:checked")].map(input => input.dataset.protocoloGrafico));
  protocolosVisiveisGrafico = visiveis;
  renderizarGrafico(lerMedidas(), lerProtocolos());
});
$p("form-evolucao").addEventListener("submit", e => {
  e.preventDefault();
  const erro = $p("ev-erro");
  $p("ev-msg").textContent = "";
  $p("ev-msg").hidden = true;
  erro.hidden = true;
  erro.textContent = "";
  const indicador = $p("ev-indicador").value, nome = indicador === "outro" ? $p("ev-nome").value.trim() : "";
  const valor = Number(String($p("ev-valor").value).replace(",", "."));
  const unidade = $p("ev-unidade").value.trim();
  if ($p("ev-data").value > hojeISO()) {
    erro.textContent = tr("Use hoje ou uma data anterior para registrar uma medição.");
    erro.hidden = false;
    $p("ev-data").focus();
    return;
  }
  if (!Number.isFinite(valor) || !unidade || indicador === "outro" && !nome) return;
  const protocolos = lerProtocolos(), protocoloIds = [...$p("ev-protocolos-opcoes").querySelectorAll("input:checked")].map(x => x.value);
  const protocoloNomes = Object.fromEntries(protocoloIds.map(id => [id, protocolos.find(x => x.id === id)?.nome || ""]));
  const medidas = lerMedidas();
  medidas.push(normalizarMedida({
    id: novoIdProtocolo(), indicador, nome, valor, unidade, data: $p("ev-data").value || hojeISO(),
    notas: $p("ev-notas").value.trim(), protocoloIds, protocoloNomes,
  }));
  if (!gravarMedidas(medidas)) return;
  $p("ev-valor").value = "";
  $p("ev-notas").value = "";
  $p("ev-data").value = hojeISO();
  desenharEvolucao(protocolos);
  $p("ev-msg").textContent = tr("Medição salva.");
  $p("ev-msg").hidden = false;
});
$p("ev-historico").addEventListener("click", e => {
  const b = e.target.closest("button[data-apagar-medida]");
  if (!b || !confirm(tr("Apagar esta medição?"))) return;
  gravarMedidas(lerMedidas().filter(m => m.id !== b.dataset.apagarMedida));
  desenharEvolucao(lerProtocolos());
});
migrarProtocolosAntigos();
configurarIndicador();
$p("ev-data").value = hojeISO();
desenhar();
agendarAtualizacaoDiaria();
(function () {
  const add = new URLSearchParams(location.search).get("add");
  const p = add && porSlug(add);
  if (p) abrirForm({ nome: p.nome });
})();
