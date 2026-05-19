const fs = require('fs');

// 1. Fix ProductCard import
let favCode = fs.readFileSync('src/app/account/favorites/page.tsx', 'utf8');
favCode = favCode.replace('@/components/product/ProductCard', '@/components/catalog/ProductCard');
fs.writeFileSync('src/app/account/favorites/page.tsx', favCode);

// 2. Fix trailing comma in lucide imports
const files = [
  'src/app/account/orders/page.tsx',
  'src/app/account/proofs/page.tsx',
  'src/app/account/shipping/page.tsx',
  'src/app/account/quotes/page.tsx',
  'src/app/account/profile/page.tsx',
];

for (const file of files) {
  if (fs.existsSync(file)) {
    let code = fs.readFileSync(file, 'utf8');
    code = code.replace(/,\n, Heart/g, ',\n  Heart');
    code = code.replace(/, , Heart/g, ', Heart');
    code = code.replace(/,\s*, Heart/g, ', Heart');
    fs.writeFileSync(file, code);
  }
}

console.log("Fixed errors");
