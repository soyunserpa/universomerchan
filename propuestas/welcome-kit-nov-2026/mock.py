from playwright.sync_api import sync_playwright
S='/tmp/claude-0/-home-user-universomerchan/f20d1f73-193f-5c67-9c65-cd031da117b3/scratchpad/imgs/'
BASE="""<html><head><style>
@import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;600;700&display=swap');
*{box-sizing:border-box} body{margin:0;width:900px;height:900px;background:#fff;font-family:Poppins,sans-serif;display:flex;align-items:center;justify-content:center;overflow:hidden}
.stage{position:relative;width:900px;height:900px}
.tex{background-image:repeating-linear-gradient(45deg,rgba(255,255,255,.035) 0 2px,transparent 2px 4px),repeating-linear-gradient(-45deg,rgba(255,255,255,.03) 0 2px,transparent 2px 4px)}
.logo{position:absolute;color:rgba(255,255,255,.9);font-weight:700;letter-spacing:4px;font-size:22px}
.deboss{position:absolute;color:rgba(0,0,0,.55);font-weight:700;letter-spacing:5px;font-size:26px;text-shadow:0 1px 0 rgba(255,255,255,.12),0 -1px 1px rgba(0,0,0,.9)}
.shadow{position:absolute;left:120px;right:120px;bottom:120px;height:60px;border-radius:50%;background:radial-gradient(ellipse at center,rgba(0,0,0,.28),rgba(0,0,0,0) 70%)}
</style></head><body><div class="stage">@@BODY@@</div></body></html>"""

def sleeve_cotin():
    return """
    <div class="shadow" style="bottom:150px"></div>
    <div class="tex" style="position:absolute;left:110px;top:210px;width:680px;height:470px;border-radius:34px;background:linear-gradient(160deg,#2b2b2e,#151517 60%,#0d0d0f);box-shadow:0 30px 60px rgba(0,0,0,.35),inset 0 2px 0 rgba(255,255,255,.08)"></div>
    <!-- flap -->
    <div class="tex" style="position:absolute;left:110px;top:210px;width:680px;height:210px;border-radius:34px 34px 60px 60px;background:linear-gradient(180deg,#333338,#1c1c1f);box-shadow:0 14px 24px rgba(0,0,0,.45)"></div>
    <!-- bamboo button -->
    <div style="position:absolute;left:428px;top:388px;width:44px;height:44px;border-radius:50%;background:radial-gradient(circle at 35% 35%,#e9d9b5,#c6ab73 60%,#9c8149);box-shadow:0 3px 6px rgba(0,0,0,.6)"></div>
    <div style="position:absolute;left:446px;top:380px;width:8px;height:22px;background:#0c0c0e;border-radius:4px"></div>
    <div class="logo" style="left:0;right:0;top:545px;text-align:center;font-size:26px;letter-spacing:6px">LOGO</div>
    <div style="position:absolute;left:0;right:0;top:590px;text-align:center;color:rgba(255,255,255,.35);font-size:11px;letter-spacing:3px;font-weight:300">SERIGRAFÍA · 2 CARAS</div>
    """
