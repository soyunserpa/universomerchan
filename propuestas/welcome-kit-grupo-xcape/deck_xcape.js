/* ==========================================================================
 * Propuesta Welcome Kit · grupo xcape  —  Universo Merchan
 * Deck negro para envío directo a cliente. Sin enlaces ni referencias.
 * ========================================================================== */
const pptxgen = require("pptxgenjs");
const p = new pptxgen();
p.layout = "LAYOUT_WIDE";
const W = 13.333, H = 7.5;
p.author = "Universo Merchan";
p.company = "Universo Merchan";
p.title = "Propuesta Welcome Kit · grupo xcape";

// ---------- tokens ----------
const BG = "0A0B0D", S1 = "14161A", S2 = "1C1F24", S3 = "23272E";
const BD = "2C313A", BD2 = "3A404A";
const TX = "FFFFFF", T2 = "A8AEB8", T3 = "757C88", T4 = "555B66";
const RED = "DE0021", REDL = "FF2D4D", REDDK = "2A0409";
const HF = "Poppins", BF = "Poppins Light";
const UM = "/tmp/logo_white.png";
const XC = "/tmp/brand/xcape_white_t.png";
const fs = require("fs");
// Si existe la foto real en /tmp/fotos la usa; si no, cae a la maqueta.
const REAL = "/tmp/fotos/";
const I = n => {
  for (const ext of [".jpg", ".jpeg", ".png", ".webp"]) {
    const f = REAL + n + ext;
    if (fs.existsSync(f)) return f;
  }
  const light = `/tmp/xcs/${n}.jpg`;
  if (fs.existsSync(light)) return light;
  return `/tmp/xc/${n}.png`;
};

let n = 0;

// ---------- helpers ----------
function pill(s, txt, x, y, { fill = RED, col = TX, w = null, h = 0.32, fs = 8.5, line = null } = {}) {
  const t = txt.toUpperCase();
  w = w || 0.30 + t.length * 0.088;
  s.addShape(p.shapes.ROUNDED_RECTANGLE, {
    x, y, w, h, fill: fill === "none" ? { type: "none" } : { color: fill },
    rectRadius: h / 2, line: line ? { color: line, width: 1 } : { type: "none" },
  });
  s.addText(t, { x, y, w, h, align: "center", valign: "middle", fontFace: HF, fontSize: fs, bold: true, color: col, charSpacing: 1.4, margin: 0 });
  return w;
}
function rule(s, x, y, w, c = BD) {
  s.addShape(p.shapes.RECTANGLE, { x, y, w, h: 0.009, fill: { color: c }, line: { type: "none" } });
}
function slide(dark = true) {
  const s = p.addSlide();
  s.background = { color: BG };
  return s;
}
function foot(s, showN = true) {
  n++;
  s.addImage({ path: UM, x: 0.62, y: H - 0.60, w: 1.16, h: 0.40 });
  if (showN) s.addText(String(n).padStart(2, "0"), { x: W - 1.10, y: H - 0.55, w: 0.5, h: 0.30, align: "right", fontFace: BF, fontSize: 9, color: T4, margin: 0 });
}
function notaPie(s, txt) {
  s.addText(txt, { x: 2.02, y: H - 0.54, w: 9.6, h: 0.30, valign: "middle", fontFace: BF, fontSize: 8.5, italic: true, color: T4, margin: 0 });
}
function head(s, kicker, title, sub) {
  pill(s, kicker, 0.62, 0.56, { fill: REDDK, col: REDL, line: RED });
  s.addText(title, { x: 0.58, y: 0.98, w: 11.9, h: 0.66, fontFace: HF, fontSize: 24, bold: true, color: TX, margin: 0 });
  if (sub) s.addText(sub, { x: 0.62, y: 1.62, w: 11.9, h: 0.34, fontFace: BF, fontSize: 12, color: T3, margin: 0 });
}
function card(s, x, y, w, h, fill = S1, border = BD, r = 0.14) {
  s.addShape(p.shapes.ROUNDED_RECTANGLE, { x, y, w, h, fill: { color: fill }, rectRadius: r, line: { color: border, width: 1 } });
}

