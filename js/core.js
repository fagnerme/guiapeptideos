/* O site é escrito só em português; outros idiomas vêm do Google Tradutor (iniciarTraducaoAutomatica). */
const LANG = "pt";
const LOCALE = "pt-BR";
const esc = s => { const d = document.createElement("div"); d.textContent = s; return d.innerHTML.replace(/"/g, "&quot;").replace(/'/g, "&#39;"); };
const semAcento = s => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
/* Silhueta humana (viewBox 200x360) compartilhada pelo mapa do corpo e pelas vias de administração. */
const SILHUETA_MEIO = "M100 52H112L113 64C128 68 146 70 154 80C162 90 164 116 165 140L168 172C169 184 157 186 155 176L150 142C149 128 148 112 144 100C143 130 142 160 139 182C137 200 141 214 140 236C140 270 138 300 137 328C137 338 140 346 138 352C132 356 120 356 116 350C115 330 114 290 112 262C111 248 108 238 100 234Z";
const silhuetaBase = () => {
  const metade = `<path d="${SILHUETA_MEIO}"/><path transform="translate(200 0) scale(-1 1)" d="${SILHUETA_MEIO}"/>`;
  return `<g class="corpo-borda">${metade}<ellipse cx="100" cy="30" rx="20" ry="24"/></g><g class="corpo-miolo">${metade}<ellipse cx="100" cy="30" rx="20" ry="24"/></g>`;
};
const slug = nome => semAcento(nome.toLowerCase()).replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
let _mapaSlug, _mapaN = -1;
const porSlug = s => {
  if (_mapaN !== PEPTIDES.length) { _mapaSlug = new Map(); PEPTIDES.forEach(p => { const k = slug(p.nome); if (!_mapaSlug.has(k)) _mapaSlug.set(k, p); }); _mapaN = PEPTIDES.length; }
  return _mapaSlug.get(s);
};
const faseClasse = f => "fase-" + semAcento(f.toLowerCase()).replace(/[^a-z0-9]+/g, "");
/* Ficha estática (indexável): todo item do catálogo e os medicamentos com 5+ nomes comerciais. Os demais abrem em peptideo.html?p=. A mesma regra está em tools/gerar_fichas.py. */
const MIN_MARCAS_FICHA = 5;
const temFichaEstatica = p => !p._med || ((p._med === "farmaco" || p._med === "biologico") && p.fase !== "Descontinuado" && marcasDe(p).length >= MIN_MARCAS_FICHA);
const urlPeptideo = nome => { const s = slug(nome), p = porSlug(s); return p && temFichaEstatica(p) ? "fichas/" + s + ".html" : "peptideo.html?p=" + s; };

/* Medicamentos (dados/medicamentos.js, quando a página o carrega) entram no mesmo catálogo, com busca, filtros e ficha iguais. */
(function integrarMedicamentos() {
  if (typeof MEDICAMENTOS === "undefined" || typeof PEPTIDES === "undefined") return;
  MEDICAMENTOS.itens.forEach(i => {
    if (i.f) return;
    const grupo = i.a ? MEDICAMENTOS.atc1[i.a[0]] : "Medicamento";
    const classe = i.a ? [MEDICAMENTOS.atc1[i.a[0]], MEDICAMENTOS.atc2[i.a.slice(0, 3)]].filter(Boolean).join(" › ") : "classe não informada na base";
    const vias = i.v.length ? ` Vias registradas: ${i.v.join(", ")}.` : "";
    PEPTIDES.push({
      nome: i.n, categoria: grupo || "Medicamento", fase: i.r ? "Descontinuado" : "Aprovado", _med: i.b ? "biologico" : "farmaco", marcas: i.m,
      status: `Aprovado em pelo menos um país segundo o ChEMBL${i.y ? ` (primeira aprovação registrada: ${i.y})` : ""}; o status varia por país, então confira a Anvisa, a FDA ou a EMA.${i.r ? " Retirado do mercado em pelo menos um país." : ""}`,
      mecanismo: `Classe terapêutica (ATC): ${classe}. O mecanismo detalhado não foi organizado nesta ficha; consulte a bula.`,
      evidencia: "Medicamento aprovado. Ficha automática, sem avaliação editorial da qualidade das evidências.",
      riscos: (i.cx ? "O ChEMBL registra alerta de caixa preta (boxed warning) para este medicamento; leia a bula. " : "") + "Os riscos não foram organizados automaticamente; consulte a bula e um profissional de saúde.",
      protocolo: "Esta ficha não traz doses. Use somente com prescrição e siga a bula.",
      fontes: [`ChEMBL ${i.c} (https://www.ebi.ac.uk/chembl/compound_report_card/${i.c}/)`, "Anvisa (dados abertos)", "DailyMed"],
      oQueFaz: `Medicamento (${i.e}) da classe ${classe}.${vias}`,
      beneficios: "Ficha automática, sem texto editorial sobre benefícios; veja a bula oficial."
    });
  });
  /* Associações: marca com 2+ princípios ativos, ligada à ficha de cada ativo. */
  const ativoDe = {};
  PEPTIDES.forEach(p => { ativoDe[slug(p.nome)] = p; });
  (MEDICAMENTOS.combos || []).forEach(([marca, ids, faltam]) => {
    const ativos = ids.map(s => ativoDe[s]).filter(Boolean);
    if (ativos.length < 2 || ativoDe[slug(marca)]) return;
    const nomes = ativos.map(a => a.nome).concat(faltam || []);
    const p = {
      nome: marca, categoria: "Associação medicamentosa", fase: "Aprovado", _med: "associacao", combo: ativos.map(a => slug(a.nome)), outrosAtivos: faltam || [],
      status: "Aprovado em pelo menos um país (Anvisa ou FDA) como associação em dose fixa; a composição varia por país e por apresentação, então confira a bula do produto.",
      mecanismo: `Associação de ${nomes.length} princípios ativos (${nomes.join(" + ")}). Cada ativo age pelo seu próprio mecanismo; veja o quadro da associação nesta ficha.`,
      evidencia: "Medicamento aprovado. Ficha automática, sem avaliação editorial; a evidência da combinação específica não foi avaliada aqui.",
      riscos: `Em uma associação, os riscos, os efeitos colaterais e as contraindicações de cada ativo (${nomes.join(", ")}) valem ao mesmo tempo. Leia a bula e fale com um profissional de saúde.`,
      protocolo: "Esta ficha não traz doses. Use somente com prescrição e siga a bula.",
      fontes: ["Anvisa (dados abertos)", "openFDA (Drugs@FDA)", "DailyMed"],
      oQueFaz: `Associação em dose fixa de ${nomes.join(" + ")}.`,
      beneficios: "Ficha automática, sem texto editorial sobre benefícios; veja a bula oficial."
    };
    PEPTIDES.push(p);
    ativos.forEach(a => { (a._assoc = a._assoc || []).push(p.nome); });
  });
})();
/* Marcos com a data real do fato (aprovação, início de estudo), vindos das fontes oficiais coletadas, não a data da coleta. */
function marcosOficiais(nome) {
  const a = (typeof APROVACOES_AUTO !== "undefined" && APROVACOES_AUTO[slug(nome)]) || {};
  const out = [], marcas = m => (m && m.marcas && m.marcas.length ? ` (${m.marcas.join(", ")})` : "");
  if (a.fda && a.fda.desde) out.push({ data: a.fda.desde, atualizado: a.fdaVerificadoEm, txt: `Aprovação original na FDA${marcas(a.fda)}.`, fonte: "FDA" });
  if (a.ema && a.ema.desde) out.push({ data: a.ema.desde, atualizado: a.emaVerificadoEm, txt: `Autorização de comercialização na EMA${marcas(a.ema)}.`, fonte: "EMA" });
  const ca = ((a.canada && a.canada.registros) || []).filter(r => /approved|marketed/i.test(r.situacao) && r.data).map(r => r.data).sort()[0];
  if (ca) out.push({ data: ca, atualizado: a.canada.verificadoEm, txt: "Primeiro registro aprovado no Health Canada.", fonte: "Health Canada" });
  const foco = (a.estudos && a.estudos.foco) || {};
  [1, 2, 3].forEach(n => { if (foco["inicio" + n]) out.push({ data: foco["inicio" + n], atualizado: a.fdaVerificadoEm || a.emaVerificadoEm, txt: `Início do estudo de fase ${n} mais antigo registrado com o ativo (desde 2015).`, fonte: "ClinicalTrials.gov" }); });
  return out;
}
/* Estudos por fase, cada número com seu rótulo (evita o "1/2/3" ambíguo) */
const chipsFases = d => `<span class="fases">${[1, 2, 3].map(n => `<span class="fase-chip"><b>${num(d["fase" + n])}</b> ${tr("na fase")} ${n}</span>`).join("")}</span>`;
const dataMarco = d => d.split("-").reverse().join("/");
const dataAtualizacao = d => d ? ` · ${tr("atualizado automaticamente em")} ${new Date(d).toLocaleDateString(LOCALE)}` : "";
/* Sinal da fila de revisão: data do fato (quando a fonte informa) e data da detecção automática. */
const datasSinal = x => `${x.fato ? `${tr("data do fato")}: ${dataMarco(x.fato)} · ` : ""}${tr("atualizado automaticamente em")} ${dataMarco(x.data)}`;
/* Data do fato (aprovação) e data da atualização automática (consulta) são mostradas separadas. */
function datasFonte(x) {
  const partes = [x.desde && `${tr("aprovado em")} ${dataMarco(x.desde)}`, x.data && `${tr("atualizado automaticamente em")} ${new Date(x.data).toLocaleDateString(LOCALE)}`].filter(Boolean);
  return partes.length ? ` (${esc(partes.join(" · "))})` : "";
}

function links(nome) {
  const termo = encodeURIComponent(nome.replace(/\s*\(.*\)/, ""));
  return `<a href="https://pubmed.ncbi.nlm.nih.gov/?term=${termo}" target="_blank" rel="noopener">PubMed</a> · ` +
    `<a href="https://clinicaltrials.gov/search?term=${termo}" target="_blank" rel="noopener">ClinicalTrials.gov</a> · ` +
    `<a href="https://go.drugbank.com/unearth/q?searcher=drugs&query=${termo}" target="_blank" rel="noopener">DrugBank</a> · ` +
    `<a href="https://www.uniprot.org/uniprotkb?query=${termo}" target="_blank" rel="noopener">UniProt</a>`;
}

/* Selo de confiança: combina a fase com o nível de evidência descrito */
/* Registros oficiais consultados promovem a fase; ausência de resultado não prova ausência mundial de aprovação. */
const autorizadoEma = a => a?.ema?.situacao === "autorizado";
const autorizadoAnvisa = a => a?.anvisa?.situacao === "autorizado";
const autorizadoCanada = a => a?.canada?.situacao === "autorizado";
function aplicarAprovacoesAutomaticas() {
  if (typeof APROVACOES_AUTO === "undefined") return;
  PEPTIDES.forEach(p => {
    const a = APROVACOES_AUTO[slug(p.nome)];
    if (!a) return;
    const orgaos = [
      a.fda && "FDA",
      autorizadoEma(a) && "EMA",
      autorizadoAnvisa(a) && "Anvisa",
      autorizadoCanada(a) && "Health Canada",
    ].filter(Boolean);
    const consultados = [
      a.fdaVerificadoEm && !a.fda && "FDA",
      a.emaVerificadoEm && a.ema?.situacao !== "autorizado" && "EMA",
      a.anvisa?.verificadoEm && ["sem_registro", "sem_registro_ativo"].includes(a.anvisa.situacao) && "Anvisa",
      a.canada?.verificadoEm && ["sem_registro", "sem_registro_ativo"].includes(a.canada.situacao) && "Health Canada",
    ].filter(Boolean);
    if (orgaos.length) {
      if (p.fase !== "Aprovado") {
        p.fase = "Aprovado";
        p.faseAutomatica = true;
      }
      p.status = `${tr("Autorização localizada em")}: ${orgaos.join(", ")}. ${tr("A autorização depende do produto e da indicação registrados.")}`;
    } else if (consultados.length) {
      const estudos = a.estudos?.ensaios;
      p.status = `${tr("Nenhuma aprovação ativa localizada nas consultas concluídas")} (${consultados.join(", ")}). ${tr("Ausência de resultados não prova ausência de aprovação em outros países, indicações ou bases.")}`;
      if (Number.isFinite(estudos) && estudos > 0) p.status += ` ClinicalTrials.gov: ${estudos} ${tr("estudos registrados")} ${tr("com correspondência textual pelo nome")}.`;
    }
    /* Fase de estudo: só sobe, nunca desce; só para peptídeos e hormônios; exige estudos em que o ativo é a intervenção. */
    if (p.fase !== "Aprovado" && !["vitamina", "mineral", "suplemento"].includes(chaveTipo(p))) {
      const alvo = faseDosEstudos(a.estudos?.foco);
      const i = ORDEM_FASES.indexOf(p.fase);
      if (alvo && i >= 0 && ORDEM_FASES.indexOf(alvo) > i) {
        p.faseCatalogo = p.fase;
        p.fase = alvo;
        p.faseAutomatica = "estudos";
      }
    }
  });
}
const ORDEM_FASES = ["In vitro", "Pré-clínico (animais)", "Fase 1", "Fase 2", "Fase 3"];
function faseDosEstudos(foco) {
  if (!foco) return null;
  if (foco.fase3 >= 2) return "Fase 3";
  if (foco.fase2 >= 1) return "Fase 2";
  if (foco.fase1 >= 1) return "Fase 1";
  return null;
}
/* Os resultados de estudos são apresentados como sinais de pesquisa; busca por nome não altera sozinha a fase editorial. */
/* Notas automáticas ficam em português; a tradução para outros idiomas é feita pelo Google Tradutor. */
/* Reescreve os textos automáticos em frases diretas, com cada fase rotulada (nunca "1/2/3"). */
const ROTULO_ESTADO = { sem_registro: "sem registro", autorizado: "autorizado", consulta_parcial: "consulta parcial", sem_registro_ativo: "sem registro ativo", retirado: "retirado" };
const notaAuto = texto => {
  let t = String(texto).replace(/\s*Reveja [^.]*\.?$/, "").trim();
  const ct = /estudos \d+ → (\d+); fase 1\/2\/3 \d+\/\d+\/\d+ → (\d+)\/(\d+)\/(\d+); recrutando \d+ → (\d+)(?:; registro mais recente ([\d-]+))?/.exec(t);
  if (ct) return `ClinicalTrials.gov: ${ct[1]} estudos registrados (${ct[2]} na fase 1, ${ct[3]} na fase 2, ${ct[4]} na fase 3), ${ct[5]} recrutando agora${ct[6] ? `; registro mais recente em ${dataMarco(ct[6])}` : ""}.`;
  t = t.replace(/(\d+) ensaio\(s\) de fase (\d) encontrados, catálogo marca '([^']+)'/, "$1 estudo(s) de fase $2 encontrados, mas a ficha marca '$3'");
  t = t.replace(/\b(sem_registro_ativo|sem_registro|autorizado|consulta_parcial)\b/g, m => ROTULO_ESTADO[m]);
  t = t.replace(/\((\d{4})-(\d{2})-(\d{2}) → (\d{4})-(\d{2})-(\d{2})\)/, "($3/$2/$1 → $6/$5/$4)");
  return t;
};
/* Os avisos automáticos aparecem só em "Novidades nas fontes"; não são mais colados nos textos de riscos, evidência e status. */

/* Busca: sem acento, todas as palavras, nomes comerciais e tolerância a erro de digitação. */
/*marcas-auto:inicio*/
const MARCAS_AUTO = {"abaloparatida":["Eladynos","Tymlos"],"abarelix":["Plenaxis"],"abatacept":["Orencia"],"acarbose":["Aglucose","Glucobay","Precose"],"acido-azelaico":["Azelan","Aczeo","Zella","Azelex","Finacea","Skinoren"],"adrenalina-epinefrina":["Adren Co","Adrenaclick","Ana-Guard","Ana-Kit","Anapen","Anaphylactic Shock Drug Kit","Asma-Vydrin","Asthmahaler","Auvi-Q","Bronkaid Mist","Brovon","Emerade","Epi E Z Pen Jr","Epipen","Eppy","Gppe Inh Soln","Jext","Neffy","Primatene","Riddobron","Riddofan","Rybarvin","Simplene","Soln Made To Rybarvin For","Sus-Phrine","Symjepi","Twinject 0.15","Twinject 0.3"],"afamelanotida":["Scenesse"],"aflibercept":["Eylea","Yesafili","Zaltrap"],"albiglutida":["Eperzan"],"aldesleukin":["Proleukin"],"alefacept":["Amevive"],"anakinra":["Antril","Kineret"],"anastrozol":["Arimidex","Anya","Arazabi","Arothazy","Cermaz","Hanaz","Nastrosa"],"angiotensin-ii":["Giapreza"],"atosiban":["Tractocile"],"bacitracin":["Albac 50","Baci-Rx","Baciferm 50","Baciguent","Baciim"],"becaplermin":["Regranex"],"belatacept":["Nujolix","Nulojix"],"biotina-vitamina-b7":["Bhio","Kerabio","Untral","Bioepiderm","Biotin 100","Biotin Component Of Vitaped","Vitamin H"],"bivalirudina":["Angiomax","Angiox"],"botulinum-toxin-type-a":["Nuceiva"],"bremelanotida-pt-141":["Vyleesi (Autoinjector)"],"bromocriptina":["Cycloset","Parlodel"],"bulevirtide":["Hepcludex"],"cabergolina":["Dostinex","Caberedux","Cabertrix","Cabaser","Velactis"],"cafeina":["Peyona","Caffeine Component Of Anoquan","Caffeine Component Of Cafergot","Caffeine Component Of Dhc Plus","Caffeine Component Of Esgic","Caffeine Component Of Excedrin","Caffeine Component Of Femcet","Caffeine Component Of Fioricet","Caffeine Component Of Fiorinal","Caffeine Component Of Invagesic","Caffeine Component Of Lanorinal","Caffeine Component Of Migergot","Caffeine Component Of Norgesic","Caffeine Component Of Trezix","Caffeine Component Of Triad","Caffeine Component Of Wigraine","Nodoz","Pro-Plus","Yeast-Vite","Zanthine"],"calcitonina":["Calcitare","Calsynar","Miacalcic"],"calcitriol-1-25-di-hidroxivitamina-d":["Ostriol","Sigmatriol","Calcijex","Dihydroxyvitamin D 3","Rocaltrol","Silkis","Vectical"],"capreomycin":["Capastat"],"carbetocina":["Duratocin","Tocynae","Pabal"],"catridecacog":["Novothirteen"],"cenegermin":["Oxervate"],"cetrorrelix":["Cetrotide"],"clomifeno":["Clomid","Indux"],"colistina":["Cantrex","Coly-Mycin S","Kannasyn","Kantrim"],"cortisona":["Cortate","Cortelan","Cortistab","Cortisyl","Cortone"],"cosyntropin":["Cortrosyn","Synacthen"],"cyclosporine":["Restasis","Sandimmun","Sigmasporin Microral","Capimune","Capsorin","Cequa","Deximune","Gengraf","Ikervis","Neoral","Optimmune","Sandimmune","Sangcya","Vanquoral","Verkazia","Vevye"],"daptomicina":["Dopcym","Exfuno","Gapobak","Reldaptos","Trisk","Cubicin","Daptomycin Hospira","Dapzura Rt"],"dasiglucagona":["Zegalogue"],"defibrotide":["Defitelio"],"denileukin-diftitox":["Ontak"],"desirudin":["Iprivask","Revasc"],"desmopressina":["Ddavp","Dosyx","Eponim","Furp-Desmopressina","Concentraid","Desmomelt","Desmospray","Desmotabs","Minirin","Nocdurna","Noctiva","Nocutil","Noqdirna","Octim","Octostim","Presinex","Stimate"],"dexametasona":["Maxidex","Ozurdex","Bexeton","Cetadex","Cortitop","Decadron","Dexaden","Dexadermil","Furp-Dexametasona","Lqfex - Dexametasona","Aeroseb-Dex","Decaderm","Decadron-75","Decaspray","Dexa-Sine","Dexacortal","Dexacortin","Dexacortisyl","Dexafree","Dexamethasone Intensol","Dexamonozon","Dexapos","Dexasite","Dexasone","Dexone","Dexsol","Dextenza","Dexycu Kit","Dropodex","Fortecortin"],"difelikefalina":["Kapruvia","Korsuva"],"diosmina":["Flebodia","Roydass","Diovenor"],"dopamina":["Dopabane","Dopacris","Inotropisa","Teudom","Dopamin-Natterman","Dopmin","Dynatra","Intropin","Neoatricon","Sabax Dopamin","Selectajet"],"drospirenona":["Ammy","Slinda","Drospirenone Component Of Beyaz","Drospirenone Component Of Yaz","Slynd"],"dulaglutida":["Trulicity"],"dutasterida":["Avodart","Dastene","Droalfa","Dutasteride Component Of Jalyn"],"eflapegrastim":["Rolvedon"],"enfuvirtida":["Fuzeon"],"epoetin-delta":["Dynepo"],"epoetin-theta":["Biopoin","Eporatio"],"epoetin-zeta":["Retacrit","Silapo"],"eptifibatide":["Eptifibatide Accord","Integrilin"],"espironolactona":["Aldactone","Diacqua","Abbolactone","Carospir","Diatensec","Gx Spironol","Laractone","Qaialdo","Spiretic","Spiroctan 100","Spiroctan 25","Spiroctan 50","Spironolactone Ceva","Spirospare 100","Spirospare 25"],"estanozolol":["Stromba","Tevabolin","Winstrol"],"estradiol":["Sandrena","Adgyn Estro","Alora","Aquagen","Bedol","Climara","Dermestril 100","Dermestril 25","Dermestril 50","Dermestril Septem 25","Dermestril Septem 50","Dermestril Septem 75","Divigel","E-Cypionate","Elestrim","Elestrin","Elleste Solo","Esclim","Estrace","Estraderm","Estradiol Component Of Angeliq","Estradiol Component Of Bijuva","Estradiol Component Of Oriahnn","Estradiol Component Of Prefest","Estrasorb","Estring","Estrogel","Evamist","Evorel 100","Evorel 25"],"estriol-e3":["Stele","Gynest","Incurin","Ortho-Gynest","Ovestin"],"estrona-e1":["Estrogenic Substance","Theelin"],"etanercept":["Benepali","Enbrel","Erelzi","Lifmior","Nepexto"],"etinilestradiol":["Estinyl","Etinestryl","Feminone","Follicoral","Lynoral"],"exenatida":["Bydureon","Byetta"],"filgrastim":["Fil","Fiprima","Granulokine","Zarzio","Accofil","Biograstim","Filgrastim Hexal","Filgrastim Ratiopharm","Gran 300","Gran Injection 150","Granix","Grastofil","Neupogen","Nivestim","Nivestym","Nypozi","Ratiograstim","Releuko","Tevagrastim","Zarxio"],"finasterida":["Excalv","Fendical","Finalop","Finarid","Prohair","Aindeem","Propecia","Proscar","Prostide"],"fludrocortisona":["Florinefe","Astonin","Florinef","Fludrocortone","Panotile"],"follitropin-delta":["Rekovelle"],"ganirrelix":["Orgalutran","Fertessa"],"glicina":["Baxter Glicina","Glycolixir"],"glucagon":["Baqsimi","Gvoke Hypopen","Gvoke Kit","Ogluo"],"glucosamina":["Alateris","Ardern","Bio-Health","Br Pharm","Cozachew Fizz","Cozachew Meltdown 1500","Cozachew Meltdown Combi","Flexi-Melt","Fosachew","Fosaveg","Glucosamine Hcl Meltdown","Gosachew","Gosaveg","Joint-Flex Daily","Pro Coxam"],"gonadorelina-gnrh":["Gnrh","Gonadotropin Releasing Hormone","Lh Releasing Factor","Lutrelef","Lutrepulse Kit"],"goserelina":["Zoladex"],"gozetotide":["Illuccix","Locametz"],"hidrocortisona-cortisol":["Acecorthyl","Androcortil","Ariscorten","Cortigen","Gliocort","Acetasol Hc","Acticort","Aeroseb-Hc","Ala-Cort","Ala-Scalp","Alkindi","Alphaderm","Anflam","Anucort-Hc","Anugesic Hc","Anusol Hc","Anusol Plus Hc","Anusol Soothing Relief","Anusol-Hc","Balneol-Hc","Beta-Hc","Calmurid Hc","Canesten Hc","Cetacort","Cipro Hc","Cobadex","Colocort","Corlan","Cort-Dome","Cortef"],"icatibanto":["Firazyr","Gulandaripa"],"idebenona":["Raxone"],"imetelstate":["Rytelo"],"insulin-glulisine":["Apidra","Ins Apidra"],"insulin-neutral":["Insulin Human Winthrop"],"insulina-glargina":["Basaglar","Glargilin","Glatus","Lantus","Semglee","Toujeo","Abasaglar","Ins Lantus","Lusduna"],"insulina-lispro":["Humalog","Ins Humalog","Insulin Lispro Sanofi","Liprolog","Lyumjev (Previously Liumjev)"],"interferon-alfacon-1":["Infergen"],"interferon-gamma-1b":["Actimmune","Immukin"],"lanreotida":["Somatuline Autogel","Somatuline La"],"lenograstim":["Granocyte-13","Granocyte-34"],"lepirudin":["Refludan"],"letrozol":["Femara","Ivevi","Lefémi","Lemol","Lethozy","Mahila","Noazy","Sabine"],"leuprorrelina":["Eligard","Lectrum"],"levotiroxina-t4":["Puran T4","Synthroid","Euthyrox"],"linaclotida":["Constella","Linzess"],"lipegfilgrastim":["Lonquex"],"liraglutida":["Aribet","Lirux","Lyrza","Olire","Wylovol","Liraclick","Saxenda","Victoza"],"lixisenatida":["Lyxumia"],"lonapegsomatropin":["Skytrofa","Stem-Stat Ortho"],"luspatercept":["Reblozyl"],"lypressin":["Diapid"],"macimorelina":["Macrilen"],"mecasermina-igf-1-recombinante":["Bio-Fd&C Igf1","Increlex","Myotrophin","Nexpure Plant-Made Igf-1"],"medroxiprogesterona":["Depo-Provera","Provera","Contracep","Demedrox","Adgyn Medro","Amen","Climanor","Curretab","Cycrin","Depo-Progevera","Depo-Subq Provera 104","Farlutal","Sayana Press"],"melatonina":["Circadin","General Nutrit","Health Aid","Heidadouppi","Icenia","Life Ext","Melapure","Melatonin Neurim","Natrol","Nature'S Blend","Natures Bounty","Quality Health","S.Gard","Slenyto","Travelag","Vespro","Vytalonin"],"metformina":["Glifage","Meglize","Diglixx","Formyn","Funed Metformina","Glicefor","Glicomet","Lfm – Metformina","Metta Sr","Bolamyn Sr","Diagemet Xl","Fortamet","Glucamet 500","Glucamet 850","Glucient Sr","Glucophage","Glumetza","Glyformin","Ledermetin","Metabet Sr","Metsol","Milform","Orabet","Riomet","Sukkarto Sr"],"metreleptina":["Myalept","Myalepta"],"mifamurtide":["Mepact"],"motixafortide":["Aphexda"],"nesiritide":["Natrecor"],"niacina-vitamina-b3":["Niacin Component Of Advicor","Niacin Component Of Simcor","Niacin Td","Niacor","Niaspan","Nicangin","Nicolar","Wampocap"],"niacinamida":["Freederm","Niacinamide Component Of Tpn","Niatin","Nicam","Nicobion","Papulex"],"ocriplasmin":["Jetrea"],"octreotida":["Sandostatin","Octride","Bynfezia Pen","Mycapssa"],"oprelvekin":["Neumega"],"oxandrolona":["Anavar","Oxandrin"],"palifermin":["Kepivance"],"palopegteriparatide":["Yorvipath"],"parathyroid-hormone":["Natpar","Preotact"],"pasireotida":["Signifor Lp","Signifor Lar"],"pegfilgrastim":["Bioce","Fulphila","Neulastim","Pegneucyte","Pegtima","Pegty","Pelgraz","Ziextenzo","Grasustek","Neulasta","Neupopeg","Nyvepria","Pelmeg","Ristempa","Stimufend","Udenyca"],"peginesatide":["Hematide"],"pegvaliase":["Palynziq"],"piracetam":["Nootropil","Gabacet","Nootrop"],"plecanatida":["Trulance"],"polymyxin-b":["Aerosporin","Gppe Pdr Ster","Poly-Rx","Polyfax","Polymycin B Sulfate"],"pramlintida":["Symlin","Symlinpen"],"prednisona":["Meticorten","Ciclorten","Corticorten","Crispred","Flamape","Funed Prednisona","Nisbal","Predcort","Predinis","Cortan","Cortancyl","Decortisyl","Delta-Dome","Deltasone","Fernisone","Liquid Pred","Lodotra","Orasone","Paracort","Prednicen-M","Prednisone Intensol","Rayos","Servisone","Sterapred"],"progesterona":["Crinone","Prolutex","Utrogestan","Gynpro","Junno","Cyclogest","Endometrin","Lutigest","Milprosa","Prochieve","Progesta-Care","Progestasert","Progestin","Prometrium","Regumate","Serenity For Women","Syngestrone"],"protirelin":["Thypinone","Thyrel Trh","Trh-Cambridge"],"raloxifeno":["Evista","Ralxfem"],"resmetirom":["Rezdiffra"],"riboflavina-vitamina-b2":["E-B2","Freeda","Riboflavin Component Of Vitaped","Vitamin B 2"],"rilonacept":["Arcalyst"],"rimabotulinumtoxinb":["Myobloc","Neurobloc"],"romiplostim":["Nplate"],"saralasin":["Sarenin"],"sargramostim":["Leukine"],"secretina":["Secretin-Ferring"],"selenometionina":["Sethotope"],"selvacovatein":["Bimervax"],"semaglutida":["Embeltah","Ozivy","Seemasun","Semavy","Sevema","Zempneo","Extensior","Loryvia","Orsema","Owozy","Ozempic","Rybelsus","Wegovy"],"sermorelina":["Geref"],"setmelanotida":["Imcivree"],"sincalida-cck-8":["Kinevac"],"sodio":["Cifoban","Hipertonic 5%","Jp Fisiológico","Maresis Ht","Nice","Oraice","Snif 3%","Solução Fisiológica","Tricit","Phosphotope"],"somatorelin":["Ghrh Ferring"],"somatrem":["Protropin"],"somatrogon":["Genryzon","Ngenla"],"tagraxofusp":["Elzonris"],"tamoxifeno":["Nolvadex","Tacfen","Taxofen"],"tasonermin":["Beromun"],"tebentafusp":["Kimmtrak"],"teduglutida":["Revestive","Gattex Kit"],"telavancin":["Vibativ"],"teriparatida":["Bonmide","Forteo","Forzy","Sondelbay","Terrosa","Parathar"],"terlipressina":["Glypressin","Tergly","Terlivaz","Variquel"],"testosterona":["Androgel","Deposteron","Testocyp","Testogel","Androderm","Andropatch","Axiron","Fortesta","Intrinsa","Livensa","Natesto","Striant","Testim","Testoderm","Testopatch","Testopel","Testoral","Tostran","Vogelxo"],"thyrotropin":["Thytropar"],"tiamina-vitamina-b1":["Acesyl","Benerva","Beneum","Hipovit B","Naévia","Nervamin","Neurivit","Vitamina B1 Neo Química","Vitaum","Thiamine Component Of Vitaped","Vitamin B1"],"tibolona":["Livial","Clindella","Libiam","Reduclim","Tibial","Tiboclin"],"tirzepatida":["Mounjaro","Zepbound"],"trafermin":["Fiblast"],"triptorrelina":["Gonapeptyl Daily","Gonapeptyl Depot","Decapeptyl"],"trofinetida-trofinetide-analogo-do-gpe":["Daybue"],"tyrothricin":["Bactratycin","Coltirot","Dermotricine","Hydrotricine","Martricin","Solutricine","Tyri 10","Tyroderm","Tyrosur"],"urofollitropin":["Fostimon-M","Bravelle","Fertinex","Fostimon","Gonadotraphon Fsh","Metrodin High Purity","Orgafol"],"vancomicina":["Vancocina Cp","Hicovan","Novamicin","Vancoson","Vancotrat","Vank"],"vasopressina":["Beta-Hypophamine","Leiormone","Vasophysin","Vasopressin Component Of Hbn-1","Vasostrict"],"vitamina-a-retinol":["Aquasol E","Bio-E-Vit","Davina","E-Caps","Fort-E-Vite","Jarrow For","Sigma","Vitamin E Component Of Vitaped"],"voclosporin":["Lupkynis"],"vosoritida":["Voxzogo"]};
/*marcas-auto:fim*/
const SINONIMOS = {
  semaglutida: "ozempic wegovy rybelsus", tirzepatida: "mounjaro zepbound", liraglutida: "victoza saxenda", dulaglutida: "trulicity",
  exenatida: "byetta bydureon", cagrilintida: "cagrisema", tesamorelina: "egrifta", somatropina: "hormonio do crescimento gh hgh",
  "bpc-157": "bpc157 pentadecapeptideo", "cjc-1295": "cjc1295", "ibutamoren": "mk677 mk-677", testosterona: "androgel deposteron durateston",
  tamoxifeno: "nolvadex", anastrozol: "arimidex", letrozol: "femara", clomifeno: "clomid", finasterida: "propecia proscar", cabergolina: "dostinex",
  oxandrolona: "anavar", nandrolona: "deca durabolin", estanozolol: "winstrol", trembolona: "tren", metformina: "glifage glucophage",
  "gonadotrofina corionica": "hcg pregnyl ovidrel", melatonina: "hormonio do sono", creatina: "creatine", cafeina: "caffeine", curcumina: "curcuma turmeric",
  ashwagandha: "withania ginseng indiano", glutationa: "glutathione", "omega-3": "fish oil oleo de peixe", "coenzima q10": "ubiquinol ubiquinona coq10",
  "vitamina d3": "colecalciferol d3", "nad+": "nad nicotinamida adenina dinucleotideo", colageno: "collagen", probioticos: "probiotics"
};
/* Nomes comerciais curados (prefixo do nome da ficha, sem acento) para quem a Anvisa/FDA/EMA não cobre. */
const MARCAS_EXTRA = {
  leuprorrelina: ["Lupron", "Lupron Depot", "Lucrin", "Lucrin Depot", "Eligard", "Camcevi", "Fensolvi", "Viadur"],
  goserelina: ["Zoladex", "Zoladex LA"], triptorrelina: ["Decapeptyl", "Trelstar", "Diphereline", "Triptodur"],
  "hormonio do crescimento": ["Genotropin", "Norditropin", "Humatrope", "Omnitrope", "Saizen", "Nutropin", "Zomacton", "Serostim", "Scitropin"],
  somatropina: ["Genotropin", "Norditropin", "Humatrope", "Omnitrope", "Saizen", "Nutropin", "Zomacton", "Serostim"],
  "gonadotrofina corionica": ["Ovidrel", "Pregnyl", "Novarel", "Choragon", "Profasi", "Gonakor"],
  insulina: ["Humulin", "Novolin", "NovoRapid", "Levemir", "Tresiba", "Lantus", "Humalog", "Fiasp", "Toujeo", "Apidra", "Admelog"],
  ocitocina: ["Syntocinon", "Pitocin", "Ocitocina Blau"], vasopressina: ["Pitressin", "Vasostrict"],
  desmopressina: ["Minirin", "DDAVP", "Noctiva", "Nocdurna"], melatonina: ["Circadin", "Slenyto"], "bremelanotida": ["Vyleesi"],
  pramlintida: ["Symlin"], cetrorrelix: ["Cetrotide"], ganirelix: ["Orgalutran", "Fyremadel"], glucagon: ["GlucaGen", "Gvoke", "Baqsimi"],
  "liotironina": ["Cytomel", "Tertroxin"], "dhea": ["Intrarosa", "Prasterona"], pegvisomanto: ["Somavert"], terlipressina: ["Terlivaz", "Glypressin"],
  nandrolona: ["Deca-Durabolin", "Durabolin"], testosterona: ["Durateston", "Sustanon", "Nebido", "Androgel", "Testogel"],
  ipamorelina: [], sermorelina: ["Geref"], tesamorelina: ["Egrifta"], "follitropina": ["Gonal-f", "Puregon", "Bemfola", "Ovaleap"],
  menotropina: ["Menopur", "Menogon"], "levotiroxina": ["Synthroid", "Puran T4", "Euthyrox", "Levoid", "Tyrosint"], "calcitonina": ["Miacalcic"],
  teriparatida: ["Forteo", "Forsteo"], abaloparatida: ["Tymlos"], octreotida: ["Sandostatin", "Sandostatin LAR"], lanreotida: ["Somatuline"]
};
const SEM_MARCAS_APROV = /^(mineral|vitamina|suplemento|antioxidante|nad|probiotico)/;
/* Marcas de aprovações (FDA, EMA, Anvisa, Canadá) limpas de embalagens e soluções; só para busca e ficha. */
const marcasAprovacao = p => {
  if (SEM_MARCAS_APROV.test(semAcento((p.categoria || "").toLowerCase()))) return [];
  const a = (typeof APROVACOES_AUTO !== "undefined" && APROVACOES_AUTO[slug(p.nome)]) || {};
  const bruto = [].concat(a.fda?.marcas || [], a.ema?.marcas || [], (a.anvisa?.registros || []).map(x => x.nome), (a.canada?.registros || []).map(x => x.produto));
  return bruto.filter(Boolean).map(m => m.replace(/\(.*?\)/g, "").trim()).filter(m => m.length > 2 && m.length < 28 && !/\d|%| in |injection|\btab\b|\bkit\b|usp|solution|plastic|container|\bsodium\b|chloride|\bacetate\b/i.test(m))
    .map(m => m === m.toUpperCase() ? m.toLowerCase().replace(/(^|[\s-])\w/g, c => c.toUpperCase()) : m);
};
const marcasDe = p => p._mc || (p._mc = (() => {
  if (p.marcas) return p.marcas;
  const n = semAcento(p.nome.toLowerCase()), extra = Object.entries(MARCAS_EXTRA).filter(([k]) => n.startsWith(k)).flatMap(([, v]) => v);
  const nomes = n.split(/[^a-z0-9]+/).filter(Boolean);
  const todos = [...(MARCAS_AUTO[slug(p.nome)] || []), ...extra, ...marcasAprovacao(p)], vistos = new Set(nomes), r = [];
  for (const m of todos) { const c = semAcento(m.toLowerCase()).replace(/[^a-z0-9]/g, ""); if (c && !vistos.has(c)) { vistos.add(c); r.push(m); } }
  return r.slice(0, 40);
})());
const buscaNome = p => p._bn || (p._bn = (() => {
  const n = semAcento(p.nome.toLowerCase());
  const sin = Object.entries(SINONIMOS).filter(([k]) => n.startsWith(k)).map(([, v]) => v).join(" ");
  const marcas = marcasDe(p).join(" ") + " " + (p.combo || []).join(" ").replace(/-/g, " ") + " " + (p.outrosAtivos || []).join(" ");
  return n + " " + sin + " " + semAcento(marcas.toLowerCase());
})());
const buscaTexto = p => p._bt || (p._bt = semAcento((p.nome + " " + p.mecanismo + " " + p.categoria + " " + p.status).toLowerCase()));
function distancia(a, b) {
  if (Math.abs(a.length - b.length) > 2) return 9;
  let ant = Array.from({ length: b.length + 1 }, (_, j) => j);
  for (let i = 1; i <= a.length; i++) {
    const at = [i];
    for (let j = 1; j <= b.length; j++) at[j] = Math.min(ant[j] + 1, at[j - 1] + 1, ant[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    ant = at;
  }
  return ant[b.length];
}
/* amplo=false: só nome e nomes comerciais (sugestões); amplo=true: também mecanismo, categoria e status (lista). */
function casaBusca(p, q, amplo = true) {
  const palavras = semAcento(q.toLowerCase()).split(/\s+/).filter(Boolean);
  if (!palavras.length) return true;
  const nome = buscaNome(p), compacto = nome.replace(/[^a-z0-9]/g, ""), pals = nome.split(/[^a-z0-9]+/).filter(x => x.length > 3);
  return palavras.every(w => {
    if (nome.includes(w) || (w.replace(/[^a-z0-9]/g, "").length > 2 && compacto.includes(w.replace(/[^a-z0-9]/g, "")))) return true;
    if (amplo && buscaTexto(p).includes(w)) return true;
    return w.length > 3 && pals.some(x => distancia(w, x) <= (w.length > 6 ? 2 : 1));
  });
}
/* Onde está aprovado: os resultados são limitados às bases e aos nomes consultados. */
function locaisAprovacao(p) {
  const s = slug(p.nome), a = (typeof APROVACOES_AUTO !== "undefined" && APROVACOES_AUTO[s]) || {};
  const r = [];
  if (a.fda) r.push({ pais: "EUA", orgao: "FDA", marcas: a.fda.marcas, auto: true, url: "https://www.accessdata.fda.gov/scripts/cder/daf/index.cfm?event=BasicSearch.process&searchterm=" + encodeURIComponent(termoEn(p.nome)) });
  if (a.ema) r.push({ pais: "União Europeia", orgao: "EMA", marcas: a.ema.marcas, auto: true, retirado: a.ema.situacao !== "autorizado", url: a.ema.url });
  if (autorizadoAnvisa(a)) r.push({ pais: "Brasil", orgao: "Anvisa", marcas: (a.anvisa.registros || []).map(x => x.nome), auto: true, url: "https://consultas.anvisa.gov.br/#/medicamentos/" });
  if (autorizadoCanada(a)) r.push({ pais: "Canadá", orgao: "Health Canada", marcas: (a.canada.registros || []).map(x => x.produto).filter(Boolean), auto: true, url: "https://health-products.canada.ca/dpd-bdpp/index-eng.jsp" });
  return r;
}
function fontesRegulatorias(p) {
  const a = (typeof APROVACOES_AUTO !== "undefined" && APROVACOES_AUTO[slug(p.nome)]) || {};
  const fda = a.fda ? "autorizado" : a.fdaVerificadoEm ? "sem_registro" : "nao_verificado";
  const ema = a.ema?.situacao === "autorizado" ? "autorizado"
    : a.ema ? "sem_registro_ativo" : a.emaVerificadoEm ? "sem_registro" : "nao_verificado";
  const anvisa = a.anvisa?.situacao || (a.anvisa?.verificadoEm ? "sem_registro" : "nao_verificado");
  const canada = a.canada?.situacao || (a.canada?.verificadoEm ? "sem_registro" : "nao_verificado");
  return [
    { orgao: "FDA (EUA)", situacao: fda, data: a.fdaVerificadoEm, desde: a.fda?.desde, detalhe: a.fda?.marcas?.join(", "), url: "https://www.accessdata.fda.gov/scripts/cder/daf/index.cfm?event=BasicSearch.process&searchterm=" + encodeURIComponent(termoEn(p.nome)) },
    { orgao: "EMA (União Europeia)", situacao: ema, data: a.emaVerificadoEm, desde: a.ema?.desde, detalhe: a.ema?.marcas?.join(", "), url: a.ema?.url || "https://www.ema.europa.eu/en/medicines" },
    { orgao: "Anvisa (Brasil)", situacao: anvisa, data: a.anvisa?.verificadoEm, detalhe: (a.anvisa?.registros || []).map(x => `${x.nome}${x.registro ? ` · registro ${x.registro}` : ""}`).join("; "), url: "https://consultas.anvisa.gov.br/#/medicamentos/" },
    { orgao: "Health Canada", situacao: canada, data: a.canada?.verificadoEm, desde: ((a.canada?.registros || []).filter(r => /approved|marketed/i.test(r.situacao) && r.data).map(r => r.data).sort()[0]), detalhe: `${(a.canada?.registros || []).map(x => `${x.produto || x.din}${x.situacao ? ` · ${x.situacao}` : ""}`).join("; ")}${a.canada?.parcial ? ` (${tr("verificação parcial")})` : ""}`, url: "https://health-products.canada.ca/dpd-bdpp/index-eng.jsp" },
  ];
}
function htmlLocais(p, completo) {
  const fontes = fontesRegulatorias(p);
  const aprovados = fontes.filter(x => x.situacao === "autorizado");
  const semAprovacao = fontes.some(x => ["sem_registro", "sem_registro_ativo"].includes(x.situacao));
  const parcial = fontes.some(x => x.situacao === "consulta_parcial");
  const estudos = (typeof APROVACOES_AUTO !== "undefined" && APROVACOES_AUTO[slug(p.nome)]?.estudos) || {};
  const temEstudos = Number.isFinite(estudos.ensaios) && estudos.ensaios > 0;
  const rotulo = {
    autorizado: tr("Autorização localizada"),
    sem_registro: tr("Nenhum registro localizado na busca"),
    sem_registro_ativo: tr("Nenhum registro ativo localizado"),
    consulta_parcial: tr("Consulta parcial; não conclusiva"),
    retirado: tr("Sem autorização ativa"),
    nao_verificado: tr("Ainda não verificado"),
  };
  if (!completo) {
    const chips = aprovados.map(x => `<span class="local" title="${esc(x.orgao)}${x.desde ? ` · ${tr("aprovado em")} ${esc(dataMarco(x.desde))}` : ""}">✅ ${esc(x.orgao)}${x.desde ? ` ${esc(x.desde.slice(0, 4))}` : ""}</span>`);
    if (!chips.length) {
      const estado = semAprovacao ? tr("Sem aprovação ativa confirmada nas fontes consultadas")
        : parcial ? tr("Consulta parcial; não conclusiva")
          : tr("Situação regulatória ainda não sincronizada");
      chips.push(`<span class="local sem">${estado}</span>`);
    }
    if (temEstudos) chips.push(`<span class="local">${tr("Em estudo")}: ${num(estudos.ensaios)}</span>`);
    return `<span class="locais">${chips.join(" ")}</span>`;
  }
  const lista = fontes.map(x => `<li><b>${esc(x.orgao)}:</b> ${esc(rotulo[x.situacao] || tr("Consulta parcial; não conclusiva"))}${datasFonte(x)}${x.detalhe ? ` — ${esc([...new Set(String(x.detalhe).split("; "))].join("; ").replace(/\bApproved\b/g, "aprovado"))}` : ""} · <a href="${esc(x.url)}" target="_blank" rel="noopener">${tr("fonte oficial")}</a></li>`).join("");
  const estudosHtml = temEstudos
    ? `<p>${tr("ClinicalTrials.gov")}: ${num(estudos.ensaios)} ${tr("estudos registrados")}; ${num(estudos.recrutando)} ${tr("recrutando")}.</p><p>${chipsFases(estudos)} <a href="https://clinicaltrials.gov/search?term=${encodeURIComponent(termoEn(p.nome))}" target="_blank" rel="noopener">${tr("consultar estudos")}</a></p>`
    : "";
  const resumo = aprovados.length
    ? `<p>${tr("Autorização localizada em")}: ${esc(aprovados.map(x => x.orgao).join(", "))}. ${tr("A autorização depende do produto e da indicação registrados.")}</p>`
    : semAprovacao
      ? `<p>${tr("Ausência de resultados não prova ausência de aprovação em outros países, indicações ou bases.")}</p>`
      : `<p>${tr("Consulta parcial; não conclusiva")} — ${tr("confirme diretamente nas fontes oficiais.")}</p>`;
  return `${resumo}<ul class="locais-lista">${lista}</ul>${estudosHtml}<small>${tr("As consultas usam correspondência de nome/ingrediente e não cobrem todas as autoridades regulatórias do mundo. Anvisa e Health Canada consultam bases de medicamentos, não todos os suplementos. Confira o produto e a indicação diretamente no órgão responsável.")}</small>`;
}
/* Perguntas frequentes geradas a partir dos campos da ficha (sem doses). */
function faqDe(p) {
  const loc = locaisAprovacao(p).filter(x => !x.retirado).map(x => x.pais + (x.auto ? "" : "*"));
  const categoria = tr(p.categoria);
  const definicao = tr(`${p.nome} é uma substância da categoria ${categoria}.`);
  return [
    [tr(`O que é ${p.nome}?`), `${definicao} ${tr(p.oQueFaz)}`],
    [`${p.nome} é aprovado?`, `Na fase atual do catálogo (${p.fase}): ${p.status}.${loc.length ? " Aprovação confirmada em: " + loc.join(", ") + "." : ""} Aprovação vale só para indicações específicas, com prescrição.`],
    [`Quais são os riscos de ${p.nome}?`, `${p.riscos} Esta não é uma lista completa; a bula e um profissional de saúde são as fontes para o seu caso.`],
    [`Qual é o nível de evidência sobre ${p.nome}?`, p.evidencia],
    [`Existe dose recomendada de ${p.nome}?`, `${p.protocolo} Este guia não fornece doses: apenas um profissional de saúde pode avaliar se e como usar.`],
  ];
}
/* Verificação por afirmação: links de busca pré-montados no PubMed por tipo de afirmação (não são citações individuais). */
const PUBMED = "https://pubmed.ncbi.nlm.nih.gov/?term=";
const CONSULTAS = {
  mecanismo: ["mecanismo de ação", "(mechanism of action[Title/Abstract])"],
  beneficios: ["ensaios clínicos", "(clinical trial[Publication Type] OR randomized controlled trial[Publication Type])"],
  evidencia: ["revisões sistemáticas e metanálises", "(systematic review[Publication Type] OR meta-analysis[Publication Type])"],
  riscos: ["segurança e efeitos adversos", "(adverse effects[Title/Abstract] OR safety[Title/Abstract] OR toxicity[Title/Abstract])"],
};
function verificar(p, tipo) {
  const c = CONSULTAS[tipo];
  if (!c) return "";
  const url = PUBMED + encodeURIComponent(`${termoEn(p.nome)}[Title/Abstract] AND ${c[1]}`);
  return `<small class="verificar">🔎 Conferir no <a href="${url}" target="_blank" rel="noopener">PubMed: ${c[0]}</a></small>`;
}
const linkFonte = f => `<a href="${PUBMED}${encodeURIComponent(f)}" target="_blank" rel="noopener" title="Buscar esta referência no PubMed">${esc(f)}</a>`;

/* Alertas de segurança: recalls de medicamentos na base openFDA (janela de 3 anos), da coleta automática. */
function alertasDe(p) {
  const d = _snapshotSync?.itens?.[slug(p.nome)];
  return d?.alertas || null;
}
function htmlAlertas(p) {
  const a = alertasDe(p);
  if (!a) return "<small>Sem dados de alertas disponíveis (rode a coleta automática).</small>";
  if (!a.total) return "<p>Nenhum recall encontrado na FDA nos últimos 3 anos para este nome.</p>";
  return `<p><b>${a.total} recall(s)</b> na FDA nos últimos 3 anos. Mais recentes:</p>
    <ul class="recalls">${a.recentes.map(r => `<li><b>${esc(r.data)}</b> · ${esc(r.classe)} · ${esc(r.empresa)}<br><small>${esc(r.motivo)} (${esc(r.produto)})</small></li>`).join("")}</ul>
    <small>Muitos recalls envolvem produtos <b>manipulados</b> ou lotes específicos, ${tr("e não necessariamente o item em geral.")} Veja também os alertas da <a href="https://www.gov.br/anvisa/pt-br/assuntos/fiscalizacao-e-monitoramento" target="_blank" rel="noopener">Anvisa</a> e da <a href="https://www.fda.gov/drugs/drug-safety-and-availability" target="_blank" rel="noopener">FDA</a>.</small>`;
}
const SELOS = {
  solido:  { icone: "✅", rotulo: "Aprovado · evidência sólida", classe: "selo-solido" },
  aprovado:{ icone: "🟡", rotulo: "Aprovado · evidência variável", classe: "selo-aprovado" },
  estudo:  { icone: "🔵", rotulo: "Em estudo clínico", classe: "selo-estudo" },
  pre:     { icone: "🟠", rotulo: "Sem comprovação em humanos", classe: "selo-pre" },
  desc:    { icone: "⚪", rotulo: "Desenvolvimento descontinuado", classe: "selo-desc" }
};
function seloDe(p) {
  const alta = /^alta/i.test(p.evidencia);
  if (p.fase === "Aprovado") return alta ? SELOS.solido : SELOS.aprovado;
  if (p.fase === "Descontinuado") return SELOS.desc;
  if (["Fase 1", "Fase 2", "Fase 3"].includes(p.fase)) return SELOS.estudo;
  return SELOS.pre;
}
/* Protocolos pessoais (só neste navegador): usados pela calculadora e pela página "Meus protocolos" */
/* Autocompletar próprio (o <datalist> nativo abre em posições aleatórias em alguns navegadores) */
function autoCompletar(input) {
  if (input.dataset.ac) return;
  input.dataset.ac = "1";
  input.removeAttribute("list");
  const norm = s => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  const envol = document.createElement("span");
  envol.style.cssText = "position:relative;display:block";
  input.parentNode.insertBefore(envol, input);
  envol.appendChild(input);
  const ul = document.createElement("ul");
  ul.className = "ac-lista"; ul.hidden = true; ul.setAttribute("role", "listbox");
  envol.appendChild(ul);
  let ativo = -1;
  const fechar = () => { ul.hidden = true; ativo = -1; };
  const marcar = () => [...ul.children].forEach((li, i) => li.classList.toggle("ativo", i === ativo));
  const escolher = li => { input.value = li.dataset.v; fechar(); input.dispatchEvent(new Event("change", { bubbles: true })); };
  const abrir = () => {
    const q = norm(input.value.trim());
    if (!q) return fechar();
    const achados = PEPTIDES.map(p => p.nome).filter(n => norm(n).includes(q))
      .sort((a, b) => (norm(a).startsWith(q) ? 0 : 1) - (norm(b).startsWith(q) ? 0 : 1) || a.localeCompare(b, "pt")).slice(0, 8);
    ul.textContent = "";
    achados.forEach(n => { const li = document.createElement("li"); li.textContent = n; li.dataset.v = n; li.setAttribute("role", "option"); ul.appendChild(li); });
    ativo = -1;
    ul.hidden = !achados.length || (achados.length === 1 && achados[0] === input.value);
  };
  input.addEventListener("input", abrir);
  input.addEventListener("keydown", e => {
    if (ul.hidden) return;
    const n = ul.children.length;
    if (e.key === "ArrowDown") { ativo = (ativo + 1) % n; marcar(); e.preventDefault(); }
    else if (e.key === "ArrowUp") { ativo = (ativo - 1 + n) % n; marcar(); e.preventDefault(); }
    else if (e.key === "Enter" && ativo >= 0) { escolher(ul.children[ativo]); e.preventDefault(); }
    else if (e.key === "Escape") fechar();
  });
  ul.addEventListener("mousedown", e => { const li = e.target.closest("li"); if (li) { e.preventDefault(); escolher(li); } });
  input.addEventListener("blur", fechar);
}const CH_MEUS = "meus_protocolos_v1";
const FREQ_SEM = { 7: "Diária", 5: "5×/semana", 3: "3×/semana", 2: "2×/semana", 1: "1×/semana" };
const novoIdProtocolo = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
function normalizarProtocolo(x) {
  const s = v => (typeof v === "string" ? v.slice(0, 300) : "");
  const d = Number(x.dose);
  const c = x.calc && typeof x.calc === "object" ? x.calc : null;
  const numeroCalc = v => typeof v === "number" && Number.isFinite(v) && v > 0 && v < 1e6 ? v : null;
  const estoqueQuantidade = numeroCalc(x.estoqueQuantidade);
  const estoqueUnidade = ["mg", "mcg", "UI", "mL", "g", "comprimido(s)", "cápsula(s)", "gota(s)", "dose(s)"].includes(x.estoqueUnidade) ? x.estoqueUnidade : "";
  const estoqueApresentacao = ["injecao", "comprimido", "capsula", "outra"].includes(x.estoqueApresentacao)
    ? x.estoqueApresentacao
    : estoqueUnidade === "comprimido(s)" ? "comprimido"
      : estoqueUnidade === "cápsula(s)" ? "capsula"
        : ["sc", "im", "iv"].includes(x.via) ? "injecao" : "outra";
  return {
    id: s(x.id) || novoIdProtocolo(), slug: s(x.slug), nome: s(x.nome).slice(0, 120) || "Sem nome", dose: Number.isFinite(d) && d > 0 ? d : null,
    unid: s(x.unid) || "mg", freq: s(x.freq), via: s(x.via), hora: s(x.hora), horaPrimeira: s(x.horaPrimeira), horaSegunda: s(x.horaSegunda),
    aplicacoesDia: x.freq === "2× ao dia" ? 2 : Math.max(1, Math.min(24, Number(x.aplicacoesDia) || 1)),
    horariosDia: (Array.isArray(x.horariosDia) ? x.horariosDia : [x.horaPrimeira, x.horaSegunda])
      .filter(t => typeof t === "string" && /^\d{2}:\d{2}$/.test(t)).slice(0, 24),
    inicio: s(x.inicio), fim: s(x.fim),
    fimTipo: ["data", "semanas"].includes(x.fimTipo) ? x.fimTipo : x.fim ? "data" : "nenhum",
    fimSemanas: Math.max(1, Math.min(260, Number(x.fimSemanas) || 1)),
    produto: s(x.produto), obs: s(x.obs),
    status: ["ativo", "pausado", "concluido"].includes(x.status) ? x.status : "ativo",
    tomadas: Array.isArray(x.tomadas) ? x.tomadas.filter(t => typeof t === "string" && /^\d{4}-\d{2}-\d{2}$/.test(t)).slice(-8760) : [],
    historicoDose: Array.isArray(x.historicoDose) ? x.historicoDose
      .filter(h => h && typeof h.data === "string" && /^\d{4}-\d{2}-\d{2}$/.test(h.data))
      .slice(-260).map(h => ({
        data: h.data, nome: s(h.nome).slice(0, 120), dose: Number.isFinite(Number(h.dose)) && Number(h.dose) > 0 ? Number(h.dose) : null,
        unid: s(h.unid), via: s(h.via), freq: s(h.freq),
      })).sort((a, b) => a.data.localeCompare(b.data)) : [],
    registrosDose: Array.isArray(x.registrosDose) ? x.registrosDose
      .filter(r => r && typeof r.data === "string" && /^\d{4}-\d{2}-\d{2}$/.test(r.data))
      .slice(-8760).map(r => ({
        id: s(r.id) || novoIdProtocolo(), data: r.data, nome: s(r.nome).slice(0, 120),
        dose: Number.isFinite(Number(r.dose)) && Number(r.dose) > 0 ? Number(r.dose) : null,
        unid: s(r.unid), via: s(r.via), freq: s(r.freq),
      })) : [],
    diasSemana: Array.isArray(x.diasSemana) ? [...new Set(x.diasSemana.filter(d => Number.isInteger(d) && d >= 0 && d <= 6))].sort() :
      (["Diária", "2× ao dia"].includes(x.freq) ? [0, 1, 2, 3, 4, 5, 6] : []),
    calc: c ? {
      tipo: ["po", "pronto"].includes(c.tipo) ? c.tipo : "po",
      unid: ["mg", "mcg", "UI"].includes(c.unid) ? c.unid : "mg",
      via: ["sc", "im"].includes(c.via) ? c.via : "",
      frasco: numeroCalc(c.frasco), diluente: numeroCalc(c.diluente),
      seringa: numeroCalc(c.seringa), dose: numeroCalc(c.dose), freq: numeroCalc(c.freq),
    } : null,
    estoqueQuantidade,
    estoqueUnidade,
    estoqueApresentacao,
    estoquePotencia: numeroCalc(x.estoquePotencia),
    estoqueQuantidadeManual: typeof x.estoqueQuantidadeManual === "boolean" ? x.estoqueQuantidadeManual
      : Boolean(estoqueQuantidade && estoqueQuantidade !== (c?.tipo === "po" ? numeroCalc(c.frasco) : null)),
    estoquePorAplicacao: numeroCalc(x.estoquePorAplicacao),
    estoqueData: typeof x.estoqueData === "string" && /^\d{4}-\d{2}-\d{2}$/.test(x.estoqueData) ? x.estoqueData : "",
    meiaVidaHoras: Number.isFinite(Number(x.meiaVidaHoras)) && Number(x.meiaVidaHoras) > 0 && Number(x.meiaVidaHoras) <= 8760
      ? Number(x.meiaVidaHoras) : null,
    criado: s(x.criado),
  };
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
function lerProtocolos() { try { return (JSON.parse(localStorage.getItem(CH_MEUS)) || []).map(normalizarProtocolo); } catch { return []; } }
function gravarProtocolos(l) { try { localStorage.setItem(CH_MEUS, JSON.stringify(l)); return true; } catch { alert("Não foi possível salvar neste navegador (armazenamento cheio ou bloqueado)."); return false; } }
function migrarProtocolosAntigos() {
  if (localStorage.getItem("meus_protocolos_migrado")) return;
  try {
    const velhos = JSON.parse(localStorage.getItem("calc_protocolos")) || [];
    if (velhos.length) {
      const l = lerProtocolos(), hoje = new Date().toISOString().slice(0, 10);
      velhos.forEach(v => {
        const e = v.est || {}, p = PEPTIDES.find(q => semAcento(q.nome.toLowerCase()) === semAcento(String(v.nome || "").toLowerCase()));
        l.push(normalizarProtocolo({ nome: v.nome, slug: p ? slug(p.nome) : "", dose: e.dose, unid: e.unid, via: e.via, freq: FREQ_SEM[e.freq] || "", calc: e, inicio: hoje, criado: hoje, obs: "Importado da calculadora." }));
      });
      gravarProtocolos(l);
    }
  } catch { /* dados antigos ilegíveis: ignora */ }
  localStorage.setItem("meus_protocolos_migrado", "1");
}
/* Tipo de substância: o que ela é quimicamente (diferente da categoria, que é o uso/área). */
const TIPOS = {
  peptideo: { curto: "peptídeo", icone: "🧬", rotulo: "Peptídeo ou proteína", def: "Cadeia curta de aminoácidos que funciona como sinal entre as células, regulando apetite, glicemia, reparo de tecidos e outras funções. Ex.: semaglutida, BPC-157, insulina. Costuma ser injetável, pois o estômago digere peptídeos antes de absorvê-los." },
  hormonio: { curto: "hormônio", icone: "⚗️", rotulo: "Hormônio (não peptídico)", def: "Mensageiro químico produzido por glândulas, que viaja pelo sangue e regula metabolismo, humor, crescimento e reprodução. Aqui entram os de estrutura não peptídica, como esteroides e hormônios da tireoide. Ex.: testosterona, estradiol, levotiroxina. Quase sempre exige prescrição e acompanhamento médico." },
  vitamina: { curto: "vitamina", icone: "🍊", rotulo: "Vitamina", def: "Micronutriente orgânico que o corpo não produz em quantidade suficiente e precisa obter da alimentação, em doses pequenas. Participa de reações do metabolismo, da imunidade e da saúde dos ossos. Ex.: vitaminas D, C e B12." },
  mineral: { curto: "mineral", icone: "🪨", rotulo: "Mineral", def: "Elemento químico essencial, de origem inorgânica, que o corpo usa em ossos, músculos, nervos e enzimas. Também não é produzido pelo organismo. Ex.: zinco, magnésio, ferro." },
  suplemento: { curto: "suplemento", icone: "💊", rotulo: "Suplemento ou composto", def: "Molécula pequena que não se encaixa nos outros tipos: aminoácidos, ácidos graxos, antioxidantes e metabólitos. Muitas existem naturalmente no corpo ou nos alimentos e são vendidas como complemento. Ex.: creatina, carnitina, NAD+." },
  farmaco: { curto: "medicamento", icone: "🧪", rotulo: "Medicamento de molécula pequena", def: "Fármaco sintético de estrutura química simples, que não é peptídeo, hormônio natural nem nutriente. Costuma ser tomado por via oral e exige prescrição. Ex.: metformina, tadalafila, anastrozol, modafinila." },
  associacao: { curto: "associação", icone: "💊+💊", rotulo: "Associação de princípios ativos", def: "Medicamento comercial com dois ou mais princípios ativos na mesma apresentação. Os efeitos, os riscos e as contraindicações de cada ativo se somam. Ex.: Janumet (sitagliptina + metformina)." },
  biologico: { curto: "biológico", icone: "🔬", rotulo: "Biológico (proteína grande, anticorpo ou RNA)", def: "Produto feito em células vivas ou por biotecnologia: anticorpos, enzimas, fatores de crescimento, citocinas e terapias de RNA. São moléculas grandes, quase sempre injetáveis e de uso médico. Ex.: teprotumumabe, inclisirana, folistatina." }
};
/* Exceções por nome, para quando categoria e família não bastam. Todo item novo cai em "peptideo" se não estiver aqui. */
const TIPO_NOME = {
  farmaco: ["Metformina", "Acarbose", "Orforglipron", "Netazepide", "Tzp-102", "Px-478", "Intermedine", "Piracetam", "Aniracetam", "Pramiracetam", "Oxiracetam", "Fasoracetam", "Fenilpiracetam", "Modafinila", "Armodafinila", "Tesofensina", "Resmetirom", "Danuglipron", "Obicetrapibe", "Selonsertib", "Lanifibranor", "Dasatinibe", "Tadalafila", "Sildenafila", "Bortezomibe", "Carfilzomibe", "Zetomipzomib", "Zetomipzomib Maleate", "Lítio (microdoses/orotato)", "Rapamicina (sirolimo)", "Amlisimod", "Limaresiquimod", "Bezisterim", "Anastrozol", "Letrozol", "Tamoxifeno", "Clomifeno", "Enclomifeno", "Raloxifeno", "Finasterida", "Dutasterida", "Espironolactona", "Tibolona", "Medroxiprogesterona", "Drospirenona", "Etinilestradiol", "Prednisona", "Dexametasona", "Fludrocortisona"],
  biologico: ["Sotatercepte", "Teprotumumabe", "Pegvaliase", "Inclisirana", "Zilebesirana", "Imetelstate", "BDNF", "NGF", "Folistatina-344", "Folistatina-315", "Ramatercepte (ACE-031)", "Pegbelfermina", "Efruxifermina", "Pegozafermina", "Aldafermin", "Dulanermin", "Sonermin", "Plusonermin", "Rilunermin", "Ersofermin", "Zalfermin", "Canoctakin", "Denenicokin", "Pegilodecakin", "Eflepedocokin", "Mobenakin", "Atexakin", "Nogapendekin", "Pimrocktakin (bovine)", "Lerodalcibep", "Ensovibep", "Palsucibep Pegol", "Elarekibep", "Azirkitug", "Brivekimig", "Tifalibep", "Taldefgrobep", "Somatosalm", "Somenopor", "Somagrebove", "Sometribove", "Somavubove", "Sometripor", "Somidobove", "Somalapor", "Inpegsomatropin", "Gonadotropin, Serum", "Gelsolin", "Silk Fibroin", "Anfibatide", "Cobitolimod", "Cerebrolisina", "Cortexina (Cortexin)", "Retalamina"],
  peptideo: ["Gonadotrofina coriônica (hCG)", "Glucagon", "Calcitonina", "Metreleptina", "FSH (hormônio folículo-estimulante)", "LH (hormônio luteinizante)", "TSH (tireotropina)", "ACTH / cosintropina", "Eritropoetina (EPO)", "Relaxina (serelaxin)", "Somatrem", "Tiroliberina (TRH)", "Efsitora alfa", "Romiplostim", "Filgrastim", "Ganirelix", "Detemir", "Glulisina", "Gonadotrofina menopáusica (hMG)"],
  suplemento: ["Mitoquinona (MitoQ)", "Visomitina (SkQ1)", "Alfa-GPC", "Huperzina A", "Niacinamida", "Ácido azelaico", "Ácido glicólico", "Ácido salicílico", "Bakuchiol", "Ectoína", "PQQ (pirroloquinolina quinona)", "GABA", "Cafeína", "5-HTP", "HMB (beta-hidroxi-beta-metilbutirato)"]
};
const TIPO_POR_NOME = {};
Object.entries(TIPO_NOME).forEach(([k, l]) => l.forEach(n => { TIPO_POR_NOME[n] = k; }));
const TIPO_FAMILIA = { "hormonios-sexuais": "hormonio", "tireoide-adrenais": "hormonio", "hormonios-metabolicos": "hormonio", "vitaminas-lipo": "vitamina", "vitaminas-hidro": "vitamina", "minerais": "mineral",
  "suplementos-metabolicos": "suplemento", "nad-sirtuinas": "suplemento", "polifenois-longevidade": "suplemento", "mimeticos-exercicio": "suplemento", "antioxidante": "suplemento" };
function chaveTipo(p) {
  if (p._med) return p._med;
  if (TIPO_POR_NOME[p.nome]) return TIPO_POR_NOME[p.nome];
  if (/(umabe?|ximabe?|zumabe?|mab)$/i.test(p.nome.trim())) return "biologico";
  if (p.categoria === "Vitamina") return "vitamina";
  if (p.categoria === "Mineral") return "mineral";
  if (p.categoria === "Cosmético" || /glutation|carnosin|anserin/i.test(p.nome)) return "peptideo";
  const fam = typeof MECANISMOS !== "undefined" && MECANISMOS.find(m => m.peptideos.includes(p.nome));
  if (fam && TIPO_FAMILIA[fam.id]) return TIPO_FAMILIA[fam.id];
  if (fam) return "peptideo";
  return { "Hormônio": "hormonio", "Suplemento e metabólito": "suplemento", "NAD e precursores": "suplemento", "Antioxidante": "suplemento", "Mimético de exercício": "suplemento" }[p.categoria] || "peptideo";
}
const tipoDe = p => TIPOS[chaveTipo(p)];
const ORIGENS = {
  auto: { icone: "🏛️", rotulo: "Base de dados: ChEMBL (EMBL-EBI)", classe: "origem-auto", dica: "Fase, mecanismo e indicações vêm do ChEMBL, base de dados pública do EMBL-EBI." },
  dsld: { icone: "🏛️", rotulo: "Base de dados: DSLD (NIH) + Wikipédia", classe: "origem-auto", dica: "Ativo identificado no DSLD (NIH); texto de apresentação adaptado da Wikipédia (CC BY-SA 4.0); fase pelo ClinicalTrials.gov." },
  ia:   { icone: "📝", rotulo: "Texto educativo", classe: "origem-ia", dica: "Resumo educativo baseado em fontes públicas; confira nas fontes primárias." }
};
function origemDe(p) {
  if (p._med) return ORIGENS.auto;
  const s = slug(p.nome);
  if (typeof AUTO_DADOS !== "undefined" && AUTO_DADOS.includes(s)) return ORIGENS.auto;
  if (typeof DSLD_DADOS !== "undefined" && DSLD_DADOS.includes(s)) return ORIGENS.dsld;
  return ORIGENS.ia;
}
const htmlSelo = p => { const s = seloDe(p), o = origemDe(p); const f = p.faseAutomatica === "estudos" ? ` <span class="selo origem-auto" title="Fase do catálogo: ${esc(p.faseCatalogo)}. Atualizada automaticamente por estudos do ClinicalTrials.gov em que o ativo é a intervenção. Estar em estudo não significa que seja seguro ou indicado.">🔬 Fase atualizada automaticamente</span>` : ""; return `<span class="selo ${s.classe}" title="Critério: fase de desenvolvimento + nível de evidência">${s.icone} ${s.rotulo}</span> <span class="selo ${o.classe}" title="${o.dica}">${o.icone} ${o.rotulo}</span>${f}`; };
const dataBR = iso => new Date(iso + "T12:00:00").toLocaleDateString(LOCALE);
const htmlRevisao = () => `<small class="revisao">Conteúdo atualizado em ${dataBR(DATA_REVISAO)}</small>`;
/* Etapas de desenvolvimento (a etapa atual vem do campo "fase") */
function htmlEtapas(p) {
  if (p.fase === "Descontinuado") return `<p class="etapas-nota">Desenvolvimento descontinuado ou sem benefício comprovado.</p>`;
  const atual = ETAPAS.indexOf(p.fase);
  return `<ol class="etapas">${ETAPAS.map((e, k) => `<li class="${k < atual ? "feita" : k === atual ? "atual" : ""}">${esc(e)}</li>`).join("")}</ol>`;
}
/* Favoritos (guardados no navegador) */
const getFavs = () => { try { return JSON.parse(localStorage.getItem("favoritos") || "[]"); } catch { return []; } };
const ehFav = s => getFavs().includes(s);
function alternarFav(s) {
  const f = getFavs();
  const i = f.indexOf(s);
  i >= 0 ? f.splice(i, 1) : f.push(s);
  localStorage.setItem("favoritos", JSON.stringify(f));
  return i < 0;
}
const rotuloFav = s => ehFav(s) ? "⭐ Favorito" : "☆ Favoritar";

/* Seções completas de um peptídeo (usadas na página do peptídeo e na folha de estudo) */
function secoesCompletas(p) {
  const s = (t, x) => `<section class="boas"><h2>${t}</h2><p>${esc(x)}</p></section>`;
  return s("O que faz", p.oQueFaz) + s("Mecanismo de ação", p.mecanismo) + s("Benefícios observados nos estudos", p.beneficios) +
    s("Nível de evidência", p.evidencia) + s("Riscos", p.riscos) + s("Protocolo / contexto de uso", p.protocolo) +
    s("Fontes", p.fontes.join("; "));
}
/* Tema */
const root = document.documentElement;
if (localStorage.getItem("tema")) root.dataset.tema = localStorage.getItem("tema");
function alternarTema() {
  const escuro = root.dataset.tema ? root.dataset.tema === "escuro" : matchMedia("(prefers-color-scheme: dark)").matches;
  root.dataset.tema = escuro ? "claro" : "escuro";
  localStorage.setItem("tema", root.dataset.tema);
}

if ("serviceWorker" in navigator && location.protocol.startsWith("http")) navigator.serviceWorker.register("sw.js").catch(() => {});

/* ---- Tooltips do glossário (só em português; nas outras línguas o texto é traduzido por nó inteiro) ---- */
const _TERMOS_GL = GLOSSARIO.map(g => g.termo).sort((a, b) => b.length - a.length);
const _RE_GL = new RegExp("(?<![\\p{L}\\d])(" + _TERMOS_GL.map(t => t.replace(/[.*+?^${}()|[\]\\/]/g, "\\$&")).join("|") + ")(?![\\p{L}\\d])", "giu");
function comGlossario(texto) {
  const html = esc(texto);
  const vistos = new Set();
  return html.replace(_RE_GL, m => {
    const k = m.toLowerCase();
    if (vistos.has(k)) return m;
    vistos.add(k);
    const g = GLOSSARIO.find(x => x.termo.toLowerCase() === k);
    return g ? `<a class="gl" href="termo.html?t=${slug(g.termo)}" title="${esc(g.def)}">${m}</a>` : m;
  });
}

/* ---- Explique fácil ---- */
const FASE_FACIL = [
  ["aprovado", "já foi aprovado por pelo menos uma agência reguladora, para usos específicos e com prescrição"],
  ["fase 3", "está na etapa final de testes, com muitas pessoas, para confirmar se funciona e é seguro"],
  ["fase 2", "está sendo testado em grupos pequenos para ver se funciona"],
  ["fase 1", "está nos primeiros testes em pessoas, focados em segurança"],
  ["pre-clinico", "só foi testado em animais; ainda não se sabe como age em pessoas"],
  ["in vitro", "só foi testado em células no laboratório; é uma ideia muito inicial"],
  ["descontinuado", "os testes foram interrompidos"],
];
function explicaFacil(p) {
  const f = semAcento(p.fase.toLowerCase());
  const par = FASE_FACIL.find(([k]) => f.startsWith(k));
  return `${p.oQueFaz} Em que pé está: ${par ? par[1] : p.fase}. Isso não quer dizer que seja seguro ou indicado para você; converse com um profissional de saúde.`;
}

/* ---- Estudos recentes (PubMed) ---- */
async function estudosRecentes(nome) {
  const chave = "estudos:" + nome;
  try {
    const c = JSON.parse(localStorage.getItem(chave));
    if (c && Date.now() - c.quando < TTL_LIVE) return c.itens;
  } catch {}
  const t = encodeURIComponent(termoEn(nome) + "[Title/Abstract]");
  const b = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/";
  const ids = (await getJson(`${b}esearch.fcgi?db=pubmed&retmode=json&retmax=5&sort=date&term=${t}`)).esearchresult.idlist;
  if (!ids.length) return [];
  const res = (await getJson(`${b}esummary.fcgi?db=pubmed&retmode=json&id=${ids.join(",")}`)).result;
  const itens = ids.map(id => ({ id, titulo: res[id]?.title || "", revista: res[id]?.source || "", data: res[id]?.pubdate || "" }));
  localStorage.setItem(chave, JSON.stringify({ quando: Date.now(), itens }));
  return itens;
}
async function carregarEstudos(el) {
  try {
    const it = await estudosRecentes(el.dataset.nome);
    el.innerHTML = it.length
      ? `<ul class="estudos">${it.map(e => `<li><a href="https://pubmed.ncbi.nlm.nih.gov/${e.id}/" target="_blank" rel="noopener">${esc(e.titulo)}</a><br><small>${esc(e.revista)} · ${esc(e.data)}</small></li>`).join("")}</ul><small>Fonte: PubMed (títulos em inglês). Ler o título não substitui ler o estudo.</small>`
      : "<small>Nenhum estudo recente encontrado.</small>";
  } catch { el.innerHTML = "<small>Estudos recentes indisponíveis agora (limite de requisições ou sem conexão).</small>"; }
}

/* ---- Alertas de mudança nos favoritos (comparam o live-data.json com a última visita) ---- */
async function alertasFavoritos() {
  if (!getFavs().length) return [];
  const snap = await snapshot();
  const itens = snap?.itens;
  if (!itens) return [];
  const base = JSON.parse(localStorage.getItem("alertas-base") || "{}");
  const msgs = [], novo = { ...base };
  getFavs().forEach(s => {
    const d = itens[s], p = porSlug(s);
    if (!d || !p) return;
    const atual = { ensaios: d.ensaios, fase3: d.fase3, artigosAno: d.artigosAno, fda: d.fdaRegistros, fase: p.fase };
    const ant = base[s];
    if (ant) {
      if (ant.fase !== atual.fase) msgs.push(`${p.nome}: a fase no catálogo mudou de “${ant.fase}” para “${atual.fase}”.`);
      if (atual.fase3 > ant.fase3) msgs.push(`${p.nome}: ${atual.fase3 - ant.fase3} novo(s) ensaio(s) de fase 3 registrado(s).`);
      if (atual.ensaios > ant.ensaios) msgs.push(`${p.nome}: ${atual.ensaios - ant.ensaios} novo(s) ensaio(s) clínico(s) registrado(s).`);
      if (atual.fda > ant.fda) msgs.push(`${p.nome}: novo registro na FDA encontrado.`);
    }
    novo[s] = atual;
  });
  localStorage.setItem("alertas-base", JSON.stringify(novo));
  return msgs;
}
async function mostrarAlertas(el) {
  const msgs = await alertasFavoritos();
  el.innerHTML = msgs.length
    ? `<section class="boas alerta-box"><h2>🔔 Novidades nos seus favoritos</h2><ul>${msgs.map(m => `<li>${esc(m)}</li>`).join("")}</ul><small>Comparado com a sua última visita. Confira nas fontes antes de concluir algo.</small></section>`
    : "";
}

/* Cabeçalho e rodapé compartilhados */
/* Menu: poucos itens sempre visíveis + grupos por objetivo dentro de "Mais" */
const NAV_PRINCIPAL = [
  ["index.html", "Catálogo"], ["comparar.html", "Comparar"], ["calculadora.html", "Calculadora"],
  ["meus-protocolos.html", "Meus protocolos"], ["favoritos.html", "Favoritos"], ["como-usar.html", "Como usar"],
];
const NAV_GRUPOS = [
  ["🔎 Explorar", [["buscar.html", "Buscar no guia"], ["mecanismos.html", "Mecanismos"], ["alvos.html", "Hormônios e alvos"], ["corpo.html", "Mapa do corpo"], ["grafo.html", "Mapa de conexões"], ["classes.html", "Comparar classes"], ["linha-do-tempo.html", "Linha do tempo"], ["glossario.html", "Glossário"], ["estatisticas.html", "Estatísticas"]]],
  ["🛡️ Segurança", [["seguranca.html", "Segurança e legalidade"], ["interacoes.html", "Interações e cuidados"], ["sinais.html", "Sinais de alerta"], ["alertas.html", "Alertas de segurança"], ["alegacoes.html", "Alegações"], ["duracao.html", "Duração e armazenamento"], ["consulta.html", "Levar ao médico"]]],
  ["🎓 Aprender", [["aprender.html", "Aprender"], ["quiz.html", "Quiz"], ["quiz-familias.html", "Quiz por família"], ["leituras.html", "Leituras recomendadas"]]],
  ["ℹ️ Sobre o guia", [["novidades.html", "Novidades"], ["mudancas.html", "O que mudou"], ["revisao.html", "Atualizações automáticas"], ["sobre.html", "Sobre"], ["index.html#fontes", "Fontes"]]],
];
const NAV = [
  ["index.html", "Catálogo"],
  ["comparar.html", "Comparar"],
  ["aprender.html", "Aprender"],
  ["quiz.html", "Quiz"],
  ["favoritos.html", "Favoritos"],
  ["linha-do-tempo.html", "Linha do tempo"],
  ["novidades.html", "Novidades"],
  ["sobre.html", "Sobre"],
  ["mecanismos.html", "Mecanismos"],
  ["alegacoes.html", "Alegações"],
  ["seguranca.html", "Segurança e legalidade"],
  ["estatisticas.html", "Estatísticas"],
  ["glossario.html", "Glossário"],
  ["calculadora.html", "Calculadora"],
  ["meus-protocolos.html", "Meus protocolos"],
  ["sobre.html#fontes", "Fontes"],
];
const NAV_MAIS = [
  ["alertas.html", "Alertas de segurança"],
  ["mudancas.html", "O que mudou"],
  ["revisao.html", "Atualizações automáticas"],
  ["consulta.html", "Levar ao médico"],
  ["quiz-familias.html", "Quiz por família"],
  ["leituras.html", "Leituras recomendadas"],
  ["grafo.html", "Mapa de conexões"],
  ["buscar.html", "Buscar no guia"],
  ["alvos.html", "Hormônios e alvos"],
  ["corpo.html", "Mapa do corpo"],
  ["interacoes.html", "Interações e cuidados"],
  ["duracao.html", "Duração e armazenamento"],
  ["classes.html", "Comparar classes"],
  ["sinais.html", "Sinais de alerta"],
];
/* Tamanho da fonte e modo leitura são do navegador; limpa preferências antigas. */
try { localStorage.removeItem("fonte"); localStorage.removeItem("leitura"); } catch { /* ignora */ }
document.documentElement.classList.remove("leitura");

/* Boas-vindas na primeira visita (3 passos, pode pular; reabre em "Como usar") */
const ONB_PASSOS = [
  ["👋 Bem-vindo(a)!", "Este guia é um material de estudo sobre peptídeos, hormônios, vitaminas e suplementos. Ele explica evidências, riscos e legalidade. Não receita nem indica doses."],
  ["🧭 Como se orientar", "Use a busca no topo para achar qualquer substância. Cada ficha tem selos que mostram a fase de desenvolvimento e a origem do texto. Compare duas substâncias lado a lado quando quiser."],
  ["📒 Suas ferramentas", "A Calculadora converte a dose que o seu médico prescreveu em unidades de seringa. Em Meus protocolos você anota o que usa e recebe alertas de interação. Tudo fica só no seu aparelho."],
];
function iniciarOnboarding(forcar) {
  if (document.getElementById("onb") || (!forcar && localStorage.getItem("onb_v1"))) return;
  let i = 0;
  const box = document.createElement("div");
  box.id = "onb"; box.className = "onb"; box.setAttribute("role", "dialog"); box.setAttribute("aria-modal", "true"); box.setAttribute("aria-labelledby", "onb-t");
  const fim = () => { localStorage.setItem("onb_v1", "1"); box.remove(); document.removeEventListener("keydown", tecla); };
  const tecla = e => {
    if (e.key === "Escape") fim();
    else if (e.key === "Tab") {
      const bs = [...box.querySelectorAll("button")];
      if (!bs.length) return;
      const k = bs.indexOf(document.activeElement), prox = e.shiftKey ? (k <= 0 ? bs.length - 1 : k - 1) : (k + 1) % bs.length;
      e.preventDefault(); bs[prox].focus();
    }
  };
  const desenhar = () => {
    const [t, p] = ONB_PASSOS[i], ultimo = i === ONB_PASSOS.length - 1;
    box.innerHTML = `<div class="onb-cx"><p class="onb-pt">${i + 1} / ${ONB_PASSOS.length}</p><h2 id="onb-t">${tr(t)}</h2><p>${tr(p)}</p>
      <div class="calc-acoes"><button type="button" class="btn btn-prim" id="onb-prox">${ultimo ? tr("Começar") : tr("Próximo")} →</button> <button type="button" class="btn btn-sec" id="onb-pular">${tr("Pular")}</button></div></div>`;
    box.querySelector("#onb-prox").addEventListener("click", () => { if (ultimo) fim(); else { i++; desenhar(); } });
    box.querySelector("#onb-pular").addEventListener("click", fim);
    box.querySelector("#onb-prox").focus();
  };
  document.body.appendChild(box);
  document.addEventListener("keydown", tecla);
  desenhar();
}
/* Busca do topo com sugestões ao digitar (nome ou categoria); Enter abre a busca completa. */
function sugestoesBusca() {
  const form = document.querySelector(".busca-global"), inp = form && form.querySelector("input");
  if (!inp || form.dataset.sug) return;
  form.dataset.sug = "1";
  inp.setAttribute("autocomplete", "off");
  const lista = document.createElement("ul");
  lista.className = "sug-busca";
  lista.id = "sug-busca";
  lista.hidden = true;
  lista.setAttribute("role", "listbox");
  form.appendChild(lista);
  inp.setAttribute("aria-controls", "sug-busca");
  let ativo = -1;
  const norm = s => semAcento(String(s).toLowerCase());
  const fechar = () => { lista.hidden = true; ativo = -1; };
  const marcar = i => {
    const it = [...lista.children];
    it.forEach((li, k) => li.classList.toggle("ativo", k === i));
    ativo = i;
  };
  inp.addEventListener("input", () => {
    const ws = norm(inp.value).split(/\s+/).filter(Boolean);
    if (inp.value.trim().length < 2) return fechar();
    const so = s => s.replace(/[^a-z0-9]/g, "");
    const pts = PEPTIDES.map(p => ({ p, n: norm(p.nome) })).filter(x => ws.every(w => x.n.includes(w) || (so(w).length > 2 && so(x.n).includes(so(w)))));
    pts.sort((a, b) => (b.n.startsWith(ws[0]) ? 1 : 0) - (a.n.startsWith(ws[0]) ? 1 : 0) || a.n.length - b.n.length);
    const cats = !pts.length ? PEPTIDES.filter(p => ws.every(w => norm(p.categoria).includes(w))) : [];
    const itens = pts.slice(0, 7).map(x => `<li role="option"><a href="${esc(urlPeptideo(x.p.nome))}"><b>${esc(x.p.nome)}</b> <small>${esc(tr(x.p.categoria))} · ${esc(tr(x.p.fase))}</small></a></li>`);
    if (cats.length) itens.push(...cats.slice(0, 7).map(p => `<li role="option"><a href="${esc(urlPeptideo(p.nome))}"><b>${esc(p.nome)}</b> <small>${esc(tr(p.categoria))} · ${esc(tr(p.fase))}</small></a></li>`));
    itens.push(`<li role="option" class="sug-todos"><a href="buscar.html?q=${encodeURIComponent(inp.value.trim())}">🔎 ${esc(tr("Ver todos os resultados no guia"))}${pts.length > 7 ? ` (${pts.length}+)` : ""}</a></li>`);
    lista.innerHTML = itens.join("");
    lista.hidden = false;
    ativo = -1;
  });
  inp.addEventListener("keydown", e => {
    const n = lista.children.length;
    if (lista.hidden || !n) return;
    if (e.key === "ArrowDown") { e.preventDefault(); marcar((ativo + 1) % n); }
    else if (e.key === "ArrowUp") { e.preventDefault(); marcar((ativo - 1 + n) % n); }
    else if (e.key === "Enter" && ativo >= 0) { e.preventDefault(); lista.children[ativo].querySelector("a").click(); }
    else if (e.key === "Escape") fechar();
  });
  document.addEventListener("click", e => { if (!form.contains(e.target)) fechar(); });
}
/* Botão flutuante de voltar ao topo, visível depois de rolar a página. */
function botaoTopo() {
  if (document.getElementById("voltar-topo")) return;
  const b = document.createElement("button");
  b.type = "button";
  b.id = "voltar-topo";
  b.hidden = true;
  b.setAttribute("aria-label", tr("Voltar ao topo"));
  b.title = tr("Voltar ao topo");
  b.innerHTML = '<span aria-hidden="true">↑</span> ' + tr("Topo");
  b.addEventListener("click", () => window.scrollTo({ top: 0, behavior: matchMedia("(prefers-reduced-motion:reduce)").matches ? "auto" : "smooth" }));
  document.body.appendChild(b);
  let pendente = false;
  addEventListener("scroll", () => {
    if (pendente) return;
    pendente = true;
    requestAnimationFrame(() => { b.hidden = scrollY < 600; pendente = false; });
  }, { passive: true });
}
/* Barra fina no topo que mostra o quanto da página já foi lida. */
function barraProgresso() {
  if (document.getElementById("progresso-leitura")) return;
  const b = document.createElement("div");
  b.id = "progresso-leitura";
  b.setAttribute("aria-hidden", "true");
  document.body.prepend(b);
  let pendente = false;
  const atualizar = () => {
    const total = document.documentElement.scrollHeight - innerHeight;
    b.style.transform = `scaleX(${total > 0 ? Math.min(1, scrollY / total) : 0})`;
    pendente = false;
  };
  addEventListener("scroll", () => { if (!pendente) { pendente = true; requestAnimationFrame(atualizar); } }, { passive: true });
}
/* Atalhos: "/" ou Ctrl+K focam a busca (do catálogo, se existir; senão a do topo). */
function atalhoBusca() {
  if (window.__atalhoBusca) return;
  window.__atalhoBusca = true;
  document.addEventListener("keydown", e => {
    const digitando = /^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName) || e.target.isContentEditable;
    if (!((e.key === "/" && !digitando && !e.ctrlKey && !e.metaKey && !e.altKey) || ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k"))) return;
    const campo = document.getElementById("busca") || document.querySelector(".busca-global input");
    if (!campo) return;
    e.preventDefault();
    campo.scrollIntoView({ block: "center" });
    campo.focus();
    campo.select();
  });
}
function montarLayout(titulo) {
  setTimeout(sugestoesBusca, 0);
  botaoTopo();
  barraProgresso();
  atalhoBusca();
  if (!window.__menuMaisFecha) {
    window.__menuMaisFecha = true;
    document.addEventListener("click", e => {
      const m = document.querySelector(".nav-mais[open]");
      if (m && !m.contains(e.target)) m.open = false;
    });
    document.addEventListener("keydown", e => {
      const m = document.querySelector(".nav-mais[open]");
      if (e.key === "Escape" && m) { m.open = false; m.querySelector("summary").focus(); }
    });
  }
  const topo = document.getElementById("topo");
  if (topo) {
    topo.innerHTML = `<div class="topo-acoes"><button type="button" id="instalar-app" class="btn btn-pwa" title="Instalar no celular e usar offline">📲 Instalar app</button><button id="tema" type="button" aria-label="Alternar tema">🌓</button></div>
      <a href="index.html" class="logo-marca" aria-label="Guia de Peptídeos: início"><img src="icons/logo.svg" alt="" width="64" height="64" decoding="async"></a>
      <h1><a href="index.html" class="home">${esc(titulo || "Guia de Peptídeos, Hormônios, Suplementos e Medicamentos")}</a></h1>
      <p class="aviso"><span class="aviso-1">⚠️ Conteúdo exclusivamente educativo.</span> <span class="aviso-2">Não é indicação de uso, prescrição nem recomendação médica. Procure sempre um profissional de saúde.</span></p>
      <form class="busca-global" action="buscar.html" role="search"><input type="search" name="q" placeholder="Busque no guia" aria-label="Buscar em todo o guia" autocomplete="off"></form>
      <nav aria-label="Principal">${NAV_PRINCIPAL.map(([h, n]) => `<a href="${h}"${location.pathname.endsWith("/" + h) ? ' aria-current="page"' : ""}>${n}</a>`).join(" ")}
        <details class="nav-mais"><summary>Mais ▾</summary><div class="nav-grupos">${NAV_GRUPOS.map(([g, l]) => `<div><b>${g}</b>${l.map(([h, n]) => `<a href="${h}">${n}</a>`).join("")}</div>`).join("")}</div></details></nav>
      <dialog id="pwa-ajuda" aria-labelledby="pwa-titulo">
        <div class="pwa-dialog">
          <button type="button" class="pwa-fechar" aria-label="Fechar">×</button>
          <h2 id="pwa-titulo">Instalar o guia e acessar offline</h2>
          <p>Abra este site no navegador do aparelho e use a opção de instalação ou de adicionar à tela inicial:</p>
          <ul>
            <li><b>Android:</b> no Chrome, abra o menu ⋮ e escolha “Instalar app” ou “Adicionar à tela inicial”.</li>
            <li><b>iPhone/iPad:</b> no Safari, toque em Compartilhar e escolha “Adicionar à Tela de Início”.</li>
            <li><b>Computador:</b> no Chrome ou Edge, use o ícone de instalação na barra de endereço ou o menu do navegador.</li>
          </ul>
          <p>Para preparar o acesso offline, mantenha o site aberto com internet até o carregamento terminar. Depois, abra o guia pelo ícone instalado. Conteúdos que dependem de serviços externos, como dados ao vivo, podem não atualizar offline.</p>
          <button type="button" class="btn btn-prim pwa-fechar">Entendi</button>
        </div>
      </dialog>`;
    iniciarTraducaoAutomatica(document.getElementById("topo"));
    document.getElementById("tema").addEventListener("click", alternarTema);
    ligarInstalacaoPwa();
    if (localStorage.getItem("notif_ativas_v1") === "1" && !document.getElementById("acomp-semanal")) {
      const s = document.createElement("script"); s.src = "js/notificacoes.js"; s.defer = true; document.head.appendChild(s);
    }
  }
  const main = document.querySelector("main");
  if (main && !main.id) main.id = "principal";
  if (main && !document.querySelector(".pular")) {
    const a = document.createElement("a");
    a.className = "pular"; a.href = location.pathname + location.search + "#principal"; a.textContent = "Pular para o conteúdo";
    document.body.prepend(a);
  }
  const rod = document.getElementById("rodape");
  if (rod) rod.innerHTML = `<p class="mais-links">${NAV_MAIS.map(([h, n]) => `<a href="${h}">${n}</a>`).join(" · ")}</p><a href="privacidade.html">Privacidade e aviso médico</a> · <span>Conteúdo educativo, não é aconselhamento médico.</span> · <a href="sobre.html">Sobre e metodologia</a><p class="credito-desenvolvedor">Desenvolvido por Fagner Felipe Creto Alves</p><p class="direitos-autorais">© ${new Date().getFullYear()} Fagner Felipe Creto Alves. Projeto educativo e não comercial. Uso acadêmico permitido com citação da fonte; uso comercial depende de autorização do autor. <a href="privacidade.html#direitos-autorais">Saiba mais</a></p>`;
  if (!/como-usar|privacidade/.test(location.pathname)) setTimeout(() => iniciarOnboarding(false), 600);
}
/* ---- Dados ao vivo (ClinicalTrials.gov, PubMed, openFDA) ---- */
const TERMO_EN = {
  "Semaglutida": "semaglutide", "Tirzepatida": "tirzepatide", "Ocitocina": "oxytocin",
  "Hormônio do crescimento (somatropina)": "somatropin", "Liraglutida": "liraglutide", "Insulina": "insulin",
  "Teriparatida": "teriparatide", "Tesamorelina": "tesamorelin", "Retatrutida": "retatrutide",
  "Cagrilintida": "cagrilintide", "Survodutida": "survodutide", "Mazdutida": "mazdutide",
  "Pramlintida": "pramlintide", "Setmelanotida": "setmelanotide", "Pegbelfermina": "pegbelfermin",
  "Dasiglucagona": "dasiglucagon", "Sermorelina": "sermorelin", "Hexarelina": "hexarelin",
  "Folistatina-344": "follistatin", "Kisspeptina-10": "kisspeptin", "Gonadorelina (GnRH)": "gonadorelin",
  "Leuprorrelina": "leuprolide", "Octreotida": "octreotide", "Abaloparatida": "abaloparatide",
  "Vosoritida": "vosoritide", "Timosina alfa-1": "thymosin alpha 1", "Cibinetida (ARA-290)": "cibinetide",
  "Larazotida": "larazotide", "Teduglutida": "teduglutide", "Apraglutida": "apraglutide",
  "Zilucoplana": "zilucoplan", "Pegcetacoplana": "pegcetacoplan", "Angiotensina-(1-7)": "angiotensin-(1-7)",
  "Elamipretida (SS-31)": "elamipretide", "Humanina": "humanin", "Davunetida": "davunetide",
  "Bremelanotida (PT-141)": "bremelanotide", "Dermorfina": "dermorphin", "Melitina": "melittin",
  "Nisina": "nisin", "Defensinas humanas": "defensin", "Glutationa": "glutathione", "Carnosina": "carnosine",
  "Ipamorelina / CJC-1295": "ipamorelin", "Melanotan II": "melanotan", "TB-500 (Timosina beta-4)": "thymosin beta 4",
  "GHRP-2 (pralmorelina)": "pralmorelin", "MGF / PEG-MGF": "mechano growth factor",
  "Argireline (acetil hexapeptídeo-8)": "acetyl hexapeptide-8", "Matrixyl (palmitoil pentapeptídeo-4)": "palmitoyl pentapeptide",
  "Epitalon (Epithalon)": "epitalon",
  "Testosterona": "testosterone", "Estradiol": "estradiol", "Progesterona": "progesterone", "Hidrocortisona (cortisol)": "hydrocortisone",
  "DHEA (prasterona)": "prasterone", "Levotiroxina (T4)": "levothyroxine", "Liotironina (T3)": "liothyronine", "Melatonina": "melatonin",
  "Gonadotrofina coriônica (hCG)": "chorionic gonadotropin", "Glucagon": "glucagon", "Calcitonina": "calcitonin", "Desmopressina": "desmopressin",
  "Metreleptina": "metreleptin", "Vitamina D3 (colecalciferol)": "cholecalciferol", "Vitamina B12 (cobalamina)": "cyanocobalamin",
  "Vitamina C (ácido ascórbico)": "ascorbic acid", "Vitamina B6 (piridoxina)": "pyridoxine", "Folato (vitamina B9)": "folic acid",
  "Vitamina K2 (menaquinona)": "menatetrenone", "Vitamina A (retinol)": "retinol", "Vitamina E (tocoferol)": "alpha-tocopherol",
  "Niacina (vitamina B3)": "niacin", "NAD+": "nicotinamide adenine dinucleotide", "NMN (mononucleotídeo de nicotinamida)": "nicotinamide mononucleotide",
  "Nicotinamida ribosídeo (NR)": "nicotinamide riboside",
  "L-carnitina": "L-carnitine",
  "Acetil-L-carnitina": "Acetyl-L-carnitine",
  "Ácido alfa-lipoico": "alpha-lipoic acid",
  "N-acetilcisteína (NAC)": "N-acetylcysteine",
  "Coenzima Q10": "Coenzyme Q10",
  "Creatina": "creatine",
  "Taurina": "taurine",
  "Glicina": "glycine",
  "Ômega-3 (EPA/DHA)": "omega-3 fatty acids EPA DHA",
  "Citicolina": "citicoline",
  "Ergotioneína": "L-ergothioneine",
  "Resveratrol": "resveratrol",
  "Pterostilbeno": "pterostilbene",
  "Urolitina A": "urolithin A",
  "Espermidina": "spermidine",
  "PQQ (pirroloquinolina quinona)": "pyrroloquinoline quinone PQQ",
  "Fisetina": "fisetin",
  "Quercetina": "quercetin",
  "SLU-PP-332": "SLU-PP-332 ERR agonist",
  "5-amino-1MQ": "5-amino-1MQ NNMT inhibitor",
  "Magnésio": "magnesium",
  "Zinco": "zinc",
  "Selênio": "selenium",
  "Ferro": "iron",
  "Tiamina (vitamina B1)": "thiamine",
  "Riboflavina (vitamina B2)": "riboflavin",
  "Biotina (vitamina B7)": "biotin",
  "Exenatida": "exenatide",
  "Lixisenatida": "lixisenatide",
  "Dulaglutida": "dulaglutide",
  "Maridebart cafraglutida (MariTide)": "maridebart cafraglutide",
  "Petrelintida": "petrelintide",
  "Eloralintida": "eloralintide",
  "Orforglipron": "orforglipron",
  "Lanreotida": "lanreotide",
  "Pasireotida": "pasireotide",
  "Vasopressina": "vasopressin",
  "Terlipressina": "terlipressin",
  "Degarelix": "degarelix",
  "Cetrorrelix": "cetrorelix",
  "Triptorrelina": "triptorelin",
  "Goserelina": "goserelin",
  "Bivalirudina": "bivalirudin",
  "Ziconotida": "ziconotide",
  "Linaclotida": "linaclotide",
  "Icatibanto": "icatibant",
  "Enfuvirtida": "enfuvirtide",
  "Difelikefalina": "difelikefalin",
  "Cerebrolisina": "cerebrolysin",
  "Timalina": "thymalin",
  "Timopentina": "thymopentin"
};
const termoEn = nome => TERMO_EN[nome] || nome.replace(/\s*\(.*\)/, "");
const TTL_LIVE = 24 * 60 * 60 * 1000;

async function getJson(url) {
  const r = await fetch(url);
  if (!r.ok) throw new Error(r.status);
  return r.json();
}

async function buscarLive(nome) {
  const t = termoEn(nome);
  const e = encodeURIComponent(t);
  const ct = (extra = "") => getJson(`https://clinicaltrials.gov/api/v2/studies?query.intr=${e}&pageSize=1&countTotal=true${extra}`);
  const pm = (extra = "") => getJson(`https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?db=pubmed&retmode=json&retmax=0&term=${encodeURIComponent(t + "[Title/Abstract]")}${extra}`);
  const fda = fetch(`https://api.fda.gov/drug/drugsfda.json?search=openfda.generic_name:%22${e}%22&limit=1`)
    .then(r => r.status === 404 ? { meta: { results: { total: 0 } } } : r.ok ? r.json() : null).catch(() => null);

  const [total, ph3, ph2, ph1, recrut, ultimo, pmTotal, pmAno, fdaRes] = await Promise.all([
    ct(), ct("&filter.advanced=AREA%5BPhase%5DPHASE3"), ct("&filter.advanced=AREA%5BPhase%5DPHASE2"),
    ct("&filter.advanced=AREA%5BPhase%5DPHASE1"), ct("&filter.overallStatus=RECRUITING"),
    ct("&sort=LastUpdatePostDate%3Adesc&fields=LastUpdatePostDate"), pm(), pm("&datetype=pdat&reldate=365"), fda
  ].map(p => p.catch(() => null)));

  return {
    quando: Date.now(),
    ensaios: total?.totalCount ?? null, fase3: ph3?.totalCount ?? null, fase2: ph2?.totalCount ?? null,
    fase1: ph1?.totalCount ?? null, recrutando: recrut?.totalCount ?? null,
    ultimaAtualizacao: ultimo?.studies?.[0]?.protocolSection?.statusModule?.lastUpdatePostDateStruct?.date ?? null,
    artigos: Number(pmTotal?.esearchresult?.count ?? NaN), artigosAno: Number(pmAno?.esearchresult?.count ?? NaN),
    fdaRegistros: fdaRes?.meta?.results?.total ?? 0, fdaOk: fdaRes !== null
  };
}

let _snapshot, _snapshotSync = null;
async function snapshot() {
  if (_snapshot === undefined) {
    try { _snapshot = await getJson("dados/live-data.json"); } catch { _snapshot = null; }
    _snapshotSync = _snapshot;
  }
  return _snapshot;
}
const TTL_SNAPSHOT = 14 * 24 * 60 * 60 * 1000;

async function obterLive(nome) {
  const chave = "live:" + nome;
  try {
    const c = JSON.parse(localStorage.getItem(chave));
    if (c && Date.now() - c.quando < TTL_LIVE) return c;
  } catch {}
  // Prioriza o arquivo gerado pelo script agendado (evita limites de requisição no navegador)
  const snap = (await snapshot())?.itens?.[slug(nome)];
  if (snap && Date.now() - snap.quando < TTL_SNAPSHOT) return snap;
  const dados = await buscarLive(nome);
  if (dados.ensaios !== null && !isNaN(dados.artigos) && !isNaN(dados.artigosAno)) localStorage.setItem(chave, JSON.stringify(dados));
  return dados;
}
const num = n => (n === null || n === undefined || Number.isNaN(n)) ? "—" : n.toLocaleString(LOCALE);

function htmlLive(p, d) {
  let aviso = "";
  if (d.fdaRegistros > 0 && p.fase !== "Aprovado") {
    aviso = `<p class="alerta">🔔 Há registro na FDA (openFDA) para este princípio ativo, mas o catálogo o marca como "${esc(p.fase)}". Revise o status.</p>`;
  } else if (d.fase3 > 0 && ["Fase 2", "Fase 1", "Pré-clínico (animais)", "In vitro"].includes(p.fase)) {
    aviso = `<p class="alerta">🔔 Há ${num(d.fase3)} ensaio(s) de fase 3 registrado(s), mais avançado que "${esc(p.fase)}". Revise a fase.</p>`;
  }
  return `<div class="live-box">
    <b>📡 Dados ao vivo</b> <small>(consultado em ${new Date(d.quando).toLocaleString(LOCALE)})</small>
    <ul>
      <li>ClinicalTrials.gov: ${num(d.ensaios)} estudos registrados; ${num(d.recrutando)} recrutando; última atualização: ${esc(d.ultimaAtualizacao || "—")}.<br>${chipsFases(d)}</li>
      <li>PubMed: ${num(d.artigos)} artigos (${num(d.artigosAno)} nos últimos 12 meses)</li>
      <li>FDA: ${d.fdaOk ? (d.fdaRegistros > 0 ? `${num(d.fdaRegistros)} registro(s) de medicamento encontrados` : "nenhum medicamento registrado encontrado") : "indisponível"}</li>
    </ul>${aviso}
    <small>Contagens por busca textual no termo "${esc(termoEn(p.nome))}"; podem incluir estudos que apenas citam a substância.</small>
  </div>`;
}

async function carregarLive(el) {
  const box = el.matches(".live") ? el : el.querySelector(".live");
  if (!box || box.dataset.ok) return;
  const p = PEPTIDES.find(x => x.nome === box.dataset.nome);
  box.dataset.ok = "1";
  try {
    box.innerHTML = htmlLive(p, await obterLive(p.nome));
  } catch {
    delete box.dataset.ok;
    box.innerHTML = "<small>Não foi possível consultar os dados ao vivo agora (offline ou limite de requisições).</small>";
  }
}

















/* Tradução automática: o widget do Google fica sempre disponível; o texto só é enviado quando o usuário escolhe um idioma.
   Avisos de segurança e a calculadora ficam de fora (translate="no") para não alterar números e alertas. */
function marcarNaoTraduzir() {
  document.querySelectorAll(".aviso, .aviso-det, .erro-calc, .calc-layout, .alertas-box, .aviso-idioma, #seringa-svg").forEach(e => {
    if (e.getAttribute("translate") !== "no") { e.setAttribute("translate", "no"); e.classList.add("notranslate"); }
  });
}
function iniciarTraducaoAutomatica(topo) {
  if (!topo) return;
  const seletor = document.createElement("div");
  seletor.id = "google_translate_element";
  seletor.className = "nao-imprimir";
  const acoes = topo.querySelector(".topo-acoes");
  if (acoes) acoes.insertBefore(seletor, document.getElementById("tema")); else topo.appendChild(seletor);
  /* Seletor nativo (abre o picker do sistema no celular) que comanda o combo escondido do Google. */
  const IDIOMAS = [["", "🌐 Idioma"], ["pt", "Português"], ["en", "English"], ["es", "Español"], ["fr", "Français"], ["de", "Deutsch"], ["it", "Italiano"], ["nl", "Nederlands"], ["pl", "Polski"], ["ru", "Русский"], ["uk", "Українська"], ["tr", "Türkçe"], ["ar", "العربية"], ["hi", "हिन्दी"], ["zh-CN", "中文"], ["ja", "日本語"], ["ko", "한국어"]];
  const idSel = document.createElement("select");
  idSel.id = "idioma-sel"; idSel.className = "nao-imprimir notranslate"; idSel.setAttribute("translate", "no"); idSel.setAttribute("aria-label", "Idioma / Language");
  idSel.innerHTML = IDIOMAS.map(([c, n]) => `<option value="${c}">${n}</option>`).join("");
  const atual = (document.cookie.match(/googtrans=\/[^/]*\/([^;]+)/) || [])[1];
  if (atual && IDIOMAS.some(i => i[0] === atual)) idSel.value = atual;
  idSel.addEventListener("change", () => {
    const combo = document.querySelector(".goog-te-combo");
    if (!combo) {
      const d = location.hostname, v = idSel.value && idSel.value !== "pt" ? `/pt/${idSel.value}` : "";
      document.cookie = `googtrans=${v}; path=/; max-age=${v ? 31536000 : 0}`; document.cookie = `googtrans=${v}; path=/; domain=${d}; max-age=${v ? 31536000 : 0}`;
      location.reload(); return;
    }
    combo.value = idSel.value === "pt" ? "" : idSel.value;
    combo.dispatchEvent(new Event("change"));
  });
  seletor.before(idSel);
  marcarNaoTraduzir();
  new MutationObserver(() => marcarNaoTraduzir()).observe(document.body, { childList: true, subtree: true });
  window.googleTranslateElementInit = () => new google.translate.TranslateElement({ pageLanguage: "pt", layout: google.translate.TranslateElement.InlineLayout.VERTICAL, autoDisplay: false }, "google_translate_element");
  const s = document.createElement("script");
  s.src = "https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit";
  s.async = true;
  document.head.appendChild(s);
}

// SEO dinamico: atualiza canonical, Open Graph e JSON-LD (substitui os existentes, sem duplicar).
function seoAtualizar(caminho, ld) {
  const raiz = (document.querySelector('meta[name="site-root"]')?.content || location.origin).replace(/\/$/, "");
  const url = raiz + "/" + caminho;
  let c = document.querySelector('link[rel="canonical"]');
  if (!c) { c = document.createElement("link"); c.rel = "canonical"; document.head.appendChild(c); }
  c.href = url;
  const desc = document.querySelector('meta[name="description"]')?.content || "";
  const meta = (prop, v) => {
    let m = document.querySelector(`meta[property="${prop}"]`);
    if (!m) { m = document.createElement("meta"); m.setAttribute("property", prop); document.head.appendChild(m); }
    m.content = v;
  };
  meta("og:title", document.title); meta("og:description", desc); meta("og:url", url);
  document.querySelectorAll('script[data-seo="1"]').forEach(s => s.remove());
  (ld || []).forEach(obj => {
    const s = document.createElement("script");
    s.type = "application/ld+json"; s.dataset.seo = "1";
    s.textContent = JSON.stringify({ "@context": "https://schema.org", ...obj });
    document.head.appendChild(s);
  });
}
function seoNaoIndexar() {
  const m = document.createElement("meta"); m.name = "robots"; m.content = "noindex"; document.head.appendChild(m);
}

/* PWA: instalação nativa quando disponível e instruções para os demais navegadores. */
let _instalarApp = null;
function ligarInstalacaoPwa() {
  const botao = document.getElementById("instalar-app");
  const dialogo = document.getElementById("pwa-ajuda");
  if (!botao || !dialogo || botao.dataset.pwaLigado) return;
  botao.dataset.pwaLigado = "1";
  if (window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone) {
    botao.hidden = true;
  }
  botao.addEventListener("click", async () => {
    if (_instalarApp) {
      const evento = _instalarApp;
      _instalarApp = null;
      try {
        await evento.prompt();
        const escolha = await evento.userChoice;
        if (escolha.outcome === "accepted") botao.hidden = true;
      } catch (erro) {
        console.error("Não foi possível iniciar a instalação do guia.", erro);
        dialogo.showModal();
      }
      return;
    }
    dialogo.showModal();
  });
  dialogo.querySelectorAll(".pwa-fechar").forEach(b => b.addEventListener("click", () => dialogo.close()));
  dialogo.addEventListener("click", e => { if (e.target === dialogo) dialogo.close(); });
}
window.addEventListener("beforeinstallprompt", e => {
  e.preventDefault();
  _instalarApp = e;
  const botao = document.getElementById("instalar-app");
  if (botao) botao.hidden = false;
});
window.addEventListener("appinstalled", () => {
  _instalarApp = null;
  const botao = document.getElementById("instalar-app");
  if (botao) botao.hidden = true;
});
Object.assign(TERMO_EN, {"VIP (peptídeo intestinal vasoativo) / aviptadil": "vasoactive intestinal peptide", "Timogeno (Thymogen)": "thymogen (alpha-glutamyl-tryptophan)", "Cortexina (Cortexin)": "cortexin", "Cortagen": "cortagen (synthetic tetrapeptide)", "Vilon (Lys-Glu)": "vilon (lysyl-glutamate)", "Cartalax": "cartalax", "Livagen": "livagen", "Chonluten": "chonluten", "Ovagen": "ovagen", "Vesugen": "vesugen", "Prostamax": "prostamax", "Crystagen": "crystagen", "Bronchogen": "bronchogen", "Pancragen": "pancragen", "Testagen": "testagen", "Cardiogen": "cardiogen", "DSIP (peptídeo indutor do sono delta)": "delta sleep-inducing peptide", "P21": "P21 peptide", "Noopept (GVS-111, dipeptídeo sintético)": "omberacetam (Noopept; GVS-111)", "Trofinetida (Trofinetide, análogo do GPE)": "trofinetide", "Goralatida (Ac-SDKP)": "N-acetyl-seryl-aspartyl-lysyl-proline (Ac-SDKP)", "Ciclo-His-Pro (cHP)": "cyclo(His-Pro)", "Substância P": "substance P", "Neuropeptídeo Y": "neuropeptide Y", "Orexina-A (hipocretina-1)": "orexin-A (hypocretin-1)", "Galanina": "galanin", "Encefalinas (Met/Leu-encefalina)": "methionine-enkephalin and leucine-enkephalin", "Dinorfina A": "dynorphin A", "Beta-endorfina": "beta-endorphin", "Nociceptina": "nociceptin (orphanin FQ)", "Apamina": "apamin", "Cecropina": "cecropin", "Magainina / Pexiganan": "magainin; pexiganan", "Lactoferricina": "lactoferricin", "Histatina-5": "histatin-5", "Palmitoil tripeptídeo-1 (Pal-GHK)": "palmitoyl tripeptide-1", "Palmitoil tetrapeptídeo-7": "palmitoyl tetrapeptide-7", "Snap-8 (acetil octapeptídeo-3)": "acetyl octapeptide-3", "Acetil tetrapeptídeo-3 (Redensyl)": "acetyl tetrapeptide-3", "Leuphasyl (pentapeptídeo-18)": "pentapeptide-18", "Syn-Ake (dipeptídeo diaminobutiroil benzilamida diacetato)": "dipeptide diaminobutyroyl benzylamide diacetate", "Palmitoil tripeptídeo-5": "palmitoyl tripeptide-5", "Macimorelina": "macimorelin", "Anamorelina": "anamorelin", "Capromorelina": "capromorelin", "Alexamorelina": "alexamorelin", "Ibutamoren (MK-677; não peptideo, secretagogo oral)": "ibutamoren (MK-677)", "Fragmento 176-191 do hormônio do crescimento (HGH Frag)": "human growth hormone fragment 176-191", "IGF-1 DES(1-3)": "des(1-3) IGF-I", "Mecasermina (IGF-1 recombinante)": "mecasermin (recombinant human IGF-1)", "Estrona (E1)": "estrone", "Estriol (E3)": "estriol", "Pregnenolona": "pregnenolone", "Androstenediona": "androstenedione", "Di-hidrotestosterona (DHT)": "dihydrotestosterone", "Nandrolona": "nandrolone", "Oxandrolona": "oxandrolone", "Estanozolol": "stanozolol", "Trembolona": "trenbolone", "Cortisona": "cortisone", "Prednisona": "prednisone", "Dexametasona": "dexamethasone", "Fludrocortisona": "fludrocortisone", "Aldosterona": "aldosterone", "Adrenalina (epinefrina)": "epinephrine", "Noradrenalina (norepinefrina)": "norepinephrine", "Dopamina": "dopamine", "Serotonina (5-HT)": "serotonin", "Prolactina": "prolactin", "FSH (hormônio folículo-estimulante)": "follicle-stimulating hormone", "LH (hormônio luteinizante)": "luteinizing hormone", "TSH (tireotropina)": "thyrotropin alfa", "ACTH / cosintropina": "corticotropin cosyntropin", "Eritropoetina (EPO)": "erythropoietin", "Paratormônio (PTH 1-84)": "parathyroid hormone 1-84", "Cabergolina": "cabergoline", "Bromocriptina": "bromocriptine", "Anastrozol": "anastrozole", "Letrozol": "letrozole", "Tamoxifeno": "tamoxifen", "Clomifeno": "clomiphene citrate", "Enclomifeno": "enclomiphene", "Raloxifeno": "raloxifene", "Finasterida": "finasteride", "Dutasterida": "dutasteride", "Espironolactona": "spironolactone", "Calcitriol (1,25-di-hidroxivitamina D)": "calcitriol", "Tibolona": "tibolone", "Medroxiprogesterona": "medroxyprogesterone acetate", "Drospirenona": "drospirenone", "Etinilestradiol": "ethinylestradiol", "Relaxina (serelaxin)": "relaxin serelaxin", "Metformina": "metformin", "Sulfato de DHEA (DHEA-S)": "dehydroepiandrosterone sulfate", "Vitamina B5 (ácido pantotênico)": "pantothenic acid", "Vitamina K1 (filoquinona)": "phylloquinone", "Vitamina D2 (ergocalciferol)": "ergocalciferol", "Colina": "choline", "Mio-inositol": "myo-inositol", "Cálcio": "calcium", "Potássio": "potassium", "Iodo": "iodine", "Cobre": "copper", "Manganês": "manganese", "Cromo": "chromium", "Boro": "boron", "Lítio (microdoses/orotato)": "lithium orotate", "L-arginina": "L-arginine", "L-citrulina": "L-citrulline", "L-glutamina": "L-glutamine", "Leucina / BCAA": "leucine / branched-chain amino acids", "L-triptofano": "L-tryptophan", "5-HTP": "5-hydroxytryptophan", "L-teanina": "L-theanine", "L-tirosina": "L-tyrosine", "Beta-alanina": "beta-alanine", "HMB (beta-hidroxi-beta-metilbutirato)": "beta-hydroxy beta-methylbutyrate", "GABA": "gamma-aminobutyric acid", "Ashwagandha (Withania somnifera)": "Withania somnifera", "Curcumina": "curcumin", "Berberina": "berberine", "Rhodiola rosea": "Rhodiola rosea", "Ginseng (Panax)": "Panax ginseng", "Maca (Lepidium meyenii)": "Lepidium meyenii", "Tribulus terrestris": "Tribulus terrestris", "Cafeína": "caffeine", "Colágeno hidrolisado": "hydrolyzed collagen", "Probióticos": "probiotics", "Apigenina": "apigenin", "Sulforafano": "sulforaphane", "EGCG (epigalocatequina galato, chá verde)": "epigallocatechin gallate", "Astaxantina": "astaxanthin", "Luteína": "lutein", "Alfa-cetoglutarato": "alpha-ketoglutarate", "Ácido hialurônico": "hyaluronic acid", "Glucosamina": "glucosamine", "Condroitina": "chondroitin sulfate", "Lactoferrina": "lactoferrin", "Rapamicina (sirolimo)": "sirolimus (rapamycin)", "Acarbose": "acarbose", "Éster de cetona (beta-hidroxibutirato)": "ketone ester (beta-hydroxybutyrate)", "Tongkat ali (Eurycoma longifolia)": "Eurycoma longifolia", "Espirulina": "Arthrospira platensis", "Piracetam": "piracetam", "Aniracetam": "aniracetam"});

Object.assign(TERMO_EN, {"Folistatina-315": "follistatin 315", "Ramatercepte (ACE-031)": "ramatercept (ACE-031)", "Adipotide": "adipotide (FTPP)", "Afamelanotida": "afamelanotide", "Melanotan I": "melanotan I (NDP-MSH)", "Carbetocina": "carbetocin", "Ganirrelix": "ganirelix", "Abarelix": "abarelix", "Nafarelina": "nafarelin", "Buserrelina": "buserelin", "Histrelina": "histrelin", "Deslorrelina": "deslorelin", "Efpeglenatida": "efpeglenatide", "Albiglutida": "albiglutide", "Pemvidutida": "pemvidutide", "Cotadutida": "cotadutide (MEDI0382)", "Efinopegdutida": "efinopegdutide (MK-6024)", "Ecnoglutida": "ecnoglutide (XW003)", "Amicretina": "amycretin", "Pegvisomanto": "pegvisomant", "Glepaglutida": "glepaglutide", "Efruxifermina": "efruxifermin", "Pegozafermina": "pegozafermin", "Plecanatida": "plecanatide", "Secretina": "secretin", "Sincalida (CCK-8)": "sincalide (cholecystokinin octapeptide)", "GIP (polipeptídeo insulinotrópico dependente de glicose)": "glucose-dependent insulinotropic polypeptide", "Oxintomodulina": "oxyntomodulin", "PYY(3-36)": "peptide YY 3-36", "Grelina": "ghrelin", "Insulina glargina": "insulin glargine", "Insulina lispro": "insulin lispro", "Insulina asparte": "insulin aspart", "Insulina degludeca": "insulin degludec", "Insulina icodeca": "insulin icodec"});

Object.assign(TERMO_EN, {"Intermedine": "intermedine", "Teprotide": "teprotide", "Endothelin": "endothelin", "Thymosin": "thymosin", "Gastrin": "gastrin", "Cyclosporine": "cyclosporine", "Oxeclosporin": "oxeclosporin", "Saralasin": "saralasin", "Angiotensin Amide": "angiotensin amide", "Bradykinin": "bradykinin", "Seglitide": "seglitide", "Glaspimod": "glaspimod", "Netazepide": "netazepide", "Eptifibatide": "eptifibatide", "Ovemotide": "ovemotide", "Disomotide": "disomotide", "Prazarelix": "prazarelix", "Acyline": "acyline", "Demoxytocin": "demoxytocin", "Peptide T": "peptide t", "Abt-510": "abt-510", "Atosiban": "atosiban", "Gramicidin S": "gramicidin s", "Eledoisin": "eledoisin", "Kisspeptin-10": "kisspeptin-10", "Glucagon-like Peptide Ii": "glucagon-like peptide ii", "Act-1 Peptide": "act-1 peptide", "Calcitonin Eel": "calcitonin eel", "Aldafermin": "aldafermin", "Canoctakin": "canoctakin", "Anpocogin": "anpocogin", "Baloramotide": "baloramotide", "Lonapegsomatropin": "lonapegsomatropin", "Pancreatic Polypeptide": "pancreatic polypeptide", "Fe 203799": "fe 203799", "Sulfomyxin": "sulfomyxin", "Timbetasin": "timbetasin", "Amlisimod": "amlisimod", "C-peptide": "c-peptide", "Tzp-102": "tzp-102", "Navepegritide": "navepegritide", "Eflepedocokin": "eflepedocokin", "Sulfomyxin Free Acid": "sulfomyxin free acid", "Hepalatide": "hepalatide", "Lerodalcibep": "lerodalcibep", "Pegsebrenatide": "pegsebrenatide", "Balixafortide": "balixafortide", "Ea-230": "ea-230", "Ensovibep": "ensovibep", "Motixafortide": "motixafortide", "Selcopintide": "selcopintide", "Lefleuganan": "lefleuganan", "Gersizangitide": "gersizangitide", "Palsucibep Pegol": "palsucibep pegol", "Peceleganan": "peceleganan", "Pezadeftide": "pezadeftide", "Rilunermin": "rilunermin", "Rimtoregtide": "rimtoregtide", "Sudocetaxel Zendusortide": "sudocetaxel zendusortide", "Utreglutide": "utreglutide", "Zendusortide": "zendusortide", "Pegloprastide": "pegloprastide", "Eneboparatide": "eneboparatide", "Elarekibep": "elarekibep", "Ensereptide": "ensereptide", "Palopegteriparatide": "palopegteriparatide", "Pexipepimut-s": "pexipepimut-s", "Polymyxin B": "polymyxin b", "Voclosporin": "voclosporin", "Fequesetide": "fequesetide", "Milpocitide": "milpocitide", "Pimrocktakin (bovine)": "pimrocktakin (bovine)", "Ederimotide": "ederimotide", "Etimumotide": "etimumotide", "Imsamotide": "imsamotide", "Inpegsomatropin": "inpegsomatropin", "Marlumotide": "marlumotide", "Pegtarazimod": "pegtarazimod", "Quazomotide": "quazomotide", "Vorumotide": "vorumotide", "Efpegerglucagon": "efpegerglucagon", "Enavermotide": "enavermotide", "Ganipatide": "ganipatide", "Irucalantide": "irucalantide", "Limaresiquimod": "limaresiquimod", "Lucicebtide": "lucicebtide", "Omramotide": "omramotide", "Oximbomotide": "oximbomotide", "Pegmispotide": "pegmispotide", "Pobrolitide": "pobrolitide", "Sucantomotide": "sucantomotide", "Ucasareotide Dasaroxetan": "ucasareotide dasaroxetan", "Vicatertide": "vicatertide", "Visepegenatide": "visepegenatide", "Zalfermin": "zalfermin", "Zaloganan": "zaloganan", "Zeleciment Basivarsen": "zeleciment basivarsen", "Zelenectide": "zelenectide", "Zelenectide Pevedotin": "zelenectide pevedotin", "Cn-105": "cn-105", "Invopressin": "invopressin", "Dapiglutide": "dapiglutide", "Froniglutide": "froniglutide", "Lsalt Peptide": "lsalt peptide", "Certepetide": "certepetide", "Nisotirostide": "nisotirostide", "Enlicitide Chloride": "enlicitide chloride", "Lead (212pb) Bamzireotide Navoxetan": "lead (212pb) bamzireotide navoxetan", "Lead (212pb) Lapemelanotide Zapixetan": "lead (212pb) lapemelanotide zapixetan", "Azirkitug": "azirkitug", "Bofanglutide": "bofanglutide", "Brivekimig": "brivekimig", "Lorutengitide": "lorutengitide", "Mifomelatide": "mifomelatide", "Olatorepatide": "olatorepatide", "Paluratide": "paluratide", "Sonefpeglutide": "sonefpeglutide", "Vezocolmitide": "vezocolmitide", "Zifogaptide": "zifogaptide", "Amezosvatein": "amezosvatein", "Canvuparatide": "canvuparatide", "Efmedaglutide": "efmedaglutide", "Glemtimbetasin": "glemtimbetasin", "Vensemaglutide": "vensemaglutide", "Xelafaslatide": "xelafaslatide", "Noraramtide": "noraramtide", "Etimupepimut": "etimupepimut", "Imsapepimut": "imsapepimut", "Actinium Ac 225 Dotatate": "actinium ac 225 dotatate", "Enlicitide Decanoate": "enlicitide decanoate", "Spx-101": "spx-101", "Adrenomedullin": "adrenomedullin", "Chf-6467": "chf-6467", "Irl-201104": "irl-201104", "Gelsolin": "gelsolin", "Lead Bamzireotide Navoxetan": "lead bamzireotide navoxetan", "Lead Lapemelanotide Zapixetan": "lead lapemelanotide zapixetan", "Actinium Dotatate": "actinium dotatate", "Enlicitide": "enlicitide", "Protirelin": "protirelin", "Angiotensin Ii": "angiotensin ii", "Cilengitide": "cilengitide", "Efegatran": "efegatran", "Rotigaptide": "rotigaptide", "Nerinetide": "nerinetide", "Telavancin": "telavancin", "Tt-232": "tt-232", "Tyrothricin": "tyrothricin", "Ang1005": "ang1005", "Valspodar": "valspodar", "Bacitracin": "bacitracin", "Lypressin": "lypressin", "Ceruletide": "ceruletide", "Corticorelin Triflutate": "corticorelin triflutate", "Nesiritide": "nesiritide", "Seractide": "seractide", "Ecallantide": "ecallantide", "Bleomycin A6": "bleomycin a6", "Glp-1": "glp-1", "Scy 635": "scy 635", "Omiganan": "omiganan", "Alisporivir": "alisporivir", "Nim811": "nim811", "Selepressin": "selepressin", "Ornipressin": "ornipressin", "Somatostatin": "somatostatin", "Nepadutant": "nepadutant", "Livoletide": "livoletide", "Cosyntropin": "cosyntropin", "Sinapultide": "sinapultide", "Tosactide": "tosactide", "Ularitide": "ularitide", "Amphomycin": "amphomycin", "Tricosactide": "tricosactide", "Norleusactide": "norleusactide", "Teverelix": "teverelix", "Deltibant": "deltibant", "Semparatide": "semparatide", "Avorelin": "avorelin", "Codactide": "codactide", "Aspartocin": "aspartocin", "Carperitide": "carperitide", "Cemadotin": "cemadotin", "Elcatonin": "elcatonin", "Thymocartin": "thymocartin", "Azetirelin": "azetirelin", "Posatirelin": "posatirelin", "Thymotrinan": "thymotrinan", "Triletide": "triletide", "Davalintide": "davalintide", "Dirucotide": "dirucotide", "Efepristin": "efepristin", "Iseganan": "iseganan", "Labradimil": "labradimil", "Ambomycin": "ambomycin", "Thymoctonan": "thymoctonan", "Casokefamide": "casokefamide", "Ebiratide": "ebiratide", "Desglugastrin": "desglugastrin", "Detirelix": "detirelix", "Nonathymulin": "nonathymulin", "Taltirelin": "taltirelin", "Corticorelin": "corticorelin", "Rusalatide": "rusalatide", "Tasidotin": "tasidotin", "Geclosporin": "geclosporin", "Edratide": "edratide", "Icrocaptide": "icrocaptide", "Nemifitide": "nemifitide", "Dulanermin": "dulanermin", "Denenicokin": "denenicokin", "Taspoglutide": "taspoglutide", "Somatosalm": "somatosalm", "Somenopor": "somenopor", "Peforelin": "peforelin", "Sulglicotide": "sulglicotide", "Somagrebove": "somagrebove", "Sometribove": "sometribove", "Plusonermin": "plusonermin", "Ersofermin": "ersofermin", "Elpamotide": "elpamotide", "Lenomorelin": "lenomorelin", "Tertomotide": "tertomotide", "Ozarelix": "ozarelix", "Nepidermin": "nepidermin", "Elsiglutide": "elsiglutide", "Lancovutide": "lancovutide", "Obinepitide": "obinepitide", "Tridecactide": "tridecactide", "Disitertide": "disitertide", "Dumorelin": "dumorelin", "Leconotide": "leconotide", "Mobenakin": "mobenakin", "Delmitide": "delmitide", "Tifuvirtide": "tifuvirtide", "Somavubove": "somavubove", "Sometripor": "sometripor", "Somidobove": "somidobove", "Cenderitide": "cenderitide", "Somalapor": "somalapor", "Somatorelin": "somatorelin", "Sonermin": "sonermin", "Tiplimotide": "tiplimotide", "Anaritide": "anaritide", "Argipressin": "argipressin", "Atexakin": "atexakin", "Amlintide": "amlintide", "Betiatide": "betiatide", "Doreptide": "doreptide", "Gonadotropin, Serum": "gonadotropin, serum", "Murodermin": "murodermin", "Pareptide": "pareptide", "Enviomycin": "enviomycin", "Procalcitonin": "procalcitonin", "Lagatide": "lagatide", "Cargutocin": "cargutocin", "Barusiban": "barusiban", "Nacartocin": "nacartocin", "Lusupultide": "lusupultide", "Capreomycin": "capreomycin", "Arfalasin": "arfalasin", "Metkephamid": "metkephamid", "Pentigetide": "pentigetide", "Montirelin": "montirelin", "Atilmotin": "atilmotin", "Giractide": "giractide", "Argiprestocin": "argiprestocin", "Lutrelin": "lutrelin", "Surotomycin": "surotomycin", "Tecemotide": "tecemotide", "Tigapotide": "tigapotide", "Viomycin": "viomycin", "Benpenolisin": "benpenolisin", "Felypressin": "felypressin", "Sovatelitide": "sovatelitide", "Fertirelin": "fertirelin", "Dalbavancin": "dalbavancin", "Vapreotide": "vapreotide", "Rapastinel": "rapastinel", "Ctce-9908": "ctce-9908", "Zoptarelin Doxorubicin": "zoptarelin doxorubicin", "Tavilermide": "tavilermide", "Fexapotide": "fexapotide", "Modimelanotide": "modimelanotide", "Dolcanatide": "dolcanatide", "Etelcalcetide": "etelcalcetide", "Dusquetide": "dusquetide", "Recanaclotide": "recanaclotide", "Ruclosporin": "ruclosporin", "Fexapotide Triflutate": "fexapotide triflutate", "Murepavadin": "murepavadin", "Pl-8177": "pl-8177", "Forigerimod": "forigerimod", "Alsactide": "alsactide", "Iturelix": "iturelix", "Frakefamide": "frakefamide", "Fluciclatide F 18": "fluciclatide f 18", "Basifungin": "basifungin", "Maraciclatide": "maraciclatide", "Colimecycline": "colimecycline", "Ramorelix": "ramorelix", "Apimostinel": "apimostinel", "Veldoreotide": "veldoreotide", "Reltecimod": "reltecimod", "Pegilodecakin": "pegilodecakin", "Fluciclatide": "fluciclatide", "Ociltide": "ociltide", "Albuvirtide": "albuvirtide", "Amy-101": "amy-101", "Foxy-5": "foxy-5", "Bezisterim": "bezisterim", "Nerofe": "nerofe", "Pl-3994": "pl-3994", "Pz-128": "pz-128", "Brimapitide, C-terminal Acid": "brimapitide, c-terminal acid", "Cbp-501": "cbp-501", "Ser-100": "ser-100", "Trv-120027": "trv-120027", "Atn-161": "atn-161", "Zetomipzomib": "zetomipzomib", "Risuteganib": "risuteganib", "Satoreotide Tetraxetan": "satoreotide tetraxetan", "Satoreotide Trizoxetan": "satoreotide trizoxetan", "Troriluzole": "troriluzole", "Mibenratide": "mibenratide", "Ruxotemitide": "ruxotemitide", "Brimapitide": "brimapitide", "Nogapendekin": "nogapendekin", "Anfibatide": "anfibatide", "Bulevirtide": "bulevirtide", "Dalazatide": "dalazatide", "Onvitrelin Ucalontide": "onvitrelin ucalontide", "Nangibotide": "nangibotide", "Somatrogon": "somatrogon", "Efmitermant": "efmitermant", "Solnatide": "solnatide", "Taldefgrobep": "taldefgrobep", "Aclerastide": "aclerastide", "Avexitide": "avexitide"});

Object.assign(TERMO_EN, {"Penetratin": "penetratin", "Gi Heptapeptide": "gi heptapeptide", "Peptide B27pd": "peptide b27pd", "Anx-042": "anx-042", "Glucagon-like Peptide 1": "glucagon-like peptide 1", "Rusfertide": "rusfertide", "Nendratareotide Uzatansine": "nendratareotide uzatansine", "Zelpultide": "zelpultide", "Bms-686117": "bms-686117", "Pegloxenatide": "pegloxenatide", "Sulanemadlin": "sulanemadlin", "Cobitolimod": "cobitolimod", "Peltopepimut-s": "peltopepimut-s", "Zetomipzomib Maleate": "zetomipzomib maleate", "Bt-5528": "bt-5528", "Tindupepimut": "tindupepimut", "Colulintide": "colulintide", "Fulipiftide": "fulipiftide", "Macupatide": "macupatide", "Alm-201": "alm-201", "Bt-1718": "bt-1718", "Imcy-0098": "imcy-0098", "Lti-03": "lti-03", "Silk Fibroin": "silk fibroin", "Tifalibep": "tifalibep", "G-3215": "g-3215", "Rugecitide": "rugecitide", "Medi-7219": "medi-7219", "Bombesin": "bombesin", "[18f]-fba-a20fmdv2": "[18f]-fba-a20fmdv2", "Spr-741": "spr-741", "Friulimicin B": "friulimicin b", "Fba-a20fmdv2": "fba-a20fmdv2", "Gdc-0152": "gdc-0152", "Tigapotide Triflutate": "tigapotide triflutate", "Mmi-0100": "mmi-0100", "Adh-1": "adh-1", "Px-478": "px-478", "Sor-c13": "sor-c13", "Nbi-6024": "nbi-6024", "Go-203-2c": "go-203-2c"});

Object.assign(TERMO_EN, {"Alfa-Caroteno": "alpha-carotene", "Ômega 9": "omega-9", "Ácido oleico": "oleic acid", "Ácido málico": "malic acid", "Ácido láctico": "lactic acid", "Carotenoide": "carotenoids", "Benfotiamina": "benfotiamine", "Crocetina": "crocetin", "Flavonoide": "flavonoids", "Molibdênio": "molybdenum", "Diosmina": "diosmin", "Inositol": "inositol", "Ácido lipoico": "lipoic acid", "Ácido linoleico": "linoleic acid", "Cisteína": "cysteine", "Hesperidina": "hesperidin", "Crisina": "chrysin", "Flavan-3-ol": "flavanols"});

Object.assign(TERMO_EN, {"Clorofila": "chlorophyll", "Sódio": "sodium", "Ácido esteárico": "stearic acid", "Gamacaroteno": "gamma-carotene", "Selenometionina": "selenomethionine"});

Object.assign(TERMO_EN, {"Pantenol": "panthenol"});

Object.assign(TERMO_EN, {"Ácido graxo": "fatty acids"});

Object.assign(TERMO_EN, {"Pegfilgrastim": "pegfilgrastim", "Denileukin Diftitox": "denileukin diftitox", "Interferon -2b": "interferon -2b", "Etanercept": "etanercept", "Becaplermin": "becaplermin", "Insulin Susp Isophane Semisynthetic Purified": "insulin susp isophane semisynthetic purified", "Rimabotulinumtoxinb": "rimabotulinumtoxinb", "Interferon Gamma-1b": "interferon gamma-1b", "Antithrombin": "antithrombin", "Albumin": "albumin", "Lepirudin": "lepirudin", "Insulin Susp Isophane Beef": "insulin susp isophane beef", "Insulin Aspart Protamine Recombinant": "insulin aspart protamine recombinant", "Insulin Lispro Protamine Recombinant": "insulin lispro protamine recombinant", "Aldesleukin": "aldesleukin", "Alefacept": "alefacept", "Darbepoetin": "darbepoetin", "Choriogonadotropin": "choriogonadotropin", "Interferon -1a": "interferon -1a", "Desirudin": "desirudin", "Lutropin": "lutropin", "Oprelvekin": "oprelvekin", "Peginterferon -2a": "peginterferon -2a", "Interferon -1b": "interferon -1b", "Sargramostim": "sargramostim", "Nomlabofusp": "nomlabofusp", "Lusacomfar": "lusacomfar", "Insulin Efsitora": "insulin efsitora", "Vurolenatide": "vurolenatide", "Melredableukin": "melredableukin", "Englumafusp": "englumafusp", "Retlirafusp": "retlirafusp", "Nanrilkefusp": "nanrilkefusp", "Rezpegaldesleukin": "rezpegaldesleukin", "Oremepermin": "oremepermin", "Erepdekinra": "erepdekinra", "Lunaxafusp": "lunaxafusp", "Xempritolimod": "xempritolimod", "Brenetafusp": "brenetafusp", "Cemavafusp": "cemavafusp", "Efbalropendekin": "efbalropendekin", "Elritercept": "elritercept", "Gulgafafusp": "gulgafafusp", "Sotiburafusp": "sotiburafusp", "Timdarpacept": "timdarpacept", "Vensobafusp": "vensobafusp", "Alsecovatein": "alsecovatein", "Enlicovatein": "enlicovatein", "Laricovatein": "laricovatein", "Riticovatein": "riticovatein", "Selvacovatein": "selvacovatein", "Sorimcovatein": "sorimcovatein", "Tibrecovatein": "tibrecovatein", "Upalsecovatein": "upalsecovatein", "Cibotercept": "cibotercept", "Efercoleukin": "efercoleukin", "Onvapegleukin": "onvapegleukin", "Sifarobocept": "sifarobocept", "Vevoctadekin": "vevoctadekin", "Vimekofusp": "vimekofusp", "Eciskafusp": "eciskafusp", "Ontorpacept": "ontorpacept", "Follitropin Delta": "follitropin delta", "Damoctocog Pegol": "damoctocog pegol", "Turoctocog Pegol": "turoctocog pegol", "Susoctocog": "susoctocog", "Albutrepenonacog": "albutrepenonacog", "Zamubafusp": "zamubafusp", "Opinercept": "opinercept", "Empegfilgrastim": "empegfilgrastim", "Peginterferon Alfacon-2": "peginterferon alfacon-2", "Albipagrastim": "albipagrastim", "Amulirafusp": "amulirafusp", "Ebribafusp": "ebribafusp", "Efimosfermin": "efimosfermin", "Efparepoetin": "efparepoetin", "Etakafusp": "etakafusp", "Invikafusp": "invikafusp", "Lesigercept": "lesigercept", "Lucorafusp": "lucorafusp", "Palverafusp": "palverafusp", "Redalsomatropin": "redalsomatropin", "Vislarafusp": "vislarafusp", "Amtabafusp": "amtabafusp", "Bezeotermin": "bezeotermin", "Efarindodekin": "efarindodekin", "Efdelikofusp": "efdelikofusp", "Efsubaglutide": "efsubaglutide", "Efsudenermin": "efsudenermin", "Efzilonkofusp": "efzilonkofusp", "Larnefpendekin": "larnefpendekin", "Mivalsecovatein": "mivalsecovatein", "Produvofusp": "produvofusp", "Posnafusp": "posnafusp", "Solabafusp": "solabafusp", "Tabirafusp": "tabirafusp", "Tabirafusp Tedromer": "tabirafusp tedromer", "Verenafusp": "verenafusp", "Nogapendekin Inbakicept": "nogapendekin inbakicept", "Coagulation Factor Vii": "coagulation factor vii", "Protein S": "protein s", "Prothrombin": "prothrombin", "Bone Morphogenetic Protein 2": "bone morphogenetic protein 2", "Redasemtide": "redasemtide", "Basic Fibroblast Growth Factor ( )": "basic fibroblast growth factor ( )", "Prothrombin Complex Concentrate": "prothrombin complex concentrate", "Serum Albumin, Recombinant Rice-derived": "serum albumin, recombinant rice-derived", "Mirostipen": "mirostipen", "Anakinra": "anakinra", "Insulin Glulisine": "insulin glulisine", "Thyrotropin": "thyrotropin", "Insulin Susp Isophane Recombinant": "insulin susp isophane recombinant", "Interferon Alfacon-1": "interferon alfacon-1", "Peginterferon -2b": "peginterferon -2b", "Insulin Susp Recombinant": "insulin susp recombinant", "Mecasermin Rinfabate": "mecasermin rinfabate", "Palifermin": "palifermin", "Abatacept": "abatacept", "Rilonacept": "rilonacept", "Aflibercept": "aflibercept", "Atacicept": "atacicept", "Baminercept": "baminercept", "Belatacept": "belatacept", "Pegsunercept": "pegsunercept", "Peginesatide": "peginesatide", "Ocriplasmin": "ocriplasmin", "Briobacept": "briobacept", "Vonicog": "vonicog", "Regramostim": "regramostim", "Tasonermin": "tasonermin", "Teceleukin": "teceleukin", "Onercept": "onercept", "Ovandrotone Albumin": "ovandrotone albumin", "Repifermin": "repifermin", "Pegnartograstim": "pegnartograstim", "Pegaldesleukin": "pegaldesleukin", "Epoetin Epsilon": "epoetin epsilon", "Somfasepor": "somfasepor", "Dapiclermin": "dapiclermin", "Iboctadekin": "iboctadekin", "Mirococept": "mirococept", "Vanutide Cridificar": "vanutide cridificar", "Velafermin": "velafermin", "Parathyroid Hormone": "parathyroid hormone", "Trafermin": "trafermin", "Pegacaristim": "pegacaristim", "Ecogramostim": "ecogramostim", "Celmoleukin": "celmoleukin", "Ardenermin": "ardenermin", "Corifollitropin": "corifollitropin", "Daniplestim": "daniplestim", "Epoetin Gamma": "epoetin gamma", "Lenercept": "lenercept", "Insulin, Globin": "insulin, globin", "Cilmostim": "cilmostim", "Cetermin": "cetermin", "Epoetin Kappa": "epoetin kappa", "Catridecacog": "catridecacog", "Rolipoltide": "rolipoltide", "Turoctocog": "turoctocog", "Epoetin Theta": "epoetin theta", "Rismorelin": "rismorelin", "Sprifermin": "sprifermin", "Insulin Tregopil": "insulin tregopil", "Conbercept": "conbercept", "Somatropin Pegol": "somatropin pegol", "Simoctocog": "simoctocog", "Amilomotide": "amilomotide", "Eptacog (activated)": "eptacog (activated)", "Nonacog Pegol": "nonacog pegol", "Conestat": "conestat", "Liatermin": "liatermin", "Emfilermin": "emfilermin", "Bifarcept": "bifarcept", "Binetrakin": "binetrakin", "Leridistim": "leridistim", "Milodistim": "milodistim", "Mirimostim": "mirimostim", "Garnocestim": "garnocestim", "Muplestim": "muplestim", "Insulin , Extended": "insulin , extended", "Insulin , Prompt": "insulin , prompt", "Interferon": "interferon", "Insulin Argine": "insulin argine", "Interferon -2a": "interferon -2a", "Interferon -n1": "interferon -n1", "Interferon Gamma-1a": "interferon gamma-1a", "Pifonakin": "pifonakin", "Telbermin": "telbermin", "Insulin Peglispro": "insulin peglispro", "Adargileukin": "adargileukin", "Balugrastim": "balugrastim", "Cintredekin Besudotox": "cintredekin besudotox", "Epoetin Zeta": "epoetin zeta", "Eptotermin": "eptotermin", "Lanimostim": "lanimostim", "Radotermin": "radotermin", "Peginterferon -1a": "peginterferon -1a", "Pegmusirudin": "pegmusirudin", "Avotermin": "avotermin", "Alvircept Sudotox": "alvircept sudotox", "Albumin, Aggregated": "albumin, aggregated", "Epoetin Omega": "epoetin omega", "Insulin Defalan": "insulin defalan", "Insulin, Isophane": "insulin, isophane", "Insulin, Neutral": "insulin, neutral", "Insulin [injection], Biphasic": "insulin [injection], biphasic", "Ancestim": "ancestim", "Ilodecakin": "ilodecakin", "Insulin, Dalanated": "insulin, dalanated", "Insulin, Protamine": "insulin, protamine", "Interferon -n3": "interferon -n3", "Edodekin": "edodekin", "Drotrecogin (activated)": "drotrecogin (activated)", "Emoctakin": "emoctakin", "Epoetin Delta": "epoetin delta", "Botulism Antitoxin": "botulism antitoxin", "Lenograstim": "lenograstim", "Molgramostim": "molgramostim", "Moroctocog": "moroctocog", "Dibotermin": "dibotermin", "Nartograstim": "nartograstim", "Coagulation Factor Ix Recombinant": "coagulation factor ix recombinant", "Dalantercept": "dalantercept", "Pegbovigrastim": "pegbovigrastim", "Cimaglermin": "cimaglermin", "Luspatercept": "luspatercept", "Ipafricept": "ipafricept", "Andexanet": "andexanet", "Methoxy Polyethylene Glycol-epoetin": "methoxy polyethylene glycol-epoetin", "Somavaratan": "somavaratan", "Eflapegrastim": "eflapegrastim", "Pegapamodutide": "pegapamodutide", "Nivobotulinumtoxina": "nivobotulinumtoxina", "Tozuleristide": "tozuleristide", "Px-478 Free Base": "px-478 free base", "C1-esterase Inhibitor": "c1-esterase inhibitor", "Efgartigimod": "efgartigimod", "Valanafusp": "valanafusp", "Tagraxofusp": "tagraxofusp", "Abicipar Pegol": "abicipar pegol", "Izokibep": "izokibep", "Darleukin": "darleukin", "Pegteograstim": "pegteograstim", "Zinpentraxin": "zinpentraxin", "Cinrebafusp": "cinrebafusp", "Ropeginterferon -2b": "ropeginterferon -2b", "Modakafusp": "modakafusp", "Cenegermin": "cenegermin", "Botulinum Toxin Type A": "botulinum toxin type a", "Octocog": "octocog", ". .1-proteinase Inhibitor": ". .1-proteinase inhibitor", "Evorpacept": "evorpacept", "Asunercept": "asunercept", "Rasdegafusp": "rasdegafusp", "Efmoroctocog": "efmoroctocog", "Efbemalenograstim": "efbemalenograstim", "Interleukin 15, Recombinant Non-glycosylated": "interleukin 15, recombinant non-glycosylated", "Tebentafusp": "tebentafusp", "Onfekafusp": "onfekafusp", "Bintrafusp": "bintrafusp", "Bizaxofusp": "bizaxofusp", "Efgivanermin": "efgivanermin", "Bempegaldesleukin": "bempegaldesleukin", "Simlukafusp": "simlukafusp", "Valziflocept": "valziflocept", "Efavaleukin": "efavaleukin", "Lipegfilgrastim": "lipegfilgrastim", "Relabotulinumtoxina": "relabotulinumtoxina", "Inbakicept": "inbakicept", "Maveropepimut-s": "maveropepimut-s", "Eftozanermin": "eftozanermin", "Dazodalibep": "dazodalibep", "Gemibotulinumtoxin A": "gemibotulinumtoxin a", "Clervonafusp": "clervonafusp", "Tanfanercept": "tanfanercept", "Batiraxcept": "batiraxcept", "Efepoetin": "efepoetin", "Tividenofusp": "tividenofusp", "Trenibotulinumtoxine": "trenibotulinumtoxine", "Pabinafusp": "pabinafusp", "Efineptakin": "efineptakin", "Eftrenonacog": "eftrenonacog", "Lonoctocog": "lonoctocog", "Rozibafusp": "rozibafusp", "Efmarodocokin": "efmarodocokin", "Idestopoetin": "idestopoetin", "Recifercept": "recifercept", "Pegenzileukin": "pegenzileukin", "Interferon -2b Kinoid": "interferon -2b kinoid", "Goflikicept": "goflikicept", "Maplirpacept": "maplirpacept", "Belzupacap Sarotalocan": "belzupacap sarotalocan", "Pegipanermin": "pegipanermin", "Hemoglobin Sucistil (bovine)": "hemoglobin sucistil (bovine)", "Latikafusp": "latikafusp", "Efocipegtrutide": "efocipegtrutide", "Sozinibercept": "sozinibercept", "Dalutrafusp": "dalutrafusp", "Efanesoctocog": "efanesoctocog", "Mecapegfilgrastim": "mecapegfilgrastim", "Nemvaleukin": "nemvaleukin", "Telitacicept": "telitacicept", "Acazicolcept": "acazicolcept", "Davoceticept": "davoceticept", "Povetacicept": "povetacicept", "Ficerafusp": "ficerafusp"});

Object.assign(TERMO_EN, {"Ulimorelin": "ulimorelin", "Orotirelin": "orotirelin", "Relamorelin": "relamorelin", "Rovatirelin": "rovatirelin", "Danegaptide": "danegaptide", "Muramyl Dipeptide": "muramyl dipeptide", "Murabutide": "murabutide", "Romurtide": "romurtide", "Ilatreotide": "ilatreotide", "Mifamurtide": "mifamurtide", "Defibrotide": "defibrotide", "Gozetotide": "gozetotide", "Pimelautide": "pimelautide", "Temurtide": "temurtide", "Tabilautide": "tabilautide", "Almurtide": "almurtide", "Etarfolatide": "etarfolatide", "Dazdotuftide": "dazdotuftide", "Bevemipretide": "bevemipretide", "Urofollitropin": "urofollitropin", "Albusomatropin": "albusomatropin"});
