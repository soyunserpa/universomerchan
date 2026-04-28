const pptxgen = require("pptxgenjs");

async function generatePPT() {
    let pres = new pptxgen();

    pres.author = "Universo Merchan";
    pres.company = "Universo Merchan";
    pres.title = "Presupuesto Comercial";

    // MASTER SLIDE
    pres.defineSlideMaster({
      title: "MASTER_SLIDE",
      background: { color: "FFFFFF" },
      objects: [
        { rect: { x: 0, y: 0, w: "100%", h: 0.8, fill: { color: "111111" } } },
        { text: { text: "Universo Merchan - Propuesta Comercial", options: { x: 0.5, y: 0.2, w: 5, h: 0.4, color: "FFFFFF", fontSize: 18, bold: true } } }
      ]
    });

    // COVER
    let slide = pres.addSlide({ masterName: "MASTER_SLIDE" });
    slide.addText("Propuesta de Merchandising", { x: 1, y: 2.5, w: "80%", fontSize: 36, bold: true, color: "000000", align: "center" });
    slide.addText("Presupuesto detallado para su campaña", { x: 1, y: 3.5, w: "80%", fontSize: 18, color: "666666", align: "center" });

    const items = [
      {
        title: "Camisetas Regent Hombre (S11388)",
        img: "https://cdn1.midocean.com/image/700X700/s11388-fn.jpg",
        variants: [
          "150 uds - 1 Color / 2 Posiciones (Pecho y Espalda): 6.44€ / ud",
          "150 uds - 2 Colores / 2 Posiciones (Pecho y Espalda): 9.56€ / ud"
        ]
      },
      {
        title: "Camisetas Imperial (S11500)",
        img: "https://cdn1.midocean.com/image/700X700/s11500-ax.jpg",
        variants: [
          "150 uds - 1 Color / 2 Posiciones (Pecho y Espalda): 6.47€ / ud",
          "150 uds - 2 Colores / 2 Posiciones (Pecho y Espalda): 9.59€ / ud"
        ]
      },
      {
        title: "Llaveros Burnie (MO9949)",
        img: "https://cdn1.midocean.com/image/700X700/mo9949-40.jpg",
        variants: [
          "150 uds - 1 Color / 1 Posición: 2.30€ / ud",
          "150 uds - 2 Colores / 1 Posición: 3.44€ / ud"
        ]
      },
      {
        title: "Llaveros Ballarat (MO9948)",
        img: "https://cdn1.midocean.com/image/700X700/mo9948-40.jpg",
        variants: [
          "150 uds - 1 Color / 1 Posición: 2.30€ / ud",
          "150 uds - 2 Colores / 1 Posición: 3.44€ / ud"
        ]
      },
      {
        title: "Chaquetas Relax (S46600)",
        img: "https://cdn1.midocean.com/image/700X700/s46600-ab.jpg",
        variants: [
          "50 uds - 1 Color / 2 Posiciones (Pecho y Espalda): 39.12€ / ud",
          "50 uds - 2 Colores / 2 Posiciones (Pecho y Espalda): 47.92€ / ud"
        ]
      },
      {
        title: "Chalecos Mini Visible (MO7602)",
        img: "https://cdn1.midocean.com/image/700X700/mo7602-08.jpg",
        variants: [
          "100 uds - 3 Posiciones (1 Pecho, 2 Espalda): 7.50€ / ud"
        ]
      }
    ];

    for (const item of items) {
      let s = pres.addSlide({ masterName: "MASTER_SLIDE" });
      s.addText(item.title, { x: 0.5, y: 1.2, w: "90%", fontSize: 24, bold: true, color: "333333" });
      
      try {
        s.addImage({ path: item.img, x: 0.5, y: 2, w: 3, h: 3 });
      } catch(e) {
        // Fallback if image fails
      }
      
      let bulletY = 2.5;
      for (const v of item.variants) {
        s.addText(v, { x: 4, y: bulletY, w: 5.5, fontSize: 16, bullet: true, color: "555555" });
        bulletY += 0.8;
      }
      
      s.addText("* Precios orientativos sin IVA", { x: 4, y: 4.5, w: 5, fontSize: 12, italic: true, color: "999999" });
    }

    const filePath = "Presupuesto_Merchan.pptx";
    await pres.writeFile({ fileName: filePath });
    console.log("PPTX Created:", filePath);
}

generatePPT();
