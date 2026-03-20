import { readFileSync } from 'fs';
import { execSync } from 'child_process';

const envContent = readFileSync('/var/www/universomerchan/.env', 'utf8');
const match = envContent.match(/MIDOCEAN_API_KEY=["']?([^"'\n]+)/);
const API_KEY = match ? match[1].trim() : '';

console.log('1. Fetching printdata API...');
const res = await fetch('https://api.midocean.com/gateway/printdata/1.0?masterCode=MO9062', {
  headers: { 'x-Gateway-APIKey': API_KEY }
});
const data = await res.json();
const items = data.products || [];
console.log(`   Got ${items.length} products from API`);

// Build map
const manipMap = new Map();
for (const item of items) {
  const mc = item.master_code;
  const pm = item.print_manipulation;
  if (mc && pm) manipMap.set(mc, pm.trim().toUpperCase());
}
console.log(`2. ${manipMap.size} products have manipulation in API`);

const dist = {};
for (const [, v] of manipMap) dist[v] = (dist[v] || 0) + 1;
console.log('   Distribution:', dist);

// Build SQL
const updates = [];
for (const [mc, code] of manipMap) {
  const safeMc = mc.replace(/'/g, "''");
  const safeCode = code.replace(/'/g, "''");
  updates.push(`UPDATE products SET print_manipulation = '${safeCode}' WHERE master_code = '${safeMc}' AND (print_manipulation IS NULL OR print_manipulation = '' OR print_manipulation != '${safeCode}');`);
}

// Write to temp SQL file and execute via psql
const sqlContent = 'BEGIN;\n' + updates.join('\n') + '\nCOMMIT;\n';
const { writeFileSync } = await import('fs');
writeFileSync('/tmp/update-manip.sql', sqlContent);
console.log(`3. Executing ${updates.length} UPDATE statements via psql...`);

const result = execSync('sudo -u postgres psql -d universomerchan -f /tmp/update-manip.sql 2>&1').toString();
const updateLines = result.split('\n').filter(l => l.startsWith('UPDATE'));
const totalUpdated = updateLines.reduce((sum, l) => sum + parseInt(l.split(' ')[1] || 0), 0);
console.log(`   Rows updated: ${totalUpdated}`);

// Final check
const finalResult = execSync("sudo -u postgres psql -d universomerchan -c \"SELECT print_manipulation, COUNT(*) FROM products GROUP BY print_manipulation ORDER BY count DESC;\"").toString();
console.log('\n4. Final DB state:');
console.log(finalResult);
