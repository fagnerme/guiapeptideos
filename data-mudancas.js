/* Registro editorial de mudanças. Adicione novas entradas no topo. tipo: "conteudo" | "aprovacao" | "seguranca" | "recurso" */
const MUDANCAS = [
  { data: "2026-11-05", tipo: "recurso", texto: "Novo mapa de conexões: gráfico clicável que liga cada peptídeo ou hormônio aos alvos do corpo e a outros itens que agem no mesmo alvo." },
  { data: "2026-11-05", tipo: "recurso", texto: "Calculadora: protocolos salvos neste aparelho, duração estimada do frasco, conversor entre UI e mg e abertura direta a partir da ficha com a via sugerida." },
  { data: "2026-11-05", tipo: "recurso", texto: "Cada ficha ganhou a seção “Conferir nas fontes oficiais” (FDA, DailyMed, EMA, Anvisa, PubChem e ClinicalTrials.gov)." },
  { data: "2026-11-05", tipo: "conteudo", texto: "Acervo ampliado para 140 itens, com suplementos, minerais, vitaminas B, análogos de GLP-1, hormônios e peptídeos aprovados adicionais." },
  { data: "2026-11-06", tipo: "conteudo", texto: "Acervo ampliado para cerca de 700 itens: peptídeos, hormônios, moduladores e suplementos adicionais, mais fichas de dados automáticos vindas do ChEMBL. Cada ficha agora mostra a origem do texto (revisado, base oficial ou texto educativo de IA sem revisão)." },  { data: "2026-11-05", tipo: "aprovacao", texto: "Elamipretida (SS-31) passou de “Fase 3” para “Aprovado” após confirmação no Drugs@FDA (aprovação acelerada em 2025, síndrome de Barth).", slug: "elamipretida-ss-31" },
  { data: "2026-11-05", tipo: "conteudo", texto: "Retatrutida: corrigido o texto de ação, que passa a dizer que aumenta (e não reduz) o gasto de energia.", slug: "retatrutida" },
  { data: "2026-11-05", tipo: "recurso", texto: "Aprovações oficiais da FDA e da EMA passaram a ser detectadas automaticamente e promovem a fase para “Aprovado”." },
  { data: "2026-11-05", tipo: "recurso", texto: "Novos recursos: busca global, mapa de mecanismos, verificador de alegações, página de segurança, estatísticas, alertas de recalls e este registro de mudanças." },
];