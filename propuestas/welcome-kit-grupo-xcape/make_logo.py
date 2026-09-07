import glob
from playwright.sync_api import sync_playwright
B='/tmp/claude-0/-home-user-universomerchan/f20d1f73-193f-5c67-9c65-cd031da117b3/scratchpad/brand/'

# aspa geométrica de brazos triangulares, como el logo original
XPATH = "M2,0 L26,0 L50,30 L74,0 L98,0 L64,50 L98,100 L74,100 L50,70 L26,100 L2,100 L36,50 Z"

def logo(color, bg, fname, w=1800, weight=600, size=230):
    html = f"""<html><head><meta charset="utf-8"><style>
    *{{margin:0;padding:0;box-sizing:border-box}}
    body{{width:{w}px;height:{int(w*0.30)}px;background:{bg};display:flex;align-items:center;justify-content:center}}
    .row{{display:flex;align-items:center;gap:{int(size*0.10)}px}}
    .t{{font-family:'Poppins',sans-serif;font-weight:{weight};font-size:{size}px;color:{color};
       letter-spacing:-0.018em;line-height:1}}
    svg{{display:block}}
    </style></head><body><div class="row">
      <span class="t">grupo</span>
      <svg width="{int(size*0.45)}" height="{int(size*0.45)}" viewBox="0 0 100 100"><path d="{XPATH}" fill="{color}"/></svg>
      <span class="t" style="margin-left:-{int(size*0.045)}px">cape</span>
    </div></body></html>"""
    return html

exe=glob.glob('/opt/pw-browsers/chromium_headless_shell-*/chrome-linux/headless_shell')[0]
with sync_playwright() as p:
    b=p.chromium.launch(executable_path=exe)
    for name,color,bg,alpha in [('xcape_black','#231f20','white',False),
                                ('xcape_white','#ffffff','#111111',False)]:
        pg=b.new_page(viewport={'width':1800,'height':540},device_scale_factor=2)
        pg.set_content(logo(color,bg,name)); pg.wait_for_timeout(500)
        pg.screenshot(path=B+name+'.png'); pg.close(); print('ok',name)
    b.close()

# versiones con transparencia
from PIL import Image
for name,keep_white in [('xcape_black',False),('xcape_white',True)]:
    im=Image.open(B+name+'.png').convert('RGBA'); px=im.load()
    w,h=im.size
    for y in range(h):
        for x in range(w):
            r,g,bb,a=px[x,y]
            lum=(r+g+bb)/3
            if keep_white: px[x,y]=(255,255,255,int(max(0,min(255,lum*1.15))))
            else:          px[x,y]=(35,31,32,int(max(0,min(255,255-lum))))
    im.crop(im.getbbox()).save(B+name+'_t.png')
    print('alpha',name, Image.open(B+name+'_t.png').size)