def notebook(deboss=True, pocket=False, penloop=False, open_pages=False, label=None):
    h=[]
    h.append('<div class="shadow"></div>')
    if open_pages:
        # pages block behind, slightly shifted
        h.append('<div style="position:absolute;left:255px;top:150px;width:430px;height:610px;border-radius:6px 26px 26px 6px;background:#f4f1ea;box-shadow:0 20px 40px rgba(0,0,0,.35)"></div>')
        for i in range(18):
            h.append(f'<div style="position:absolute;left:300px;top:{215+i*28}px;width:340px;height:1px;background:#c9c4b6"></div>')
        h.append('<div style="position:absolute;left:520px;top:690px;color:#9a9483;font-weight:700;font-size:12px;letter-spacing:3px">LOGO</div>')
        h.append('<div class="tex" style="position:absolute;left:160px;top:140px;width:230px;height:630px;border-radius:12px 6px 6px 12px;background:linear-gradient(100deg,#1a1a1d,#0e0e10);box-shadow:-12px 20px 40px rgba(0,0,0,.45);transform:perspective(900px) rotateY(28deg);transform-origin:left center"></div>')
        h.append('<div class="deboss" style="left:200px;top:400px;font-size:16px;transform:perspective(900px) rotateY(28deg);transform-origin:left center">LOGO</div>')
        h.append('<div style="position:absolute;left:640px;top:140px;width:14px;height:520px;background:linear-gradient(#333,#111);border-radius:0 0 4px 4px"></div>')
        return "".join(h)
    # closed book
    h.append('<div style="position:absolute;left:245px;top:132px;width:420px;height:620px;border-radius:8px 26px 26px 8px;background:#efece4;box-shadow:0 26px 50px rgba(0,0,0,.35)"></div>')
    h.append('<div style="position:absolute;left:658px;top:140px;width:12px;height:604px;border-radius:0 8px 8px 0;background:repeating-linear-gradient(180deg,#f7f5ef 0 2px,#d8d4c8 2px 3px)"></div>')
    h.append('<div class="tex" style="position:absolute;left:230px;top:122px;width:432px;height:624px;border-radius:10px 28px 28px 10px;background:linear-gradient(150deg,#2a2a2e,#141416 55%,#0b0b0d);box-shadow:0 18px 30px rgba(0,0,0,.45),inset 0 1px 0 rgba(255,255,255,.08)"></div>')
    h.append('<div style="position:absolute;left:230px;top:122px;width:22px;height:624px;border-radius:10px 0 0 10px;background:linear-gradient(90deg,#0a0a0b,#26262a)"></div>')
    if pocket:
        h.append('<div class="tex" style="position:absolute;left:290px;top:420px;width:312px;height:250px;border-radius:14px;background:linear-gradient(180deg,#232327,#111113);box-shadow:0 -2px 0 rgba(255,255,255,.08),0 6px 12px rgba(0,0,0,.5)"></div>')
    if penloop:
        h.append('<div style="position:absolute;left:640px;top:330px;width:34px;height:120px;border-radius:8px;background:#1b1b1e;box-shadow:0 4px 8px rgba(0,0,0,.5)"></div>')
        h.append('<div style="position:absolute;left:651px;top:300px;width:12px;height:190px;border-radius:6px;background:linear-gradient(90deg,#9a9a9f,#dcdce0,#8a8a90)"></div>')
    # elastic
    h.append('<div style="position:absolute;left:590px;top:122px;width:16px;height:624px;background:#050506;box-shadow:0 0 6px rgba(0,0,0,.6)"></div>')
    # ribbon
    h.append('<div style="position:absolute;left:400px;top:735px;width:14px;height:70px;background:#050506;transform:rotate(12deg)"></div>')
    y = 320 if pocket else 400
    if deboss: h.append(f'<div class="deboss" style="left:230px;width:432px;top:{y}px;text-align:center">LOGO</div>')
    else: h.append(f'<div class="logo" style="left:230px;width:432px;top:{y}px;text-align:center">LOGO</div>')
    if label: h.append(f'<div style="position:absolute;left:230px;width:432px;top:{y+45}px;text-align:center;color:rgba(255,255,255,.35);font-size:11px;letter-spacing:3px;font-weight:300">{label}</div>')
    return "".join(h)

def kit():
    return """
    <div class="shadow" style="bottom:110px"></div>
    <div class="tex" style="position:absolute;left:60px;top:150px;width:640px;height:450px;border-radius:30px;background:linear-gradient(160deg,#2b2b2e,#151517 60%,#0d0d0f);box-shadow:0 30px 60px rgba(0,0,0,.4)"></div>
    <div class="tex" style="position:absolute;left:60px;top:150px;width:640px;height:190px;border-radius:30px 30px 56px 56px;background:linear-gradient(180deg,#333338,#1c1c1f);box-shadow:0 14px 24px rgba(0,0,0,.45)"></div>
    <div class="logo" style="left:60px;width:640px;top:470px;text-align:center;font-size:24px;letter-spacing:6px">LOGO</div>
    <div style="position:absolute;left:560px;top:160px;width:26px;height:56px;border-radius:6px;background:#2f2f33;box-shadow:0 3px 6px rgba(0,0,0,.6)"><div style="position:absolute;left:8px;top:6px;width:10px;height:10px;border-radius:50%;background:#bbb"></div></div>
    <div style="position:absolute;left:480px;top:380px;width:300px;height:440px;border-radius:8px 22px 22px 8px;background:#efece4;box-shadow:0 26px 50px rgba(0,0,0,.4)"></div>
    <div class="tex" style="position:absolute;left:470px;top:372px;width:305px;height:444px;border-radius:10px 24px 24px 10px;background:linear-gradient(150deg,#2a2a2e,#141416 55%,#0b0b0d);box-shadow:0 18px 30px rgba(0,0,0,.5)"></div>
    <div style="position:absolute;left:470px;top:372px;width:18px;height:444px;border-radius:10px 0 0 10px;background:linear-gradient(90deg,#0a0a0b,#26262a)"></div>
    <div style="position:absolute;left:728px;top:372px;width:12px;height:444px;background:#050506"></div>
    <div class="deboss" style="left:470px;width:305px;top:570px;text-align:center;font-size:20px">LOGO</div>
    """
shots={'cotin':sleeve_cotin(),'arconot':notebook(deboss=True,label='LOGO BAJO RELIEVE'),'cinco':notebook(deboss=True,pocket=True,label='BOLSILLO FRONTAL'),'mo6835':notebook(deboss=True,penloop=True,label='CUERO RECICLADO'),'xs_note':notebook(open_pages=True),'kit':kit()}
with sync_playwright() as p:
    b=p.chromium.launch(executable_path='/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell'); pg=b.new_page(viewport={'width':900,'height':900})
    for k,v in shots.items():
        pg.set_content(BASE.replace("@@BODY@@",v)); pg.wait_for_timeout(600); pg.screenshot(path=S+k+'.png'); print('ok',k)
    b.close()
