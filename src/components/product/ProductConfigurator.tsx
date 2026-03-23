"use client";

import { useState, useCallback, useRef, useMemo } from "react";
import { useCart } from "@/lib/cart-store";
import { useAuth } from "@/lib/auth-context";
import type { ProductDetailResponse } from "@/lib/catalog-api";
import {
  Leaf, ShoppingCart, Palette, Eye, ArrowLeft,
  Check, Download, Minus, Plus, Info, Gift,
  Layers, Loader2
} from "lucide-react";
import { ProductCanvasEditor, PreviewWithLogo, type CanvasEditorRef, type PrintZone, type LogoPlacement } from "./ProductCanvasEditor";

// ============================================================
// CONSTANTS
// ============================================================

// Default margins (in production these come from admin_settings via API)
const MARGINS = { productMarginPct: 40, printMarginPct: 50, clientDiscountPct: 0 };
const CANVAS_SIZE = 600;

// ============================================================
// REAL PRICE CALCULATION — From Midocean print_prices data
// ============================================================

/** Parse EU number format "1.000,50" → 1000.5 */
function parseEU(val: any): number {
  if (!val || val === "") return 0;
  if (typeof val === "number") return val;
  return parseFloat(String(val).replace(/\./g, "").replace(",", ".")) || 0;
}

interface TechniquePricing {
  setup: number;
  setupRepeat: number;
  nextColourCostIndicator: boolean;
  varCosts: Array<{
    rangeId: string;
    areaFrom: number;
    areaTo: number;
    scales: Array<{
      minimumQuantity: number;
      price: number;
      nextPrice: number;
    }>;
  }>;
}

/**
 * Calculate print cost using REAL Midocean pricing data.
 * Implements all 4 Midocean pricing types:
 * - NumberOfColours: price per unit scales by qty, multiplied by colors (1st color = price, 2nd+ = next_price)
 * - NumberOfPositions: price per unit scales by qty, per position (no color dimension)
 * - AreaRange: price depends on print area, scales by qty
 * - ColourAreaRange: combination of area + colors
 */
function calculateRealPrintCost(params: {
  pricing: TechniquePricing;
  pricingType: string;
  quantity: number;
  numColors: number;
  printAreaMm2?: number;  // For area-based techniques
  isRepeatOrder?: boolean;
}): { setupCost: number; printCostPerUnit: number; printCostTotal: number } {
  const { pricing, pricingType, quantity, numColors, printAreaMm2, isRepeatOrder } = params;

  // Setup cost
  const setupCost = isRepeatOrder ? (pricing.setupRepeat || 0) : (pricing.setup || 0);

  // Find the right var_costs range
  let selectedRange = pricing.varCosts?.[0]; // Default: first range

  if (pricingType === "AreaRange" || pricingType === "ColourAreaRange") {
    // Find range matching the print area
    const area = printAreaMm2 || 0;
    for (const range of pricing.varCosts || []) {
      if (area >= range.areaFrom && area <= range.areaTo) {
        selectedRange = range;
        break;
      }
    }
    // If no match, use the smallest range that covers it, or the last one
    if (!selectedRange && pricing.varCosts?.length) {
      selectedRange = pricing.varCosts[pricing.varCosts.length - 1];
    }
  }

  if (!selectedRange?.scales?.length) {
    return { setupCost, printCostPerUnit: 0, printCostTotal: 0 };
  }

  // Find the right scale for the quantity
  const sortedScales = [...selectedRange.scales].sort((a, b) => a.minimumQuantity - b.minimumQuantity);
  let selectedScale = sortedScales[0];
  for (const scale of sortedScales) {
    if (quantity >= scale.minimumQuantity) {
      selectedScale = scale;
    }
  }

  // Calculate per-unit print cost based on pricing type
  let printCostPerUnit = 0;

  switch (pricingType) {
    case "NumberOfColours": {
      // 1st color: price, each additional color: next_price (if nextColourCostIndicator)
      const firstColorCost = selectedScale.price;
      const additionalColorCost = pricing.nextColourCostIndicator
        ? selectedScale.nextPrice
        : selectedScale.price;  // If no indicator, same price per additional color

      if (numColors <= 1) {
        printCostPerUnit = firstColorCost;
      } else {
        printCostPerUnit = firstColorCost + (additionalColorCost * (numColors - 1));
      }
      break;
    }
    case "NumberOfPositions": {
      // Price is per position, no color dimension
      printCostPerUnit = selectedScale.price;
      break;
    }
    case "AreaRange": {
      // Price based on area range, no color dimension
      printCostPerUnit = selectedScale.price;
      break;
    }
    case "ColourAreaRange": {
      // Combination: area determines range, then multiply by colors
      const firstColorCost = selectedScale.price;
      const additionalColorCost = pricing.nextColourCostIndicator
        ? selectedScale.nextPrice
        : selectedScale.price;

      if (numColors <= 1) {
        printCostPerUnit = firstColorCost;
      } else {
        printCostPerUnit = firstColorCost + (additionalColorCost * (numColors - 1));
      }
      break;
    }
    default:
      printCostPerUnit = selectedScale.price;
  }

  return {
    setupCost,
    printCostPerUnit,
    printCostTotal: printCostPerUnit * quantity,
  };
}

// ============================================================
// COMPONENT
// ============================================================

interface Props {
  product: ProductDetailResponse;
}

