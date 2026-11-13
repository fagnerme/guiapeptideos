# Traduções EN/ES do conteúdo restante (linha do tempo, leituras, mudanças, páginas e HTML estático).
D = {}

# ---------- data-timeline.js ----------
# Renderizado como "<a>nome</a>: texto" (linha-do-tempo.js) e "<b>ano</b> — texto" (peptideo.js).
TL = {
    "Descoberta por Banting, Best e Collip na Universidade de Toronto": ("Discovered by Banting, Best and Collip at the University of Toronto", "Descubierta por Banting, Best y Collip en la Universidad de Toronto"),
    "Primeiro paciente humano tratado": ("First human patient treated", "Primer paciente humano tratado"),
    "Prêmio Nobel de Fisiologia ou Medicina (Banting e Macleod)": ("Nobel Prize in Physiology or Medicine (Banting and Macleod)", "Premio Nobel de Fisiología o Medicina (Banting y Macleod)"),
    "Primeira insulina humana recombinante aprovada (Humulin, FDA)": ("First recombinant human insulin approved (Humulin, FDA)", "Primera insulina humana recombinante aprobada (Humulin, FDA)"),
    "Henry Dale descreve o efeito sobre o útero": ("Henry Dale describes its effect on the uterus", "Henry Dale describe el efecto sobre el útero"),
    "Vincent du Vigneaud realiza a primeira síntese de um hormônio peptídico (Nobel em 1955)": ("Vincent du Vigneaud achieves the first synthesis of a peptide hormone (Nobel in 1955)", "Vincent du Vigneaud realiza la primera síntesis de una hormona peptídica (Nobel en 1955)"),
    "Descrita por Frederick Hopkins": ("Described by Frederick Hopkins", "Descrita por Frederick Hopkins"),
    "Primeiro uso terapêutico do GH extraído de hipófises humanas": ("First therapeutic use of GH extracted from human pituitary glands", "Primer uso terapéutico de la GH extraída de hipófisis humanas"),
    "Primeiro GH recombinante aprovado (Protropin, FDA)": ("First recombinant GH approved (Protropin, FDA)", "Primera GH recombinante aprobada (Protropin, FDA)"),
    "Aprovada pela FDA (Lupron)": ("Approved by the FDA (Lupron)", "Aprobada por la FDA (Lupron)"),
    "Aprovada pela FDA (Sandostatin)": ("Approved by the FDA (Sandostatin)", "Aprobada por la FDA (Sandostatin)"),
    "Aceita como conservante de alimentos (comitê FAO/OMS)": ("Accepted as a food preservative (FAO/WHO committee)", "Aceptada como conservante de alimentos (comité FAO/OMS)"),
    "Aprovada pela FDA para osteoporose (Forteo)": ("Approved by the FDA for osteoporosis (Forteo)", "Aprobada por la FDA para la osteoporosis (Forteo)"),
    "Aprovada pela FDA (Symlin)": ("Approved by the FDA (Symlin)", "Aprobada por la FDA (Symlin)"),
    "Aprovada pela FDA para diabetes tipo 2 (Victoza)": ("Approved by the FDA for type 2 diabetes (Victoza)", "Aprobada por la FDA para la diabetes tipo 2 (Victoza)"),
    "Aprovada pela FDA para obesidade (Saxenda)": ("Approved by the FDA for obesity (Saxenda)", "Aprobada por la FDA para la obesidad (Saxenda)"),
    "Aprovada pela FDA (Egrifta)": ("Approved by the FDA (Egrifta)", "Aprobada por la FDA (Egrifta)"),
    "Aprovada pela FDA para síndrome do intestino curto (Gattex)": ("Approved by the FDA for short bowel syndrome (Gattex)", "Aprobada por la FDA para el síndrome del intestino corto (Gattex)"),
    "Primeira aprovação pela FDA (Ozempic, diabetes tipo 2)": ("First FDA approval (Ozempic, type 2 diabetes)", "Primera aprobación de la FDA (Ozempic, diabetes tipo 2)"),
    "Primeira versão oral aprovada (Rybelsus)": ("First oral version approved (Rybelsus)", "Primera versión oral aprobada (Rybelsus)"),
    "Aprovada pela FDA para obesidade (Wegovy)": ("Approved by the FDA for obesity (Wegovy)", "Aprobada por la FDA para la obesidad (Wegovy)"),
    "Resultados do estudo SELECT (desfechos cardiovasculares)": ("Results of the SELECT trial (cardiovascular outcomes)", "Resultados del estudio SELECT (desenlaces cardiovasculares)"),
    "Aprovada pela FDA para osteoporose (Tymlos)": ("Approved by the FDA for osteoporosis (Tymlos)", "Aprobada por la FDA para la osteoporosis (Tymlos)"),
    "Aprovada pela FDA (Vyleesi)": ("Approved by the FDA (Vyleesi)", "Aprobada por la FDA (Vyleesi)"),
    "Aprovada pela FDA para obesidade genética rara (Imcivree)": ("Approved by the FDA for rare genetic obesity (Imcivree)", "Aprobada por la FDA para la obesidad genética rara (Imcivree)"),
    "Aprovada pela FDA para hipoglicemia grave (Zegalogue)": ("Approved by the FDA for severe hypoglycemia (Zegalogue)", "Aprobada por la FDA para la hipoglucemia grave (Zegalogue)"),
    "Aprovada pela FDA para HPN (Empaveli)": ("Approved by the FDA for PNH (Empaveli)", "Aprobada por la FDA para la HPN (Empaveli)"),
    "Aprovada pela FDA para acondroplasia (Voxzogo)": ("Approved by the FDA for achondroplasia (Voxzogo)", "Aprobada por la FDA para la acondroplasia (Voxzogo)"),
    "Aprovada pela FDA para diabetes tipo 2 (Mounjaro)": ("Approved by the FDA for type 2 diabetes (Mounjaro)", "Aprobada por la FDA para la diabetes tipo 2 (Mounjaro)"),
    "Aprovada pela FDA para obesidade (Zepbound)": ("Approved by the FDA for obesity (Zepbound)", "Aprobada por la FDA para la obesidad (Zepbound)"),
    "Aprovada pela FDA para miastenia gravis (Zilbrysq)": ("Approved by the FDA for myasthenia gravis (Zilbrysq)", "Aprobada por la FDA para la miastenia gravis (Zilbrysq)"),
    "Resultados de fase 2 em obesidade publicados no NEJM": ("Phase 2 obesity results published in NEJM", "Resultados de fase 2 en obesidad publicados en el NEJM"),
    "Descoberta como peptídeo derivado do DNA mitocondrial": ("Discovered as a peptide derived from mitochondrial DNA", "Descubierta como péptido derivado del ADN mitocondrial"),
    "Descrito como peptídeo derivado do DNA mitocondrial (Cell Metabolism)": ("Described as a peptide derived from mitochondrial DNA (Cell Metabolism)", "Descrito como péptido derivado del ADN mitocondrial (Cell Metabolism)"),
    "Publicado na Cell: elimina células senescentes em camundongos": ("Published in Cell: clears senescent cells in mice", "Publicado en Cell: elimina células senescentes en ratones"),
    "Papel da kisspeptina na puberdade humana descrito (mutações em KISS1R)": ("Role of kisspeptin in human puberty described (KISS1R mutations)", "Descrito el papel de la kisspeptina en la pubertad humana (mutaciones en KISS1R)"),
}
for _k, (_a, _b) in TL.items():
    D[_k] = (_a, _b)
    D[": " + _k] = (": " + _a, ": " + _b)
    D["— " + _k] = ("— " + _a, "— " + _b)

