"use client";

import { createPortal } from "react-dom";
import { useEffect, useState } from "react";

// Barra fija inferior SOLO en móvil para que el CTA principal siga accesible al hacer
// scroll por la ficha. Se renderiza por Portal a document.body para que el
// position:fixed funcione aunque el configurador tenga ancestros con `transform`.
export function StickyMobileBar({
  visible,
  priceText,
  label,
  onClick,
  disabled,
}: {
  visible: boolean;
  priceText: string;
  label: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted || !visible) return null;

  return createPortal(
    <div
      className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-surface-200 px-4 py-3 flex items-center gap-3 shadow-[0_-4px_20px_rgba(0,0,0,0.08)]"
      style={{ paddingBottom: "calc(0.75rem + env(safe-area-inset-bottom))" }}
    >
      <div className="flex flex-col leading-tight shrink-0">
        <span className="text-[10px] text-gray-400 uppercase tracking-wide">Total</span>
        <span className="font-extrabold text-lg text-brand-red">{priceText}</span>
      </div>
      <button
        onClick={onClick}
        disabled={disabled}
        className="flex-1 bg-brand-red text-white py-3 rounded-full font-extrabold text-sm hover:bg-brand-red-dark transition-colors disabled:opacity-50 shadow-md"
      >
        {label}
      </button>
    </div>,
    document.body
  );
}
