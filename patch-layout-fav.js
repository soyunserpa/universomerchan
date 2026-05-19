const fs = require('fs');
let code = fs.readFileSync('src/app/layout.tsx', 'utf8');

if (!code.includes('AutoFavoriteHandler')) {
  code = code.replace(
    'import { FavoritesProvider } from "@/lib/favorites-store";',
    'import { FavoritesProvider } from "@/lib/favorites-store";\nimport { AutoFavoriteHandler } from "@/components/providers/AutoFavoriteHandler";'
  );

  code = code.replace(
    '<FavoritesProvider>',
    '<FavoritesProvider>\n              <AutoFavoriteHandler />'
  );

  fs.writeFileSync('src/app/layout.tsx', code);
  console.log("Patched layout with AutoFavoriteHandler");
}
