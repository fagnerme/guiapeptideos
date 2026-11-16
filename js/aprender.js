montarLayout();

const lidas = new Set(JSON.parse(localStorage.getItem("licoes-lidas") || "[]"));
const salvar = () => localStorage.setItem("licoes-lidas", JSON.stringify([...lidas]));

function desenhar() {
  document.getElementById("licoes").innerHTML = LICOES.map(l => `
    <details class="boas licao" id="${l.id}">
      <summary>${lidas.has(l.id) ? "✅ " : ""}${l.titulo}</summary>
      ${l.html}
      <button type="button" data-id="${l.id}" class="btn">${lidas.has(l.id) ? "Marcar como não lida" : "Marcar como lida"}</button>
    </details>`).join("");
  const pct = Math.round(lidas.size / LICOES.length * 100);
  document.getElementById("barra").style.width = pct + "%";
  document.getElementById("prog-texto").textContent = `${lidas.size} de ${LICOES.length} lições concluídas (${pct}%)`;
}
document.getElementById("licoes").addEventListener("click", e => {
  const b = e.target.closest("button[data-id]");
  if (!b) return;
  const aberto = [...document.querySelectorAll(".licao[open]")].map(d => d.id);
  lidas.has(b.dataset.id) ? lidas.delete(b.dataset.id) : lidas.add(b.dataset.id);
  salvar();
  desenhar();
  aberto.forEach(id => document.getElementById(id).open = true);
});
desenhar();
