/* Propuesta Welcome Kit · Universo Merchan (pptxgenjs) */
const pptxgen = require("pptxgenjs");
const p = new pptxgen();
p.layout = "LAYOUT_WIDE"; // 13.33 x 7.5
const W = 13.33, H = 7.5;

// --- Brand tokens ---
const RED="DE0021", REDL="FF1A3D";
const INK="111827", INK2="1F2937";
const G600="4B5563", G500="6B7280", G400="9CA3AF", G300="D1D5DB", G200="E5E7EB", G100="F3F4F6";
const WHITE="FFFFFF", REDSOFT="FEE2E2";
const HF="Poppins", BF="Poppins Light";
const LOGO_W="/tmp/logo_white.png", LOGO_D="/tmp/logo_dark.png";
const IMG = n => `/tmp/imgs/${n}_r.png`;

const CFG = {
  file: "/mnt/user-data/outputs/Propuesta_WelcomeKit_UniversoMerchan.pptx",
  coverImg: IMG("kit"),
  title: "Welcome Kit\nEvento anual · Noviembre",
  coverSummary1: "100 fundas de portátil 16/17\" + 100 libretas A5 · todo en negro · logo a 2 caras y bajo relieve",
  coverSummary2: "Entrega en Madrid antes del evento (inicios de noviembre)",
  contact: "pedidos@universomerchan.com   ·   universomerchan.com",
  closingClaim: "Un kit negro, elegante y con\nvuestro logo en cada detalle.",
};
const QTY = "100 uds";
const FOOT_NOTE = "Precio orientativo · marcaje incluido · IVA no incluido · se confirma con arte final y muestra";