# ---------- data-mudancas.js / mudancas.js ----------
# Renderizado sozinho (sem ficha) ou como "<a>nome</a>: texto" (com ficha).
MUD = {
    "Elamipretida (SS-31) passou de “Fase 3” para “Aprovado” após confirmação no Drugs@FDA (aprovação acelerada em 2025, síndrome de Barth).": (
        "Elamipretide (SS-31) moved from “Phase 3” to “Approved” after confirmation in Drugs@FDA (accelerated approval in 2025, Barth syndrome).",
        "Elamipretida (SS-31) pasó de “Fase 3” a “Aprobado” tras la confirmación en Drugs@FDA (aprobación acelerada en 2025, síndrome de Barth)."),
    "Retatrutida: corrigido o texto de ação, que passa a dizer que aumenta (e não reduz) o gasto de energia.": (
        "Retatrutide: corrected the action text, which now says it increases (rather than reduces) energy expenditure.",
        "Retatrutida: corregido el texto de acción, que ahora dice que aumenta (y no reduce) el gasto de energía."),
    "Aprovações oficiais da FDA e da EMA passaram a ser detectadas automaticamente e promovem a fase para “Aprovado”.": (
        "Official FDA and EMA approvals are now detected automatically and promote the phase to “Approved”.",
        "Las aprobaciones oficiales de la FDA y la EMA ahora se detectan automáticamente y elevan la fase a “Aprobado”."),
    "Novos recursos: busca global, mapa de mecanismos, verificador de alegações, página de segurança, estatísticas, alertas de recalls e este registro de mudanças.": (
        "New features: global search, mechanism map, claim checker, safety page, statistics, recall alerts and this change log.",
        "Nuevas funciones: búsqueda global, mapa de mecanismos, verificador de afirmaciones, página de seguridad, estadísticas, alertas de retiradas y este registro de cambios."),
}
for _k, (_a, _b) in MUD.items():
    D[_k] = (_a, _b)
    D[": " + _k] = (": " + _a, ": " + _b)

