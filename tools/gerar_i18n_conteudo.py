"""Gera i18n-conteudo.js: traduções EN/ES do 'O que faz' dos peptídeos e do glossário.
As chaves são os textos originais em português, lidos de data-extra.js e data.js."""
import json, re, pathlib

raiz = pathlib.Path(__file__).resolve().parent.parent
extra = (raiz / "data-extra.js").read_text(encoding="utf-8-sig")
dados = (raiz / "data.js").read_text(encoding="utf-8-sig")
faz = [m.group(2) for m in re.finditer(r'^\s*"([^"]+)": \["([^"]+)"', extra, re.M)]
gloss = [(m.group(1), m.group(2)) for m in re.finditer(r'\{ termo: "([^"]+)", def: "([^"]+)"', dados)]

FAZ_EN = """Reduces appetite, increases fullness and improves glucose control.
Controls glucose and reduces appetite through dual GIP/GLP-1 action.
Causes uterine contractions and milk ejection.
In animals, appears to speed healing of tendons, muscle and stomach lining.
In animal models, promotes cell migration and tissue repair.
Replaces GH: stimulates growth and influences fat and muscle metabolism.
Stimulate the release of the body's own GH from the pituitary.
Reduces appetite and glucose by activating GLP-1.
Makes cells take up glucose, lowering blood sugar.
Stimulates the formation of new bone.
In cells, stimulates collagen and skin repair.
Increases pigmentation (tanning) and acts on sexual desire via melanocortin.
Stimulates GH and reduces visceral abdominal fat.
Broadly reduces appetite and increases energy expenditure (GIP, GLP-1 and glucagon).
Increases fullness by mimicking amylin.
Reduces appetite and increases energy expenditure; acts on the liver.
Reduces appetite and weight; also reduces liver fat.
Slows gastric emptying and reduces glucose spikes after meals.
Restores the satiety signal in genetic obesity.
Hypothesis: stimulate fat breakdown without the effects of GH.
Mimics FGF21 to improve liver metabolism.
Rapidly raises blood glucose.
Stimulates the release of GH.
Stimulates GH and hunger (via the ghrelin receptor).
Stimulates the release of GH.
Stimulates GH and possibly cardiac function.
Activates IGF-1 receptors, promoting cell growth.
Hypothesis: activate satellite cells for muscle repair.
Blocks myostatin and favors muscle growth.
Activates the reproductive axis (GnRH → LH/FSH).
Stimulates the release of LH and FSH.
Reduces sex hormone production with continuous use.
Reduces the secretion of GH, insulin and gut hormones.
Stimulates bone formation.
Stimulates longitudinal bone growth.
Modulates the immune system, activating T cells.
Fights bacteria and modulates inflammation.
Reduces inflammation in colitis models.
Activates a repair receptor and reduces neuropathic pain.
Reduces intestinal permeability.
Stimulates growth of the intestinal lining.
Stimulates growth of the intestinal lining.
Blocks complement C5.
Blocks complement C3.
Dilates vessels and reduces inflammation via the Mas receptor.
Stabilizes mitochondria.
Regulates energy metabolism via AMPK.
Protects cells against stress and death.
Eliminates senescent cells.
Hypothesis: activate telomerase and regulate the circadian cycle.
Acts on the nervous system, possibly on BDNF and attention.
Has anxiolytic and immunomodulatory effects.
Stimulates synapses in animal models.
Stabilizes neuronal microtubules.
In animals, protects neurons against oxidative stress.
Increases sexual desire by acting on the brain.
Acts as a very potent opioid.
Reduces superficial muscle contraction, softening expression lines.
Stimulates fibroblasts to produce collagen matrix.
Disrupts cell membranes.
Kills Gram-positive bacteria.
Take part in the immune defense against microbes.
Neutralizes free radicals and aids detoxification.
Acts as an antioxidant and buffers muscle acidity.""".split("\n")

