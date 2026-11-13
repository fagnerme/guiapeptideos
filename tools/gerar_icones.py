import zlib, struct, math, pathlib
def png(tam, caminho):
    fundo, ponto = (31, 58, 95), (255, 255, 255)
    linhas = bytearray()
    for y in range(tam):
        linhas.append(0)
        for x in range(tam):
            u, v = x / tam, y / tam
            cor = fundo
            # três "aminoácidos" ligados (molécula simples)
            for cx, cy, r in ((0.30, 0.65, 0.12), (0.50, 0.38, 0.12), (0.72, 0.62, 0.12)):
                if math.hypot(u - cx, v - cy) < r: cor = ponto
            for (ax, ay), (bx, by) in (((0.30, 0.65), (0.50, 0.38)), ((0.50, 0.38), (0.72, 0.62))):
                dx, dy = bx - ax, by - ay
                t = max(0, min(1, ((u - ax) * dx + (v - ay) * dy) / (dx * dx + dy * dy)))
                if math.hypot(u - (ax + t * dx), v - (ay + t * dy)) < 0.03: cor = ponto
            linhas.extend(cor)
    def bloco(t, d): return struct.pack(">I", len(d)) + t + d + struct.pack(">I", zlib.crc32(t + d))
    dados = b"\x89PNG\r\n\x1a\n" + bloco(b"IHDR", struct.pack(">IIBBBBB", tam, tam, 8, 2, 0, 0, 0)) + bloco(b"IDAT", zlib.compress(bytes(linhas), 9)) + bloco(b"IEND", b"")
    pathlib.Path(caminho).write_bytes(dados)
for t in (192, 512): png(t, f"icons/icon-{t}.png")
