montarLayout();
document.getElementById("legenda-selos").innerHTML = Object.values(SELOS).map(s => `<li><span class="selo ${s.classe}">${s.icone} ${s.rotulo}</span></li>`).join("") + Object.values(ORIGENS).map(o => `<li><span class="selo ${o.classe}">${o.icone} ${o.rotulo}</span> <small>${o.dica}</small></li>`).join("");
document.getElementById("fontes-lista").innerHTML = FONTES_REF
  .map(f => `<li><a href="${f.url}" target="_blank" rel="noopener">${esc(f.nome)}</a> — ${esc(f.desc)}</li>`).join("");
