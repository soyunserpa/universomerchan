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
import { TopBar } from "@/components/layout/TopBar";
import { Footer } from "@/components/layout/Footer";
import { MiniCart } from "@/components/layout/MiniCart";
import { CookieBanner } from "@/components/layout/CookieBanner";
import { ChatbotBubble } from "@/components/chatbot/ChatbotBubble";

import Script from "next/script";

import { UtmProvider } from "@/components/providers/UtmProvider";
import { TrafficTracker } from "@/components/providers/TrafficTracker";
import { ClientErrorTracker } from "@/components/ClientErrorTracker";
import { NextIntlClientProvider } from 'next-intl';
import { getMessages, getTranslations } from 'next-intl/server';
import { alternatesFor, ogLocale, ogAlternateLocales, localeUrl, SITE_URL, DEFAULT_OG_IMAGE, SCHEMA_LANGUAGES, bcp47, SOCIAL_PROFILES } from "@/lib/seo";

export async function generateMetadata({ params: { locale } }: { params: { locale: string } }): Promise<Metadata> {
  const t = await getTranslations({ locale, namespace: "Seo" });
  const title = t("default_title");
  const description = t("default_description");

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: localeUrl(locale, ""),
      siteName: "Universo Merchan",
      locale: ogLocale(locale),
      alternateLocale: ogAlternateLocales(locale),
      type: "website",
      images: [DEFAULT_OG_IMAGE],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [DEFAULT_OG_IMAGE],
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
    // canonical auto-referente por idioma + hreflang de los 7 idiomas + x-default
    alternates: alternatesFor(locale, ""),
    metadataBase: new URL(SITE_URL),
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
      {/* Google tag (gtag.js) — Universo Merchan GA4 */}
      <Script id="ga-script" strategy="afterInteractive" src={`https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_GA_ID || "G-D24Y09H8SM"}`} />
      <Script id="ga-init" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${process.env.NEXT_PUBLIC_GA_ID || "G-D24Y09H8SM"}');
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
                    sameAs: SOCIAL_PROFILES,
                    contactPoint: {
                      "@type": "ContactPoint",
                      email: "pedidos@universomerchan.com",
                      contactType: "sales",
                      availableLanguage: SCHEMA_LANGUAGES,
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
                    inLanguage: bcp47(locale),
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
                    <TopBar />
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