FAZ_ES = """Reduce el apetito, aumenta la saciedad y mejora el control de la glucosa.
Controla la glucosa y reduce el apetito mediante la acción dual GIP/GLP-1.
Provoca contracciones uterinas y la eyección de la leche materna.
En animales, parece acelerar la cicatrización de tendones, músculo y mucosa gástrica.
En modelos animales, favorece la migración celular y la reparación de tejidos.
Repone la GH: estimula el crecimiento e influye en el metabolismo de grasa y músculo.
Estimulan la liberación de la propia GH desde la hipófisis.
Reduce el apetito y la glucosa al activar el GLP-1.
Hace que las células capten glucosa, reduciendo la glucemia.
Estimula la formación de hueso nuevo.
En células, estimula el colágeno y la reparación de la piel.
Aumenta la pigmentación (bronceado) y actúa sobre el deseo sexual mediante melanocortina.
Estimula la GH y reduce la grasa abdominal visceral.
Reduce ampliamente el apetito y aumenta el gasto de energía (GIP, GLP-1 y glucagón).
Aumenta la saciedad imitando la amilina.
Reduce el apetito y aumenta el gasto energético; actúa en el hígado.
Reduce el apetito y el peso; también reduce la grasa hepática.
Retrasa el vaciamiento del estómago y reduce los picos de glucosa tras las comidas.
Restablece la señal de saciedad en la obesidad genética.
Hipótesis: estimular la degradación de grasa sin los efectos de la GH.
Imita el FGF21 para mejorar el metabolismo hepático.
Eleva rápidamente la glucosa en sangre.
Estimula la liberación de GH.
Estimula la GH y el hambre (mediante el receptor de grelina).
Estimula la liberación de GH.
Estimula la GH y posiblemente la función cardíaca.
Activa los receptores de IGF-1, promoviendo el crecimiento celular.
Hipótesis: activar células satélite para la reparación muscular.
Bloquea la miostatina y favorece el crecimiento muscular.
Activa el eje reproductivo (GnRH → LH/FSH).
Estimula la liberación de LH y FSH.
Reduce la producción de hormonas sexuales con el uso continuo.
Reduce la secreción de GH, insulina y hormonas intestinales.
Estimula la formación de hueso.
Estimula el crecimiento óseo longitudinal.
Modula el sistema inmune, activando células T.
Combate bacterias y modula la inflamación.
Reduce la inflamación en modelos de colitis.
Activa un receptor de reparación y reduce el dolor neuropático.
Reduce la permeabilidad intestinal.
Estimula el crecimiento de la mucosa intestinal.
Estimula el crecimiento de la mucosa intestinal.
Bloquea el complemento C5.
Bloquea el complemento C3.
Dilata los vasos y reduce la inflamación mediante el receptor Mas.
Estabiliza las mitocondrias.
Regula el metabolismo energético mediante AMPK.
Protege las células contra el estrés y la muerte.
Elimina células senescentes.
Hipótesis: activar la telomerasa y regular el ciclo circadiano.
Actúa en el sistema nervioso, posiblemente sobre BDNF y la atención.
Tiene efecto ansiolítico e inmunomodulador.
Estimula las sinapsis en modelos animales.
Estabiliza los microtúbulos neuronales.
En animales, protege las neuronas contra el estrés oxidativo.
Aumenta el deseo sexual al actuar en el cerebro.
Actúa como un opioide muy potente.
Reduce la contracción muscular superficial, suavizando las arrugas de expresión.
Estimula los fibroblastos para producir matriz de colágeno.
Rompe las membranas celulares.
Mata bacterias Gram positivas.
Participan en la defensa inmune contra microbios.
Neutraliza radicales libres y ayuda en la desintoxicación.
Actúa como antioxidante y amortiguador de la acidez muscular.""".split("\n")

