const LICOES = [
  { id: "oque", titulo: "1. O que é um peptídeo? (Peptídeos)", html: `
    <p>Peptídeos são cadeias curtas de aminoácidos ligados entre si. Cadeias maiores costumam ser chamadas de proteínas, mas o limite não é rígido.</p>
    <p>O corpo produz peptídeos que funcionam como mensageiros, como a insulina e a ocitocina, além de peptídeos de defesa. Muitos medicamentos são peptídeos ou derivados deles.</p>
    <p><b>Ideia-chave:</b> ser um peptídeo não diz se algo é seguro ou eficaz. Cada substância precisa ser avaliada individualmente.</p>` },
  { id: "diferenca", titulo: "2. Peptídeo, proteína e hormônio: qual a diferença? (Peptídeos)", html: `
    <ul><li><b>Peptídeo:</b> cadeia curta de aminoácidos.</li>
    <li><b>Proteína:</b> cadeia de aminoácidos dobrada em uma estrutura tridimensional; muitos limites entre proteínas e peptídeos são convencionais.</li>
    <li><b>Hormônio:</b> mensageiro químico que pode ser peptídico, esteroidal ou de outra classe.</li></ul>
    <p>A digestão pode degradar peptídeos, mas a via adequada depende da formulação e da evidência de cada medicamento; não se pode generalizar.</p>` },
  { id: "aprovacao", titulo: "3. Como medicamentos e outras substâncias são avaliados", html: `
    <ol><li><b>Pesquisa básica e pré-clínica:</b> células e animais ajudam a formular hipóteses, mas não provam benefício em pessoas.</li>
    <li><b>Fase 1:</b> avaliação inicial de segurança, tolerabilidade e farmacologia.</li>
    <li><b>Fase 2:</b> avaliação preliminar de eficácia e segurança na condição estudada.</li>
    <li><b>Fase 3:</b> estudos maiores para confirmar benefícios e riscos relevantes.</li>
    <li><b>Avaliação regulatória:</b> agências como Anvisa, FDA e EMA analisam dados para indicações e condições específicas.</li>
    <li><b>Fase 4:</b> monitoramento após a autorização.</li></ol>
    <p>A maior parte das hipóteses não se transforma em medicamento eficaz. "Promissor em laboratório" não significa "funciona em pessoas".</p>` },
  { id: "ensaio", titulo: "4. Como ler um ensaio clínico", html: `
    <ul><li><b>Randomizado e controlado:</b> a alocação aleatória e um grupo de comparação ajudam a reduzir vieses.</li>
    <li><b>Duplo-cego:</b> participantes e pesquisadores não sabem quem recebe cada intervenção, quando isso é viável.</li>
    <li><b>Tamanho da amostra:</b> estudos pequenos podem não detectar benefícios ou danos importantes.</li>
    <li><b>Desfecho primário:</b> confira o que foi medido e se é relevante para as pessoas.</li>
    <li><b>Quem financiou:</b> conflitos de interesse devem ser considerados, sem substituir a avaliação dos métodos.</li>
    <li><b>Revisão por pares e replicação:</b> resultados consistentes entre estudos e grupos independentes são mais informativos.</li></ul>
    <p>Revisões sistemáticas bem conduzidas ajudam a situar estudos isolados; também precisam ser avaliadas criticamente.</p>` },
  { id: "preclinico", titulo: "5. Células e animais não são pessoas", html: `
    <p>Uma substância pode alterar células ou produzir um efeito em animais e não trazer benefício — ou causar danos — em seres humanos.</p>
    <p>Ao ler "estudos mostram", pergunte: em quem, com qual comparação e medindo qual resultado? Evidência pré-clínica gera hipóteses, não confirma eficácia clínica.</p>
    <p>Relatos pessoais não estabelecem causa e efeito: podem refletir expectativa, mudanças simultâneas ou seleção de experiências.</p>` },
  { id: "golpes", titulo: "6. Como avaliar rótulos e produtos duvidosos", html: `
    <ul><li>Menções como "apenas para pesquisa" não significam que um produto seja destinado ou avaliado para uso humano.</li>
    <li>Promessas de cura, rejuvenescimento ou resultado garantido são sinais de alerta.</li>
    <li>Confira fabricante, composição, lote, validade, advertências e a situação regulatória aplicável.</li>
    <li>Um suplemento alimentar não é automaticamente um medicamento, e regras de comercialização diferem entre categorias.</li>
    <li>Desconfie de vendedores com interesse financeiro que também afirmem prescrever ou garantir resultados.</li></ul>
    <p>Consulte as fontes oficiais e confirme o status do produto no órgão regulador local.</p>` },
  { id: "medico", titulo: "7. Perguntas para levar ao profissional de saúde", html: `
    <ul><li>Qual é a indicação e o benefício esperado no meu caso?</li>
    <li>Que evidências em pessoas existem e quais são suas limitações?</li>
    <li>Quais riscos, interações e alternativas devem ser considerados?</li>
    <li>Que acompanhamento é recomendado para esta condição e tratamento?</li>
    <li>Qual é a situação regulatória e o que informa a bula ou o rótulo?</li>
    <li>Se pratico esporte competitivo, há regras antidoping aplicáveis?</li></ul>
    <p>Este guia é educativo; decisões de saúde devem ser discutidas com um profissional habilitado.</p>` },
  { id: "hormonios", titulo: "8. O que são hormônios e como eles agem", html: `
    <p>Hormônios são mensageiros produzidos por tecidos e glândulas. Eles circulam ou atuam localmente e se ligam a receptores específicos, que iniciam respostas nas células.</p>
    <p>Eixos como o hipotálamo-hipófise coordenam sinais entre órgãos. O feedback negativo ajuda a regular esses sistemas: quando há sinal suficiente, a produção a montante pode diminuir.</p>
    <p>Hormônios diferentes têm estruturas, funções e riscos diferentes. Alterar um eixo pode afetar vários processos; a avaliação depende da condição clínica e de exames interpretados por profissional.</p>` },
  { id: "nutrientes", titulo: "9. Vitaminas, minerais e suplementos: o que a evidência mostra", html: `
    <p>Vitaminas e minerais são nutrientes essenciais, mas os benefícios da suplementação dependem da necessidade, da alimentação, da condição clínica e da evidência para cada produto.</p>
    <p>Corrigir uma deficiência não é o mesmo que suplementar quem já recebe o suficiente. O excesso também pode causar efeitos adversos, interações ou toxicidade; "natural" não significa seguro.</p>
    <p>Suplementos não substituem diagnóstico ou tratamento. Confira a composição e as advertências no rótulo e converse com profissional de saúde em caso de dúvida.</p>` },
  { id: "nad", titulo: "10. NAD+, sirtuínas e longevidade: hipótese e evidência", html: `
    <p>NAD+ é uma coenzima envolvida em reações metabólicas e processos celulares. Sirtuínas são enzimas que usam NAD+; AMPK participa da regulação do metabolismo energético.</p>
    <p>Esses mecanismos são estudados em envelhecimento, células e animais, mas plausibilidade biológica não comprova que aumentar NAD+ ou tomar precursores prolongue a vida ou reverta o envelhecimento em pessoas.</p>
    <p>Estudos clínicos em humanos ainda não estabelecem benefício antienvelhecimento. Separe resultados laboratoriais, marcadores biológicos e desfechos de saúde relevantes.</p>` },
  { id: "vias", titulo: "11. Vias de administração e por que a forma importa", html: `
    <p>A via oral, subcutânea, intramuscular e outras diferem na absorção, velocidade, distribuição e riscos. Uma substância pode ser degradada no trato digestivo ou ter absorção variável, mas isso depende da molécula e da formulação.</p>
    <p>Uma apresentação oral, injetável ou tópica não é automaticamente equivalente a outra. Evidência e autorização regulatória se aplicam a formulações e vias específicas.</p>
    <p>Não altere a via, não prepare nem injete produtos por conta própria. Siga a bula e a orientação de profissional habilitado.</p>` },
  { id: "rotulos", titulo: "12. Como ler bula, rótulo e status regulatório", html: `
    <p>Leia o princípio ativo, a concentração, a apresentação, a indicação, as contraindicações, as advertências, as interações, o lote e a validade. Bula de medicamento e rótulo de suplemento têm finalidades e regras diferentes.</p>
    <p>FDA, EMA e Anvisa são autoridades de jurisdições distintas. Uma autorização não significa aprovação mundial nem valida qualquer uso: confira o produto, a indicação e a situação atual na fonte oficial correspondente.</p>
    <p>Não confunda alegações de marketing, registro de empresa, estudo clínico e autorização de medicamento. Em caso de dúvida, confirme com farmacêutico ou profissional de saúde.</p>` }
];
