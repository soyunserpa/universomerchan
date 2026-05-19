const fs = require('fs');
let code = fs.readFileSync('src/app/api/favorites/route.ts', 'utf8');

code = code.replace(
  '    return NextResponse.json({ favorites, favoriteProductIds });',
  `    const formattedFavorites = favorites.map(f => ({
      id: f.productId,
      masterCode: f.masterCode,
      name: f.shortDescription || f.masterCode,
      shortDescription: f.shortDescription || "",
      category: f.categoryLevel1 || "",
      startingPriceRaw: parseFloat(f.basePriceSell?.toString() || "0"),
      mainImage: f.featuredImageUrl || "",
      variants: [],
      productId: f.productId // For React key
    }));

    return NextResponse.json({ favorites: formattedFavorites, favoriteProductIds });`
);

fs.writeFileSync('src/app/api/favorites/route.ts', code);
console.log("Patched API");
