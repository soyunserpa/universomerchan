"use client";

// ============================================================
// UNIVERSO MERCHAN — Catálogo "Revista" (Flipbook)
// ============================================================
// Visor tipo revista con pasar-página real (CSS 3D), swipe en
// móvil y teclado. Lee los productos en vivo (vía props desde el
// server). El botón "Descargar catálogo" abre el imán de leads.
// Sin dependencias externas.
// ============================================================

import { useMemo, useState, useCallback, useEffect, useRef } from "react";
import { Link } from "@/i18n/routing";
import { ChevronLeft, ChevronRight, Download } from "lucide-react";
import type { MagazineData, MagazineProduct } from "@/lib/catalog-magazine";
import { CatalogLeadModal } from "@/components/catalog/CatalogLeadModal";

const PRODUCTS_PER_PAGE = 4; // 2x2 por página

type Page =
  | { type: "cover" }
  | { type: "category"; category: string; displayName: string; productCount: number; slug: string; products: MagazineProduct[]; partIndex: number; partTotal: number }
  | { type: "back" };

interface Props {
  data: MagazineData;
  labels: {
    title: string;
    tagline: string;
    swipeHint: string;
    downloadCta: string;
    from: string;            // "Desde"
    view: string;            // "Ver producto"
    products: string;        // "productos"
    page: string;            // "Página"
    of: string;              // "de"
    backTitle: string;
    backText: string;
    backCta: string;
    europe: string;          // "Producción europea · Entrega <10 días"
  };
  year: number;
}

