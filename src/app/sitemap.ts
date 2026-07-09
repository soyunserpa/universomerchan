import type { MetadataRoute } from 'next';
import { db } from "@/lib/database";
import { products } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { SEO_LOCALES, DEFAULT_LOCALE, localeUrl } from "@/lib/seo";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // hreflang correcto: el español va SIN prefijo (`/path`), el resto con `/{locale}/path`,
  // + `x-default`. (Antes apuntaba a `/es/path`, que no es la URL real del español.)
  const getAlternates = (path: string) => {
    const languages: Record<string, string> = {};
    SEO_LOCALES.forEach(loc => { languages[loc] = localeUrl(loc, path); });
    languages["x-default"] = localeUrl(DEFAULT_LOCALE, path);
    return { languages };
  };

  const createEntry = (path: string, priority: number, changeFrequency: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never', lastMod?: Date): MetadataRoute.Sitemap[number] => {
    return {
      url: localeUrl(DEFAULT_LOCALE, path),
      lastModified: lastMod || new Date(),
      changeFrequency,
      priority,
      alternates: getAlternates(path)
    };
  };

  // Static core routes
  const coreRoutes: MetadataRoute.Sitemap = [
    createEntry('/', 1.0, 'daily'),
    createEntry('/catalogo', 0.9, 'daily'),
    createEntry('/catalog', 0.9, 'hourly'),
    createEntry('/about-us', 0.6, 'monthly'),
    createEntry('/contact', 0.5, 'yearly'),
    createEntry('/blog', 0.8, 'daily'),
  ];

  try {
    // We import here so we don't crash if imported outside
    const { getCategories } = await import("@/lib/catalog-api");
    const { getPublishedPosts } = await import("@/lib/cms-content");

    const categories = await getCategories().catch(() => []);
    const catRoutes: MetadataRoute.Sitemap = categories.map((c: any) => 
      createEntry(`/categoria/${c.slug}`, 0.85, 'weekly')
    );

    const { posts } = await getPublishedPosts().catch(() => ({ posts: [] }));
    const blogRoutes: MetadataRoute.Sitemap = posts.map((p: any) => 
      createEntry(`/blog/${p.slug}`, 0.7, 'monthly', new Date(p.publishedAt || p.createdAt))
    );

    // Fetch all active products
    const allProducts = await db.query.products.findMany({
      where: eq(products.isVisible, true),
      columns: { masterCode: true, productName: true, updatedAt: true }
    });

    const productRoutes: MetadataRoute.Sitemap = allProducts.map((p) => {
      const slug = p.productName ? p.productName.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)+/g, "") : "";
      return createEntry(`/product/${p.masterCode.toLowerCase()}-${slug}`, 0.8, 'weekly', p.updatedAt || new Date());
    });

    return [...coreRoutes, ...catRoutes, ...blogRoutes, ...productRoutes];
  } catch (error) {
    console.error("Failed to generate complete sitemap", error);
    return coreRoutes;
  }
}
