montarLayout();
const QUESTOES = [
  { tipo: "mc", q: "O que é um peptídeo?", o: ["Uma cadeia curta de aminoácidos", "Um tipo de vitamina", "Um açúcar complexo", "Uma bactéria benéfica"], c: 0, e: "Peptídeos são cadeias curtas de aminoácidos; o limite em relação a proteínas não é rígido." },
  { tipo: "mc", q: "Qual é a função de um receptor hormonal?", o: ["Reconhecer um sinal e iniciar uma resposta celular", "Armazenar vitaminas no sangue", "Impedir toda resposta hormonal", "Transformar qualquer hormônio em proteína"], c: 0, e: "Receptores reconhecem sinais específicos e participam da resposta celular." },
  { tipo: "mc", q: "O que descreve melhor o feedback negativo em um eixo hormonal?", o: ["Uma resposta que ajuda a limitar ou regular o sinal inicial", "Aumento contínuo e sem controle de todos os hormônios", "A ausência de comunicação entre órgãos", "A degradação de vitaminas no intestino"], c: 0, e: "Feedback negativo ajuda a manter a regulação: sinais finais podem reduzir a atividade a montante." },
  { tipo: "mc", q: "O que significa corrigir uma deficiência nutricional?", o: ["Tratar uma necessidade identificada, que não implica benefício de megadoses", "Tomar a maior quantidade possível de um nutriente", "Substituir todos os alimentos por suplementos", "Evitar exames e avaliação clínica"], c: 0, e: "Benefício depende da deficiência e do contexto; excesso também pode fazer mal." },
  { tipo: "mc", q: "Por que vitaminas lipossolúveis exigem atenção especial ao excesso?", o: ["Algumas podem se acumular no organismo", "Elas não têm função biológica", "São sempre eliminadas imediatamente", "Não podem ser obtidas pela alimentação"], c: 0, e: "Vitaminas lipossolúveis podem ser armazenadas; excesso de algumas pode causar toxicidade." },
  { tipo: "mc", q: "O que é um suplemento alimentar?", o: ["Um produto destinado a complementar a alimentação, sujeito a regras próprias", "Um medicamento aprovado automaticamente para tratar doenças", "Um produto sem necessidade de rótulo", "Uma garantia de que não haverá interações"], c: 0, e: "Suplementos são uma categoria distinta de medicamentos; status e alegações dependem das regras locais." },
  { tipo: "mc", q: "O que a evidência atual permite concluir sobre NMN e longevidade?", o: ["Há mecanismos e estudos em investigação, mas não comprovação de reversão do envelhecimento em humanos", "NMN reverte o envelhecimento comprovadamente", "NMN substitui todos os tratamentos", "Não existe qualquer pesquisa sobre NAD+"], c: 0, e: "Mecanismos e biomarcadores não demonstram longevidade ou benefício clínico duradouro." },
  { tipo: "mc", q: "O que significa biodisponibilidade?", o: ["Fração e velocidade com que uma substância chega à circulação ou ao local de ação", "Quantidade escrita em letras grandes no rótulo", "Prazo de validade do produto", "Número de fases de um ensaio"], c: 0, e: "A via e a formulação podem alterar absorção e biodisponibilidade." },
  { tipo: "mc", q: "O que conferir ao ler o rótulo de um suplemento?", o: ["Composição, quantidade por porção, advertências, fabricante e validade", "Apenas a palavra ‘natural’", "Somente as avaliações de clientes", "Apenas a cor da embalagem"], c: 0, e: "Rótulo e advertências ajudam a identificar ingredientes, quantidades e informações do produto." },
  { tipo: "mc", q: "Uma autorização da FDA significa que o produto está aprovado para qualquer uso no Brasil?", o: ["Sim, automaticamente", "Não; jurisdição, produto e indicação precisam ser conferidos nas fontes oficiais", "Sim, se o rótulo disser ‘natural’", "Não existem órgãos reguladores"], c: 1, e: "A autorização é específica à jurisdição, ao produto e às indicações avaliadas; confira a Anvisa para o Brasil." },
  { tipo: "mc", q: "Por que via oral e via injetável não são automaticamente equivalentes?", o: ["Absorção, formulação, exposição e riscos podem diferir", "A via nunca altera a absorção", "Toda substância funciona melhor por injeção", "A via é definida apenas pela embalagem"], c: 0, e: "A via e a formulação fazem parte da evidência e da autorização de cada produto." },
  { tipo: "mc", q: "O que é um estudo in vitro?", o: ["Feito em animais vivos", "Feito em humanos", "Feito em células ou tecidos isolados em laboratório", "Feito apenas em computador"], c: 2, e: "In vitro estuda células ou tecidos fora do organismo; não prova por si só benefício em humanos." },
  { tipo: "mc", q: "Qual característica ajuda a tornar um ensaio clínico mais confiável?", o: ["Depoimentos de usuários", "Randomização e grupo de comparação", "Poucos participantes e sem controle", "Ser divulgado em redes sociais"], c: 1, e: "Randomização e comparação adequada ajudam a reduzir vieses; também se avaliam tamanho, desfechos e métodos." },
  { tipo: "mc", q: "Quem regula medicamentos no Brasil?", o: ["INMETRO", "Anvisa", "Anatel", "Ibama"], c: 1, e: "A Anvisa é a autoridade sanitária brasileira; consulte suas fontes oficiais para o status de produtos." },
  { tipo: "mc", q: "Qual descrição de creatina é mais precisa?", o: ["É pesquisada em diferentes contextos de exercício, não apenas no fisiculturismo", "É um hormônio esteroide", "É necessária para todas as pessoas", "Não pode ter efeitos adversos"], c: 0, e: "A evidência não torna o suplemento necessário nem apropriado para todas as pessoas." },
  { tipo: "mc", q: "O que quer dizer UI em um rótulo?", o: ["Unidade internacional, uma unidade de atividade cuja conversão depende da substância", "Uma massa fixa que sempre equivale ao mesmo número de miligramas", "Uma via de administração", "Uma fase de pesquisa clínica"], c: 0, e: "UI expressa atividade biológica e não corresponde a uma massa universal; consulte a bula ou o rótulo." },
  { tipo: "mc", q: "O que é um eixo hipotálamo-hipófise?", o: ["Um sistema de sinais hormonais entre hipotálamo, hipófise e órgãos-alvo", "Uma lista de vitaminas no rótulo", "Um tipo de suplemento esportivo", "Uma via de administração"], c: 0, e: "O eixo coordena sinais entre estruturas endócrinas e outros órgãos." },
  { tipo: "mc", q: "Qual é uma atitude segura diante de uma promessa de ‘queimador de gordura’?", o: ["Verificar ingredientes, evidências, advertências e possíveis interações em fontes confiáveis", "Assumir que é seguro por ser vendido sem receita", "Combinar vários produtos para aumentar o efeito", "Ignorar o rótulo se houver depoimentos"], c: 0, e: "A categoria é heterogênea; marketing não substitui avaliação de composição, evidência e riscos." },
  { tipo: "mv", q: "Todo peptídeo é seguro por ser ‘natural’.", o: ["Verdade", "Mito"], c: 1, e: "Mito. Origem natural ou semelhança com moléculas do corpo não garante segurança." },
  { tipo: "mv", q: "Resultados em animais comprovam eficácia em humanos.", o: ["Verdade", "Mito"], c: 1, e: "Mito. Estudos em animais ajudam a formular hipóteses, mas não comprovam benefício em pessoas." },
  { tipo: "mv", q: "A semaglutida tem indicações aprovadas para algumas condições, conforme produto e jurisdição.", o: ["Verdade", "Mito"], c: 0, e: "Verdade. A indicação deve ser conferida na bula e na fonte regulatória local." },
  { tipo: "mv", q: "Depoimentos de usuários equivalem a evidência científica de eficácia.", o: ["Verdade", "Mito"], c: 1, e: "Mito. Relatos sem comparação não estabelecem causa e efeito." },
  { tipo: "mv", q: "Suplementos naturais nunca interagem com medicamentos.", o: ["Verdade", "Mito"], c: 1, e: "Mito. Ingredientes podem interagir com medicamentos ou condições de saúde." },
  { tipo: "mv", q: "Tomar mais vitaminas é sempre melhor do que corrigir uma deficiência.", o: ["Verdade", "Mito"], c: 1, e: "Mito. Excesso pode causar efeitos adversos; benefício depende da necessidade e do contexto." },
  { tipo: "mv", q: "Megadoses de vitamina C garantem que uma pessoa não terá resfriado.", o: ["Verdade", "Mito"], c: 1, e: "Mito. Não há garantia de prevenção para a população geral, e doses altas podem causar efeitos adversos." },
  { tipo: "mv", q: "NAD+ e seus precursores já provaram reverter o envelhecimento em humanos.", o: ["Verdade", "Mito"], c: 1, e: "Mito. A hipótese segue em estudo; mecanismos e biomarcadores não comprovam reversão do envelhecimento." },
  { tipo: "mv", q: "Uma via de administração pode mudar a absorção e os riscos de um produto.", o: ["Verdade", "Mito"], c: 0, e: "Verdade. Via, formulação e evidência são específicas de cada produto." },
  { tipo: "mv", q: "Uma aprovação regulatória vale automaticamente para todos os países e usos.", o: ["Verdade", "Mito"], c: 1, e: "Mito. Autorizações são específicas à jurisdição, ao produto e às indicações avaliadas." },
  { tipo: "mv", q: "Creatina é estudada apenas em fisiculturistas.", o: ["Verdade", "Mito"], c: 1, e: "Mito. Há pesquisa em diferentes contextos, embora isso não signifique que seja indicada para todas as pessoas." },
  { tipo: "mv", q: "O rótulo ‘bioidêntico’ prova que um hormônio é mais seguro.", o: ["Verdade", "Mito"], c: 1, e: "Mito. A semelhança estrutural não prova superioridade ou ausência de riscos." },
  { tipo: "mv", q: "‘Apenas para pesquisa’ é garantia de que um produto é seguro para consumo humano.", o: ["Verdade", "Mito"], c: 1, e: "Mito. Essa frase não comprova qualidade, segurança ou autorização para uso humano." },
  { tipo: "mv", q: "A unidade UI corresponde sempre à mesma massa em miligramas para substâncias diferentes.", o: ["Verdade", "Mito"], c: 1, e: "Mito. A conversão depende da substância e de sua atividade; confira a informação oficial específica." },
  { tipo: "mv", q: "Suplementos alimentares e medicamentos têm necessariamente a mesma finalidade regulatória.", o: ["Verdade", "Mito"], c: 1, e: "Mito. São categorias distintas, com regras e finalidades diferentes." },
  { tipo: "mv", q: "A insulina é um hormônio peptídico.", o: ["Verdade", "Mito"], c: 0, e: "Verdade. A insulina é um hormônio formado por cadeias de aminoácidos." }
];

