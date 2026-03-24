// ============================================================
// UNIVERSO MERCHAN — CMS & Content Module
// ============================================================
// Covers all content pages and features:
//   - Blog (CRUD from admin dashboard)
//   - Static pages (About, YourChoice, Legal pages)
//   - Cookie consent banner
//   - WhatsApp floating button
//   - Social links
//   - Interactive catalog embed (Publitas)
// ============================================================

import { db } from "./database";
import { eq, desc, and, sql, ilike } from "drizzle-orm";
import { blogPosts, staticPages } from "./schema";
export { blogPosts, staticPages };

// ============================================================
// CONSTANTS — Social & Contact
// ============================================================

export const SOCIAL_LINKS = {
  instagram: "https://instagram.com/universomerchan",
  linkedin: "https://linkedin.com/company/universomerchan",
  email: "pedidos@universomerchan.com",
  phone: "+34614446640",
  whatsapp: "https://api.whatsapp.com/send?phone=614446640",
};

export const PUBLITAS_CATALOG_URL = "https://view.publitas.com/md-es/gifts_spa_eur/page/1?v=UniversoMerchan";

// ============================================================
// STATIC PAGES — Slugs for the legal/info pages
// ============================================================

export const STATIC_PAGE_SLUGS = {
  ABOUT: "sobre-universo-merchan",
  YOUR_CHOICE: "crea-tu-propio-producto",
  PRIVACY: "politica-de-privacidad",
  COOKIES: "politica-de-cookies",
  LEGAL: "aviso-legal",
  TERMS: "terminos-y-condiciones",
};

// ============================================================
// DEFAULT STATIC PAGES — Seeded on first run
// Content to be migrated from WordPress by admin
// ============================================================