// =============== DATOS ===============
const PRODUCTOS = [
  {
    id: "kl", titulo: "Funda portátil acolchada",
    familia: "Funda para portátil",
    claim: "Nailon acolchado en rombo, formato vertical y bolsillo frontal abierto.",
    hero: "kl_front",
    fotos: [["kl_front", "Frontal"], ["kl_back", "Trasera acolchada"], ["kl_detail", "Bolsillo frontal"], ["kl_laptop", "Con el portátil dentro"]],
    desc: "Funda vertical acolchada para portátiles de hasta 15\". El portátil entra por la parte superior y la cremallera recorre el perímetro en forma de U, con tirador de tela a tono, de modo que la apertura es amplia y el equipo entra y sale sin forzar.\n\nEl exterior es de nailon mate con acolchado en rombo de trazo amplio, que da cuerpo a la pieza y un aspecto técnico muy reconocible. Bajo el tejido hay una capa de espuma de 4 mm que amortigua golpes, y el interior va forrado en poliéster 210D para no rayar la carcasa. En la cara frontal, un bolsillo abierto ocupa los dos tercios inferiores: entra el cargador, el ratón o un par de cables, a mano y sin cremallera que abrir.",
    specs: [
      ["Material exterior", "Nailon mate con acolchado en rombo"],
      ["Protección", "Espuma de 4 mm en las paredes"],
      ["Forro interior", "Poliéster 210D"],
      ["Formato", "Vertical · entrada superior"],
      ["Medidas", "26,5 × 2,5 × 37 cm"],
      ["Capacidad", "Portátiles de hasta 15\""],
      ["Cierre", "Cremallera perimetral en U con tirador de tela"],
      ["Bolsillo", "Frontal abierto, dos tercios de la cara"],
      ["Color", "Negro"],
    ],
    marcajeImg: "kl_zone",
    tecnica: { nombre: "Serigrafía", detalle: "1 color · 1 posición", pos: "Bolsillo frontal" },
    alternativas: [
      ["Serigrafía", "Tintas sólidas, ideal para grandes tiradas. Es la opción presupuestada, en blanco sobre negro."],
      ["Sublimación / Transfer", "Calidad de impresión extrema."],
      ["Transfer digital", "Fotográfico y muy resistente."],
      ["Transfer reflectante", "Alta visibilidad técnica."],
    ],
    nota: "El producto admite una única posición de marcaje, centrada en el bolsillo frontal.",
    precio: "9,00", total: "900", cantidad: "100 uds",
  },
  {
    id: "sp", titulo: "Funda portátil reciclada",
    familia: "Funda para portátil",
    claim: "100 % rPET con forro a juego, bolsillo frontal con cremallera y marcaje en las dos caras.",
    hero: "sp_front",
    fotos: [["sp_front", "Frontal"], ["sp_back", "Vista tres cuartos"], ["sp_detail", "Apertura y compartimentos"], ["sp_p_front", "Área de marcaje"]],
    desc: "Funda de formato apaisado para portátiles de 15,6\", fabricada en rPET 100 % con un forro interior también de rPET. Es una pieza sobria y de acabado profesional: silueta plana, tejido mate y todo el herraje en negro, sin un solo elemento que rompa el conjunto.\n\nEl compartimento principal aloja de forma segura los portátiles modernos de 15,6\" y la cremallera recorre el perímetro con un deslizamiento suave y firme. En la cara frontal, un bolsillo con cremallera propia, rematado en pico en las esquinas superiores, resuelve el acceso rápido a lo esencial: cargador, cables o documentación.\n\nEstá fabricada con poliéster reciclado que incorpora un trazador de material verificable, es libre de PVC y el 2 % de los ingresos de cada unidad vendida se destina a Water.org. Su huella declarada es de 1,55 kg de CO₂.",
        specs: [
      ["Material exterior", "100 % rPET (poliéster reciclado)"],
      ["Forro interior", "rPET a juego"],
      ["Formato", "Apaisado · cremallera perimetral"],
      ["Capacidad", "Portátiles de 15,6\""],
      ["Cierre", "Cremallera reforzada de deslizamiento suave"],
      ["Bolsillo", "Frontal con cremallera, remate en pico"],
      ["Composición", "Libre de PVC"],
      ["Sostenibilidad", "Trazador verificable · 2 % a Water.org"],
      ["Huella", "1,55 kg de CO₂"],
      ["Color", "Negro"],
    ],
    marcajeImg: "sp_zone",
    tecnica: { nombre: "Serigrafía", detalle: "1 color · 2 posiciones", pos: "Frontal y trasera" },
    alternativas: [
      ["Serigrafía", "Hasta 4 colores planos. La opción presupuestada, en blanco sobre negro."],
      ["Transfer serigráfico", "Hasta 8 colores, con más definición en logotipos finos."],
      ["Transfer digital", "Todo color, para versiones completas del logotipo."],
      ["Bordado", "Relieve textil, acabado de gama alta."],
    ],
    nota: "Las áreas exactas de marcaje se confirman con el arte final.",
    posiciones: [
      { img: "sp_p_front", nombre: "Frontal", med: "200 × 100 mm", hi: true,
        tec: [["Serigrafía transfer", "hasta 6 colores"], ["Transfer digital", "hasta 6 colores"]] },
      { img: "sp_p_back", nombre: "Trasera", med: "200 × 150 mm", hi: true,
        tec: [["Serigrafía transfer", "hasta 6 colores"], ["Transfer digital", "hasta 6 colores"]] },
      { img: "sp_p_up", nombre: "Franja superior", med: "100 × 25 mm",
        tec: [["Serigrafía transfer", "hasta 6 colores"], ["Transfer digital", "hasta 6 colores"]] },
      { img: "sp_p_emb", nombre: "Bordado", med: "140 × 140 mm",
        tec: [["Bordado", "hasta 12 colores"], ["Única posición", "para esta técnica"]] },
    ],
    precio: "14,00", total: "1.400", cantidad: "100 uds", hi: true,
  },
  {
    id: "tz", titulo: "Cuaderno A5 premium",
    familia: "Libreta",
    claim: "Tapa dura en símil piel con placa metálica pulida grabada a láser.",
    hero: "tz_front",
    fotos: [["tz_front", "Vista general"], ["tz_detail", "Placa metálica grabada"], ["tz_open", "Interior en papel crema"], ["tz_back", "Lomo y bandas de estrías"]],
    desc: "Cuaderno A5 de tapa dura forrada en símil piel de textura graneada, con dos bandas de estrías finas en relieve que cruzan la portada y la contraportada y le dan una personalidad muy reconocible. El elemento que lo distingue es la placa metálica pulida aplicada en el canto derecho de la tapa: es la zona natural para el logotipo y, grabada a láser, deja una marca permanente sobre el único brillo de la pieza.\n\nEl interior son 160 páginas rayadas en papel reciclado color crema, con una encuadernación que permite abrir el cuaderno y que se quede plano sobre la mesa. Se cierra con goma elástica vertical a tono y lleva cinta marcapáginas integrada en el lomo, ambas en negro.",
    specs: [
      ["Material", "Tapa dura en símil piel (PU) con textura graneada"],
      ["Detalle", "Placa metálica pulida aplicada en portada"],
      ["Relieve", "Bandas de estrías finas en portada y contraportada"],
      ["Formato", "A5 · 21,2 × 14,6 × 1,6 cm"],
      ["Interior", "160 páginas (80 hojas) rayadas"],
      ["Papel", "Papel reciclado color crema"],
      ["Encuadernación", "Apertura plana"],
      ["Cierre", "Goma elástica vertical a tono"],
      ["Extras", "Cinta marcapáginas integrada"],
      ["Color", "Negro"],
    ],
    tecnica: { nombre: "Grabado láser", detalle: "1 color · 1 posición", pos: "Placa metálica frontal" },
    posiciones: [
      { img: "tz_p_up", nombre: "Portada superior", med: "70 × 80 mm", tec: [["Termograbado", "1 color"], ["Serigrafía", "4 colores"], ["Transfer serigráfico", "8 colores"], ["Transfer reflectante", "1 color"]] },
      { img: "tz_p_low", nombre: "Portada inferior", med: "85 × 70 mm", tec: [["Termograbado", "1 color"], ["Serigrafía", "4 colores"], ["Transfer serigráfico", "8 colores"], ["Transfer reflectante", "1 color"]] },
      { img: "tz_plate", nombre: "Placa frontal", med: "45 × 25 mm", tec: [["Etiqueta digital", "Todo color"], ["Gota de resina", "Todo color"], ["Grabado a láser", "1 color"], ["Tampografía", "4 colores"]], hi: true },
      { img: "tz_p_back", nombre: "Contraportada", med: "120 × 80 mm", tec: [["Termograbado", "1 color"], ["Serigrafía", "4 colores"], ["Transfer serigráfico", "8 colores"], ["Transfer reflectante", "1 color"]] },
      { img: "tz_p_pad", nombre: "Pad frontal", med: "80 × 40 mm", tec: [["Tampografía", "2 colores"]] },
    ],
    precio: "4,10", total: "410", cantidad: "100 uds", hi: true,
  },
  {
    id: "ar", titulo: "Libreta A5 clásica",
    familia: "Libreta",
    claim: "Tapa dura de PU liso con el logotipo termograbado en seco.",
    hero: "ar_front",
    fotos: [["ar_front", "Vista general"], ["ar_open", "Canto y marcapáginas"], ["ar_p_front", "Área de portada"], ["ar_p_back", "Área de contraportada"]],
    desc: "La libreta corporativa por excelencia: tapa rígida forrada en PU de tacto suave, formato A5 y un negro mate uniforme, sin brillos ni contrastes. Es la opción más sobria de la propuesta y la que mejor resiste el uso diario, porque la tapa dura protege el bloque de hojas cuando la libreta viaja dentro de una mochila.\n\nEl interior son 192 páginas rayadas en papel reciclado, con goma elástica de cierre y cinta marcapáginas, ambas a tono. Sobre esta tapa el termograbado funciona especialmente bien: el logotipo queda hundido en el PU, tono sobre tono, sin tinta y sin desgaste posible.",
    specs: [
      ["Material", "Tapa dura forrada en PU liso de tacto suave"],
      ["Formato", "A5 · 21 × 14 × 1,6 cm"],
      ["Interior", "192 páginas (96 hojas) rayadas"],
      ["Papel", "Papel reciclado color crema"],
      ["Cierre", "Goma elástica vertical junto al canto"],
      ["Extras", "Cinta marcapáginas a tono"],
      ["Acabado", "Canto redondeado, sin brillos"],
      ["Color", "Negro"],
    ],
    marcajeImg: "ar_zone",
    tecnica: { nombre: "Termograbado", detalle: "1 color · 1 posición", pos: "Portada centrada" },
    alternativas: [
      ["Termograbado en portada", "Relieve en seco, sin tinta. Es la opción presupuestada: el logotipo queda hundido, tono sobre tono."],
      ["Serigrafía en portada", "Tinta sólida sobre el PU, área amplia que abarca casi toda la tapa."],
      ["Serigrafía en contraportada", "Misma técnica en la cara posterior, entre los pasadores de la goma."],
      ["Tampografía en portada", "Área reducida en la franja inferior de la tapa, para el logotipo en pequeño."],
    ],
    nota: "Medidas definitivas de cada área a confirmar con el arte final.",
    posiciones: [
      { img: "ar_zone", nombre: "Portada", med: "Termograbado", hi: true,
        tec: [["Relieve en seco", "sin tinta"], ["1 color", "tono sobre tono"]] },
      { img: "ar_p_front", nombre: "Portada", med: "Serigrafía",
        tec: [["Tinta sólida", "sobre el PU"], ["Área amplia", "casi toda la tapa"]] },
      { img: "ar_p_back", nombre: "Contraportada", med: "Serigrafía",
        tec: [["Tinta sólida", "cara posterior"], ["Área amplia", "entre pasadores"]] },
      { img: "ar_p_pad", nombre: "Portada inferior", med: "Tampografía",
        tec: [["Área reducida", "franja inferior"], ["Logotipo", "en pequeño"]] },
    ],
    precio: "3,99", total: "399", cantidad: "100 uds",
  },
];

