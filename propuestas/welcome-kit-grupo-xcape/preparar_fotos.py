"""Mapea las fotos reales a los huecos del deck y las prepara sobre fondo oscuro."""
import glob, os, shutil
import numpy as np
from PIL import Image, ImageFilter

SRC = sorted(g for g in glob.glob('/home/user/universomerchan/propuestas/welcome-kit-grupo-xcape/fotos/*')
             if g.lower().endswith(('.png', '.jpg', '.jpeg', '.webp')))
OUT = '/tmp/fotos/'
os.makedirs(OUT, exist_ok=True)
for f in glob.glob(OUT + '*.png') + glob.glob(OUT + '*.jpg'):
    os.remove(f)

BG = (10, 11, 13)        # fondo del deck
CANVAS = 1100

# índice 1-based de la lista -> destino en el deck
MAPA = {
    # ---- KLYRO (funda nailon acolchada, vertical) ----
    10: 'kl_front',      # frontal limpio
    11: 'kl_back',       # trasera acolchada en rombo
    8:  'kl_detail',     # detalle bolsillo con cables
    6:  'kl_zone',       # frontal con área de marcaje
    9:  'kl_laptop',     # con portátil dentro
    7:  'kl_life',       # ambiente
    # ---- SWISS PEAK (funda rPET, apaisada) ----
    5:  'sp_front',      # frontal
    4:  'sp_back',       # tres cuartos
    3:  'sp_detail',     # abierta con portátil
    # ---- LIBRETA A5 PU ----
    13: 'ar_front',   # nota: banda del producto para la lámina de bordado

    12: 'ar_open',
    14: 'ar_p_front',    # serigrafía portada
    15: 'ar_p_back',     # serigrafía contraportada
    16: 'ar_p_pad',      # tampografía portada
    # ---- TREZE ----
    25: 'tz_front',      # tres cuartos cerrado
    24: 'tz_detail',     # detalle placa metálica
    23: 'tz_open',       # esquina con hoja levantada, interior crema
    22: 'tz_back',       # detalle lomo y estrías
    21: 'tz_p_up',       # front upper 70x80
    20: 'tz_p_low',      # front lower 85x70
    19: 'tz_plate',      # front plate 45x25
    18: 'tz_p_back',     # back 120x80
    17: 'tz_p_pad',      # front pad 80x40
}
# #1 es una lámina con las 3 posiciones de Swiss Peak -> se recorta en tres
LAMINA_SP = 1


def recorta_fondo(im, umbral=142):
    """Quita el fondo claro conectado a los bordes. Devuelve RGBA."""
    im = im.convert('RGB')
    a = np.asarray(im).astype(np.int16)
    h, w, _ = a.shape
    esquinas = np.array([a[0, 0], a[0, w - 1], a[h - 1, 0], a[h - 1, w - 1]])
    bg = esquinas.mean(axis=0)
    if bg.mean() < 150:          # el fondo no es claro: no recortamos
        return None
    lum = a.mean(axis=2)
    claro = lum >= umbral
    # flood fill desde los bordes (BFS por capas con dilatación booleana)
    alcanzable = np.zeros((h, w), bool)
    alcanzable[0, :] |= claro[0, :]; alcanzable[-1, :] |= claro[-1, :]
    alcanzable[:, 0] |= claro[:, 0]; alcanzable[:, -1] |= claro[:, -1]
    for _ in range(600):
        prev = alcanzable.sum()
        d = alcanzable.copy()
        d[1:, :] |= alcanzable[:-1, :]; d[:-1, :] |= alcanzable[1:, :]
        d[:, 1:] |= alcanzable[:, :-1]; d[:, :-1] |= alcanzable[:, 1:]
        alcanzable = d & claro
        if alcanzable.sum() == prev:
            break
    alpha = np.where(alcanzable, 0, 255).astype(np.uint8)
    out = im.convert('RGBA')
    m = Image.fromarray(alpha).filter(ImageFilter.GaussianBlur(0.7))
    out.putalpha(m)
    bbox = out.getbbox()
    return out.crop(bbox) if bbox else out


