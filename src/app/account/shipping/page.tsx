"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
    Package, CheckCircle, Truck, Eye, Gift,
    FileText, User, LogOut, ChevronRight, RefreshCw, MapPin
} from "lucide-react";

interface Order {
    id: number; orderNumber: string; status: string; statusLabel: string; statusColor: string;
    orderType: string; totalPrice: number; createdAt: string; hasProofPending: boolean;
    itemCount: number; trackingNumber: string | null; forwarder: string | null; trackingUrl: string | null;
    lines: Array<{ productName: string; quantity: number; color: string; proofStatus: string; productImage: string | null }>;
}

interface Stats {
    totalOrders: number; totalSpent: number; pendingOrders: number; proofsToReview: number; activeQuotes: number;
}

export default function AccountShippingPage() {
    const { user, token, isAuthenticated, isLoading, logout } = useAuth();
    const router = useRouter();
    const [orders, setOrders] = useState<Order[]>([]);
    const [stats, setStats] = useState<Stats | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!isLoading && !isAuthenticated) { router.push("/auth/login"); return; }
        if (!token) return;

        const headers = { Authorization: `Bearer ${token}` };
        Promise.all([
            fetch(`/api/account/orders?status=in_production,shipped,completed`, { headers }).then(r => r.json()),
            fetch("/api/account/stats", { headers }).then(r => r.json()),
        ]).then(([ordersData, statsData]) => {
            if (ordersData.error || statsData.error) {
                logout();
                return;
            }
            setOrders(ordersData.orders || []);
            setStats(statsData);
            setLoading(false);
        }).catch(() => setLoading(false));
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
                        <Link key={item.href} href={item.href} className={`flex items-center justify-between px-4 py-2.5 rounded-xl hover:bg-surface-50 text-sm font-medium transition-colors ${item.label === "Mis envíos" ? "bg-surface-100 text-brand-red font-bold" : "text-gray-600"}`}>
                            <div className="flex items-center gap-2.5"><item.icon size={16} /> {item.label}</div>
                            {item.badge ? <span className="bg-brand-red text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">{item.badge}</span> : null}
                        </Link>
                    ))}
                    <button onClick={() => { logout(); router.push("/"); }} className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-sm font-medium text-gray-400 hover:text-red-500 transition-colors w-full">
                        <LogOut size={16} /> Cerrar sesión
                    </button>
                </aside>

                {/* Main */}
                <div>
                    <div className="mb-6">
                        <h1 className="text-2xl font-display font-bold text-gray-900 flex items-center gap-2">
                            <Truck className="text-brand-red" />
                            Seguimiento de Envíos
                        </h1>
                        <p className="text-gray-500 text-sm mt-1">Busca tu pedido y rastrea su ubicación al instante.</p>
                    </div>

                    {/* Orders list */}
                    {loading ? (
                        <div className="text-center py-12"><RefreshCw className="animate-spin text-gray-300 mx-auto" /></div>
                    ) : orders.length === 0 ? (
                        <div className="text-center py-16 bg-white rounded-2xl border border-surface-200">
                            <MapPin size={40} className="text-gray-200 mx-auto mb-3" />
                            <p className="text-gray-400 mb-1">No tienes pedidos en tránsito o completados actualmente.</p>
                            <Link href="/catalog" className="text-brand-red text-sm font-semibold hover:underline">Explorar catálogo</Link>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {orders.map(order => (
                                <div
                                    key={order.orderNumber}
                                    className="bg-white rounded-2xl border border-surface-200 p-5 shadow-sm"
                                >
                                    <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-4 gap-4">
                                        <div>
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="font-display font-bold text-lg text-gray-900">{order.orderNumber}</span>
                                                <span className="text-xs font-semibold px-2.5 py-1 rounded-full" style={{ backgroundColor: order.statusColor + "20", color: order.statusColor }}>
                                                    {order.statusLabel}
                                                </span>
                                            </div>
                                            <p className="text-sm text-gray-500">
                                                {new Date(order.createdAt).toLocaleDateString("es-ES", { day: "numeric", month: "long", year: "numeric" })}
                                            </p>
                                        </div>

                                        <div className="flex-shrink-0 w-full md:w-auto bg-surface-50 p-4 rounded-xl border border-surface-200 flex flex-col gap-2">
                                            <div className="flex items-center gap-2 text-sm text-gray-700">
                                                <Truck size={16} className="text-gray-400" />
                                                <span className="font-semibold">Transportista:</span>
                                                {order.forwarder || "Operador Logístico"}
                                            </div>
                                            <div className="flex items-center gap-2 text-sm text-gray-700">
                                                <Package size={16} className="text-gray-400" />
                                                <span className="font-semibold">Nº Seguimiento:</span>
                                                <span className="font-mono text-xs bg-white px-2 py-0.5 rounded border border-surface-200">
                                                    {order.trackingNumber || "Pendiente de asignación"}
                                                </span>
                                            </div>
                                            {order.trackingUrl && (
                                                <a href={order.trackingUrl} target="_blank" rel="noopener noreferrer" className="mt-2 w-full text-center bg-brand-red text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-brand-red-dark transition-colors">
                                                    Rastrear Envío
                                                </a>
                                            )}
                                        </div>
                                    </div>

                                    {/* Product thumbnails */}
                                    <div className="flex gap-2 p-3 bg-surface-50 rounded-xl cursor-pointer hover:bg-surface-100 transition-colors" onClick={() => router.push(`/account/orders/${order.orderNumber}`)}>
                                        {order.lines.slice(0, 5).map((line, i) => (
                                            <div key={i} className="w-12 h-12 rounded-lg bg-white flex items-center justify-center overflow-hidden border border-surface-200">
                                                {line.productImage ? <img src={line.productImage} alt="" className="w-[80%] h-[80%] object-contain" /> : <Gift size={14} className="text-gray-300" />}
                                            </div>
                                        ))}
                                        {order.lines.length > 5 && <div className="w-12 h-12 rounded-lg bg-white flex items-center justify-center text-xs text-gray-400 font-semibold border border-surface-200">+{order.lines.length - 5}</div>}
                                        <div className="flex-1 flex items-center justify-end text-sm text-gray-500 font-medium">Ver detalles de pedido <ChevronRight size={16} className="ml-1" /></div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
