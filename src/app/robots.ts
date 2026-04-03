import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://universomerchan.com";
  
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/admin/*",
        "/account/*",
        "/api/*",
        "/checkout/*",
        "/cart/*"
      ],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
