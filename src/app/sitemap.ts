import { MetadataRoute } from "next";
import { db } from "@/lib/database";
import * as schema from "@/lib/schema";
import { eq, sql, desc } from "drizzle-orm";

// Helper to generate URL-friendly slugs from product names
function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://universomerchan.com";

  // ── Static pages ──────────────────────────────────────────
  const routes: MetadataRoute.Sitemap = [
    {
      url: `${SITE_URL}`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: `${SITE_URL}/catalog`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${SITE_URL}/blog`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.8,
    },
    // Legal pages
    { url: `${SITE_URL}/legal/privacidad`, lastModified: new Date(), changeFrequency: "yearly", priority: 0.3 },
    { url: `${SITE_URL}/legal/cookies`, lastModified: new Date(), changeFrequency: "yearly", priority: 0.3 },
    { url: `${SITE_URL}/legal/aviso-legal`, lastModified: new Date(), changeFrequency: "yearly", priority: 0.3 },
    { url: `${SITE_URL}/legal/terminos`, lastModified: new Date(), changeFrequency: "yearly", priority: 0.3 },
  ];

  try {
    // ── Category pages (level 1) ────────────────────────────
    const categories = await db
      .select({ category: schema.products.categoryLevel1 })
      .from(schema.products)
      .where(eq(schema.products.isVisible, true))
      .groupBy(schema.products.categoryLevel1)
      .orderBy(desc(sql`count(*)`));

    for (const row of categories) {
      if (!row.category) continue;
      routes.push({
        url: `${SITE_URL}/catalog?category=${encodeURIComponent(row.category)}`,
        lastModified: new Date(),
        changeFrequency: "weekly",
        priority: 0.8,
      });
    }

    // ── Products with SEO-friendly slugs ────────────────────
    const products = await db.query.products.findMany({
      where: eq(schema.products.isVisible, true),
      columns: { masterCode: true, updatedAt: true, productName: true },
    });

    for (const product of products) {
      const slug = product.productName
        ? `${product.masterCode.toLowerCase()}-${slugify(product.productName)}`
        : product.masterCode.toLowerCase();
      routes.push({
        url: `${SITE_URL}/product/${slug}`,
        lastModified: product.updatedAt ? new Date(product.updatedAt) : new Date(),
        changeFrequency: "weekly",
        priority: 0.7,
      });
    }

    // ── Blog posts ──────────────────────────────────────────
    const posts = await db.query.blogPosts.findMany({
      where: eq(schema.blogPosts.isPublished, true),
      columns: { slug: true, updatedAt: true },
    });

    for (const post of posts) {
      routes.push({
        url: `${SITE_URL}/blog/${post.slug}`,
        lastModified: post.updatedAt ? new Date(post.updatedAt) : new Date(),
        changeFrequency: "weekly",
        priority: 0.6,
      });
    }
  } catch (error) {
    console.error("[Sitemap] Error fetching data:", error);
  }

  return routes;
}
