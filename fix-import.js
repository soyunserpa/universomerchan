const fs = require('fs');
let code = fs.readFileSync('src/components/product/ProductConfigurator.tsx', 'utf8');

if (!code.includes('import { FavoriteButton }')) {
  code = code.replace(
    '} from "lucide-react";',
    '} from "lucide-react";\nimport { FavoriteButton } from "./FavoriteButton";'
  );
  fs.writeFileSync('src/components/product/ProductConfigurator.tsx', code);
  console.log("Fixed import");
}
