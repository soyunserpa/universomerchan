"use client";

import { useEffect } from "react";

/**
 * Invisible component that listens for unhandled promise rejections
 * and generic window errors that don't crash React but should be logged.
 */
export function ClientErrorTracker() {
  useEffect(() => {
    // Escuchar promesas rechazadas (ej: fetch fallidos)
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      try {
        const error = event.reason;
        fetch("/api/log-error", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            errorType: "client_network_error",
            severity: "low",
            message: error?.message || "Unhandled Promise Rejection",
            url: window.location.href,
            context: {
              stack: error?.stack,
              userAgent: navigator.userAgent
            }
          }),
          keepalive: true
        });
      } catch (e) {
        // Silencioso para evitar loops
      }
    };

    // Escuchar errores genéricos de JS fuera del árbol de React
    const handleWindowError = (event: ErrorEvent) => {
      try {
        fetch("/api/log-error", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            errorType: "client_js_error",
            severity: "medium",
            message: event.message,
            url: window.location.href,
            context: {
              filename: event.filename,
              lineno: event.lineno,
              colno: event.colno,
              stack: event.error?.stack,
              userAgent: navigator.userAgent
            }
          }),
          keepalive: true
        });
      } catch (e) {}
    };

    window.addEventListener("unhandledrejection", handleUnhandledRejection);
    window.addEventListener("error", handleWindowError);

    return () => {
      window.removeEventListener("unhandledrejection", handleUnhandledRejection);
      window.removeEventListener("error", handleWindowError);
    };
  }, []);

  return null; // Componente completamente invisible
}