const OPTIONS = [
  { img: IMG("ref_sq"), badge:"Funda · Opción A · Recomendada", badgeFill:RED, badgeCol:WHITE, badgeW:3.35,
    ref:"Grupo Xscape · fabricación a medida", tag:"Efecto Wow · 16/17\"", tagW:2.55,
    name:"Funda premium 16/17\" a medida", sub:"La referencia que nos habéis pasado, en vuestra versión: negro total, logo a las dos caras y etiqueta con el logo reducido. Fabricada con nuestro partner Grupo Xscape.",
    hi:true, colors:["#111111"], colorsLabel:"Negro",
    specs:[["Material","Poliéster resistente al agua · espuma 8 mm · forro aterciopelado"],
           ["Medidas","Portátiles de 16/17\" (aprox. 42 × 30 cm) · bolsillo frontal con cremallera"],
           ["Colores",""],
           ["Detalle","Etiqueta tejida / PU con el logo reducido · cremalleras a tono"],
           ["Marcaje","Logo a 2 caras (serigrafía o transfer) · tono sobre tono o blanco"]],
    ppu:"14,90", total:"1.490", imgNote:"Imagen de referencia facilitada por el cliente" },

  { img: IMG("cotin"), badge:"Funda · Opción B", badgeFill:INK, badgeCol:WHITE, badgeW:2.0,
    ref:"Ref. MO2191 · COTIN · universomerchan.com", tag:"Stock europeo · < 10 días", tagW:2.95,
    name:"COTIN · Funda 15\" algodón 220 g/m²", sub:"Alternativa en stock, sin mínimos de fabricación y entrega en menos de 10 días. Atención: es para portátiles de hasta 15\" (39,5 × 27 cm).",
    hi:false, colors:["#111111"], colorsLabel:"Negro",
    specs:[["Material","Algodón acolchado 220 g/m² · forro interior 120 g/m²"],
           ["Medidas","39,5 × 27 cm · portátiles hasta 15\""],
           ["Colores",""],
           ["Detalle","Cierre con botón de bambú · acabado natural y elegante"],
           ["Marcaje","Logo a 1 tinta · serigrafía · 2 caras"]],
    ppu:"9,00", total:"900", imgNote:"Imagen ilustrativa" },

  { img: IMG("arconot"), badge:"Libreta · Opción A · Recomendada", badgeFill:RED, badgeCol:WHITE, badgeW:3.55,
    ref:"Ref. MO1804 · ARCONOT · universomerchan.com", tag:"Mejor relación calidad-precio", tagW:3.05,
    name:"ARCONOT · Libreta A5 PU tapa rígida", sub:"Tacto suave, negro total y logo en bajo relieve. La libreta corporativa por excelencia, en stock y con entrega en menos de 10 días.",
    hi:true, colors:["#111111"], colorsLabel:"Negro",
    specs:[["Material","Tapa rígida PU soft-touch · encuadernación cartoné"],
           ["Formato","A5 · 21 × 14 × 1,6 cm"],
           ["Colores",""],
           ["Interior","96 hojas (192 pág.) rayadas · papel reciclado · goma y cinta marcapáginas"],
           ["Marcaje","Logo en bajo relieve (grabado en seco) en portada"]],
    ppu:"3,95", total:"395", imgNote:"Imagen ilustrativa" },

  { img: IMG("cinco"), badge:"Libreta · Opción B", badgeFill:INK, badgeCol:WHITE, badgeW:2.15,
    ref:"Ref. MO2285 · CINCO · universomerchan.com", tag:"Con bolsillo para el móvil", tagW:2.95,
    name:"CINCO · Libreta A5 PU con bolsillo", sub:"Tapa dura de PU con bolsillo frontal para el teléfono: un detalle práctico que se nota en el día a día.",
    hi:false, colors:["#111111"], colorsLabel:"Negro",
    specs:[["Material","Tapa dura PU · bolsillo frontal"],
           ["Formato","A5 · 21 × 14 cm"],
           ["Colores",""],
           ["Interior","80 hojas (160 pág.) rayadas · papel reciclado · cinta marcapáginas"],
           ["Marcaje","Logo en bajo relieve (grabado en seco) en portada"]],
    ppu:"4,60", total:"460", imgNote:"Imagen ilustrativa" },

  { img: IMG("mo6835"), badge:"Libreta · Opción C", badgeFill:INK, badgeCol:WHITE, badgeW:2.15,
    ref:"Ref. MO6835 · universomerchan.com", tag:"Cuero reciclado · selección ECO", tagW:3.35,
    name:"Libreta A5 cuero reciclado", sub:"Tapa de cuero reciclado: tacto premium, mensaje sostenible y bajo relieve muy limpio.",
    hi:false, colors:["#111111"], colorsLabel:"Negro",
    specs:[["Material","70 % cuero reciclado pre-consumo · 30 % PU"],
           ["Formato","A5 · 21 × 14 cm"],
           ["Colores",""],
           ["Interior","96 hojas (192 pág.) rayadas · papel reciclado · goma de algodón y portabolígrafos"],
           ["Marcaje","Logo en bajo relieve (grabado en seco) en portada"]],
    ppu:"5,15", total:"515", imgNote:"Imagen ilustrativa" },

  { img: IMG("xs_note"), badge:"Libreta · Opción D · Efecto Wow", badgeFill:RED, badgeCol:WHITE, badgeW:3.35,
    ref:"Grupo Xscape · fabricación a medida", tag:"Hojas con vuestro logo", tagW:2.75,
    name:"Libreta A5 a medida · polipiel negra", sub:"Exactamente lo que pedís: tapa dura en polipiel negra con logo bajo relieve en portada y contraportada, e interior rayado con el logo impreso en cada hoja.",
    hi:false, colors:["#111111"], colorsLabel:"Negro",
    specs:[["Material","Tapa dura polipiel negra (cartón 2 mm forrado) · guardas personalizadas"],
           ["Formato","A5 · 14 × 21 cm"],
           ["Colores",""],
           ["Interior","80–96 hojas rayadas con logo impreso a 1 tinta · goma, cinta y bolsillo interior"],
           ["Marcaje","Logo en bajo relieve en portada y contraportada"]],
    ppu:"8,90", total:"890", imgNote:"Imagen ilustrativa" },
];

// ---------- helpers ----------
function pill(s,txt,x,y,fill,col,w){
  w=w||(0.28+txt.length*0.105);
  s.addShape(p.shapes.ROUNDED_RECTANGLE,{x,y,w,h:0.42,fill:{color:fill},rectRadius:0.21});
  s.addText(txt.toUpperCase(),{x,y,w,h:0.42,align:"center",valign:"middle",fontFace:HF,fontSize:10.5,bold:true,color:col,charSpacing:1.5,margin:0});
}
function foot(s,n,dark){
  s.addImage({path:dark?LOGO_W:LOGO_D, x:0.6, y:H-0.55, w:1.5, h:0.515});
  if(n) s.addText(String(n),{x:W-1.0,y:H-0.5,w:0.4,h:0.3,align:"right",fontFace:BF,fontSize:9,color:G400,margin:0});
}
function circleNum(s,n,x,y,d=0.5){
  s.addShape(p.shapes.OVAL,{x,y,w:d,h:d,fill:{color:RED}});
  s.addText(String(n),{x,y,w:d,h:d,align:"center",valign:"middle",fontFace:HF,fontSize:13,bold:true,color:WHITE,margin:0});
}

