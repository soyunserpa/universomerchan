require('dotenv').config({ path: '.env' });
const { OpenAI } = require('openai');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

async function main() {
  try {
    const models = await openai.models.list();
    const dalle3 = models.data.find(m => m.id.includes('dall-e'));
    console.log("DALL-E models available:", models.data.filter(m => m.id.includes('dall-e')).map(m => m.id));
  } catch (error) {
    console.error(error);
  }
}

main();
