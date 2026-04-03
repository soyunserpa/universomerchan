const { Client } = require('ssh2');

const script = `
cat << 'EOF' > /var/www/universomerchan/find-skus-en.ts
import { db } from "./src/lib/database";
import { ilike, and, or } from "drizzle-orm";
import * as schema from "./src/lib/schema";

async function run() {
    const backpacks = await db.query.products.findMany({
        where: ilike(schema.products.productName, '%backpack%'),
        limit: 10,
        columns: { masterCode: true, productName: true }
    });
    console.log("BACKPACKS:", backpacks);

    const bottles = await db.query.products.findMany({
        where: ilike(schema.products.productName, '%bottle%'),
        limit: 10,
        columns: { masterCode: true, productName: true }
    });
    console.log("BOTTLES:", bottles);

    const notebooks = await db.query.products.findMany({
        where: ilike(schema.products.productName, '%notebook%'),
        limit: 10,
        columns: { masterCode: true, productName: true }
    });
    console.log("NOTEBOOKS:", notebooks);

    const textiles = await db.query.products.findMany({
        where: or(ilike(schema.products.productName, '%t-shirt%'), ilike(schema.products.productName, '%hoodie%')),
        limit: 10,
        columns: { masterCode: true, productName: true }
    });
    console.log("TEXTILES:", textiles);
    
    process.exit(0);
}
run();
EOF
cd /var/www/universomerchan && npx tsx -r dotenv/config find-skus-en.ts
`;

const conn = new Client();
conn.on('ready', () => {
    conn.exec(script, (err, stream) => {
        if (err) throw err;
        stream.on('close', () => conn.end())
              .on('data', data => process.stdout.write(data.toString()))
              .stderr.on('data', data => process.stderr.write(data.toString()));
    });
}).connect({ host: '212.227.90.110', port: 22, username: 'root', password: 'V34a6df?6' });