// ---------- 1 · COVER ----------
let s=p.addSlide(); s.background={color:INK};
s.addShape(p.shapes.ROUNDED_RECTANGLE,{x:0,y:0,w:4.95,h:H,fill:{color:INK2}});
s.addShape(p.shapes.ROUNDED_RECTANGLE,{x:0.7,y:1.65,w:3.6,h:3.6,fill:{color:WHITE},rectRadius:0.3,
  shadow:{type:"outer",color:"000000",blur:18,offset:5,angle:135,opacity:0.45}});
s.addImage({path:CFG.coverImg, x:0.85, y:1.8, w:3.3, h:3.3});
s.addText("#GeneraEmociones",{x:0.7,y:5.55,w:3.8,h:0.4,fontFace:HF,fontSize:13,bold:true,italic:true,color:REDL,margin:0});
s.addImage({path:LOGO_W, x:5.35, y:0.7, w:2.3, h:0.79});
pill(s,"Propuesta comercial",5.4,1.95,RED,WHITE,2.55);
s.addText(CFG.title,{x:5.35,y:2.55,w:7.6,h:1.9,fontFace:HF,fontSize:38,bold:true,color:WHITE,lineSpacing:42,margin:0});
s.addText([{text:CFG.coverSummary1,options:{color:G300,fontSize:14,breakLine:true}},
           {text:CFG.coverSummary2,options:{color:REDL,fontSize:15,bold:true}}],
  {x:5.4,y:4.55,w:7.5,h:0.9,fontFace:BF,lineSpacing:24,margin:0});
s.addShape(p.shapes.ROUNDED_RECTANGLE,{x:5.4,y:5.7,w:3.2,h:0.6,fill:{color:RED},rectRadius:0.3});
s.addText("Elige · Personaliza · Recibe",{x:5.4,y:5.7,w:3.2,h:0.6,align:"center",valign:"middle",fontFace:HF,fontSize:12.5,bold:true,color:WHITE,margin:0});
s.addText(CFG.contact,{x:5.4,y:6.55,w:7.5,h:0.35,fontFace:BF,fontSize:11.5,color:G400,margin:0});

// ---------- 2 · BRIEFING ----------
s=p.addSlide(); s.background={color:WHITE};
pill(s,"El kit en un vistazo",0.6,0.6,REDSOFT,RED,2.55);
s.addText("Dos piezas, un mismo lenguaje: negro, sobrio y con el logo presente",{x:0.6,y:1.1,w:12.1,h:0.7,fontFace:HF,fontSize:22,bold:true,color:INK,margin:0});
function card(x,title,ask,ours){
  s.addShape(p.shapes.ROUNDED_RECTANGLE,{x,y:2.15,w:5.95,h:4.15,fill:{color:G100},rectRadius:0.16,line:{color:G200,width:1}});
  s.addText(title,{x:x+0.35,y:2.35,w:5.3,h:0.5,fontFace:HF,fontSize:17,bold:true,color:INK,margin:0});
  s.addText("Lo que pedís",{x:x+0.35,y:2.9,w:2.5,h:0.3,fontFace:HF,fontSize:10.5,bold:true,color:RED,charSpacing:1,margin:0});
  s.addText(ask.map((t,i)=>({text:t,options:{bullet:{code:"2022"},breakLine:i<ask.length-1}})),{x:x+0.35,y:3.2,w:5.3,h:1.35,fontFace:BF,fontSize:11.5,color:INK,lineSpacing:16,margin:0,paraSpaceAfter:2});
  s.addText("Lo que proponemos",{x:x+0.35,y:4.6,w:3,h:0.3,fontFace:HF,fontSize:10.5,bold:true,color:RED,charSpacing:1,margin:0});
  s.addText(ours.map((t,i)=>({text:t,options:{bullet:{code:"2022"},breakLine:i<ours.length-1}})),{x:x+0.35,y:4.9,w:5.3,h:1.3,fontFace:BF,fontSize:11.5,color:INK,lineSpacing:16,margin:0,paraSpaceAfter:2});
}
card(0.6,"100 fundas de portátil 16/17\"",
  ["Negras, logo a ambas caras y etiqueta con el logo reducido","Exterior de poliéster resistente al agua, espuma 8 mm y forro aterciopelado"],
  ["Opción A · a medida con Grupo Xscape: idéntica a vuestra referencia, en 16/17\" (recomendada)","Opción B · COTIN en stock: algodón 220 g/m², sólo hasta 15\""]);