GL_EN = """Short chain of amino acids (usually up to ~50). Longer chains are usually called proteins.
A substance that activates a receptor and produces a biological response.
Gut hormone (incretin) that increases insulin, reduces appetite and slows gastric emptying.
Studies done in cells or animals, before testing in humans.
Stages of clinical trials: safety (1), preliminary efficacy (2) and large-scale confirmation (3).
Randomized controlled trial: the gold standard for assessing a treatment's efficacy.
Gradual dose adjustment to improve tolerance, done by a health professional.
World Anti-Doping Agency; maintains the list of substances banned in sport.
Brazilian Health Regulatory Agency; regulates medicines in Brazil.
Insulin-like growth factor, produced under GH stimulation; used as a monitoring marker.
Use of an approved drug for an indication different from the one on its label.
Experiments in isolated cells or tissues in the lab. Results often do not carry over to the body.
Experiments in living organisms (animals or humans).
Time for the concentration of a substance in the blood to fall by half; defines how often it is used.
Fraction of the substance that reaches the circulation in active form. Peptides are often broken down in the stomach, so many are injected.
Ability to provoke an immune response and generate antibodies against the peptide.
Product quality. Products without pharmaceutical control may contain contaminants, impurities or a dose different from the label.
Peptide with its chain closed into a ring, usually more stable against enzymes.
Attachment of polyethylene glycol to the peptide to prolong its duration in the body.
Substance that stimulates release of growth hormone (e.g., GHRH, ghrelin agonists).
Family of receptors and peptides (α-MSH, ACTH) involved in pigmentation, appetite and sexual function.
Compound that selectively eliminates senescent cells. Still experimental.
Data from cells and animals. Useful for forming hypotheses, but does not prove efficacy or safety in humans.
Main measure of success defined before a clinical trial.
Improvement perceived through expectation, without action from the active ingredient; that is why trials use controls.
Use of substances banned in sport; many secretagogues and growth factors are on the WADA list.""".split("\n")

GL_ES = """Cadena corta de aminoácidos (generalmente hasta ~50). Las cadenas más largas suelen llamarse proteínas.
Sustancia que activa un receptor y produce una respuesta biológica.
Hormona intestinal (incretina) que aumenta la insulina, reduce el apetito y retrasa el vaciamiento del estómago.
Estudios realizados en células o animales, antes de las pruebas en humanos.
Etapas de los ensayos clínicos: seguridad (1), eficacia preliminar (2) y confirmación a gran escala (3).
Ensayo clínico aleatorizado: el estándar de oro para evaluar la eficacia de un tratamiento.
Ajuste gradual de la dosis para mejorar la tolerancia, realizado por un profesional de la salud.
Agencia Mundial Antidopaje; mantiene la lista de sustancias prohibidas en el deporte.
Agencia Nacional de Vigilancia Sanitaria de Brasil; regula los medicamentos en Brasil.
Factor de crecimiento similar a la insulina, producido bajo estímulo de la GH; usado como marcador de seguimiento.
Uso de un medicamento aprobado para una indicación distinta de la registrada en el prospecto.
Experimentos en células o tejidos aislados, en laboratorio. Los resultados a menudo no se repiten en el organismo.
Experimentos en organismos vivos (animales o humanos).
Tiempo que tarda la concentración de una sustancia en la sangre en reducirse a la mitad; define la frecuencia de uso.
Fracción de la sustancia que llega a la circulación en forma activa. Los péptidos suelen degradarse en el estómago, por eso muchos son inyectables.
Capacidad de provocar una respuesta inmune y generar anticuerpos contra el péptido.
Calidad del producto. Los productos sin control farmacéutico pueden contener contaminantes, impurezas o una dosis distinta de la del rótulo.
Péptido con la cadena cerrada en anillo, generalmente más estable frente a las enzimas.
Unión de polietilenglicol al péptido para prolongar su duración en el organismo.
Sustancia que estimula la liberación de la hormona del crecimiento (p. ej., GHRH, agonistas de grelina).
Familia de receptores y péptidos (α-MSH, ACTH) implicados en pigmentación, apetito y función sexual.
Compuesto que elimina selectivamente las células senescentes. Todavía experimental.
Datos de células y animales. Útiles para formular hipótesis, pero no prueban eficacia ni seguridad en humanos.
Principal medida de éxito definida antes de un ensayo clínico.
Mejora percibida por expectativa, sin acción del principio activo; por eso los ensayos usan control.
Uso de sustancias prohibidas en el deporte; muchos secretagogos y factores de crecimiento figuran en la lista de la WADA.""".split("\n")

