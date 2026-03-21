"use client";

import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
    Package, User, LogOut, FileText, RefreshCw, Mail, Phone, Building, Briefcase, ChevronRight, Eye, Truck
} from "lucide-react";
import { useEffect, useState } from "react";

export default function AccountProfilePage() {
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
                        { href: "/account/proofs", icon: Eye, label: "Mis bocetos", badge: stats?.proofsToReview },
                        { href: "/account/shipping", icon: Truck, label: "Mis envíos" },
                        { href: "/account/quotes", icon: FileText, label: "Presupuestos", badge: stats?.activeQuotes },
                        { href: "/account/profile", icon: User, label: "Mi perfil" },
                    ].map(item => (
                        <Link key={item.href} href={item.href} className={`flex items-center justify-between px-4 py-2.5 rounded-xl hover:bg-surface-50 transition-colors ${item.href === "/account/profile" ? "bg-surface-50 text-brand-red font-bold" : "text-sm font-medium text-gray-600"}`}>
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
                    <div className="bg-white border border-surface-200 rounded-2xl p-6 sm:p-10">
                        <h1 className="font-display font-extrabold text-2xl mb-2">Información de la Cuenta</h1>
                        <p className="text-gray-500 text-sm mb-8">Estos son los datos vinculados a tu cuenta de cliente en Universo Merchan.</p>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                            <div className="bg-surface-50 rounded-xl p-5 border border-surface-100">
                                <div className="text-gray-400 mb-1 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider"><User size={14} /> Nombre completo</div>
                                <div className="font-medium">{user?.firstName} {user?.lastName}</div>
                            </div>

                            <div className="bg-surface-50 rounded-xl p-5 border border-surface-100">
                                <div className="text-gray-400 mb-1 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider"><Mail size={14} /> Correo electrónico</div>
                                <div className="font-medium">{user?.email}</div>
                            </div>

                            <div className="bg-surface-50 rounded-xl p-5 border border-surface-100">
                                <div className="text-gray-400 mb-1 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider"><Phone size={14} /> Teléfono</div>
                                <div className="font-medium">{(user as any)?.phone || <span className="text-gray-400 italic">No especificado</span>}</div>
                            </div>

                            <div className="bg-surface-50 rounded-xl p-5 border border-surface-100">
                                <div className="text-gray-400 mb-1 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider"><Building size={14} /> Empresa</div>
                                <div className="font-medium">{user?.companyName || <span className="text-gray-400 italic">No aplicable</span>}</div>
                            </div>

                            <div className="bg-surface-50 rounded-xl p-5 border border-surface-100 sm:col-span-2">
                                <div className="text-gray-400 mb-1 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider"><Briefcase size={14} /> CIF / VAT Id</div>
                                <div className="font-medium">{(user as any)?.cif || <span className="text-gray-400 italic">No especificado</span>}</div>
                            </div>
                        </div>

                        <div className="mt-8 pt-8 border-t border-surface-200 flex flex-col sm:flex-row justify-between items-center gap-4">
                            <p className="text-xs text-gray-400 flex-1 text-center sm:text-left">
                                Para modificar tus datos fiscales o de facturación, por favor contacta con nuestro equipo de atención al cliente.
                            </p>
                            <Link href="/catalog" className="bg-surface-100 text-gray-700 hover:bg-surface-200 px-5 py-2 rounded-full font-semibold text-sm transition-colors flex items-center gap-2">
                                Ir al Catálogo <ChevronRight size={14} />
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