D.update({
    "✅ Aprovação": ("✅ Approval", "✅ Aprobación"),
    "⚠️ Segurança": ("⚠️ Safety", "⚠️ Seguridad"),
    "🧪 Estudos": ("🧪 Studies", "🧪 Estudios"),
    "✏️ Conteúdo": ("✏️ Content", "✏️ Contenido"),
    "🆕 Recurso": ("🆕 Feature", "🆕 Función"),
    "Todos": ("All", "Todos"),
    "automático": ("automatic", "automático"),
    "Mostrando só:": ("Showing only:", "Mostrando solo:"),
    "ver todas": ("see all", "ver todas"),
    "Nenhuma mudança neste filtro.": ("No changes for this filter.", "Ningún cambio con este filtro."),

    # ---------- data-leituras.js / leituras.js ----------
    "Katzung — Farmacologia Básica e Clínica": ("Katzung — Basic and Clinical Pharmacology", "Katzung — Farmacología Básica y Clínica"),
    "Referência clássica em farmacologia, com capítulos sobre hormônios e peptídeos.": (
        "A classic pharmacology reference, with chapters on hormones and peptides.",
        "Referencia clásica en farmacología, con capítulos sobre hormonas y péptidos."),
    "Rang & Dale — Farmacologia": ("Rang & Dale — Pharmacology", "Rang & Dale — Farmacología"),
    "Texto didático sobre mecanismos de ação de medicamentos.": ("A teaching text on how medicines work (mechanisms of action).", "Texto didáctico sobre los mecanismos de acción de los medicamentos."),
    "Goodman & Gilman — As Bases Farmacológicas da Terapêutica": ("Goodman & Gilman — The Pharmacological Basis of Therapeutics", "Goodman & Gilman — Las Bases Farmacológicas de la Terapéutica"),
    "Obra de referência para consulta aprofundada.": ("A reference work for in-depth consultation.", "Obra de referencia para consulta en profundidad."),
    "Como avaliar criticamente artigos científicos.": ("How to critically appraise scientific papers.", "Cómo evaluar críticamente artículos científicos."),
    "Como estudos e alegações de saúde podem enganar.": ("How health studies and claims can mislead.", "Cómo los estudios y las afirmaciones de salud pueden engañar."),
    "Pesquisa clínica e leitura de estudos (Coursera)": ("Clinical research and reading studies (Coursera)", "Investigación clínica y lectura de estudios (Coursera)"),
    "Plataforma Coursera": ("Coursera platform", "Plataforma Coursera"),
    "Cursos online sobre desenho de ensaios clínicos e medicina baseada em evidências.": (
        "Online courses on clinical trial design and evidence-based medicine.",
        "Cursos en línea sobre diseño de ensayos clínicos y medicina basada en la evidencia."),
    "alguns links podem ser de afiliado. Se você comprar por eles, o guia pode receber uma pequena comissão, sem custo extra para você. Isso não influencia o conteúdo das fichas. Veja a": (
        "some links may be affiliate links. If you buy through them, the guide may receive a small commission at no extra cost to you. This does not influence the content of the entries. See the",
        "algunos enlaces pueden ser de afiliado. Si compra a través de ellos, la guía puede recibir una pequeña comisión, sin costo adicional para usted. Esto no influye en el contenido de las fichas. Vea la"),
    "política de privacidade": ("privacy policy", "política de privacidad"),

    # ---------- consulta.js ----------
    "Quais medicamentos, suplementos e condições de saúde eu devo informar? (levar a lista completa)": (
        "Which medicines, supplements and health conditions should I report? (bring the full list)",
        "¿Qué medicamentos, suplementos y condiciones de salud debo informar? (llevar la lista completa)"),
    "Tenho alergias, estou grávida, amamentando ou planejando engravidar?": (
        "Do I have allergies, am I pregnant, breastfeeding or planning to become pregnant?",
        "¿Tengo alergias, estoy embarazada, amamantando o planeando quedar embarazada?"),
    "Há exames que eu deveria fazer antes e durante o acompanhamento?": (
        "Are there tests I should take before and during follow-up?",
        "¿Hay exámenes que debería hacerme antes y durante el seguimiento?"),
    "O que fazer e quem procurar se eu tiver uma reação adversa?": (
        "What should I do and whom should I contact if I have an adverse reaction?",
        "¿Qué hacer y a quién acudir si tengo una reacción adversa?"),
    "Existem alternativas com aprovação e evidência mais sólida para o meu objetivo?": (
        "Are there approved alternatives with stronger evidence for my goal?",
        "¿Existen alternativas aprobadas y con evidencia más sólida para mi objetivo?"),
    "Pratico esporte com testes antidoping? Isso é proibido pela lista da WADA?": (
        "Do I play a sport with anti-doping tests? Is this banned by the WADA list?",
        "¿Practico un deporte con controles antidopaje? ¿Está prohibido por la lista de la WADA?"),
    "Como saber se um produto à venda é legal e de qualidade, já que não tem registro como medicamento?": (
        "How can I tell whether a product on sale is legal and of good quality, given it is not registered as a medicine?",
        "¿Cómo saber si un producto a la venta es legal y de calidad, ya que no tiene registro como medicamento?"),
    "Anotações": ("Notes", "Notas"),
    "Você ainda não tem favoritos. Favorite peptídeos no": ("You don't have any favorites yet. Favorite peptides in the", "Aún no tiene favoritos. Marque péptidos como favoritos en el"),
    "catálogo": ("catalog", "catálogo"),
    "para gerar perguntas específicas.": ("to generate specific questions.", "para generar preguntas específicas."),
    "Este material é educativo e não substitui orientação profissional. Não contém doses.": (
        "This material is educational and does not replace professional advice. It contains no doses.",
        "Este material es educativo y no sustituye la orientación profesional. No contiene dosis."),

    # ---------- alertas.js ----------
    "Dados de alertas indisponíveis no momento.": ("Alert data unavailable at the moment.", "Datos de alertas no disponibles en este momento."),
    "Nenhum recall encontrado.": ("No recalls found.", "No se encontraron retiradas."),

    # ---------- favoritos.js ----------
    "Você ainda não tem favoritos. Use o botão ☆ nos cards do": ("You don't have any favorites yet. Use the ☆ button on the cards in the", "Aún no tiene favoritos. Use el botón ☆ en las tarjetas del"),

    # ---------- novidades.js ----------
    "Não foi possível consultar o PubMed agora (offline ou limite de requisições). Tente novamente em instantes.": (
        "Could not query PubMed right now (offline or request limit reached). Try again shortly.",
        "No fue posible consultar PubMed ahora (sin conexión o límite de solicitudes). Inténtelo de nuevo en unos instantes."),

    # ---------- termo.js ----------
    "Termo não encontrado": ("Term not found", "Término no encontrado"),
    "Ver o glossário completo": ("See the full glossary", "Ver el glosario completo"),
    "Lições relacionadas": ("Related lessons", "Lecciones relacionadas"),
    "Alegações relacionadas": ("Related claims", "Afirmaciones relacionadas"),
    "Outros termos": ("Other terms", "Otros términos"),

    # ---------- buscar.js ----------

    # ---------- privacidade.html ----------
    "Privacidade e Aviso Médico — Guia Educativo de Peptídeos, Hormônios e Suplementos": (
        "Privacy and Medical Disclaimer — Educational Guide to Peptides, Hormones and Supplements",
        "Privacidad y Aviso Médico — Guía Educativa de Péptidos, Hormonas y Suplementos"),
    "Aviso médico": ("Medical disclaimer", "Aviso médico"),
    "Este site tem finalidade exclusivamente educativa e informativa. Não substitui consulta, diagnóstico ou tratamento médico. Não vendemos nem recomendamos o uso de nenhuma substância e não fornecemos doses de autoadministração. Procure sempre um profissional de saúde habilitado.": (
        "This site is for educational and informational purposes only. It does not replace medical consultation, diagnosis or treatment. We do not sell or recommend the use of any substance and do not provide self-administration doses. Always seek a qualified health professional.",
        "Este sitio tiene una finalidad exclusivamente educativa e informativa. No sustituye la consulta, el diagnóstico ni el tratamiento médico. No vendemos ni recomendamos el uso de ninguna sustancia y no proporcionamos dosis de autoadministración. Busque siempre a un profesional de la salud habilitado."),
    "Dados e cookies": ("Data and cookies", "Datos y cookies"),
    "O site não exige cadastro. Armazenamos no seu navegador (localStorage) apenas preferências (tema, cache de consultas e sua escolha de cookies).": (
        "The site requires no sign-up. We store only preferences in your browser (localStorage): theme, query cache and your cookie choice.",
        "El sitio no exige registro. Solo guardamos preferencias en su navegador (localStorage): tema, caché de consultas y su elección de cookies."),
    "Quando habilitada, a publicidade é exibida pelo Google AdSense, que pode usar cookies para personalizar anúncios. Eles só são carregados se você aceitar. Saiba mais em": (
        "When enabled, advertising is served by Google AdSense, which may use cookies to personalize ads. They are only loaded if you accept. Learn more at",
        "Cuando está habilitada, la publicidad la muestra Google AdSense, que puede usar cookies para personalizar anuncios. Solo se cargan si usted acepta. Más información en"),
    ". Você pode limpar sua escolha apagando os dados do site no navegador.": (
        ". You can clear your choice by deleting the site data in your browser.",
        ". Puede borrar su elección eliminando los datos del sitio en el navegador."),
    'Os dados "ao vivo" vêm de APIs públicas (ClinicalTrials.gov, PubMed e openFDA), consultadas diretamente pelo seu navegador.': (
        'The "live" data come from public APIs (ClinicalTrials.gov, PubMed and openFDA), queried directly by your browser.',
        'Los datos "en vivo" provienen de API públicas (ClinicalTrials.gov, PubMed y openFDA), consultadas directamente por su navegador.'),
    "Links de afiliado": ("Affiliate links", "Enlaces de afiliado"),
    "A página": ("The", "La página"),
    "pode conter links de afiliado (por exemplo, Amazon). Se você comprar por eles, o site pode receber uma comissão, sem custo extra para você. Isso não altera o conteúdo educativo das fichas.": (
        "page may contain affiliate links (for example, Amazon). If you buy through them, the site may receive a commission at no extra cost to you. This does not change the educational content of the entries.",
        "puede contener enlaces de afiliado (por ejemplo, Amazon). Si compra a través de ellos, el sitio puede recibir una comisión, sin costo adicional para usted. Esto no altera el contenido educativo de las fichas."),
    "Se você assinar a newsletter, seu e-mail é enviado ao serviço de envio contratado (informado no formulário) apenas para este fim. Você pode cancelar a qualquer momento pelo link presente em cada e-mail.": (
        "If you subscribe to the newsletter, your e-mail is sent to the contracted mailing service (named in the form) for this purpose only. You can unsubscribe at any time via the link in each e-mail.",
        "Si se suscribe al boletín, su correo se envía al servicio de envío contratado (indicado en el formulario) solo para este fin. Puede cancelar en cualquier momento mediante el enlace presente en cada correo."),
    "Direitos do titular (LGPD)": ("Data subject rights (LGPD)", "Derechos del titular (LGPD)"),
    "Como não coletamos dados pessoais em servidor próprio, não há dados a corrigir ou excluir conosco. Para dúvidas, entre em contato pelo e-mail informado no site.": (
        "Since we do not collect personal data on our own server, there is no data to correct or delete with us. For questions, contact us at the e-mail shown on the site.",
        "Como no recopilamos datos personales en un servidor propio, no hay datos que corregir o eliminar con nosotros. Para dudas, contáctenos por el correo indicado en el sitio."),

    # ---------- seguranca.html ----------
    "Brasil:": ("Brazil:", "Brasil:"),
    "registra medicamentos e produtos. Para checar se um produto tem registro, use a": (
        "registers medicines and products. To check whether a product is registered, use the",
        "registra medicamentos y productos. Para comprobar si un producto tiene registro, use la"),
    "consulta de produtos da Anvisa": ("Anvisa product lookup", "consulta de productos de Anvisa"),
    "EUA:": ("USA:", "EE. UU.:"),
    ". Veja o banco": (". See the", ". Vea la base de datos"),
    "Esporte:": ("Sport:", "Deporte:"),
    "publica a lista de substâncias proibidas. Vários peptídeos estão nela.": (
        "publishes the list of prohibited substances. Several peptides are on it.",
        "publica la lista de sustancias prohibidas. Varios péptidos están en ella."),
    "Produtos vendidos como “apenas para pesquisa” não passam pelo controle exigido de um medicamento. O conteúdo, a pureza e a dose podem diferir do rótulo, e pode haver contaminação. A venda para consumo humano pode ser irregular.": (
        "Products sold as “for research only” do not undergo the controls required of a medicine. Content, purity and dose may differ from the label, and there may be contamination. Selling them for human consumption may be illegal.",
        "Los productos vendidos como “solo para investigación” no pasan por el control exigido a un medicamento. El contenido, la pureza y la dosis pueden diferir de la etiqueta, y puede haber contaminación. La venta para consumo humano puede ser irregular."),
    "Farmácias de manipulação só podem preparar substâncias permitidas, sob prescrição e dentro das regras locais. Agências já restringiram ou alertaram sobre alguns peptídeos manipulados; a situação muda com frequência. Veja a página da FDA sobre": (
        "Compounding pharmacies may only prepare permitted substances, with a prescription and within local rules. Agencies have already restricted or issued warnings about some compounded peptides; the situation changes often. See the FDA page on",
        "Las farmacias de formulación solo pueden preparar sustancias permitidas, con receta y dentro de las normas locales. Las agencias ya restringieron o alertaron sobre algunos péptidos formulados; la situación cambia con frecuencia. Vea la página de la FDA sobre"),
    "manipulação de medicamentos": ("drug compounding", "formulación de medicamentos"),
    "Procure os estudos em fontes primárias (": ("Look for the studies in primary sources (", "Busque los estudios en fuentes primarias ("),
    "Como identificar produtos duvidosos, entender o que é regulado pela Anvisa e FDA e quais cuidados tomar antes de qualquer decisão.": (
        "How to spot dubious products, understand what is regulated by Anvisa and the FDA, and what precautions to take before any decision.",
        "Cómo identificar productos dudosos, entender qué regulan Anvisa y la FDA y qué precauciones tomar antes de cualquier decisión."),

    # ---------- sobre.html ----------
    "Sobre e metodologia — Guia Educativo de Peptídeos, Hormônios e Suplementos": ("About and methodology — Educational Guide to Peptides, Hormones and Supplements", "Acerca de y metodología — Guía Educativa de Péptidos, Hormonas y Suplementos"),
    "Como o conteúdo é produzido, critérios dos selos de confiança, fontes e política de correções.": (
        "How the content is produced, criteria for the confidence badges, sources and corrections policy.",
        "Cómo se produce el contenido, criterios de los sellos de confianza, fuentes y política de correcciones."),
    "Objetivo": ("Purpose", "Objetivo"),
    "O Guia Educativo de Peptídeos, Hormônios e Suplementos reúne, em linguagem acessível, informações sobre peptídeos, hormônios, vitaminas e NAD+ aprovados, em estudo clínico e em pesquisa básica. O objetivo é ajudar as pessoas a entender o que a ciência sabe, e o que não sabe, sobre cada um.": (
        "The Educational Guide to Peptides, Hormones and Supplements brings together, in plain language, information on peptides, hormones, vitamins and NAD+ that are approved, in clinical study or in basic research. The goal is to help people understand what science knows, and does not know, about each one.",
        "La Guía Educativa de Péptidos, Hormonas y Suplementos reúne, en lenguaje accesible, información sobre péptidos, hormonas, vitaminas y NAD+ aprobados, en estudio clínico y en investigación básica. El objetivo es ayudar a las personas a entender lo que la ciencia sabe, y lo que no sabe, sobre cada uno."),
    "O que este site não faz": ("What this site does not do", "Lo que este sitio no hace"),
    "Não recomenda, vende nem divulga o uso de nenhuma substância.": ("It does not recommend, sell or promote the use of any substance.", "No recomienda, vende ni promueve el uso de ninguna sustancia."),
    "Não fornece doses ou protocolos de autoadministração.": ("It does not provide doses or self-administration protocols.", "No proporciona dosis ni protocolos de autoadministración."),
    "Não substitui consulta médica.": ("It does not replace a medical consultation.", "No sustituye la consulta médica."),
    "Como o conteúdo é produzido": ("How the content is produced", "Cómo se produce el contenido"),
    'Cada peptídeo tem: o que faz, mecanismo, benefícios observados nos estudos, nível de evidência, riscos, status regulatório e fontes. Informações vêm de bulas, artigos científicos e bases como PubMed, ClinicalTrials.gov, FDA, EMA e ANVISA. Os dados "ao vivo" (número de ensaios e artigos) são consultados automaticamente nessas bases; o restante é redigido e revisado manualmente.': (
        'Each peptide has: what it does, mechanism, benefits observed in studies, level of evidence, risks, regulatory status and sources. Information comes from package inserts, scientific papers and databases such as PubMed, ClinicalTrials.gov, FDA, EMA and ANVISA. The "live" data (number of trials and articles) are queried automatically from these databases; the rest is written and reviewed manually.',
        'Cada péptido tiene: qué hace, mecanismo, beneficios observados en los estudios, nivel de evidencia, riesgos, estado regulatorio y fuentes. La información proviene de prospectos, artículos científicos y bases como PubMed, ClinicalTrials.gov, FDA, EMA y ANVISA. Los datos "en vivo" (número de ensayos y artículos) se consultan automáticamente en esas bases; el resto se redacta y revisa manualmente.'),
    "Selos de confiança": ("Confidence badges", "Sellos de confianza"),
    "O selo combina a": ("The badge combines the", "El sello combina la"),
    "fase de desenvolvimento": ("development phase", "fase de desarrollo"),
    "com o": ("with the", "con el"),
    "nível de evidência": ("level of evidence", "nivel de evidencia"),
    "descrito. Ele resume o estado do conhecimento; não indica que o uso seja seguro ou adequado para uma pessoa específica.": (
        "described. It summarizes the state of knowledge; it does not indicate that use is safe or appropriate for a specific person.",
        "descrito. Resume el estado del conocimiento; no indica que el uso sea seguro o adecuado para una persona específica."),
    "Limitações": ("Limitations", "Limitaciones"),
    "Fases de pesquisa e aprovações mudam com frequência. Contagens automáticas vêm de buscas por texto e podem incluir estudos que apenas citam a substância. Sempre confirme nas fontes primárias.": (
        "Research phases and approvals change frequently. Automatic counts come from text searches and may include studies that merely mention the substance. Always confirm in primary sources.",
        "Las fases de investigación y las aprobaciones cambian con frecuencia. Los conteos automáticos provienen de búsquedas de texto y pueden incluir estudios que solo mencionan la sustancia. Confirme siempre en las fuentes primarias."),
    "Origem das informações": ("Source of the information", "Origen de la información"),
    "Este guia não tem equipe editorial nem revisão por profissionais de saúde. Os status de aprovação seguem órgãos reguladores (FDA e EMA) e são atualizados automaticamente. O conteúdo é introdutório: confirme sempre nas fontes primárias.": (
        "This guide has no editorial team and no review by health professionals. Approval statuses follow regulatory agencies (FDA and EMA) and are updated automatically. The content is introductory: always confirm in primary sources.",
        "Esta guía no tiene equipo editorial ni revisión por profesionales de la salud. Los estados de aprobación siguen a los organismos reguladores (FDA y EMA) y se actualizan automáticamente. El contenido es introductorio: confirme siempre en las fuentes primarias."),
    "Financiamento": ("Funding", "Financiación"),
    'O site pode exibir publicidade (Google AdSense) para cobrir custos. Anúncios são identificados como "Publicidade" e não influenciam o conteúdo.': (
        'The site may display advertising (Google AdSense) to cover costs. Ads are labeled as "Advertising" and do not influence the content.',
        'El sitio puede mostrar publicidad (Google AdSense) para cubrir costos. Los anuncios se identifican como "Publicidad" y no influyen en el contenido.'),
})

