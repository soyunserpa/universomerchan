const fs = require('fs');
const glob = require('glob'); // Note: we can just manually list since it's just 5 files
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
    
    // Add Heart to lucide-react imports if missing
    if (!code.includes('Heart')) {
      code = code.replace(/import \{([^}]+)\} from "lucide-react";/, (match, p1) => {
        return `import {${p1}, Heart } from "lucide-react";`;
      });
    }

    code = code.replace(
      '{ href: "/account/quotes", icon: FileText, label: "Presupuestos", badge: stats?.activeQuotes },',
      '{ href: "/account/quotes", icon: FileText, label: "Presupuestos", badge: stats?.activeQuotes },\n            { href: "/account/favorites", icon: Heart, label: "Favoritos" },'
    );
    
    fs.writeFileSync(file, code);
    console.log("Patched", file);
  }
}
