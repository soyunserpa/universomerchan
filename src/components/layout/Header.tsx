"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useCart } from "@/lib/cart-store";
import { Search, ShoppingCart, User, Gift, Menu, X } from "lucide-react";

export function Header() {
  const pathname = usePathname();
  const { itemCount, toggleCart } = useCart();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const navLinks = [
    { href: "/catalog", label: "Catálogo" },
    { href: "/#como-funciona", label: "Cómo funciona" },
    { href: "/#contacto", label: "Contacto" },
  ];

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
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
        <nav className="hidden md:flex items-center gap-7">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`text-sm font-medium transition-colors pb-0.5 border-b-2 ${
                pathname === link.href
                  ? "text-brand-red border-brand-red"
                  : "text-gray-400 border-transparent hover:text-gray-700"
              }`}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Right actions */}
        <div className="flex items-center gap-3">
          {/* Search */}
          {searchOpen ? (
            <form onSubmit={handleSearch} className="flex items-center gap-2 animate-fade-in">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar productos..."
                autoFocus
                className="w-48 px-3 py-1.5 text-sm border-2 border-surface-200 rounded-full font-body"
              />
              <button type="button" onClick={() => setSearchOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X size={18} />
              </button>
            </form>
          ) : (
            <button onClick={() => setSearchOpen(true)} className="text-gray-400 hover:text-gray-600 transition-colors p-1.5">
              <Search size={20} />
            </button>
          )}

          {/* Cart */}
          <button
            onClick={() => toggleCart()}
            className="relative text-gray-400 hover:text-gray-600 transition-colors p-1.5"
          >
            <ShoppingCart size={20} />
            {itemCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-brand-red text-white text-[10px] font-bold w-[18px] h-[18px] rounded-full flex items-center justify-center">
                {itemCount > 9 ? "9+" : itemCount}
              </span>
            )}
          </button>

          {/* User */}
          <Link href="/account/orders" className="text-gray-400 hover:text-gray-600 transition-colors p-1.5 hidden sm:block">
            <User size={20} />
          </Link>

          {/* Mobile menu toggle */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden text-gray-400 hover:text-gray-600 p-1.5"
          >
            {mobileOpen ? <X size={22} /> : <Menu size={22} />}
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
                className="block py-2.5 text-sm font-medium text-gray-600 hover:text-brand-red"
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
