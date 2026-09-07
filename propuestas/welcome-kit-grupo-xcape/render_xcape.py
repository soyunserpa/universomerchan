"""Maquetas de producto en negro con el logotipo de grupo xcape aplicado."""
import base64, glob, sys, os
from playwright.sync_api import sync_playwright

S = '/tmp/claude-0/-home-user-universomerchan/f20d1f73-193f-5c67-9c65-cd031da117b3/scratchpad/'
OUT = S + 'xc/'
os.makedirs(OUT, exist_ok=True)
LOGO = 'data:image/png;base64,' + base64.b64encode(open(S + 'brand/xcape_white_t.png', 'rb').read()).decode()

CSS = """
*{box-sizing:border-box;margin:0;padding:0}
body{width:1100px;height:1100px;overflow:hidden;
 background:radial-gradient(ellipse 72% 62% at 50% 40%, #16181c 0%, #0e1014 52%, #08090b 100%)}
.stage{position:relative;width:1100px;height:1100px}
/* materiales */
.nylon{background:
 repeating-linear-gradient(45deg, rgba(255,255,255,.055) 0 1px, transparent 1px 26px),
 repeating-linear-gradient(-45deg, rgba(255,255,255,.055) 0 1px, transparent 1px 26px),
 linear-gradient(158deg,#43434a 0%,#2a2a30 32%,#17171b 66%,#0d0d10 100%)}
.rpet{background:
 repeating-linear-gradient(0deg, rgba(255,255,255,.040) 0 1px, transparent 1px 5px),
 repeating-linear-gradient(90deg, rgba(255,255,255,.032) 0 1px, transparent 1px 5px),
 linear-gradient(152deg,#3f3f46 0%,#26262c 38%,#141418 72%,#0b0b0e 100%)}
.pu{background:
 radial-gradient(ellipse 130% 82% at 26% 10%, rgba(255,255,255,.15), transparent 56%),
 linear-gradient(152deg,#37373d 0%,#212127 42%,#111114 78%,#0a0a0c 100%)}
.pusoft{background:
 radial-gradient(ellipse 140% 88% at 28% 12%, rgba(255,255,255,.12), transparent 58%),
 linear-gradient(150deg,#3a3a41 0%,#242429 44%,#141417 100%)}
.metal{background:linear-gradient(118deg,#8f9198 0%,#d6d8dd 22%,#9a9ca3 44%,#e6e8ec 62%,#8a8c93 82%,#b9bbc1 100%)}
/* piezas */
.sh{position:absolute;border-radius:50%;
 background:radial-gradient(ellipse at center, rgba(0,0,0,.62) 0%, rgba(0,0,0,.3) 44%, rgba(0,0,0,0) 74%)}
.zip{position:absolute;height:8px;border-radius:4px;
 background:repeating-linear-gradient(90deg,#585860 0 4px,#0f0f12 4px 7px);
 box-shadow:0 1px 3px rgba(0,0,0,.8), inset 0 1px 0 rgba(255,255,255,.14)}
.pull{position:absolute;border-radius:5px;background:linear-gradient(150deg,#5a5a63,#2c2c32);
 box-shadow:0 3px 7px rgba(0,0,0,.75), inset 0 1px 0 rgba(255,255,255,.2)}
.tab{position:absolute;border-radius:0 7px 7px 0;background:linear-gradient(150deg,#45454c,#1c1c21);
 box-shadow:0 3px 8px rgba(0,0,0,.6)}
.elas{position:absolute;background:linear-gradient(90deg,#0a0a0c,#232329 42%,#050506);
 box-shadow:-3px 0 7px rgba(0,0,0,.6), inset 0 0 0 1px rgba(255,255,255,.05)}
.rib{position:absolute;background:linear-gradient(180deg,#1a1a1f,#050506);border-radius:0 0 2px 2px}
.pages{position:absolute;background:repeating-linear-gradient(180deg,#f7f5f0 0 2px,#d9d5cb 2px 3px);
 box-shadow:inset -4px 0 8px rgba(0,0,0,.14)}
.gloss{position:absolute;border-radius:inherit;pointer-events:none;
 background:linear-gradient(158deg, rgba(255,255,255,.13) 0%, rgba(255,255,255,.03) 24%, transparent 46%)}
.rule{position:absolute;background:#c6c2b6;height:1px}
/* logo aplicado */
.lg{position:absolute;background-image:url('@@LOGO@@');background-size:contain;
 background-repeat:no-repeat;background-position:center}
.serig{opacity:.94;filter:drop-shadow(0 1px 2px rgba(0,0,0,.5))}
.deboss{filter:brightness(.40) drop-shadow(0 2px 0 rgba(255,255,255,.26)) drop-shadow(0 -1.4px 1px rgba(0,0,0,.95))}
.laser{filter:brightness(.30) contrast(1.2) drop-shadow(0 .5px 0 rgba(255,255,255,.5))}
.termo{filter:brightness(.38) drop-shadow(0 2px 0 rgba(255,255,255,.24)) drop-shadow(0 -1.4px 1px rgba(0,0,0,.95))}
/* etiquetas de zona */
.zone{position:absolute;border:2.4px dashed rgba(255,26,61,.98);border-radius:4px;
 box-shadow:0 0 22px rgba(222,0,33,.30)}
.zonec{position:absolute;border:2.4px dashed rgba(255,26,61,.98);border-radius:50%;
 box-shadow:0 0 22px rgba(222,0,33,.30)}
.zlab{position:absolute;font-family:'Poppins',sans-serif;font-size:15px;font-weight:600;
 letter-spacing:.14em;color:#FF1A3D;text-transform:uppercase}
.cap{position:absolute;text-align:center;font-family:'Poppins',sans-serif;font-weight:300;
 letter-spacing:.2em;font-size:14px;color:rgba(255,255,255,.34);text-transform:uppercase}
"""

