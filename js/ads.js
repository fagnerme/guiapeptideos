/* Configuração de anúncios. Preencha após a aprovação no Google AdSense. */
const ADS_CONFIG = {
  clientId: "",            // ex.: "ca-pub-1234567890123456"
  slots: { topo: "", meio: "", rodape: "" } // IDs dos blocos criados no painel do AdSense
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
    el.innerHTML = `<small class="ad-label">Publicidade</small><ins class="adsbygoogle" style="display:block"
      data-ad-client="${ADS_CONFIG.clientId}" data-ad-slot="${slot}" data-ad-format="auto" data-full-width-responsive="true"></ins>`;
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
