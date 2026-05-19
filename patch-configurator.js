const fs = require('fs');
let code = fs.readFileSync('src/components/product/ProductConfigurator.tsx', 'utf8');

if (!code.includes('FavoriteButton')) {
  code = code.replace(
    'import { ShoppingCart, Leaf, ChevronRight, Check, AlertCircle, Copy, Info } from "lucide-react";',
    'import { ShoppingCart, Leaf, ChevronRight, Check, AlertCircle, Copy, Info } from "lucide-react";\nimport { FavoriteButton } from "./FavoriteButton";'
  );

  code = code.replace(
    '<h1 className="font-display font-extrabold text-3xl mb-2">{product.name} {product.shortDescription}</h1>',
    `<div className="flex items-start justify-between gap-4">
              <h1 className="font-display font-extrabold text-3xl mb-2">{product.name} {product.shortDescription}</h1>
              <div className="mt-1 flex-shrink-0">
                <FavoriteButton productId={product.id} variant="icon" />
              </div>
            </div>`
  );

  fs.writeFileSync('src/components/product/ProductConfigurator.tsx', code);
  console.log("Patched ProductConfigurator");
}
