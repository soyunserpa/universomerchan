const fs = require('fs');
let code = fs.readFileSync('src/lib/favorites-store.tsx', 'utf8');

code = code.replace(
  '  const isFavorite = (productId: number) => {',
  `  const isFavorite = (productId: number) => {
    if (!Array.isArray(favoriteIds)) {
      console.error("favoriteIds is not an array!", favoriteIds);
      return false;
    }`
);

code = code.replace(
  'const isFav = favoriteIds.includes(productId);',
  'const isFav = Array.isArray(favoriteIds) && favoriteIds.includes(productId);'
);

code = code.replace(
  'setFavoriteIds(prev => prev.filter(id => id !== productId));',
  'setFavoriteIds(prev => Array.isArray(prev) ? prev.filter(id => id !== productId) : []);'
);
code = code.replace(
  'setFavoriteIds(prev => [...prev, productId]);',
  'setFavoriteIds(prev => Array.isArray(prev) ? [...prev, productId] : [productId]);'
);
code = code.replace(
  'setFavoriteIds(prev => [...prev, productId]);',
  'setFavoriteIds(prev => Array.isArray(prev) ? [...prev, productId] : [productId]);'
);
code = code.replace(
  'setFavoriteIds(prev => prev.filter(id => id !== productId));',
  'setFavoriteIds(prev => Array.isArray(prev) ? prev.filter(id => id !== productId) : []);'
);
code = code.replace(
  'setFavoriteIds(prev => Array.from(new Set([...prev, productId])));',
  'setFavoriteIds(prev => Array.from(new Set([...(Array.isArray(prev) ? prev : []), productId])));'
);
code = code.replace(
  'setFavoriteIds(prev => prev.filter(id => id !== productId));',
  'setFavoriteIds(prev => Array.isArray(prev) ? prev.filter(id => id !== productId) : []);'
);

fs.writeFileSync('src/lib/favorites-store.tsx', code);
console.log("Patched store");