export function ProductConfigurator({ product }: Props) {
  const { addItem } = useCart();
  const { user } = useAuth();
  const canvasEditorRef = useRef<CanvasEditorRef>(null);

  // State
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [variantIdx, setVariantIdx] = useState(0);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [baseQty, setBaseQty] = useState(50);
  const [sizeQuantities, setSizeQuantities] = useState<Record<string, number>>({});
  const [selectedPosition, setSelectedPosition] = useState<string | null>(null);
  const [selectedTechnique, setSelectedTechnique] = useState<string | null>(null);
  const [numColors, setNumColors] = useState(1);
  const [logoPlacements, setLogoPlacements] = useState<LogoPlacement[]>([]);
  const [pdfGenerating, setPdfGenerating] = useState(false);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [cachedMockups, setCachedMockups] = useState<Record<string, string>>({});

  // ── TEXTILE / SIZE LOGIC ──────────────────────────────────
  const hasSize = product.hasSize;

  const qty = hasSize
    ? Math.max(0, Object.values(sizeQuantities).reduce((a, b) => a + b, 0))
    : baseQty;

  // Group variants by color (for textiles: multiple sizes per color)
  const colorGroups = useMemo(() => {
    const groups = new Map<string, typeof product.variants>();
    for (const v of product.variants) {
      const key = v.colorCode || v.color;
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(v);
    }
    return groups;
  }, [product.variants]);

  // Unique colors (one per color group — use first variant of each group)
  const uniqueColors = useMemo(() => {
    const seen = new Set<string>();
    return product.variants.filter(v => {
      const key = v.colorCode || v.color;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [product.variants]);

  const variant = product.variants[variantIdx];
  const currentColorKey = variant.colorCode || variant.color;

  // Stock logic
  const maxStock = variant.stock || 0;
  const isOutOfStock = maxStock <= 0;
  const isOverStock = !hasSize && qty > maxStock;
  const canProceed = !isOutOfStock && !isOverStock && qty > 0;

  // Available sizes for current color (sorted S → 5XL)
  const sizesForColor = useMemo(() => {
    if (!hasSize) return [];
    const sizeOrder = ["XXS", "XS", "S", "M", "L", "XL", "2XL", "XXL", "3XL", "XXXL", "4XL", "5XL"];
    const variants = colorGroups.get(currentColorKey) || [];
    return variants
      .filter(v => v.size)
      .sort((a, b) => {
        const ai = sizeOrder.indexOf(a.size!.toUpperCase());
        const bi = sizeOrder.indexOf(b.size!.toUpperCase());
        return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
      });
  }, [hasSize, colorGroups, currentColorKey]);

  // Auto-sync size selection when color changes (textile products)
  // When the user picks a new color via the existing color selector (setVariantIdx),
  // we detect the color change and auto-select the first available size for that color.
  const prevColorRef = useRef(currentColorKey);
  useMemo(() => {
    if (!hasSize) return;
    if (prevColorRef.current !== currentColorKey) {
      // Color changed — pick first available size for the new color
      const sizesInColor = colorGroups.get(currentColorKey) || [];
      const firstSize = sizesInColor.find(v => v.size);
      if (firstSize) {
        setSelectedSize(firstSize.size || null);
        const realIdx = product.variants.indexOf(firstSize);
        if (realIdx >= 0 && realIdx !== variantIdx) setVariantIdx(realIdx);
      }
      prevColorRef.current = currentColorKey;
    }
  }, [hasSize, currentColorKey, colorGroups, product.variants, variantIdx]);

  // When user picks a size within the same color
  const handleSizeSelect = useCallback((size: string) => {
    setSelectedSize(size);
    const match = sizesForColor.find(v => v.size === size);
    if (match) {
      const realIdx = product.variants.indexOf(match);
      if (realIdx >= 0) setVariantIdx(realIdx);
    }
  }, [sizesForColor, product.variants]);

  // Initialize selectedSize on first render for textile products
  useMemo(() => {
    if (hasSize && !selectedSize && variant.size) {
      setSelectedSize(variant.size);
    }
  }, [hasSize, selectedSize, variant.size]);

  // ── PRODUCT PRICE (from variant price or price scales) ────

  const getUnitPrice = useCallback((forVariantSku = variant.sku) => {
    // Try per-variant pricing scales first (more accurate for textiles)
    let vp = (product as any).variantPrices?.[forVariantSku];
    if (!vp && (product as any).variantPrices) {
      const matchedKey = Object.keys((product as any).variantPrices).find(k => k.startsWith(forVariantSku + "-"));
      if (matchedKey) vp = (product as any).variantPrices[matchedKey];
    }
    if (vp && vp.scales && vp.scales.length > 0) {
      // Use quantity-scaled sell price
      const sorted = [...vp.scales].sort((a: any, b: any) => a.minQuantity - b.minQuantity);
      let price = sorted[0].priceSell || product.startingPriceRaw;
      for (const s of sorted) {
        if (qty >= s.minQuantity) price = s.priceSell;
      }
      return price;
    }

    // Fallback to product-level price scales if variant doesn't have specific scales
    if (product.priceScales && product.priceScales.length > 0) {
      const sorted = [...product.priceScales].sort((a: any, b: any) => a.minQuantity - b.minQuantity);
      let unitPrice = sorted[0].pricePerUnitRaw;
      for (const scale of sorted) {
        if (qty >= scale.minQuantity) unitPrice = scale.pricePerUnitRaw;
      }
      return unitPrice;
    }

    return vp?.priceSell || product.startingPriceRaw;
  }, [qty, product.priceScales, product.startingPriceRaw, variant.sku, (product as any).variantPrices]);

  const unitProductPrice = getUnitPrice();
  const basePrice = unitProductPrice * qty;

  // ── PRINT POSITION & TECHNIQUE DATA ───────────────────────

  const positionData = product.printPositions.find(p => p.positionId === selectedPosition);
  const techniqueData = positionData?.techniques.find(t => t.techniqueId === selectedTechnique);
  const pricingType = techniqueData?.pricing?.varCosts?.length
    ? techniqueData.pricingType
    : techniqueData?.pricingType || "NumberOfColours";

  const isAreaBased = pricingType === "AreaRange" || pricingType === "ColourAreaRange";
  const isPositionBased = pricingType === "NumberOfPositions";
  const isColorBased = pricingType === "NumberOfColours" || pricingType === "ColourAreaRange";

  // ── REAL PRINT PRICING ────────────────────────────────────

  const printMarginMultiplier = 1 + MARGINS.printMarginPct / 100;

  // Calculate print area from position max dimensions
  const printAreaMm2 = positionData ? (positionData.maxWidth * positionData.maxHeight) : 0;

  // Effective colors (area-only and position-only techniques = 1)
  const effectiveColors = (isAreaBased && !isColorBased) || isPositionBased ? 1 : numColors;

  const printCosts = useMemo(() => {
    if (!techniqueData?.pricing) {
      return { setupCost: 0, printCostPerUnit: 0, printCostTotal: 0 };
    }
    return calculateRealPrintCost({
      pricing: techniqueData.pricing,
      pricingType,
      quantity: qty,
      numColors: effectiveColors,
      printAreaMm2,
      isRepeatOrder: false,
    });
  }, [techniqueData, pricingType, qty, effectiveColors, printAreaMm2]);

  // Handling cost from product's print_manipulation code
  const handlingInfo = product.printPositions[0]?.handlingInfo;
  const handlingCostPerUnit = handlingInfo?.pricePerUnit || 0;

  // Apply margins to all print costs
  const setupCost = round(printCosts.setupCost * printMarginMultiplier);
  const printPerUnit = round(printCosts.printCostPerUnit * printMarginMultiplier);
  const printTotal = round(printPerUnit * qty);
  const handlingTotal = selectedTechnique ? round(handlingCostPerUnit * qty * printMarginMultiplier) : 0;
  const total = round(basePrice + setupCost + printTotal + handlingTotal);
  const perUnit = qty > 0 ? round(total / qty) : 0;

  // ── PRINT ZONES for Canvas Editor ──────────────────────────

  const printZones: PrintZone[] = useMemo(() => product.printPositions.map(pos => ({
    positionId: pos.positionId,
    positionName: pos.description,
    maxWidthMm: pos.maxWidth || 100,
    maxHeightMm: pos.maxHeight || 100,
    points: pos.points || [
      { distance_from_left: 300, distance_from_top: 300, sequence_no: 1 },
      { distance_from_left: 700, distance_from_top: 700, sequence_no: 2 },
    ],
    imageBlank: pos.positionImageBlank || variant.mainImage || "",
    imageWithArea: (pos as any).positionImage || variant.mainImage || "",
    imageVariants: (pos as any).positionImageVariants || [],
  })), [product.printPositions, variant.mainImage]);

  const hasLogos = logoPlacements.length > 0;

  // Sync canvas zone selection with configurator position
  const handleCanvasZoneChange = useCallback((zoneId: string) => {
    setSelectedPosition(zoneId);
    setSelectedTechnique(null);
  }, []);

  // ── ADD TO CART ────────────────────────────────────────────

  const handleAddToCart = async () => {
    setIsAddingToCart(true);
    try {
      let mockupUrl: string | null = null;
      let finalArtworkUrl: string | null = null;

      if (canvasEditorRef.current && hasLogos) {
        const mockups = await canvasEditorRef.current.exportAllMockups();
        const firstMockup = Object.values(mockups)[0];
        if (firstMockup) {
          try {
            const upRes = await fetch("/api/uploads/mockup", {
              method: "POST", headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ dataUrl: firstMockup, ref: product.masterCode + "-mockup" })
            });
            if (upRes.ok) mockupUrl = (await upRes.json()).url;
          } catch (e) { console.error("Mockup upload error:", e); }
        }
      }

      if (hasLogos && logoPlacements[0]?.logoDataUrl) {
        try {
          const extMatch = logoPlacements[0].logoFileName.match(/\.([a-zA-Z0-9]+)$/);
          const ext = extMatch ? extMatch[1] : undefined;

          const upRes = await fetch("/api/uploads/artwork", {
            method: "POST", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              dataUrl: logoPlacements[0].logoDataUrl,
              ref: product.masterCode + "-artwork",
              extension: ext
            })
          });
          if (upRes.ok) finalArtworkUrl = (await upRes.json()).url;
        } catch (e) { console.error("Artwork upload error:", e); }
      }

      const customizationPayload = selectedTechnique && hasLogos ? {
        positions: logoPlacements.map(lp => {
          const posData = product.printPositions.find(p => p.positionId === lp.positionId);
          const techData = posData?.techniques.find(t => t.techniqueId === selectedTechnique);
          return {
            positionId: lp.positionId,
            positionName: posData?.description || lp.positionId,
            techniqueId: selectedTechnique!,
            techniqueName: techData?.name || selectedTechnique!,
            printWidthMm: posData?.maxWidth || 50,
            printHeightMm: posData?.maxHeight || 50,
            numColors: effectiveColors,
            pmsColors: [],
            instructions: "",
          };
        }),
        artworkUrl: finalArtworkUrl || logoPlacements[0]?.logoDataUrl || "",
        artworkFileName: logoPlacements[0]?.logoFileName || "",
        mockupUrl,
      } : null;

      const orderTypePayload = selectedTechnique && hasLogos ? "PRINT" : "NORMAL";

      if (hasSize) {
        for (const sv of sizesForColor) {
          const sizeQty = sizeQuantities[sv.size!] || 0;
          if (sizeQty > 0) {
            addItem({
              productMasterCode: product.masterCode,
              productName: product.name,
              variantSku: sv.sku,
              variantId: sv.sku,
              color: sv.color || variant.color,
              colorCode: sv.colorCode || variant.colorCode,
              size: sv.size,
              quantity: sizeQty,
              unitPriceProduct: getUnitPrice(sv.sku),
              unitPriceTotal: round(perUnit),
              totalPrice: round(perUnit * sizeQty),
              customization: customizationPayload,
              orderType: orderTypePayload,
              productImage: sv.mainImage || variant.mainImage,
            });
          }
        }
      } else {
        addItem({
          productMasterCode: product.masterCode,
          productName: product.name,
          variantSku: variant.sku,
          variantId: variant.sku,
          color: variant.color,
          colorCode: variant.colorCode,
          size: variant.size,
          quantity: qty,
          unitPriceProduct: unitProductPrice,
          unitPriceTotal: round(perUnit),
          totalPrice: round(total),
          customization: customizationPayload,
          orderType: orderTypePayload,
          productImage: variant.mainImage,
        });
      }
    } finally {
      setIsAddingToCart(false);
    }
  };

  // ── PDF DOWNLOAD ───────────────────────────────────────────

  const handleDownloadPDF = async () => {
    setPdfGenerating(true);
    try {
      console.log("[DEBUG] PDF: cachedMockups keys:", Object.keys(cachedMockups), "logoPlacements:", logoPlacements.length);
      // Upload cached mockups to server first, get public URLs
      const mockupUrls: Record<string, string> = {};
      for (const [posId, dataUrl] of Object.entries(cachedMockups)) {
        try {
          console.log("[DEBUG] Uploading mockup for", posId, "dataUrl starts:", dataUrl.substring(0, 50), "length:", dataUrl.length);
          const upRes = await fetch("/api/uploads/mockup", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ dataUrl, ref: product.masterCode + "-" + posId }),
          });
          if (upRes.ok) {
            const { url } = await upRes.json();
            if (url) mockupUrls[posId] = url;
          }
        } catch (e) { console.warn("Mockup upload failed for", posId, e); }
      }

      // Build zones data with uploaded mockup URLs (not base64)
      const zones = logoPlacements.map(lp => {
        const posData = product.printPositions.find(p => p.positionId === lp.positionId);
        const techData = posData?.techniques.find(t => t.techniqueId === selectedTechnique);
        return {
          positionId: lp.positionId,
          positionName: posData?.description || lp.positionId,
          techniqueId: selectedTechnique || "",
          techniqueName: techData?.name || selectedTechnique || "",
          numColors: effectiveColors,
          printWidthMm: posData?.maxWidth || 50,
          printHeightMm: posData?.maxHeight || 50,
          mockupUrl: mockupUrls[lp.positionId] || undefined,
        };
      });

      const response = await fetch("/api/quote/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          product: {
            name: product.name,
            masterCode: product.masterCode,
            color: variant.color,
            colorCode: variant.colorCode,
            size: hasSize ? Object.entries(sizeQuantities).filter(([_, q]) => (q as number) > 0).map(([s, q]) => `${q}x${s}`).join(", ") : variant.size || undefined,
            imageUrl: variant.mainImage || undefined,
            quantity: qty,
          },
          pricing: {
            unitProductPrice,
            productTotal: basePrice,
            setupCost,
            printPerUnit,
            printTotal,
            handlingPerUnit: round(handlingCostPerUnit * printMarginMultiplier),
            handlingTotal,
            grandTotal: total,
            perUnit,
          },
          zones,
          clientName: user?.firstName || "",
          clientEmail: user?.email || "",
          userId: user?.id,
        }),
      });
      if (!response.ok) throw new Error("Error generating PDF");
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Presupuesto-${product.masterCode}-${qty}uds.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("PDF generation error:", err);
      alert("Error: " + (err?.message || "desconocido") + ". Revisa consola (F12).");
    } finally {
      setPdfGenerating(false);
    }
  };

  // ── Indicative price for technique selection list ──────────

  function getTechIndicativePrice(tech: typeof techniqueData) {
    if (!tech?.pricing?.varCosts?.[0]?.scales?.length) return null;
    const costs = calculateRealPrintCost({
      pricing: tech.pricing,
      pricingType: tech.pricingType,
      quantity: qty,
      numColors: 1,
      printAreaMm2,
    });
    return {
      setup: round(costs.setupCost * printMarginMultiplier),
      perUnit: round(costs.printCostPerUnit * printMarginMultiplier),
    };
  }

  // ── RENDER ────────────────────────────────────────────────

  return (
    <div>
      {/* Step indicator */}
      <div className="flex gap-1 mb-8">
        {[{ n: 1, l: "Producto" }, { n: 2, l: "Personalización" }, { n: 3, l: "Resumen" }].map(s => (
          <div key={s.n} className="flex-1 cursor-pointer" onClick={() => s.n <= step ? setStep(s.n as any) : null}>
            <div className={`h-1 rounded-full mb-2 transition-colors duration-300 ${step >= s.n ? "bg-brand-red" : "bg-surface-200"}`} />
            <span className={`text-xs font-medium ${step === s.n ? "text-brand-red font-semibold" : "text-gray-400"}`}>
              Paso {s.n}: {s.l}
            </span>
          </div>
        ))}
      </div>

      {/* ── STEP 1: PRODUCT ──────────────────────────────── */}
      {step === 1 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 animate-fade-in">
          {/* Image */}
          <div>
            <div className="w-full aspect-square bg-surface-50 rounded-3xl flex items-center justify-center mb-3 overflow-hidden">
              {variant.mainImage ? (
                <img src={variant.mainImage} alt={product.name} className="w-[72%] h-[72%] object-contain" />
              ) : (
                <Gift size={60} className="text-gray-200" />
              )}
            </div>
            <div className="flex gap-2">
              {product.variants.slice(0, 6).map((v, i) => (
                <button
                  key={v.sku}
                  onClick={() => setVariantIdx(i)}
                  className={`w-14 h-14 rounded-xl bg-surface-50 border-2 flex items-center justify-center overflow-hidden transition-colors ${variantIdx === i ? "border-brand-red" : "border-surface-200"
                    }`}
                >
                  {v.mainImage ? <img src={v.mainImage} alt={v.color} className="w-[80%] h-[80%] object-contain" /> : <div className="w-6 h-6 rounded-full" style={{ background: v.colorHex }} />}
                </button>
              ))}
            </div>
          </div>

          {/* Product info */}
          <div>
            <div className="flex gap-2 mb-3">
              {product.isGreen && <span className="inline-flex items-center gap-1 bg-green-50 text-green-700 text-xs font-semibold px-2.5 py-0.5 rounded-full"><Leaf size={11} /> Sostenible</span>}
              <span className="bg-blue-50 text-blue-700 text-xs font-semibold px-2.5 py-0.5 rounded-full">REF: {product.masterCode}</span>
            </div>

            <h1 className="font-display font-extrabold text-3xl mb-2">{product.name} {product.shortDescription}</h1>
            {product.longDescription && <p className="text-xs text-gray-400 leading-relaxed mb-6">{product.longDescription}</p>}

            {/* Color selector */}
            <div className="mb-5">
              <label className="text-sm font-semibold mb-2 block">
                Color: <span className="text-brand-red">{variant.color}</span>
              </label>
              <div className="flex gap-2 flex-wrap">
                {uniqueColors.map((v) => {
                  const idx = product.variants.indexOf(v);
                  return (
                    <button
                      key={v.sku}
                      onClick={() => setVariantIdx(idx)}
                      className="w-8 h-8 rounded-full border-[3px] transition-all"
                      style={{
                        backgroundColor: v.colorHex,
                        borderColor: variant.color === v.color ? "#DE0121" : "#E8E8E8",
                        boxShadow: variant.color === v.color ? "0 0 0 2px white, 0 0 0 4px #DE0121" : "none",
                      }}
                      title={v.color}
                    />
                  );
                })}
              </div>
            </div>

            {/* Size selector & Quantities (textiles only) */}
            {hasSize && sizesForColor.length > 0 && (
              <div className="mb-5">
                <div className="flex justify-between items-baseline mb-3">
                  <label className="text-sm font-semibold block">Cantidades por talla</label>
                  <span className="text-xs bg-surface-100 text-gray-500 px-2 py-0.5 rounded-full font-medium">Total: {qty} uds</span>
                </div>
                <div className="flex flex-col gap-1 border border-surface-200 rounded-xl p-1 bg-white">
                  {sizesForColor.map((sv, idx) => {
                    const sizeStock = sv.stock;
                    const outOfStock = sizeStock <= 0;
                    const val = sizeQuantities[sv.size!] || 0;
                    return (
                      <div key={sv.sku} className={`flex items-center justify-between outline-none p-2 rounded-lg transition-colors ${outOfStock ? 'opacity-50 grayscale' : 'hover:bg-surface-50'} ${idx !== sizesForColor.length - 1 ? 'border-b border-surface-100' : ''}`}>
                        <div className="flex flex-col">
                          <span className="text-sm font-bold text-gray-800 mb-1">{sv.size}</span>
                          <div className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md w-fit ${sizeStock > 1000 ? "bg-green-50 text-green-700" : sizeStock > 0 ? "bg-amber-50 text-amber-700" : "bg-red-50 text-red-700"}`}>
                            <div className={`w-1.5 h-1.5 rounded-full ${sizeStock > 1000 ? "bg-green-500" : sizeStock > 0 ? "bg-amber-500" : "bg-red-500"}`} />
                            <span className="text-[10px] font-medium">
                              {sizeStock > 0 ? `${sizeStock} disponibles` : "Agotado"}
                            </span>
                          </div>
                        </div>
                        <input
                          title={`Cantidad talla ${sv.size}`}
                          placeholder="0"
                          type="number"
                          disabled={outOfStock}
                          value={val === 0 ? '' : val}
                          onChange={(e) => setSizeQuantities(prev => ({ ...prev, [sv.size!]: Math.max(0, parseInt(e.target.value) || 0) }))}
                          className="w-20 text-right py-1.5 px-3 text-sm font-bold bg-surface-100 border border-surface-200 rounded-lg outline-none focus:border-brand-red focus:bg-white disabled:cursor-not-allowed text-brand-red placeholder:text-gray-300 transition-all"
                        />
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Stock Indicator (Global) */}
            {!hasSize && (
              <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg mb-5 ${variant.stock > 1000 ? "bg-green-50" : variant.stock > 0 ? "bg-amber-50" : "bg-red-50"}`}>
                <div className={`w-2 h-2 rounded-full ${variant.stock > 1000 ? "bg-green-500" : variant.stock > 0 ? "bg-amber-500" : "bg-red-500"}`} />
                <span className="text-sm font-medium">
                  {variant.stock > 0
                    ? `${variant.stock.toLocaleString("es-ES")} unidades disponibles globales`
                    : "Agotado globalmente"}
                </span>
              </div>
            )}

            {/* Quantity (non-textiles) */}
            {!hasSize && (
              <div className="mb-5">
                <label className="text-sm font-semibold mb-2 block">Cantidad</label>
                <div className="flex items-center gap-3">
                  <button onClick={() => setBaseQty(Math.max(1, baseQty - 10))} disabled={isOutOfStock} title="Restar 10" className="w-9 h-9 rounded-lg border border-surface-200 flex items-center justify-center hover:bg-surface-50 disabled:opacity-50"><Minus size={14} /></button>
                  <input type="number" max={maxStock} title="Unidades" placeholder="1" value={baseQty} onChange={(e) => setBaseQty(Math.max(1, Math.min(maxStock, parseInt(e.target.value) || 1)))} disabled={isOutOfStock} className="w-20 text-center py-2 border-2 border-surface-200 rounded-lg text-base font-bold font-body outline-none disabled:opacity-50" />
                  <button onClick={() => setBaseQty(Math.min(maxStock, baseQty + 10))} disabled={isOutOfStock || baseQty >= maxStock} title="Sumar 10" className="w-9 h-9 rounded-lg border border-surface-200 flex items-center justify-center hover:bg-surface-50 disabled:opacity-50"><Plus size={14} /></button>
                  <div className="flex gap-1.5 ml-2">
                    {[50, 100, 250, 500].map(q => (
                      <button key={q} title={`Elegir ${q} unidades`} onClick={() => setBaseQty(q)} className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-colors ${baseQty === q ? "bg-brand-red/10 text-brand-red border border-brand-red" : "bg-surface-100 text-gray-400 border border-transparent hover:bg-surface-200"}`}>{q}</button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Price scales table */}
            {(() => {
              let vp = (product as any).variantPrices?.[variant.sku];
              if (!vp && (product as any).variantPrices) {
                const matchedKey = Object.keys((product as any).variantPrices).find(k => k.startsWith(variant.sku + "-"));
                if (matchedKey) vp = (product as any).variantPrices[matchedKey];
              }

              const rawScales = (vp && vp.scales && vp.scales.length > 0) ? vp.scales : (product.priceScales || []);
              const displayScales = [...rawScales].sort((a: any, b: any) => a.minQuantity - b.minQuantity);

              return displayScales.length > 1 ? (
                <div className="mb-5">
                  <label className="text-xs text-gray-400 mb-1.5 block">Precio por unidad según cantidad total</label>
                  <div className="flex gap-1.5 flex-wrap">
                    {displayScales.map((s: any, i: number) => {
                      const nextScale = displayScales[i + 1];
                      const isActive = qty >= s.minQuantity && (!nextScale || qty < nextScale.minQuantity);
                      const priceFormatted = s.pricePerUnit || (s.priceSell ? s.priceSell.toFixed(2) + "€" : "");

                      return (
                        <button key={s.minQuantity} title={hasSize ? "Ingresa la cantidad en las tallas" : `Sumar ${s.minQuantity} uds`} onClick={() => !hasSize && setBaseQty(s.minQuantity)} disabled={hasSize} className={`text-center px-3 py-2 rounded-lg text-xs transition-all ${isActive ? "bg-brand-red text-white font-bold shadow-sm scale-105" : qty >= s.minQuantity ? "bg-brand-red/10 text-brand-red font-semibold" : "bg-surface-100 text-gray-400"}`}>
                          <div>≥{s.minQuantity}</div>
                          <div className="font-bold">{priceFormatted}</div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ) : null;
            })()}

            <PriceBox basePrice={basePrice} setupCost={setupCost} printTotal={printTotal} handlingTotal={handlingTotal} total={total} perUnit={perUnit} unitProductPrice={unitProductPrice} qty={qty} hasPrint={!!selectedTechnique} printPerUnit={printPerUnit} numColors={effectiveColors} handlingPerUnit={round(handlingCostPerUnit * printMarginMultiplier)} />

            <div className="flex gap-3 mt-5">
              <button
                onClick={() => { setStep(2); if (!selectedPosition && printZones.length > 0) setSelectedPosition(printZones[0].positionId); }}
                disabled={!canProceed}
                title={!canProceed ? "Color sin stock o cantidad inválida" : ""}
                className="flex-1 bg-brand-red text-white py-3 rounded-full font-semibold text-sm flex items-center justify-center gap-2 hover:bg-brand-red-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Personalizar <Palette size={16} />
              </button>
              <button
                onClick={handleAddToCart}
                disabled={isAddingToCart || !canProceed}
                title={!canProceed ? "Color sin stock o cantidad inválida" : ""}
                className="bg-gray-900 text-white px-5 py-3 rounded-full font-semibold text-sm flex items-center gap-2 hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isAddingToCart ? <Loader2 size={16} className="animate-spin" /> : <ShoppingCart size={16} />}
                Sin marcaje
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── STEP 2: CUSTOMIZATION ────────────────────────── */}
      {step === 2 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 animate-fade-in">
          <div>
            {printZones.length > 0 ? (
              <ProductCanvasEditor
                ref={canvasEditorRef}
                printZones={printZones}
                productImage={variant.mainImage || ""}
                productName={product.name}
                selectedColorCode={variant.colorCode}
                onPlacementsChange={setLogoPlacements}
                activeZoneId={selectedPosition}
                onActiveZoneChange={handleCanvasZoneChange}
              />
            ) : (
              <div className="w-full aspect-square bg-surface-50 rounded-3xl relative flex items-center justify-center overflow-hidden">
                {variant.mainImage && <img src={variant.mainImage} alt="" className="w-[68%] h-[68%] object-contain" />}
                <div className="absolute bottom-3 left-3 bg-black/70 text-white text-[10px] font-semibold px-2.5 py-1 rounded-md">Sin zonas de impresión disponibles</div>
              </div>
            )}
          </div>

          <div>
            <h2 className="font-display font-extrabold text-2xl mb-2">Personaliza tu {product.name}</h2>
            <p className="text-sm text-gray-400 mb-6">Selecciona una zona en el editor y elige técnica de impresión</p>

            {/* Current position indicator */}
            {selectedPosition && positionData && (
              <div className="mb-5 bg-surface-50 rounded-xl px-4 py-3 border border-surface-200">
                <div className="flex items-center gap-2">
                  <Layers size={14} className="text-brand-red" />
                  <span className="text-sm font-semibold text-brand-red">{positionData.description}</span>
                  <span className="text-xs text-gray-400 ml-auto">Máx {positionData.maxWidth}×{positionData.maxHeight}mm</span>
                </div>
              </div>
            )}

            {!selectedPosition && (
              <div className="mb-5 bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-700">
                ← Selecciona una zona de impresión en el editor visual
              </div>
            )}

            {/* 1. Technique — with REAL indicative prices */}
            {selectedPosition && (
              <div className="mb-5 animate-slide-up">
                <label className="text-sm font-semibold mb-2 block">1. Técnica de impresión</label>
                <div className="space-y-2">
                  {positionData?.techniques.map(tech => {
                    const isSelected = selectedTechnique === tech.techniqueId;
                    const indicative = getTechIndicativePrice(tech);
                    
                    let displayTitle = tech.name;
                    let displaySubtitle = tech.description;
                    if (tech.description && tech.description.includes(" — ")) {
                      const parts = tech.description.split(" — ");
                      displayTitle = parts[0];
                      displaySubtitle = parts.slice(1).join(" — ");
                    }

                    return (
                      <button
                        key={tech.techniqueId}
                        onClick={() => { setSelectedTechnique(tech.techniqueId); setNumColors(1); }}
                        className={`w-full p-3.5 rounded-xl border-2 text-left flex justify-between items-center transition-all ${isSelected ? "border-brand-red bg-brand-red/[0.05]" : "border-surface-200 hover:border-gray-300"}`}
                      >
                        <div>
                          <div className={`text-sm font-semibold ${isSelected ? "text-brand-red" : "text-gray-900"}`}>{displayTitle}</div>
                          <div className="text-xs text-gray-800 mt-0.5">{displaySubtitle}</div>
                          {indicative && (
                            <div className="text-[10px] text-gray-400 mt-1">
                              Setup: {indicative.setup.toFixed(0)}€ · Desde {indicative.perUnit.toFixed(2)}€/ud
                            </div>
                          )}
                          {!indicative && (
                            <div className="text-[10px] text-gray-400 mt-1">Precio bajo consulta</div>
                          )}
                        </div>
                        {isSelected && <Check size={18} className="text-brand-red flex-shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 2. Colors — only for color-based techniques */}
            {selectedTechnique && isColorBased && !isPositionBased && (
              <div className="mb-5 animate-slide-up">
                <label className="text-sm font-semibold mb-2 block">2. Colores del logo</label>
                <div className="flex gap-2">
                  {Array.from({ length: techniqueData?.maxColors || 5 }, (_, i) => i + 1).slice(0, 6).map(n => (
                    <button key={n} onClick={() => setNumColors(n)} className={`w-10 h-10 rounded-lg border-2 font-bold text-sm transition-all ${numColors === n ? "border-brand-red bg-brand-red/10 text-brand-red" : "border-surface-200 text-gray-400"}`}>{n}</button>
                  ))}
                </div>
                {techniqueData?.pricing?.nextColourCostIndicator && numColors > 1 && (
                  <div className="mt-2 text-[10px] text-gray-400">
                    1er color: {round(printCosts.setupCost > 0 ? (calculateRealPrintCost({ pricing: techniqueData.pricing, pricingType, quantity: qty, numColors: 1, printAreaMm2 }).printCostPerUnit * printMarginMultiplier) : 0).toFixed(2)}€/ud ·
                    Colores adicionales a precio reducido
                  </div>
                )}
              </div>
            )}

            {/* Area/Position-based info */}
            {selectedTechnique && (isAreaBased || isPositionBased) && !isColorBased && (
              <div className="mb-5 animate-slide-up">
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-xs text-blue-700">
                  <Info size={13} className="inline mr-1" />
                  {isAreaBased ? "Esta técnica es full color — el precio varía según el área de impresión" : "Precio por posición de impresión"}
                </div>
              </div>
            )}

            {/* 3. Logo status */}
            {selectedTechnique && (
              <div className="mb-5 animate-slide-up">
                <label className="text-sm font-semibold mb-2 block flex items-center gap-2">
                  <Layers size={14} />
                  {hasLogos ? "Logo(s) colocados" : "Sube tu logo en el editor visual"}
                </label>
                {hasLogos ? (
                  <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                    <div className="flex items-center gap-2">
                      <Check size={16} className="text-green-600" />
                      <span className="text-sm font-medium text-green-700">{logoPlacements.length} logo{logoPlacements.length > 1 ? "s" : ""} posicionado{logoPlacements.length > 1 ? "s" : ""}</span>
                    </div>
                    <ul className="mt-2 space-y-1">
                      {logoPlacements.map(lp => (
                        <li key={lp.positionId} className="text-xs text-green-600">• {lp.logoFileName} en {printZones.find(z => z.positionId === lp.positionId)?.positionName || lp.positionId}</li>
                      ))}
                    </ul>
                  </div>
                ) : (
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-700">← Usa el editor visual a la izquierda para arrastrar tu logo sobre el producto</div>
                )}
              </div>
            )}

            <PriceBox basePrice={basePrice} setupCost={setupCost} printTotal={printTotal} handlingTotal={handlingTotal} total={total} perUnit={perUnit} unitProductPrice={unitProductPrice} qty={qty} hasPrint={!!selectedTechnique} printPerUnit={printPerUnit} numColors={effectiveColors} handlingPerUnit={round(handlingCostPerUnit * printMarginMultiplier)} compact />

            <div className="flex gap-3 mt-4">
              <button onClick={() => setStep(1)} className="px-5 py-2.5 rounded-full border-2 border-surface-200 text-sm font-medium flex items-center gap-2 hover:border-gray-300 transition-colors"><ArrowLeft size={14} /> Volver</button>
              <button onClick={async () => {
                if (canvasEditorRef.current && hasLogos) {
                  const mockups = await canvasEditorRef.current.exportAllMockups();
                  console.log("[DEBUG] Mockups generated:", Object.keys(mockups).length, Object.values(mockups).map(v => (v as string)?.length || 0));
                  setCachedMockups(mockups);
                } else {
                  console.log("[DEBUG] No canvasEditorRef or no logos", !!canvasEditorRef.current, hasLogos);
                }
                setStep(3);
              }} disabled={!selectedTechnique || !hasLogos} className="flex-1 bg-brand-red text-white py-3 rounded-full font-semibold text-sm flex items-center justify-center gap-2 hover:bg-brand-red-dark transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
                {selectedTechnique && hasLogos ? <>Previsualizar <Eye size={16} /></> : "Selecciona técnica y sube logo"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── STEP 3: REVIEW ───────────────────────────────── */}
      {step === 3 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 animate-fade-in">
          <div>
            <div className="grid gap-3" style={{ gridTemplateColumns: logoPlacements.length > 1 ? "repeat(2, 1fr)" : "1fr" }}>
              {(logoPlacements.length > 0 ? logoPlacements : [null]).map((lp, idx) => {
                const zone = lp ? printZones.find(z => z.positionId === lp.positionId) : printZones[0];
                const getUrl = () => {
                  if (!zone) return variant.mainImage || "";
                  if (variant.colorCode && zone.imageVariants?.length) {
                    const match = zone.imageVariants.find(v => {
                      if (!v.colorCode || !variant.colorCode) return false;
                      const c = v.colorCode.toUpperCase();
                      const t = variant.colorCode.toUpperCase();
                      return c === t || c.endsWith(`-${t}`) || t.endsWith(`-${c}`);
                    });
                    if (match) { const u = match.imageWithArea || match.imageBlank || ""; return u.includes("midocean.com") ? "/api/image-proxy?url=" + encodeURIComponent(u) : u; }
                  }
                  const img = variant.mainImage || zone.imageWithArea || zone.imageBlank || "";
                  return img.includes("midocean.com") ? "/api/image-proxy?url=" + encodeURIComponent(img) : img;
                };
                return (
                  <div key={idx} className="relative">
                    <PreviewWithLogo
                      previewUrl={getUrl()}
                      productName={product.name}
                      activeLogoData={lp ? { dataUrl: lp.logoDataUrl, fileName: lp.logoFileName } : undefined}
                      activeZoneData={zone}
                      currentLogoPos={{ x: lp?.x || 0.5, y: lp?.y || 0.5, scale: lp?.scaleX || 0.65 }}
                    />
                    {zone && <div className="text-center mt-1 text-[9px] text-gray-400 font-semibold">{zone.positionName}</div>}
                  </div>
                );
              })}
            </div>
            <div className="text-center mt-2 text-[10px] text-gray-400 bg-black/5 rounded-lg py-1">Previsualización orientativa</div>
          </div>

          <div>
            <h2 className="font-display font-extrabold text-2xl mb-6">Resumen de tu pedido</h2>

            <div className="bg-white rounded-2xl border border-surface-200 overflow-hidden mb-5">
              {[
                ["Producto", product.name],
                ["Color", variant.color + (variant.size ? ` / ${variant.size}` : "")],
                ["Cantidad", `${qty} unidades`],
                ["Precio/ud producto", `${unitProductPrice.toFixed(2)}€`],
                ...(selectedTechnique ? [
                  ["Posición", positionData?.description || ""],
                  ["Técnica", techniqueData?.description?.split(" — ")[0] || techniqueData?.name || ""],
                  ...(isColorBased ? [["Colores logo", String(numColors)]] : []),
                  ["Manipulación", `${handlingInfo?.description || "Estándar"} (${round(handlingCostPerUnit * printMarginMultiplier).toFixed(2)}€/ud)`],
                  ...(hasLogos ? logoPlacements.map(lp => [`Logo (${printZones.find(z => z.positionId === lp.positionId)?.positionName || ""})`, lp.logoFileName]) : []),
                ] : []),
              ].map(([label, value], i) => (
                <div key={i} className="flex justify-between px-4 py-3 border-b border-surface-100 last:border-0">
                  <span className="text-sm text-gray-400">{label}</span>
                  <span className="text-sm font-semibold">{value}</span>
                </div>
              ))}
            </div>

            <div className="bg-gray-900 rounded-2xl p-5 mb-5 text-white">
              <div className="flex justify-between mb-1.5 text-sm">
                <span className="opacity-60">Producto ({qty} × {unitProductPrice.toFixed(2)}€)</span>
                <span>{basePrice.toFixed(2)}€</span>
              </div>
              {selectedTechnique && (
                <>
                  <div className="flex justify-between mb-1.5 text-sm">
                    <span className="opacity-60">Setup{isColorBased ? ` (${effectiveColors} col.)` : ""}</span><span>{setupCost.toFixed(2)}€</span>
                  </div>
                  <div className="flex justify-between mb-1.5 text-sm">
                    <span className="opacity-60">Impresión ({qty} × {printPerUnit.toFixed(2)}€)</span><span>{printTotal.toFixed(2)}€</span>
                  </div>
                  <div className="flex justify-between mb-1.5 text-sm">
                    <span className="opacity-60">Manipulación ({qty} × {round(handlingCostPerUnit * printMarginMultiplier).toFixed(2)}€)</span><span>{handlingTotal.toFixed(2)}€</span>
                  </div>
                </>
              )}
              <div className="border-t border-white/20 pt-3 mt-2 flex justify-between items-baseline">
                <span className="font-bold">Total</span>
                <span className="font-display font-extrabold text-3xl text-brand-red">{total.toFixed(2)}€</span>
              </div>
              <div className="text-right"><span className="text-xs opacity-40">{perUnit.toFixed(2)}€ / unidad</span></div>
            </div>

            <div className="flex gap-3">
              <button onClick={() => setStep(selectedTechnique ? 2 : 1)} className="px-5 py-2.5 rounded-full border-2 border-surface-200 text-sm font-medium flex items-center gap-2 hover:border-gray-300"><ArrowLeft size={14} /> Editar</button>
              <button
                onClick={handleAddToCart}
                disabled={isAddingToCart || !canProceed}
                title={!canProceed ? "Color sin stock o cantidad inválida" : ""}
                className="flex-1 bg-brand-red text-white py-3 rounded-full font-semibold text-sm flex items-center justify-center gap-2 hover:bg-brand-red-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isAddingToCart ? <Loader2 size={16} className="animate-spin" /> : <ShoppingCart size={16} />}
                Añadir al carrito
              </button>
            </div>

            <button onClick={handleDownloadPDF} disabled={pdfGenerating} className="w-full mt-3 py-2.5 rounded-full border-2 border-surface-200 text-sm font-medium flex items-center justify-center gap-2 text-gray-500 hover:border-gray-300 transition-colors disabled:opacity-50">
              {pdfGenerating ? <><Loader2 size={14} className="animate-spin" /> Generando presupuesto...</> : <><Download size={14} /> Descargar presupuesto PDF</>}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================
// PRICE BOX COMPONENT
// ============================================================

function PriceBox({ basePrice, setupCost, printTotal, handlingTotal, total, perUnit, unitProductPrice, qty, hasPrint, printPerUnit, numColors, handlingPerUnit, compact }: {
  basePrice: number; setupCost: number; printTotal: number; handlingTotal: number;
  total: number; perUnit: number; unitProductPrice: number; qty: number;
  hasPrint: boolean; printPerUnit: number; numColors: number; handlingPerUnit: number; compact?: boolean;
}) {
  return (
    <div className={`bg-surface-50 rounded-2xl border border-surface-200 ${compact ? "p-4" : "p-5"}`}>
      <div className="flex justify-between mb-1.5">
        <span className="text-xs text-gray-400">Producto ({qty} × {unitProductPrice.toFixed(2)}€)</span>
        <span className="text-xs font-semibold">{basePrice.toFixed(2)}€</span>
      </div>
      {hasPrint && (
        <>
          <div className="flex justify-between mb-1.5">
            <span className="text-xs text-gray-400">Setup</span>
            <span className="text-xs font-semibold">{setupCost.toFixed(2)}€</span>
          </div>
          <div className="flex justify-between mb-1.5">
            <span className="text-xs text-gray-400">Impresión ({qty} × {printPerUnit.toFixed(2)}€)</span>
            <span className="text-xs font-semibold">{printTotal.toFixed(2)}€</span>
          </div>
          <div className="flex justify-between mb-1.5">
            <span className="text-xs text-gray-400">Manipulación ({qty} × {handlingPerUnit.toFixed(2)}€)</span>
            <span className="text-xs font-semibold">{handlingTotal.toFixed(2)}€</span>
          </div>
        </>
      )}
      <div className="border-t-2 border-gray-900 mt-2 pt-3 flex justify-between items-baseline">
        <div>
          <span className="text-[11px] text-gray-400 block">Por unidad</span>
          <span className={`font-display font-extrabold text-brand-red ${compact ? "text-xl" : "text-2xl"}`}>{perUnit.toFixed(2)}€</span>
        </div>
        <div className="text-right">
          <span className="text-[11px] text-gray-400 block">Total</span>
          <span className={`font-display font-extrabold ${compact ? "text-xl" : "text-2xl"}`}>{total.toFixed(2)}€</span>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// HELPER
// ============================================================

function round(n: number): number {
  return Math.round(n * 100) / 100;
}
