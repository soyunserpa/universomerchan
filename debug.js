const fs = require('fs');
// Let's modify the file to console.log qty and sizeQuantities
const file = 'src/components/product/ProductConfigurator.tsx';
let code = fs.readFileSync(file, 'utf8');
code = code.replace(
  'const qty = hasSize',
  'console.log("RENDER QTY", {hasSize, baseQty, sizeQuantities}); const qty = hasSize'
);
fs.writeFileSync(file, code);
