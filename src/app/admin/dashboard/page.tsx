"use client";

import { useState, useEffect } from "react";
import { useAdminAuth } from "@/components/admin/AdminLayout";
import Link from "next/link";
import {
  TrendingUp, Package, ShoppingCart, Users, Eye, AlertTriangle,
  ArrowUpRight, ArrowDownRight, RefreshCw, BarChart3, Zap,
} from "lucide-react";

interface KPIs {
  revenueThisMonth: number; revenueChangePercent: number;
  ordersThisMonth: number; ordersChangePercent: number;
  avgTicketThisMonth: number; avgTicketChangePercent: number;
  conversionRate: number; activeOrders: number;
  proofsAwaitingApproval: number; pendingErrors: number;
  lowStockAlerts: number; totalCustomers: number; newCustomersThisMonth: number;
}
interface ChartPoint { monthLabel: string; revenue: number; orders: number }
interface TopProduct { productName: string; totalRevenue: number; percentOfTotal: number; orderCount: number }

export default function AdminDashboardPage() {
  const { authHeaders } = useAdminAuth();
  const [kpis, setKpis] = useState<KPIs | null>(null);
  const [chart, setChart] = useState<ChartPoint[]>([]);
  const [topProducts, setTopProducts] = useState<TopProduct[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const h = authHeaders();
    Promise.all([
      fetch("/api/admin/dashboard/kpis", { headers: h }).then(r => r.json()),
      fetch("/api/admin/dashboard/chart?months=6", { headers: h }).then(r => r.json()),
      fetch("/api/admin/dashboard/top-products", { headers: h }).then(r => r.json()),
    ]).then(([k, c, t]) => {
      setKpis(k); setChart(c); setTopProducts(t);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [authHeaders]);

  if (loading) return <div className="flex items-center justify-center h-64"><RefreshCw className="animate-spin text-gray-300" /></div>;

  const maxRevenue = Math.max(...chart.map(c => c.revenue), 1);

  const Change = ({ value }: { value: number }) => (
    <span className={`inline-flex items-center gap-0.5 text-xs font-semibold px-1.5 py-0.5 rounded-full ${value >= 0 ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
      {value >= 0 ? <ArrowUpRight size={10} /> : <ArrowDownRight size={10} />}
      {value >= 0 ? "+" : ""}{value}%
    </span>
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display font-extrabold text-2xl">Dashboard</h1>
          <p className="text-xs text-gray-400">Panel de control · {new Date().toLocaleDateString("es-ES", { month: "long", year: "numeric" })}</p>
        </div>
      </div>

      {/* KPI cards */}
      {kpis && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
          {[
            { label: "Ventas este mes", value: `${kpis.revenueThisMonth.toFixed(0)}€`, change: kpis.revenueChangePercent, icon: TrendingUp },
            { label: "Pedidos", value: kpis.ordersThisMonth, change: kpis.ordersChangePercent, icon: ShoppingCart },
            { label: "Ticket medio", value: `${kpis.avgTicketThisMonth.toFixed(0)}€`, change: kpis.avgTicketChangePercent, icon: BarChart3 },
            { label: "Clientes nuevos", value: kpis.newCustomersThisMonth, change: 0, icon: Users },
          ].map((k, i) => (
            <div key={i} className="bg-white rounded-xl p-5 border border-surface-200">
              <div className="flex justify-between items-start mb-2">
                <span className="text-xs text-gray-400">{k.label}</span>
                <div className="w-8 h-8 rounded-lg bg-brand-red/10 flex items-center justify-center">
                  <k.icon size={15} className="text-brand-red" />
                </div>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="font-display font-extrabold text-2xl">{k.value}</span>
                {k.change !== 0 && <Change value={k.change} />}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Alerts */}
      {kpis && (kpis.proofsAwaitingApproval > 0 || kpis.pendingErrors > 0 || kpis.lowStockAlerts > 0) && (
        <div className="flex gap-3 mb-6 flex-wrap">
          {kpis.proofsAwaitingApproval > 0 && (
            <Link href="/admin/orders?status=proof_pending" className="flex items-center gap-2 bg-amber-50 border border-amber-200 text-amber-700 px-4 py-2 rounded-xl text-sm font-medium hover:bg-amber-100 transition-colors">
              <Eye size={14} /> {kpis.proofsAwaitingApproval} proof{kpis.proofsAwaitingApproval > 1 ? "s" : ""} pendiente{kpis.proofsAwaitingApproval > 1 ? "s" : ""}
            </Link>
          )}
          {kpis.pendingErrors > 0 && (
            <Link href="/admin/errors" className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded-xl text-sm font-medium hover:bg-red-100 transition-colors">
              <AlertTriangle size={14} /> {kpis.pendingErrors} error{kpis.pendingErrors > 1 ? "es" : ""} sin resolver
            </Link>
          )}
          {kpis.lowStockAlerts > 0 && (
            <Link href="/admin/errors" className="flex items-center gap-2 bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-2 rounded-xl text-sm font-medium hover:bg-yellow-100 transition-colors">
              <Zap size={14} /> {kpis.lowStockAlerts} alerta{kpis.lowStockAlerts > 1 ? "s" : ""} stock bajo
            </Link>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-4 mb-6">
        {/* Revenue chart */}
        <div className="bg-white rounded-xl border border-surface-200 p-5">
          <div className="flex justify-between items-center mb-5">
            <h2 className="font-display font-bold text-sm">Ventas últimos 6 meses</h2>
            <span className="text-xs text-gray-400">Actualizado hoy</span>
          </div>
          <div className="flex items-end gap-2 h-44">
            {chart.map((c, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1">
                <span className="text-[10px] text-gray-400">{c.revenue > 0 ? `${(c.revenue / 1000).toFixed(1)}k` : "0"}</span>
                <div
                  className="w-full rounded-md transition-all duration-500"
                  style={{
                    height: `${Math.max((c.revenue / maxRevenue) * 100, 4)}%`,
                    backgroundColor: i === chart.length - 1 ? "#DE0121" : "#E8E8E8",
                  }}
                />
                <span className="text-[10px] text-gray-500">{c.monthLabel}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Top products */}
        <div className="bg-white rounded-xl border border-surface-200 p-5">
          <h2 className="font-display font-bold text-sm mb-4">Top productos</h2>
          <div className="space-y-3">
            {topProducts.slice(0, 5).map((p, i) => (
              <div key={i}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="font-medium truncate mr-2">{p.productName}</span>
                  <span className="text-gray-400 flex-shrink-0">{p.percentOfTotal}%</span>
                </div>
                <div className="h-1.5 bg-surface-100 rounded-full">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${p.percentOfTotal}%`,
                      backgroundColor: i === 0 ? "#DE0121" : "#D1D1D1",
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
          <Link href="/admin/products" className="block text-xs text-brand-red font-semibold mt-4 hover:underline">
            Ver todos los productos →
          </Link>
        </div>
      </div>

      {/* Quick stats */}
      {kpis && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: "Pedidos activos", value: kpis.activeOrders, href: "/admin/orders" },
            { label: "Total clientes", value: kpis.totalCustomers, href: "/admin/clients" },
            { label: "Conversión", value: `${kpis.conversionRate}%`, href: "#" },
            { label: "Errores pendientes", value: kpis.pendingErrors, href: "/admin/errors" },
          ].map((s, i) => (
            <Link key={i} href={s.href} className="bg-white rounded-xl p-4 border border-surface-200 hover:border-brand-red/30 transition-colors">
              <p className="text-xs text-gray-400 mb-1">{s.label}</p>
              <p className="font-display font-extrabold text-xl">{s.value}</p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
