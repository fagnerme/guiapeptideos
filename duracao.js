montarLayout();
const linhasD = Object.entries(FARMACO).sort((a, b) => (b[1].h ?? -1) - (a[1].h ?? -1));
document.getElementById("tab-dur").innerHTML = linhasD.map(([s, f]) => `<tr><td>${linkPep(s)}</td><td>${esc(f.txt)}</td><td class="col-barra">${barraMeiaVida(f.h)}</td><td>${esc(f.arm)}</td></tr>`).join("");
