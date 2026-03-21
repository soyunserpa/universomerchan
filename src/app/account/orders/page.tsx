"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Package, Clock, CheckCircle, Truck, AlertTriangle, Eye, Gift,
  ShoppingCart, FileText, User, LogOut, ChevronRight, RefreshCw, Trash2,
} from "lucide-react";

interface Order {
  id: number; orderNumber: string; status: string; statusLabel: string; statusColor: string;
  orderType: string; totalPrice: number; createdAt: string; hasProofPending: boolean;
  itemCount: number; trackingNumber: string | null; forwarder: string | null;
  lines: Array<{ productName: string; quantity: number; color: string; proofStatus: string; productImage: string | null }>;
}

interface Stats {
  totalOrders: number; totalSpent: number; pendingOrders: number; proofsToReview: number; activeQuotes: number;
}

export default function AccountOrdersPage() {
  const { user, token, isAuthenticated, isLoading, logout } = useAuth();
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [deleteLoading, setDeleteLoading] = useState<string | null>(null);

  const handleDeleteOrder = async (orderNumber: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Evitar que se abra la vista de detalle
    if (!window.confirm("¿Seguro que quieres eliminar este pedido? Esta acción no se puede deshacer.")) return;

    setDeleteLoading(orderNumber);
    try {
      const res = await fetch(`/api/account/orders/${orderNumber}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setOrders(prev => prev.filter(o => o.orderNumber !== orderNumber));
        // Opcional: Recargar estadisticas (stats)
        const statsRes = await fetch("/api/account/stats", { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json());
        setStats(statsRes);
      } else {
        alert(data.error || "No se ha podido eliminar el pedido.");
      }
    } catch {
      alert("Error de conexión al eliminar.");
    }
    setDeleteLoading(null);
  };

  useEffect(() => {
    if (!isLoading && !isAuthenticated) { router.push("/auth/login"); return; }
    if (!token) return;

    const headers = { Authorization: `Bearer ${token}` };
    Promise.all([
      fetch(`/api/account/orders?status=${filter}`, { headers }).then(r => r.json()),
      fetch("/api/account/stats", { headers }).then(r => r.json()),
    ]).then(([ordersData, statsData]) => {
      setOrders(ordersData.orders || []);
      setStats(statsData);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [token, isAuthenticated, isLoading, filter, router]);

  if (isLoading || (!isAuthenticated && !isLoading)) return <div className="flex items-center justify-center min-h-[60vh]"><RefreshCw className="animate-spin text-gray-300" /></div>;

  const statusFilters = [
    { value: "all", label: "Todos" },
    { value: "paid", label: "Pagados" },
    { value: "proof_pending", label: "Boceto pendiente" },
    { value: "shipped", label: "Enviados" },
    { value: "completed", label: "Completados" },
  ];

  const StatusIcon = ({ status }: { status: string }) => {
    switch (status) {
      case "paid": case "submitted": return <Package size={14} className="text-blue-500" />;
      case "proof_pending": return <Eye size={14} className="text-amber-500" />;
      case "proof_approved": case "in_production": return <CheckCircle size={14} className="text-purple-500" />;
      case "shipped": return <Truck size={14} className="text-green-500" />;
      case "completed": return <CheckCircle size={14} className="text-gray-400" />;
      case "error": return <AlertTriangle size={14} className="text-red-500" />;
      default: return <Clock size={14} className="text-gray-400" />;
    }
  };

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
            <Link key={item.href} href={item.href} className="flex items-center justify-between px-4 py-2.5 rounded-xl hover:bg-surface-50 text-sm font-medium text-gray-600 transition-colors">
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
          {/* Stats cards */}
          {stats && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
              {[
                { label: "Total pedidos", value: stats.totalOrders, icon: Package },
                { label: "Total gastado", value: `${stats.totalSpent.toFixed(0)}€`, icon: ShoppingCart },
                { label: "Pedidos activos", value: stats.pendingOrders, icon: Truck },
                { label: "Bocetos pendientes", value: stats.proofsToReview, icon: Eye, highlight: stats.proofsToReview > 0 },
              ].map((s, i) => (
                <div key={i} className={`rounded-xl p-4 border ${s.highlight ? "bg-amber-50 border-amber-200" : "bg-white border-surface-200"}`}>
                  <s.icon size={16} className={s.highlight ? "text-amber-500 mb-2" : "text-gray-400 mb-2"} />
                  <p className="font-display font-extrabold text-xl">{s.value}</p>
                  <p className="text-xs text-gray-400">{s.label}</p>
                </div>
              ))}
            </div>
          )}

          {/* Filters */}
          <div className="flex gap-2 mb-5 flex-wrap">
            {statusFilters.map(f => (
              <button key={f.value} onClick={() => setFilter(f.value)} className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${filter === f.value ? "bg-brand-red text-white" : "bg-surface-100 text-gray-500 hover:bg-surface-200"}`}>
                {f.label}
              </button>
            ))}
          </div>

          {/* Orders list */}
          {loading ? (
            <div className="text-center py-12"><RefreshCw className="animate-spin text-gray-300 mx-auto" /></div>
          ) : orders.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-2xl border border-surface-200">
              <Package size={40} className="text-gray-200 mx-auto mb-3" />
              <p className="text-gray-400 mb-1">No tienes pedidos {filter !== "all" ? "con este estado" : "todavía"}</p>
              <Link href="/catalog" className="text-brand-red text-sm font-semibold hover:underline">Explorar catálogo</Link>
            </div>
          ) : (
            <div className="space-y-3">
              {orders.map(order => (
                <div
                  key={order.orderNumber}
                  onClick={() => router.push(`/account/orders/${order.orderNumber}`)}
                  className="block bg-white rounded-2xl border border-surface-200 p-5 hover-lift cursor-pointer relative group"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-display font-bold text-brand-red">{order.orderNumber}</span>
                        <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ backgroundColor: order.statusColor + "20", color: order.statusColor }}>
                          {order.statusLabel}
                        </span>
                        {order.hasProofPending && (
                          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 animate-pulse">
                            Boceto pendiente
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-400">
                        {new Date(order.createdAt).toLocaleDateString("es-ES", { day: "numeric", month: "long", year: "numeric" })}
                        {" · "}{order.itemCount} producto{order.itemCount > 1 ? "s" : ""}
                      </p>
                    </div>
                    <div className="text-right flex flex-col items-end gap-2">
                      <p className="font-display font-extrabold text-lg">{order.totalPrice.toFixed(2)}€</p>
                      {order.trackingNumber && (
                        <p className="text-xs text-green-600 flex items-center gap-1 justify-end"><Truck size={12} /> {order.forwarder}</p>
                      )}

                      {/* Botón de eliminar para pedidos no pagados */}
                      {(order.status === "draft" || order.status === "pending_payment") && (
                        <button
                          onClick={(e) => handleDeleteOrder(order.orderNumber, e)}
                          disabled={deleteLoading === order.orderNumber}
                          className="bg-red-50 text-red-600 hover:bg-red-100 p-1.5 rounded-lg transition-colors border border-red-100 opacity-0 group-hover:opacity-100 sm:opacity-100 disabled:opacity-50 flex items-center gap-1"
                          title="Eliminar pedido no pagado"
                        >
                          {deleteLoading === order.orderNumber ? <RefreshCw size={14} className="animate-spin" /> : <Trash2 size={14} />}
                          <span className="text-xs font-medium pr-1 hidden sm:inline">Eliminar</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Product thumbnails */}
                  <div className="flex gap-2">
                    {order.lines.slice(0, 4).map((line, i) => (
                      <div key={i} className="w-12 h-12 rounded-lg bg-surface-50 flex items-center justify-center overflow-hidden border border-surface-200">
                        {line.productImage ? <img src={line.productImage} alt="" className="w-[80%] h-[80%] object-contain" /> : <Gift size={14} className="text-gray-300" />}
                      </div>
                    ))}
                    {order.lines.length > 4 && <div className="w-12 h-12 rounded-lg bg-surface-100 flex items-center justify-center text-xs text-gray-400 font-semibold">+{order.lines.length - 4}</div>}
                    <div className="flex-1 flex items-center justify-end"><ChevronRight size={16} className="text-gray-300" /></div>
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
