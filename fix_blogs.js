require('dotenv').config({ path: '/var/www/universomerchan/.env' });
const { Client } = require('pg');
const { OpenAI } = require('openai');

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const db = new Client({ connectionString: process.env.DATABASE_URL });

async function run() {
  await db.connect();
  const res = await db.query('SELECT id, title, meta_title, body FROM blog_posts');
  console.log(`Found ${res.rowCount} posts to process.`);

  let updatedCount = 0;
  for (const row of res.rows) {
    const originalBody = row.body || '';
    // Remove all <h1>...</h1> tags (even with attributes)
    const newBody = originalBody.replace(/<h1[^>]*>[\s\S]*?<\/h1>/gi, '');

    const oldTitle = row.title;
    const oldMeta = row.meta_title || '';

    // Only rewrite if it's not already a question (starts with ¿ or ends with ?)
    let newTitle = oldTitle;
    let newMeta = oldMeta;
    
    if (!oldTitle.trim().startsWith('¿') && !oldTitle.trim().endsWith('?')) {
      try {
        const completion = await openai.chat.completions.create({
          model: "gpt-4o-mini",
          messages: [
            {
              role: "system",
              content: "You are an SEO expert. Rewrite the given blog post title so it becomes a natural, engaging long-tail question (e.g. starting with ¿Cómo, ¿Qué, ¿Cuál, etc.) in Spanish. Keep the core keywords. IMPORTANT: The new title MUST be strictly between 50 and 60 characters long. The metaTitle MUST be around 155 characters long. Reply ONLY with a JSON object: {\"title\": \"¿Nuevo título?\", \"metaTitle\": \"¿Nueva metadescripción en forma de pregunta o frase con pregunta?\"}. Do not use emojis."
            },
            {
              role: "user",
              content: `Original Title: ${oldTitle}\nOriginal Meta: ${oldMeta}`
            }
          ],
          response_format: { type: "json_object" }
        });

        const data = JSON.parse(completion.choices[0].message.content);
        if (data.title) newTitle = data.title;
        if (data.metaTitle) newMeta = data.metaTitle;
      } catch (e) {
        console.error(`Failed to rewrite title for ID ${row.id}:`, e.message);
      }
    }

    if (newBody !== originalBody || newTitle !== oldTitle) {
      await db.query('UPDATE blog_posts SET title = $1, meta_title = $2, body = $3 WHERE id = $4', [newTitle, newMeta, newBody, row.id]);
      updatedCount++;
      console.log(`Updated ID ${row.id}: ${oldTitle} -> ${newTitle}`);
    } else {
      console.log(`Skipped ID ${row.id} (already a question & no H1 found)`);
    }
  }

  console.log(`Finished processing. Updated ${updatedCount} posts.`);
  await db.end();
}

run().catch(console.error);
