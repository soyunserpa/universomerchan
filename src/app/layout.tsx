import "./globals.css";
import type { Metadata } from "next";
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
      <GoogleTagManager gtmId="GTM-K7XX7K68" />
      <body className="bg-surface-50 text-gray-900 min-h-screen">
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
