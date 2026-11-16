montarLayout();
function matriz(titulo, texto, linhas, colunas, notas) {
  const cab = colunas.map(c => `<th><a href="alvo.html?a=${c}">${esc(ALVOS[c].nome.replace(/ \(.*\)/, ""))}</a></th>`).join("");
  const corpo = linhas.map(s => `<tr><th scope="row">${linkPep(s)}<br>${rotuloFase(s)}</th>${colunas.map(c => `<td>${ALVOS[c].peps.includes(s) ? ((ALVOS[c].prop || []).includes(s) ? "◐" : "●") : ""}</td>`).join("")}<td>${esc((notas || {})[s] || "")}</td></tr>`).join("");
  return `<section class="boas"><h3>${esc(titulo)}</h3><p>${esc(texto)}</p><div class="tab-rolagem"><table class="tab-res matriz"><thead><tr><th>${tr("Substância")}</th>${cab}<th>Observação</th></tr></thead><tbody>${corpo}</tbody></table></div><p><small>● age no alvo · ◐ ação proposta · vazio = não age (no cadastro do guia).</small></p></section>`;
}
document.getElementById("classes-conteudo").innerHTML =
  matriz("Incretinas e hormônios do metabolismo", "Quanto mais alvos, maior a variedade de efeitos (e de efeitos colaterais). Agonista único ativa um receptor; duplo, dois; triplo, três.",
    ["liraglutida", "semaglutida", "tirzepatida", "survodutida", "mazdutida", "retatrutida", "cagrilintida", "pramlintida", "dasiglucagona", "teduglutida", "apraglutida"], ["glp-1", "gip", "glucagon", "amilina", "glp-2"],
    { liraglutida: "Agonista único", semaglutida: "Agonista único", tirzepatida: "Duplo (GIP/GLP-1)", survodutida: "Duplo (glucagon/GLP-1)", mazdutida: "Duplo (glucagon/GLP-1)", retatrutida: "Triplo (em estudo)", cagrilintida: "Análogo de amilina (em estudo)", pramlintida: "Análogo de amilina", dasiglucagona: "Resgate de hipoglicemia", teduglutida: "Intestino curto", apraglutida: "Intestino curto (em estudo)" }) +
  matriz("Eixo do hormônio do crescimento", "Alguns atuam no “acelerador” (GHRH ou grelina), outros no próprio GH e um age como freio (somatostatina).",
    ["tesamorelina", "sermorelina", "ipamorelina-cjc-1295", "ghrp-6", "ghrp-2-pralmorelina", "hexarelina", "hormonio-do-crescimento-somatropina", "octreotida"], ["ghrh", "ghsr", "gh-igf1", "somatostatina"],
    { tesamorelina: "Análogo do GHRH", sermorelina: "Análogo do GHRH", "ipamorelina-cjc-1295": "Combinação (não aprovada)", octreotida: "Freia o GH" }) +
  matriz("Eixo reprodutivo e ósseo", "Pulsos ativam, exposição contínua desliga (GnRH). No osso, o PTH em picos forma osso.",
    ["gonadorelina-gnrh", "leuprorrelina", "kisspeptina-10", "teriparatida", "abaloparatida", "vosoritida"], ["gnrh", "kisspeptina", "pth", "cnp"],
    { leuprorrelina: "Uso contínuo suprime os hormônios sexuais", teriparatida: "Em picos forma osso", vosoritida: "Crianças com acondroplasia" }) +
  matriz("Melanocortina e sistema imune", "Receptores de melanocortina controlam fome, pele e desejo; o complemento é alvo em doenças autoimunes raras.",
    ["setmelanotida", "bremelanotida-pt-141", "melanotan-ii", "kpv", "zilucoplana", "pegcetacoplana", "timosina-alfa-1"], ["melanocortina", "complemento", "imune-timo"], {}) +
  matriz("Hormônios sexuais, adrenais, tireoide e outros", "Hormônios clássicos (não são peptídeos, exceto hCG, glucagon, calcitonina, desmopressina e metreleptina) agem em receptores nucleares ou de membrana.",
    ["testosterona", "estradiol", "progesterona", "dhea-prasterona", "hidrocortisona-cortisol", "levotiroxina-t4", "liotironina-t3", "melatonina", "gonadotrofina-corionica-hcg", "calcitonina", "desmopressina", "metreleptina"],
    ["androgenio", "estrogenio", "progesterona-receptor", "glicocorticoide", "tireoide", "melatonina-receptor", "lh-hcg", "calcitonina-receptor", "vasopressina", "leptina"],
    { "dhea-prasterona": "Precursor; vira androgênio e estrogênio", "hidrocortisona-cortisol": "Mesmo hormônio do cortisol natural", "levotiroxina-t4": "Pró-hormônio, convertido em T3", desmopressina: "Análogo da vasopressina" }) +
  matriz("Vitaminas, NAD e precursores", "Vitaminas agem como cofatores de enzimas ou como hormônios (D, A). NAD+ e precursores (NMN, NR, niacina) alimentam a mesma coenzima.",
    ["vitamina-d3-colecalciferol", "vitamina-k2-menaquinona", "vitamina-a-retinol", "vitamina-b12-cobalamina", "vitamina-b6-piridoxina", "folato-vitamina-b9", "niacina-vitamina-b3", "vitamina-c-acido-ascorbico", "vitamina-e-tocoferol", "nad", "nmn-mononucleotideo-de-nicotinamida", "nicotinamida-ribosideo-nr"],
    ["vitamina-d", "vitamina-k", "retinoides", "vitaminas-b", "antioxidante", "nad"],
    { "vitamina-d3-colecalciferol": "Funciona como pró-hormônio", nad: "Sem produto aprovado como medicamento" }) +
  matriz("Suplementos, metabólitos e miméticos de exercício", "Compostos que sustentam o metabolismo celular. Poucos são medicamentos aprovados; a maioria tem evidência mista ou só pré-clínica (◐ = ação proposta).",
    ["l-carnitina", "acetil-l-carnitina", "creatina", "acido-alfa-lipoico", "coenzima-q10", "n-acetilcisteina-nac", "omega-3-epa-dha", "taurina", "glicina", "citicolina", "resveratrol", "urolitina-a", "espermidina", "slu-pp-332", "5-amino-1mq"],
    ["carnitina", "creatina-energia", "antioxidante", "omega3", "gaba-glicina", "colina", "ampk-err", "autofagia", "mitocondria"],
    { "slu-pp-332": "Só em animais", "5-amino-1mq": "Só em animais", "l-carnitina": "Aprovada só para deficiência" });
