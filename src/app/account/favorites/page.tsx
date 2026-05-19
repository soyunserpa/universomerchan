"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Package, Eye, Truck, FileText, User, Heart, Loader2, LogOut } from "lucide-react";
import { ProductCard } from "@/components/catalog/ProductCard";

export default function AccountFavoritesPage() {
  const { user, token, isAuthenticated, isLoading, logout } = useAuth();
  const router = useRouter();
  const [favorites, setFavorites] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/auth/login?redirect=/account/favorites");
    }
  }, [isLoading, isAuthenticated, router]);

  useEffect(() => {
    if (token) {
      fetch("/api/favorites", {
        headers: { "Authorization": `Bearer ${token}` }
      })
      .then(res => res.json())
      .then(data => {
        if (data.favorites) setFavorites(data.favorites);
      })
      .finally(() => setLoading(false));
    }
  }, [token]);

  if (isLoading || !isAuthenticated) return <div className="min-h-[50vh] flex items-center justify-center"><Loader2 className="animate-spin text-brand-red" size={32} /></div>;

  return (
    <div className="bg-surface-50 min-h-screen py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col md:flex-row gap-8">
        
        {/* Sidebar */}
        <div className="w-full md:w-64 flex-shrink-0">
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-surface-200">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-brand-red flex items-center justify-center text-white font-bold text-sm">
                {user?.firstName?.[0]}{user?.lastName?.[0]}
              </div>
              <div>
                <p className="font-semibold text-sm">{user?.firstName} {user?.lastName}</p>
                <p className="text-xs text-gray-400">{user?.email}</p>
              </div>
            </div>
          </div>

          <div className="mt-4 flex flex-col gap-1">
            {[
              { href: "/account/orders", icon: Package, label: "Mis pedidos" },
              { href: "/account/proofs", icon: Eye, label: "Mis bocetos" },
              { href: "/account/shipping", icon: Truck, label: "Mis envíos" },
              { href: "/account/quotes", icon: FileText, label: "Presupuestos" },
              { href: "/account/favorites", icon: Heart, label: "Favoritos" },
              { href: "/account/profile", icon: User, label: "Mi perfil" },
            ].map(item => (
              <Link key={item.href} href={item.href} className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${item.href === "/account/favorites" ? "bg-brand-red text-white" : "text-gray-600 hover:bg-surface-50"}`}>
                <item.icon size={16} /> {item.label}
              </Link>
            ))}
            <button onClick={() => { logout(); router.push("/"); }} className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-sm font-medium text-red-600 hover:bg-red-50 transition-colors mt-2 text-left">
              <LogOut size={16} /> Cerrar sesión
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1">
          <div className="mb-6">
            <h1 className="font-display font-extrabold text-2xl mb-1 flex items-center gap-2">
              <Heart className="text-brand-red" fill="currentColor" size={24} /> Mis Favoritos
            </h1>
            <p className="text-sm text-gray-500">Los productos que has guardado para más tarde.</p>
          </div>

          {loading ? (
            <div className="py-20 flex justify-center"><Loader2 className="animate-spin text-brand-red" size={32} /></div>
          ) : favorites.length === 0 ? (
            <div className="bg-white rounded-2xl border border-surface-200 p-12 text-center flex flex-col items-center">
              <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center text-brand-red mb-4">
                <Heart size={32} />
              </div>
              <h3 className="font-display font-bold text-lg mb-2">Aún no tienes favoritos</h3>
              <p className="text-gray-500 text-sm mb-6 max-w-md">Guarda los productos que más te gusten haciendo clic en el corazón para tenerlos siempre a mano cuando quieras preparar un presupuesto o pedido.</p>
              <Link href="/catalog" className="bg-brand-red text-white px-6 py-2.5 rounded-full font-bold hover:bg-brand-red-dark transition-colors">
                Ir al Catálogo
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {favorites.map((product) => (
                <ProductCard key={product.productId} product={product} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
