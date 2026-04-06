import Link from "next/link";
import { Gift } from "lucide-react";
import Image from "next/image";

export function Footer() {
  return (
    <footer className="bg-gray-900 text-white mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-12 pb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-10">
          {/* Brand */}
          <div className="md:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <Image src="/images/logo.svg" alt="Universo Merchan" width={200} height={32} className="h-8 w-auto" />
            </div>
            <p className="text-sm text-white leading-relaxed max-w-xs">
              Consigue que tu marca se recuerde. Regalos corporativos que generan emociones y conexiones reales.
            </p>
            <p className="text-sm text-white mt-3">#GeneraEmociones</p>
          </div>

          {/* Catalog */}
          <div>
            <h3 className="font-display font-bold text-sm text-white mb-4">Catálogo</h3>
            {[
              { label: "Botellas y termos", search: "botella" },
              { label: "Libretas y blocs", search: "libreta" },
              { label: "Textil", search: "camiseta" },
              { label: "Bolsas", search: "bolsa" },
              { label: "Tazas y vasos", search: "taza" },
              { label: "Escritura", search: "bolígrafo" }
            ].map((c) => (
              <Link key={c.label} href={`/catalog?search=${encodeURIComponent(c.search)}`} className="block text-sm text-white hover:text-white mb-2 transition-colors">
                {c.label}
              </Link>
            ))}
          </div>

          {/* Company */}
          <div>
            <h3 className="font-display font-bold text-sm text-white mb-4">Empresa</h3>
            {[
              { label: "Sobre nosotros", href: "/#sobre-nosotros" },
              { label: "Cómo funciona", href: "/#como-funciona" },
              { label: "Contacto", href: "/#contacto" },
            ].map((l) => (
              <Link key={l.label} href={l.href} className="block text-sm text-white hover:text-white mb-2 transition-colors">
                {l.label}
              </Link>
            ))}
          </div>

          {/* Legal */}
          <div>
            <h3 className="font-display font-bold text-sm text-white mb-4">Legal</h3>
            {[
              { label: "Política de Privacidad", href: "/legal/privacidad" },
              { label: "Política de Cookies", href: "/legal/cookies" },
              { label: "Aviso Legal", href: "/legal/aviso-legal" },
              { label: "Términos y Condiciones", href: "/legal/terminos" },
            ].map((l) => (
              <Link key={l.label} href={l.href} className="block text-sm text-white hover:text-white mb-2 transition-colors">
                {l.label}
              </Link>
            ))}
          </div>

          {/* Contact */}
          <div>
            <h3 className="font-display font-bold text-sm text-white mb-4">Contacto</h3>
            <p className="text-sm text-white mb-2">pedidos@universomerchan.com</p>
            <p className="text-sm text-white mb-2">Madrid, España</p>
          </div>
        </div>

        <div className="border-t border-gray-800 pt-5 flex flex-col sm:flex-row justify-between items-center gap-2">
          <span className="text-sm text-white">© {new Date().getFullYear()} Universo Merchan. Todos los derechos reservados.</span>
          <span className="text-sm text-white">Producción 80% europea · Entrega &lt;10 días</span>
        </div>
      </div>
    </footer>
  );
}
