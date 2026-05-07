"use client";

import { useEffect } from "react";

export function UtmProvider() {
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const source = params.get("utm_source");
      const medium = params.get("utm_medium");
      const campaign = params.get("utm_campaign");
      const referer = document.referrer;

      // Si viene con parámetros UTM, los guardamos en localStorage
      if (source) {
        localStorage.setItem("utm_source", source);
        if (medium) localStorage.setItem("utm_medium", medium);
        if (campaign) localStorage.setItem("utm_campaign", campaign);
      }

      // Guardar el referer original si es externo (ej. Google, Instagram)
      if (referer && !referer.includes(window.location.hostname)) {
        if (!localStorage.getItem("original_referer")) {
          localStorage.setItem("original_referer", referer);
        }
      }
    } catch (error) {
      console.error("Error setting UTM params", error);
    }
  }, []);

  return null;
}
