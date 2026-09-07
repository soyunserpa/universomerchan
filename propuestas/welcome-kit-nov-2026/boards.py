import base64, glob, json
from playwright.sync_api import sync_playwright
from PIL import Image
S='/tmp/claude-0/-home-user-universomerchan/f20d1f73-193f-5c67-9c65-cd031da117b3/scratchpad/'
OUT='/home/user/universomerchan/propuestas/welcome-kit-nov-2026/'
def d(n):
    return 'data:image/png;base64,'+base64.b64encode(open(S+'imgs/'+n+'.png','rb').read()).decode()
def mo(code): return f'https://cdn1.midocean.com/image/700X700/{code.lower()}-03.jpg'
PACKS=[
 {'id':'p1','title':'Pack 1 · XD Connects · Executive','tag':'RECOMENDADO · 16"','hi':True,'sup':'XD Connects',
  'items':[
   {'kind':'Funda','name':'XD Design 16" Laptop Sleeve, negra','ref':'P706.211','img':d('xd_sleeve_r'),'remote':None,
    'url':'https://www.xdconnects.com/de-de/xd-design-16-laptop-sleeve-schwarz-p706.211','alt':'https://www.xdconnects.com/en-gb/laptopsleeves/','desc':'Funda acolchada 16", cremallera, logo a 2 caras. Lista XD: 20,00 €.'},
   {'kind':'Neceser cables','name':'Swiss Peak AWARE™ tech pouch PVC free, negro','ref':'P820.391','img':d('tech_pouch_r'),'remote':None,
    'url':'https://www.xdconnects.com/en-gb/allitems/swiss-peak-aware-tech-pouch-pvc-free-black-p820.391','alt':None,'desc':'Bolsillos origami, gomas para cables, paso de cable exterior.'},
   {'kind':'Libreta A5','name':'Swiss Peak A5 PU con bolsillo de cremallera, negra','ref':'P774.141','img':d('nb_zip_r'),'remote':None,
    'url':'https://www.xdconnects.com/en-gb/swiss-peak-a5-pu-notebook-with-zipper-pocket-black-p774.141','alt':None,'desc':'Tapa PU, 80 hojas rayadas 80 g, caja regalo. Logo bajo relieve.'}]},
 {'id':'p2','title':'Pack 2 · XD Connects · Eco Premium','tag':'RECICLADO CERTIFICADO · 16"','hi':False,'sup':'XD Connects',
  'items':[
   {'kind':'Funda','name':'VINGA Marlow RCS poliéster reciclado 16" laptop sleeve, negra','ref':'V78807','img':d('vinga_sleeve_r'),'remote':None,
    'url':'https://www.xdconnects.com/en-gb/bags-travel/laptop-sleeves/vinga-marlow-rcs-recycled-polyester-16-7-laptop-sl-v78807?variantId=V7880709','alt':'https://www.xdconnects.com/en-gb/brands-vinga','desc':'Poliéster reciclado RCS, acolchada, 16". Elegir variante negra.'},
   {'kind':'Neceser cables','name':'Impact AWARE™ basic RPET toiletry bag, negro','ref':'P820.761','img':d('rpet_pouch_r'),'remote':None,
    'url':'https://www.xdconnects.com/en-gb/impact-aware-basic-rpet-toiletry-bag-black-p820.761','alt':'https://www.xdconnects.com/en-gb/bags-travel/travel-toiletry-bags/impact-aware-basic-rpet-toiletry-bag-p820.76?variantId=P820.761','desc':'Neceser RPET con cremallera, formato compacto para cables y cargador.'},
   {'kind':'Libreta A5','name':'Standard hardcover PU notebook A5, negra','ref':'P773.241','img':d('arconot_r'),'remote':None,
    'url':'https://www.xdconnects.com/en-gb/standard-hardcover-pu-notebook-a5-black-p773.241','alt':'https://www.xdconnects.com/en-gb/portfolios-notebooks/notebooks-basic/standard-hardcover-pu-notebook-a5-p773.24?variantId=P773.241','desc':'Tapa dura PU, 144 pág. rayadas, goma y cinta. Logo bajo relieve.'}]},
 {'id':'p3','title':'Pack 3 · Universo Merchan · Stock < 10 días','tag':'STOCK EUROPEO · FUNDA 15"','hi':False,'sup':'Universo Merchan',
  'items':[
   {'kind':'Funda','name':'COTIN · Funda portátil 15" algodón 220 g/m², negra','ref':'MO2191','img':d('cotin_r'),'remote':mo('MO2191'),
    'url':'https://universomerchan.com/product/mo2191','alt':'https://universomerchan.com/catalog?search=MO2191','desc':'39,5 × 27 cm, hasta 15". Botón de bambú. Serigrafía 1 tinta, 2 caras.'},
   {'kind':'Neceser cables','name':'TRAVELI · Organizador de cables RPET 210D, negro','ref':'MO2171','img':d('traveli_r'),'remote':mo('MO2171'),
    'url':'https://universomerchan.com/product/mo2171','alt':'https://universomerchan.com/catalog?search=MO2171','desc':'Enrollable, malla RPET con 3 compartimentos con cremallera.'},
   {'kind':'Libreta A5','name':'ARCONOT · Libreta A5 PU tapa rígida, negra','ref':'MO1804','img':d('arconot_r'),'remote':mo('MO1804'),
    'url':'https://universomerchan.com/product/mo1804','alt':'https://universomerchan.com/catalog?search=MO1804','desc':'96 hojas rayadas papel reciclado, goma y cinta. Grabado en seco.'}]},
]
CSS="""
@import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;600;700&display=swap');
*{box-sizing:border-box}body{margin:0;font-family:Poppins,Arial,sans-serif;background:#fff;color:#111827;font-weight:300}
.wrap{padding:28px 34px}
.hdr{display:flex;align-items:center;gap:16px;margin-bottom:14px}
.hdr img{height:44px}
h1{font-size:22px;font-weight:700;margin:0}
.sub{color:#6B7280;font-size:12px}
.pack{border:1px solid #E5E7EB;border-radius:18px;padding:20px 22px;margin:14px 0;background:#fff}
.pack.hi{background:#FEE2E2;border-color:#DE0021}
.ptitle{display:flex;align-items:center;gap:12px;margin-bottom:14px}
.ptitle h2{font-size:17px;font-weight:700;margin:0}
.pill{background:#DE0021;color:#fff;font-size:9.5px;font-weight:700;letter-spacing:1.5px;padding:6px 12px;border-radius:20px}
.pill.dark{background:#111827}
.grid{display:grid;grid-template-columns:repeat(3,1fr);gap:16px}
.card{background:#F3F4F6;border-radius:14px;padding:14px;border:1px solid #E5E7EB}
.card .kind{color:#DE0021;font-weight:700;font-size:10.5px;letter-spacing:1.5px;text-transform:uppercase}
.card .ph{background:#fff;border-radius:12px;overflow:hidden;margin:8px 0;aspect-ratio:1/1;display:flex;align-items:center;justify-content:center}
.card .ph img{width:100%;height:100%;object-fit:contain}
.card .name{font-weight:600;font-size:12.5px;line-height:1.3;min-height:34px}
.card .ref{font-size:11px;color:#6B7280;margin:2px 0 4px}
.card .desc{font-size:10.5px;color:#4B5563;line-height:1.35}
.card a{display:inline-block;margin-top:8px;font-size:10.5px;color:#DE0021;font-weight:600;text-decoration:none;word-break:break-all}
.foot{font-size:10px;color:#9CA3AF;margin-top:10px}
.refbox{display:flex;gap:16px;align-items:center;background:#111827;color:#fff;border-radius:16px;padding:14px 18px;margin:10px 0 6px}
.refbox img{width:150px;border-radius:10px;background:#fff}
.refbox b{color:#FF1A3D}
"""
logo=base64.b64encode(open('/tmp/logo_dark.png','rb').read()).decode()
ref=base64.b64encode(open(S+'imgs/ref_sq.png','rb').read()).decode()
def card(it, live):
    if live and it['remote']:
        img=f'<img src="{it["remote"]}" onerror="this.onerror=null;this.src=\'{it["img"]}\'">'
        note='Foto real del catálogo (si no carga, se muestra mockup)'
    else:
        img=f'<img src="{it["img"]}">'; note='Mockup ilustrativo · foto real en la ficha'
    links=f'<a href="{it["url"]}">Ver ficha ↗</a>' + (f' &nbsp;<a href="{it["alt"]}" style="color:#6B7280">Enlace alternativo ↗</a>' if it['alt'] else '')
    return f'<div class="card"><div class="kind">{it["kind"]}</div><div class="ph">{img}</div><div class="name">{it["name"]}</div><div class="ref">Ref. {it["ref"]} · <span style="font-size:9.5px">{note}</span></div><div class="desc">{it["desc"]}</div>{links}</div>'
