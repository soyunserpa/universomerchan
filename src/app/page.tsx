import Image from "next/image";
import Link from "next/link";
import { getCategories, getProductDetail } from "@/lib/catalog-api";
import { Search, Palette, ShoppingCart, Truck, Star, Leaf, ArrowRight } from "lucide-react";
import { AboutSection } from "@/components/home/AboutSection";
import { ContactSection } from "@/components/home/ContactSection";

export default async function HomePage() {
  // Fetch categories
  const categories = await getCategories();

  // Create collections of our dark/black variants
  const targetSkus = [
    { code: 'MO2230' }, // Valley Roll Up Backpack
    { code: 'S11500' }, // Imperial T-Shirt
    { code: 'MO9812' }, // Belo Bottle
    { code: 'MO8812' }  // Multipen
  ];

  const featuredList = [];
  
  // Use the native API method so all Price Margins are calculated accurately
  for (const t of targetSkus) {
    try {
      const p = await getProductDetail(t.code);
      if (p) {
        // Enforce the Black main image explicitly from variants if possible
        let mainImage = p.mainImage; // Fallback to whatever getProductByMasterCode computed
        if (p.variants && p.variants.length > 0) {
          const darkVariant = p.variants.find(v => v.color.toLowerCase().includes('negro') || v.color.toLowerCase().includes('black'));
          if (darkVariant && darkVariant.mainImage) {
            mainImage = darkVariant.mainImage;
          }
        }
        featuredList.push({ ...p, mainImage });
      }
    } catch(e) { /* silently skip over invalid SKUs */ }
  }

  return (
    <div>
      {/* ── HERO ──────────────────────────────────────────── */}
      <section className="bg-brand-red relative overflow-hidden">
        <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-white/5" />
        <div className="absolute -bottom-16 -left-16 w-64 h-64 rounded-full bg-white/[0.03]" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-16 sm:py-20 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center relative">
          <div>
            <div className="inline-flex items-center gap-1.5 bg-white/15 text-white text-sm font-semibold px-3 py-1 rounded-full mb-5">
              <Star size={11} /> +2.000 productos personalizables
            </div>
            <h1 className="font-display font-black text-4xl sm:text-5xl text-white leading-[1.05] mb-5">
              Consigue que tu marca se recuerde.
            </h1>
            <p className="text-base text-white leading-relaxed mb-8 max-w-lg">
              Regalos corporativos personalizados que generan emociones. Elige, personaliza, visualiza y recibe en menos de 10 días.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link href="/catalog" className="inline-flex items-center gap-2 bg-white text-brand-red font-semibold text-sm px-7 py-3 rounded-full hover:shadow-lg transition-all">
                Ver catálogo <ArrowRight size={16} />
              </Link>
              <a href="#como-funciona" className="inline-flex items-center gap-2 border-2 border-white/30 text-white font-medium text-sm px-7 py-3 rounded-full hover:bg-white/10 transition-all">
                Cómo funciona
              </a>
            </div>
          </div>

          {/* Featured products grid */}
          <div className="grid grid-cols-2 gap-3 animate-slide-up delay-2">
            {featuredList.map((p, i) => {
              const slug = p.name ? p.name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)+/g, "") : "";
              const productUrl = `/product/${p.masterCode.toLowerCase()}-${slug}`;
              return (
              <Link
                key={p.masterCode}
                href={productUrl}
                className={`bg-white rounded-2xl p-3 hover-lift ${i % 2 === 1 ? "translate-y-4" : ""}`}
              >
                <div className="w-full aspect-square bg-surface-50 rounded-xl flex items-center justify-center mb-2 overflow-hidden relative">
                  {p.mainImage ? (
                    <div className="w-[85%] h-[85%] flex items-center justify-center relative">
                      <img 
                        src={p.mainImage} 
                        alt={p.name} 
                        width={400}
                        height={400}
                        className="w-full h-full object-contain drop-shadow-lg" 
                        loading="lazy"
                        decoding="async"
                      />
                    </div>
                  ) : (
                    <div className="text-gray-200"><Palette size={32} /></div>
                  )}
                </div>
                <p className="text-sm font-semibold text-gray-900 truncate">{p.name}</p>
                <p className="text-sm font-bold text-brand-red">
                  {p.startingPrice || "Desde 0.00 €"}
                </p>
              </Link>
            )})}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ──────────────────────────────────── */}
      <section id="como-funciona" className="max-w-7xl mx-auto px-4 sm:px-6 py-16 sm:py-20">
        <div className="text-center mb-12">
          <h2 className="font-display font-extrabold text-3xl mb-3">¿Cómo funciona?</h2>
          <p className="text-gray-900 text-base">En 4 pasos simples, de la idea al producto en tu puerta</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {[
            { num: "01", Icon: Search, title: "Elige tu producto", desc: "Explora +2.000 productos con stock en tiempo real y filtros inteligentes" },
            { num: "02", Icon: Palette, title: "Personaliza", desc: "Elige técnica de impresión, sube tu logo y previsualiza el resultado" },
            { num: "03", Icon: ShoppingCart, title: "Presupuesta y compra", desc: "Precio en tiempo real, descarga PDF o compra directo con tarjeta" },
            { num: "04", Icon: Truck, title: "Recibe en <10 días", desc: "Aprueba el boceto online y sigue tu envío con tracking en tiempo real" },
          ].map((step, i) => (
            <div key={i} className={`bg-white rounded-2xl p-6 border border-surface-200 hover-lift relative animate-slide-up delay-${i + 1}`}>
              <span aria-hidden="true" className="font-display font-black text-5xl text-brand-red absolute top-3 right-4 select-none">{step.num}</span>
              <div className="w-11 h-11 rounded-xl bg-brand-red/10 flex items-center justify-center mb-4">
                <step.Icon size={20} className="text-brand-red" />
              </div>
              <h3 className="font-display font-bold text-lg mb-2">{step.title}</h3>
              <p className="text-sm text-gray-900 leading-relaxed">{step.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── ABOUT US ──────────────────────────────────────── */}
      <AboutSection />

      {/* ── CATEGORIES ────────────────────────────────────── */}
      <section className="bg-gray-900 py-14">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex justify-between items-center mb-8">
            <h2 className="font-display font-extrabold text-2xl sm:text-3xl text-white">Categorías populares</h2>
            <Link href="/catalog" className="text-sm text-white hover:text-white flex items-center gap-1 transition-colors">
              Ver todo <ArrowRight size={14} />
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {(categories.length > 0 ? categories.slice(0, 6) : [
              { name: "Botellas y termos", productCount: 340, slug: "botellas-y-termos" },
              { name: "Textil", productCount: 520, slug: "textil" },
              { name: "Bolsas", productCount: 280, slug: "bolsas" },
            ]).map((cat, i) => {
              const colors = ["#1E3A8A", "#B8001A", "#047857", "#6D28D9", "#9A3412", "#155E75"];
              const bg = colors[i % colors.length];
              return (
                <Link
                  key={cat.name}
                  href={`/catalog?category=${encodeURIComponent(cat.name)}`}
                  className="rounded-2xl p-7 hover-lift relative overflow-hidden min-h-[140px]"
                  style={{ background: bg }}
                >
                  <div className="absolute -top-8 -right-8 w-28 h-28 rounded-full bg-white/10" />
                  <h3 className="font-display font-extrabold text-xl text-white mb-1 relative">{cat.name}</h3>
                  <p className="text-white text-sm relative">{cat.productCount}+ productos</p>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── TRUST BADGES ──────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-14">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 text-center">
          {[
            { num: "2.000+", label: "Productos" },
            { num: "< 10", label: "Días de entrega" },
            { num: "80%", label: "Producción europea" },
            { num: "17", label: "Técnicas de impresión" },
          ].map((b, i) => (
            <div key={i} className="py-4">
              <div className="font-display font-black text-3xl sm:text-4xl text-brand-red">{b.num}</div>
              <div className="text-sm text-gray-900 mt-1">{b.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── CONTACT ───────────────────────────────────────── */}
      <ContactSection />

      {/* ── CTA ───────────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 pb-16">
        <div className="bg-gray-900 rounded-3xl p-8 sm:p-12 text-center relative overflow-hidden">
          <div className="absolute -top-20 -left-20 w-60 h-60 rounded-full bg-brand-red/20" />
          <div className="absolute -bottom-16 -right-16 w-48 h-48 rounded-full bg-brand-red/10" />
          <div className="relative">
            <h2 className="font-display font-black text-3xl text-white mb-4">¿Listo para emocionar?</h2>
            <p className="text-white mb-8 max-w-md mx-auto">
              Explora nuestro catálogo, personaliza tus productos y recíbelos en menos de 10 días.
            </p>
            <Link href="/catalog" className="inline-flex items-center gap-2 bg-brand-red text-white font-semibold text-sm px-8 py-3.5 rounded-full hover:bg-brand-red-dark transition-colors">
              Explorar catálogo <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
