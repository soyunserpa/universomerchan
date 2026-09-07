from playwright.sync_api import sync_playwright
import glob
S='/tmp/claude-0/-home-user-universomerchan/f20d1f73-193f-5c67-9c65-cd031da117b3/scratchpad/imgs/'
BASE=open('/tmp/claude-0/-home-user-universomerchan/f20d1f73-193f-5c67-9c65-cd031da117b3/scratchpad/mock.py').read().split('BASE="""')[1].split('"""')[0]
def zip_sleeve(label, pocket=True, tone='#1a1a1d', logo_white=True):
    h=['<div class="shadow" style="bottom:140px"></div>']
    h.append(f'<div class="tex" style="position:absolute;left:100px;top:200px;width:700px;height:500px;border-radius:40px;background:linear-gradient(160deg,#2c2c30,{tone} 55%,#0c0c0e);box-shadow:0 30px 60px rgba(0,0,0,.4),inset 0 2px 0 rgba(255,255,255,.08)"></div>')
    # top zipper line
    h.append('<div style="position:absolute;left:130px;top:222px;width:640px;height:6px;border-radius:3px;background:repeating-linear-gradient(90deg,#3a3a3e 0 6px,#111 6px 8px)"></div>')
    h.append('<div style="position:absolute;left:730px;top:214px;width:26px;height:22px;border-radius:6px;background:#2f2f33;box-shadow:0 3px 6px rgba(0,0,0,.6)"></div><div style="position:absolute;left:754px;top:222px;width:30px;height:7px;border-radius:3px;background:#3a3a3e"></div>')
    if pocket:
        h.append(f'<div class="tex" style="position:absolute;left:130px;top:280px;width:640px;height:380px;border-radius:30px;background:linear-gradient(180deg,#262629,{tone});box-shadow:0 -2px 0 rgba(255,255,255,.07),0 10px 20px rgba(0,0,0,.5)"></div>')
        h.append('<div style="position:absolute;left:160px;top:300px;width:580px;height:5px;border-radius:3px;background:repeating-linear-gradient(90deg,#3a3a3e 0 6px,#111 6px 8px)"></div>')
        h.append('<div style="position:absolute;left:700px;top:293px;width:22px;height:20px;border-radius:5px;background:#2f2f33;box-shadow:0 3px 6px rgba(0,0,0,.6)"></div>')
    col = 'rgba(255,255,255,.9)' if logo_white else 'rgba(0,0,0,.6)'
    h.append(f'<div class="logo" style="left:100px;width:700px;top:500px;text-align:center;font-size:26px;letter-spacing:7px;color:{col}">LOGO</div>')
    h.append(f'<div style="position:absolute;left:100px;width:700px;top:545px;text-align:center;color:rgba(255,255,255,.35);font-size:11px;letter-spacing:3px;font-weight:300">{label}</div>')
    # small label tag
    h.append('<div style="position:absolute;left:690px;top:610px;width:70px;height:28px;border-radius:4px;background:#eee;box-shadow:0 2px 4px rgba(0,0,0,.5)"><div style="text-align:center;font-size:9px;font-weight:700;letter-spacing:2px;color:#111;line-height:28px">LOGO</div></div>')
    return ''.join(h)
def tech_pouch():
    h=['<div class="shadow" style="bottom:170px"></div>']
    h.append('<div class="tex" style="position:absolute;left:190px;top:250px;width:520px;height:400px;border-radius:36px;background:linear-gradient(160deg,#2c2c30,#151517 55%,#0c0c0e);box-shadow:0 30px 60px rgba(0,0,0,.4)"></div>')
    h.append('<div style="position:absolute;left:220px;top:250px;width:460px;height:6px;border-radius:3px;background:repeating-linear-gradient(90deg,#3a3a3e 0 6px,#111 6px 8px);top:262px"></div>')
    h.append('<div style="position:absolute;left:640px;top:254px;width:24px;height:22px;border-radius:6px;background:#2f2f33;box-shadow:0 3px 6px rgba(0,0,0,.6)"></div>')
    h.append('<div style="position:absolute;left:250px;top:300px;width:400px;height:160px;border-radius:20px;background:linear-gradient(180deg,#262629,#151517);box-shadow:0 6px 14px rgba(0,0,0,.5)"></div>')
    h.append('<div style="position:absolute;left:280px;top:318px;width:340px;height:5px;border-radius:3px;background:repeating-linear-gradient(90deg,#3a3a3e 0 6px,#111 6px 8px)"></div>')
    h.append('<div style="position:absolute;left:400px;top:236px;width:100px;height:18px;border-radius:9px;background:#26262a;box-shadow:0 3px 6px rgba(0,0,0,.5)"></div>')
    h.append('<div class="logo" style="left:190px;width:520px;top:530px;text-align:center;font-size:22px;letter-spacing:6px">LOGO</div>')
    h.append('<div style="position:absolute;left:190px;width:520px;top:570px;text-align:center;color:rgba(255,255,255,.35);font-size:11px;letter-spacing:3px;font-weight:300">NECESER PARA CABLES</div>')
    return ''.join(h)