export function CatalogFlipbook({ data, labels, year }: Props) {
  // ── Construir el array de páginas a partir de las categorías ──
  const pages = useMemo<Page[]>(() => {
    const out: Page[] = [{ type: "cover" }];
    for (const cat of data.categories) {
      const chunks: MagazineProduct[][] = [];
      for (let i = 0; i < cat.products.length; i += PRODUCTS_PER_PAGE) {
        chunks.push(cat.products.slice(i, i + PRODUCTS_PER_PAGE));
      }
      chunks.forEach((chunk, idx) =>
        out.push({
          type: "category",
          category: cat.name,
          displayName: cat.displayName,
          productCount: cat.productCount,
          slug: cat.slug,
          products: chunk,
          partIndex: idx,
          partTotal: chunks.length,
        })
      );
    }
    out.push({ type: "back" });
    return out;
  }, [data]);

  const total = pages.length;
  const [page, setPage] = useState(0);
  const [flip, setFlip] = useState<null | "next" | "prev">(null);
  const [modalOpen, setModalOpen] = useState(false);
  const touchX = useRef<number | null>(null);

  const canPrev = page > 0;
  const canNext = page < total - 1;

  const goNext = useCallback(() => {
    setFlip((f) => (f ? f : page < total - 1 ? "next" : null));
  }, [page, total]);
  const goPrev = useCallback(() => {
    setFlip((f) => (f ? f : page > 0 ? "prev" : null));
  }, [page]);

  // Al terminar la animación, consolidamos el cambio de página.
  const onFlipEnd = useCallback(() => {
    setFlip((f) => {
      if (f === "next") setPage((p) => Math.min(p + 1, total - 1));
      if (f === "prev") setPage((p) => Math.max(p - 1, 0));
      return null;
    });
  }, [total]);

  // Teclado
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (modalOpen) return;
      if (e.key === "ArrowRight") goNext();
      if (e.key === "ArrowLeft") goPrev();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [goNext, goPrev, modalOpen]);

  // Swipe
  const onTouchStart = (e: React.TouchEvent) => { touchX.current = e.touches[0].clientX; };
  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchX.current == null) return;
    const dx = e.changedTouches[0].clientX - touchX.current;
    if (Math.abs(dx) > 45) { dx < 0 ? goNext() : goPrev(); }
    touchX.current = null;
  };

  // Saltar a una categoría
  const jumpToCategory = (slug: string) => {
    const idx = pages.findIndex((p) => p.type === "category" && p.slug === slug && (p as any).partIndex === 0);
    if (idx >= 0) { setFlip(null); setPage(idx); }
  };

  const openDownload = () => setModalOpen(true);

  // Páginas a renderizar durante el flip
  const nextPageData = flip === "next" ? pages[Math.min(page + 1, total - 1)] : null;
  const prevPageData = flip === "prev" ? pages[Math.max(page - 1, 0)] : null;

  return (
    <div className="w-full">
      {/* Navegación por categorías */}
      <div className="max-w-5xl mx-auto px-4 mb-5 flex flex-wrap gap-2 justify-center">
        {data.categories.map((c) => (
          <button
            key={c.slug}
            onClick={() => jumpToCategory(c.slug)}
            className="px-3 py-1.5 rounded-full text-xs font-semibold bg-white border border-surface-200 text-gray-700 hover:bg-brand-red hover:text-white hover:border-brand-red transition-colors"
          >
            {c.displayName}
          </button>
        ))}
      </div>

      {/* Libro */}
      <div
        className="um-book-perspective relative mx-auto"
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        <div className="um-book relative mx-auto bg-white rounded-2xl shadow-2xl overflow-hidden">
          {/* Página base (la que se ve por debajo) */}
          <div className="um-page absolute inset-0">
            {flip === "next" && nextPageData
              ? <PageView page={nextPageData} labels={labels} year={year} onDownload={openDownload} />
              : flip === "prev"
                ? <PageView page={pages[page]} labels={labels} year={year} onDownload={openDownload} />
                : <PageView page={pages[page]} labels={labels} year={year} onDownload={openDownload} />}
          </div>

          {/* Página que se voltea (overlay animado) */}
          {flip === "next" && (
            <div className="um-page um-flip-next absolute inset-0 z-20" onAnimationEnd={onFlipEnd}>
              <PageView page={pages[page]} labels={labels} year={year} onDownload={openDownload} />
              <span className="um-shade" />
            </div>
          )}
          {flip === "prev" && prevPageData && (
            <div className="um-page um-flip-prev absolute inset-0 z-20" onAnimationEnd={onFlipEnd}>
              <PageView page={prevPageData} labels={labels} year={year} onDownload={openDownload} />
              <span className="um-shade" />
            </div>
          )}
        </div>

        {/* Flechas */}
        <button
          aria-label="Anterior"
          onClick={goPrev}
          disabled={!canPrev}
          className="absolute left-1 sm:-left-5 top-1/2 -translate-y-1/2 z-30 w-10 h-10 rounded-full bg-white shadow-lg flex items-center justify-center text-gray-700 hover:text-brand-red disabled:opacity-30 disabled:cursor-not-allowed transition"
        >
          <ChevronLeft size={22} />
        </button>
        <button
          aria-label="Siguiente"
          onClick={goNext}
          disabled={!canNext}
          className="absolute right-1 sm:-right-5 top-1/2 -translate-y-1/2 z-30 w-10 h-10 rounded-full bg-white shadow-lg flex items-center justify-center text-gray-700 hover:text-brand-red disabled:opacity-30 disabled:cursor-not-allowed transition"
        >
          <ChevronRight size={22} />
        </button>
      </div>

      {/* Barra inferior: progreso + descargar */}
      <div className="max-w-3xl mx-auto px-4 mt-6 flex flex-col items-center gap-4">
        <div className="w-full flex items-center gap-3">
          <span className="text-xs font-medium text-gray-500 whitespace-nowrap">
            {labels.page} {page + 1} {labels.of} {total}
          </span>
          <input
            type="range"
            min={0}
            max={total - 1}
            value={page}
            onChange={(e) => { setFlip(null); setPage(Number(e.target.value)); }}
            className="flex-1 accent-brand-red cursor-pointer"
            aria-label="Ir a página"
          />
        </div>
        <button
          onClick={openDownload}
          className="inline-flex items-center gap-2 bg-brand-red text-white font-bold px-7 py-3 rounded-full hover:bg-red-700 transition shadow-md hover:-translate-y-0.5"
        >
          <Download size={18} /> {labels.downloadCta}
        </button>
        <p className="text-xs text-gray-400">{labels.swipeHint}</p>
      </div>

      <CatalogLeadModal open={modalOpen} onClose={() => setModalOpen(false)} />

      {/* Estilos del flipbook (sin dependencias) */}
      <style>{`
        .um-book-perspective { perspective: 2200px; max-width: 480px; padding: 0 8px; }
        .um-book { width: 100%; aspect-ratio: 3 / 4; }
        .um-page { transform-style: preserve-3d; backface-visibility: hidden; will-change: transform; }
        .um-shade { position:absolute; inset:0; pointer-events:none; background: linear-gradient(90deg, rgba(0,0,0,0) 60%, rgba(0,0,0,0.18)); opacity:0; }
        @keyframes umFlipNext {
          0%   { transform: rotateY(0deg);    box-shadow: 0 0 0 rgba(0,0,0,0); }
          100% { transform: rotateY(-178deg); box-shadow: -30px 0 40px rgba(0,0,0,0.25); }
        }
        @keyframes umFlipPrev {
          0%   { transform: rotateY(178deg);  box-shadow: 30px 0 40px rgba(0,0,0,0.25); }
          100% { transform: rotateY(0deg);    box-shadow: 0 0 0 rgba(0,0,0,0); }
        }
        @keyframes umShadeIn { 0%{opacity:0} 50%{opacity:1} 100%{opacity:0} }
        .um-flip-next { transform-origin: left center; animation: umFlipNext 0.65s ease-in-out forwards; }
        .um-flip-prev { transform-origin: left center; animation: umFlipPrev 0.65s ease-in-out forwards; }
        .um-flip-next .um-shade, .um-flip-prev .um-shade { animation: umShadeIn 0.65s ease-in-out forwards; }
        @media (min-width: 768px) { .um-book-perspective { max-width: 560px; } }
      `}</style>
    </div>
  );
}

