const { Client } = require('ssh2');

const script = `
cat << 'EOF' > /var/www/universomerchan/check-sku-names.ts
import { db } from "./src/lib/database";
import { inArray } from "drizzle-orm";
import * as schema from "./src/lib/schema";

async function run() {
    const codes = ["MO9601", "MO6146", "MO2050", "MO2051", "S11380", "S11500", "S11970", "MO9812", "MO9112", "MO7490", "IT3780", "IT3781", "IT3782"];
    const products = await db.query.products.findMany({
        where: inArray(schema.products.masterCode, codes),
        columns: { masterCode: true, productName: true }
    });
    console.log(products);
    process.exit(0);
}
run();
EOF
cd /var/www/universomerchan && npx tsx -r dotenv/config check-sku-names.ts
`;

const conn = new Client();
conn.on('ready', () => {
    conn.exec(script, (err, stream) => {
        if (err) throw err;
        let out = "";
        stream.on('close', () => {
            console.log("DB DATA:", out);
            conn.end();
        }).on('data', data => out += data.toString());
    });
}).connect({ host: '212.227.90.110', port: 22, username: 'root', password: 'V34a6df?6' });
