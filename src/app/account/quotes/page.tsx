"use client";

import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
    Package, User, LogOut, FileText, RefreshCw, FileQuestion
} from "lucide-react";
import { useEffect, useState } from "react";

export default function AccountQuotesPage() {
    const { user, token, isAuthenticated, isLoading, logout } = useAuth();
    const router = useRouter();
    const [stats, setStats] = useState<any>(null);

    useEffect(() => {
        if (!isLoading && !isAuthenticated) { router.push("/auth/login"); return; }
        if (!token) return;

        fetch("/api/account/stats", { headers: { Authorization: `Bearer ${token}` } })
            .then(r => r.json())
            .then(data => setStats(data))
            .catch(() => { });
    }, [token, isAuthenticated, isLoading, router]);

    if (isLoading || (!isAuthenticated && !isLoading)) return <div className="flex items-center justify-center min-h-[60vh]"><RefreshCw className="animate-spin text-gray-300" /></div>;

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
            <div className="grid grid-cols-1 lg:grid-cols-[240px_1fr] gap-8">

                {/* Sidebar */}
                <aside className="space-y-2">
                    <div className="bg-white rounded-2xl border border-surface-200 p-5 mb-4">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="w-10 h-10 rounded-full bg-brand-red flex items-center justify-center text-white font-bold text-sm">
                                {user?.firstName?.[0]}{user?.lastName?.[0]}
                            </div>
                            <div>
                                <p className="font-semibold text-sm">{user?.firstName} {user?.lastName}</p>
                                <p className="text-xs text-gray-400">{user?.email}</p>
                            </div>
                        </div>
                        {user?.companyName && <p className="text-xs text-gray-400 bg-surface-50 px-2 py-1 rounded">{user.companyName}</p>}
                    </div>

                    {[
                        { href: "/account/orders", icon: Package, label: "Mis pedidos", badge: stats?.pendingOrders },
                        { href: "/account/quotes", icon: FileText, label: "Presupuestos", badge: stats?.activeQuotes },
                        { href: "/account/profile", icon: User, label: "Mi perfil" },
                    ].map(item => (
                        <Link key={item.href} href={item.href} className={`flex items-center justify-between px-4 py-2.5 rounded-xl hover:bg-surface-50 transition-colors ${item.href === "/account/quotes" ? "bg-surface-50 text-brand-red font-bold" : "text-sm font-medium text-gray-600"}`}>
                            <div className="flex items-center gap-2.5"><item.icon size={16} /> {item.label}</div>
                            {item.badge ? <span className="bg-brand-red text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">{item.badge}</span> : null}
                        </Link>
                    ))}
                    <button onClick={() => { logout(); router.push("/"); }} className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-sm font-medium text-gray-400 hover:text-red-500 transition-colors w-full mt-4">
                        <LogOut size={16} /> Cerrar sesión
                    </button>
                </aside>

                {/* Main Content */}
                <div className="space-y-6">
                    <div className="flex items-center justify-between mb-4">
                        <h1 className="font-display font-extrabold text-2xl">Mis Presupuestos</h1>
                    </div>

                    <div className="text-center py-20 bg-white rounded-2xl border border-surface-200">
                        <FileQuestion size={40} className="text-gray-200 mx-auto mb-4" />
                        <h3 className="font-display font-bold text-lg mb-1">Aún no tienes presupuestos activos</h3>
                        <p className="text-gray-400 mb-6 max-w-sm mx-auto text-sm">Los presupuestos solicitados a medida aparecerán aquí para que puedas convertirlos en pedido comercial.</p>
                        <Link href="/catalog" className="bg-brand-red text-white hover:bg-brand-red-dark px-6 py-2.5 rounded-full font-semibold text-sm transition-colors inline-block">
                            Generar un Nuevo Presupuesto
                        </Link>
                    </div>
                </div>

            </div>
        </div>
    );
}
