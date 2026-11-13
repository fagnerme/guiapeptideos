/* Seções da ficha ligadas a alvos, interações e duração, e funções compartilhadas pelas páginas de alvos. */
const nomeDe = s => (porSlug(s) || { nome: s }).nome;
const linkPep = s => `<a href="peptideo.html?p=${s}">${esc(nomeDe(s))}</a>`;
const alvosDe = s => Object.entries(ALVOS).filter(([, a]) => a.peps.includes(s));
const orgaosDe = s => [...new Set(alvosDe(s).flatMap(([, a]) => a.orgaos))];
const rotuloFase = s => { const p = porSlug(s); return p ? `<span class="tag ${faseClasse(p.fase)}">${esc(p.fase)}</span>` : ""; };
const listaPeps = a => a.peps.length ? `<ul class="peps-alvo">${a.peps.map(s => `<li>${linkPep(s)} ${rotuloFase(s)}${(a.prop || []).includes(s) ? ' <small>(ação proposta)</small>' : ""}</li>`).join("")}</ul>` : `<p><small>${tr("Nenhuma substância do catálogo age diretamente neste alvo.")}</small></p>`;
const GRAV = { alta: "Atenção alta", media: "Atenção moderada", baixa: "Atenção baixa" };

function htmlAgeEm(p) {
  const s = slug(p.nome), al = alvosDe(s);
  if (!al.length) return "";
  const chips = al.map(([k, a]) => `<a class="chip-alvo${(a.prop || []).includes(s) ? " prop" : ""}" href="alvo.html?a=${k}">${esc(a.nome)}${(a.prop || []).includes(s) ? " (proposto)" : ""}</a>`).join("");
  const org = orgaosDe(s).map(o => `<a class="chip-alvo org" href="corpo.html?o=${o}">${esc(ORGAOS[o])}</a>`).join("");
  return `<section class="boas age-em"><h2>Age em</h2><p>${chips}</p>${org ? `<p><b>Onde no corpo:</b> ${org}</p>` : ""}<p><small>“Proposto” indica que a ação foi sugerida em estudos de laboratório ou animais e não está bem estabelecida em humanos. Toque para ver o que cada hormônio ou alvo faz.</small></p></section>`;
}

function htmlInteracoes(p) {
  const s = slug(p.nome);
  const it = INTERACOES.filter(i => i.peps.includes(s)), cd = CONDICOES.filter(c => c.peps.includes(s));
  const parecidos = [...new Set(alvosDe(s).flatMap(([, a]) => a.peps))].filter(x => x !== s);
  const opostos = [...new Set(alvosDe(s).flatMap(([, a]) => (a.opoe || []).map(([k]) => k)))].filter(k => ALVOS[k]);
  if (!it.length && !cd.length && !parecidos.length && !opostos.length) return "";
  const lis = it.map(i => `<li class="g-${i.g}"><span class="via-tag">${GRAV[i.g]}</span> <b>${esc(i.com)}</b> — ${esc(i.o)}</li>`).join("");
  const lcs = cd.map(c => `<li><b>${esc(c.cond)}</b> — ${esc(c.o)}</li>`).join("");
  return `<section class="boas interacoes"><h2>Interações e cuidados</h2>
    ${lis ? `<h3>Medicamentos</h3><ul class="lista-int">${lis}</ul>` : ""}
    ${lcs ? `<h3>Condições que pedem cuidado</h3><ul class="lista-int">${lcs}</ul>` : ""}
    ${parecidos.length ? `<h3>Agem no mesmo alvo</h3><p>${parecidos.map(linkPep).join(" · ")}</p><p><small>Usar dois itens que ativam o mesmo receptor soma efeitos e riscos. Isso não é recomendação.</small></p>` : ""}
    ${opostos.length ? `<h3>Alvos com efeito contrário</h3><p>${opostos.map(k => `<a href="alvo.html?a=${k}">${esc(ALVOS[k].nome)}</a>`).join(" · ")}</p>` : ""}
    <p><small>Lista educativa, não exaustiva. Informe ao médico tudo o que você usa e leia a bula. <a href="interacoes.html">Ver todas as interações</a> · <a href="sinais.html">Sinais de alerta</a>.</small></p></section>`;
}

const LOG_MIN = Math.log10(0.02), LOG_MAX = Math.log10(400);
const posLog = h => Math.max(2, Math.min(100, (Math.log10(h) - LOG_MIN) / (LOG_MAX - LOG_MIN) * 100));
const barraMeiaVida = h => h == null ? `<span class="mv-vazio">varia / sem dado</span>` : `<span class="mv-barra" title="Escala logarítmica"><i style="width:${posLog(h).toFixed(1)}%"></i></span>`;

function htmlFarmaco(p) {
  const f = FARMACO[slug(p.nome)];
  if (!f) return p.fase === "Aprovado" ? "" : `<section class="boas"><h2>Duração no corpo e armazenamento</h2><p>Sem dado humano estabelecido para este item. Produtos sem registro não têm garantia de pureza nem de condições de armazenamento; veja <a href="seguranca.html">Segurança e legalidade</a>.</p></section>`;
  return `<section class="boas farmaco"><h2>Duração no corpo e armazenamento</h2>
    <p><b>Meia-vida:</b> ${esc(f.txt)}</p><p>${barraMeiaVida(f.h)} <small>escala do mais curto (minutos) ao mais longo (semanas)</small></p>
    <p><b>Armazenamento:</b> ${esc(f.arm)}</p>
    <p><small>Meia-vida é o tempo para o corpo eliminar metade do medicamento; não é o mesmo que a duração do efeito. Valores aproximados: confirme na bula. <a href="duracao.html">Comparar todos</a>.</small></p></section>`;
}
