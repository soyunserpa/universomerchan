"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import { useCart } from "@/lib/cart-store";
import { Search, ShoppingCart, User, Menu, X, Loader2 } from "lucide-react";

export function Header() {
  const pathname = usePathname();
  const { itemCount, toggleCart } = useCart();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [popularSearches, setPopularSearches] = useState<string[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  const navLinks = [
    { href: "/catalog", label: "Catálogo" },
    { href: "/#sobre-nosotros", label: "Sobre nosotros" },
    { href: "/#como-funciona", label: "Cómo funciona" },
    { href: "/#contacto", label: "Contacto" },
    { href: "/blog", label: "Blog" },
  ];

  // Debounced live search
  useEffect(() => {
    if (!searchQuery.trim() || searchQuery.length < 2) {
      setSearchResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(searchQuery)}`);
        const data = await res.json();
        setSearchResults(data.products || []);
      } catch (e) {
        console.error(e);
      } finally {
        setIsSearching(false);
      }
    }, 250);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Click outside to close search
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setSearchOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (searchOpen && popularSearches.length === 0) {
      fetch("/api/search/popular")
        .then(res => res.json())
        .then(data => setPopularSearches(data.popular || []))
        .catch(console.error);
    }
  }, [searchOpen]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      fetch("/api/search/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: searchQuery.trim() })
      }).catch(console.error);
      
      window.location.href = `/catalog?search=${encodeURIComponent(searchQuery.trim())}`;
      setSearchOpen(false);
    }
  };

  return (
    <header className="bg-white border-b border-surface-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between h-16">
        {/* Logo */}
        <Link href="/" className="flex items-center group">
          <img src="/images/logo.svg" alt="Universo Merchan" className="h-10 transition-transform group-hover:scale-105" />
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-7 font-body">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`text-sm font-semibold transition-colors pb-0.5 border-b-2 ${
                pathname === link.href
                  ? "text-brand-red border-brand-red"
                  : "text-gray-700 border-transparent hover:text-gray-900"
              }`}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Right actions */}
        <div className="flex items-center gap-4 sm:gap-6">
          {/* Search */}
          <div ref={searchContainerRef} className="relative flex items-center h-full">
            {searchOpen ? (
              <form onSubmit={handleSearch} className="flex items-center gap-2 animate-fade-in relative z-10">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Buscar..."
                  autoFocus
                  className="w-56 lg:w-72 px-4 py-2 text-sm border border-surface-200 rounded-full font-body shadow-sm focus:border-brand-red focus:ring-1 focus:ring-brand-red outline-none"
                />
                <button
                  aria-label="Cerrar búsqueda"
                  type="button"
                  onClick={() => { setSearchOpen(false); setSearchQuery(""); }}
                  className="text-gray-500 hover:text-brand-red absolute right-3"
                >
                  <X size={18} />
                </button>

                {/* Dropdown Results */}
                {searchOpen && (
                  <div className="absolute top-12 left-0 w-full bg-white border border-surface-200 shadow-xl rounded-xl overflow-hidden py-2 z-50 animate-fade-in">
                    
                    {/* Tendencias */}
                    {searchQuery.length < 2 && popularSearches.length > 0 && (
                      <div className="px-4 py-2">
                        <p className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wider flex items-center gap-1">
                          🔥 Top Búsquedas
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {popularSearches.map((term, idx) => (
                            <button
                              key={idx}
                              type="button"
                              onClick={() => {
                                setSearchQuery(term);
                                fetch("/api/search/track", {
                                  method: "POST",
                                  headers: { "Content-Type": "application/json" },
                                  body: JSON.stringify({ query: term })
                                }).catch(console.error);
                                window.location.href = `/catalog?search=${encodeURIComponent(term)}`;
                              }}
                              className="px-3 py-1.5 bg-surface-100 hover:bg-brand-red hover:text-white text-gray-700 text-xs rounded-full transition-colors font-medium border border-surface-200 hover:border-brand-red"
                            >
                              {term}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {searchQuery.length >= 2 && isSearching ? (
                      <div className="flex items-center justify-center p-4 text-gray-500">
                        <Loader2 className="w-5 h-5 animate-spin" />
                      </div>
                    ) : searchResults.length > 0 ? (
                      <>
                        {searchResults.map((p) => (
                          <Link
                            key={p.masterCode}
                            href={`/product/${p.masterCode.toLowerCase()}`}
                            onClick={() => setSearchOpen(false)}
                            className="flex items-center gap-3 px-4 py-2 hover:bg-surface-100 transition-colors"
                          >
                            <div className="w-10 h-10 bg-surface-100 rounded flex-shrink-0 relative overflow-hidden">
                              {p.mainImage && (
                                <img src={p.mainImage} alt={p.productName} className="object-cover w-full h-full mix-blend-multiply" />
                              )}
                            </div>
                            <div className="flex flex-col min-w-0 flex-1">
                              <span className="text-xs font-semibold text-gray-900 truncate">{p.productName}</span>
                              <span className="text-[10px] text-gray-500">Desde {p.startingPriceRaw?.toFixed(2)}€</span>
                            </div>
                          </Link>
                        ))}
                      </>
                    ) : searchQuery.length >= 2 ? (
                      <div className="p-4 text-center text-sm text-gray-500">
                        No hay resultados para "{searchQuery}"
                      </div>
                    ) : null}
                    
                    {/* Botón inferior si hay búsqueda */}
                    {searchQuery.length >= 2 && (
                      <div className="border-t border-surface-200 p-2 mt-2 bg-surface-50">
                        <button 
                          type="button"
                          onClick={(e) => handleSearch(e as any)}
                          className="w-full text-center text-xs font-bold text-brand-red py-2 hover:underline rounded transition-colors"
                        >
                          Ver todos los resultados para "{searchQuery}"
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </form>
            ) : (
              <button
                aria-label="Buscar productos"
                onClick={() => setSearchOpen(true)}
                className="group flex flex-col items-center gap-1 text-gray-900 hover:text-brand-red pt-1"
              >
                <Search size={20} className="transition-transform group-hover:-translate-y-0.5" />
                <span className="text-[10px] font-bold hidden md:block transition-colors">Buscar</span>
              </button>
            )}
          </div>

          {/* User */}
          <Link aria-label="Mi Cuenta" href="/account/orders" className="group flex flex-col items-center gap-1 text-gray-900 hover:text-brand-red hidden sm:flex pt-1">
            <User size={20} className="transition-transform group-hover:-translate-y-0.5" />
            <span className="text-[10px] font-bold hidden md:block transition-colors">Mi Cuenta</span>
          </Link>

          {/* Cart */}
          <button
            aria-label="Carrito de compra"
            onClick={() => toggleCart()}
            className="group flex flex-col items-center gap-1 text-gray-900 hover:text-brand-red relative pt-1"
          >
            <div className="relative">
              <ShoppingCart size={20} className="transition-transform group-hover:-translate-y-0.5" />
              {itemCount > 0 && (
                <span className="absolute -top-1.5 -right-2 bg-brand-red text-white text-[9px] font-bold w-[16px] h-[16px] rounded-full flex items-center justify-center shadow-sm">
                  {itemCount > 9 ? "9+" : itemCount}
                </span>
              )}
            </div>
            <span className="text-[10px] font-bold hidden md:block transition-colors">Carrito</span>
          </button>

          {/* Mobile menu toggle */}
          <button
            aria-label="Abrir menú"
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden text-gray-900 hover:text-brand-red pt-1"
          >
            {mobileOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Nav */}
      {mobileOpen && (
        <div className="md:hidden border-t border-surface-200 bg-white animate-fade-in">
          <div className="px-4 py-3 space-y-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className="block py-2.5 text-sm font-semibold text-gray-700 hover:text-brand-red font-body"
              >
                {link.label}
              </Link>
            ))}
            <Link
              href="/account/orders"
              onClick={() => setMobileOpen(false)}
              className="block py-2.5 text-sm font-medium text-gray-600 hover:text-brand-red"
            >
              Mi cuenta
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
