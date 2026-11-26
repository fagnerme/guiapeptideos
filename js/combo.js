const ITENS = PEPTIDES.map(p => { const mc = marcasDe(p); return { s: slug(p.nome), n: p.nome, k: semAcento(p.nome.toLowerCase()), mc, km: mc.map(x => semAcento(x.toLowerCase())), med: !!p._med || mc.length > 0 }; });
/* Campo com busca e sugestões no lugar de um <select> com milhares de opções (que quebra no celular). */
function combo(sel, rotulo, aoMudar, inicial) {
  const w = document.createElement("div"); w.className = "combo";
  w.innerHTML = `<input type="search" class="combo-in" placeholder="${esc(tr("Digite para buscar…"))}" aria-label="${esc(rotulo)}" autocomplete="off" role="combobox" aria-expanded="false"><ul class="combo-lista" role="listbox" hidden></ul>`;
  sel.replaceWith(w);
  const inp = w.querySelector("input"), ul = w.querySelector("ul"), est = { value: inicial || "" };
  if (inicial) { const it = ITENS.find(i => i.s === inicial); if (it) inp.value = it.n; else est.value = ""; }
  let ativo = -1, lista = [];
  const fechar = () => { ul.hidden = true; inp.setAttribute("aria-expanded", "false"); ativo = -1; };
  const marcar = () => ul.querySelectorAll("li").forEach((li, i) => li.classList.toggle("ativa", i === ativo));
  const escolher = it => { est.value = it.s; inp.value = it.n; fechar(); aoMudar(); };
  const listar = () => {
    const q = semAcento(inp.value.trim().toLowerCase());
    if (!q) { fechar(); return; }
    lista = ITENS.filter(i => i.k.startsWith(q)).concat(ITENS.filter(i => !i.k.startsWith(q) && i.k.includes(q))).concat(ITENS.filter(i => !i.k.includes(q) && i.km.some(m => m.includes(q)))).slice(0, 8);
    ul.innerHTML = lista.map((i, n) => `<li role="option" data-i="${n}">${esc(i.n)}${i.med ? " 💊" : ""}${i.k.includes(q) ? "" : ` <small>(${esc(i.mc.find(m => semAcento(m.toLowerCase()).includes(q)) || "")})</small>`}</li>`).join("") || `<li class="combo-vazio">${tr("Nada encontrado")}</li>`;
    ul.hidden = false; inp.setAttribute("aria-expanded", "true"); ativo = -1;
  };
  inp.addEventListener("input", () => { est.value = ""; listar(); aoMudar(); });
  inp.addEventListener("focus", () => { if (inp.value && !est.value) listar(); else inp.select(); });
  inp.addEventListener("blur", () => setTimeout(fechar, 150));
  inp.addEventListener("keydown", e => {
    if (e.key === "ArrowDown" || e.key === "ArrowUp") { e.preventDefault(); if (ul.hidden) listar(); ativo = Math.max(0, Math.min(lista.length - 1, ativo + (e.key === "ArrowDown" ? 1 : -1))); marcar(); }
    else if (e.key === "Enter" && !ul.hidden && lista.length) { e.preventDefault(); escolher(lista[ativo >= 0 ? ativo : 0]); }
    else if (e.key === "Escape") fechar();
  });
  ul.addEventListener("pointerdown", e => { const li = e.target.closest("li[data-i]"); if (li) { e.preventDefault(); escolher(lista[+li.dataset.i]); } });
  return est;
}
