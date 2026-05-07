"use client";

import { Instagram, Play, ExternalLink } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

export function InstagramSection() {
  const [isWidgetLoaded, setIsWidgetLoaded] = useState(false);
  const ELFSIGHT_WIDGET_ID = "YOUR_WIDGET_ID_HERE"; // Reemplazar con el ID real de Elfsight

  // MOCKUP VISUAL: Esto es lo que se muestra mientras no hay widget configurado
  // para que el usuario pueda "ver cómo queda" el diseño de 4 vídeos
  const mockVideos = [
    { id: 1, img: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400&h=500&fit=crop", views: "1.2K" },
    { id: 2, img: "https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?w=400&h=500&fit=crop", views: "856" },
    { id: 3, img: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400&h=500&fit=crop", views: "2.4K" },
    { id: 4, img: "https://images.unsplash.com/photo-1618365908648-e71bf5716b02?w=400&h=500&fit=crop", views: "3.1K" },
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
              <h2 className="font-display font-extrabold text-2xl sm:text-3xl">Síguenos en Instagram</h2>
              <p className="text-gray-500 text-sm mt-1">@universomerchan • Detrás de las cámaras y novedades</p>
            </div>
          </div>
          
          <Link 
            href="https://www.instagram.com/universomerchan" 
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-white border-2 border-surface-200 text-gray-900 font-semibold text-sm px-6 py-2.5 rounded-full hover:border-gray-900 transition-colors whitespace-nowrap"
          >
            Seguir página <ExternalLink size={16} />
          </Link>
        </div>

        {/* CONTENEDOR DEL WIDGET O MOCKUP */}
        {ELFSIGHT_WIDGET_ID !== "YOUR_WIDGET_ID_HERE" ? (
          /* Aquí se cargará el widget real cuando se ponga el ID */
          <div className="w-full min-h-[400px] bg-white rounded-2xl border border-surface-200 p-4 flex items-center justify-center relative">
            <div className={`elfsight-app-${ELFSIGHT_WIDGET_ID}`}></div>
            {!isWidgetLoaded && <p className="text-gray-400 animate-pulse absolute">Cargando feed de Instagram...</p>}
            <script src="https://apps.elfsight.com/p/platform.js" defer onLoad={() => setIsWidgetLoaded(true)}></script>
          </div>
        ) : (
          /* MOCKUP VISUAL (Simulación de cómo quedará) */
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {mockVideos.map((video) => (
              <Link
                key={video.id}
                href="https://www.instagram.com/universomerchan"
                target="_blank"
                rel="noopener noreferrer"
                className="group relative aspect-[4/5] bg-gray-900 rounded-2xl overflow-hidden hover-lift block"
              >
                <img 
                  src={video.img} 
                  alt="Instagram Reel" 
                  className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity duration-300 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                
                {/* Play Button Overlay */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-white border border-white/40 group-hover:scale-110 transition-transform duration-300">
                    <Play size={24} className="ml-1" fill="currentColor" />
                  </div>
                </div>

                {/* Views Counter Overlay */}
                <div className="absolute bottom-3 left-3 flex items-center gap-1.5 text-white text-xs font-semibold drop-shadow-md">
                  <Play size={12} fill="currentColor" /> {video.views}
                </div>
                
                {/* Instagram Icon Overlay */}
                <div className="absolute top-3 right-3 text-white drop-shadow-md opacity-80">
                  <Instagram size={20} />
                </div>
              </Link>
            ))}
          </div>
        )}
        
        {/* Aviso técnico temporal (solo para que el usuario sepa que es de prueba) */}
        {ELFSIGHT_WIDGET_ID === "YOUR_WIDGET_ID_HERE" && (
          <div className="mt-6 text-center">
            <p className="text-xs text-amber-600 bg-amber-50 inline-block px-4 py-2 rounded-lg border border-amber-200">
              💡 <strong>Modo Vista Previa:</strong> Así se vería tu feed. Para automatizarlo con tus vídeos reales (Opción 2), hay que pegar el ID de Elfsight en el código. <br />Si prefieres la Opción 1, podemos cambiar estas 4 fotos de prueba por enlaces a 4 vídeos tuyos reales manualmente.
            </p>
          </div>
        )}

      </div>
    </section>
  );
}
