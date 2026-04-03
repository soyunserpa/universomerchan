const { Client } = require('ssh2');

const script = `
cat << 'EOF' > /var/www/universomerchan/find-exact-skus.ts
import { db } from "./src/lib/database";
import { inArray } from "drizzle-orm";
import * as schema from "./src/lib/schema";

async function run() {
    const codes = ["MO9601", "MO6146", "S11380", "MO9800", "MO7490", "IT3780", "MO1332"];
    const products = await db.query.products.findMany({
        where: inArray(schema.products.masterCode, codes),
        columns: { masterCode: true, productName: true, shortDescription: true }
    });
    
    for (const p of products) {
        const variants = await db.query.productVariants.findMany({
            where: inArray(schema.productVariants.productId, [p.id]),
            columns: { colorDescription: true, colorGroup: true }
        });
        const colors = variants.map(v => v.colorDescription).join(" | ");
        console.log(\`[\${p.masterCode}] \${p.productName}\`);
        console.log(\`  Colors: \${colors}\`);
        console.log("---");
    }
    
    process.exit(0);
}
run();
EOF
cd /var/www/universomerchan && npx tsx -r dotenv/config find-exact-skus.ts
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