REGEX = [
    # consulta.js
    ('^Para qual problema de saúde (.+) poderia ser indicado no meu caso\\?$', "For which health problem could $1 be indicated in my case?", "¿Para qué problema de salud podría estar indicado $1 en mi caso?"),
    ('^(.+) é aprovado para essa indicação ou seria uso fora da bula \\(off-label\\)\\?$', "Is $1 approved for this indication, or would it be off-label use?", "¿$1 está aprobado para esta indicación o sería un uso fuera de prospecto (off-label)?"),
    ('^(.+) não tem aprovação confirmada \\(fase: (.+)\\)\\. Existe algum ensaio clínico sério do qual eu possa participar\\?$', "$1 has no confirmed approval (phase: $2). Is there a serious clinical trial I could take part in?", "$1 no tiene aprobación confirmada (fase: $2). ¿Existe algún ensayo clínico serio en el que pueda participar?"),
    ('^Quais riscos se aplicam a mim\\? Pontos citados no catálogo: (.*)$', "Which risks apply to me? Points listed in the catalog: $1", "¿Qué riesgos se aplican a mí? Puntos citados en el catálogo: $1"),
    # alertas.js
    ('^(\\d+) peptídeo\\(s\\) com recalls nos últimos 3 anos\\. Coleta de (.+)\\.$', "$1 peptide(s) with recalls in the last 3 years. Data collected on $2.", "$1 péptido(s) con retiradas en los últimos 3 años. Recopilación del $2."),
    ('^(\\d+) recall\\(s\\)$', "$1 recall(s)", "$1 retirada(s)"),
    # estatisticas.js
    ('^(\\d+) peptídeos em (\\d+) categorias\\.$', "$1 peptides in $2 categories.", "$1 péptidos en $2 categorías."),
    ('^Coleta automática mais recente: (.+)\\. Conteúdo editorial revisado em (.+)\\.$', "Most recent automatic collection: $1. Editorial content reviewed on $2.", "Recopilación automática más reciente: $1. Contenido editorial revisado el $2."),
    ('^Sem coleta automática disponível\\. Conteúdo editorial revisado em (.+)\\.$', "No automatic collection available. Editorial content reviewed on $1.", "Sin recopilación automática disponible. Contenido editorial revisado el $1."),
    ('^(\\d+) de (\\d+)$', "$1 of $2", "$1 de $2"),
    # favoritos.js
    ('^Conteúdo educativo; revisado em (.+)\\. Não substitui orientação médica\\.$', "Educational content; reviewed on $1. Does not replace medical advice.", "Contenido educativo; revisado el $1. No sustituye la orientación médica."),
    # termo.js
    ('^(.+): o que significa \\| Guia Educativo de Peptídeos, Hormônios e Suplementos$', "$1: what it means | Educational Guide to Peptides, Hormones and Supplements", "$1: qué significa | Guía Educativa de Péptidos, Hormonas y Suplementos"),
    ('^Peptídeos que mencionam este termo \\((\\d+)\\)$', "Peptides that mention this term ($1)", "Péptidos que mencionan este término ($1)"),
    ('^e mais (\\d+)$', "and $1 more", "y $1 más"),
    # buscar.js
    ('^(\\d+) resultado\\(s\\) para “(.*)”$', "$1 result(s) for “$2”", "$1 resultado(s) para “$2”"),
    ('^Peptídeos \\((\\d+)\\)$', "Peptides ($1)", "Péptidos ($1)"),
    ('^Glossário \\((\\d+)\\)$', "Glossary ($1)", "Glosario ($1)"),
    ('^Lições \\((\\d+)\\)$', "Lessons ($1)", "Lecciones ($1)"),
    ('^Alegações \\((\\d+)\\)$', "Claims ($1)", "Afirmaciones ($1)"),
    ('^Mecanismos \\((\\d+)\\)$', "Mechanisms ($1)", "Mecanismos ($1)"),
]