// =============== 1 · PORTADA ===============
{
  const s = slide();
  s.addShape(p.shapes.RECTANGLE, { x: 0, y: 0, w: 5.85, h: H, fill: { color: S1 }, line: { type: "none" } });
  s.addShape(p.shapes.RECTANGLE, { x: 0, y: 0, w: 0.10, h: H, fill: { color: RED }, line: { type: "none" } });
  s.addImage({ path: I("kl_life"), x: 0.62, y: 1.30, w: 4.6, h: 4.6 });

  s.addImage({ path: UM, x: 6.55, y: 0.72, w: 1.9, h: 0.66 });
  pill(s, "Propuesta comercial", 6.58, 1.86, { fill: REDDK, col: REDL, line: RED, h: 0.34, fs: 9 });
  s.addText("Welcome Kit", { x: 6.52, y: 2.32, w: 6.3, h: 0.92, fontFace: HF, fontSize: 46, bold: true, color: TX, margin: 0 });
  s.addText("Funda de portátil y libreta personalizadas", { x: 6.58, y: 3.28, w: 6.2, h: 0.42, fontFace: BF, fontSize: 15, color: T2, margin: 0 });
  rule(s, 6.58, 4.02, 5.9);
  s.addText("Preparado para", { x: 6.58, y: 4.22, w: 3.0, h: 0.28, fontFace: HF, fontSize: 9, bold: true, color: T4, charSpacing: 1.8, margin: 0 });
  s.addImage({ path: XC, x: 6.56, y: 4.56, w: 2.75, h: 0.38 });
  rule(s, 6.58, 5.36, 5.9);
  s.addText("4 opciones · 100 unidades · todo en negro", { x: 6.58, y: 5.56, w: 6.2, h: 0.34, fontFace: BF, fontSize: 12, color: T2, margin: 0 });
  s.addText("pedidos@universomerchan.com   ·   universomerchan.com", { x: 6.58, y: 6.42, w: 6.2, h: 0.32, fontFace: BF, fontSize: 10.5, color: T4, margin: 0 });
  n++;
}

