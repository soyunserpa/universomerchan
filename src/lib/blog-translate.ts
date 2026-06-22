// ============================================================
// UNIVERSO MERCHAN — Blog auto-translation
// ============================================================
// New blog posts are written in Spanish (the autoblog cron, the
// Apps Script webhook, and the admin editor). This translates each
// post into the other 6 site languages and stores them in
// blogPosts.translations, so the frontend (getPostBySlug /
// getPublishedPosts, which already read translations[locale]) serves
// every post in the visitor's language. Spanish stays the base/fallback.
// ============================================================

import { OpenAI } from "openai";
import { db } from "@/lib/database";
import { blogPosts } from "@/lib/schema";
import { eq } from "drizzle-orm";

const LANGS: Record<string, string> = {
  en: "English",
  fr: "French",
  de: "German",
  it: "Italian",
  pt: "European Portuguese",
  nl: "Dutch",
};

// Cheap, capable model; overridable without a code change.
const TRANSLATE_MODEL = process.env.BLOG_TRANSLATE_MODEL || "gpt-4o-mini";

export interface BlogContent {
  title: string;
  excerpt?: string | null;
  body: string;
  metaTitle?: string | null;
  metaDescription?: string | null;
}

export interface BlogTranslation {
  title: string;
  excerpt: string;
  body: string;
  metaTitle: string;
  metaDescription: string;
}

/**
 * Translate a Spanish blog post into the 6 other site languages.
 * Returns a { [lang]: BlogTranslation } map. Never throws: any failed
 * language is simply omitted (the frontend falls back to Spanish).
 */
export async function generateBlogTranslations(post: BlogContent): Promise<Record<string, BlogTranslation>> {
  if (!process.env.OPENAI_API_KEY) {
    console.warn("[Blog Translate] OPENAI_API_KEY missing — skipping translations.");
    return {};
  }
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  const entries = await Promise.all(
    Object.entries(LANGS).map(async ([code, name]) => {
      try {
        const resp = await openai.chat.completions.create({
          model: TRANSLATE_MODEL,
          response_format: { type: "json_object" },
          messages: [
            {
              role: "system",
              content:
                `You are a professional translator for a B2B corporate-gifts and merchandising company. ` +
                `Translate the blog post below from Spanish to ${name}, with a natural, professional marketing tone. ` +
                `CRITICAL: the "body" field is HTML — preserve every HTML tag, attribute and the overall structure EXACTLY; ` +
                `only translate the human-readable text between tags. Do NOT translate: the brand name "Universo Merchan", ` +
                `product names/codes, and any URLs/links (keep href values identical). ` +
                `Keep metaTitle <= 60 characters and metaDescription <= 155 characters. ` +
                `Return STRICT JSON with exactly these keys: title, excerpt, body, metaTitle, metaDescription.`,
            },
            {
              role: "user",
              content: JSON.stringify({
                title: post.title,
                excerpt: post.excerpt || "",
                body: post.body,
                metaTitle: post.metaTitle || post.title,
                metaDescription: post.metaDescription || "",
              }),
            },
          ],
        });
        const content = resp.choices[0]?.message?.content;
        if (!content) return null;
        const p = JSON.parse(content);
        if (!p.title || !p.body) return null;
        const t: BlogTranslation = {
          title: p.title,
          excerpt: p.excerpt || "",
          body: p.body,
          metaTitle: p.metaTitle || p.title,
          metaDescription: p.metaDescription || "",
        };
        return [code, t] as [string, BlogTranslation];
      } catch (e: any) {
        console.error(`[Blog Translate] Failed for ${code}:`, e?.message || e);
        return null;
      }
    })
  );

  return Object.fromEntries(entries.filter(Boolean) as [string, BlogTranslation][]);
}

/**
 * Generate translations for an already-inserted post and store them.
 * Call this AFTER inserting the Spanish post so a translation failure
 * never blocks publishing. Never throws.
 */
export async function translateAndStorePost(postId: number, post: BlogContent): Promise<void> {
  try {
    const translations = await generateBlogTranslations(post);
    if (Object.keys(translations).length > 0) {
      await db
        .update(blogPosts)
        .set({ translations: translations as any, updatedAt: new Date() })
        .where(eq(blogPosts.id, postId));
      console.log(`[Blog Translate] Stored translations [${Object.keys(translations).join(", ")}] for post ${postId}.`);
    } else {
      console.warn(`[Blog Translate] No translations generated for post ${postId} (post stays Spanish-only).`);
    }
  } catch (e: any) {
    console.error(`[Blog Translate] translateAndStorePost failed for ${postId}:`, e?.message || e);
  }
}