TERMOS = {
    "Peptídeo": ("Peptide", "Péptido"), "Pré-clínico": ("Preclinical", "Preclínico"),
    "Titulação": ("Titration", "Titulación"), "Meia-vida": ("Half-life", "Vida media"),
    "Biodisponibilidade": ("Bioavailability", "Biodisponibilidad"), "Imunogenicidade": ("Immunogenicity", "Inmunogenicidad"),
    "Pureza / endotoxinas": ("Purity / endotoxins", "Pureza / endotoxinas"),
    "Peptídeo cíclico / macrocíclico": ("Cyclic / macrocyclic peptide", "Péptido cíclico / macrocíclico"),
    "Pegilação": ("PEGylation", "Pegilación"), "Secretagogo de GH": ("GH secretagogue", "Secretagogo de GH"),
    "Melanocortina": ("Melanocortin", "Melanocortina"), "Senolítico": ("Senolytic", "Senolítico"),
    "Evidência pré-clínica": ("Preclinical evidence", "Evidencia preclínica"),
    "Desfecho primário": ("Primary endpoint", "Criterio de valoración principal"),
    "Efeito placebo": ("Placebo effect", "Efecto placebo"), "Fase 1/2/3": ("Phase 1/2/3", "Fase 1/2/3"),
    "ECR": ("RCT", "ECA"), "Agonista": ("Agonist", "Agonista"),
}

assert len(faz) >= 64 and len(FAZ_EN) == len(FAZ_ES) == 64, (len(faz), len(FAZ_EN), len(FAZ_ES))  # itens novos ficam so em PT
assert len(gloss) >= len(GL_EN) == len(GL_ES) == 26, (len(gloss), len(GL_EN), len(GL_ES))

en, es = {}, {}
for pt, a, b in zip(faz, FAZ_EN, FAZ_ES):
    en[pt], es[pt] = a, b
for (termo, d), a, b in zip(gloss, GL_EN, GL_ES):
    en[d], es[d] = a, b
for pt, (a, b) in TERMOS.items():
    en[pt], es[pt] = a, b

