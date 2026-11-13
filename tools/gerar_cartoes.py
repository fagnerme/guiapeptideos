"""Gera cartoes de compartilhamento (cards/<slug>.png) e paginas p/<slug>.html com meta Open Graph.
Uso: python tools/gerar_cartoes.py https://seusite.com"""
import re, sys, json, html, unicodedata, pathlib
from PIL import Image, ImageDraw, ImageFont

raiz = pathlib.Path(__file__).resolve().parent.parent
site = (sys.argv[1] if len(sys.argv) > 1 else "https://SEU-DOMINIO.com").rstrip("/")

def slug(nome):
    s = unicodedata.normalize("NFD", nome.lower())
    s = "".join(c for c in s if unicodedata.category(c) != "Mn")
    return re.sub(r"[^a-z0-9]+", "-", s).strip("-")

def lj(f):
    return (raiz / f).read_text(encoding="utf-8-sig")

dados = lj("data.js")
itens = []
for m in re.finditer(r'^P\("([^"]+)",\s*"([^"]*)",\s*"([^"]*)"', dados, re.M):
    itens.append((m.group(1), m.group(2), m.group(3)))
for bloco in re.split(r'^\s*\{\s*$', dados, flags=re.M):
    n = re.search(r'nome: "([^"]+)"', bloco)
    if n:
        c = re.search(r'categoria: "([^"]*)"', bloco)
        f = re.search(r'fase: "([^"]*)"', bloco)
        itens.append((n.group(1), c.group(1) if c else "", f.group(1) if f else "Aprovado"))

extra = lj("data-extra.js")
faz = {m.group(1): m.group(2) for m in re.finditer(r'^"([^"]+)":\s*\["([^"]*)"', extra, re.M)}
auto = set(re.findall(r'^\s*"([^"]+)":\s*\{', lj("aprovacoes.js"), re.M))

def fonte(tam, negrito=False):
    for c in (["C:/Windows/Fonts/arialbd.ttf", "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"] if negrito
              else ["C:/Windows/Fonts/arial.ttf", "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"]):
        try:
            return ImageFont.truetype(c, tam)
        except OSError:
            pass
    return ImageFont.load_default()

CORES = {"Aprovado": "#2e7d32", "Fase 3": "#1565c0", "Fase 2": "#6a1b9a", "Fase 1": "#ef6c00"}

def quebrar(d, texto, f, largura, max_linhas):
    linhas, atual = [], ""
    for w in texto.split():
        t = (atual + " " + w).strip()
        if d.textlength(t, font=f) <= largura:
            atual = t
        else:
            linhas.append(atual); atual = w
    linhas.append(atual)
    if len(linhas) > max_linhas:
        linhas = linhas[:max_linhas]; linhas[-1] = linhas[-1].rstrip(".,; ") + "..."
    return linhas

(raiz / "cards").mkdir(exist_ok=True)
(raiz / "p").mkdir(exist_ok=True)
vistos = set()
for nome, cat, fase in itens:
    s = slug(nome)
    if s in vistos:
        continue
    vistos.add(s)
    if nome in auto or s in auto:
        fase = "Aprovado"
    desc = faz.get(nome, f"Peptídeo da categoria {cat}.")
    img = Image.new("RGB", (1200, 630), "#1f3a5f")
    d = ImageDraw.Draw(img)
    d.text((60, 50), "GUIA EDUCATIVO DE PEPTÍDEOS E HORMÔNIOS", font=fonte(30, True), fill="#9fb8d9")
    d.text((60, 120), nome, font=fonte(76, True), fill="#ffffff")
    cor = next((v for k, v in CORES.items() if fase.startswith(k)), "#546e7a")
    d.rounded_rectangle((60, 230, 60 + d.textlength(fase, font=fonte(34, True)) + 50, 290), 14, fill=cor)
    d.text((85, 238), fase, font=fonte(34, True), fill="#ffffff")
    y = 330
    for linha in quebrar(d, desc, fonte(38), 1080, 4):
        d.text((60, y), linha, font=fonte(38), fill="#e8eef7"); y += 52
    d.text((60, 560), "Conteúdo educativo — não é recomendação médica", font=fonte(28), fill="#9fb8d9")
    img.save(raiz / "cards" / f"{s}.png", optimize=True)

print(f"{len(vistos)} cartoes gerados")