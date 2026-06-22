"use client";

import { useEffect } from "react";
import { useTranslations } from "next-intl";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";
import { Link } from "@/i18n/routing";

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useTranslations("Misc");
  useEffect(() => {
    // Log the error to our custom error tracking API
    const logError = async () => {
      try {
        await fetch("/api/log-error", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            errorType: "client_exception",
            severity: "critical",
            message: error.message || "Unknown client error",
            url: window.location.href,
            context: {
              stack: error.stack,
              digest: error.digest,
              userAgent: navigator.userAgent
            }
          })
        });
      } catch (e) {
        console.error("Failed to report error to logger", e);
      }
    };
    
    logError();
  }, [error]);

  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 bg-white text-center rounded-3xl m-4 border border-surface-200">
      <div className="w-20 h-20 bg-red-50 text-brand-red rounded-full flex items-center justify-center mb-6">
        <AlertTriangle size={40} />
      </div>
      <h1 className="font-display font-extrabold text-3xl sm:text-4xl text-gray-900 mb-4 tracking-tight">
        {t("error_title")}
      </h1>
      <p className="text-gray-500 max-w-md mx-auto mb-8 leading-relaxed">
        {t("error_description")}
      </p>
      
      <div className="flex flex-col sm:flex-row gap-4 justify-center w-full sm:w-auto">
        <button
          onClick={() => reset()}
          className="flex items-center justify-center gap-2 px-6 py-3.5 bg-brand-red text-white rounded-xl font-semibold hover:bg-brand-red/90 active:scale-95 transition-all"
        >
          <RefreshCw size={18} />
          {t("error_retry")}
        </button>
        <Link 
          href="/"
          className="flex items-center justify-center gap-2 px-6 py-3.5 bg-white text-gray-700 border-2 border-surface-200 rounded-xl font-semibold hover:bg-surface-50 active:scale-95 transition-all"
        >
          <Home size={18} className="text-gray-400" />
          {t("back_to_home")}
        </Link>
      </div>
      
      {error.digest && (
        <p className="mt-12 text-xs text-gray-400 font-mono">
          {t("error_diagnostic_id", { id: error.digest })}
        </p>
      )}
    </div>
  );
}
