// ============================================================
// UNIVERSO MERCHAN — Quote / Presupuesto PDF Generator
// ============================================================
// Generates branded PDF quotes using @react-pdf/renderer.
// Each quote includes:
//   - Header with Universo Merchan branding
//   - Client details
//   - Line items with product + customization breakdown
//   - Price breakdown (product cost, print cost, discounts)
//   - QR code / button URL to buy directly (restores cart)
//   - Validity date
//   - Footer with contact info
// ============================================================

import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
  Link,
  Image,
} from "@react-pdf/renderer";
import { createElement } from "react";
import type { QuoteData } from "./configurator-engine";

// Register fonts
Font.register({
  family: "Poppins",
  fonts: [
    { src: "https://fonts.gstatic.com/s/poppins/v20/pxiEyp8kv8JHgFVrFJA.ttf", fontWeight: 400 },
    { src: "https://fonts.gstatic.com/s/poppins/v20/pxiByp8kv8JHgFVrLEj6V1s.ttf", fontWeight: 600 },
    { src: "https://fonts.gstatic.com/s/poppins/v20/pxiByp8kv8JHgFVrLCz7V1s.ttf", fontWeight: 700 },
  ],
});

const BRAND_RED = "#DE0121";
const BRAND_BLACK = "#111111";

const styles = StyleSheet.create({
  page: {
    fontFamily: "Poppins",
    fontSize: 10,
    paddingTop: 40,
    paddingBottom: 60,
    paddingHorizontal: 40,
    color: BRAND_BLACK,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 30,
    paddingBottom: 16,
    borderBottomWidth: 2,
    borderBottomColor: BRAND_RED,
  },
  logo: {
    fontSize: 20,
    fontWeight: 700,
    color: BRAND_RED,
  },
  logoSubtext: {
    fontSize: 8,
    color: "#888",
    marginTop: 2,
  },
  quoteInfo: {
    textAlign: "right" as const,
  },
  quoteNumber: {
    fontSize: 14,
    fontWeight: 700,
    color: BRAND_RED,
  },
  quoteDate: {
    fontSize: 9,
    color: "#888",
    marginTop: 2,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: 700,
    marginBottom: 8,
    color: BRAND_BLACK,
  },
  clientInfo: {
    fontSize: 10,
    lineHeight: 1.6,
    color: "#444",
  },
  table: {
    marginTop: 8,
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: BRAND_BLACK,
    color: "white",
    padding: 8,
    fontSize: 8,
    fontWeight: 600,
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#E8E8E8",
    padding: 8,
    fontSize: 9,
  },
  tableRowAlt: {
    backgroundColor: "#FAFAFA",
  },
  colProduct: { width: "35%", },
  colDetail: { width: "25%" },
  colQty: { width: "10%", textAlign: "center" as const },
  colUnit: { width: "15%", textAlign: "right" as const },
  colTotal: { width: "15%", textAlign: "right" as const },
  totalsBox: {
    marginTop: 16,
    alignSelf: "flex-end" as const,
    width: 250,
    padding: 16,
    backgroundColor: "#F5F5F5",
    borderRadius: 8,
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
    fontSize: 10,
  },
  totalRowFinal: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 2,
    borderTopColor: BRAND_BLACK,
  },
  totalLabel: {
    color: "#666",
  },
  totalValue: {
    fontWeight: 600,
  },
  totalFinal: {
    fontSize: 18,
    fontWeight: 700,
    color: BRAND_RED,
  },
  buyButton: {
    marginTop: 20,
    backgroundColor: BRAND_RED,
    padding: 14,
    borderRadius: 25,
    textAlign: "center" as const,
  },
  buyButtonText: {
    color: "white",
    fontSize: 12,
    fontWeight: 700,
    textDecoration: "none",
  },
  validUntil: {
    textAlign: "center" as const,
    fontSize: 9,
    color: "#888",
    marginTop: 8,
  },
  footer: {
    position: "absolute" as const,
    bottom: 20,
    left: 40,
    right: 40,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "#E8E8E8",
    flexDirection: "row",
    justifyContent: "space-between",
    fontSize: 8,
    color: "#999",
  },
  notes: {
    marginTop: 16,
    padding: 12,
    backgroundColor: "#FEF3C7",
    borderRadius: 6,
    fontSize: 9,
    color: "#92400E",
    lineHeight: 1.5,
  },
});

// ============================================================
// PDF COMPONENT
// ============================================================