export const DEFAULT_STATIC_PAGES = [
  {
    slug: STATIC_PAGE_SLUGS.ABOUT,
    title: "Sobre Universo Merchan",
    body: `<div class="prose">
      <h2>Consigue que tu marca se recuerde</h2>
      <p>Universo Merchan es mucho más que merchandising: es emoción hecha regalo. Con más de 10 años de experiencia, creamos regalos corporativos que conectan de verdad con personas, clientes y equipos.</p>
      <p>No queremos que las empresas entreguen objetos vacíos, queremos que le den una experiencia a esos productos que generan vínculos duraderos entre las marcas y su audiencia.</p>
      <p>Con un catálogo de más de 4.000 productos personalizables, producción 80% europea, materiales sostenibles y entregas en menos de 10 días, ayudamos a las empresas a diferenciarse, emocionar y dejar huella.</p>
      <h3>Misión</h3>
      <p>Fortalecer la conexión emocional entre las marcas, sus clientes y empleados, potenciando la creación de experiencias memorables a través de productos personalizados que se tocan, se sienten y se disfrutan.</p>
      <h3>Visión</h3>
      <p>No entregar objetos, sino experiencias que tus clientes recordarán para siempre, ayudando a las marcas a ser vividas más allá del entorno digital, creando momentos de uso diario que generan lealtad, reconocimiento y vínculo emocional real.</p>
      <p><strong>#GeneraEmociones</strong></p>
    </div>`,
    metaTitle: "Sobre Universo Merchan | Regalos corporativos que generan emociones",
    metaDescription: "Con más de 10 años de experiencia y 4.000+ productos personalizables, creamos regalos corporativos que conectan marcas con personas. Producción europea, entrega en menos de 10 días.",
  },
  {
    slug: STATIC_PAGE_SLUGS.YOUR_CHOICE,
    title: "Crea tu propio producto",
    body: `<div class="prose">
      <h2>YOUR CHOICE — Diseña un producto único para tu marca</h2>
      <p>¿Quieres ir más allá de la personalización estándar? Con nuestro servicio YOUR CHOICE puedes crear un producto completamente a medida, desde cero, con los materiales, colores y diseños que tú elijas.</p>
      <h3>¿Cómo funciona?</h3>
      <ol>
        <li><strong>Cuéntanos tu idea</strong> — ¿Qué producto necesitas? ¿Para qué evento o campaña?</li>
        <li><strong>Diseñamos juntos</strong> — Nuestro equipo te propone opciones de materiales, colores y acabados.</li>
        <li><strong>Producción a medida</strong> — Fabricamos tu producto exactamente como lo imaginaste.</li>
        <li><strong>Entrega en tu puerta</strong> — Recibe un producto 100% único y exclusivo de tu marca.</li>
      </ol>
      <h3>Ventajas</h3>
      <ul>
        <li>Producto 100% exclusivo para tu marca</li>
        <li>Elección de materiales, colores y acabados</li>
        <li>Cantidades flexibles desde 100 unidades</li>
        <li>Asesoramiento completo de nuestro equipo</li>
        <li>Producción europea con control de calidad</li>
      </ul>
      <p><em>Contenido completo por migrar desde WordPress — página: universomerchan.com/yourchoice/</em></p>
    </div>`,
    metaTitle: "Crea tu propio producto | YOUR CHOICE | Universo Merchan",
    metaDescription: "Diseña un producto de merchandising completamente a medida para tu marca. Materiales, colores y acabados a tu elección. Producción europea desde 100 unidades.",
  },
  {
    slug: STATIC_PAGE_SLUGS.PRIVACY,
    title: "Política de Privacidad",
    body: `<div class="prose"><p><em>Contenido por migrar desde WordPress — página: universomerchan.com/privacy-policy/</em></p></div>`,
    metaTitle: "Política de Privacidad | Universo Merchan",
    metaDescription: "Política de privacidad de Universo Merchan. Información sobre el tratamiento de datos personales.",
  },
  {
    slug: STATIC_PAGE_SLUGS.COOKIES,
    title: "Política de Cookies",
    body: `<div class="prose"><p><em>Contenido por migrar desde WordPress — página: universomerchan.com/politica-de-cookies/</em></p></div>`,
    metaTitle: "Política de Cookies | Universo Merchan",
    metaDescription: "Política de cookies de Universo Merchan.",
  },
  {
    slug: STATIC_PAGE_SLUGS.LEGAL,
    title: "Aviso Legal",
    body: `<div class="prose"><p><em>Contenido por migrar desde WordPress — página: universomerchan.com/aviso-legal/</em></p></div>`,
    metaTitle: "Aviso Legal | Universo Merchan",
    metaDescription: "Aviso legal de Universo Merchan.",
  },
  {
    slug: STATIC_PAGE_SLUGS.TERMS,
    title: "Términos y Condiciones",
    body: `<div class="prose"><p><em>Contenido por migrar desde WordPress — página: universomerchan.com/terminos-y-condiciones/</em></p></div>`,
    metaTitle: "Términos y Condiciones | Universo Merchan",
    metaDescription: "Términos y condiciones de uso y compra en Universo Merchan.",
  },
];

// ============================================================
// BLOG API
// ============================================================

// GET — List published posts (public)
export async function getPublishedPosts(params?: {
  page?: number;
  limit?: number;
  search?: string;
}): Promise<{ posts: any[]; total: number }> {
  const page = params?.page || 1;
  const limit = params?.limit || 12;
  const offset = (page - 1) * limit;

  const conditions = [eq(blogPosts.isPublished, true)];
  if (params?.search) {
    conditions.push(
      ilike(blogPosts.title, `%${params.search}%`)
    );
  }

  const countResult = await db
    .select({ count: sql<number>`count(*)` })
    .from(blogPosts)
    .where(and(...conditions));

  const posts = await db
    .select()
    .from(blogPosts)
    .where(and(...conditions))
    .orderBy(desc(blogPosts.publishedAt))
    .limit(limit)
    .offset(offset);

  return {
    posts: posts.map(p => ({
      id: p.id,
      slug: p.slug,
      title: p.title,
      excerpt: p.excerpt || (p.body ? p.body.replace(/<[^>]*>/g, "").substring(0, 160) + "..." : ""),
      featuredImage: p.featuredImageUrl,
      publishedAt: p.publishedAt ? new Date(p.publishedAt).toISOString() : null,
      authorName: p.authorName || "Universo Merchan",
    })),
    total: Number(countResult[0].count),
  };
}

