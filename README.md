# Guia de Peptídeos, Hormônios, Suplementos e Medicamentos

Site estático (HTML, CSS e JavaScript, sem framework) publicado no GitHub Pages: <https://fagnerme.github.io/guiapeptideos>.
Conteúdo exclusivamente educativo: não é recomendação médica nem sugere doses.

© 2026 Fagner Felipe Creto Alves. Projeto educativo e não comercial. Uso acadêmico permitido com citação do autor e da fonte; uso comercial do conteúdo, do código, do logotipo, dos dados ou da API exige autorização prévia do autor. Dados de terceiros mantêm os termos das fontes originais.

## Recursos
- Catálogo com ~800 itens (peptídeos, hormônios, vitaminas, minerais, suplementos, medicamentos e biológicos), fichas, comparador e busca.
- Espelho de órgãos reguladores, com coleta semanal automática e histórico em "Atualizações automáticas".
- API alfa pública e somente leitura (uso educativo e acadêmico com citação; uso comercial mediante autorização do autor): [documentação](api/index.html), [catálogo JSON](api/v1/catalog.json), [OpenAPI](api/v1/openapi.json).
- Calculadoras em abas (reconstituição, UI ↔ mg e matéria-prima; link direto com `calculadora.html#conv` ou `#raw`, e a página lembra a última aba usada) e **Meus protocolos** (calendário, estoque, meia-vida).
- App instalável (PWA) com uso offline. Lembretes de aplicação: notificações com o app aberto e agenda `.ics`.
- Dados do usuário ficam só no aparelho (`localStorage`).

## Estrutura
| Pasta | Conteúdo |
|---|---|
| `js/` | Scripts de cada página (`core.js` é o comum: layout, tipos, PWA) |
| `dados/` | Catálogo e complementos (`data.js`, `data-extra.js`, `data-detalhes.js` etc.), coleta (`live-data.json`, `revisao-pendente.js`, `historico.js`) |
| `fichas/` | Uma página HTML por item (gerada) |
| `comparar/`, `cards/` | Páginas de comparação e cartões (gerados) |
| `tools/` | Scripts Python de coleta e geração, incluindo a exportação da API v1 |
| `.github/workflows/atualizar.yml` | Coleta semanal automática (actions fixadas por SHA; o Dependabot sugere atualizações) |
| `.github/skills/` | Skills do Copilot (revisão de workflows, acessibilidade, testes no navegador etc.), instaladas do awesome-copilot |
| `sw.js` | Service worker (rede primeiro, cache offline). Reescrito pelo build |

## Fluxo de trabalho
1. Edite os dados em `dados/` ou os scripts em `js/`.
2. Gere as páginas: `python tools\build.py` (fichas, sitemap, SEO e `sw.js`).
3. Teste localmente: `python -m http.server 8765` e abra `http://localhost:8765`.
4. Envie ao GitHub (Pull antes, por causa dos commits do bot em `dados/` e `sw.js`) e use Ctrl+F5 para ver a versão nova.

Coleta manual das fontes: `python tools\atualizar.py`, depois `python tools\build.py`.
Os tokens de API (openFDA, NCBI) devem ficar em segredos do GitHub, nunca no código.
O endpoint da API é um snapshot estático sem SLA. Confira datas e estado de coleta; resultados sem correspondência não provam ausência de aprovação. Termos de reutilização dos dados de terceiros variam por fonte.

## Para fazer
- Push real para lembretes com o app fechado (servidor Web Push).
- Revisão por IA não faz parte da coleta automática; `tools/revisar_ia.py` não é executado pelo workflow.
- Política de segurança de conteúdo (CSP) completa: hoje só `object-src`, `base-uri` e `form-action` estão restritos nas páginas; `script-src` exige testar o AdSense e o Tradutor do Google.
- Preencher os IDs de bloco do AdSense em `js/ads.js`.
- Revisar textos dos itens adicionados manualmente, conferindo as fontes.

