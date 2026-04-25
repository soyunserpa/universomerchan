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
    const [isEditing, setIsEditing] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [formData, setFormData] = useState({
        firstName: "", lastName: "", phone: "", companyName: "", cif: "",
        shippingStreet: "", shippingCity: "", shippingPostalCode: "", shippingCountry: "ES"
    });

    useEffect(() => {
        if (user) {
            setFormData({
                firstName: user.firstName || "",
                lastName: user.lastName || "",
                phone: (user as any).phone || "",
                companyName: user.companyName || "",
                cif: (user as any).cif || "",
                shippingStreet: (user as any).shippingStreet || "",
                shippingCity: (user as any).shippingCity || "",
                shippingPostalCode: (user as any).shippingPostalCode || "",
                shippingCountry: (user as any).shippingCountry || "ES",
            });
        }
    }, [user]);

    const handleSave = async () => {
        setSaving(true); setError(""); setSuccess("");
        try {
            const res = await fetch("/api/account/profile", {
                method: "PUT",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                body: JSON.stringify(formData)
            });
            const data = await res.json();
            if (data.success) {
                setSuccess("Perfil actualizado correctamente");
                setIsEditing(false);
                window.location.reload(); // Hard reload para refrescar globalmente
            } else {
                setError(data.error || "Error al actualizar");
            }
        } catch {
            setError("Error de red");
        } finally {
            setSaving(false);
        }
    };

    useEffect(() => {
        if (!isLoading && !isAuthenticated) { router.push("/auth/login"); return; }
        if (!token) return;

        fetch("/api/account/stats", { headers: { Authorization: `Bearer ${token}` } })
            .then(r => r.json())
            .then(data => {
                if (data.error) {
                    logout();
                    return;
                }
                setStats(data);
            })
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
                                <div className="text-gray-400 mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider"><User size={14} /> Nombre y Apellidos</div>
                                {isEditing ? (
                                    <div className="flex gap-2">
                                        <input placeholder="Nombre" className="w-1/2 px-3 py-2 border border-surface-200 rounded-lg text-sm focus:outline-none focus:border-brand-red" value={formData.firstName} onChange={e => setFormData({ ...formData, firstName: e.target.value })} />
                                        <input placeholder="Apellidos" className="w-1/2 px-3 py-2 border border-surface-200 rounded-lg text-sm focus:outline-none focus:border-brand-red" value={formData.lastName} onChange={e => setFormData({ ...formData, lastName: e.target.value })} />
                                    </div>
                                ) : (
                                    <div className="font-medium">{user?.firstName} {user?.lastName}</div>
                                )}
                            </div>

                            <div className="bg-surface-50 rounded-xl p-5 border border-surface-100">
                                <div className="text-gray-400 mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider"><Mail size={14} /> Correo electrónico</div>
                                <div className="font-medium text-gray-500">{user?.email} <span className="text-xs font-normal ml-2 text-gray-400">(No editable)</span></div>
                            </div>

                            <div className="bg-surface-50 rounded-xl p-5 border border-surface-100">
                                <div className="text-gray-400 mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider"><Phone size={14} /> Teléfono</div>
                                {isEditing ? (
                                    <input type="tel" placeholder="+34 600..." className="w-full px-3 py-2 border border-surface-200 rounded-lg text-sm focus:outline-none focus:border-brand-red" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} />
                                ) : (
                                    <div className="font-medium">{(user as any)?.phone || <span className="text-gray-400 italic">No especificado</span>}</div>
                                )}
                            </div>

                            <div className="bg-surface-50 rounded-xl p-5 border border-surface-100">
                                <div className="text-gray-400 mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider"><Building size={14} /> Empresa</div>
                                {isEditing ? (
                                    <input placeholder="Nombre de tu empresa" className="w-full px-3 py-2 border border-surface-200 rounded-lg text-sm focus:outline-none focus:border-brand-red" value={formData.companyName} onChange={e => setFormData({ ...formData, companyName: e.target.value })} />
                                ) : (
                                    <div className="font-medium">{user?.companyName || <span className="text-gray-400 italic">No aplicable</span>}</div>
                                )}
                            </div>

                            <div className="bg-surface-50 rounded-xl p-5 border border-surface-100 sm:col-span-2">
                                <div className="text-gray-400 mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider"><Briefcase size={14} /> CIF / VAT Id</div>
                                {isEditing ? (
                                    <input placeholder="B12345678" className="w-full sm:w-1/2 px-3 py-2 border border-surface-200 rounded-lg text-sm focus:outline-none focus:border-brand-red" value={formData.cif} onChange={e => setFormData({ ...formData, cif: e.target.value })} />
                                ) : (
                                    <div className="font-medium">{(user as any)?.cif || <span className="text-gray-400 italic">No especificado</span>}</div>
                                )}
                            </div>

                            <div className="bg-surface-50 rounded-xl p-5 border border-surface-100 sm:col-span-2">
                                <div className="text-gray-400 mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider"><Truck size={14} /> Dirección de Envío y Facturación</div>
                                {isEditing ? (
                                    <div className="space-y-3">
                                        <input placeholder="Calle, número, puerta" className="w-full px-3 py-2 border border-surface-200 rounded-lg text-sm focus:outline-none focus:border-brand-red" value={formData.shippingStreet} onChange={e => setFormData({ ...formData, shippingStreet: e.target.value })} />
                                        <div className="flex gap-3">
                                            <input placeholder="Ciudad" className="w-full px-3 py-2 border border-surface-200 rounded-lg text-sm focus:outline-none focus:border-brand-red" value={formData.shippingCity} onChange={e => setFormData({ ...formData, shippingCity: e.target.value })} />
                                            <input placeholder="C.P." className="w-1/3 px-3 py-2 border border-surface-200 rounded-lg text-sm focus:outline-none focus:border-brand-red" value={formData.shippingPostalCode} onChange={e => setFormData({ ...formData, shippingPostalCode: e.target.value })} />
                                        </div>
                                    </div>
                                ) : (
                                    <div className="font-medium">
                                        {(user as any)?.shippingStreet ? (
                                            <>
                                                <p>{(user as any).shippingStreet}</p>
                                                <p>{(user as any).shippingCity}, {(user as any).shippingPostalCode}</p>
                                            </>
                                        ) : (
                                            <span className="text-gray-400 italic">Ninguna dirección guardada. Introdúcela en tu próximo pedido.</span>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>

                        {error && <p className="text-red-500 text-sm mt-4 font-medium">{error}</p>}
                        {success && <p className="text-green-600 text-sm mt-4 font-medium">{success}</p>}

                        <div className="mt-8 pt-8 border-t border-surface-200 flex flex-col sm:flex-row justify-between items-center gap-4">
                            {isEditing ? (
                                <>
                                    <p className="text-xs text-brand-red/80 flex-1 text-center sm:text-left">
                                        Asegúrate de comprobar que el CIF es correcto para efectos de facturación automática.
                                    </p>
                                    <div className="flex gap-2">
                                        <button onClick={() => setIsEditing(false)} className="bg-surface-100 text-gray-700 hover:bg-surface-200 px-5 py-2 rounded-full font-semibold text-sm transition-colors">
                                            Cancelar
                                        </button>
                                        <button onClick={handleSave} disabled={saving} className="bg-brand-red text-white hover:bg-brand-red-dark px-5 py-2 rounded-full font-semibold text-sm transition-colors flex items-center gap-2 disabled:opacity-50">
                                            {saving ? <RefreshCw size={14} className="animate-spin" /> : "Guardar Cambios"}
                                        </button>
                                    </div>
                                </>
                            ) : (
                                <>
                                    <p className="text-xs text-gray-400 flex-1 text-center sm:text-left">
                                        Mantén tus datos actualizados para agilizar tus futuros pedidos y facturas.
                                    </p>
                                    <button onClick={() => setIsEditing(true)} className="bg-surface-100 text-gray-700 hover:bg-surface-200 px-5 py-2 rounded-full font-semibold text-sm transition-colors flex items-center gap-2">
                                        Editar mis datos
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
