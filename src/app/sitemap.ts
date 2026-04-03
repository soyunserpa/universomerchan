import { MetadataRoute } from "next";
import { db } from "@/lib/database";
import * as schema from "@/lib/schema";
import { eq } from "drizzle-orm";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://universomerchan.com";

  // Base routes
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
  ];

  try {
    // 1. Fetch Products
    const products = await db.query.products.findMany({
      where: eq(schema.products.isVisible, true),
      columns: { masterCode: true, updatedAt: true, productName: true }
    });

    for (const product of products) {
      routes.push({
        url: `${SITE_URL}/product/${product.masterCode}`,
        lastModified: product.updatedAt ? new Date(product.updatedAt) : new Date(),
        changeFrequency: "weekly",
        priority: 0.7,
      });
    }

    // 2. Fetch Blog Posts
    const posts = await db.query.blogPosts.findMany({
      where: eq(schema.blogPosts.isPublished, true),
      columns: { slug: true, updatedAt: true }
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