// =============== 2 · LA PROPUESTA ===============
{
  const s = slide();
  head(s, "La propuesta", "Cuatro piezas, dos decisiones", "Una funda de portátil y una libreta. Dos opciones de cada, todas en negro y con el logotipo aplicado.");
  const bw = 2.94, gap = 0.24;
  PRODUCTOS.forEach((pr, i) => {
    const x = 0.62 + i * (bw + gap);
    card(s, x, 2.16, bw, 4.32, pr.hi ? S2 : S1, pr.hi ? RED : BD);
    s.addImage({ path: I(pr.hero), x: x + 0.16, y: 2.26, w: bw - 0.32, h: bw - 0.32 });
    s.addText(pr.familia.toUpperCase(), { x: x + 0.26, y: 4.96, w: bw - 0.52, h: 0.26, fontFace: HF, fontSize: 8, bold: true, color: RED, charSpacing: 1.6, margin: 0 });
    s.addText(pr.titulo, { x: x + 0.26, y: 5.22, w: bw - 0.52, h: 0.56, fontFace: HF, fontSize: 14.5, bold: true, color: TX, lineSpacing: 18, margin: 0 });
    rule(s, x + 0.26, 5.86, bw - 0.52, pr.hi ? BD2 : BD);
    s.addText([
      { text: pr.precio, options: { fontFace: HF, fontSize: 22, bold: true, color: TX } },
      { text: " €", options: { fontFace: HF, fontSize: 13, bold: true, color: TX } },
      { text: "  /ud", options: { fontFace: BF, fontSize: 10, color: T3 } },
    ], { x: x + 0.26, y: 5.98, w: bw - 0.52, h: 0.44, margin: 0 });
    s.addText(pr.tecnica.nombre + " · " + pr.tecnica.detalle, { x: x + 0.26, y: 6.44, w: bw - 0.52, h: 0.28, fontFace: BF, fontSize: 9, color: T3, margin: 0 });
  });
  foot(s);
  notaPie(s, "Precios para 100 unidades, marcaje incluido. IVA no incluido.");
}

