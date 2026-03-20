"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft, Package, CheckCircle, Truck, Eye, X, ExternalLink,
  Gift, RefreshCw, Clock, AlertTriangle, FileText, ShoppingCart,
  ThumbsUp, ThumbsDown, MessageSquare,
} from "lucide-react";

interface OrderDetail {
  id: number; orderNumber: string; status: string; statusLabel: string; statusColor: string;
  orderType: string; totalPrice: number; createdAt: string; paidAt: string | null;
  shippedAt: string | null; trackingNumber: string | null; trackingUrl: string | null;
  forwarder: string | null; expressShipping: boolean;
  lines: Array<{
    id: number; lineNumber: number; productName: string; masterCode: string; color: string;
    size: string | null; quantity: number; unitPrice: number; lineTotal: number;
    productImage: string | null; hasCustomization: boolean; customizationSummary: string | null;
    proofStatus: string; proofStatusLabel: string; proofStatusColor: string;
    proofUrl: string | null; proofRejectionReason: string | null;
  }>;
}

interface TimelineEvent {
  timestamp: string; title: string; description: string; type: string; icon: string;
}

export default function OrderDetailPage() {
  const { token, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const orderNumber = params.number as string;

  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [timeline, setTimeline] = useState<TimelineEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [proofAction, setProofAction] = useState<{ lineId: number; action: "approve" | "reject" } | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [actionMessage, setActionMessage] = useState("");

  useEffect(() => {
    if (!isLoading && !isAuthenticated) { router.push("/auth/login"); return; }
    if (!token || !orderNumber) return;

    fetch(`/api/account/orders/${orderNumber}`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(data => {
        setOrder(data.order);
        setTimeline(data.timeline || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [token, orderNumber, isAuthenticated, isLoading, router]);

  const handleProofAction = async (lineId: number, action: "approve" | "reject") => {
    if (action === "reject" && rejectReason.trim().length < 5) {
      setActionMessage("Por favor, indica el motivo del rechazo (mínimo 5 caracteres)");
      return;
    }
    setActionLoading(true);
    try {
      const res = await fetch("/api/account/orders/proof", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ orderId: order!.id, lineId, action, reason: rejectReason }),
      });
      const data = await res.json();
      setActionMessage(data.message || data.error);
      if (data.success) {
        setProofAction(null);
        // Refresh order data
        const updated = await fetch(`/api/account/orders/${orderNumber}`, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json());
        setOrder(updated.order);
        setTimeline(updated.timeline || []);
      }
    } catch { setActionMessage("Error de conexión"); }
    setActionLoading(false);
  };

  if (loading) return <div className="flex items-center justify-center min-h-[60vh]"><RefreshCw className="animate-spin text-gray-300" /></div>;
  if (!order) return <div className="text-center py-20"><p className="text-gray-400">Pedido no encontrado</p></div>;

  const IconForEvent = ({ icon }: { icon: string }) => {
    const map: Record<string, any> = { cart: ShoppingCart, check: CheckCircle, eye: Eye, truck: Truck, x: X, clock: Clock };
    const Icon = map[icon] || Clock;
    return <Icon size={14} />;
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
      {/* Back */}
      <Link href="/account/orders" className="flex items-center gap-2 text-sm text-gray-400 hover:text-gray-600 mb-6 transition-colors">
        <ArrowLeft size={16} /> Volver a mis pedidos
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="font-display font-extrabold text-2xl flex items-center gap-3">
            {order.orderNumber}
            <span className="text-sm font-semibold px-3 py-1 rounded-full" style={{ backgroundColor: order.statusColor + "20", color: order.statusColor }}>
              {order.statusLabel}
            </span>
          </h1>
          <p className="text-sm text-gray-400 mt-1">
            {new Date(order.createdAt).toLocaleDateString("es-ES", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" })}
          </p>
        </div>
        <p className="font-display font-extrabold text-2xl">{order.totalPrice.toFixed(2)}€</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
        {/* Main content */}
        <div className="space-y-5">

          {/* Tracking banner */}
          {order.trackingNumber && (
            <div className="bg-green-50 border border-green-200 rounded-2xl p-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Truck size={20} className="text-green-600" />
                <div>
                  <p className="font-semibold text-sm text-green-800">Pedido enviado con {order.forwarder}</p>
                  <p className="text-xs text-green-600">Tracking: {order.trackingNumber}</p>
                </div>
              </div>
              {order.trackingUrl && (
                <a href={order.trackingUrl} target="_blank" rel="noopener noreferrer" className="bg-green-600 text-white px-4 py-2 rounded-full text-sm font-semibold flex items-center gap-1.5 hover:bg-green-700 transition-colors">
                  Seguir envío <ExternalLink size={14} />
                </a>
              )}
            </div>
          )}

          {/* Order lines */}
          <div className="bg-white rounded-2xl border border-surface-200 overflow-hidden">
            <div className="px-5 py-4 border-b border-surface-200">
              <h2 className="font-display font-bold text-base">Productos ({order.lines.length})</h2>
            </div>

            {order.lines.map(line => (
              <div key={line.id} className="p-5 border-b border-surface-100 last:border-0">
                <div className="flex gap-4">
                  <div className="w-16 h-16 rounded-xl bg-surface-50 flex items-center justify-center overflow-hidden flex-shrink-0">
                    {line.productImage ? <img src={line.productImage} alt="" className="w-[80%] h-[80%] object-contain" /> : <Gift size={20} className="text-gray-300" />}
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between">
                      <div>
                        <p className="font-semibold text-sm">{line.productName}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{line.color}{line.size ? ` · ${line.size}` : ""} · {line.quantity} uds</p>
                        {line.customizationSummary && <p className="text-xs text-purple-600 mt-1 bg-purple-50 inline-block px-2 py-0.5 rounded">{line.customizationSummary}</p>}
                      </div>
                      <p className="font-bold text-sm">{line.lineTotal.toFixed(2)}€</p>
                    </div>

                    {/* Proof status */}
                    {line.hasCustomization && line.proofStatus !== "not_applicable" && (
                      <div className="mt-3 p-3 bg-surface-50 rounded-xl">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ backgroundColor: line.proofStatusColor + "20", color: line.proofStatusColor }}>
                            {line.proofStatusLabel}
                          </span>

                          {line.proofStatus === "waiting_approval" && (
                            <div className="flex gap-2">
                              {line.proofUrl && (
                                <a href={line.proofUrl} target="_blank" rel="noopener noreferrer" className="text-xs font-semibold text-blue-600 flex items-center gap-1 hover:underline">
                                  <Eye size={12} /> Ver boceto
                                </a>
                              )}
                              <button onClick={() => { setProofAction({ lineId: line.id, action: "approve" }); setActionMessage(""); }} className="bg-green-500 text-white text-xs font-semibold px-3 py-1 rounded-full flex items-center gap-1 hover:bg-green-600">
                                <ThumbsUp size={11} /> Aprobar
                              </button>
                              <button onClick={() => { setProofAction({ lineId: line.id, action: "reject" }); setActionMessage(""); setRejectReason(""); }} className="bg-red-500 text-white text-xs font-semibold px-3 py-1 rounded-full flex items-center gap-1 hover:bg-red-600">
                                <ThumbsDown size={11} /> Rechazar
                              </button>
                            </div>
                          )}
                        </div>

                        {line.proofRejectionReason && (
                          <p className="text-xs text-red-600 mt-2 flex items-start gap-1">
                            <MessageSquare size={11} className="mt-0.5 flex-shrink-0" />
                            Motivo rechazo: {line.proofRejectionReason}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Proof action modal */}
          {proofAction && (
            <div className="bg-white rounded-2xl border-2 border-brand-red p-5 animate-slide-up">
              <h3 className="font-display font-bold text-base mb-3">
                {proofAction.action === "approve" ? "¿Confirmas que apruebas el boceto?" : "¿Por qué rechazas el boceto?"}
              </h3>

              {proofAction.action === "reject" && (
                <textarea
                  value={rejectReason}
                  onChange={e => setRejectReason(e.target.value)}
                  placeholder="Describe qué cambios necesitas (tamaño, posición, color...)"
                  className="w-full p-3 border-2 border-surface-200 rounded-xl text-sm mb-3 min-h-[80px] resize-none"
                />
              )}

              {actionMessage && (
                <p className={`text-sm mb-3 px-3 py-2 rounded-lg ${actionMessage.includes("Error") || actionMessage.includes("motivo") ? "bg-red-50 text-red-600" : "bg-green-50 text-green-600"}`}>
                  {actionMessage}
                </p>
              )}

              <div className="flex gap-3">
                <button onClick={() => setProofAction(null)} className="px-5 py-2 rounded-full border-2 border-surface-200 text-sm font-medium">Cancelar</button>
                <button
                  onClick={() => handleProofAction(proofAction.lineId, proofAction.action)}
                  disabled={actionLoading}
                  className={`px-6 py-2 rounded-full text-sm font-semibold text-white flex items-center gap-2 ${proofAction.action === "approve" ? "bg-green-500 hover:bg-green-600" : "bg-red-500 hover:bg-red-600"} disabled:opacity-50`}
                >
                  {actionLoading ? "Procesando..." : proofAction.action === "approve" ? <>Confirmar aprobación <ThumbsUp size={14} /></> : <>Confirmar rechazo <ThumbsDown size={14} /></>}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar - Timeline */}
        <div>
          <div className="bg-white rounded-2xl border border-surface-200 p-5 sticky top-20">
            <h3 className="font-display font-bold text-sm mb-4">Historial del pedido</h3>
            <div className="space-y-4">
              {timeline.map((event, i) => (
                <div key={i} className="flex gap-3">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${
                    event.type === "success" ? "bg-green-100 text-green-600" :
                    event.type === "warning" ? "bg-amber-100 text-amber-600" :
                    event.type === "error" ? "bg-red-100 text-red-600" :
                    "bg-surface-100 text-gray-400"
                  }`}>
                    <IconForEvent icon={event.icon} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold">{event.title}</p>
                    <p className="text-xs text-gray-400 leading-relaxed">{event.description}</p>
                    <p className="text-[10px] text-gray-300 mt-0.5">
                      {new Date(event.timestamp).toLocaleDateString("es-ES", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Reorder button */}
            {(order.status === "completed" || order.status === "shipped") && (
              <button className="w-full mt-5 py-2.5 rounded-full border-2 border-surface-200 text-sm font-medium flex items-center justify-center gap-2 text-gray-500 hover:border-brand-red hover:text-brand-red transition-colors">
                <RefreshCw size={14} /> Repetir este pedido
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
