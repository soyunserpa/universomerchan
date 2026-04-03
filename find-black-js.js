const { Client } = require('ssh2');

const script = `
cat << 'EOF' > /var/www/universomerchan/find-black-skus.ts
import { db } from "./src/lib/database";
import { eq, or, ilike, and } from "drizzle-orm";
import * as schema from "./src/lib/schema";

async function run() {
    const products = await db.query.products.findMany({
        columns: { id: true, masterCode: true, productName: true, categoryLevel1: true, categoryLevel2: true },
        limit: 1000
    });
    
    console.log("Found", products.length, "total products");
    let blackProducts = [];
    
    for (const p of products) {
        const variants = await db.query.productVariants.findMany({
            where: and(
                eq(schema.productVariants.productId, p.id),
                or(ilike(schema.productVariants.colorDescription, '%negro%'), ilike(schema.productVariants.colorDescription, '%black%'))
            ),
            limit: 1
        });
        if (variants.length > 0) blackProducts.push(p);
    }
    
    const backpacks = blackProducts.filter(p => p.productName.toLowerCase().includes('backpack') || p.productName.toLowerCase().includes('rollpack')).slice(0, 3);
    const shirts = blackProducts.filter(p => p.productName.toLowerCase().includes('shirt') || p.productName.toLowerCase().includes('imperial')).slice(0, 3);
    const bottles = blackProducts.filter(p => p.productName.toLowerCase().includes('bottle')).slice(0, 3);
    const notebooks = blackProducts.filter(p => p.productName.toLowerCase().includes('notebook')).slice(0, 3);
    
    console.log("BLACK BACKPACKS:", backpacks.map(p => p.masterCode + " - " + p.productName));
    console.log("BLACK SHIRTS:", shirts.map(p => p.masterCode + " - " + p.productName));
    console.log("BLACK BOTTLES:", bottles.map(p => p.masterCode + " - " + p.productName));
    console.log("BLACK NOTEBOOKS:", notebooks.map(p => p.masterCode + " - " + p.productName));
    
    process.exit(0);
}
run();
EOF
cd /var/www/universomerchan && npx tsx -r dotenv/config find-black-skus.ts
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