// =============== DIVISOR ===============
function divisor(kicker, titulo, sub, img) {
  const s = slide();
  s.addShape(p.shapes.RECTANGLE, { x: 0, y: 0, w: 0.10, h: H, fill: { color: RED }, line: { type: "none" } });
  s.addText(kicker.toUpperCase(), { x: 0.94, y: 2.72, w: 7.4, h: 0.32, fontFace: HF, fontSize: 9.5, bold: true, color: REDL, charSpacing: 2.8, margin: 0 });
  s.addText(titulo, { x: 0.88, y: 3.10, w: 7.6, h: 1.3, fontFace: HF, fontSize: 42, bold: true, color: TX, lineSpacing: 48, margin: 0 });
  s.addText(sub, { x: 0.94, y: 4.42, w: 6.4, h: 0.78, fontFace: BF, fontSize: 13, color: T3, lineSpacing: 20, margin: 0 });
  s.addImage({ path: I(img), x: 8.55, y: 1.6, w: 4.3, h: 4.3 });
  foot(s);
}

// =============== GALERÍA ===============
function galeria(pr) {
  const s = slide();
  head(s, pr.familia, pr.titulo, pr.claim);
  const bw = 2.94, gap = 0.24;
  pr.fotos.forEach((f, i) => {
    const x = 0.62 + i * (bw + gap);
    card(s, x, 2.20, bw, 3.62, S1, BD);
    s.addImage({ path: I(f[0]), x: x + 0.10, y: 2.28, w: bw - 0.20, h: bw - 0.20 });
    s.addText(f[1], { x: x + 0.22, y: 5.16, w: bw - 0.44, h: 0.4, align: "center", fontFace: HF, fontSize: 10, bold: true, color: T2, lineSpacing: 13, margin: 0 });
  });
  card(s, 0.62, 6.06, 11.9, 0.82, S2, BD);
  s.addText([
    { text: "Personalizado con el logotipo de grupo xcape   ", options: { fontFace: BF, fontSize: 11.5, color: T2 } },
    { text: pr.tecnica.nombre + " · " + pr.tecnica.detalle + " · " + pr.tecnica.pos, options: { fontFace: HF, fontSize: 11.5, bold: true, color: TX } },
  ], { x: 0.96, y: 6.06, w: 11.2, h: 0.82, valign: "middle", margin: 0 });
  foot(s);
}

// =============== DESCRIPCIÓN ===============
function descripcion(pr) {
  const s = slide();
  head(s, "Descripción", pr.titulo, null);
  card(s, 0.62, 1.74, 4.52, 5.12, S1, BD);
  s.addImage({ path: I(pr.hero), x: 0.72, y: 1.84, w: 4.32, h: 4.32 });
  s.addText(pr.claim, { x: 0.86, y: 6.24, w: 4.04, h: 0.5, align: "center", fontFace: BF, fontSize: 9.5, italic: true, color: T3, lineSpacing: 12.5, margin: 0 });

  const paras = pr.desc.split("\n\n");
  s.addText(paras.map((t, i) => ({ text: t, options: { breakLine: i < paras.length - 1, paraSpaceAfter: 10 } })),
    { x: 5.42, y: 1.78, w: 7.10, h: 2.62, fontFace: BF, fontSize: 10.5, color: T2, lineSpacing: 15, valign: "top", margin: 0 });

  s.addText("FICHA TÉCNICA", { x: 5.42, y: 4.56, w: 7.10, h: 0.28, fontFace: HF, fontSize: 8.5, bold: true, color: RED, charSpacing: 1.8, margin: 0 });
  rule(s, 5.42, 4.86, 7.10, BD2);
  const half = Math.ceil(pr.specs.length / 2);
  const rowH = 0.40;
  pr.specs.forEach((r, i) => {
    const colI = i < half ? 0 : 1;
    const rowI = i < half ? i : i - half;
    const cx = 5.42 + colI * 3.66;
    const yy = 4.98 + rowI * rowH;
    s.addText(r[0], { x: cx, y: yy, w: 1.52, h: rowH - 0.03, fontFace: HF, fontSize: 8.5, bold: true, color: T3, valign: "middle", margin: 0 });
    s.addText(r[1], { x: cx + 1.54, y: yy, w: 1.90, h: rowH - 0.03, fontFace: BF, fontSize: 8.5, color: TX, valign: "middle", lineSpacing: 10, margin: 0 });
    rule(s, cx, yy + rowH - 0.03, 3.44);
  });
  foot(s);
}

