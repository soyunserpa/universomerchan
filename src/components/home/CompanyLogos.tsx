/* eslint-disable @next/next/no-img-element */
"use client";

import React, { useState } from "react";

const companies = [
  { name: "Novotel", domain: "novotel.com" },
  { name: "Porsche", domain: "porsche.com" },
  { name: "Instituto DI", domain: "institutodi.com" },
  { name: "Estores a Medida", domain: "cortinadecor.com" },
  { name: "Metapro Academy", domain: "metaproacademy.com" },
  { name: "Quiero Un Serpa", domain: "quierounserpa.com" },
];

function Logo({ name, domain }: { name: string; domain: string }) {
  const [error, setError] = useState(false);

  // If the image API fails, we show a nice typographic fallback
  if (error) {
    return (
      <div className="flex items-center justify-center h-16 sm:h-20 px-6 filter grayscale opacity-60 hover:grayscale-0 hover:opacity-100 hover:-translate-y-1 transition-all duration-300">
        <span className="font-display font-black text-xl sm:text-2xl text-gray-800 tracking-tight">
          {name}
        </span>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center h-16 sm:h-20 w-32 sm:w-44 px-4 filter grayscale opacity-50 hover:grayscale-0 hover:opacity-100 hover:-translate-y-2 transition-all duration-500 ease-out cursor-pointer relative group">
      {/* Glow effect on hover */}
      <div className="absolute inset-0 bg-brand-red/5 blur-xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      <img
        src={`https://logo.clearbit.com/${domain}`}
        alt={`${name} logo`}
        className="max-h-full max-w-full object-contain relative z-10 drop-shadow-sm"
        onError={() => setError(true)}
      />
    </div>
  );
}

export function CompanyLogos() {
  return (
    <section className="border-t border-b border-gray-100 bg-white py-12 sm:py-16 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-10">
          <p className="text-sm font-bold text-gray-400 uppercase tracking-widest text-center">
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
            {/* Double the list for seamless infinite loop */}
            <div className="flex items-center gap-10 sm:gap-20 animate-slide whitespace-nowrap min-w-max px-10">
              {companies.map((company, i) => (
                <Logo key={`first-${i}`} name={company.name} domain={company.domain} />
              ))}
            </div>
            <div className="flex items-center gap-10 sm:gap-20 animate-slide whitespace-nowrap min-w-max px-10">
              {companies.map((company, i) => (
                <Logo key={`second-${i}`} name={company.name} domain={company.domain} />
              ))}
            </div>
             <div className="flex items-center gap-10 sm:gap-20 animate-slide whitespace-nowrap min-w-max px-10">
              {companies.map((company, i) => (
                <Logo key={`third-${i}`} name={company.name} domain={company.domain} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
