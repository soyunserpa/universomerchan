const { OpenAI } = require('openai');
require('dotenv').config();

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY }); // Note: Need a valid key locally, let's just make Next.js API do it correctly or run this via VPS. Wait. I'll just SSH into VPS and run it via node with Postgres directly.
