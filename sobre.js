montarLayout();
document.getElementById("legenda-selos").innerHTML = Object.values(SELOS).map(s => `<li><span class="selo ${s.classe}">${s.icone} ${s.rotulo}</span></li>`).join("");