card(6.75,"100 libretas A5 (14 × 21 cm)",
  ["Tapa dura en polipiel o similar, negra, con logo en bajo relieve","Interior rayado; si las hojas pueden llevar el logo, ideal"],
  ["Opciones A–C · en stock (PU, PU con bolsillo, cuero reciclado): bajo relieve en portada, entrega < 10 días","Opción D · a medida con Grupo Xscape: bajo relieve a 2 caras y logo impreso en cada hoja"]);
s.addText("Todos los artículos en negro · logo en bajo relieve o tono sobre tono para un acabado elegante · boceto digital en 24–48 h",{x:0.6,y:6.5,w:12.1,h:0.35,fontFace:BF,fontSize:11,italic:true,color:G500,margin:0});
foot(s,2);

// ---------- producto ----------
function product(n,o){
  let s=p.addSlide(); s.background={color:WHITE};
  s.addShape(p.shapes.ROUNDED_RECTANGLE,{x:0.6,y:1.25,w:4.55,h:5.0,fill:{color:G100},rectRadius:0.14,line:{color:G200,width:1}});
  s.addImage({path:o.img,x:1.05,y:1.45,w:3.65,h:3.65});
  if(o.imgNote) s.addText(o.imgNote,{x:1.05,y:5.1,w:3.7,h:0.3,fontFace:BF,fontSize:8.5,italic:true,color:G400,margin:0});
  pill(s,o.badge,1.05,5.42,o.badgeFill,o.badgeCol,o.badgeW);
  s.addText(o.ref,{x:1.05,y:5.9,w:3.9,h:0.32,fontFace:HF,fontSize:10.5,bold:true,color:INK,margin:0});
  pill(s,o.tag,5.55,0.7,REDSOFT,RED,o.tagW);
  s.addText(o.name,{x:5.5,y:1.2,w:7.4,h:0.85,fontFace:HF,fontSize:27,bold:true,color:INK,margin:0});
  s.addText(o.sub,{x:5.55,y:2.05,w:7.35,h:0.7,fontFace:BF,fontSize:12,italic:true,color:G500,lineSpacing:16,margin:0});
  let yy=2.85;
  o.specs.forEach((r,i)=>{
    const Y=yy+i*0.5;
    s.addText(r[0],{x:5.55,y:Y,w:2.5,h:0.44,fontFace:HF,fontSize:12,bold:true,color:RED,valign:"middle",margin:0});
    if(r[0]==="Colores" && o.colors){
      const d=0.17, gap=0.222, cyc=Y+(0.44-d)/2;
      o.colors.forEach((hx,k)=>{
        s.addShape(p.shapes.OVAL,{x:8.05+k*gap,y:cyc,w:d,h:d,fill:{color:hx.replace('#','')},line:{color:G300,width:0.75}});
      });
      if(o.colorsLabel) s.addText(o.colorsLabel,{x:8.05+o.colors.length*gap+0.06,y:Y,w:2.2,h:0.44,fontFace:BF,fontSize:12,color:INK,valign:"middle",margin:0});
    } else {
      s.addText(r[1],{x:8.05,y:Y,w:4.85,h:0.44,fontFace:BF,fontSize:11,color:INK,valign:"middle",margin:0,lineSpacing:13});
    }
    s.addShape(p.shapes.LINE,{x:5.55,y:Y+0.45,w:7.35,h:0,line:{color:G200,width:0.75}});
  });
  const py=yy+o.specs.length*0.5+0.22;
  s.addShape(p.shapes.ROUNDED_RECTANGLE,{x:5.55,y:py,w:7.35,h:1.2,fill:{color:o.hi?REDSOFT:G100},rectRadius:0.12,line:{color:o.hi?RED:G200,width:o.hi?1.25:1}});
  s.addText([{text:o.ppu,options:{fontSize:30,bold:true,color:RED,fontFace:HF}},{text:"  €/ud",options:{fontSize:13,color:G500,fontFace:BF}}],
    {x:5.85,y:py+0.16,w:3.3,h:0.9,valign:"middle",margin:0});
  s.addShape(p.shapes.LINE,{x:9.05,y:py+0.24,w:0,h:0.72,line:{color:o.hi?RED:G300,width:1}});
  s.addText([{text:"Total "+(o.qtyLabel||QTY),options:{fontSize:11.5,color:G500,fontFace:BF,breakLine:true}},{text:o.total+"  €",options:{fontSize:23,bold:true,color:INK,fontFace:HF}}],
    {x:9.35,y:py+0.16,w:3.5,h:0.9,valign:"middle",margin:0});
  s.addText(FOOT_NOTE,{x:5.55,y:py+1.3,w:7.35,h:0.3,fontFace:BF,fontSize:10,italic:true,color:G500,margin:0});
  foot(s,n);
}
OPTIONS.forEach((o,i)=>product(i+3,o));

