"use client";

import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useRouter } from "@/i18n/routing";;
import { Link } from "@/i18n/routing";
import { useAuth } from "@/lib/auth-context";
import { useTranslations } from "next-intl";
import { Gift, Mail, Lock, ArrowRight, Eye, EyeOff } from "lucide-react";

export default function LoginPage() {
  return (
    <Suspense>
      <LoginContent />
    </Suspense>
  )
}

function LoginContent() {
  const t = useTranslations("Auth");
  const { login } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectParams = searchParams.get("redirect") || "/account/orders";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    const result = await login(email, password);
    setLoading(false);
    if (result.success) {
      router.push(redirectParams);
    } else {
      setError(result.error || t("errorLogin"));
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Gift size={36} className="text-brand-red mx-auto mb-3" />
          <h1 className="font-display font-extrabold text-3xl mb-2">{t("loginTitle")}</h1>
          <p className="text-gray-400 text-sm">{t("loginSubtitle")}</p>
        </div>

        <div className="bg-white rounded-2xl border border-surface-200 p-7">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-sm font-semibold mb-1.5 block">{t("emailLabel")}</label>
              <div className="relative">
                <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder={t("emailPlaceholder")} className="w-full pl-10 pr-4 py-2.5 border-2 border-surface-200 rounded-xl text-sm" />
              </div>
            </div>

            <div>
              <label className="text-sm font-semibold mb-1.5 block">{t("passwordLabel")}</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input type={showPassword ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)} required placeholder="••••••••" className="w-full pl-10 pr-10 py-2.5 border-2 border-surface-200 rounded-xl text-sm" />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {error && <p className="text-sm text-red-500 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}

            <button type="submit" disabled={loading} className="w-full bg-brand-red text-white py-3 rounded-full font-semibold text-sm flex items-center justify-center gap-2 hover:bg-brand-red-dark transition-colors disabled:opacity-50">
              {loading ? t("loggingIn") : <>{t("loginButton")} <ArrowRight size={16} /></>}
            </button>
          </form>

          <div className="mt-4 text-center">
            <Link href="/auth/reset-password" className="text-xs text-gray-400 hover:text-brand-red transition-colors">
              {t("forgotPassword")}
            </Link>
          </div>
        </div>

        <p className="text-center text-sm text-gray-400 mt-5">
          {t.rich("noAccount", {
            link: (chunks) => (
              <Link href={`/auth/register${searchParams.get("redirect") ? `?redirect=${encodeURIComponent(searchParams.get("redirect") as string)}` : ""}`} className="text-brand-red font-semibold hover:underline">
                {chunks}
              </Link>
            ),
          })}
        </p>
      </div>
    </div>
  );
}