def page(live, packs, with_ref=True):
    body=f'<div class="wrap"><div class="hdr"><img src="data:image/png;base64,{logo}"><div><h1>Welcome Kit · 3 packs con fotos</h1><div class="sub">Funda 16/17" + neceser para cables + libreta A5 · todo negro · 100 kits · cada pack de un solo proveedor</div></div></div>'
    if with_ref:
        body+=f'<div class="refbox"><img src="data:image/png;base64,{ref}"><div><b>Referencia del cliente</b><br>Funda negra 16/17" con bolsillo frontal, logo a 2 caras, etiqueta con logo reducido y neceser para cables a juego. Poliéster resistente al agua, espuma 8 mm, forro aterciopelado.<br><span style="color:#9CA3AF;font-size:10.5px">Ninguna funda de stock reproduce al 100 % la espuma de 8 mm y el forro aterciopelado; eso solo con fabricación a medida (5–6 semanas).</span></div></div>'
    for p in packs:
        body+=f'<div class="pack {"hi" if p["hi"] else ""}"><div class="ptitle"><h2>{p["title"]}</h2><span class="pill {"" if p["hi"] else "dark"}">{p["tag"]}</span></div><div class="grid">{"".join(card(i,live) for i in p["items"])}</div></div>'
    body+='<div class="foot">Precios no consultables desde la sesión (webs bloqueadas). IVA no incluido. Las fotos de Universo Merchan se cargan desde el CDN de Midocean al abrir este archivo en el navegador; las de XD Connects se ven en cada ficha.</div></div>'
    return f'<html><head><meta charset="utf-8"><title>Welcome Kit · 3 packs</title><style>{CSS}</style></head><body>{body}</body></html>'
open(OUT+'Packs_WelcomeKit_con_fotos.html','w',encoding='utf-8').write(page(True,PACKS))
exe=glob.glob('/opt/pw-browsers/chromium_headless_shell-*/chrome-linux/headless_shell')[0]
with sync_playwright() as p:
    b=p.chromium.launch(executable_path=exe)
    pg=b.new_page(viewport={'width':1400,'height':900},device_scale_factor=1.5)
    pg.set_content(page(False,PACKS)); pg.wait_for_timeout(900)
    pg.screenshot(path=OUT+'Packs_WelcomeKit_lamina.png',full_page=True)
    for i,pk in enumerate(PACKS):
        pg.set_content(page(False,[pk],with_ref=False)); pg.wait_for_timeout(600)
        pg.screenshot(path=OUT+f'Pack{i+1}_lamina.png',full_page=True)
    b.close()
print('done')