// =============== PERSONALIZACIÓN (fundas + arconot) ===============
function personalizacion(pr) {
  const s = slide();
  head(s, "Personalización", "Cómo se aplica el logotipo", pr.titulo);

  // izquierda: imagen de la posición
  card(s, 0.62, 2.14, 4.5, 4.36, S1, BD);
  s.addImage({ path: I(pr.marcajeImg), x: 0.74, y: 2.22, w: 4.26, h: 4.26 });

  // derecha arriba: técnica presupuestada
  card(s, 5.34, 2.14, 7.18, 1.42, S2, RED);
  pill(s, "Técnica presupuestada", 5.62, 2.34, { fill: RED, h: 0.30, fs: 8 });
  s.addText(pr.tecnica.nombre, { x: 5.62, y: 2.70, w: 3.6, h: 0.42, fontFace: HF, fontSize: 19, bold: true, color: TX, margin: 0 });
  s.addText(pr.tecnica.detalle + "  ·  " + pr.tecnica.pos, { x: 5.62, y: 3.14, w: 4.4, h: 0.32, fontFace: BF, fontSize: 10.5, color: T2, margin: 0 });
  s.addText([
    { text: pr.precio, options: { fontFace: HF, fontSize: 27, bold: true, color: TX } },
    { text: " €", options: { fontFace: HF, fontSize: 15, bold: true, color: TX } },
    { text: "  /ud", options: { fontFace: BF, fontSize: 10.5, color: T3 } },
  ], { x: 10.10, y: 2.54, w: 2.2, h: 0.5, align: "right", margin: 0 });
  s.addText("a " + pr.cantidad + "  ·  total " + pr.total + " €", { x: 10.10, y: 3.06, w: 2.2, h: 0.32, align: "right", fontFace: BF, fontSize: 10, color: T3, margin: 0 });

  // derecha abajo: otras técnicas
  s.addText([
    { text: "OTRAS TÉCNICAS DISPONIBLES", options: { fontFace: HF, fontSize: 8.5, bold: true, color: RED, charSpacing: 1.8 } },
    { text: "     presupuesto a petición", options: { fontFace: BF, fontSize: 8.5, italic: true, color: T4 } },
  ], { x: 5.34, y: 3.80, w: 7.18, h: 0.28, margin: 0 });
  const ah = 0.60, ay = 4.16;
  pr.alternativas.forEach((a, i) => {
    const yy = ay + i * ah;
    s.addShape(p.shapes.OVAL, { x: 5.36, y: yy + 0.16, w: 0.10, h: 0.10, fill: { color: RED }, line: { type: "none" } });
    s.addText(a[0], { x: 5.58, y: yy, w: 2.20, h: 0.42, fontFace: HF, fontSize: 10.5, bold: true, color: TX, margin: 0 });
    s.addText(a[1], { x: 7.82, y: yy, w: 4.70, h: 0.50, fontFace: BF, fontSize: 9.5, color: T3, lineSpacing: 12.5, margin: 0 });
    if (i < pr.alternativas.length - 1) rule(s, 5.58, yy + ah - 0.06, 6.94);
  });
  foot(s);
  notaPie(s, pr.nota);
}

