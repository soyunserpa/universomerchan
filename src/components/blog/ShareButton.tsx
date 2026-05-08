"use client";

import { Share2, Check } from "lucide-react";
import { useState } from "react";

export function ShareButton({ title }: { title: string }) {
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    const url = window.location.href;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title,
          url,
        });
      } catch (err) {
        console.error("Error sharing:", err);
      }
    } else {
      // Fallback: copy to clipboard
      try {
        await navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (err) {
        console.error("Failed to copy:", err);
      }
    }
  };

  return (
    <button 
      onClick={handleShare}
      className="flex items-center gap-2 text-sm font-semibold hover:text-brand-red transition-colors bg-surface-50 hover:bg-red-50 px-4 py-2 rounded-full"
    >
      {copied ? <Check size={16} className="text-green-500" /> : <Share2 size={16} />}
      {copied ? "¡Enlace copiado!" : "Compartir Artículo"}
    </button>
  );
}