// ---------- RESUMEN ECONÓMICO ----------
s=p.addSlide(); s.background={color:WHITE};
pill(s,"Resumen económico",0.6,0.6,REDSOFT,RED,2.45);
s.addText("Tres formas de montar el kit (100 unidades)",{x:0.6,y:1.1,w:12.1,h:0.7,fontFace:HF,fontSize:24,bold:true,color:INK,margin:0});
const kits=[
  {name:"Kit Wow",tag:"Máximo efecto Wow",hi:true,items:[["Funda premium 16/17\" a medida · Xscape","14,90"],["Libreta A5 a medida · hojas con logo · Xscape","8,90"]],ppu:"23,80",total:"2.380"},
  {name:"Kit Equilibrado",tag:"Wow + stock",hi:false,items:[["Funda premium 16/17\" a medida · Xscape","14,90"],["ARCONOT A5 PU · bajo relieve · MO1804","3,95"]],ppu:"18,85",total:"1.885"},
  {name:"Kit Smart",tag:"Todo en stock · < 10 días",hi:false,items:[["COTIN 15\" algodón · MO2191","9,00"],["ARCONOT A5 PU · bajo relieve · MO1804","3,95"]],ppu:"12,95",total:"1.295"},
];
kits.forEach((k,i)=>{
  const x=0.6+i*4.1;
  s.addShape(p.shapes.ROUNDED_RECTANGLE,{x,y:2.05,w:3.9,h:4.3,fill:{color:k.hi?REDSOFT:G100},rectRadius:0.16,line:{color:k.hi?RED:G200,width:k.hi?1.25:1}});
  pill(s,k.tag,x+0.3,2.3,k.hi?RED:INK,WHITE,k.tag.length>14?2.9:1.7);
  s.addText(k.name,{x:x+0.3,y:2.85,w:3.3,h:0.5,fontFace:HF,fontSize:20,bold:true,color:INK,margin:0});
  k.items.forEach((it,j)=>{
    const y=3.5+j*0.75;
    s.addText(it[0],{x:x+0.3,y,w:2.55,h:0.6,fontFace:BF,fontSize:10.5,color:INK,valign:"middle",margin:0,lineSpacing:13});
    s.addText(it[1]+" €",{x:x+2.85,y,w:0.8,h:0.6,fontFace:HF,fontSize:11.5,bold:true,color:G600,valign:"middle",align:"right",margin:0});
    s.addShape(p.shapes.LINE,{x:x+0.3,y:y+0.65,w:3.35,h:0,line:{color:k.hi?"F5B5BD":G300,width:0.75}});
  });
  s.addText([{text:k.ppu,options:{fontSize:26,bold:true,color:RED,fontFace:HF}},{text:"  €/kit",options:{fontSize:11,color:G500,fontFace:BF}}],{x:x+0.3,y:5.1,w:3.3,h:0.6,valign:"middle",margin:0});
  s.addText([{text:"Total 100 kits  ",options:{fontSize:10.5,color:G500,fontFace:BF}},{text:k.total+" €",options:{fontSize:17,bold:true,color:INK,fontFace:HF}}],{x:x+0.3,y:5.7,w:3.3,h:0.45,valign:"middle",margin:0});
});
s.addText("Precios orientativos por unidad con marcaje incluido · IVA no incluido · se confirman con el arte final del logo y la muestra física",{x:0.6,y:6.45,w:12.1,h:0.35,fontFace:BF,fontSize:10.5,italic:true,color:G500,margin:0});
foot(s,3+OPTIONS.length);