// =============== PARRILLA DE POSICIONES (TREZE) ===============
function posiciones(pr) {
  const s = slide();
  const nPal = ["", "una", "dos", "tres", "cuatro", "cinco", "seis"][pr.posiciones.length] || pr.posiciones.length;
  const suf = pr.posiciones.length === 1 ? "la única posición disponible" : "cada una de las " + nPal + " posiciones";
  head(s, "Personalización", "Posiciones y técnicas disponibles", pr.titulo + " · el logotipo mostrado en " + suf);
  const nP = pr.posiciones.length, gap = 0.16;
  const bw = (11.90 - gap * (nP - 1)) / nP;
  pr.posiciones.forEach((po, i) => {
    const x = 0.62 + i * (bw + gap);
    card(s, x, 2.06, bw, 4.30, po.hi ? S2 : S1, po.hi ? RED : BD);
    s.addImage({ path: I(po.img), x: x + 0.05, y: 2.09, w: bw - 0.10, h: 1.74, sizing: { type: "cover", w: bw - 0.10, h: 1.74 } });
    let yy = 3.94;
    s.addText(po.nombre, { x: x + 0.16, y: yy, w: bw - 0.32, h: 0.28, fontFace: HF, fontSize: 10.5, bold: true, color: TX, margin: 0 });
    s.addText(po.med, { x: x + 0.16, y: yy + 0.26, w: bw - 0.32, h: 0.24, fontFace: HF, fontSize: 9.5, bold: true, color: po.hi ? REDL : T3, margin: 0 });
    rule(s, x + 0.16, yy + 0.54, bw - 0.32, po.hi ? BD2 : BD);
    po.tec.forEach((t, j) => {
      const ty = yy + 0.64 + j * 0.40;
      s.addText(t[0], { x: x + 0.16, y: ty, w: bw - 0.32, h: 0.21, fontFace: HF, fontSize: 8.5, bold: true, color: TX, margin: 0 });
      s.addText(t[1], { x: x + 0.16, y: ty + 0.18, w: bw - 0.32, h: 0.21, fontFace: BF, fontSize: 8, color: T3, margin: 0 });
    });
  });
  card(s, 0.62, 6.46, 11.90, 0.40, S2, BD, 0.09);
  s.addText([
    { text: "Presupuestado:  ", options: { fontFace: BF, fontSize: 9.5, color: T3 } },
    { text: pr.tecnica.nombre + " · " + pr.tecnica.detalle + " · " + pr.tecnica.pos, options: { fontFace: HF, fontSize: 9.5, bold: true, color: TX } },
    { text: "     ·     " + pr.precio + " €/ud a " + pr.cantidad + "  ·  total " + pr.total + " €", options: { fontFace: BF, fontSize: 9.5, color: T2 } },
    { text: "        El resto de posiciones y técnicas, presupuesto a petición.", options: { fontFace: BF, fontSize: 9, italic: true, color: T4 } },
  ], { x: 0.94, y: 6.46, w: 11.3, h: 0.40, valign: "middle", margin: 0 });
  foot(s);
}

// =============== RESUMEN ===============
function resumen() {
  const s = slide();
  head(s, "Resumen", "Precios y combinaciones", "Todos los importes por unidad, con el marcaje indicado incluido y para 100 unidades. IVA no incluido.");

  // tabla de productos
  s.addText("PRECIO POR PIEZA", { x: 0.62, y: 2.10, w: 6.0, h: 0.28, fontFace: HF, fontSize: 8.5, bold: true, color: RED, charSpacing: 1.8, margin: 0 });
  const hdr = ["Producto", "Marcaje", "€/ud", "Total"];
  const colX = [0.62, 3.20, 5.10, 5.94];
  const colW = [2.5, 1.85, 0.80, 0.86];
  hdr.forEach((h, i) => s.addText(h.toUpperCase(), { x: colX[i], y: 2.44, w: colW[i], h: 0.26, align: i > 1 ? "right" : "left", fontFace: HF, fontSize: 8, bold: true, color: T4, charSpacing: 1.2, margin: 0 }));
  rule(s, 0.62, 2.72, 6.18, BD2);
  PRODUCTOS.forEach((pr, i) => {
    const y = 2.84 + i * 0.68;
    s.addText(pr.titulo, { x: colX[0], y, w: colW[0], h: 0.34, fontFace: HF, fontSize: 10.5, bold: true, color: TX, margin: 0 });
    s.addText(pr.familia, { x: colX[0], y: y + 0.26, w: colW[0], h: 0.24, fontFace: BF, fontSize: 8.5, color: T4, margin: 0 });
    s.addText(pr.tecnica.nombre, { x: colX[1], y, w: colW[1], h: 0.30, fontFace: BF, fontSize: 10, color: T2, margin: 0 });
    s.addText(pr.tecnica.detalle, { x: colX[1], y: y + 0.26, w: colW[1], h: 0.24, fontFace: BF, fontSize: 8.5, color: T4, margin: 0 });
    s.addText(pr.precio + " €", { x: colX[2], y: y + 0.06, w: colW[2], h: 0.32, align: "right", fontFace: HF, fontSize: 12, bold: true, color: TX, margin: 0 });
    s.addText(pr.total + " €", { x: colX[3], y: y + 0.08, w: colW[3], h: 0.30, align: "right", fontFace: BF, fontSize: 10.5, color: T2, margin: 0 });
    rule(s, 0.62, y + 0.56, 6.18);
  });

  // combinaciones
  s.addText("SI SE MONTA EL KIT COMPLETO", { x: 7.10, y: 2.10, w: 5.4, h: 0.28, fontFace: HF, fontSize: 8.5, bold: true, color: RED, charSpacing: 1.8, margin: 0 });
  const combos = [
    { a: "Funda portátil acolchada", b: "Libreta A5 clásica", ud: "12,99", tot: "1.299", tag: "Más ajustado" },
    { a: "Funda portátil acolchada", b: "Cuaderno A5 premium", ud: "13,10", tot: "1.310", tag: null },
    { a: "Funda portátil reciclada", b: "Libreta A5 clásica", ud: "17,99", tot: "1.799", tag: null },
    { a: "Funda portátil reciclada", b: "Cuaderno A5 premium", ud: "18,10", tot: "1.810", tag: "Más completo", hi: true },
  ];
  combos.forEach((c, i) => {
    const y = 2.44 + i * 1.06;
    card(s, 7.10, y, 5.42, 0.94, c.hi ? S2 : S1, c.hi ? RED : BD, 0.11);
    s.addText(c.a + "  +  " + c.b, { x: 7.36, y: y + 0.12, w: 3.5, h: 0.34, fontFace: HF, fontSize: 10.5, bold: true, color: TX, lineSpacing: 13, margin: 0 });
    if (c.tag) s.addText(c.tag, { x: 7.36, y: y + 0.50, w: 3.5, h: 0.26, fontFace: BF, fontSize: 9, color: c.hi ? REDL : T4, margin: 0 });
    s.addText([
      { text: c.ud, options: { fontFace: HF, fontSize: 17, bold: true, color: TX } },
      { text: " €/kit", options: { fontFace: BF, fontSize: 9.5, color: T3 } },
    ], { x: 10.60, y: y + 0.14, w: 1.72, h: 0.36, align: "right", margin: 0 });
    s.addText("total " + c.tot + " €", { x: 10.60, y: y + 0.52, w: 1.72, h: 0.26, align: "right", fontFace: BF, fontSize: 9, color: T4, margin: 0 });
  });
  foot(s);
  notaPie(s, "Precios cerrados para 100 unidades con la técnica de marcaje indicada. Transporte e IVA no incluidos.");
}

