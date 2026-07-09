// Añade Header.shop y el namespace Magazine a los 7 ficheros de mensajes.
// Idempotente: si ya existen, no los pisa.
const fs = require("fs");
const path = require("path");

const DIR = path.join(__dirname, "..", "src", "messages");

const shop = { es: "Tienda", en: "Shop", fr: "Boutique", de: "Shop", it: "Negozio", pt: "Loja", nl: "Winkel" };

const magazine = {
  es: {
    title: "Catálogo",
    intro: "Pasa las páginas y descubre nuestros productos personalizables. Precios desde, siempre actualizados.",
    tagline: "Regalos corporativos que generan emociones.",
    swipe_hint: "Desliza o usa las flechas para pasar páginas",
    download_cta: "Descargar catálogo (PDF)",
    from: "Desde", view: "Ver producto", products: "productos", page: "Página", of: "de",
    back_title: "¿Hacemos tu próximo regalo de empresa?",
    back_text: "Personalizamos cualquier producto con tu marca. Cuéntanos tu idea.",
    back_cta: "Descargar catálogo (PDF)",
    europe: "Producción 80% europea · Entrega en menos de 10 días",
    empty: "El catálogo estará disponible muy pronto.",
    meta_title: "Catálogo | Universo Merchan",
    meta_description: "Explora el catálogo de Universo Merchan: más de 2.000 productos personalizables para tu marca. Precios desde y entrega en menos de 10 días.",
  },
  en: {
    title: "Catalogue",
    intro: "Flip through the pages and discover our customisable products. Prices from, always up to date.",
    tagline: "Corporate gifts that spark emotions.",
    swipe_hint: "Swipe or use the arrows to turn pages",
    download_cta: "Download catalogue (PDF)",
    from: "From", view: "View product", products: "products", page: "Page", of: "of",
    back_title: "Shall we make your next corporate gift?",
    back_text: "We personalise any product with your brand. Tell us your idea.",
    back_cta: "Download catalogue (PDF)",
    europe: "80% European production · Delivery in under 10 days",
    empty: "The catalogue will be available very soon.",
    meta_title: "Catalogue | Universo Merchan",
    meta_description: "Explore the Universo Merchan catalogue: 2,000+ customisable products for your brand. Prices from, delivery in under 10 days.",
  },
  fr: {
    title: "Catalogue",
    intro: "Feuilletez les pages et découvrez nos produits personnalisables. Prix à partir de, toujours à jour.",
    tagline: "Des cadeaux d'entreprise qui suscitent l'émotion.",
    swipe_hint: "Faites glisser ou utilisez les flèches pour tourner les pages",
    download_cta: "Télécharger le catalogue (PDF)",
    from: "À partir de", view: "Voir le produit", products: "produits", page: "Page", of: "sur",
    back_title: "On crée votre prochain cadeau d'entreprise ?",
    back_text: "Nous personnalisons tout produit avec votre marque. Parlez-nous de votre idée.",
    back_cta: "Télécharger le catalogue (PDF)",
    europe: "Production 80% européenne · Livraison en moins de 10 jours",
    empty: "Le catalogue sera disponible très bientôt.",
    meta_title: "Catalogue | Universo Merchan",
    meta_description: "Découvrez le catalogue Universo Merchan : plus de 2 000 produits personnalisables pour votre marque. Prix à partir de, livraison en moins de 10 jours.",
  },
  de: {
    title: "Katalog",
    intro: "Blättern Sie durch die Seiten und entdecken Sie unsere personalisierbaren Produkte. Preise ab, immer aktuell.",
    tagline: "Werbegeschenke, die Emotionen wecken.",
    swipe_hint: "Wischen oder die Pfeile zum Blättern verwenden",
    download_cta: "Katalog herunterladen (PDF)",
    from: "Ab", view: "Produkt ansehen", products: "Produkte", page: "Seite", of: "von",
    back_title: "Gestalten wir Ihr nächstes Firmengeschenk?",
    back_text: "Wir personalisieren jedes Produkt mit Ihrer Marke. Erzählen Sie uns Ihre Idee.",
    back_cta: "Katalog herunterladen (PDF)",
    europe: "80% europäische Produktion · Lieferung in unter 10 Tagen",
    empty: "Der Katalog ist in Kürze verfügbar.",
    meta_title: "Katalog | Universo Merchan",
    meta_description: "Entdecken Sie den Universo-Merchan-Katalog: über 2.000 personalisierbare Produkte für Ihre Marke. Preise ab, Lieferung in unter 10 Tagen.",
  },
  it: {
    title: "Catalogo",
    intro: "Sfoglia le pagine e scopri i nostri prodotti personalizzabili. Prezzi a partire da, sempre aggiornati.",
    tagline: "Regali aziendali che emozionano.",
    swipe_hint: "Scorri o usa le frecce per sfogliare",
    download_cta: "Scarica il catalogo (PDF)",
    from: "Da", view: "Vedi prodotto", products: "prodotti", page: "Pagina", of: "di",
    back_title: "Realizziamo il tuo prossimo regalo aziendale?",
    back_text: "Personalizziamo qualsiasi prodotto con il tuo marchio. Raccontaci la tua idea.",
    back_cta: "Scarica il catalogo (PDF)",
    europe: "Produzione 80% europea · Consegna in meno di 10 giorni",
    empty: "Il catalogo sarà disponibile molto presto.",
    meta_title: "Catalogo | Universo Merchan",
    meta_description: "Esplora il catalogo Universo Merchan: oltre 2.000 prodotti personalizzabili per il tuo marchio. Prezzi a partire da, consegna in meno di 10 giorni.",
  },
  pt: {
    title: "Catálogo",
    intro: "Folheie as páginas e descubra os nossos produtos personalizáveis. Preços desde, sempre atualizados.",
    tagline: "Brindes corporativos que geram emoções.",
    swipe_hint: "Deslize ou use as setas para virar as páginas",
    download_cta: "Descarregar catálogo (PDF)",
    from: "Desde", view: "Ver produto", products: "produtos", page: "Página", of: "de",
    back_title: "Vamos criar o seu próximo brinde de empresa?",
    back_text: "Personalizamos qualquer produto com a sua marca. Conte-nos a sua ideia.",
    back_cta: "Descarregar catálogo (PDF)",
    europe: "Produção 80% europeia · Entrega em menos de 10 dias",
    empty: "O catálogo estará disponível muito em breve.",
    meta_title: "Catálogo | Universo Merchan",
    meta_description: "Explore o catálogo da Universo Merchan: mais de 2.000 produtos personalizáveis para a sua marca. Preços desde, entrega em menos de 10 dias.",
  },
  nl: {
    title: "Catalogus",
    intro: "Blader door de pagina's en ontdek onze personaliseerbare producten. Prijzen vanaf, altijd actueel.",
    tagline: "Relatiegeschenken die emoties oproepen.",
    swipe_hint: "Veeg of gebruik de pijlen om te bladeren",
    download_cta: "Catalogus downloaden (PDF)",
    from: "Vanaf", view: "Bekijk product", products: "producten", page: "Pagina", of: "van",
    back_title: "Maken we jouw volgende relatiegeschenk?",
    back_text: "We personaliseren elk product met jouw merk. Vertel ons je idee.",
    back_cta: "Catalogus downloaden (PDF)",
    europe: "80% Europese productie · Levering in minder dan 10 dagen",
    empty: "De catalogus is binnenkort beschikbaar.",
    meta_title: "Catalogus | Universo Merchan",
    meta_description: "Ontdek de catalogus van Universo Merchan: 2.000+ personaliseerbare producten voor jouw merk. Prijzen vanaf, levering in minder dan 10 dagen.",
  },
};

for (const locale of Object.keys(shop)) {
  const file = path.join(DIR, `${locale}.json`);
  const json = JSON.parse(fs.readFileSync(file, "utf8"));

  if (json.Header && json.Header.shop === undefined) {
    json.Header.shop = shop[locale];
  }
  if (!json.Magazine) {
    json.Magazine = magazine[locale];
  }

  fs.writeFileSync(file, JSON.stringify(json, null, 2) + "\n", "utf8");
  console.log(`✓ ${locale}.json`);
}
console.log("Done.");
