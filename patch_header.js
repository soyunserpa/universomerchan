const fs = require('fs');
let code = fs.readFileSync('src/components/layout/Header.tsx', 'utf8');

code = code.replace(
  'import { Search, ShoppingCart, User, Menu, X, Loader2, Sparkles } from "lucide-react";',
  'import { Search, ShoppingCart, User, Menu, X, Loader2, Sparkles, Heart } from "lucide-react";\nimport { useFavorites } from "@/lib/favorites-store";'
);

code = code.replace(
  'const { globalLogo, globalLogoName, setGlobalLogo, clearGlobalLogo } = useGlobalLogo();',
  'const { globalLogo, globalLogoName, setGlobalLogo, clearGlobalLogo } = useGlobalLogo();\n  const { favoriteIds } = useFavorites();'
);

const favoritesBtn = `
          {/* Favorites */}
          <Link aria-label="Favoritos" href="/account/favorites" className="group flex flex-col items-center gap-1 text-gray-900 hover:text-brand-red hidden sm:flex pt-1 relative">
            <Heart size={20} className="transition-transform group-hover:-translate-y-0.5" />
            {favoriteIds.length > 0 && (
              <span className="absolute -top-1.5 -right-2 bg-brand-red text-white text-[9px] font-bold w-[16px] h-[16px] rounded-full flex items-center justify-center shadow-sm">
                {favoriteIds.length}
              </span>
            )}
            <span className="text-[10px] font-bold hidden md:block transition-colors">Favoritos</span>
          </Link>
`;

code = code.replace(
  '{/* User */}\n          <Link aria-label="Mi Cuenta"',
  favoritesBtn + '\n          {/* User */}\n          <Link aria-label="Mi Cuenta"'
);

fs.writeFileSync('src/components/layout/Header.tsx', code);
console.log("Patched Header");
