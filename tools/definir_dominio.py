"""Troca o domínio provisório pelo domínio real em todo o site.

Uso:  python tools/definir_dominio.py https://meuguia.com.br
"""
import os
import sys

ANTIGO = "https://SEU-DOMINIO.com"
EXTENSOES = (".html", ".xml", ".txt", ".js", ".json", ".webmanifest", ".md", ".py")

if len(sys.argv) != 2 or not sys.argv[1].startswith(("http://", "https://")):
    sys.exit("Informe o domínio completo, ex.: python tools/definir_dominio.py https://meuguia.com.br")

novo = sys.argv[1].rstrip("/")
raiz = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
total = 0
for pasta, _, arquivos in os.walk(raiz):
    if ".git" in pasta.split(os.sep):
        continue
    for nome in arquivos:
        if not nome.endswith(EXTENSOES) or nome == os.path.basename(__file__):
            continue
        caminho = os.path.join(pasta, nome)
        with open(caminho, encoding="utf8", newline="") as f:
            texto = f.read()
        if ANTIGO in texto:
            with open(caminho, "w", encoding="utf8", newline="") as f:
                f.write(texto.replace(ANTIGO, novo))
            total += 1
print(f"{total} arquivos atualizados para {novo}")
