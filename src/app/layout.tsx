import "./globals.css";
import type { Metadata } from "next";
import { CartProvider } from "@/lib/cart-store";
import { AuthProvider } from "@/lib/auth-context";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { MiniCart } from "@/components/layout/MiniCart";

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
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className="bg-surface-50 text-gray-900 min-h-screen">
        <AuthProvider>
          <CartProvider>
            <Header />
            <MiniCart />
            <main className="min-h-[60vh]">{children}</main>
            <Footer />
          </CartProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
