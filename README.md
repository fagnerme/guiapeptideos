# Guia Educativo de Peptídeos, Hormônios e Suplementos

Site estático (HTML, CSS e JavaScript, sem framework) publicado no GitHub Pages: <https://fagnerme.github.io/guiapeptideos>.
Conteúdo exclusivamente educativo: não é recomendação médica nem sugere doses.

## Recursos
- Catálogo com ~800 itens (peptídeos, hormônios, vitaminas, minerais, suplementos, medicamentos e biológicos), fichas, comparador e busca.
- Espelho de órgãos reguladores, com coleta semanal automática e histórico em "Atualizações automáticas".
- Calculadora (reconstituição e diluição de matéria-prima) e **Meus protocolos** (calendário, estoque, meia-vida).
- App instalável (PWA) com uso offline. Lembretes de aplicação: notificações com o app aberto e agenda `.ics`.
- Dados do usuário ficam só no aparelho (`localStorage`).

## Estrutura
| Pasta | Conteúdo |
|---|---|
| `js/` | Scripts de cada página (`core.js` é o comum: layout, tipos, PWA) |
| `dados/` | Catálogo e complementos (`data.js`, `data-extra.js`, `data-detalhes.js` etc.), coleta (`live-data.json`, `revisao-pendente.js`, `historico.js`) |
| `fichas/` | Uma página HTML por item (gerada) |
| `comparar/`, `cards/` | Páginas de comparação e cartões (gerados) |
| `tools/` | Scripts Python de coleta e geração |
| `.github/workflows/atualizar.yml` | Coleta semanal automática |
| `sw.js` | Service worker (rede primeiro, cache offline). Reescrito pelo build |

## Fluxo de trabalho
1. Edite os dados em `dados/` ou os scripts em `js/`.
2. Gere as páginas: `python tools\build.py` (fichas, sitemap, SEO e `sw.js`).
3. Teste localmente: `python -m http.server 8765` e abra `http://localhost:8765`.
4. Envie ao GitHub (Pull antes, por causa dos commits do bot em `dados/` e `sw.js`) e use Ctrl+F5 para ver a versão nova.

Coleta manual das fontes: `python tools\atualizar.py`, depois `python tools\build.py`.
Os tokens de API (openFDA, NCBI) devem ficar em segredos do GitHub, nunca no código.

- Revisão semanal dos textos por IA (`tools/revisar_ia.py`, Google Gemini gratuito, secret `GEMINI_API_KEY`): publica sem aprovação humana, com travas (sem doses nem instruções de uso, coerência com aprovações oficiais) e histórico em `dados/revisao-ia.json`. Revisa até 18 itens por semana (a cota gratuita é de 20 por dia), priorizando fichas sinalizadas. Sem o secret, o passo é ignorado.

## Para fazer
- Push real para lembretes com o app fechado (servidor Web Push).
- Preencher os IDs de bloco do AdSense em `js/ads.js`.
- Revisar textos dos itens adicionados manualmente, conferindo as fontes.

