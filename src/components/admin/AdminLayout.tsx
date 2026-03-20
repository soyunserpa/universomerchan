"use client";

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import {
  Gift, BarChart3, Package, ShoppingCart, Users, Settings, RefreshCw,
  AlertTriangle, LogOut, Eye, Database, ChevronRight, Percent, Menu, X,
} from "lucide-react";

// ── Admin Auth Context ──────────────────────────────────────

interface AdminUser { id: number; email: string; firstName: string; lastName: string }

interface AdminAuthValue {
  user: AdminUser | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  authHeaders: () => Record<string, string>;
}

const AdminAuthCtx = createContext<AdminAuthValue | null>(null);
export function useAdminAuth() {
  const ctx = useContext(AdminAuthCtx);
  if (!ctx) throw new Error("useAdminAuth outside provider");
  return ctx;
}

// ── Admin Auth Provider ─────────────────────────────────────

const ADMIN_TOKEN_KEY = "um_admin_token";
const ADMIN_USER_KEY = "um_admin_user";

export function AdminAuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AdminUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    try {
      const t = localStorage.getItem(ADMIN_TOKEN_KEY);
      const u = localStorage.getItem(ADMIN_USER_KEY);
      if (t && u) { setToken(t); setUser(JSON.parse(u)); }
    } catch {}
    setIsLoading(false);
  }, []);

  useEffect(() => {
    if (token && user) {
      localStorage.setItem(ADMIN_TOKEN_KEY, token);
      localStorage.setItem(ADMIN_USER_KEY, JSON.stringify(user));
    }
  }, [token, user]);

  const login = useCallback(async (email: string, password: string) => {
    try {
      const res = await fetch("/api/admin/auth/login", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!data.success) return { success: false, error: data.error };
      setToken(data.token); setUser(data.user);
      return { success: true };
    } catch { return { success: false, error: "Error de conexión" }; }
  }, []);

  const logout = useCallback(() => {
    setToken(null); setUser(null);
    localStorage.removeItem(ADMIN_TOKEN_KEY);
    localStorage.removeItem(ADMIN_USER_KEY);
  }, []);

  const authHeaders = useCallback(() => ({ Authorization: `Bearer ${token}` }), [token]);

  return (
    <AdminAuthCtx.Provider value={{ user, token, isAuthenticated: !!user, isLoading, login, logout, authHeaders }}>
      {children}
    </AdminAuthCtx.Provider>
  );
}

// ── Admin Shell (sidebar + header + content) ────────────────

export function AdminShell({ children }: { children: ReactNode }) {
  const { user, isAuthenticated, isLoading, logout } = useAdminAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (!isLoading && !isAuthenticated && pathname !== "/admin/login") {
      router.push("/admin/login");
    }
  }, [isLoading, isAuthenticated, pathname, router]);

  if (pathname === "/admin/login") return <>{children}</>;
  if (isLoading) return <div className="min-h-screen bg-gray-950 flex items-center justify-center"><RefreshCw className="animate-spin text-gray-600" /></div>;
  if (!isAuthenticated) return null;

  const navItems = [
    { href: "/admin/dashboard", icon: BarChart3, label: "Dashboard" },
    { href: "/admin/orders", icon: ShoppingCart, label: "Pedidos" },
    { href: "/admin/products", icon: Package, label: "Productos" },
    { href: "/admin/clients", icon: Users, label: "Clientes" },
    { href: "/admin/settings", icon: Percent, label: "Márgenes" },
    { href: "/admin/sync", icon: Database, label: "Sincronización" },
    { href: "/admin/errors", icon: AlertTriangle, label: "Errores" },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className={`fixed lg:static inset-y-0 left-0 z-50 w-60 bg-gray-950 flex flex-col transition-transform lg:translate-x-0 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="px-5 py-4 flex items-center gap-2.5 border-b border-gray-800">
          <Gift size={20} className="text-brand-red" />
          <span className="font-display font-extrabold text-sm text-white">Universo Merchan</span>
          <span className="bg-brand-red text-white text-[9px] font-bold px-1.5 py-0.5 rounded ml-auto">ADMIN</span>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          {navItems.map(item => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setSidebarOpen(false)}
              className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                pathname.startsWith(item.href)
                  ? "bg-brand-red text-white"
                  : "text-gray-400 hover:text-white hover:bg-gray-800"
              }`}
            >
              <item.icon size={16} /> {item.label}
            </Link>
          ))}
        </nav>

        <div className="px-3 py-4 border-t border-gray-800">
          <a href="/" target="_blank" className="flex items-center gap-2 px-3 py-2 text-xs text-gray-500 hover:text-gray-300 transition-colors">
            <Eye size={14} /> Ver tienda
          </a>
          <button onClick={() => { logout(); router.push("/admin/login"); }} className="flex items-center gap-2 px-3 py-2 text-xs text-gray-500 hover:text-red-400 transition-colors w-full">
            <LogOut size={14} /> Cerrar sesión
          </button>
        </div>
      </aside>

      {/* Mobile sidebar backdrop */}
      {sidebarOpen && <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />}

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="bg-white border-b border-surface-200 px-4 sm:px-6 h-14 flex items-center justify-between sticky top-0 z-30">
          <button onClick={() => setSidebarOpen(true)} className="lg:hidden text-gray-400 p-1">
            <Menu size={20} />
          </button>
          <div className="hidden lg:block" />
          <div className="flex items-center gap-3">
            <span className="text-xs text-gray-400">{user?.email}</span>
            <div className="w-7 h-7 rounded-full bg-brand-red flex items-center justify-center text-white text-xs font-bold">
              {user?.firstName?.[0]}
            </div>
          </div>
        </header>
        <main className="flex-1 p-4 sm:p-6 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
