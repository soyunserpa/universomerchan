"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAdminAuth } from "@/components/admin/AdminLayout";
import { Gift, Lock, Mail, Shield, ArrowRight } from "lucide-react";

export default function AdminLoginPage() {
  const { login } = useAdminAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(""); setLoading(true);
    const result = await login(email, password);
    setLoading(false);
    if (result.success) router.push("/admin/dashboard");
    else setError(result.error || "Credenciales incorrectas");
  };

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Gift size={40} className="text-brand-red mx-auto mb-3" />
          <h1 className="font-display font-extrabold text-3xl text-white mb-2">Panel de Administración</h1>
          <p className="text-gray-500 text-sm">Acceso exclusivo para el equipo de Universo Merchan</p>
        </div>

        <div className="bg-gray-900 rounded-2xl border border-gray-800 p-7">
          <div className="flex items-center gap-2 bg-gray-800 rounded-lg px-3 py-2.5 mb-6">
            <Shield size={14} className="text-brand-red" />
            <span className="text-xs text-gray-400">Conexión segura · Acceso independiente de cuentas de cliente</span>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-sm text-gray-400 mb-1.5 block">Email de administrador</label>
              <div className="relative">
                <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-600" />
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="pedidos@universomerchan.com" className="w-full pl-10 pr-4 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-sm text-white placeholder-gray-600 focus:border-brand-red" />
              </div>
            </div>

            <div>
              <label className="text-sm text-gray-400 mb-1.5 block">Contraseña</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-600" />
                <input type="password" value={password} onChange={e => setPassword(e.target.value)} required placeholder="••••••••" className="w-full pl-10 pr-4 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-sm text-white placeholder-gray-600 focus:border-brand-red" onKeyDown={e => e.key === "Enter" && handleSubmit(e)} />
              </div>
            </div>

            {error && <p className="text-sm text-red-400 bg-red-900/30 px-3 py-2 rounded-lg">{error}</p>}

            <button type="submit" disabled={loading} className="w-full bg-brand-red text-white py-3 rounded-full font-semibold text-sm flex items-center justify-center gap-2 hover:bg-brand-red-dark transition-colors disabled:opacity-50">
              {loading ? "Verificando..." : <><Lock size={15} /> Acceder al panel</>}
            </button>
          </form>

          <p className="text-[11px] text-gray-600 text-center mt-5">Si no tienes acceso, contacta con el administrador del sistema</p>
        </div>
      </div>
    </div>
  );
}
