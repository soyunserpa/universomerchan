import Link from "next/link";
import { Gift } from "lucide-react";

export function Footer() {
  return (
    <footer className="bg-gray-900 text-white mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-12 pb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-10">
          {/* Brand */}
          <div className="md:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <img src="/images/logo.svg" alt="Universo Merchan" className="h-8" />
            </div>
            <p className="text-sm text-gray-400 leading-relaxed max-w-xs">
              Consigue que tu marca se recuerde. Regalos corporativos que generan emociones y conexiones reales.
            </p>
            <p className="text-xs text-gray-500 mt-3">#GeneraEmociones</p>
          </div>

          {/* Catalog */}
          <div>
            <h4 className="font-display font-bold text-sm mb-4">Catálogo</h4>
            {["Botellas y termos", "Libretas y blocs", "Textil", "Bolsas", "Tazas y vasos", "Escritura"].map((c) => (
              <Link key={c} href={`/catalog?category=${encodeURIComponent(c)}`} className="block text-sm text-gray-400 hover:text-white mb-2 transition-colors">
                {c}
              </Link>
            ))}
          </div>

          {/* Company */}
          <div>
            <h4 className="font-display font-bold text-sm mb-4">Empresa</h4>
            {[
              { label: "Sobre nosotros", href: "/#sobre-nosotros" },
              { label: "Cómo funciona", href: "/#como-funciona" },
              { label: "Contacto", href: "/#contacto" },
            ].map((l) => (
              <Link key={l.label} href={l.href} className="block text-sm text-gray-400 hover:text-white mb-2 transition-colors">
                {l.label}
              </Link>
            ))}
          </div>

          {/* Legal */}
          <div>
            <h4 className="font-display font-bold text-sm mb-4">Legal</h4>
            {[
              { label: "Política de Privacidad", href: "/legal/privacidad" },
              { label: "Política de Cookies", href: "/legal/cookies" },
              { label: "Aviso Legal", href: "/legal/aviso-legal" },
              { label: "Términos y Condiciones", href: "/legal/terminos" },
            ].map((l) => (
              <Link key={l.label} href={l.href} className="block text-sm text-gray-400 hover:text-white mb-2 transition-colors">
                {l.label}
              </Link>
            ))}
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-display font-bold text-sm mb-4">Contacto</h4>
            <p className="text-sm text-gray-400 mb-2">pedidos@universomerchan.com</p>
            <p className="text-sm text-gray-400 mb-2">Madrid, España</p>
          </div>
        </div>

        <div className="border-t border-gray-800 pt-5 flex flex-col sm:flex-row justify-between items-center gap-2">
          <span className="text-xs text-gray-500">© {new Date().getFullYear()} Universo Merchan. Todos los derechos reservados.</span>
          <span className="text-xs text-gray-500">Producción 80% europea · Entrega &lt;10 días</span>
        </div>
      </div>
    </footer>
  );
}
