montarLayout();
const TERMOS_NOVIDADES = ["retatrutide", "tirzepatide", "semaglutide", "cagrilintide", "survodutide", "mazdutide", "elamipretide",
  "setmelanotide", "BPC-157", "thymosin beta 4", "ipamorelin", "epitalon", "MOTS-c", "FOXO4-DRI", "humanin", "semax", "selank", "LL-37", "apraglutide", "larazotida"];
const alvoNov = document.getElementById("novidades");

async function carregarNovidades() {
  const chave = "novidades-cache";
  try {
    const c = JSON.parse(localStorage.getItem(chave));
    if (c && Date.now() - c.quando < 6 * 60 * 60 * 1000) return c.itens;
  } catch {}
  const term = "(" + TERMOS_NOVIDADES.map(t => `${t}[Title/Abstract]`).join(" OR ") + ")";
  const base = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/";
  const busca = await getJson(`${base}esearch.fcgi?db=pubmed&retmode=json&retmax=25&sort=pub_date&datetype=pdat&reldate=30&term=${encodeURIComponent(term)}`);
  const ids = busca.esearchresult.idlist;
  if (!ids.length) return [];
  const res = (await getJson(`${base}esummary.fcgi?db=pubmed&retmode=json&id=${ids.join(",")}`)).result;
  const itens = ids.map(id => ({ id, titulo: res[id].title, fonte: res[id].source, data: res[id].pubdate, autor: res[id].authors?.[0]?.name || "" }));
  localStorage.setItem(chave, JSON.stringify({ quando: Date.now(), itens }));
  return itens;
}

carregarNovidades().then(itens => {
  alvoNov.innerHTML = itens.length
    ? `<ul class="novidades">${itens.map(a => `<li><a href="https://pubmed.ncbi.nlm.nih.gov/${a.id}/" target="_blank" rel="noopener">${esc(a.titulo)}</a><br><small>${esc(a.fonte)} · ${esc(a.data)}${a.autor ? " · " + esc(a.autor) + " et al." : ""}</small></li>`).join("")}</ul>`
    : "<p>Nenhum artigo encontrado no período.</p>";
}).catch(() => { alvoNov.innerHTML = "<p>Não foi possível consultar o PubMed agora (offline ou limite de requisições). Tente novamente em instantes.</p>"; });
