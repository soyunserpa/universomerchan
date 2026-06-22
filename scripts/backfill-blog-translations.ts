// ============================================================
// UNIVERSO MERCHAN — Backfill blog translations
// ============================================================
// One-off: translate existing blog posts (created before auto-translation
// existed) into the 6 site languages and store them in blogPosts.translations.
// Idempotent: posts that already have all 6 languages are skipped.
//
// Run (against the target DB — usually production):
//   npx tsx --env-file=.env scripts/backfill-blog-translations.ts
//   npx tsx --env-file=.env scripts/backfill-blog-translations.ts --force   (re-translate all)
//
// Requires OPENAI_API_KEY and DATABASE_URL in the env file. Cost: ~6 cheap
// OpenAI calls per post. Safe to re-run; Spanish stays the base/fallback.
// ============================================================

import { db } from "@/lib/database";
import { blogPosts } from "@/lib/schema";
import { translateAndStorePost } from "@/lib/blog-translate";

const REQUIRED_LANGS = ["en", "fr", "de", "it", "pt", "nl"];
const FORCE = process.argv.includes("--force");

function hasAllLangs(translations: any): boolean {
  if (!translations || typeof translations !== "object") return false;
  return REQUIRED_LANGS.every((l) => translations[l] && translations[l].title && translations[l].body);
}

async function main() {
  const posts = await db.select().from(blogPosts);
  console.log(`[Backfill] ${posts.length} posts found.${FORCE ? " (--force: re-translating all)" : ""}`);

  let translated = 0;
  let skipped = 0;

  for (const post of posts) {
    if (!FORCE && hasAllLangs(post.translations)) {
      skipped++;
      continue;
    }
    console.log(`[Backfill] Translating #${post.id} "${post.title}" ...`);
    await translateAndStorePost(post.id, {
      title: post.title,
      excerpt: post.excerpt,
      body: post.body,
      metaTitle: post.metaTitle,
      metaDescription: post.metaDescription,
    });
    translated++;
    // Gentle pacing to stay well under OpenAI rate limits.
    await new Promise((r) => setTimeout(r, 1000));
  }

  console.log(`[Backfill] Done. Translated: ${translated}, skipped (already complete): ${skipped}.`);
  process.exit(0);
}

main().catch((e) => {
  console.error("[Backfill] Fatal:", e);
  process.exit(1);
});