def recorta_al_producto(im, pad=0.04):
    """Aísla el bloque visual más alto (el producto) ignorando títulos y textos."""
    a = np.asarray(im.convert('RGB')).astype(np.int16).mean(axis=2)
    h, w = a.shape
    oscuro = a < 120
    dens = oscuro.sum(axis=1) / w
    activo = dens > 0.02
    # agrupar filas activas en bloques contiguos (tolerando huecos de 6 px)
    bloques, ini, hueco = [], None, 0
    for y in range(h):
        if activo[y]:
            if ini is None:
                ini = y
            hueco = 0
        elif ini is not None:
            hueco += 1
            if hueco > 6:
                bloques.append((ini, y - hueco)); ini = None
    if ini is not None:
        bloques.append((ini, h - 1))
    if not bloques:
        return im
    y0, y1 = max(bloques, key=lambda b: b[1] - b[0])   # el bloque más alto = el producto
    sub = oscuro[y0:y1 + 1]
    colsd = sub.sum(axis=0) / max(1, y1 - y0 + 1)
    cols = np.where(colsd > 0.02)[0]
    x0, x1 = (cols[0], cols[-1]) if len(cols) > 4 else (0, w - 1)
    dx = int((x1 - x0) * pad); dy = int((y1 - y0) * pad)
    return im.crop((max(0, x0 - dx), max(0, y0 - dy),
                    min(w, x1 + dx), min(h, y1 + dy)))


def componer(im, nombre, margen=0.09):
    """Centra el producto sobre el fondo del deck, cuadrado."""
    lienzo = Image.new('RGB', (CANVAS, CANVAS), BG)
    rec = recorta_fondo(im)
    if rec is not None:
        util = int(CANVAS * (1 - 2 * margen))
        k = min(util / rec.size[0], util / rec.size[1])   # escala también hacia arriba
        rec = rec.resize((max(1, int(rec.size[0] * k)), max(1, int(rec.size[1] * k))), Image.LANCZOS)
        x = (CANVAS - rec.size[0]) // 2
        y = (CANVAS - rec.size[1]) // 2
        # sombra suave bajo el producto
        sombra = Image.new('RGBA', (CANVAS, CANVAS), (0, 0, 0, 0))
        s = Image.new('RGBA', rec.size, (0, 0, 0, 130))
        s.putalpha(rec.split()[3].point(lambda v: int(v * 0.55)))
        sombra.paste(s, (x + 6, y + 16), s)
        sombra = sombra.filter(ImageFilter.GaussianBlur(22))
        lienzo = Image.alpha_composite(lienzo.convert('RGBA'), sombra).convert('RGB')
        lienzo.paste(rec, (x, y), rec)
    else:
        # foto de ambiente o fondo no recortable: encaje cuadrado por recorte central
        im = im.convert('RGB')
        w, h = im.size
        lado = min(w, h)
        im = im.crop(((w - lado) // 2, (h - lado) // 2, (w + lado) // 2, (h + lado) // 2))
        lienzo = im.resize((CANVAS, CANVAS), Image.LANCZOS)
    lienzo.save(OUT + nombre + '.jpg', 'JPEG', quality=90, optimize=True)
    return nombre


hechos = []
for idx, nombre in MAPA.items():
    im = Image.open(SRC[idx - 1])
    hechos.append(componer(im, nombre))

# --- lámina del bordado ---
lem = Image.open(SRC[2 - 1]).convert('RGB')
wl, hl = lem.size
componer(recorta_al_producto(lem.crop((0, int(hl * 0.11), wl, int(hl * 0.62)))), 'sp_p_emb', margen=0.06)
hechos.append('sp_p_emb')

# --- lámina de Swiss Peak: tres posiciones en una imagen ---
# se recorta solo la banda del producto (fuera título y caja de texto)
lam = Image.open(SRC[LAMINA_SP - 1]).convert('RGB')
w, h = lam.size
tercio = w // 3
for k, nombre in enumerate(['sp_p_front', 'sp_p_back', 'sp_p_up']):
    trozo = recorta_al_producto(lam.crop((k * tercio, int(h * 0.11), (k + 1) * tercio, int(h * 0.66))))
    componer(trozo, nombre, margen=0.06)
    hechos.append(nombre)

# sp_zone: reutiliza la vista frontal con área
shutil.copy(OUT + 'sp_p_front.jpg', OUT + 'sp_zone.jpg')
hechos.append('sp_zone')
# ar_back y ar_zone
shutil.copy(OUT + 'ar_open.jpg', OUT + 'ar_back.jpg')
shutil.copy(OUT + 'ar_p_front.jpg', OUT + 'ar_zone.jpg')
hechos += ['ar_back', 'ar_zone']

print(len(hechos), 'imágenes preparadas')
for n in sorted(hechos):
    print('  ', n)
