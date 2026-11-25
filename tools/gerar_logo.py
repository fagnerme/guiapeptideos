"""Gera os PNGs da marca (icon-192, icon-512, apple-touch 180 e og-logo 1200x630) a partir de icons/logo.svg.
Uso: python tools/gerar_logo.py   (requer playwright com Edge/Chromium)"""
import pathlib
from playwright.sync_api import sync_playwright

raiz = pathlib.Path(__file__).resolve().parent.parent
svg = (raiz / "icons" / "logo.svg").read_text(encoding="utf-8")
quadrado = svg.replace('rx="116"', 'rx="0"')  # ícones maskable: o sistema aplica a máscara


def pagina(conteudo, w, h, fundo="transparent"):
    return f'<html><body style="margin:0;background:{fundo};width:{w}px;height:{h}px;overflow:hidden">{conteudo}</body></html>'


with sync_playwright() as p:
    try:
        b = p.chromium.launch(channel="msedge")
    except Exception:
        b = p.chromium.launch()
    pg = b.new_page()
    for nome, tam in (("icon-192", 192), ("icon-512", 512), ("apple-touch-icon", 180)):
        pg.set_viewport_size({"width": tam, "height": tam})
        pg.set_content(pagina(f'<div style="width:{tam}px;height:{tam}px">{quadrado}</div>', tam, tam))
        pg.evaluate(f"document.querySelector('svg').setAttribute('width','{tam}');document.querySelector('svg').setAttribute('height','{tam}')")
        pg.screenshot(path=str(raiz / "icons" / f"{nome}.png"))
    pg.set_viewport_size({"width": 1200, "height": 630})
    pg.set_content(pagina(f"""<div style="width:1200px;height:630px;display:flex;align-items:center;justify-content:center;gap:56px;background:linear-gradient(135deg,#eef9fa,#d9f1ee);font-family:'Segoe UI',Arial,sans-serif">
      <div style="width:300px;height:300px;filter:drop-shadow(0 18px 30px rgba(10,95,127,.35))">{svg.replace('<svg ','<svg width="300" height="300" ')}</div>
      <div style="max-width:660px"><div style="font-size:64px;font-weight:800;line-height:1.05;background:linear-gradient(90deg,#0a5f7f,#1fa38a);-webkit-background-clip:text;color:transparent">Peptídeos e Hormônios</div>
      <div style="font-size:40px;color:#10323d;margin-top:14px;font-weight:600">Suplementos e Medicamentos</div>
      <div style="font-size:26px;color:#3b5a64;margin-top:18px">Evidências, riscos e status regulatório, em linguagem clara.</div></div></div>""", 1200, 630))
    pg.screenshot(path=str(raiz / "icons" / "og-logo.png"))
    b.close()
print("logo gerado")