SHELL = "<html><head><meta charset='utf-8'><style>" + CSS.replace('@@LOGO@@', LOGO) + \
        "</style></head><body><div class='stage'>@@BODY@@</div></body></html>"


def lg(x, y, w, h, style='serig'):
    return f"<div class='lg {style}' style='left:{x}px;top:{y}px;width:{w}px;height:{h}px'></div>"


def zone(x, y, w, h, label=None, lab_below=True):
    o = [f"<div class='zone' style='left:{x}px;top:{y}px;width:{w}px;height:{h}px'></div>"]
    if label:
        ly = y + h + 10 if lab_below else y - 26
        o.append(f"<div class='zlab' style='left:{x}px;top:{ly}px'>{label}</div>")
    return ''.join(o)


def zone_circle(x, y, d, label=None):
    o = [f"<div class='zonec' style='left:{x}px;top:{y}px;width:{d}px;height:{d}px'></div>"]
    if label:
        o.append(f"<div class='zlab' style='left:{x}px;top:{y+d+12}px'>{label}</div>")
    return ''.join(o)


def cap(txt, y=1010):
    return f"<div class='cap' style='left:0;top:{y}px;width:1100px'>{txt}</div>"


# ============ FUNDA (KLYRO / SWISS PEAK) ============
def sleeve(mat='nylon', view='front', logo=True, logo_style='serig', quilt=False,
           pocket=True, zones=None, caption=None, W=720, Hh=510):
    x, y = (1100 - W) // 2, 280
    o = [f"<div class='sh' style='left:{x+40}px;top:{y+Hh-20}px;width:{W-80}px;height:72px'></div>"]
    o.append(f"<div class='{mat}' style='position:absolute;left:{x}px;top:{y}px;width:{W}px;height:{Hh}px;"
             f"border-radius:32px;box-shadow:0 40px 74px rgba(0,0,0,.62), 0 8px 18px rgba(0,0,0,.4),"
             f"inset 0 2px 0 rgba(255,255,255,.11), inset 0 -2px 0 rgba(0,0,0,.6)'>"
             f"<div class='gloss' style='inset:0'></div></div>")
    # cremallera superior
    o.append(f"<div class='zip' style='left:{x+36}px;top:{y+28}px;width:{W-72}px'></div>")
    o.append(f"<div class='pull' style='left:{x+W-78}px;top:{y+19}px;width:32px;height:26px'></div>")
    o.append(f"<div class='tab' style='left:{x+W-48}px;top:{y+25}px;width:28px;height:13px'></div>")
    if pocket and view == 'front':
        py, ph = y + 132, Hh - 182
        o.append(f"<div style='position:absolute;left:{x+36}px;top:{py-24}px;width:{W-72}px;height:28px;"
                 f"background:linear-gradient(180deg,transparent 46%,rgba(255,255,255,.09) 50%,transparent 54%);"
                 f"clip-path:polygon(0 100%,9% 0,91% 0,100% 100%)'></div>")
        o.append(f"<div class='{mat}' style='position:absolute;left:{x+36}px;top:{py}px;width:{W-72}px;height:{ph}px;"
                 f"border-radius:24px;box-shadow:0 -2px 0 rgba(255,255,255,.09), 0 14px 26px rgba(0,0,0,.55)'>"
                 f"<div class='gloss' style='inset:0'></div></div>")
        o.append(f"<div class='zip' style='left:{x+62}px;top:{py+22}px;width:{W-124}px;height:7px'></div>")
        o.append(f"<div class='pull' style='left:{x+W-112}px;top:{py+13}px;width:28px;height:24px'></div>")
    if quilt:  # pespunte en rombo
        for i in range(-6, 12):
            o.append(f"<div style='position:absolute;left:{x}px;top:{y}px;width:{W}px;height:{Hh}px;"
                     f"overflow:hidden;border-radius:32px;pointer-events:none'>"
                     f"<div style='position:absolute;left:{i*72}px;top:-60px;width:1.5px;height:900px;"
                     f"background:rgba(255,255,255,.075);transform:rotate(38deg);transform-origin:top left'></div>"
                     f"<div style='position:absolute;left:{i*72}px;top:-60px;width:1.5px;height:900px;"
                     f"background:rgba(255,255,255,.075);transform:rotate(-38deg);transform-origin:top left'></div>"
                     f"</div>")
    if logo:
        lw = 250
        ly = (y + Hh - 148) if (pocket and view == 'front') else (y + Hh // 2 - 26)
        o.append(lg(x + (W - lw) // 2, ly, lw, 58, logo_style))
    if zones:
        for z in zones:
            o.append(zone(*z))
    if caption:
        o.append(cap(caption))
    return ''.join(o)



# ============ FUNDA VERTICAL (KLYRO) ============
def sleeve_v(logo=True, logo_style='serig', zones=None, caption=None,
             view='front', W=505, Hh=700):
    """Funda vertical acolchada en rombo, cremallera perimetral en U,
    bolsillo frontal abierto en los dos tercios inferiores."""
    x, y = (1100 - W) // 2, 190
    o = [f"<div class='sh' style='left:{x+40}px;top:{y+Hh-16}px;width:{W-80}px;height:70px'></div>"]
    # cuerpo
    o.append(f"<div class='nylon' style='position:absolute;left:{x}px;top:{y}px;width:{W}px;height:{Hh}px;"
             f"border-radius:34px;box-shadow:0 42px 76px rgba(0,0,0,.62), 0 8px 18px rgba(0,0,0,.4),"
             f"inset 0 2px 0 rgba(255,255,255,.10), inset 0 -2px 0 rgba(0,0,0,.6)'>"
             f"<div class='gloss' style='inset:0'></div></div>")
    # acolchado en rombo grande (recortado al cuerpo)
    dia = []
    step = 132
    for i in range(-3, 8):
        dia.append(f"<div style='position:absolute;left:{i*step}px;top:-160px;width:2px;height:1100px;"
                   f"background:rgba(255,255,255,.085);transform:rotate(42deg);transform-origin:top left'></div>")
        dia.append(f"<div style='position:absolute;left:{i*step}px;top:-160px;width:2px;height:1100px;"
                   f"background:rgba(255,255,255,.085);transform:rotate(-42deg);transform-origin:top left'></div>")
    quilt_h = Hh if view == 'back' else 250
    o.append(f"<div style='position:absolute;left:{x}px;top:{y}px;width:{W}px;height:{quilt_h}px;"
             f"overflow:hidden;border-radius:34px 34px 0 0;pointer-events:none'>{''.join(dia)}</div>")
    # cremallera perimetral en U
    o.append(f"<div class='zip' style='left:{x+26}px;top:{y+16}px;width:{W-52}px;height:9px'></div>")
    o.append(f"<div style='position:absolute;left:{x+16}px;top:{y+26}px;width:9px;height:{Hh-260}px;"
             f"border-radius:5px;background:repeating-linear-gradient(180deg,#585860 0 4px,#0f0f12 4px 7px);"
             f"box-shadow:0 1px 3px rgba(0,0,0,.8)'></div>")
    o.append(f"<div style='position:absolute;left:{x+W-25}px;top:{y+26}px;width:9px;height:{Hh-260}px;"
             f"border-radius:5px;background:repeating-linear-gradient(180deg,#585860 0 4px,#0f0f12 4px 7px);"
             f"box-shadow:0 1px 3px rgba(0,0,0,.8)'></div>")
    o.append(f"<div class='pull' style='left:{x+4}px;top:{y+Hh-262}px;width:24px;height:34px'></div>")
    if view == 'front':
        # bolsillo frontal abierto (sin cremallera)
        py = y + 246
        o.append(f"<div class='nylon' style='position:absolute;left:{x+8}px;top:{py}px;width:{W-16}px;"
                 f"height:{Hh-254}px;border-radius:16px 16px 30px 30px;"
                 f"box-shadow:0 -3px 0 rgba(255,255,255,.10), 0 -10px 20px rgba(0,0,0,.55)'>"
                 f"<div class='gloss' style='inset:0'></div></div>")
        o.append(f"<div style='position:absolute;left:{x+8}px;top:{py}px;width:{W-16}px;height:3px;"
                 f"background:rgba(255,255,255,.14);border-radius:2px'></div>")
    if logo:
        lw = 268
        o.append(lg(x + (W - lw) // 2, y + 430, lw, 58, logo_style))
    if zones:
        for z in zones:
            o.append(zone(*z))
    if caption:
        o.append(cap(caption))
    return ''.join(o)

# ============ LIBRETA ============
def notebook(mat='pu', view='front', plate=False, logo=True, logo_style='deboss',
             logo_pos='center', zones=None, caption=None, W=440, Hh=630):
    x, y = (1100 - W) // 2, 230
    o = [f"<div class='sh' style='left:{x+20}px;top:{y+Hh-8}px;width:{W+10}px;height:66px'></div>"]
    o.append(f"<div class='pages' style='left:{x+18}px;top:{y+11}px;width:{W-4}px;height:{Hh-22}px;"
             f"border-radius:5px 18px 18px 5px;box-shadow:0 28px 52px rgba(0,0,0,.5)'></div>")
    rad = '11px 28px 28px 11px'
    o.append(f"<div class='{mat}' style='position:absolute;left:{x}px;top:{y}px;width:{W}px;height:{Hh}px;"
             f"border-radius:{rad};box-shadow:0 32px 58px rgba(0,0,0,.6), 0 5px 12px rgba(0,0,0,.35),"
             f"inset 0 1px 0 rgba(255,255,255,.11), inset 0 -2px 0 rgba(0,0,0,.6)'>"
             f"<div class='gloss' style='inset:0'></div></div>")
    o.append(f"<div style='position:absolute;left:{x}px;top:{y}px;width:22px;height:{Hh}px;"
             f"border-radius:11px 0 0 11px;background:linear-gradient(90deg,#070709,#2a2a31 72%,#1d1d22)'></div>")
    if plate:  # placa metálica frontal
        px_, py_ = x + W - 206, y + 176
        o.append(f"<div class='metal' style='position:absolute;left:{px_}px;top:{py_}px;width:118px;height:40px;"
                 f"border-radius:3px;box-shadow:0 3px 8px rgba(0,0,0,.7), inset 0 1px 0 rgba(255,255,255,.6)'></div>")
    o.append(f"<div class='elas' style='left:{x+W-66}px;top:{y}px;width:16px;height:{Hh}px'></div>")
    o.append(f"<div class='rib' style='left:{x+W//2-38}px;top:{y+Hh-6}px;width:14px;height:74px;transform:rotate(10deg)'></div>")
    if logo:
        if logo_pos == 'plate':
            o.append(lg(x + W - 200, y + 184, 106, 24, 'laser'))
        elif logo_pos == 'upper':
            o.append(lg(x + 74, y + 96, 210, 48, logo_style))
        elif logo_pos == 'lower':
            o.append(lg(x + 96, y + 412, 200, 46, logo_style))
        elif logo_pos == 'pad':
            o.append(lg(x + 108, y + 300, 190, 44, logo_style))
        else:
            o.append(lg(x + (W - 226) // 2, y + Hh // 2 - 30, 226, 52, logo_style))
    if zones:
        for z in zones:
            o.append(zone(*z))
    if caption:
        o.append(cap(caption))
    return ''.join(o)


def notebook_open(caption=None, logo_sheet=False):
    """Libreta abierta mostrando hojas rayadas."""
    o = ["<div class='sh' style='left:150px;top:800px;width:800px;height:78px'></div>"]
    o.append("<div class='pages' style='left:530px;top:230px;width:430px;height:600px;"
             "border-radius:5px 20px 20px 5px;box-shadow:0 30px 56px rgba(0,0,0,.55)'></div>")
    for i in range(17):
        o.append(f"<div class='rule' style='left:576px;top:{306+i*29}px;width:340px'></div>")
    if logo_sheet:
        o.append("<div class='lg' style='left:760px;top:790px;width:130px;height:26px;"
                 "filter:brightness(0) opacity(.30)'></div>")
    o.append("<div class='pu' style='position:absolute;left:150px;top:222px;width:390px;height:616px;"
             "border-radius:14px 6px 6px 14px;box-shadow:-18px 26px 52px rgba(0,0,0,.6),"
             "inset 0 1px 0 rgba(255,255,255,.09);transform:perspective(1400px) rotateY(26deg);"
             "transform-origin:right center'><div class='gloss' style='inset:0'></div></div>")
    o.append("<div style='position:absolute;left:522px;top:230px;width:16px;height:600px;"
             "background:linear-gradient(90deg,#2a2a31,#08080a);border-radius:0 3px 3px 0'></div>")
    if caption:
        o.append(cap(caption))
    return ''.join(o)


def detail_zip(mat='rpet', caption=None):
    """Detalle macro de cremallera y tejido."""
    o = [f"<div class='{mat}' style='position:absolute;left:0;top:0;width:1100px;height:1100px;filter:brightness(1.7)'></div>"]
    o.append("<div style='position:absolute;left:0;top:430px;width:1100px;height:240px;"
             "background:linear-gradient(180deg,rgba(255,255,255,.06),rgba(0,0,0,.35))'></div>")
    o.append("<div class='zip' style='left:80px;top:520px;width:940px;height:22px'></div>")
    o.append("<div class='pull' style='left:640px;top:486px;width:76px;height:66px'></div>")
    o.append("<div class='tab' style='left:706px;top:506px;width:180px;height:34px'></div>")
    o.append("<div style='position:absolute;left:0;top:0;width:1100px;height:1100px;"
             "background:radial-gradient(ellipse 66% 54% at 44% 46%, transparent 0%, rgba(0,0,0,.62) 100%)'></div>")
    if caption:
        o.append(cap(caption))
    return ''.join(o)


def detail_quilt(caption=None):
    o = ["<div class='nylon' style='position:absolute;left:0;top:0;width:1100px;height:1100px;filter:brightness(1.75)'></div>"]
    for i in range(-8, 20):
        o.append(f"<div style='position:absolute;left:{i*90}px;top:-200px;width:3px;height:1700px;"
                 f"background:linear-gradient(90deg,rgba(0,0,0,.5),rgba(255,255,255,.20));"
                 f"transform:rotate(38deg);transform-origin:top left'></div>")
        o.append(f"<div style='position:absolute;left:{i*90}px;top:-200px;width:3px;height:1700px;"
                 f"background:linear-gradient(90deg,rgba(0,0,0,.5),rgba(255,255,255,.20));"
                 f"transform:rotate(-38deg);transform-origin:top left'></div>")
    o.append("<div style='position:absolute;left:0;top:0;width:1100px;height:1100px;"
             "background:radial-gradient(ellipse 64% 56% at 50% 46%, transparent 0%, rgba(0,0,0,.66) 100%)'></div>")
    if caption:
        o.append(cap(caption))
    return ''.join(o)


# ---- zonas de marcaje (coordenadas relativas al render) ----
NB_X, NB_Y, NB_W, NB_H = (1100 - 440) // 2, 230, 440, 630
SL_X, SL_Y, SL_W, SL_H = (1100 - 720) // 2, 280, 720, 510

SHOTS = {
  # ---------- KLYRO ----------
  'kl_front':  sleeve_v(True, 'serig', caption='Frontal · serigrafía 1 color'),
  'kl_back':   sleeve_v(False, view='back', caption='Trasera · acolchado en rombo'),
  'kl_zone':   sleeve_v(True, 'serig',
                        zones=[(297+22, 190+404, 268+56, 112, 'Frontal · 1 posición')],
                        caption='Serigrafía · área de marcaje'),
  'kl_detail': detail_quilt('Nailon acolchado en rombo'),

  # ---------- SWISS PEAK ----------
  'sp_front':  sleeve('rpet', 'front', True, 'serig', caption='Frontal · serigrafía 1 color'),
  'sp_back':   sleeve('rpet', 'back', True, 'serig', pocket=False, caption='Trasera · serigrafía 1 color'),
  'sp_zone':   sleeve('rpet', 'front', True, 'serig',
                      zones=[(SL_X+207, SL_Y+346, 306, 90, 'Posición 1 · frontal')],
                      caption='Serigrafía · posición 1 de 2'),
  'sp_zone2':  sleeve('rpet', 'back', True, 'serig', pocket=False,
                      zones=[(SL_X+207, SL_Y+213, 306, 90, 'Posición 2 · trasera')],
                      caption='Serigrafía · posición 2 de 2'),
  'sp_detail': detail_zip('rpet', 'Tejido rPET · cremallera reforzada'),

  # ---------- TREZE ----------
  'tz_front':  notebook('pusoft', plate=True, logo=True, logo_pos='plate',
                        caption='Portada · grabado láser sobre placa'),
  'tz_back':   notebook('pusoft', plate=False, logo=True, logo_style='deboss', logo_pos='center',
                        caption='Contraportada'),
  'tz_open':   notebook_open('Interior rayado · papel reciclado'),
  'tz_plate':  notebook('pusoft', plate=True, logo=True, logo_pos='plate',
                        zones=[(NB_X+NB_W-208, NB_Y+174, 122, 44, 'Front plate 45 × 25 mm')],
                        caption='Placa metálica frontal'),
  # posiciones de marcaje TREZE
  'tz_p_up':   notebook('pusoft', plate=True, logo=True, logo_style='deboss', logo_pos='upper',
                        zones=[(NB_X+66, NB_Y+86, 226, 68, 'Front upper 70 × 80')], caption='Portada superior'),
  'tz_p_low':  notebook('pusoft', plate=True, logo=True, logo_style='deboss', logo_pos='lower',
                        zones=[(NB_X+88, NB_Y+402, 216, 66, 'Front lower 85 × 70')], caption='Portada inferior'),
  'tz_p_back': notebook('pusoft', logo=True, logo_style='deboss', logo_pos='upper',
                        zones=[(NB_X+56, NB_Y+80, 250, 80, 'Back 120 × 80')], caption='Contraportada'),
  'tz_p_pad':  notebook('pusoft', plate=True, logo=True, logo_style='deboss', logo_pos='pad',
                        zones=[(NB_X+100, NB_Y+292, 206, 62, 'Front pad 80 × 40')], caption='Zona pad frontal'),

  # ---------- ARCONOT ----------
  'ar_front':  notebook('pu', logo=True, logo_style='termo', logo_pos='center',
                        caption='Portada · termograbado 1 color'),
  'ar_back':   notebook('pu', logo=False, caption='Contraportada'),
  'ar_open':   notebook_open('Interior rayado · papel reciclado FSC'),
  'ar_zone':   notebook('pu', logo=True, logo_style='termo', logo_pos='center',
                        zones=[(NB_X+52, NB_Y+180, 336, 250, 'Frontal 120 × 190 mm')],
                        caption='Área de marcaje'),
}


# posiciones Swiss Peak (funda apaisada: SL_X=190, SL_Y=280, W=720, H=510)
SHOTS['sp_p_front'] = sleeve('rpet', 'front', True, 'serig',
    zones=[(390, 478, 320, 162, 'Frontal 200 × 100 mm')], caption='Frontal · hasta 6 colores')
SHOTS['sp_p_back'] = sleeve('rpet', 'back', True, 'serig', pocket=False,
    zones=[(390, 400, 320, 240, 'Trasera 200 × 150 mm')], caption='Trasera · hasta 6 colores')
SHOTS['sp_p_up'] = sleeve('rpet', 'front', False,
    zones=[(470, 352, 160, 42, 'Franja superior 100 × 25 mm')], caption='Franja superior · hasta 6 colores') \
    + lg(478, 356, 144, 34, 'serig')
SHOTS['sp_p_emb'] = sleeve('rpet', 'front', False) \
    + zone_circle(440, 452, 224, 'Bordado 140 × 140 mm') + lg(468, 540, 168, 42, 'serig')

# posiciones libreta A5 PU (NB_X=330, NB_Y=230, W=440, H=630)
SHOTS['ar_p_front'] = notebook('pu', logo=True, logo_style='serig', logo_pos='center',
    zones=[(NB_X+40, NB_Y+96, 350, 440, 'Portada')], caption='Serigrafía en portada')
SHOTS['ar_p_back'] = notebook('pu', logo=True, logo_style='serig', logo_pos='center',
    zones=[(NB_X+56, NB_Y+96, 318, 440, 'Contraportada')], caption='Serigrafía en contraportada')
SHOTS['ar_p_pad'] = notebook('pu', logo=True, logo_style='serig', logo_pos='lower',
    zones=[(NB_X+92, NB_Y+400, 224, 74, 'Franja inferior')], caption='Tampografía en portada')

if __name__ == '__main__':
    exe = glob.glob('/opt/pw-browsers/chromium_headless_shell-*/chrome-linux/headless_shell')[0]
    only = sys.argv[1:] or list(SHOTS)
    with sync_playwright() as p:
        b = p.chromium.launch(executable_path=exe)
        pg = b.new_page(viewport={'width': 1100, 'height': 1100}, device_scale_factor=1.35)
        for k in only:
            pg.set_content(SHELL.replace('@@BODY@@', SHOTS[k]))
            pg.wait_for_timeout(430)
            pg.screenshot(path=OUT + k + '.png')
            print('ok', k)
        b.close()
