import "./globals.css";
import type { Metadata } from "next";
import { Poppins } from 'next/font/google';

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700', '800', '900'],
  display: 'swap',
  variable: '--font-poppins',
});
import { CartProvider } from "@/lib/cart-store";
import { AuthProvider } from "@/lib/auth-context";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { MiniCart } from "@/components/layout/MiniCart";
import { CookieBanner } from "@/components/layout/CookieBanner";
import { WhatsAppButton } from "@/components/layout/WhatsAppButton";
import { GoogleTagManager } from "@next/third-parties/google";

export const metadata: Metadata = {
  title: "Universo Merchan — Regalos corporativos personalizados",
  description: "Consigue que tu marca se recuerde. +4.000 productos personalizables con entrega en menos de 10 días. #GeneraEmociones",
  keywords: "merchandising, regalos corporativos, productos personalizados, serigrafía, grabado",
  openGraph: {
    title: "Universo Merchan — Consigue que tu marca se recuerde",
    description: "+4.000 productos personalizables. Elige, personaliza, visualiza y recibe en menos de 10 días.",
    url: "https://universomerchan.com",
    siteName: "Universo Merchan",
    locale: "es_ES",
    type: "website",
  },
  verification: {
    google: "mVS8J7HnqcunvWp4QbzZXuasi0ETBhRQS6mV5wT3-sI",
  },
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://universomerchan.com"),
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <head>
        <link rel="preconnect" href="https://cdn1.midocean.com" />
      </head>
      <GoogleTagManager gtmId="GTM-K7XX7K68" />
      <body className={`bg-surface-50 text-gray-900 min-h-screen font-sans antialiased ${poppins.variable}`}>
        {/* JSON-LD: Organization + LocalBusiness structured data for Google */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@graph": [
                {
                  "@type": "Organization",
                  "@id": "https://universomerchan.com/#organization",
                  name: "Universo Merchan",
                  url: "https://universomerchan.com",
                  logo: {
                    "@type": "ImageObject",
                    url: "https://universomerchan.com/images/logo.svg",
                  },
                  description: "Regalos corporativos personalizados que generan emociones. +4.000 productos con entrega en menos de 10 días.",
                  email: "pedidos@universomerchan.com",
                  sameAs: [],
                  contactPoint: {
                    "@type": "ContactPoint",
                    email: "pedidos@universomerchan.com",
                    contactType: "sales",
                    availableLanguage: ["Spanish"],
                  },
                },
                {
                  "@type": "LocalBusiness",
                  "@id": "https://universomerchan.com/#localbusiness",
                  name: "Universo Merchan",
                  url: "https://universomerchan.com",
                  logo: "https://universomerchan.com/images/logo.svg",
                  image: "https://universomerchan.com/images/about-us-hero-new.webp",
                  description: "Tienda online de merchandising y regalos corporativos personalizados. Serigrafía, grabado láser, bordado y más de 17 técnicas de impresión.",
                  email: "pedidos@universomerchan.com",
                  address: {
                    "@type": "PostalAddress",
                    addressLocality: "Madrid",
                    addressCountry: "ES",
                  },
                  priceRange: "€€",
                  currenciesAccepted: "EUR",
                  paymentAccepted: "Credit Card, Stripe",
                  openingHoursSpecification: {
                    "@type": "OpeningHoursSpecification",
                    dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
                    opens: "09:00",
                    closes: "18:00",
                  },
                },
                {
                  "@type": "WebSite",
                  "@id": "https://universomerchan.com/#website",
                  url: "https://universomerchan.com",
                  name: "Universo Merchan",
                  publisher: { "@id": "https://universomerchan.com/#organization" },
                  potentialAction: {
                    "@type": "SearchAction",
                    target: {
                      "@type": "EntryPoint",
                      urlTemplate: "https://universomerchan.com/catalog?search={search_term_string}",
                    },
                    "query-input": "required name=search_term_string",
                  },
                },
              ],
            }),
          }}
        />
        <AuthProvider>
          <CartProvider>
            <Header />
            <MiniCart />
            <main className="min-h-[60vh]">{children}</main>
            <WhatsAppButton />
            <Footer />
            <CookieBanner />
          </CartProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
