import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://universomerchan.com";

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/admin/",
          "/account/",
          "/api/",
          "/checkout/",
          "/cart/",
          "/auth/",
          "/_next/",
        ],
      },
      {
        userAgent: "Googlebot",
        allow: ["/", "/catalog", "/product/", "/blog/"],
        disallow: ["/admin/", "/account/", "/api/", "/checkout/", "/cart/", "/auth/"],
      },
      {
        userAgent: "Googlebot-Image",
        allow: ["/images/", "/uploads/"],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
