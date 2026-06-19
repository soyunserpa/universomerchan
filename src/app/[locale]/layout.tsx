import "../globals.css";
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
import { FavoritesProvider } from "@/lib/favorites-store";
import { AutoFavoriteHandler } from "@/components/providers/AutoFavoriteHandler";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { MiniCart } from "@/components/layout/MiniCart";
import { CookieBanner } from "@/components/layout/CookieBanner";
import { ChatbotBubble } from "@/components/chatbot/ChatbotBubble";

import Script from "next/script";

import { UtmProvider } from "@/components/providers/UtmProvider";
import { TrafficTracker } from "@/components/providers/TrafficTracker";
import { ClientErrorTracker } from "@/components/ClientErrorTracker";
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';

export async function generateMetadata({ params: { locale } }: { params: { locale: string } }): Promise<Metadata> {
  const languages: Record<string, string> = {
    'es': '/es', 'en': '/en', 'fr': '/fr', 'de': '/de', 'it': '/it', 'pt': '/pt', 'nl': '/nl'
  };

  return {
    title: "Universo Merchan — Consigue que tu marca se recuerde con productos personalizados",
    description: "Consigue que tu marca se recuerde. +2.000 productos personalizables con entrega en menos de 10 días. #GeneraEmociones",
    openGraph: {
      title: "Universo Merchan — Consigue que tu marca se recuerde con productos personalizados",
      description: "+2.000 productos personalizables. Elige, personaliza, visualiza y recibe en menos de 10 días.",
      url: "https://universomerchan.com",
      siteName: "Universo Merchan",
      locale: locale === 'en' ? 'en_US' : `${locale}_${locale.toUpperCase()}`,
      type: "website",
    },
    verification: {
      google: "mVS8J7HnqcunvWp4QbzZXuasi0ETBhRQS6mV5wT3-sI",
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-video-preview": -1,
        "max-image-preview": "large",
        "max-snippet": -1,
      },
    },
    alternates: {
      languages,
    },
    metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://universomerchan.com"),
  };
}

export default async function RootLayout({ children, params: {locale} }: { children: React.ReactNode, params: {locale: string} }) {
  const messages = await getMessages();
  
  return (
    <html lang={locale}>

      <Script id="gtm" strategy="lazyOnload">
        {`
          (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
          new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
          j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
          'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
          })(window,document,'script','dataLayer','GTM-K7XX7K68');
        `}
      </Script>
      <Script id="ga-script" strategy="lazyOnload" src={`https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_GA_ID || "G-XXXXXXXXXX"}`} />
      <Script id="ga-init" strategy="lazyOnload">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${process.env.NEXT_PUBLIC_GA_ID || "G-XXXXXXXXXX"}');
        `}
      </Script>
      <Script id="meta-pixel" strategy="lazyOnload">
        {`
          !function(f,b,e,v,n,t,s)
          {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
          n.callMethod.apply(n,arguments):n.queue.push(arguments)};
          if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
          n.queue=[];t=b.createElement(e);t.async=!0;
          t.src=v;s=b.getElementsByTagName(e)[0];
          s.parentNode.insertBefore(t,s)}(window, document,'script',
          'https://connect.facebook.net/en_US/fbevents.js');
          fbq('init', '${process.env.NEXT_PUBLIC_META_PIXEL_ID || "123456789012345"}');
          fbq('track', 'PageView');
        `}
      </Script>
      <Script id="microsoft-clarity" strategy="lazyOnload">
        {`
          (function(c,l,a,r,i,t,y){
              c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
              t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
              y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
          })(window, document, "clarity", "script", "s21obhozfe");
        `}
      </Script>
      <body className={`bg-surface-50 text-gray-900 min-h-screen font-sans antialiased ${poppins.variable}`}>
        <ClientErrorTracker />
          <UtmProvider />
          <TrafficTracker />
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
                    description: "Regalos corporativos personalizados que generan emociones. +2.000 productos con entrega en menos de 10 días.",
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
          <NextIntlClientProvider messages={messages}>
            <AuthProvider>
              <FavoritesProvider>
                <AutoFavoriteHandler />
                <CartProvider>
                  <div className="flex flex-col min-h-screen">
                    <Header />
                    <MiniCart />
                    <main className="flex-1 min-h-[60vh]">{children}</main>
                    <ChatbotBubble />
                    <Footer />
                    <CookieBanner />
                  </div>
                </CartProvider>
              </FavoritesProvider>
            </AuthProvider>
          </NextIntlClientProvider>
      </body>
    </html>
  );
}
