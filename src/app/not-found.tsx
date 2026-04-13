import Link from 'next/link';
import { PackageX, ArrowRight, Home, Search } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-[85vh] flex flex-col items-center justify-center px-4 relative overflow-hidden bg-white">
      
      {/* Background Decorative Blobs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-brand-red/5 rounded-full blur-3xl -z-10 animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-gray-100 rounded-full blur-3xl -z-10" />

      {/* Main Content Card */}
      <div className="max-w-2xl w-full text-center relative z-10">
        
        {/* Floating Icon Animation */}
        <div className="relative mx-auto w-32 h-32 mb-8 flex items-center justify-center">
          <div className="absolute inset-0 bg-brand-red/10 rounded-full animate-ping opacity-75" />
          <div className="relative bg-white p-6 rounded-full shadow-xl shadow-brand-red/10 border border-brand-red/10">
            <PackageX className="w-16 h-16 text-brand-red" />
          </div>
        </div>
        
        {/* Typography */}
        <h1 className="font-display font-extrabold text-7xl md:text-8xl text-gray-900 tracking-tight mb-2">
          4<span className="text-brand-red">0</span>4
        </h1>
        <h2 className="font-display font-bold text-2xl md:text-3xl text-gray-800 mb-6">
          Esta caja está vacía
        </h2>
        
        <p className="text-gray-500 text-lg max-w-lg mx-auto mb-10 leading-relaxed">
          La URL que buscas se ha esfumado del almacén. Puede que haya cambiado de nombre o que haya sido un error de tecleo. 
        </p>
        
        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Link 
            href="/catalog" 
            className="group flex items-center justify-center gap-2 bg-brand-red text-white font-semibold py-4 px-8 rounded-full shadow-lg shadow-brand-red/20 hover:scale-105 active:scale-95 transition-all w-full sm:w-auto"
          >
            <Search className="w-5 h-5" />
            Explorar catálogo
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Link>
          
          <Link 
            href="/" 
            className="flex items-center justify-center gap-2 bg-white text-gray-700 border-2 border-gray-100 font-semibold py-4 px-8 rounded-full hover:border-gray-200 hover:bg-gray-50 active:scale-95 transition-all w-full sm:w-auto"
          >
            <Home className="w-5 h-5 text-gray-400" />
            Volver a inicio
          </Link>
        </div>

      </div>
    </div>
  );
}
