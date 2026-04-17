import React from "react";
import { Star } from "lucide-react";

const REVIEWS = [
  {
    id: 1,
    author: "Maria Alejandra Quintero Ferro",
    role: "Cliente en Google Maps",
    date: "Hace 12 horas",
    text: "Encargamos varias maletas personalizadas para un evento corporativo y la experiencia con esta empresa de merchandising fue excelente de principio a fin. Desde el primer contacto, el equipo se mostró muy atento. La calidad de las maletas superó nuestras expectativas.",
    rating: 5,
  },
  {
    id: 2,
    author: "Natalia Scalici",
    role: "Cliente en Google Maps",
    date: "Hace 1 día",
    text: "La experiencia con ellos ha sido excelente! La calidad y tejido de sus productos (...) son muy buenos, cómodos y duraderos. El diseño adaptados a lo que necesitábamos. Tiempos de entrega rápidos, buena comunicación y una atención muy personalizada. Repetiremos!",
    rating: 5,
  },
  {
    id: 3,
    author: "Julio Llopis Guillem",
    role: "Cliente en Google Maps",
    date: "Hace 2 meses",
    text: "Un ejemplo de profesionalidad! Puntuales, versátiles y en continua mejora. También destaco el trato cercano.",
    rating: 5,
  }
];

export function GoogleReviewsSection() {
  return (
    <section className="bg-surface-50 py-16 sm:py-24 overflow-hidden relative">
      <div className="absolute top-0 right-0 -mr-20 -mt-20 w-72 h-72 rounded-full bg-brand-red/5 blur-3xl pointer-events-none" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10">
        
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 bg-white border border-gray-200 shadow-sm px-4 py-2 rounded-full mb-6 animate-fade-in">
            {/* Minimalist Google 'G' Logo SVG */}
            <svg viewBox="0 0 24 24" width="20" height="20" xmlns="http://www.w3.org/2000/svg">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              <path d="M1 1h22v22H1z" fill="none"/>
            </svg>
            <span className="font-semibold text-sm text-gray-900">5 de 5 en Reseñas de Google</span>
          </div>
          <h2 className="font-display font-extrabold text-3xl sm:text-4xl text-gray-900 mb-4 tracking-tight">
            Lo que dicen las marcas que confían en nosotros
          </h2>
          <p className="text-gray-600 text-lg max-w-2xl mx-auto">
            La calidad de nuestro marcaje y la rapidez de los envíos avalan nuestro trabajo en cada campaña publicitaria.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
          {REVIEWS.map((review, i) => (
            <div 
              key={review.id} 
              className={`bg-white rounded-3xl p-8 border border-gray-100 shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-1 animate-slide-up delay-${i + 1}`}
            >
              <div className="flex gap-1 mb-4">
                {[...Array(review.rating)].map((_, idx) => (
                  <Star key={idx} size={18} className="fill-yellow-400 text-yellow-400" />
                ))}
              </div>
              <p className="text-gray-700 leading-relaxed mb-8 italic">
                "{review.text}"
              </p>
              <div className="flex items-center gap-4 mt-auto">
                <div className="w-10 h-10 rounded-full bg-brand-red/10 flex items-center justify-center font-bold text-brand-red">
                  {review.author.charAt(0)}
                </div>
                <div>
                  <p className="font-bold text-gray-900 text-sm">{review.author}</p>
                  <p className="text-xs text-gray-500">{review.role}</p>
                </div>
                <div className="ml-auto">
                  <svg viewBox="0 0 24 24" width="16" height="16" xmlns="http://www.w3.org/2000/svg">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  </svg>
                </div>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}
