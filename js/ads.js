/* Configuração de anúncios do Google AdSense. */
const ADS_CONFIG = {
  clientId: "ca-pub-5947360009880377",
  // bloco in-article do painel do AdSense; pode-se criar blocos separados por posição
  slots: { topo: "1778908415", meio: "1778908415", rodape: "1778908415", conteudo: "1778908415" }
};

const CONSENT_KEY = "consent-ads";

function carregarAds() {
  if (!ADS_CONFIG.clientId) return;
  const s = document.createElement("script");
  s.async = true;
  s.crossOrigin = "anonymous";
  s.src = "https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=" + encodeURIComponent(ADS_CONFIG.clientId);
  document.head.appendChild(s);
  document.querySelectorAll(".ad-slot").forEach(el => {
    const slot = ADS_CONFIG.slots[el.dataset.slot];
    if (!slot) return;
    el.innerHTML = `<small class="ad-label">Publicidade</small><ins class="adsbygoogle" style="display:block;text-align:center"
      data-ad-layout="in-article" data-ad-format="fluid"
      data-ad-client="${ADS_CONFIG.clientId}" data-ad-slot="${slot}"></ins>`;
    (window.adsbygoogle = window.adsbygoogle || []).push({});
  });
}

function iniciarConsentimento() {
  if (!ADS_CONFIG.clientId) return;
  const c = localStorage.getItem(CONSENT_KEY);
  if (c === "sim") return carregarAds();
  if (c === "nao") return;
  const b = document.createElement("div");
  b.className = "consent";
  b.innerHTML = `<span>Usamos cookies de publicidade (Google AdSense) para manter o site gratuito. Veja a <a href="privacidade.html">Política de Privacidade</a>.</span>
    <button id="c-sim">Aceitar</button><button id="c-nao">Recusar</button>`;
  document.body.appendChild(b);
  const fechar = v => { localStorage.setItem(CONSENT_KEY, v); b.remove(); if (v === "sim") carregarAds(); };
  b.querySelector("#c-sim").onclick = () => fechar("sim");
  b.querySelector("#c-nao").onclick = () => fechar("nao");
}
iniciarConsentimento();