// =============== CIERRE ===============
function cierre() {
  const s = slide();
  s.addShape(p.shapes.RECTANGLE, { x: 0, y: 0, w: 0.10, h: H, fill: { color: RED }, line: { type: "none" } });
  s.addImage({ path: UM, x: 0.92, y: 0.86, w: 2.05, h: 0.71 });
  s.addText("Siguiente paso", { x: 0.92, y: 2.72, w: 7.0, h: 0.32, fontFace: HF, fontSize: 9.5, bold: true, color: REDL, charSpacing: 2.8, margin: 0 });
  s.addText("Elegís opciones y en 24-48 h\ntenéis el boceto con vuestro logo.", { x: 0.88, y: 3.10, w: 8.0, h: 1.5, fontFace: HF, fontSize: 33, bold: true, color: TX, lineSpacing: 42, margin: 0 });
  s.addText("Producción y entrega en menos de 10 días laborables desde la aprobación del boceto.", { x: 0.92, y: 4.76, w: 7.2, h: 0.5, fontFace: BF, fontSize: 12.5, color: T3, lineSpacing: 18, margin: 0 });
  rule(s, 0.92, 5.84, 7.0);
  s.addText("pedidos@universomerchan.com   ·   universomerchan.com   ·   Madrid", { x: 0.92, y: 6.04, w: 8.2, h: 0.34, fontFace: BF, fontSize: 11, color: T4, margin: 0 });
  s.addImage({ path: XC, x: 9.35, y: 3.42, w: 3.1, h: 0.43 });
  s.addText("Propuesta preparada para", { x: 9.35, y: 3.04, w: 3.2, h: 0.28, fontFace: HF, fontSize: 8.5, bold: true, color: T4, charSpacing: 1.6, margin: 0 });
  n++;
}

// ---------- montaje ----------
divisor("Fundas para portátil", "Dos fundas,\ndos acabados", "Ambas en negro, con bolsillo frontal y el logotipo aplicado en serigrafía.", "sp_detail");
galeria(PRODUCTOS[0]); descripcion(PRODUCTOS[0]); personalizacion(PRODUCTOS[0]);
galeria(PRODUCTOS[1]); descripcion(PRODUCTOS[1]); posiciones(PRODUCTOS[1]);
divisor("Libretas", "Dos libretas A5,\ndos formas de grabar", "Tapa dura con placa metálica grabada a láser, o tapa de PU con el logotipo termograbado.", "tz_detail");
galeria(PRODUCTOS[2]); descripcion(PRODUCTOS[2]); posiciones(PRODUCTOS[2]);
galeria(PRODUCTOS[3]); descripcion(PRODUCTOS[3]); posiciones(PRODUCTOS[3]);
resumen();
cierre();

p.writeFile({ fileName: "/mnt/user-data/outputs/Propuesta_WelcomeKit_grupoxcape.pptx" })
  .then(f => console.log("WROTE", f, "· slides:", n));