// ── Render de una página ──────────────────────────────────────
function PageView({
  page, labels, year, onDownload,
}: { page: Page; labels: Props["labels"]; year: number; onDownload: () => void }) {
  if (page.type === "cover") {
    return (
      <div className="w-full h-full bg-gradient-to-br from-brand-red to-red-800 text-white flex flex-col items-center justify-center text-center px-8 relative">
        <div className="absolute top-6 left-0 right-0 text-center">
          <span className="text-xs font-bold tracking-[0.3em] uppercase text-white/70">Universo Merchan</span>
        </div>
        <img src="/images/logo-white.svg" alt="Universo Merchan" className="h-12 w-auto mb-8 opacity-95"
             onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }} />
        <h1 className="font-display font-extrabold text-4xl sm:text-5xl leading-tight mb-3">{labels.title}</h1>
        <p className="text-2xl font-display font-bold mb-1">{year}</p>
        <p className="text-white/80 text-sm max-w-xs mt-4">{labels.tagline}</p>
        <p className="text-white/60 text-xs mt-10">{labels.europe}</p>
        <button
          onClick={onDownload}
          className="mt-8 inline-flex items-center gap-2 bg-white text-brand-red font-bold px-6 py-2.5 rounded-full hover:bg-black hover:text-white transition text-sm"
        >
          <Download size={16} /> {labels.downloadCta}
        </button>
        <p className="absolute bottom-5 left-0 right-0 text-center text-white/50 text-[11px]">{labels.swipeHint}</p>
      </div>
    );
  }

  if (page.type === "back") {
    return (
      <div className="w-full h-full bg-gradient-to-br from-gray-900 to-black text-white flex flex-col items-center justify-center text-center px-8">
        <h2 className="font-display font-extrabold text-3xl mb-4">{labels.backTitle}</h2>
        <p className="text-white/70 text-sm max-w-xs mb-8">{labels.backText}</p>
        <button
          onClick={onDownload}
          className="inline-flex items-center gap-2 bg-brand-red text-white font-bold px-6 py-3 rounded-full hover:bg-red-700 transition text-sm mb-4"
        >
          <Download size={16} /> {labels.backCta}
        </button>
        <p className="text-white/50 text-xs mt-6">universomerchan.com · #GeneraEmociones</p>
      </div>
    );
  }

  // Página de categoría
  return (
    <div className="w-full h-full bg-white flex flex-col px-5 sm:px-6 py-5">
      <div className="border-b border-surface-200 pb-3 mb-3 flex items-end justify-between">
        <div>
          <p className="text-[10px] font-bold tracking-widest uppercase text-brand-red">Universo Merchan</p>
          <h2 className="font-display font-extrabold text-xl sm:text-2xl text-gray-900 leading-tight">{page.displayName}</h2>
        </div>
        <span className="text-[11px] text-gray-400 whitespace-nowrap">
          {page.productCount} {labels.products}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3 flex-1 content-start">
        {page.products.map((p) => (
          <Link
            key={p.masterCode}
            href={`/product/${p.masterCode.toLowerCase()}`}
            className="group flex flex-col border border-surface-200 rounded-xl overflow-hidden hover:border-brand-red hover:shadow-md transition"
          >
            <div className="aspect-square bg-surface-50 flex items-center justify-center overflow-hidden">
              {p.image
                ? <img src={p.image} alt={p.name} loading="lazy"
                       className="w-full h-full object-contain mix-blend-multiply group-hover:scale-105 transition-transform" />
                : <span className="text-gray-300 text-xs">—</span>}
            </div>
            <div className="p-2.5 flex flex-col gap-0.5">
              <span className="text-xs font-semibold text-gray-900 line-clamp-2 leading-snug min-h-[2rem]">{p.name}</span>
              <span className="text-sm font-extrabold text-brand-red">{labels.from} {p.startingPriceRaw.toFixed(2)}€</span>
            </div>
          </Link>
        ))}
      </div>

      <div className="pt-3 mt-2 border-t border-surface-100 flex items-center justify-between">
        <span className="text-[10px] text-gray-300">universomerchan.com</span>
        {page.partTotal > 1 && (
          <span className="text-[10px] text-gray-300">{page.partIndex + 1}/{page.partTotal}</span>
        )}
      </div>
    </div>
  );
}
