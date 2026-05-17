"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
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
            message: error.message || "Unknown root layout error",
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
    <html lang="es">
      <body style={{ margin: 0, padding: 0, fontFamily: 'system-ui, sans-serif', backgroundColor: '#f9fafb' }}>
        <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2rem', textAlign: 'center' }}>
          <div style={{ width: '80px', height: '80px', backgroundColor: '#fee2e2', color: '#ef4444', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.5rem' }}>
            <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>
          </div>
          <h1 style={{ fontSize: '2rem', fontWeight: 800, color: '#111827', margin: '0 0 1rem 0' }}>
            Fallo crítico del sistema
          </h1>
          <p style={{ color: '#6b7280', maxWidth: '400px', margin: '0 auto 2rem auto', lineHeight: '1.5' }}>
            Hemos detectado un problema grave. El equipo técnico ha recibido una alerta con los detalles técnicos para solucionarlo de inmediato.
          </p>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
            <button
              onClick={() => reset()}
              style={{ padding: '0.75rem 1.5rem', backgroundColor: '#111827', color: 'white', border: 'none', borderRadius: '0.75rem', fontWeight: 600, cursor: 'pointer' }}
            >
              Intentarlo de nuevo
            </button>
            <a 
              href="/"
              style={{ padding: '0.75rem 1.5rem', backgroundColor: 'white', color: '#374151', border: '2px solid #e5e7eb', borderRadius: '0.75rem', fontWeight: 600, textDecoration: 'none' }}
            >
              Volver a inicio
            </a>
          </div>
        </div>
      </body>
    </html>
  );
}
