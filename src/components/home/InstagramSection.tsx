"use client";

import { Instagram, Play, ExternalLink } from "lucide-react";
import { Link } from "@/i18n/routing";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";

export function InstagramSection() {
  const t = useTranslations("Instagram");
  const manualLinks = [
    "https://www.instagram.com/p/DX_fzlJIxkE/embed",
    "https://www.instagram.com/p/DJ1tZsMIwmf/embed",
    "https://www.instagram.com/p/DX90QKkoLpu/embed",
    "https://www.instagram.com/p/DYCL6_YI5kh/embed"
  ];

  return (
    <section className="bg-surface-50 py-16 sm:py-20 border-t border-surface-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        
        {/* Cabecera de la sección */}
        <div className="flex flex-col sm:flex-row justify-between items-center mb-10 gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-600 flex items-center justify-center p-[2px]">
              <div className="w-full h-full bg-white rounded-full flex items-center justify-center">
                <Instagram size={28} className="text-pink-600" />
              </div>
            </div>
            <div>
              <h2 className="font-display font-extrabold text-2xl sm:text-3xl">{t("title")}</h2>
              <p className="text-gray-500 text-sm mt-1">{t("subtitle")}</p>
            </div>
          </div>
          
          <Link 
            href="https://www.instagram.com/universomerchan" 
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-white border-2 border-surface-200 text-gray-900 font-semibold text-sm px-6 py-2.5 rounded-full hover:border-gray-900 transition-colors whitespace-nowrap"
          >
            {t("follow")} <ExternalLink size={16} />
          </Link>
        </div>

        {/* MOCKUP VISUAL (Simulación de cómo quedará) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 max-w-7xl mx-auto">
          {manualLinks.map((url, index) => (
            <div key={index} className="w-full bg-white rounded-2xl overflow-hidden shadow-sm border border-surface-200">
               <iframe 
                  title={t("post_title", { n: index + 1 })}
                  src={url} 
                  width="100%" 
                  height="450" 
                  frameBorder="0" 
                  scrolling="no" 
                  allowTransparency={true}
                  loading="lazy"
                  className="w-full"
               ></iframe>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}
