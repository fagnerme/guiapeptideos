/* Links antigos (ficha-x.html e comparar-a-vs-b.html) passam a apontar para as pastas fichas/ e comparar/. */
const antigo = location.pathname.match(/^(.*\/)(ficha|comparar)-([^/]+\.html)$/);
if (antigo) location.replace(`${antigo[1]}${antigo[2] === "ficha" ? "fichas" : "comparar"}/${antigo[3]}${location.search}${location.hash}`);
else montarLayout();
