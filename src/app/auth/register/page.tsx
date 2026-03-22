"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { Gift, Mail, Lock, User, Building2, Phone, FileText, ArrowRight, Eye, EyeOff } from "lucide-react";

export default function RegisterPage() {
  const { register } = useAuth();
  const router = useRouter();
  const [form, setForm] = useState({ email: "", password: "", confirmPassword: "", firstName: "", lastName: "", phone: "", companyName: "", cif: "", website: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showCompany, setShowCompany] = useState(false);

  const update = (field: string, value: string) => setForm(prev => ({ ...prev, [field]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (form.password !== form.confirmPassword) { setError("Las contraseñas no coinciden"); return; }
    if (form.password.length < 8) { setError("La contraseña debe tener al menos 8 caracteres"); return; }

    setLoading(true);
    const result = await register({
      email: form.email, password: form.password, firstName: form.firstName, lastName: form.lastName,
      phone: form.phone || undefined, companyName: form.companyName || undefined, cif: form.cif || undefined,
      website: form.website || undefined
    });
    setLoading(false);

    if (result.success) { router.push("/account/orders"); }
    else { setError(result.error || "Error en el registro"); }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <Gift size={36} className="text-brand-red mx-auto mb-3" />
          <h1 className="font-display font-extrabold text-3xl mb-2">Crear cuenta</h1>
          <p className="text-gray-400 text-sm">Regístrate para personalizar y comprar productos</p>
        </div>

        <div className="bg-white rounded-2xl border border-surface-200 p-7">
          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* Honeypot field for bot protection */}
            <div className="absolute opacity-0 -z-10 pointer-events-none" aria-hidden="true" style={{ top: -9999, left: -9999 }}>
              <label htmlFor="website">Website</label>
              <input type="text" id="website" name="website" tabIndex={-1} autoComplete="off" value={form.website} onChange={e => update("website", e.target.value)} />
            </div>

            {/* Name */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-semibold mb-1.5 block">Nombre *</label>
                <div className="relative">
                  <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input type="text" value={form.firstName} onChange={e => update("firstName", e.target.value)} required placeholder="Marina" className="w-full pl-10 pr-4 py-2.5 border-2 border-surface-200 rounded-xl text-sm" />
                </div>
              </div>
              <div>
                <label className="text-sm font-semibold mb-1.5 block">Apellido</label>
                <input type="text" value={form.lastName} onChange={e => update("lastName", e.target.value)} placeholder="García" className="w-full px-4 py-2.5 border-2 border-surface-200 rounded-xl text-sm" />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="text-sm font-semibold mb-1.5 block">Email *</label>
              <div className="relative">
                <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input type="email" value={form.email} onChange={e => update("email", e.target.value)} required placeholder="tu@empresa.com" className="w-full pl-10 pr-4 py-2.5 border-2 border-surface-200 rounded-xl text-sm" />
              </div>
            </div>

            {/* Phone */}
            <div>
              <label className="text-sm font-semibold mb-1.5 block">Teléfono</label>
              <div className="relative">
                <Phone size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input type="tel" value={form.phone} onChange={e => update("phone", e.target.value)} placeholder="+34 600 000 000" className="w-full pl-10 pr-4 py-2.5 border-2 border-surface-200 rounded-xl text-sm" />
              </div>
            </div>

            {/* Password */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-semibold mb-1.5 block">Contraseña *</label>
                <div className="relative">
                  <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input type={showPassword ? "text" : "password"} value={form.password} onChange={e => update("password", e.target.value)} required placeholder="Mín. 8 caracteres" className="w-full pl-10 pr-10 py-2.5 border-2 border-surface-200 rounded-xl text-sm" />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                    {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              </div>
              <div>
                <label className="text-sm font-semibold mb-1.5 block">Confirmar *</label>
                <input type="password" value={form.confirmPassword} onChange={e => update("confirmPassword", e.target.value)} required placeholder="Repite contraseña" className="w-full px-4 py-2.5 border-2 border-surface-200 rounded-xl text-sm" />
              </div>
            </div>

            {/* Company toggle */}
            <button type="button" onClick={() => setShowCompany(!showCompany)} className="flex items-center gap-2 text-sm text-gray-400 hover:text-brand-red transition-colors">
              <Building2 size={14} />
              {showCompany ? "Ocultar datos de empresa" : "¿Compras para una empresa? Añade datos de facturación"}
            </button>

            {/* Company fields */}
            {showCompany && (
              <div className="grid grid-cols-2 gap-3 animate-slide-up">
                <div>
                  <label className="text-sm font-semibold mb-1.5 block">Empresa</label>
                  <div className="relative">
                    <Building2 size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input type="text" value={form.companyName} onChange={e => update("companyName", e.target.value)} placeholder="Nombre empresa" className="w-full pl-10 pr-4 py-2.5 border-2 border-surface-200 rounded-xl text-sm" />
                  </div>
                </div>
                <div>
                  <label className="text-sm font-semibold mb-1.5 block">CIF/NIF</label>
                  <div className="relative">
                    <FileText size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input type="text" value={form.cif} onChange={e => update("cif", e.target.value)} placeholder="B12345678" className="w-full pl-10 pr-4 py-2.5 border-2 border-surface-200 rounded-xl text-sm" />
                  </div>
                </div>
              </div>
            )}

            {error && <p className="text-sm text-red-500 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}

            <button type="submit" disabled={loading} className="w-full bg-brand-red text-white py-3 rounded-full font-semibold text-sm flex items-center justify-center gap-2 hover:bg-brand-red-dark transition-colors disabled:opacity-50">
              {loading ? "Creando cuenta..." : <>Crear cuenta <ArrowRight size={16} /></>}
            </button>
          </form>
        </div>

        <p className="text-center text-sm text-gray-400 mt-5">
          ¿Ya tienes cuenta?{" "}
          <Link href="/auth/login" className="text-brand-red font-semibold hover:underline">Inicia sesión</Link>
        </p>
      </div>
    </div>
  );
}
