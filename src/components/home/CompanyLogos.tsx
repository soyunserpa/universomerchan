/* eslint-disable @next/next/no-img-element */
"use client";

import React, { useState, useEffect } from "react";

const companies = [
  { name: "Novotel", src: "/logos/novotel.png", customClass: "max-w-[220px] sm:max-w-[280px] scale-125 mx-4" },
  { name: "Porsche", src: "/logos/porsche.png", customClass: "max-w-[150px] sm:max-w-[180px]" },
  { name: "Instituto DI", src: "/logos/institutodi.png" },
  { name: "Metapro Academy", src: "/logos/metapro.png" },
  { name: "Quiero Un Serpa", src: "/logos/quierounserpa.png" },
];

function Logo({ name, src, customClass }: { name: string; src: string; customClass?: string }) {
  const [error, setError] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // We use purely typographic fallback if the image fails or before mounting prevents hydration match
  if (!mounted || error) {
    return (
      <div className="flex items-center justify-center h-16 sm:h-20 px-6 filter grayscale opacity-60 hover:grayscale-0 hover:opacity-100 hover:-translate-y-1 transition-all duration-300">
        <span className="font-display font-black text-xl sm:text-2xl text-gray-900 tracking-tight" suppressHydrationWarning>
          {name}
        </span>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center h-16 sm:h-20 w-auto min-w-[130px] px-4 filter grayscale opacity-60 hover:grayscale-0 hover:opacity-100 hover:-translate-y-1 transition-all duration-500 ease-out cursor-pointer relative group">
      <div className="absolute inset-0 bg-brand-red/5 blur-xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      <img
        src={src}
        alt={`${name} logotipo`}
        className={`max-h-[90%] object-contain relative z-10 drop-shadow-sm ${customClass || 'max-w-[130px]'} ${src.includes('quierounserpa') ? 'invert hover:invert' : ''}`}
        onError={() => setError(true)}
        suppressHydrationWarning
      />
    </div>
  );
}

export function CompanyLogos() {
  return (
    <section className="border-t border-b border-gray-100 bg-white py-12 sm:py-16 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-10">
          <p className="text-sm font-bold text-gray-900 uppercase tracking-widest text-center">
            Proyectos que confían en nosotros
          </p>
        </div>
        
        {/* Infinite scrolling effect purely with CSS variables & animation */}
        <div className="relative flex w-full overflow-hidden [mask-image:_linear-gradient(to_right,transparent_0,_black_128px,_black_calc(100%-128px),transparent_100%)]">
          <style dangerouslySetInnerHTML={{ __html: `
            @keyframes slide {
              from { transform: translateX(0); }
              to { transform: translateX(-100%); }
            }
            .animate-slide {
              animation: slide 30s linear infinite;
            }
            .pause-on-hover:hover .animate-slide {
              animation-play-state: paused;
            }
          `}} />
          
          <div className="flex items-center w-full pause-on-hover">
            <div className="flex items-center gap-10 sm:gap-20 animate-slide whitespace-nowrap min-w-max px-10">
              {companies.map((company, i) => (
                <Logo key={`first-${i}`} name={company.name} src={company.src} />
              ))}
            </div>
            <div className="flex items-center gap-10 sm:gap-20 animate-slide whitespace-nowrap min-w-max px-10">
              {companies.map((company, i) => (
                <Logo key={`second-${i}`} name={company.name} src={company.src} />
              ))}
            </div>
             <div className="flex items-center gap-10 sm:gap-20 animate-slide whitespace-nowrap min-w-max px-10">
              {companies.map((company, i) => (
                <Logo key={`third-${i}`} name={company.name} src={company.src} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