// GET — Single post by slug (public)
export async function getPostBySlug(slug: string): Promise<any | null> {
  const post = await db.query.blogPosts?.findFirst?.({
    where: and(
      eq(blogPosts.slug, slug),
      eq(blogPosts.isPublished, true)
    ),
  }) || (await db.select().from(blogPosts).where(and(eq(blogPosts.slug, slug), eq(blogPosts.isPublished, true))).limit(1))[0];

  if (!post) return null;

  return {
    id: post.id,
    slug: post.slug,
    title: post.title,
    body: post.body,
    featuredImage: post.featuredImageUrl,
    publishedAt: post.publishedAt ? new Date(post.publishedAt).toISOString() : null,
    authorName: post.authorName || "Universo Merchan",
    metaTitle: post.metaTitle || post.title,
    metaDescription: post.metaDescription || post.excerpt,
  };
}

// ── ADMIN BLOG CRUD ──────────────────────────────────────────

// GET — All posts (admin, including drafts)
export async function getAdminPosts(params?: {
  page?: number;
  limit?: number;
}): Promise<{ posts: any[]; total: number }> {
  const page = params?.page || 1;
  const limit = params?.limit || 20;
  const offset = (page - 1) * limit;

  const countResult = await db
    .select({ count: sql<number>`count(*)` })
    .from(blogPosts);

  const posts = await db
    .select()
    .from(blogPosts)
    .orderBy(desc(blogPosts.updatedAt))
    .limit(limit)
    .offset(offset);

  return {
    posts: posts.map(p => ({
      id: p.id,
      slug: p.slug,
      title: p.title,
      excerpt: p.excerpt,
      featuredImage: p.featuredImageUrl,
      isPublished: p.isPublished,
      publishedAt: p.publishedAt ? new Date(p.publishedAt).toISOString() : null,
      authorName: p.authorName,
      createdAt: new Date(p.createdAt).toISOString(),
      updatedAt: new Date(p.updatedAt).toISOString(),
    })),
    total: Number(countResult[0].count),
  };
}

// CREATE — New post (admin)
export async function createBlogPost(data: {
  title: string;
  slug?: string;
  excerpt?: string;
  body: string;
  featuredImageUrl?: string;
  isPublished?: boolean;
  authorId?: number;
  authorName?: string;
  metaTitle?: string;
  metaDescription?: string;
}): Promise<{ id: number; slug: string }> {
  const rawSlug = data.slug || generateSlug(data.title);
  const slug = rawSlug.replace(/^\/+/, "").trim();

  const [post] = await db.insert(blogPosts).values({
    slug,
    title: data.title,
    excerpt: data.excerpt || null,
    body: data.body,
    featuredImageUrl: data.featuredImageUrl || null,
    isPublished: data.isPublished || false,
    publishedAt: data.isPublished ? new Date() : null,
    authorId: data.authorId || null,
    authorName: data.authorName || "Universo Merchan",
    metaTitle: data.metaTitle || null,
    metaDescription: data.metaDescription || null,
    createdAt: new Date(),
    updatedAt: new Date(),
  }).returning();

  return { id: post.id, slug: post.slug };
}

// GET — Single post by ID (admin)
export async function getAdminPostById(postId: number): Promise<any | null> {
  const post = await db.query.blogPosts?.findFirst?.({
    where: eq(blogPosts.id, postId),
  }) || (await db.select().from(blogPosts).where(eq(blogPosts.id, postId)).limit(1))[0];

  if (!post) return null;

  return {
    id: post.id,
    slug: post.slug,
    title: post.title,
    body: post.body,
    excerpt: post.excerpt || "",
    featuredImageUrl: post.featuredImageUrl || "",
    isPublished: post.isPublished || false,
    publishedAt: post.publishedAt ? new Date(post.publishedAt).toISOString() : null,
    authorName: post.authorName,
    metaTitle: post.metaTitle || "",
    metaDescription: post.metaDescription || "",
    createdAt: new Date(post.createdAt).toISOString(),
    updatedAt: new Date(post.updatedAt).toISOString(),
  };
}

