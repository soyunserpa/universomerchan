"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
    Package, CheckCircle, Truck, Eye, Gift, ThumbsUp, ThumbsDown, MessageSquare,
    FileText, User, LogOut, ChevronRight, RefreshCw, Layers, Lock
} from "lucide-react";

interface ProofRecord {
    orderId: number;
    orderNumber: string;
    orderCreatedAt: string;
    orderStatus: string;
    lineId: number;
    lineNumber: number;
    productName: string;
    masterCode: string;
    color: string;
    quantity: number;
    proofStatus: string;
    proofUrl: string | null;
    artworkUrl: string | null;
    mockupUrl: string | null;
    proofRejectionReason: string | null;
    customizationSummary: string | null;
    techniqueNames: string[];
}

interface Stats {
    totalOrders: number; totalSpent: number; pendingOrders: number; proofsToReview: number; activeQuotes: number;
}

export default function AccountProofsPage() {
    const { user, token, isAuthenticated, isLoading, logout } = useAuth();
    const router = useRouter();
    const [proofs, setProofs] = useState<ProofRecord[]>([]);
    const [stats, setStats] = useState<Stats | null>(null);
    const [loading, setLoading] = useState(true);

    const [proofAction, setProofAction] = useState<{ lineId: number; action: "approve" | "reject" } | null>(null);
    const [rejectReason, setRejectReason] = useState("");
    const [actionLoading, setActionLoading] = useState(false);
    const [actionMessage, setActionMessage] = useState("");

    useEffect(() => {
        if (!isLoading && !isAuthenticated) { router.push("/auth/login"); return; }
        if (!token) return;

        fetchData();
    }, [token, isAuthenticated, isLoading, router]);

    const fetchData = () => {
        const headers = { Authorization: `Bearer ${token}` };
        Promise.all([
            fetch(`/api/account/proofs`, { headers }).then(r => r.json()),
            fetch("/api/account/stats", { headers }).then(r => r.json()),
        ]).then(([proofsData, statsData]) => {
            if (proofsData.error || statsData.error) {
                logout();
                return;
            }
            setProofs(proofsData.proofs || []);
            setStats(statsData);
            setLoading(false);
        }).catch(() => setLoading(false));
    };

    const handleProofAction = async (lineId: number, action: "approve" | "reject") => {
        if (action === "reject" && rejectReason.trim().length < 5) {
            setActionMessage("Error: Escribe un motivo de rechazo (mín. 5 caracteres).");
            return;
        }

        setActionLoading(true);
        setActionMessage("");

        try {
            const orderMatch = proofs.find(p => p.lineId === lineId);
            if (!orderMatch) throw new Error("Line not found");

            const res = await fetch("/api/account/orders/proof", {
                method: "POST",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                body: JSON.stringify({
                    orderId: orderMatch.orderId,
                    lineId,
                    action,
                    reason: action === "reject" ? rejectReason : undefined
                })
            });
            const data = await res.json();

            if (data.success) {
                setActionMessage(data.message);
                setProofAction(null);
                setRejectReason("");
                // Reload proofs
                fetchData();
            } else {
                setActionMessage(`Error: ${data.error}`);
            }
        } catch {
            setActionMessage("Error de conexión al procesar el boceto.");
        }
        setActionLoading(false);
    };

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
                        <Link key={item.href} href={item.href} className={`flex items-center justify-between px-4 py-2.5 rounded-xl hover:bg-surface-50 text-sm font-medium transition-colors ${item.label === "Mis bocetos" ? "bg-surface-100 text-brand-red font-bold" : "text-gray-600"}`}>
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
                            <Eye className="text-brand-red" />
                            Aprobación de Bocetos
                        </h1>
                        <p className="text-gray-500 text-sm mt-1">Revisa y aprueba los montajes digitales antes de enviar tu pedido a fabricación.</p>
                    </div>

                    {/* Proofs list */}
                    {loading ? (
                        <div className="text-center py-12"><RefreshCw className="animate-spin text-gray-300 mx-auto" /></div>
                    ) : proofs.length === 0 ? (
                        <div className="text-center py-16 bg-white rounded-2xl border border-surface-200">
                            <Layers size={40} className="text-gray-200 mx-auto mb-3" />
                            <p className="text-gray-400 mb-1">No tienes artículos personalizados en curso ni bocetos pendientes de revisión.</p>
                            <Link href="/catalog" className="text-brand-red text-sm font-semibold hover:underline">Explorar catálogo</Link>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {proofs.map(proof => (
                                <div
                                    key={proof.lineId}
                                    className="bg-white rounded-2xl border border-surface-200 p-5 shadow-sm"
                                >
                                    <div className="flex flex-col md:flex-row gap-4 items-start">
                                        <div className="w-24 h-24 rounded-xl bg-surface-50 flex items-center justify-center overflow-hidden flex-shrink-0 border border-surface-200">
                                            {proof.proofUrl ? <img src={proof.proofUrl} alt="Boceto" className="w-[90%] h-[90%] object-contain" /> : <Gift size={24} className="text-gray-300" />}
                                        </div>

                                        <div className="flex-1 w-full">
                                            <div className="flex flex-col md:flex-row justify-between md:items-start gap-2">
                                                <div>
                                                    <p className="font-display font-bold text-base text-gray-900">{proof.productName}</p>
                                                    <p className="text-xs text-gray-500 mt-0.5">Pedido <span className="text-brand-red font-bold cursor-pointer hover:underline" onClick={() => router.push(`/account/orders/${proof.orderNumber}`)} >{proof.orderNumber}</span> · {proof.quantity} unidades</p>
                                                    {proof.customizationSummary && <p className="text-[11px] text-purple-700 font-medium mt-1.5 bg-purple-50 inline-block px-2 py-0.5 rounded border border-purple-100">{proof.customizationSummary}</p>}
                                                </div>

                                                <div className="flex flex-col gap-2 items-start md:items-end">
                                                    {proof.proofStatus === "waiting_approval" && (
                                                        <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-amber-100 text-amber-700 animate-pulse flex items-center gap-1">
                                                            Requiere acción
                                                        </span>
                                                    )}
                                                    {proof.proofStatus === "approved" && <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-green-100 text-green-700">Aprobado</span>}
                                                    {proof.proofStatus === "rejected" && <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-red-100 text-red-700">Rechazado</span>}
                                                    {proof.proofStatus === "in_progress" && <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-blue-100 text-blue-700">En preparación</span>}
                                                    {proof.proofStatus === "artwork_required" && <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-orange-100 text-orange-700">Falta logo vectorial</span>}
                                                </div>
                                            </div>

                                            {proof.proofStatus === "waiting_approval" && (
                                                <div className="mt-4 pt-4 border-t border-surface-100 flex flex-wrap gap-2 items-center justify-between">
                                                    {proof.proofUrl && (
                                                        <a href={proof.proofUrl} target="_blank" rel="noopener noreferrer" className="text-sm font-semibold text-blue-600 flex items-center gap-1 hover:underline bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-100">
                                                            <Eye size={14} /> Inspeccionar boceto PDF
                                                        </a>
                                                    )}
                                                    {proof.orderStatus === "pending_transfer" ? (
                                                        <div className="w-full sm:w-auto bg-amber-50 border border-amber-200 text-amber-800 px-4 py-2 rounded-lg text-sm flex items-center gap-2">
                                                            <Lock size={16} className="text-amber-600 flex-shrink-0" />
                                                            <span>Esperando confirmación de la transferencia para habilitar aprobación.</span>
                                                        </div>
                                                    ) : (
                                                        <div className="flex gap-2 w-full sm:w-auto">
                                                            <button onClick={() => { setProofAction({ lineId: proof.lineId, action: "approve" }); setActionMessage(""); }} className="flex-1 sm:flex-none justify-center bg-green-500 text-white text-sm font-semibold px-4 py-2 rounded-lg flex items-center gap-1.5 hover:bg-green-600 shadow-sm transition-all">
                                                                <ThumbsUp size={14} /> Aprobar para producción
                                                            </button>
                                                            <button onClick={() => { setProofAction({ lineId: proof.lineId, action: "reject" }); setActionMessage(""); setRejectReason(""); }} className="flex-1 sm:flex-none justify-center bg-red-50 text-red-600 border border-red-200 text-sm font-semibold px-4 py-2 rounded-lg flex items-center gap-1.5 hover:bg-red-100 transition-all">
                                                                <ThumbsDown size={14} /> Rechazar
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                            )}

                                            {proof.proofRejectionReason && (
                                                <div className="mt-3 p-3 bg-red-50 border border-red-100 rounded-lg">
                                                    <p className="text-xs text-red-700 flex items-start gap-1.5">
                                                        <MessageSquare size={14} className="mt-0.5 flex-shrink-0" />
                                                        <strong>Motivo de rechazo o cambios requeridos:</strong> {proof.proofRejectionReason}
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Proof action modal */}
                                    {proofAction && proofAction.lineId === proof.lineId && (
                                        <div className="mt-4 bg-white rounded-2xl border-2 border-brand-red p-5 animate-slide-up shadow-sm">
                                            <h3 className="font-display font-bold text-base mb-3">
                                                {proofAction.action === "approve" ? "Confirmo que el diseño artístico es correcto y autorizo su pase a máquina" : "¿Qué ajustes necesitas que le hagamos al boceto?"}
                                            </h3>

                                            {proofAction.action === "reject" && (
                                                <textarea
                                                    value={rejectReason}
                                                    onChange={e => setRejectReason(e.target.value)}
                                                    placeholder="Describe con precisión qué cambios necesitas (tamaño, posición, color, proporciones...)"
                                                    className="w-full p-3 border-2 border-surface-200 rounded-xl text-sm mb-3 min-h-[80px] resize-none outline-none focus:border-brand-red transition-colors"
                                                />
                                            )}

                                            {actionMessage && (
                                                <p className={`text-sm mb-3 px-3 py-2 rounded-lg ${actionMessage.includes("Error") || actionMessage.includes("motivo") ? "bg-red-50 text-red-600" : "bg-green-50 text-green-600"}`}>
                                                    {actionMessage}
                                                </p>
                                            )}

                                            <div className="flex gap-3">
                                                <button onClick={() => setProofAction(null)} className="px-5 py-2 rounded-full border border-surface-200 text-sm font-medium hover:bg-surface-50 transition-colors">Cancelar</button>
                                                <button
                                                    onClick={() => handleProofAction(proofAction.lineId, proofAction.action)}
                                                    disabled={actionLoading}
                                                    className={`px-6 py-2 rounded-full text-sm font-semibold text-white flex items-center gap-2 ${proofAction.action === "approve" ? "bg-green-500 hover:bg-green-600" : "bg-red-500 hover:bg-red-600"} disabled:opacity-50 transition-colors shadow-sm`}
                                                >
                                                    {actionLoading ? "Enviando orden a Midocean..." : proofAction.action === "approve" ? <>Confirmar Autorización <ThumbsUp size={14} /></> : <>Solicitar Cambios <ThumbsDown size={14} /></>}
                                                </button>
                                            </div>
                                        </div>
                                    )}

                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
