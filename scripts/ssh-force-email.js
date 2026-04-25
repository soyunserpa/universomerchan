const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
    const tsScript = `
import { db } from "./src/lib/database";
import * as schema from "./src/lib/schema";
import { eq } from "drizzle-orm";
import { sendCartAbandonedEmail } from "./src/lib/email-service";

async function force() {
  const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://universomerchan.com";
  const user = await db.query.users.findFirst({ where: eq(schema.users.email, 'contact@petitateliergraphique.fr') });
  if (!user) { console.log("No user found"); return; }
  
  const order = await db.query.orders.findFirst({ where: eq(schema.orders.userId, user.id) });
  if (!order) { console.log("No order found"); return; }

  const lines = await db.query.orderLines.findMany({ where: eq(schema.orderLines.orderId, order.id) });
  const items = lines.map(l => ({
    name: l.productName || "Producto",
    price: parseFloat(l.lineTotal?.toString() || "0").toFixed(2) + " €"
  }));
  const totalPrice = parseFloat(order.totalPrice?.toString() || "0").toFixed(2) + " €";

  console.log("Sending email to", user.email);
  const sent = await sendCartAbandonedEmail(user.email, {
    orderId: order.id,
    firstName: user.firstName || "Cliente",
    items,
    totalPrice,
    cartUrl: SITE_URL + "/cart?restore=" + order.orderNumber,
  });
  console.log("Result of sending:", sent);
  process.exit(0);
}
force();
`;

    const cmd = `cat > /var/www/universomerchan/force_email.ts << "EOF"\n${tsScript}\nEOF\ncd /var/www/universomerchan && DATABASE_URL="postgres://postgres:S4fcK921m@localhost:5432/universomerchan" NEXT_PUBLIC_SITE_URL="https://universomerchan.com" APPS_SCRIPT_EMAIL_URL="https://script.google.com/macros/s/AKfycby-082Z9RBmOCxLUl8hsxeFvrZJUj1QT1EOHHp0tQ6V3_HUidG4KutHzO2ZeOw6suyi/exec" npx tsx force_email.ts && rm force_email.ts`;

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
