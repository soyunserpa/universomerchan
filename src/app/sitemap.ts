import type { MetadataRoute } from 'next';
import { db } from "@/lib/database";
import { products } from "@/lib/schema";
import { eq } from "drizzle-orm";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Config
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://universomerchan.com';

  // Static core routes
  const coreRoutes: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${baseUrl}/catalog`,
      lastModified: new Date(),
      changeFrequency: 'hourly',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/about-us`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: `${baseUrl}/contact`,
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.5,
    }
  ];

  try {
    // Fetch all active products
    const allProducts = await db.query.products.findMany({
      where: eq(products.isVisible, true),
      columns: { masterCode: true, productName: true, updatedAt: true }
    });

    // Generate dynamic routes for products
    const productRoutes: MetadataRoute.Sitemap = allProducts.map((p) => {
      // Replicate the slug logic from product page
      const slug = p.productName ? p.productName.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)+/g, "") : "";
      
      return {
        url: `${baseUrl}/product/${p.masterCode.toLowerCase()}-${slug}`,
        lastModified: p.updatedAt || new Date(),
        changeFrequency: 'weekly',
        priority: 0.8,
      };
    });

    return [...coreRoutes, ...productRoutes];
  } catch (error) {
    console.error("Failed to generate product sitemap", error);
    // Silent fail returning just core routes to not break NextJS build
    return coreRoutes;
  }
}
