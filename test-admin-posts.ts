require('dotenv').config();
const { getAdminPosts } = require('./src/lib/cms-content.ts');

async function run() {
  try {
    const data = await getAdminPosts();
    console.log("Success:", data.posts.length);
  } catch (e) {
    console.error("Crash detected:", e);
  }
  process.exit(0);
}
run();