// ---------- PLAZOS ----------
s=p.addSlide(); s.background={color:WHITE};
pill(s,"Plazos y proceso",0.6,0.6,REDSOFT,RED,2.25);
s.addText("Llegamos a inicios de noviembre si cerramos en septiembre",{x:0.6,y:1.1,w:12.1,h:0.7,fontFace:HF,fontSize:24,bold:true,color:INK,margin:0});
const steps=[
  ["Elección y arte final","Elegís opciones y nos pasáis el logo en vector. Boceto digital en 24–48 h.","Hasta el 26 sept."],
  ["Muestra física","Para las piezas a medida (Xscape) fabricamos una muestra pre-producción para vuestro OK.","7–10 días"],
  ["Producción","A medida: 4–5 semanas. Stock Universo Merchan: 7–10 días laborables con marcaje.","Octubre"],
  ["Entrega en Madrid","Transporte 24–48 h. Kits listos la última semana de octubre, con margen para el evento.","Última sem. oct."],
];
steps.forEach((st,i)=>{
  const x=0.6+i*3.1;
  s.addShape(p.shapes.ROUNDED_RECTANGLE,{x,y:2.1,w:2.9,h:3.6,fill:{color:G100},rectRadius:0.16,line:{color:G200,width:1}});
  circleNum(s,i+1,x+0.3,2.4);
  s.addText(st[0],{x:x+0.3,y:3.05,w:2.4,h:0.5,fontFace:HF,fontSize:14.5,bold:true,color:INK,margin:0});
  s.addText(st[1],{x:x+0.3,y:3.6,w:2.4,h:1.35,fontFace:BF,fontSize:11,color:G600,lineSpacing:15,margin:0});
  pill(s,st[2],x+0.3,5.05,RED,WHITE,2.3);
});
s.addShape(p.shapes.ROUNDED_RECTANGLE,{x:0.6,y:5.95,w:12.1,h:0.85,fill:{color:INK},rectRadius:0.14});
s.addText([{text:"+2.000",options:{color:REDL,bold:true,fontFace:HF,fontSize:16}},{text:"  productos    ",options:{color:G300,fontFace:BF,fontSize:11}},
           {text:"< 10",options:{color:REDL,bold:true,fontFace:HF,fontSize:16}},{text:"  días de entrega en stock    ",options:{color:G300,fontFace:BF,fontSize:11}},
           {text:"80%",options:{color:REDL,bold:true,fontFace:HF,fontSize:16}},{text:"  producción europea    ",options:{color:G300,fontFace:BF,fontSize:11}},
           {text:"17",options:{color:REDL,bold:true,fontFace:HF,fontSize:16}},{text:"  técnicas de impresión",options:{color:G300,fontFace:BF,fontSize:11}}],
  {x:0.6,y:5.95,w:12.1,h:0.85,align:"center",valign:"middle",margin:0});
foot(s,4+OPTIONS.length);

// ---------- cierre ----------
s=p.addSlide(); s.background={color:INK};
s.addImage({path:LOGO_W,x:0.6,y:0.75,w:2.4,h:0.825});
pill(s,"#GeneraEmociones",0.6,2.85,RED,WHITE,2.2);
s.addText(CFG.closingClaim,{x:0.6,y:3.45,w:12,h:1.7,fontFace:HF,fontSize:38,bold:true,color:WHITE,lineSpacing:44,margin:0});
s.addText("Siguiente paso: nos confirmáis opciones y os enviamos el boceto digital con vuestro logo en 24–48 h.",{x:0.6,y:5.4,w:12,h:0.5,fontFace:BF,fontSize:14,color:G300,margin:0});
s.addText(CFG.contact+"   ·   Madrid, España",{x:0.6,y:6.4,w:12.1,h:0.4,fontFace:BF,fontSize:12,color:G400,margin:0});

p.writeFile({fileName:CFG.file}).then(f=>console.log("WROTE",f));