def roll_organizer():
    h=['<div class="shadow" style="bottom:160px"></div>']
    h.append('<div class="tex" style="position:absolute;left:120px;top:280px;width:660px;height:340px;border-radius:30px;background:linear-gradient(160deg,#2c2c30,#151517 55%,#0c0c0e);box-shadow:0 30px 60px rgba(0,0,0,.4)"></div>')
    for i in range(3):
        x=150+i*210
        h.append(f'<div style="position:absolute;left:{x}px;top:310px;width:190px;height:280px;border-radius:16px;background:repeating-linear-gradient(45deg,#2a2a2e 0 3px,#1a1a1d 3px 6px);box-shadow:inset 0 0 0 2px #0b0b0d"></div>')
        h.append(f'<div style="position:absolute;left:{x+12}px;top:322px;width:166px;height:5px;border-radius:3px;background:repeating-linear-gradient(90deg,#3a3a3e 0 6px,#111 6px 8px)"></div>')
    h.append('<div style="position:absolute;left:760px;top:400px;width:50px;height:100px;border-radius:12px;background:#1a1a1d;box-shadow:0 6px 12px rgba(0,0,0,.5)"></div>')
    h.append('<div class="logo" style="left:120px;width:660px;top:630px;text-align:center;font-size:20px;letter-spacing:6px;color:rgba(0,0,0,.7)">LOGO</div>')
    return ''.join(h)
def notebook_zip():
    h=['<div class="shadow"></div>']
    h.append('<div style="position:absolute;left:245px;top:132px;width:420px;height:620px;border-radius:8px 26px 26px 8px;background:#efece4;box-shadow:0 26px 50px rgba(0,0,0,.35)"></div>')
    h.append('<div class="tex" style="position:absolute;left:230px;top:122px;width:432px;height:624px;border-radius:10px 28px 28px 10px;background:linear-gradient(150deg,#2a2a2e,#141416 55%,#0b0b0d);box-shadow:0 18px 30px rgba(0,0,0,.45)"></div>')
    h.append('<div style="position:absolute;left:230px;top:122px;width:22px;height:624px;border-radius:10px 0 0 10px;background:linear-gradient(90deg,#0a0a0b,#26262a)"></div>')
    h.append('<div class="tex" style="position:absolute;left:280px;top:430px;width:330px;height:250px;border-radius:14px;background:linear-gradient(180deg,#232327,#111113);box-shadow:0 6px 12px rgba(0,0,0,.5)"></div>')
    h.append('<div style="position:absolute;left:300px;top:445px;width:290px;height:5px;border-radius:3px;background:repeating-linear-gradient(90deg,#3a3a3e 0 6px,#111 6px 8px)"></div>')
    h.append('<div style="position:absolute;left:575px;top:438px;width:20px;height:18px;border-radius:5px;background:#2f2f33;box-shadow:0 3px 6px rgba(0,0,0,.6)"></div>')
    h.append('<div style="position:absolute;left:590px;top:122px;width:16px;height:624px;background:#050506"></div>')
    h.append('<div class="deboss" style="left:230px;width:432px;top:300px;text-align:center">LOGO</div>')
    h.append('<div style="position:absolute;left:230px;width:432px;top:345px;text-align:center;color:rgba(255,255,255,.35);font-size:11px;letter-spacing:3px;font-weight:300">BOLSILLO CON CREMALLERA</div>')
    return ''.join(h)
shots={'xd_sleeve':zip_sleeve('LOGO 2 CARAS · 16"'),'vinga_sleeve':zip_sleeve('POLIÉSTER RECICLADO · 16"',pocket=False,tone='#1c1c20'),
       'tech_pouch':tech_pouch(),'rpet_pouch':tech_pouch(),'traveli':roll_organizer(),'nb_zip':notebook_zip()}
exe=glob.glob('/opt/pw-browsers/chromium_headless_shell-*/chrome-linux/headless_shell')[0]
with sync_playwright() as p:
    b=p.chromium.launch(executable_path=exe); pg=b.new_page(viewport={'width':900,'height':900})
    for k,v in shots.items():
        pg.set_content(BASE.replace('@@BODY@@',v)); pg.wait_for_timeout(500); pg.screenshot(path=S+k+'.png'); print('ok',k)
    b.close()