export function QuotePDF({ data }: { data: QuoteData }) {
  const formatPrice = (n: number) => `${n.toFixed(2)} €`;
  
  return createElement(Document, {},
    createElement(Page, { size: "A4", style: styles.page },
      // Header
      createElement(View, { style: styles.header },
        createElement(View, {},
          createElement(Text, { style: styles.logo }, "🎁 Universo Merchan"),
          createElement(Text, { style: styles.logoSubtext }, "Consigue que tu marca se recuerde"),
        ),
        createElement(View, { style: styles.quoteInfo },
          createElement(Text, { style: styles.quoteNumber }, data.quoteNumber),
          createElement(Text, { style: styles.quoteDate }, `Fecha: ${data.date}`),
          createElement(Text, { style: styles.quoteDate }, `Válido hasta: ${data.validUntil}`),
        ),
      ),
      
      // Client info
      createElement(View, { style: styles.section },
        createElement(Text, { style: styles.sectionTitle }, "Datos del cliente"),
        createElement(Text, { style: styles.clientInfo }, data.clientName),
        data.clientCompany && createElement(Text, { style: styles.clientInfo }, data.clientCompany),
        createElement(Text, { style: styles.clientInfo }, data.clientEmail),
      ),
      
      // Items table
      createElement(View, { style: styles.section },
        createElement(Text, { style: styles.sectionTitle }, "Detalle del presupuesto"),
        createElement(View, { style: styles.table },
          // Table header
          createElement(View, { style: styles.tableHeader },
            createElement(Text, { style: styles.colProduct }, "PRODUCTO"),
            createElement(Text, { style: styles.colDetail }, "DETALLE"),
            createElement(Text, { style: styles.colQty }, "CANT."),
            createElement(Text, { style: styles.colUnit }, "P. UNIDAD"),
            createElement(Text, { style: styles.colTotal }, "TOTAL"),
          ),
          // Table rows
          ...data.items.map((item, i) =>
            createElement(View, {
              key: i,
              style: [styles.tableRow, i % 2 === 1 ? styles.tableRowAlt : {}],
            },
              createElement(Text, { style: styles.colProduct }, item.name),
              createElement(Text, { style: styles.colDetail },
                `${item.color}${item.customization ? `\n${item.customization}` : ""}`
              ),
              createElement(Text, { style: styles.colQty }, String(item.quantity)),
              createElement(Text, { style: styles.colUnit }, formatPrice(item.unitPrice)),
              createElement(Text, { style: styles.colTotal }, formatPrice(item.lineTotal)),
            ),
          ),
        ),
      ),
      
      // Totals
      createElement(View, { style: styles.totalsBox },
        createElement(View, { style: styles.totalRow },
          createElement(Text, { style: styles.totalLabel }, "Subtotal"),
          createElement(Text, { style: styles.totalValue }, formatPrice(data.subtotal)),
        ),
        data.discountPct > 0 && createElement(View, { style: styles.totalRow },
          createElement(Text, { style: styles.totalLabel }, `Descuento (${data.discountPct}%)`),
          createElement(Text, { style: [styles.totalValue, { color: "#15803D" }] }, `-${formatPrice(data.discount)}`),
        ),
        createElement(View, { style: styles.totalRowFinal },
          createElement(Text, { style: { fontWeight: 700, fontSize: 14 } }, "Total"),
          createElement(Text, { style: styles.totalFinal }, formatPrice(data.total)),
        ),
      ),
      
      // Buy button
      createElement(View, { style: styles.buyButton },
        createElement(Link, { src: data.buyUrl, style: styles.buyButtonText },
          "Comprar ahora — Haz clic aquí para completar tu pedido"
        ),
      ),
      createElement(Text, { style: styles.validUntil },
        `Este presupuesto es válido hasta el ${data.validUntil}. El botón "Comprar ahora" cargará todo en tu carrito automáticamente.`
      ),
      
      // Notes
      createElement(View, { style: styles.notes },
        createElement(Text, {},
          "• Los precios incluyen el producto y la personalización indicada.\n" +
          "• Los precios no incluyen IVA.\n" +
          "• El plazo de entrega estimado es de 7-10 días laborables desde la aprobación del boceto.\n" +
          "• Las imágenes del presupuesto son orientativas. El color final puede variar ligeramente.\n" +
          "• Para cantidades superiores a 500 unidades, contacta con nosotros para precio especial."
        ),
      ),
      
      // Footer
      createElement(View, { style: styles.footer },
        createElement(Text, {}, "Universo Merchan · universomerchan.com"),
        createElement(Text, {}, "pedidos@universomerchan.com · Madrid, España"),
        createElement(Text, {}, "#GeneraEmociones"),
      ),
    ),
  );
}

// ============================================================
// GENERATE QUOTE NUMBER
// Format: PRE-YYYY-XXXX (sequential)
// ============================================================

export function generateQuoteNumber(sequentialId: number): string {
  const year = new Date().getFullYear();
  const padded = String(sequentialId).padStart(4, "0");
  return `PRE-${year}-${padded}`;
}

// ============================================================
// GENERATE BUY URL
// This URL, when clicked, restores the full quote into the
// customer's cart so they can buy with one click
// ============================================================

export function generateBuyUrl(quoteNumber: string): string {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://universomerchan.com";
  return `${baseUrl}/cart/restore?quote=${encodeURIComponent(quoteNumber)}`;
}