# Textos das páginas novas (interface): PT -> (EN, ES)
UI = {
 "Mecanismos": ("Mechanisms", "Mecanismos"), "Alegações": ("Claims", "Afirmaciones"),
 "Segurança e legalidade": ("Safety and legality", "Seguridad y legalidad"), "Estatísticas": ("Statistics", "Estadísticas"),
 "Buscar em todo o guia...": ("Search the whole guide...", "Buscar en toda la guía..."),
 "Buscar em todo o guia": ("Search the whole guide", "Buscar en toda la guía"), "Buscar": ("Search", "Buscar"),
 "Principal": ("Main", "Principal"), "Pular para o conteúdo": ("Skip to content", "Saltar al contenido"),
 "Nível de confiança": ("Confidence level", "Nivel de confianza"),
 "Todos os níveis de confiança": ("All confidence levels", "Todos los niveles de confianza"),
 "Ordem A–Z": ("A–Z order", "Orden A–Z"), "Ordenar por fase": ("Sort by phase", "Ordenar por fase"),
 "Ordenar por confiança": ("Sort by confidence", "Ordenar por confianza"), "Ordenar": ("Sort", "Ordenar"),
 "Explique fácil": ("Explain simply", "Explícalo fácil"), "Em palavras simples": ("In plain words", "En palabras simples"),
 "Em palavras simples:": ("In plain words:", "En palabras simples:"), "Estudos recentes": ("Recent studies", "Estudios recientes"),
 "Novidades nos seus favoritos": ("News on your favorites", "Novedades en tus favoritos"),
 "Buscar em todo o guia": ("Search the whole guide", "Buscar en toda la guía"),
 "Digite pelo menos 2 letras para buscar.": ("Type at least 2 letters to search.", "Escribe al menos 2 letras para buscar."),
 "Nenhum resultado. Tente outro termo (ex.: o nome do peptídeo ou da condição).": ("No results. Try another term (e.g., the peptide or condition name).", "Sin resultados. Prueba otro término (p. ej., el nombre del péptido o de la condición)."),
 "Peptídeos": ("Peptides", "Péptidos"), "Lições": ("Lessons", "Lecciones"),
 "Mapa de mecanismos": ("Mechanism map", "Mapa de mecanismos"),
 "Escolha um grupo para ver como ele age e quais peptídeos do catálogo pertencem a ele. É uma visão didática e simplificada.": ("Choose a group to see how it acts and which catalog peptides belong to it. This is a simplified, didactic view.", "Elige un grupo para ver cómo actúa y qué péptidos del catálogo pertenecen a él. Es una visión didáctica y simplificada."),
 "Alvo principal:": ("Main target:", "Objetivo principal:"),
 "Verificador de alegações": ("Claim checker", "Verificador de afirmaciones"),
 "Afirmações que circulam em anúncios e redes sociais, avaliadas de forma educativa e simplificada.": ("Claims circulating in ads and social media, assessed in an educational, simplified way.", "Afirmaciones que circulan en anuncios y redes sociales, evaluadas de forma educativa y simplificada."),
 "Todas": ("All", "Todas"), "Falso": ("False", "Falso"), "Enganoso": ("Misleading", "Engañoso"),
 "Sem comprovação em humanos": ("Not proven in humans", "Sin comprobación en humanos"),
 "Parcialmente verdadeiro": ("Partly true", "Parcialmente verdadero"),
 "Estatísticas e transparência": ("Statistics and transparency", "Estadísticas y transparencia"),
 "Por fase de desenvolvimento": ("By development phase", "Por fase de desarrollo"),
 "Por nível de confiança (selos)": ("By confidence level (badges)", "Por nivel de confianza (sellos)"),
 "Por categoria": ("By category", "Por categoría"),
 "Última verificação dos dados ao vivo": ("Last check of live data", "Última verificación de los datos en vivo"),
 "Peptídeo": ("Peptide", "Péptido"), "Fase": ("Phase", "Fase"), "Verificado em": ("Checked on", "Verificado el"),
 "Ensaios": ("Trials", "Ensayos"), "Artigos (12 meses)": ("Articles (12 months)", "Artículos (12 meses)"),
 "Segurança e legalidade": ("Safety and legality", "Seguridad y legalidad"),
 "Resumo educativo e geral. As regras mudam e variam por país: confirme sempre nas páginas oficiais linkadas aqui.": ("General educational summary. Rules change and vary by country: always confirm on the official pages linked here.", "Resumen educativo y general. Las reglas cambian y varían según el país: confirma siempre en las páginas oficiales enlazadas aquí."),
 "1. Quem regula": ("1. Who regulates", "1. Quién regula"),
 "2. “Uso em pesquisa” não é medicamento": ("2. “Research use” is not a medicine", "2. «Uso en investigación» no es un medicamento"),
 "3. Manipulação em farmácia": ("3. Pharmacy compounding", "3. Preparación en farmacia"),
 "4. Sinais de alerta de golpe": ("4. Scam warning signs", "4. Señales de alerta de estafa"),
 "5. Antes de qualquer decisão": ("5. Before any decision", "5. Antes de cualquier decisión"),
 "Promessa de “cura”, “rejuvenescimento” ou resultado garantido.": ("Promise of a “cure”, “rejuvenation” or guaranteed results.", "Promesa de «cura», «rejuvenecimiento» o resultado garantizado."),
 "Venda sem receita, sem bula, sem registro, ou só por rede social/mensagem.": ("Sold without prescription, leaflet or registration, or only via social media/messages.", "Venta sin receta, sin prospecto, sin registro, o solo por redes sociales/mensajes."),
 "Preço muito abaixo do mercado e pagamento apenas por Pix para pessoa física.": ("Price far below market and payment only by instant transfer to an individual.", "Precio muy por debajo del mercado y pago solo por transferencia a una persona física."),
 "Depoimentos de “antes e depois” no lugar de estudos publicados.": ("“Before and after” testimonials instead of published studies.", "Testimonios de «antes y después» en lugar de estudios publicados."),
 "Ausência de nome do fabricante, lote, validade e CNPJ.": ("No manufacturer name, batch, expiry date or company ID.", "Ausencia de nombre del fabricante, lote, vencimiento e identificación de la empresa."),
 "Produto importado sem origem comprovada.": ("Imported product with no proven origin.", "Producto importado sin origen comprobado."),
 "Converse com um médico ou farmacêutico sobre o seu caso.": ("Talk to a doctor or pharmacist about your case.", "Habla con un médico o farmacéutico sobre tu caso."),
 "Verifique o registro do produto e a indicação aprovada.": ("Check the product registration and approved indication.", "Verifica el registro del producto y la indicación aprobada."),
 "Se for atleta, consulte a lista da WADA.": ("If you are an athlete, check the WADA list.", "Si eres deportista, consulta la lista de la WADA."),
 "Em caso de reação adversa, procure atendimento e notifique a vigilância sanitária.": ("In case of an adverse reaction, seek care and notify the health authority.", "En caso de reacción adversa, busca atención y notifica a la autoridad sanitaria."),
 "Este guia não fornece doses nem substitui orientação profissional.": ("This guide does not provide doses or replace professional advice.", "Esta guía no proporciona dosis ni sustituye la orientación profesional."),
 "Estudos recentes indisponíveis agora (limite de requisições ou sem conexão).": ("Recent studies unavailable right now (request limit or no connection).", "Estudios recientes no disponibles ahora (límite de solicitudes o sin conexión)."),
 "Nenhum estudo recente encontrado.": ("No recent studies found.", "No se encontraron estudios recientes."),
 "Fonte: PubMed (títulos em inglês). Ler o título não substitui ler o estudo.": ("Source: PubMed. Reading the title is not the same as reading the study.", "Fuente: PubMed. Leer el título no sustituye leer el estudio."),
 "Comparado com a sua última visita. Confira nas fontes antes de concluir algo.": ("Compared with your last visit. Check the sources before drawing conclusions.", "Comparado con tu última visita. Consulta las fuentes antes de concluir algo."),
 "Veja também: verificador de alegações →": ("See also: claim checker →", "Véase también: verificador de afirmaciones →"),
 "Trilha de aprendizado →": ("Learning path →", "Ruta de aprendizaje →"),
 "Termos:": ("Terms:", "Términos:"),
}
UI.update({
 "Alertas": ("Alerts", "Alertas"), "O que mudou": ("What changed", "Qué cambió"), "Revisão": ("Review", "Revisión"),
 "Glossário (A–Z)": ("Glossary (A–Z)", "Glosario (A–Z)"), "Levar ao médico": ("Take to the doctor", "Llevar al médico"),
 "Quiz por família": ("Quiz by family", "Quiz por familia"), "Leituras": ("Reading list", "Lecturas"),
 "Leituras recomendadas": ("Recommended reading", "Lecturas recomendadas"),
 "Perguntas frequentes": ("Frequently asked questions", "Preguntas frecuentes"),
 "🔗 Compartilhar": ("🔗 Share", "🔗 Compartir"), "✅ Link copiado": ("✅ Link copied", "✅ Enlace copiado"),
 "Perguntas gerais": ("General questions", "Preguntas generales"), "Minhas anotações": ("My notes", "Mis anotaciones"),
 "Nome (opcional):": ("Name (optional):", "Nombre (opcional):"), "Data da consulta:": ("Appointment date:", "Fecha de la consulta:"),
 "🖨️ Salvar em PDF / imprimir": ("🖨️ Save as PDF / print", "🖨️ Guardar en PDF / imprimir"),
 "Começar": ("Start", "Empezar"), "Próxima": ("Next", "Siguiente"), "Ver resultado": ("See result", "Ver resultado"),
 "✅ Correto!": ("✅ Correct!", "✅ ¡Correcto!"), "❌ Não foi dessa vez.": ("❌ Not this time.", "❌ No esta vez."),
 "Outras famílias": ("Other families", "Otras familias"), "Gerar certificado": ("Generate certificate", "Generar certificado"),
 "Seu nome:": ("Your name:", "Tu nombre:"), "Certificado de estudo": ("Study certificate", "Certificado de estudio"),
 "Aprovado! Você pode gerar um certificado de estudo.": ("Passed! You can generate a study certificate.", "¡Aprobado! Puedes generar un certificado de estudio."),
 "Abaixo de 70%. Revise as fichas e tente de novo.": ("Below 70%. Review the profiles and try again.", "Por debajo del 70%. Revisa las fichas e inténtalo de nuevo."),
 "Ver livro ↗": ("See book ↗", "Ver libro ↗"), "Ver curso ↗": ("See course ↗", "Ver curso ↗"),
 "Divulgação:": ("Disclosure:", "Divulgación:"), "Livro": ("Book", "Libro"), "Curso": ("Course", "Curso"),
 "Calculadora de doses": ("Dose calculator", "Calculadora de dosis"), "🧮 Calculadora": ("🧮 Calculator", "🧮 Calculadora"),
 "Calculadora de conversão de doses": ("Dose conversion calculator", "Calculadora de conversión de dosis"),
 "Ver detalhes →": ("See details →", "Ver detalles →"), "Calculadora": ("Calculator", "Calculadora"),
 "⚖️ Comparar": ("⚖️ Compare", "⚖️ Comparar"),
 "⚠️ Alertas de segurança (recalls FDA)": ("⚠️ Safety alerts (FDA recalls)", "⚠️ Alertas de seguridad (retiradas FDA)"),
 "⚖️ Comparar com outro peptídeo": ("⚖️ Compare with another peptide", "⚖️ Comparar con otro péptido"),
 "👩‍⚕️ Levar perguntas ao médico": ("👩‍⚕️ Take questions to the doctor", "👩‍⚕️ Llevar preguntas al médico"),
 "🛡️ Segurança e legalidade": ("🛡️ Safety and legality", "🛡️ Seguridad y legalidad"),
 "🎓 Trilha de aprendizado": ("🎓 Learning path", "🎓 Ruta de aprendizaje"),
 "🧮 Calculadora de conversão de doses": ("🧮 Dose conversion calculator", "🧮 Calculadora de conversión de dosis"),
 "Ver todas": ("See all", "Ver todas"), "Diminuir fonte": ("Decrease font size", "Reducir fuente"), "Aumentar fonte": ("Increase font size", "Aumentar fuente"),
 "Modo leitura": ("Reading mode", "Modo lectura"),
})
for pt, (a, b) in UI.items():
    en[pt], es[pt] = a, b

