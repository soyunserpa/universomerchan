import Link from 'next/link';
import Image from 'next/image';

export default function NotFound() {
  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center text-center px-4">
      <div className="relative w-full max-w-md h-[300px] mb-8">
        {/* GIF proporcionado por Marina: Merchandising_Perdido_en_el_Espacio_.gif */}
        <Image
          src="/images/404-space.gif"
          alt="Perdidos en el espacio"
          fill
          className="object-contain"
          unoptimized // Necesario para que no se congele el GIF animado en Next.js
        />
      </div>
      
      <h1 className="font-display font-extrabold text-4xl sm:text-5xl text-gray-900 mb-4 tracking-tight">
        Houston, tenemos un 404.
      </h1>
      
      <p className="text-gray-600 text-lg sm:text-xl max-w-xl mx-auto mb-10 leading-relaxed">
        El merchandising que buscas se ha perdido en el espacio. Parece que esta URL no existe o la caja se ha desviado a otra galaxia corporativa.
      </p>
      
      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <Link 
          href="/catalog" 
          className="bg-brand-red text-white font-semibold py-4 px-8 rounded-full shadow-lg shadow-brand-red/20 hover:scale-105 active:scale-95 transition-all w-full sm:w-auto"
        >
          Volver al Catálogo
        </Link>
        <Link 
          href="/" 
          className="bg-white text-gray-800 border-2 border-gray-200 font-semibold py-4 px-8 rounded-full hover:border-gray-300 hover:bg-gray-50 active:scale-95 transition-all w-full sm:w-auto"
        >
          Ir de vuelta a la Tierra (Inicio)
        </Link>
      </div>
    </div>
  );
}
