const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
    const tsScript = `
import { db } from "./src/lib/database";
import * as schema from "./src/lib/schema";
import { eq } from "drizzle-orm";

async function investigate() {
  const user = await db.query.users.findFirst({
     where: eq(schema.users.email, 'jerry.zhanay@gmail.com')
  });

  if (!user) { console.log("User not found"); process.exit(0); }
  console.log("User:", user.id, user.firstName, user.lastName, user.createdAt);

  const orders = await db.query.orders.findMany({
     where: eq(schema.orders.userId, user.id)
  });
  console.log("Orders / Drafts:", orders.map(o => ({
    id: o.id, number: o.orderNumber, status: o.status, total: o.totalPrice, created: o.createdAt
  })));

  // If there's an order, let's see its lines
  for (const o of orders) {
    const lines = await db.query.orderLines.findMany({
      where: eq(schema.orderLines.orderId, o.id)
    });
    console.log("Lines for", o.orderNumber, ":", lines.map(l => l.productName));
  }
  
  process.exit(0);
}
investigate();
`;

    const cmd = `cat > /var/www/universomerchan/investigate.ts << "EOF"\n${tsScript}\nEOF\ncd /var/www/universomerchan && DATABASE_URL="postgres://postgres:S4fcK921m@localhost:5432/universomerchan" npx tsx investigate.ts && rm investigate.ts`;

    conn.exec(cmd, (err, stream) => {
        if (err) throw err;
        stream.on('close', (code, signal) => {
            conn.end();
        }).on('data', (data) => {
            process.stdout.write(data.toString());
        }).stderr.on('data', (data) => {
            process.stderr.write(data.toString());
        });
    });
}).on('error', (err) => {
    console.log('Connection error:', err);
}).connect({
    host: '212.227.90.110',
    port: 22,
    username: 'root',
    password: 'V34a6df?6'
});