# Traducoes adicionais (itens novos, interface, alvos): arquivos opcionais em tools/_new e tools/i18n_extra
regex_js = ""
def _ordem(f):
    return (not f.stem.startswith("i18n_pente"), f.name)
for arq in sorted((raiz / "tools" / "i18n_extra").glob("i18n_*.py"), key=_ordem):
    sobrescreve = arq.stem.startswith("i18n_pente")
    ns = {}
    exec(arq.read_text(encoding="utf-8-sig"), ns)
    for pt, (a, b) in ns.get("D", {}).items():
        if sobrescreve:
            en[pt], es[pt] = a, b
        else:
            en.setdefault(pt, a); es.setdefault(pt, b)
    for pad, a, b in ns.get("REGEX", []):
        regex_js += "I18N_REGEX.en.push([/" + pad.replace("/", "\\/") + "/, " + json.dumps(a, ensure_ascii=False) + "]);\n"
        regex_js += "I18N_REGEX.es.push([/" + pad.replace("/", "\\/") + "/, " + json.dumps(b, ensure_ascii=False) + "]);\n"

faltam_gloss = [termo for termo, definicao in gloss if definicao not in en or definicao not in es]
if faltam_gloss:
    raise ValueError(f"Glossário sem tradução EN/ES ({len(faltam_gloss)}): {', '.join(faltam_gloss)}")

