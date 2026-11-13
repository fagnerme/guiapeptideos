/* Interações e condições de cuidado. Texto educativo, não é lista completa. Sempre informe todos os medicamentos ao médico e leia a bula.
   g = gravidade (alta, media, baixa). */
const GLP1_CLASSE = ["semaglutida", "tirzepatida", "liraglutida", "retatrutida", "survodutida", "mazdutida", "cagrilintida", "pramlintida"];
const INTERACOES = [
  { peps: GLP1_CLASSE, com: "Insulina e sulfonilureias", g: "alta", o: "Somar efeitos que baixam a glicose aumenta o risco de hipoglicemia (suor frio, tremor, confusão). O médico costuma reduzir a dose do outro medicamento." },
  { peps: ["pramlintida"], com: "Insulina", g: "alta", o: "Tem alerta na bula para hipoglicemia grave, sobretudo no início. Por isso a dose de insulina costuma ser ajustada." },
  { peps: ["semaglutida", "tirzepatida", "liraglutida", "retatrutida", "survodutida", "mazdutida", "cagrilintida", "pramlintida", "bremelanotida-pt-141"], com: "Medicamentos orais", g: "media", o: "Retardam o esvaziamento do estômago e podem mudar a velocidade de absorção de comprimidos. Para a tirzepatida, a bula orienta cuidado extra com anticoncepcionais orais após o início e a cada aumento de dose." },
  { peps: ["insulina"], com: "Betabloqueadores, corticoides, álcool e outros antidiabéticos", g: "media", o: "Betabloqueadores podem mascarar sintomas de hipoglicemia; corticoides elevam a glicose; o álcool aumenta o risco de hipoglicemia. Tiazolidinedionas somadas à insulina podem causar retenção de líquidos." },
  { peps: ["hormonio-do-crescimento-somatropina", "tesamorelina", "ipamorelina-cjc-1295", "sermorelina", "ghrp-6", "ghrp-2-pralmorelina", "hexarelina"], com: "Glicocorticoides e medicamentos para diabetes", g: "media", o: "Corticoides podem diminuir o efeito do GH. O GH pode reduzir a sensibilidade à insulina e exigir ajuste de antidiabéticos." },
  { peps: ["octreotida"], com: "Antidiabéticos, betabloqueadores, bloqueadores de canal de cálcio e ciclosporina", g: "media", o: "Pode alterar a glicemia, somar efeito de redução do ritmo cardíaco e reduzir os níveis de ciclosporina." },
  { peps: ["teriparatida", "abaloparatida"], com: "Digoxina e suplementos de cálcio/vitamina D em excesso", g: "media", o: "A elevação do cálcio no sangue pode aumentar a toxicidade da digoxina. Doses altas de cálcio e vitamina D somam o risco de hipercalcemia." },
  { peps: ["leuprorrelina"], com: "Medicamentos que prolongam o intervalo QT", g: "media", o: "A supressão hormonal pode prolongar o QT; somada a antiarrítmicos e outros fármacos, aumenta o risco de arritmia." },
  { peps: ["ocitocina"], com: "Vasopressores, anestésicos e prostaglandinas", g: "alta", o: "Pode causar elevação grave da pressão ou contrações exageradas. O uso é hospitalar e monitorado." },
  { peps: ["zilucoplana", "pegcetacoplana"], com: "Vacinas, antibióticos e imunossupressores", g: "alta", o: "Bloquear o complemento aumenta o risco de infecção grave por bactérias encapsuladas, como o meningococo. A bula exige vacinação prévia e vigilância de sinais de infecção." },
  { peps: ["bremelanotida-pt-141"], com: "Naltrexona oral e anti-hipertensivos", g: "media", o: "A naltrexona pode reduzir a eficácia, e o medicamento pode elevar brevemente a pressão arterial, o que pesa em quem toma anti-hipertensivos." },
  { peps: ["melanotan-ii"], com: "Anti-hipertensivos e medicamentos para o coração", g: "media", o: "Pode alterar a pressão arterial e a frequência cardíaca. O produto não é aprovado; a segurança é desconhecida." },
  { peps: ["teduglutida"], com: "Medicamentos orais", g: "media", o: "A maior absorção do intestino pode aumentar os níveis de fármacos orais; o médico pode ajustar doses." },
  { peps: ["timosina-alfa-1"], com: "Imunossupressores", g: "media", o: "Efeitos opostos sobre o sistema imune. Em quem fez transplante ou usa imunossupressor, o uso exige avaliação especializada." },
  { peps: ["setmelanotida"], com: "Pele e pintas", g: "baixa", o: "O escurecimento da pele é esperado. Observe qualquer mudança em pintas e consulte o dermatologista." }
];
const CONDICOES = [
  { cond: "Gestação e amamentação", peps: ["semaglutida", "tirzepatida", "liraglutida", "leuprorrelina", "retatrutida", "survodutida", "cagrilintida"], o: "A maioria não é recomendada na gestação por falta de dados ou risco ao feto; a bula orienta suspender com antecedência." },
  { cond: "Câncer medular de tireoide ou NEM2 (pessoal ou familiar)", peps: ["semaglutida", "tirzepatida", "liraglutida", "retatrutida", "survodutida", "mazdutida"], o: "Contraindicação da classe GLP-1: em roedores houve tumores de tireoide; em humanos o risco não está definido." },
  { cond: "Pancreatite ou doença da vesícula", peps: ["semaglutida", "tirzepatida", "liraglutida", "retatrutida", "teduglutida"], o: "Aumenta o risco de pancreatite e de cálculos biliares. Dor intensa na parte alta do abdômen exige avaliação imediata." },
  { cond: "Retinopatia diabética", peps: ["semaglutida", "hormonio-do-crescimento-somatropina", "insulina"], o: "Queda rápida da glicemia pode piorar a retinopatia; o GH exige exame de fundo de olho. Acompanhe com o oftalmologista." },
  { cond: "Câncer ativo ou suspeita", peps: ["hormonio-do-crescimento-somatropina", "tesamorelina", "teduglutida", "teriparatida", "abaloparatida", "igf-1-lr3", "folistatina-344", "mgf-peg-mgf"], o: "Fatores de crescimento podem estimular tumores. Teriparatida e abaloparatida exigem avaliação óssea prévia." },
  { cond: "Insuficiência renal", peps: ["semaglutida", "tirzepatida", "liraglutida", "octreotida", "pegcetacoplana"], o: "Vômitos e diarreia podem levar à desidratação e piorar a função renal. Alguns exigem ajuste." },
  { cond: "Hipertensão ou doença cardíaca", peps: ["bremelanotida-pt-141", "melanotan-ii", "octreotida"], o: "Podem elevar brevemente a pressão ou alterar o ritmo do coração." },
  { cond: "Doença celíaca ou intestinal", peps: ["larazotida", "teduglutida"], o: "Teduglutida exige colonoscopia prévia e vigilância de pólipos. Larazotida não substitui dieta sem glúten." },
  { cond: "Hipoglicemia frequente", peps: ["insulina", "pramlintida", "setmelanotida"], o: "Insulina e pramlintida aumentam o risco; informe ao médico episódios de glicose baixa." }
];
INTERACOES.push(
  { peps: ["testosterona"], com: "Anticoagulantes, antidiabéticos e corticoides", g: "media", o: "A testosterona pode aumentar o efeito da varfarina e reduzir a glicose em quem usa insulina; com corticoides somam retenção de líquidos." },
  { peps: ["estradiol", "progesterona"], com: "Tabagismo e indutores do fígado", g: "alta", o: "Estrogênio por via oral combinado a cigarro aumenta o risco de trombose. Carbamazepina, rifampicina e erva-de-São-João podem reduzir o efeito dos hormônios." },
  { peps: ["levotiroxina-t4", "liotironina-t3"], com: "Cálcio, ferro, antiácidos e café", g: "media", o: "Reduzem a absorção da levotiroxina; tome em jejum e separe de 4 horas desses produtos. A varfarina pode ter o efeito aumentado." },
  { peps: ["levotiroxina-t4", "liotironina-t3", "vitamina-b6-piridoxina", "niacina-vitamina-b3"], com: "Biotina e exames laboratoriais", g: "baixa", o: "Suplementos de biotina interferem em exames de tireoide e outros; avise o laboratório e suspenda conforme orientação." },
  { peps: ["hidrocortisona-cortisol"], com: "Anti-inflamatórios, antidiabéticos e vacinas vivas", g: "media", o: "Com anti-inflamatórios aumenta o risco de úlcera; eleva a glicose e reduz o efeito dos antidiabéticos; vacinas vivas costumam ser evitadas em doses altas." },
  { peps: ["melatonina"], com: "Sedativos, anticoagulantes e fluvoxamina", g: "media", o: "Soma sedação com calmantes; fluvoxamina eleva muito os níveis de melatonina." },
  { peps: ["vitamina-k2-menaquinona"], com: "Varfarina", g: "alta", o: "A vitamina K antagoniza a varfarina: variações de ingestão alteram o INR. Informe ao médico antes de suplementar." },
  { peps: ["vitamina-d3-colecalciferol"], com: "Diuréticos tiazídicos, digoxina e cálcio em excesso", g: "media", o: "Tiazídicos e cálcio em excesso somados à vitamina D aumentam o risco de hipercalcemia, que potencializa a toxicidade da digoxina." },
  { peps: ["vitamina-a-retinol"], com: "Retinoides (isotretinoína, acitretina)", g: "alta", o: "Somar vitamina A com retinoides aumenta o risco de toxicidade. Na gestação, doses altas causam malformações." },
  { peps: ["vitamina-e-tocoferol", "vitamina-c-acido-ascorbico"], com: "Anticoagulantes, antiplaquetários e quimioterapia", g: "media", o: "Vitamina E em doses altas aumenta o risco de sangramento. Antioxidantes em altas doses durante a quimioterapia devem ser discutidos com o oncologista." },
  { peps: ["vitamina-b6-piridoxina"], com: "Levodopa sem carbidopa", g: "baixa", o: "A B6 reduz o efeito da levodopa isolada; com carbidopa, o problema não ocorre." },
  { peps: ["folato-vitamina-b9"], com: "Metotrexato e anticonvulsivantes", g: "media", o: "O folato reduz o efeito do metotrexato em dose alta e pode reduzir níveis de fenitoína; o médico ajusta o plano." },
  { peps: ["vitamina-b12-cobalamina"], com: "Metformina e inibidores de bomba de prótons", g: "baixa", o: "Reduzem a absorção de B12 com o uso prolongado; dosar a vitamina periodicamente." },
  { peps: ["niacina-vitamina-b3"], com: "Estatinas e antidiabéticos", g: "media", o: "Doses altas de niacina com estatinas aumentam o risco de lesão muscular; a niacina eleva a glicose." },
  { peps: ["nad", "nmn-mononucleotideo-de-nicotinamida", "nicotinamida-ribosideo-nr"], com: "Quimioterapia e câncer ativo", g: "media", o: "O NAD+ sustenta o metabolismo de células em crescimento, inclusive tumorais; a segurança de aumentar o NAD+ em câncer ativo não está estabelecida." },
  { peps: ["desmopressina"], com: "Diuréticos, anti-inflamatórios e antidepressivos ISRS", g: "alta", o: "Somam o risco de hiponatremia (sódio baixo), que pode causar confusão e convulsões." },
  { peps: ["glucagon"], com: "Varfarina e betabloqueadores", g: "media", o: "Pode aumentar o efeito da varfarina; em quem usa betabloqueadores, pode elevar mais a pressão e a frequência cardíaca." },
  { peps: ["calcitonina"], com: "Lítio", g: "baixa", o: "A calcitonina pode reduzir os níveis de lítio; é necessário monitorar." },
  { peps: ["metreleptina"], com: "Insulina e antidiabéticos", g: "alta", o: "A melhora da sensibilidade à insulina pode causar hipoglicemia; costuma ser necessário reduzir a dose de insulina." },
  { peps: ["dhea-prasterona", "gonadotrofina-corionica-hcg", "testosterona", "estradiol", "progesterona"], com: "Anticoncepcionais e outros hormônios", g: "media", o: "Somar hormônios sexuais altera o efeito e o risco de cada um. Informe todos os produtos hormonais ao médico." }
);
CONDICOES.push(
  { cond: "Câncer sensível a hormônios (mama, próstata, endométrio)", peps: ["testosterona", "estradiol", "progesterona", "dhea-prasterona", "gonadotrofina-corionica-hcg"], o: "Hormônios sexuais podem estimular esses tumores. A avaliação prévia é obrigatória." },
  { cond: "Trombose, AVC ou enxaqueca com aura", peps: ["estradiol", "progesterona", "testosterona"], o: "Estrogênios aumentam o risco de eventos trombóticos; a testosterona pode elevar a hemoglobina e o risco de coágulos em alguns contextos." },
  { cond: "Doença cardíaca ou arritmia", peps: ["levotiroxina-t4", "liotironina-t3"], o: "O excesso de hormônio da tireoide acelera o coração e pode precipitar arritmia ou angina; a dose é ajustada com cuidado." },
  { cond: "Hiponatremia (sódio baixo) e insuficiência cardíaca", peps: ["desmopressina"], o: "A retenção de água pode derrubar o sódio e piorar a insuficiência cardíaca." },
  { cond: "Cálculos renais ou doença renal", peps: ["vitamina-c-acido-ascorbico", "vitamina-d3-colecalciferol"], o: "Doses altas favorecem cálculos de oxalato e de cálcio; na doença renal, a vitamina D tem regras próprias." },
  { cond: "Sobrecarga de ferro (hemocromatose)", peps: ["vitamina-c-acido-ascorbico"], o: "A vitamina C aumenta a absorção de ferro e pode ser prejudicial." },
  { cond: "Fumantes e ex-fumantes", peps: ["vitamina-a-retinol", "vitamina-e-tocoferol"], o: "Suplementos de beta-caroteno aumentaram o risco de câncer de pulmão em fumantes; a vitamina E em dose alta não se mostrou segura." },
  { cond: "Gestação: doses altas de vitamina A", peps: ["vitamina-a-retinol"], o: "Doses altas de retinol são teratogênicas. O folato, ao contrário, é recomendado antes da gestação, por orientação médica." },
  { cond: "Uso de anticoagulantes", peps: ["vitamina-k2-menaquinona", "vitamina-e-tocoferol", "melatonina"], o: "Alterações de vitamina K afetam o INR; vitamina E e melatonina em dose alta podem aumentar o risco de sangramento." }
);
INTERACOES.push(
  { peps:["n-acetilcisteina-nac"], com:"Nitroglicerina", g:"media", o:"A acetilcisteína pode intensificar cefaleia e hipotensão associadas à nitroglicerina; a relevância depende da apresentação e do contexto clínico." },
  { peps:["acido-alfa-lipoico"], com:"Medicamentos para diabetes", g:"media", o:"O ácido alfa-lipoico pode reduzir a glicose; a combinação pode aumentar o risco de hipoglicemia." },
  { peps:["coenzima-q10"], com:"Varfarina", g:"media", o:"Há relatos de redução do efeito anticoagulante da varfarina com coenzima Q10; INR e tratamento devem ser avaliados profissionalmente." },
  { peps:["omega-3-epa-dha"], com:"Anticoagulantes e antiplaquetários", g:"baixa", o:"Em doses farmacológicas, ômega-3 pode aumentar modestamente o risco de sangramento; efeito depende da formulação e do contexto." },
);
CONDICOES.push(
  { cond:"Doença renal ou avaliação de função renal", peps:["creatina"], o:"Creatina pode elevar a creatinina medida sem que isso, isoladamente, prove lesão renal; exames precisam de interpretação clínica." },
  { cond:"Tratamento com anticoagulante", peps:["coenzima-q10","omega-3-epa-dha"], o:"CoQ10 pode alterar o efeito da varfarina em algumas pessoas; ômega-3 farmacológico pode influenciar sangramento. Avaliação é individual." },
  { cond:"Diabetes em tratamento farmacológico", peps:["acido-alfa-lipoico"], o:"Ácido alfa-lipoico pode somar-se a medicamentos que reduzem a glicose e favorecer hipoglicemia." },
);
INTERACOES.push(
  { peps: ["magnesio", "zinco", "ferro"], com: "Levotiroxina, tetraciclinas e quinolonas", g: "media", o: "Minerais podem reduzir a absorção de levotiroxina e de alguns antibióticos orais quando tomados juntos. A separação de horários deve seguir a bula e orientação profissional." },
  { peps: ["ferro"], com: "Antiácidos e inibidores de acidez", g: "media", o: "A redução da acidez gástrica pode diminuir a absorção de algumas apresentações de ferro oral; resposta depende do produto e do contexto clínico." },
  { peps: ["zinco"], com: "Suplementos de cobre", g: "baixa", o: "Uso prolongado de zinco em excesso pode reduzir a absorção de cobre e causar deficiência; evite combinações sem avaliação." },
  { peps: ["biotina-vitamina-b7"], com: "Exames laboratoriais", g: "alta", o: "Biotina pode interferir em alguns imunoensaios, inclusive troponina e hormônios tireoidianos, produzindo resultados falsos. Informe o laboratório e o profissional de saúde sobre o uso." },
  { peps: ["exenatida", "lixisenatida", "dulaglutida", "maridebart-cafraglutida-maritide", "orforglipron"], com: "Insulina e sulfonilureias", g: "alta", o: "A combinação de agonistas de GLP-1 com medicamentos que reduzem a glicose pode aumentar hipoglicemia; para os agentes experimentais, a interação ainda não está completamente caracterizada." },
  { peps: ["exenatida", "lixisenatida", "dulaglutida"], com: "Medicamentos orais", g: "media", o: "O retardo do esvaziamento gástrico pode alterar a velocidade de absorção de alguns medicamentos orais. O efeito varia por fármaco e é relevante para medicamentos com janela terapêutica estreita." },
  { peps: ["petrelintida", "eloralintida"], com: "Insulina e outros fármacos para diabetes", g: "media", o: "A combinação de agonismo de amilina com insulina pode aumentar hipoglicemia e sintomas digestivos; dados de interação clínica ainda são limitados para esses agentes experimentais." },
  { peps: ["lanreotida", "pasireotida"], com: "Insulina e antidiabéticos", g: "media", o: "Análogos de somatostatina podem alterar secreção de insulina e glucagon e mudar a glicemia; pasireotida pode causar hiperglicemia importante." },
  { peps: ["pasireotida", "degarelix", "triptorrelina", "goserelina"], com: "Medicamentos que prolongam o intervalo QT", g: "media", o: "Alguns desses tratamentos podem prolongar o intervalo QT ou alterar eletrólitos e metabolismo; a associação com outros fármacos de risco requer avaliação clínica." },
  { peps: ["vasopressina", "terlipressina"], com: "Outros vasoconstritores", g: "alta", o: "Efeitos vasoconstritores podem se somar e aumentar risco de isquemia ou complicações cardiovasculares; uso hospitalar requer monitoramento." }
);
CONDICOES.push(
  { cond: "Doença renal crônica", peps: ["magnesio"], o: "A eliminação de magnésio pode ficar reduzida e levar a acúmulo perigoso; uso suplementar deve ser avaliado clinicamente." },
  { cond: "Hemocromatose ou sobrecarga de ferro", peps: ["ferro"], o: "Ferro adicional pode piorar acúmulo e lesão de órgãos; suplementar apenas quando deficiência estiver confirmada e acompanhada." },
  { cond: "Deficiência de cobre ou anemia sem causa esclarecida", peps: ["zinco"], o: "Excesso de zinco pode agravar deficiência de cobre; anemia precisa de investigação antes de suplementação prolongada." },
  { cond: "Diabetes tratado com insulina ou sulfonilureia", peps: ["exenatida", "lixisenatida", "dulaglutida", "maridebart-cafraglutida-maritide", "orforglipron", "petrelintida", "eloralintida"], o: "A associação pode elevar risco de hipoglicemia; para medicamentos experimentais, segurança e condutas não estão estabelecidas." },
  { cond: "Gastroparesia ou doença gastrointestinal grave", peps: ["exenatida", "lixisenatida", "dulaglutida", "maridebart-cafraglutida-maritide", "orforglipron", "petrelintida", "eloralintida"], o: "Medicamentos que retardam o esvaziamento gástrico podem piorar sintomas; os produtos experimentais não têm perfil de segurança completo." },
  { cond: "Diabetes ou hiperglicemia", peps: ["pasireotida"], o: "Pasireotida pode elevar a glicose e precipitar ou agravar diabetes; requer monitoramento e manejo clínico." },
  { cond: "Gestação ou tentativa de engravidar", peps: ["degarelix", "cetrorrelix", "triptorrelina", "goserelina"], o: "A supressão ou manipulação hormonal pode ser incompatível com a gestação; indicações e riscos dependem do protocolo e exigem avaliação especializada." },
  { cond: "Doença respiratória, hipoxemia ou sobrecarga de volume", peps: ["terlipressina"], o: "A terlipressina tem alerta de insuficiência respiratória grave ou fatal, especialmente em pacientes com fatores de risco. A indicação exige avaliação e monitoramento hospitalar." },
  { cond: "Doença cardiovascular ou risco de isquemia", peps: ["vasopressina", "terlipressina"], o: "A vasoconstrição pode reduzir a perfusão de órgãos e extremidades e causar complicações cardiovasculares; uso requer monitoramento." }
);
INTERACOES.push(
  { peps: ["bivalirudina"], com: "Anticoagulantes e antiagregantes plaquetários", g: "alta", o: "A combinação pode aumentar o risco de sangramento e exige decisão e monitoramento pela equipe clínica." },
  { peps: ["ziconotida"], com: "Depressores do sistema nervoso central", g: "media", o: "Sedativos, opioides e outros depressores podem somar efeitos como sonolência, tontura e confusão; o monitoramento deve ser clínico." },
  { peps: ["difelikefalina"], com: "Sedativos, opioides e outros depressores do sistema nervoso central", g: "media", o: "O uso concomitante pode aumentar sonolência, tontura, confusão e risco de quedas." }
);
CONDICOES.push(
  { cond: "Sangramento ativo ou risco elevado de hemorragia", peps: ["bivalirudina"], o: "A anticoagulação pode agravar sangramento; a decisão exige avaliação clínica e monitoramento." },
  { cond: "Histórico de psicose", peps: ["ziconotida"], o: "A ziconotida intratecal é contraindicada em pacientes com histórico de psicose e pode causar efeitos neuropsiquiátricos graves." },
  { cond: "Crianças menores de 2 anos ou obstrução gastrointestinal conhecida ou suspeita", peps: ["linaclotida"], o: "A linaclotida é contraindicada nessas situações por risco de diarreia grave ou por não ser apropriada diante de obstrução." },
  { cond: "Crise de angioedema com língua, garganta ou respiração comprometidas", peps: ["icatibanto"], o: "É uma emergência: o icatibanto não substitui avaliação urgente e proteção da via aérea." },
  { cond: "Prurido por causa diferente de doença renal crônica em hemodiálise", peps: ["difelikefalina"], o: "A evidência e a aprovação da difelikefalina não devem ser extrapoladas para outras causas ou populações." }
);
