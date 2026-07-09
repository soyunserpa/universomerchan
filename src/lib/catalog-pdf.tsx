import { Document, Page, Text, View, StyleSheet, Font, Image } from "@react-pdf/renderer";
import type { MagazineData } from "@/lib/catalog-magazine";

Font.register({ family: "Poppins", fonts: [
  { src: "https://fonts.gstatic.com/s/poppins/v20/pxiEyp8kv8JHgFVrFJA.ttf", fontWeight: 400 },
  { src: "https://fonts.gstatic.com/s/poppins/v20/pxiByp8kv8JHgFVrLEj6V1s.ttf", fontWeight: 600 },
  { src: "https://fonts.gstatic.com/s/poppins/v20/pxiByp8kv8JHgFVrLCz7V1s.ttf", fontWeight: 700 },
]});

const RED = "#DE0121", BLACK = "#111111";

const s = StyleSheet.create({
  // Portada
  cover: { fontFamily: "Poppins", backgroundColor: RED, color: "white", padding: 60, justifyContent: "center", alignItems: "center", height: "100%" },
  coverKicker: { fontSize: 10, letterSpacing: 3, color: "rgba(255,255,255,0.7)", marginBottom: 30, textTransform: "uppercase" as const },
  coverTitle: { fontSize: 52, fontWeight: 700, marginBottom: 6 },
  coverYear: { fontSize: 26, fontWeight: 600, marginBottom: 24 },
  coverTag: { fontSize: 13, color: "rgba(255,255,255,0.85)", textAlign: "center" as const, maxWidth: 320, lineHeight: 1.5 },
  coverEurope: { fontSize: 10, color: "rgba(255,255,255,0.65)", marginTop: 40 },
  couponBox: { marginTop: 28, borderWidth: 1, borderColor: "rgba(255,255,255,0.5)", borderRadius: 8, paddingVertical: 12, paddingHorizontal: 24, alignItems: "center" },
  couponLabel: { fontSize: 9, color: "rgba(255,255,255,0.8)" },
  couponCode: { fontSize: 22, fontWeight: 700, letterSpacing: 2, marginTop: 2 },
  couponSub: { fontSize: 8, color: "rgba(255,255,255,0.7)", marginTop: 2 },

  // Contenido
  page: { fontFamily: "Poppins", fontSize: 9, paddingTop: 36, paddingBottom: 48, paddingHorizontal: 36, color: BLACK },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 18, paddingBottom: 10, borderBottomWidth: 2, borderBottomColor: RED },
  logo: { fontSize: 16, fontWeight: 700, color: RED },
  logoSub: { fontSize: 7, color: "#888", marginTop: 2 },
  headerRight: { fontSize: 8, color: "#888", textAlign: "right" as const },

  catTitle: { fontSize: 15, fontWeight: 700, color: BLACK, marginTop: 14, marginBottom: 8 },
  catCount: { fontSize: 8, color: "#999", fontWeight: 400 },

  grid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  card: { width: "31.5%", borderWidth: 1, borderColor: "#EAEAEA", borderRadius: 6, padding: 6, marginBottom: 4 },
  cardImg: { width: "100%", height: 84, objectFit: "contain" as const, marginBottom: 6 },
  cardName: { fontSize: 8, fontWeight: 600, color: "#222", marginBottom: 2, height: 20 },
  cardPrice: { fontSize: 9, fontWeight: 700, color: RED },

  footer: { position: "absolute" as const, bottom: 18, left: 36, right: 36, paddingTop: 8, borderTopWidth: 1, borderTopColor: "#E8E8E8", flexDirection: "row", justifyContent: "space-between", fontSize: 7, color: "#999" },
});

export interface CatalogPDFData {
  data: MagazineData;
  coupon: string;
  year: number;
}

export function CatalogPDF({ data, coupon, year }: CatalogPDFData) {
  return (
    <Document title={`Catálogo Universo Merchan ${year}`} author="Universo Merchan">
      {/* Portada */}
      <Page size="A4">
        <View style={s.cover}>
          <Text style={s.coverKicker}>Universo Merchan</Text>
          <Text style={s.coverTitle}>Catálogo</Text>
          <Text style={s.coverYear}>{year}</Text>
          <Text style={s.coverTag}>Regalos corporativos que generan emociones. Más de 2.000 productos personalizables para tu marca.</Text>
          <View style={s.couponBox}>
            <Text style={s.couponLabel}>Descuento de primer pedido</Text>
            <Text style={s.couponCode}>{coupon}</Text>
            <Text style={s.couponSub}>10% · aplícalo al finalizar tu compra</Text>
          </View>
          <Text style={s.coverEurope}>Producción 80% europea · Entrega en menos de 10 días · #GeneraEmociones</Text>
        </View>
      </Page>

      {/* Contenido por categorías (paginación automática) */}
      <Page size="A4" style={s.page}>
        <View style={s.header} fixed>
          <View>
            <Text style={s.logo}>Universo Merchan</Text>
            <Text style={s.logoSub}>#GeneraEmociones</Text>
          </View>
          <Text style={s.headerRight}>Catálogo {year}{"\n"}universomerchan.com</Text>
        </View>

        {data.categories.map((cat) => (
          <View key={cat.slug} wrap>
            <Text style={s.catTitle}>
              {cat.displayName}  <Text style={s.catCount}>· {cat.productCount} productos</Text>
            </Text>
            <View style={s.grid}>
              {cat.products.map((p) => (
                <View key={p.masterCode} style={s.card} wrap={false}>
                  {p.image ? <Image style={s.cardImg} src={p.image} /> : <View style={s.cardImg} />}
                  <Text style={s.cardName}>{(p.name || "").slice(0, 42)}</Text>
                  <Text style={s.cardPrice}>Desde {p.startingPriceRaw.toFixed(2)}€</Text>
                </View>
              ))}
            </View>
          </View>
        ))}

        <View style={s.footer} fixed>
          <Text>Universo Merchan · Madrid, España · pedidos@universomerchan.com</Text>
          <Text render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`} />
        </View>
      </Page>
    </Document>
  );
}
