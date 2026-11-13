"""Gera as páginas HTML simples do site (corpo + scripts). Uso: python tools/gerar_paginas.py
O conteúdo dinâmico fica em <nome>.js; aqui só ficam o esqueleto e os textos fixos."""
import pathlib

raiz = pathlib.Path(__file__).resolve().parent.parent
HEAD = """<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{titulo} — Guia Educativo de Peptídeos, Hormônios e Suplementos</title>
<meta name="description" content="{desc}">
<link rel="manifest" href="manifest.webmanifest">
<meta name="theme-color" content="#1f3a5f">
<link rel="icon" href="icons/icon-192.png">
<link rel="apple-touch-icon" href="icons/icon-192.png">
<link rel="stylesheet" href="style.css">
</head>
<body>
<header id="topo"></header>
<main>
{corpo}
</main>
<footer id="rodape"></footer>
{scripts}
</body>
</html>
"""


def scripts(extra, js):
    base = ["data.js", "data-extra.js"] + extra + ["aprovacoes.js", "core.js", "i18n.js", "i18n-conteudo.js", "i18n-paginas.js", js, "ads.js"]
    return "\n".join(f'<script src="{s}"></script>' for s in base)


PAGINAS = {
    "404": ("Página não encontrada", "Página não encontrada. Use a busca ou volte ao catálogo.",
        """  <h2>Página não encontrada</h2>
  <p class="boas">O endereço que você abriu não existe ou foi movido. Tente a busca no topo ou escolha um caminho abaixo.</p>
  <p class="calc-acoes"><a class="btn btn-prim" href="index.html">📚 Catálogo</a> <a class="btn" href="buscar.html">🔎 Buscar no guia</a> <a class="btn" href="como-usar.html">🧭 Como usar</a></p>""", [], "como-usar404.js"),
    "como-usar": ("Como usar o guia", "Passo a passo de todas as funções do guia: buscar, comparar, calculadora, Meus protocolos, segurança e ajustes.",
        """  <h2>Como usar o guia</h2>
  <p class="boas">Este site é um <b>material de estudo</b>: reúne informações sobre peptídeos, hormônios, vitaminas e suplementos. Ele não receita, não indica doses e não substitui o seu médico. Abaixo está o passo a passo de cada função.</p>

  <section class="boas"><h3>🔎 1. Encontrar uma substância</h3>
    <ol class="passos">
      <li>Na página <a href="index.html">Catálogo</a>, digite o nome na caixa de busca ou use os filtros (fase, categoria, nível de confiança, origem do texto).</li>
      <li>Clique no cartão para abrir a <b>ficha</b>: o que é, mecanismo, evidência, riscos, status regulatório e fontes.</li>
      <li>Na ficha, use ⭐ para guardar nos <a href="favoritos.html">Favoritos</a>, ⚖️ para comparar e 🧒 “Explique fácil” se o texto estiver técnico.</li>
    </ol>
    <p><small>A busca no topo de todas as páginas procura em todo o guia (fichas, glossário, interações).</small></p>
  </section>

  <section class="boas"><h3>🏷️ 2. Entender os selos</h3>
    <ul>
      <li><b>Nível de confiança</b>: resume a fase de desenvolvimento (aprovado, fase 1–3, pré-clínico, in vitro) e a evidência. <u>Não diz que o uso é seguro para você.</u></li>
      <li><b>Origem do texto</b>: mostra se a ficha é um texto educativo ou se veio de uma base de dados (ex.: ChEMBL).</li>
      <li>Ficha sem aprovação como medicamento = não existe dose ou protocolo validado.</li>
    </ul>
  </section>

  <section class="boas"><h3>⚖️ 3. Comparar</h3>
    <ol class="passos">
      <li>Abra <a href="comparar.html">Comparar</a> e escolha duas substâncias (ou clique em ⚖️ dentro de uma ficha).</li>
      <li>Veja lado a lado mecanismo, evidência, riscos e status. Para grupos inteiros, use <a href="classes.html">Comparar classes</a>.</li>
    </ol>
  </section>

  <section class="boas"><h3>🧮 4. Calculadora de seringa</h3>
    <p>Serve só para <b>converter a dose que já foi prescrita</b> em volume e unidades da seringa de insulina U-100.</p>
    <ol class="passos">
      <li>Abra a <a href="calculadora.html">Calculadora</a> (ou clique em 🧮 na ficha: a substância já vem preenchida).</li>
      <li>Informe a quantidade do frasco (mg), o volume de diluente (mL) e a dose da sua prescrição.</li>
      <li>Leia o resultado: quantos mL e quantas unidades puxar na seringa.</li>
      <li>Quer guardar? Escolha a substância e clique em <b>Salvar configuração atual</b>: o cálculo vai para <a href="meus-protocolos.html">Meus protocolos</a>.</li>
    </ol>
  </section>

  <section class="boas"><h3>📒 5. Meus protocolos (diário pessoal)</h3>
    <ol class="passos">
      <li>Abra <a href="meus-protocolos.html">Meus protocolos</a> e clique em <b>Novo protocolo</b> (ou em “Adicionar aos Meus protocolos” dentro de uma ficha).</li>
      <li>Preencha substância, dose, frequência, via e início, exatamente como o profissional orientou.</li>
      <li>No cartão, use <b>Marcar como tomado hoje</b>, pause, conclua ou duplique.</li>
      <li>Confira os <b>Pontos de atenção</b>: duplicidade, interações e itens da mesma família.</li>
      <li>Use <b>Exportar cópia</b> de vez em quando e <b>Copiar resumo</b> / <b>Imprimir</b> para levar à consulta.</li>
    </ol>
    <p class="aviso">🔒 Tudo fica só neste navegador, nada é enviado a servidores. Limpar o histórico do navegador apaga os dados: faça cópias.</p>
  </section>

  <section class="boas"><h3>🛡️ 6. Segurança</h3>
    <ul>
      <li><a href="interacoes.html">Interações e cuidados</a>: o que não combinar.</li>
      <li><a href="sinais.html">Sinais de alerta</a>: quando procurar atendimento.</li>
      <li><a href="alertas.html">Alertas de segurança</a>: recalls oficiais.</li>
      <li><a href="consulta.html">Levar ao médico</a>: roteiro de perguntas para a consulta.</li>
      <li><a href="seguranca.html">Segurança e legalidade</a>: situação regulatória.</li>
    </ul>
  </section>

  <section class="boas"><h3>🎓 7. Aprender</h3>
    <p>Comece por <a href="aprender.html">Aprender</a> (trilhas), teste-se no <a href="quiz.html">Quiz</a> e consulte o <a href="glossario.html">Glossário</a> para termos técnicos.</p>
  </section>

  <section class="boas"><h3>⚙️ 8. Ajustes</h3>
    <ul>
      <li>🌓 alterna tema claro/escuro; <b>A− A+</b> muda o tamanho da letra; 📖 ativa o modo leitura.</li>
      <li>O seletor de idioma traduz o site (Português, English, Español ou outros idiomas pelo tradutor automático).</li>
      <li>O menu <b>Mais ▾</b> agrupa o restante por objetivo: Explorar, Segurança, Aprender e Sobre o guia.</li>
    </ul>
  </section>
  <p><a class="btn btn-prim" href="index.html">← Ir para o catálogo</a> <button type="button" class="btn" id="rever-onb">👋 Rever as boas-vindas</button></p>""", [], "como-usar.js"),
    "alertas": ("Alertas de segurança", "Recalls e alertas de segurança da FDA relacionados aos itens do catálogo, atualizados automaticamente.",
        """  <h2>Alertas de segurança</h2>
  <p>Recalls da FDA de produtos registrados na base pública openFDA nos últimos 3 anos e relacionados a substâncias do catálogo. Alguns alertas envolvem produtos manipulados ou lotes específicos. Para o Brasil, consulte os <a href="https://www.gov.br/anvisa/pt-br/assuntos/fiscalizacao-e-monitoramento" target="_blank" rel="noopener">alertas da Anvisa</a>.</p>
  <p id="resumo-alertas" class="contagem" aria-live="polite"></p>
  <div id="lista-alertas"></div>
  <div class="ad-slot" data-slot="meio"></div>""", [], "alertas.js"),
    "mudancas": ("O que mudou", "Registro público das alterações de fase, aprovação e conteúdo do guia, com data.",
        """  <h2>O que mudou</h2>
  <p>Registro de alterações do guia. Mudanças detectadas automaticamente (aprovações, recalls, novos ensaios de fase 3) aparecem junto com as edições editoriais.</p>
  <p id="aviso-pep" class="contagem"></p>
  <div class="filtros" id="filtro-tipo" role="group" aria-label="Filtrar por tipo"></div>
  <ul id="lista-mudancas" class="mudancas"></ul>
  <div class="ad-slot" data-slot="meio"></div>""", ["data-mudancas.js", "historico.js"], "mudancas.js"),
    "revisao": ("Atualizações automáticas", "Sinais detectados nas fontes oficiais (bulas, revisões, ensaios, aprovações) que pedem revisão do texto das fichas.",
        """  <h2>Atualizações automáticas</h2>
  <p>O guia consulta fontes oficiais toda semana. Quando algo muda (bula atualizada, novo alerta, nova revisão sistemática, nova fase), a ficha entra aqui para o texto ser revisado por uma pessoa. Os textos de mecanismo, benefícios e riscos <b>não são reescritos automaticamente</b>.</p>
  <p id="resumo-revisao" class="contagem" aria-live="polite"></p>
  <div id="lista-revisao"></div>
  <div class="ad-slot" data-slot="meio"></div>""", ["revisoes.js", "revisao-pendente.js"], "revisao.js"),
    "meus-protocolos": ("Meus protocolos", "Diário pessoal para registrar o que você usa: substância, dose, frequência, via, início e observações, com alertas de interação. Fica salvo só no seu aparelho.",
        """  <h2>Meus protocolos</h2>
  <p>Registre aqui o que você usa por orientação profissional: substância, dose, frequência, via e início. Tudo fica <b>só neste aparelho</b> (nada é enviado). Este guia <b>não sugere doses</b>: anote apenas o que o seu médico ou a bula indicaram.</p>
  <details class="boas nao-imprimir como-usar-box" open><summary><b>📖 Como usar (3 passos)</b></summary>
    <ol class="passos"><li>Clique em “Novo protocolo” e preencha como o profissional orientou.</li><li>No cartão, marque “tomado hoje”, pause ou conclua.</li><li>Confira os pontos de atenção e exporte uma cópia de vez em quando.</li></ol></details>
  <p id="prot-vazio" class="boas">Ainda não há protocolos. Comece em “Novo protocolo” ou salve uma configuração a partir da <a href="calculadora.html">calculadora</a>.</p>
  <p id="resumo-prot" class="contagem" aria-live="polite"></p>
  <div class="calc-acoes nao-imprimir"><button type="button" class="btn btn-prim" id="novo">➕ Novo protocolo</button> <a class="btn" href="calculadora.html">🧮 Calculadora</a> <a class="btn" href="consulta.html">🩺 Levar ao médico</a></div>
  <section class="boas nao-imprimir" id="secao-form" hidden>
    <h3 id="form-titulo">Novo protocolo</h3>
    <form id="form-prot" class="prot-formulario">
      <label>Substância <input type="text" id="f-nome" maxlength="120" required autocomplete="off" placeholder="Digite para buscar no catálogo ou escreva livremente"></label>
      <p id="f-dica"></p>
      <label>Dose <input type="number" id="f-dose" min="0" step="any" inputmode="decimal"></label>
      <label>Unidade <select id="f-unid"></select></label>
      <label>Frequência <select id="f-freq"></select></label>
      <label>Via <select id="f-via"></select></label>
      <label>Horário <select id="f-hora"></select></label>
      <label>Início <input type="date" id="f-inicio"></label>
      <label>Fim previsto (opcional) <input type="date" id="f-fim"></label>
      <label>Produto / marca / lote (opcional) <input type="text" id="f-produto" maxlength="120"></label>
      <label>Situação <select id="f-status"></select></label>
      <label>Observações <textarea id="f-obs" rows="3" maxlength="300" placeholder="Ex.: prescrito pelo Dr. X, reação, ajuste combinado"></textarea></label>
      <div class="calc-acoes"><button type="submit" class="btn btn-prim">💾 Salvar</button> <button type="button" class="btn btn-sec" id="f-cancelar">Cancelar</button></div>
    </form>
  </section>
  <div class="seg nao-imprimir" id="abas" role="group" aria-label="Filtrar por situação"></div>
  <div id="lista-prot"></div>
  <div id="alertas-prot"></div>
  <section class="boas nao-imprimir" id="secao-acoes" hidden>
    <h3>Cópia de segurança e compartilhamento</h3>
    <p><small>Como os dados ficam só neste navegador, apagar o histórico do navegador apaga os protocolos. Exporte uma cópia de vez em quando e importe em outro aparelho.</small></p>
    <div class="calc-acoes"><button type="button" class="btn" id="exportar">⬇️ Exportar cópia</button> <label class="btn">⬆️ Importar cópia <input type="file" id="importar" accept="application/json,.json" hidden></label> <button type="button" class="btn" id="copiar-res">📋 Copiar resumo</button> <button type="button" class="btn" id="imprimir">🖨️ Imprimir / PDF</button> <button type="button" class="btn btn-perigo" id="apagar-tudo">🗑️ Apagar tudo</button></div>
    <p id="msg-imp" aria-live="polite"></p>
  </section>
  <div class="aviso">⚠️ Registro pessoal, não prescrição. Em caso de efeito adverso, procure atendimento médico (SAMU 192). Veja também <a href="interacoes.html">Interações e cuidados</a>.</div>
  <div class="ad-slot" data-slot="meio"></div>""", ["data-vias.js", "data-mecanismos.js", "data-interacoes.js"], "protocolos.js"),
    "glossario": ("Glossário", "Glossário de termos sobre peptídeos, hormônios, nutrientes, suplementos e pesquisa clínica, com uma página por termo.",
        """  <h2>Glossário</h2>
  <p>Cada termo tem uma página própria, com substâncias, conceitos e lições relacionados.</p>
  <input id="filtro-gl" type="search" placeholder="Filtrar termos..." aria-label="Filtrar termos">
  <dl id="lista-gl" class="gl-lista"></dl>
  <div class="ad-slot" data-slot="meio"></div>""", [], "glossario.js"),
    "termo": ("Termo do glossário", "Definição de um termo do glossário sobre substâncias do catálogo e pesquisa clínica.",
        """  <nav class="migalhas"><a href="glossario.html">Glossário</a> › <span id="mig-termo"></span></nav>
  <article id="termo-conteudo" class="boas"></article>
  <div class="ad-slot" data-slot="meio"></div>""", ["data-licoes.js", "data-alegacoes.js"], "termo.js"),
    "consulta": ("Levar ao médico", "Gere uma lista de perguntas para a consulta médica a partir das substâncias que você favoritou.",
        """  <h2>Levar ao médico</h2>
  <p class="nao-imprimir">Monte uma lista de perguntas a partir dos seus favoritos, escreva suas anotações e salve em PDF para levar à consulta. As anotações ficam só neste navegador.</p>
  <p class="nao-imprimir"><button type="button" class="btn" id="pdf">🖨️ Salvar em PDF / imprimir</button></p>
  <div id="consulta"></div>""", [], "consulta.js"),
    "quiz-familias": ("Quiz por família", "Quizzes por grupo de substâncias, com certificado de estudo para quem acertar 70% ou mais.",
        """  <h2>Quiz por família</h2>
  <p class="nao-imprimir">Escolha uma família de substâncias. Com 70% ou mais de acertos você pode gerar um certificado de estudo.</p>
  <div id="familias" class="mapa nao-imprimir" role="group" aria-label="Famílias"></div>
  <section id="quiz-area" class="boas nao-imprimir" aria-live="polite"></section>
  <section id="certificado" class="certificado" hidden></section>""", ["data-mecanismos.js"], "quiz-familias.js"),
    "leituras": ("Leituras recomendadas", "Livros e cursos para estudar farmacologia e aprender a ler pesquisa clínica, com divulgação de links de afiliado.",
        """  <h2>Leituras recomendadas</h2>
  <p class="aviso-afiliado" id="aviso-afiliado"></p>
  <div id="lista-leituras" class="grid"></div>
  <div class="ad-slot" data-slot="meio"></div>""", ["data-leituras.js"], "leituras.js"),
    "alvos": ("Hormônios e alvos", "O que cada hormônio e receptor faz no corpo e quais substâncias agem em cada um.",
        """  <h2>Hormônios e alvos</h2>
  <p>As substâncias do catálogo podem agir em hormônios, receptores ou sistemas do corpo. Veja o que cada alvo faz e quais itens atuam nele.</p>
  <input id="filtro-alvo" type="search" placeholder="Filtrar por hormônio, receptor ou substância..." aria-label="Filtrar alvos">
  <div id="lista-alvos" class="grade-alvos"></div>
  <section class="boas"><h3>Efeitos contrários</h3><ul id="opostos"></ul></section>
  <section class="boas"><h3>Substâncias que agem em mais de um alvo</h3><ul id="multialvo"></ul></section>
  <div class="ad-slot" data-slot="meio"></div>""", ["data-alvos.js", "alvos-ui.js"], "alvos.js"),
    "alvo": ("Hormônio ou alvo", "O que faz um hormônio ou receptor e quais substâncias agem nele.",
        """  <nav class="migalhas"><a href="alvos.html">Hormônios e alvos</a> › <span id="mig-alvo"></span></nav>
  <article id="alvo-conteudo"></article>
  <div class="ad-slot" data-slot="meio"></div>""", ["data-alvos.js", "alvos-ui.js"], "alvo.js"),
    "corpo": ("Mapa do corpo", "Toque em um órgão e veja as substâncias do catálogo que agem nele.",
        """  <h2>Mapa do corpo</h2>
  <p>Toque em um órgão para ver os alvos e as substâncias que agem nele.</p>
  <div class="corpo-grade"><svg id="corpo-svg" viewBox="0 0 200 360" role="group" aria-label="Mapa do corpo humano"></svg>
  <div><div id="corpo-botoes" class="filtros"></div><section id="corpo-painel" class="boas" aria-live="polite"></section></div></div>
  <div class="ad-slot" data-slot="meio"></div>""", ["data-alvos.js", "alvos-ui.js"], "corpo.js"),
    "interacoes": ("Interações e cuidados", "Interações com medicamentos e condições que pedem cuidado para as substâncias do catálogo, e um verificador de sobreposição de alvos.",
        """  <h2>Interações e cuidados</h2>
  <p>Resumo educativo, <b>não exaustivo</b>. Informe ao médico e ao farmacêutico tudo o que você usa e leia sempre a bula.</p>
  <section class="boas"><h3>Verificador de sobreposição</h3><p>Escolha dois itens para ver se agem no mesmo alvo ou em alvos contrários.</p>
    <p><select id="va" aria-label="Primeira substância"></select> + <select id="vb" aria-label="Segunda substância"></select></p><div id="vres" aria-live="polite"></div></section>
  <h3>Medicamentos</h3><div id="lista-int"></div>
  <h3>Condições que pedem cuidado</h3><div id="lista-cond"></div>
  <p><a href="sinais.html">Ver sinais de alerta</a></p>
  <div class="ad-slot" data-slot="meio"></div>""", ["data-alvos.js", "data-interacoes.js", "alvos-ui.js"], "interacoes.js"),
    "duracao": ("Duração e armazenamento", "Meia-vida aproximada e armazenamento de medicamentos do catálogo com dados disponíveis.",
        """  <h2>Duração no corpo e armazenamento</h2>
  <p>Meia-vida é o tempo para o corpo eliminar metade do medicamento. Barras em escala logarítmica: de minutos a semanas. Valores aproximados; confirme na bula.</p>
  <div class="tab-rolagem"><table class="tab-res"><thead><tr><th>Substância</th><th>Meia-vida</th><th>Comparativo</th><th>Armazenamento</th></tr></thead><tbody id="tab-dur"></tbody></table></div>
  <p><small>Itens experimentais não têm dados humanos confiáveis e, sem registro, não há garantia de armazenamento adequado.</small></p>
  <div class="ad-slot" data-slot="meio"></div>""", ["data-alvos.js", "data-farmaco.js", "alvos-ui.js"], "duracao.js"),
    "classes": ("Comparar classes", "Compare classes e famílias do catálogo e os alvos relacionados a cada uma.",
        """  <h2>Comparar classes</h2>
  <p>Veja quais alvos cada substância ativa em sua classe ou família.</p>
  <div id="classes-conteudo"></div>
  <div class="ad-slot" data-slot="meio"></div>""", ["data-alvos.js", "alvos-ui.js"], "classes.js"),
    "sinais": ("Sinais de alerta", "Sinais que exigem atendimento médico durante o uso de substâncias, e quando procurar ajuda.",
        """  <h2>Sinais de alerta</h2>
  <p>Em caso de emergência ligue <b>192 (SAMU)</b>. Em crise emocional, <b>CVV 188</b>. Este guia não substitui atendimento médico.</p>
  <div id="lista-sinais"></div>
  <div class="ad-slot" data-slot="meio"></div>""", ["data-alvos.js", "alvos-ui.js"], "sinais.js"),    "calculadora": ("Calculadora de conversão de doses", "Calculadora de reconstituição: converta a dose prescrita em volume e unidades da seringa de insulina U-100.",
        """  <h2>Calculadora de reconstituição e dose</h2>
  <p class="sub-calc">Converta a dose em mg no volume e nas unidades da seringa de insulina U-100.</p>
  <div class="aviso">⚠️ Esta ferramenta só faz <b>conta</b> e não sugere doses: use apenas a dose da <b>sua prescrição ou da bula</b>. Canetas pré-preenchidas (Ozempic, Mounjaro, Wegovy) seguem as instruções da caneta, sem seringa. Confirme com seu médico ou farmacêutico.</div>
  <details class="boas como-usar-box" open><summary><b>📖 Como usar esta calculadora (4 passos)</b></summary>
    <ol class="passos"><li>Informe o frasco: tipo (pó ou solução pronta) e quantidade total (ver rótulo).</li><li>Informe o diluente (mL) e escolha a seringa e a via de aplicação.</li><li>Digite a dose da sua prescrição: o resultado aparece no painel ao lado, em mL e em unidades.</li><li>Para guardar, use “Salvar configuração atual” no fim da página: vai para Meus protocolos.</li></ol></details>
  <section class="boas como-usar-box"><h3>🧠 Como o cálculo funciona</h3>
    <ol><li><b>Concentração</b> = massa do frasco ÷ volume de diluente.</li><li><b>Volume</b> = dose ÷ concentração.</li><li><b>Unidades</b> = volume em mL × 100 (na seringa U-100, 1 mL = 100 unidades).</li></ol>
    <p id="exemplo-calc"></p>
    <p><small>Produtos manipulados ou comprados sem registro podem ter teor diferente do rótulo; veja <a href="seguranca.html">Segurança e legalidade</a>.</small></p></section>
  <p id="calc-ctx" class="calc-ctx" hidden></p>
  <div class="calc-layout">
    <div class="calc-form">
      <section class="calc-card"><h3><span class="passo">1</span> Tipo e conteúdo do frasco</h3>
        <div class="seg" id="ch-tipo" role="group" aria-label="Tipo de frasco"></div>
        <div class="seg" id="ch-unid" role="group" aria-label="Unidade"></div>
        <p class="calc-dica" id="dica-frasco">Quantidade total do frasco</p>
        <div class="chips" id="ch-frasco" role="group" aria-label="Conteúdo do frasco"></div></section>
      <section class="calc-card" id="card-dil"><h3><span class="passo">2</span> Volume de diluente</h3><p class="calc-dica">Água bacteriostática / NaCl</p>
        <div class="chips" id="ch-diluente" role="group" aria-label="Volume de diluente"></div></section>
      <section class="calc-card"><h3><span class="passo">3</span> Seringa e via de aplicação</h3>
        <div class="vias-op" id="ch-via" role="group" aria-label="Via de aplicação"></div>
        <p class="calc-dica" id="dica-via"></p>
        <div class="seringas" id="ch-seringa" role="group" aria-label="Seringa"></div></section>
      <section class="calc-card"><h3><span class="passo">4</span> Dose desejada</h3><p class="calc-dica">Quantidade por aplicação (a da sua prescrição)</p>
        <div class="chips chips-dose" id="ch-dose" role="group" aria-label="Dose desejada"></div>
        <p class="calc-dica calc-dica2">Aplicações por semana (opcional, para estimar quanto dura o frasco)</p>
        <div class="chips" id="ch-freq" role="group" aria-label="Aplicações por semana"></div></section>
    </div>
    <aside class="calc-res" aria-live="polite">
      <p class="rotulo">RESULTADO</p>
      <div id="seringa-svg"></div>
      <p class="rotulo">Volume estimado:</p>
      <div class="destaque" id="destaque">—</div>
      <div id="avisos-calc"></div>
      <div class="mini-grid"><div><span class="rotulo">Concentração</span><b id="r-conc">—</b></div><div><span class="rotulo">Doses no frasco</span><b id="r-doses">—</b></div><div><span class="rotulo">Duração estimada</span><b id="r-dur">—</b></div></div>
      <table class="tab-res" id="tab-doses"><thead><tr><th>Dose</th><th>Volume</th><th id="th-un">Unidades</th></tr></thead><tbody></tbody></table>
      <div class="calc-acoes nao-imprimir"><button type="button" class="btn btn-prim" id="copiar">📋 Copiar resultado</button> <button type="button" class="btn" id="whats">WhatsApp</button> <button type="button" class="btn" id="link">🔗 Copiar link</button> <button type="button" class="btn" id="pdf">🖨️ PDF / imprimir</button> <button type="button" class="btn btn-sec" id="resetar">↺ Recomeçar</button></div>
    </aside>
  </div>
  <section class="boas nao-imprimir" id="prot"><h3>Salvar em “Meus protocolos”</h3>
    <p><small>Escolha a substância e salve: o cálculo vai junto para a sua lista pessoal, onde você acompanha o que está usando. Fica guardado só neste aparelho.</small></p>
    <div class="prot-form"><input type="text" id="prot-nome" maxlength="120" placeholder="Substância (ex.: Semaglutida)" aria-label="Substância do protocolo" autocomplete="off"> <button type="button" class="btn btn-prim" id="prot-salvar">💾 Salvar configuração atual</button></div>
    <p id="prot-ok" hidden>✅ Salvo. <a href="meus-protocolos.html">Ver em Meus protocolos</a></p>
    <ul class="prot-lista" id="prot-lista"></ul>
    <p><a href="meus-protocolos.html">📒 Abrir Meus protocolos</a></p></section>
  <section class="boas nao-imprimir" id="conv"><h3>Conversor entre UI e mg</h3>
    <p>Alguns produtos (hCG, hormônio do crescimento, insulina, vitaminas) trazem a dose em <b>UI</b> (unidades internacionais) e outros em <b>mg</b>. Esta ferramenta converte de um para o outro, usando a <b>potência</b> do produto.</p>
    <ol class="passos conv-passos">
      <li><b>O que você tem?</b> <span class="seg" role="group" aria-label="Direção da conversão"><button type="button" class="seg-op" id="conv-d-ui" aria-pressed="true">Tenho UI → quero mg</button><button type="button" class="seg-op" id="conv-d-mg" aria-pressed="false">Tenho mg → quero UI</button></span></li>
      <li><b>Qual a potência?</b> Escolha uma referência ou digite a que está no seu rótulo (UI por mg).
        <div class="conv-form"><label>Referência <select id="conv-ref"></select></label>
        <label>Potência (UI por mg) <input type="number" id="conv-pot" min="0" step="any" inputmode="decimal" placeholder="Ex.: 3"></label></div>
        <p id="conv-ref-nota" class="conv-nota"></p></li>
      <li><b id="conv-q">Quantas UI?</b> <div class="conv-form"><label><span id="conv-lab">Valor em UI</span> <input type="number" id="conv-val" min="0" step="any" inputmode="decimal"></label></div></li>
    </ol>
    <div id="conv-saida" class="conv-saida" aria-live="polite" hidden><span class="conv-big" id="conv-big"></span><span id="conv-conta" class="conv-conta"></span></div>
    <p id="conv-vazio" class="conv-nota">Preencha os passos acima para ver o resultado.</p>
    <p class="conv-nota">⚠️ A potência muda conforme o produto e o fabricante: o rótulo ou a bula sempre prevalecem sobre as referências da lista. Para vitaminas, 1 UI não equivale ao mesmo número de mg em todas as formas.</p></section>
  <div class="ad-slot" data-slot="meio"></div>""", [], "calculadora.js"),
}

for nome, (tit, desc, corpo, extra, js) in PAGINAS.items():
    (raiz / f"{nome}.html").write_text(HEAD.format(titulo=tit, desc=desc, corpo=corpo, scripts=scripts(extra, js)), encoding="utf-8")
print(len(PAGINAS), "páginas geradas")