// UPDATE — Edit post (admin)
export async function updateBlogPost(
  postId: number,
  data: Partial<{
    title: string;
    slug: string;
    excerpt: string;
    body: string;
    featuredImageUrl: string;
    isPublished: boolean;
    metaTitle: string;
    metaDescription: string;
  }>
): Promise<boolean> {
  if (data.slug) {
    data.slug = data.slug.replace(/^\/+/, "").trim();
  }
  const updateData: any = { ...data, updatedAt: new Date() };

  // If publishing for first time, set publishedAt
  if (data.isPublished) {
    const existing = await db.select().from(blogPosts).where(eq(blogPosts.id, postId)).limit(1);
    if (existing[0] && !existing[0].publishedAt) {
      updateData.publishedAt = new Date();
    }
  }

  await db.update(blogPosts).set(updateData).where(eq(blogPosts.id, postId));
  return true;
}

// DELETE — Remove post (admin)
export async function deleteBlogPost(postId: number): Promise<boolean> {
  await db.delete(blogPosts).where(eq(blogPosts.id, postId));
  return true;
}

// ============================================================
// STATIC PAGES API
// ============================================================

// GET — Page by slug (public)
export async function getStaticPage(slug: string): Promise<any | null> {
  const pages = await db.select().from(staticPages).where(eq(staticPages.slug, slug)).limit(1);
  const page = pages[0];
  if (!page) return null;

  return {
    id: page.id,
    slug: page.slug,
    title: page.title,
    body: page.body,
    metaTitle: page.metaTitle || page.title,
    metaDescription: page.metaDescription,
    updatedAt: page.updatedAt.toISOString(),
  };
}

// UPDATE — Edit static page content (admin)
export async function updateStaticPage(
  slug: string,
  data: { title?: string; body?: string; metaTitle?: string; metaDescription?: string }
): Promise<boolean> {
  await db.update(staticPages).set({
    ...data,
    updatedAt: new Date(),
  }).where(eq(staticPages.slug, slug));
  return true;
}

// SEED — Insert default pages on first run
export async function seedStaticPages(): Promise<void> {
  for (const page of DEFAULT_STATIC_PAGES) {
    const existing = await db.select().from(staticPages).where(eq(staticPages.slug, page.slug)).limit(1);
    if (existing.length === 0) {
      await db.insert(staticPages).values({
        slug: page.slug,
        title: page.title,
        body: page.body,
        metaTitle: page.metaTitle,
        metaDescription: page.metaDescription,
        updatedAt: new Date(),
      });
      console.log(`[CMS] Seeded static page: ${page.slug}`);
    }
  }
}

// ============================================================
// COOKIE CONSENT — Configuration
// ============================================================

export const COOKIE_CONSENT_CONFIG = {
  // Text shown in the cookie banner
  title: "Usamos cookies",
  message: "Utilizamos cookies propias y de terceros para mejorar tu experiencia de navegación, analizar el tráfico y personalizar el contenido. Puedes aceptar todas las cookies o configurar tus preferencias.",
  
  // Buttons
  acceptAllText: "Aceptar todas",
  rejectAllText: "Rechazar",
  settingsText: "Configurar",
  
  // Cookie categories
  categories: [
    {
      id: "necessary",
      name: "Necesarias",
      description: "Imprescindibles para el funcionamiento de la web. No se pueden desactivar.",
      required: true,
    },
    {
      id: "analytics",
      name: "Analíticas",
      description: "Nos ayudan a entender cómo usas la web para mejorarla.",
      required: false,
    },
    {
      id: "marketing",
      name: "Marketing",
      description: "Permiten mostrarte anuncios relevantes en otras plataformas.",
      required: false,
    },
  ],
  
  // Link to cookie policy
  policyUrl: "/politica-de-cookies",
  
  // Cookie name and expiry
  consentCookieName: "um_cookie_consent",
  consentExpiryDays: 365,
};

// ============================================================
// WHATSAPP FLOATING BUTTON — Configuration
// ============================================================

export const WHATSAPP_CONFIG = {
  url: "https://api.whatsapp.com/send?phone=614446640",
  message: "¡Hola! Me gustaría información sobre vuestros productos de merchandising.", // Pre-filled message
  position: "bottom-right" as const,  // Fixed position on screen
  offsetBottom: 24,  // px from bottom
  offsetRight: 24,   // px from right
  size: 56,          // px diameter
  color: "#25D366",  // WhatsApp green
  showOnMobile: true,
  showAfterScrollPx: 100, // Show after user scrolls 100px
  tooltip: "¿Necesitas ayuda? Escríbenos",
};

// ============================================================
// HELPER
// ============================================================

function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .substring(0, 200);
}
