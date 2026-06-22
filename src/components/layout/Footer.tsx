import { Link } from "@/i18n/routing";
import { Gift } from "lucide-react";
import Image from "next/image";
import { useTranslations } from "next-intl";

export function Footer() {
  const t = useTranslations("Footer");
  return (
    <footer className="bg-gray-900 text-white mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-12 pb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-10">
          {/* Brand */}
          <div className="md:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <Image src="/logos/universo-merchan-white.png" alt="Universo Merchan" width={200} height={40} className="h-10 w-auto" />
            </div>
            <p className="text-sm text-white leading-relaxed max-w-xs">
              {t("brand_tagline")}
            </p>
            <p className="text-sm text-white mt-3">#GeneraEmociones</p>
          </div>

          {/* Catalog */}
          <div>
            <h3 className="font-display font-bold text-sm text-white mb-4">{t("catalog")}</h3>
            {[
              { label: t("cat_bottles"), search: "botella" },
              { label: t("cat_notebooks"), search: "libreta" },
              { label: t("cat_textile"), search: "camiseta" },
              { label: t("cat_bags"), search: "bolsa" },
              { label: t("cat_mugs"), search: "taza" },
              { label: t("cat_writing"), search: "bolígrafo" }
            ].map((c) => (
              <Link key={c.search} href={`/catalog?search=${encodeURIComponent(c.search)}`} className="block text-sm text-white hover:text-white mb-2 transition-colors">
                {c.label}
              </Link>
            ))}
          </div>

          {/* Company */}
          <div>
            <h3 className="font-display font-bold text-sm text-white mb-4">{t("company")}</h3>
            {[
              { label: t("ai_assistant"), href: "/quiz" },
              { label: t("about"), href: "/#sobre-nosotros" },
              { label: t("how_it_works"), href: "/#como-funciona" },
              { label: t("contact"), href: "/#contacto" },
            ].map((l) => (
              <Link key={l.href} href={l.href} className="block text-sm text-white hover:text-white mb-2 transition-colors">
                {l.label}
              </Link>
            ))}
          </div>

          {/* Legal */}
          <div>
            <h3 className="font-display font-bold text-sm text-white mb-4">{t("legal")}</h3>
            {[
              { label: t("privacy"), href: "/legal/privacidad" },
              { label: t("cookies"), href: "/legal/cookies" },
              { label: t("legal_notice"), href: "/legal/aviso-legal" },
              { label: t("terms"), href: "/legal/terminos" },
            ].map((l) => (
              <Link key={l.href} href={l.href} className="block text-sm text-white hover:text-white mb-2 transition-colors">
                {l.label}
              </Link>
            ))}
          </div>

          {/* Contact */}
          <div>
            <h3 className="font-display font-bold text-sm text-white mb-4">{t("contact_heading")}</h3>
            <p className="text-sm text-white mb-2">pedidos@universomerchan.com</p>
            <p className="text-sm text-white mb-2">{t("location")}</p>
          </div>
        </div>

        <div className="border-t border-gray-800 pt-5 flex flex-col sm:flex-row justify-between items-center gap-2">
          <span className="text-sm text-white">© {new Date().getFullYear()} Universo Merchan. {t("all_rights")}</span>
          <span className="text-sm text-white">{t("europe_note")}</span>
        </div>
      </div>
    </footer>
  );
}