const N = 8;
let modo = "mc", fila = [], i = 0, pontos = 0, respondida = false;
const raiz = document.getElementById("quiz");

function embaralhar(a) { return a.map(v => [Math.random(), v]).sort((x, y) => x[0] - y[0]).map(x => x[1]); }
function melhor(m) { return +localStorage.getItem("quiz-melhor-" + m) || 0; }

function iniciar(m) {
  modo = m;
  fila = embaralhar(QUESTOES.filter(q => q.tipo === m)).slice(0, N);
  i = 0; pontos = 0;
  document.querySelectorAll("[data-modo]").forEach(b => b.setAttribute("aria-pressed", b.dataset.modo === m));
  mostrar();
}

function mostrar() {
  respondida = false;
  if (i >= fila.length) {
    const m = melhor(modo);
    if (pontos > m) localStorage.setItem("quiz-melhor-" + modo, pontos);
    raiz.innerHTML = `<h3>Resultado: ${pontos} de ${fila.length}</h3>
      <p>Melhor pontuação neste modo: ${Math.max(m, pontos)}/${fila.length}</p>
      <p>${pontos === fila.length ? "Excelente!" : pontos >= fila.length / 2 ? "Bom trabalho! Revise as lições para melhorar." : "Vale revisar a trilha de aprendizado."}</p>
      <button class="btn" id="again">Jogar de novo</button> <a class="btn" href="aprender.html">Ver trilha de aprendizado</a>`;
    document.getElementById("again").onclick = () => iniciar(modo);
    return;
  }
  const q = fila[i];
  raiz.innerHTML = `<p class="contagem">Pergunta ${i + 1} de ${fila.length} · Acertos: ${pontos}</p>
    <h3>${esc(q.q)}</h3>
    <div class="opcoes">${q.o.map((t, k) => `<button class="btn opcao" data-k="${k}">${esc(t)}</button>`).join("")}</div>
    <div id="fb" role="status"></div>`;
}

raiz.addEventListener("click", e => {
  const b = e.target.closest(".opcao");
  if (b && !respondida) {
    respondida = true;
    const q = fila[i], k = +b.dataset.k, ok = k === q.c;
    if (ok) pontos++;
    raiz.querySelectorAll(".opcao").forEach(x => {
      x.disabled = true;
      if (+x.dataset.k === q.c) x.classList.add("certa");
      else if (x === b) x.classList.add("errada");
    });
    document.getElementById("fb").innerHTML = `<p><b>${ok ? "✅ Correto!" : "❌ Não foi dessa vez."}</b> ${esc(q.e)}</p><button class="btn" id="prox">${i + 1 < fila.length ? "Próxima" : "Ver resultado"}</button>`;
    return;
  }
  if (e.target.id === "prox") { i++; mostrar(); }
});
document.querySelectorAll("[data-modo]").forEach(b => b.addEventListener("click", () => iniciar(b.dataset.modo)));
iniciar("mc");
