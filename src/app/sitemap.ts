import type { MetadataRoute } from 'next';
import { db } from "@/lib/database";
import { products } from "@/lib/schema";
import { eq } from "drizzle-orm";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Config
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://universomerchan.com';

  // Static core routes
  const coreRoutes: MetadataRoute.Sitemap = [
    { url: baseUrl, lastModified: new Date(), changeFrequency: 'daily', priority: 1.0 },
    { url: `${baseUrl}/catalog`, lastModified: new Date(), changeFrequency: 'hourly', priority: 0.9 },
    { url: `${baseUrl}/about-us`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.6 },
    { url: `${baseUrl}/contact`, lastModified: new Date(), changeFrequency: 'yearly', priority: 0.5 },
    { url: `${baseUrl}/blog`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.8 },
  ];

  try {
    // We import here so we don't crash if imported outside
    const { getCategories } = await import("@/lib/catalog-api");
    const { getPublishedPosts } = await import("@/lib/cms-content");

    const categories = await getCategories().catch(() => []);
    const catRoutes: MetadataRoute.Sitemap = categories.map((c) => ({
      url: `${baseUrl}/categoria/${c.slug}`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.85,
    }));

    const { posts } = await getPublishedPosts().catch(() => ({ posts: [] }));
    const blogRoutes: MetadataRoute.Sitemap = posts.map((p) => ({
      url: `${baseUrl}/blog/${p.slug}`,
      lastModified: new Date(p.publishedAt || p.createdAt),
      changeFrequency: 'monthly',
      priority: 0.7,
    }));

    // Fetch all active products
    const allProducts = await db.query.products.findMany({
      where: eq(products.isVisible, true),
      columns: { masterCode: true, productName: true, updatedAt: true }
    });

    const productRoutes: MetadataRoute.Sitemap = allProducts.map((p) => {
      const slug = p.productName ? p.productName.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)+/g, "") : "";
      return {
        url: `${baseUrl}/product/${p.masterCode.toLowerCase()}-${slug}`,
        lastModified: p.updatedAt || new Date(),
        changeFrequency: 'weekly',
        priority: 0.8,
      };
    });

    return [...coreRoutes, ...catRoutes, ...blogRoutes, ...productRoutes];
  } catch (error) {
    console.error("Failed to generate complete sitemap", error);
    return coreRoutes;
  }
}