js = ("/* Gerado por tools/gerar_i18n_conteudo.py — traduções do 'O que faz' e do glossário */\n"
      "(window.__I18N_Q = window.__I18N_Q || []).push(function () {\nObject.assign(I18N.en, " + json.dumps(en, ensure_ascii=False) + ");\n"
      "Object.assign(I18N.es, " + json.dumps(es, ensure_ascii=False) + ");\n" + regex_js + "});\n")
(raiz / "i18n-conteudo.js").write_text(js, encoding="utf-8")
print("i18n-conteudo.js:", len(en), "chaves EN")

# Detalhes (Entenda a fundo): tools/i18n_extra/det_*.py definem DET = {slug: {en: {...}, es: {...}}}
det = {"en": {}, "es": {}}
for arq in sorted((raiz / "tools" / "i18n_extra").glob("det_*.py")):
    ns = {}
    exec(arq.read_text(encoding="utf-8-sig"), ns)
    for s, v in ns.get("DET", {}).items():
        for l in ("en", "es"):
            if l in v:
                det[l][s] = v[l]
(raiz / "i18n-detalhes.js").write_text("/* Gerado por tools/gerar_i18n_conteudo.py */\nwindow.DETALHES_I18N = " + json.dumps(det, ensure_ascii=False) + ";\n", encoding="utf-8")
print("i18n-detalhes.js:", len(det["en"]), len(det["es"]))
