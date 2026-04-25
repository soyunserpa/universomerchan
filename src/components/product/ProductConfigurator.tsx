"use client";

import { useState, useCallback, useRef, useMemo } from "react";
import { useCart } from "@/lib/cart-store";
import { useAuth } from "@/lib/auth-context";
import type { ProductDetailResponse } from "@/lib/catalog-api";
import {
  Leaf, ShoppingCart, Palette, Eye, ArrowLeft,
  Check, Download, Minus, Plus, Info, Gift,
  Layers, Loader2, Package, ShieldCheck, Handshake, Star
} from "lucide-react";
import { ProductCanvasEditor, PreviewWithLogo, type CanvasEditorRef, type PrintZone, type LogoPlacement } from "./ProductCanvasEditor";
import { useEffect, Suspense } from "react";
import { useRecentlyViewed } from "@/lib/useRecentlyViewed";
import { useGlobalLogo } from "@/lib/global-logo-store";
import { useSearchParams } from "next/navigation";

// ============================================================
// CONSTANTS
// ============================================================

// Default margins — overridden by product.margins (resolved per-category from DB)
const DEFAULT_MARGINS = { productMarginPct: 40, printMarginPct: 50, clientDiscountPct: 0 };
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

function ProductConfiguratorInner({ product }: Props) {
  const { addItem } = useCart();
  const { user } = useAuth();
  const { addProduct } = useRecentlyViewed();
  const { globalLogo, globalLogoName, setGlobalLogo } = useGlobalLogo();
  const canvasEditorRef = useRef<CanvasEditorRef>(null);

  // Use per-category margins from server, falling back to defaults
  const MARGINS = useMemo(() => ({
    productMarginPct: product.margins?.productMarginPct ?? DEFAULT_MARGINS.productMarginPct,
    printMarginPct: product.margins?.printMarginPct ?? DEFAULT_MARGINS.printMarginPct,
    clientDiscountPct: user?.discountPercent ? (user.discountPercent / 100) : DEFAULT_MARGINS.clientDiscountPct,
  }), [product.margins, user?.discountPercent]);

  // Hook to capture ?logo= parameter from email proposals
  const searchParams = useSearchParams();
  useEffect(() => {
    const logoParam = searchParams.get("logo");
    if (logoParam && logoParam !== globalLogo) {
      setGlobalLogo(logoParam, "logo-empresa.png");
    }
  }, [searchParams, globalLogo, setGlobalLogo]);



  // Track product view history
  useEffect(() => {
    addProduct({
      masterCode: product.masterCode,
      name: product.name,
      category: product.category,
      image: product.mainImage || product.variants?.[0]?.mainImage || ""
    });
  }, [product.masterCode, product.name, product.category, product.mainImage, product.variants, addProduct]);

  // State
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const changeStep = useCallback((newStep: 1 | 2 | 3) => {
    setStep(newStep);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  // FOMO B2B Engine - Generates deterministic "hot" stats based on masterCode length/chars
  const fomoData = useMemo(() => {
    const seed = product.masterCode.charCodeAt(0) + product.masterCode.charCodeAt(product.masterCode.length - 1);
    const count = (seed % 14) + 3; // 3 to 16
    const type = seed % 3 === 0 ? "carts" : "views"; // carts, views, views
    return { count, type };
  }, [product.masterCode]);

  const [variantIdx, setVariantIdx] = useState(0);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [baseQty, setBaseQty] = useState(1);
  const [sizeQuantities, setSizeQuantities] = useState<Record<string, number>>({});
  const [selectedPosition, setSelectedPosition] = useState<string | null>(null);
  const [selectedTechniques, setSelectedTechniques] = useState<Record<string, string>>({});
  const [numColorsMap, setNumColorsMap] = useState<Record<string, number>>({});
  const [logoPlacements, setLogoPlacements] = useState<LogoPlacement[]>([]);
  const [pdfGenerating, setPdfGenerating] = useState(false);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [cachedMockups, setCachedMockups] = useState<Record<string, string>>({});
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  // Reset active image when variant changes
  useEffect(() => {
    setActiveImageIndex(0);
  }, [variantIdx]);

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

  // ── PRINT POSITION & TECHNIQUE DATA (For UI display) ───────────

  const positionData = product.printPositions.find(p => p.positionId === selectedPosition);
  const currentSelectedTechnique = selectedPosition ? selectedTechniques[selectedPosition] : null;
  const techniqueData = positionData?.techniques.find(t => t.techniqueId === currentSelectedTechnique);
  const printAreaMm2 = positionData ? (positionData.maxWidth * positionData.maxHeight) : 0;
  
  const pricingType = techniqueData?.pricing?.varCosts?.length
    ? techniqueData.pricingType
    : techniqueData?.pricingType || "NumberOfColours";

  const isAreaBased = pricingType === "AreaRange" || pricingType === "ColourAreaRange";
  const isPositionBased = pricingType === "NumberOfPositions";
  const isColorBased = pricingType === "NumberOfColours" || pricingType === "ColourAreaRange";

  // ── REAL PRINT PRICING (SUMMED OVER ALL SELECTED ZONES) ────────

  const printMarginMultiplier = 1 + MARGINS.printMarginPct / 100;
  
  const currentNumColors = selectedPosition ? (numColorsMap[selectedPosition] || 1) : 1;
  const effectiveColorsUI = (isAreaBased && !isColorBased) || isPositionBased ? 1 : currentNumColors;

  const printCosts = useMemo(() => {
    let totalSetup = 0;
    let totalPrintPerUnit = 0;

    for (const [zoneId, techId] of Object.entries(selectedTechniques)) {
      const posData = product.printPositions.find(p => p.positionId === zoneId);
      const tData = posData?.techniques.find(t => t.techniqueId === techId);
      if (posData && tData && tData.pricing) {
        const pType = tData.pricing.varCosts?.length ? tData.pricingType : (tData.pricingType || "NumberOfColours");
        const cIsArea = pType === "AreaRange" || pType === "ColourAreaRange";
        const cIsPos = pType === "NumberOfPositions";
        const cIsColor = pType === "NumberOfColours" || pType === "ColourAreaRange";
        const cCols = numColorsMap[zoneId] || 1;
        const cEffCols = ((cIsArea && !cIsColor) || cIsPos) ? 1 : cCols;
        const areaMm2 = posData.maxWidth * posData.maxHeight;

        const pCost = calculateRealPrintCost({
          pricing: tData.pricing,
          pricingType: pType,
          quantity: qty,
          numColors: cEffCols,
          printAreaMm2: areaMm2,
          isRepeatOrder: false,
        });
        totalSetup += pCost.setupCost;
        totalPrintPerUnit += pCost.printCostPerUnit;
      }
    }
    return { setupCost: totalSetup, printCostPerUnit: totalPrintPerUnit };
  }, [selectedTechniques, numColorsMap, product.printPositions, qty]);

  // Handling cost from product's print_manipulation code
  const handlingInfo = product.printPositions[0]?.handlingInfo;
  const handlingCostPerUnit = handlingInfo?.pricePerUnit || 0;

  // Apply margins to all print costs
  const setupCost = round(printCosts.setupCost * printMarginMultiplier);
  const printPerUnit = round(printCosts.printCostPerUnit * printMarginMultiplier);
  const printTotal = round(printPerUnit * qty);
  const zonesCount = Object.keys(selectedTechniques).length;
  const handlingTotal = round(handlingCostPerUnit * qty * printMarginMultiplier) * zonesCount;
  
  const rawTotal = basePrice + setupCost + printTotal + handlingTotal;
  const discountMultiplier = 1 - MARGINS.clientDiscountPct;
  const total = round(rawTotal * discountMultiplier);
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
  // Active placements are ANY placements that have an explicit technique mapped to them
  const activePlacements = logoPlacements.filter(lp => !!selectedTechniques[lp.positionId]);
  const hasActiveLogos = activePlacements.length > 0;

  // Sync canvas zone selection with configurator position
  const handleCanvasZoneChange = useCallback((zoneId: string) => {
    setSelectedPosition(zoneId);
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

      if (hasActiveLogos && activePlacements[0]?.logoDataUrl) {
        try {
          const extMatch = activePlacements[0].logoFileName.match(/\\.([a-zA-Z0-9]+)$/);
          const ext = extMatch ? extMatch[1] : undefined;

          const upRes = await fetch("/api/uploads/artwork", {
            method: "POST", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              dataUrl: activePlacements[0].logoDataUrl,
              ref: product.masterCode + "-artwork",
              extension: ext
            })
          });
          if (upRes.ok) {
            finalArtworkUrl = (await upRes.json()).url;
          } else {
            throw new Error("HTTP error " + upRes.status);
          }
        } catch (e) {
          console.error("Artwork upload error:", e);
          alert("Lo sentimos, ha habido un problema de conexión al subir tu diseño. Prueba de nuevo o utiliza un formato más ligero.");
          return; // Cancel add to cart
        }
      }

      const customizationPayload = zonesCount > 0 && hasActiveLogos ? {
        positions: activePlacements.map(lp => {
          const techId = selectedTechniques[lp.positionId];
          const cols = numColorsMap[lp.positionId] || 1;
          const posData = product.printPositions.find(p => p.positionId === lp.positionId);
          const techData = posData?.techniques.find(t => t.techniqueId === techId);
          
          let pType = techData?.pricing?.varCosts?.length ? techData.pricingType : (techData?.pricingType || "NumberOfColours");
          let cIsArea = pType === "AreaRange" || pType === "ColourAreaRange";
          let cIsPos = pType === "NumberOfPositions";
          let cIsColor = pType === "NumberOfColours" || pType === "ColourAreaRange";
          let cEffCols = ((cIsArea && !cIsColor) || cIsPos) ? 1 : cols;
          
          return {
            positionId: lp.positionId,
            positionName: posData?.description || lp.positionId,
            techniqueId: techId!,
            techniqueName: techData?.name || techId!,
            printWidthMm: posData?.maxWidth || 50,
            printHeightMm: posData?.maxHeight || 50,
            numColors: cEffCols,
            pmsColors: [],
            instructions: "",
          };
        }),
        artworkUrl: finalArtworkUrl || "",
        artworkFileName: activePlacements[0]?.logoFileName || "",
        mockupUrl,
      } : null;

      const orderTypePayload = zonesCount > 0 && hasLogos ? "PRINT" : "NORMAL";

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
      const zones = activePlacements.map(lp => {
        const techId = selectedTechniques[lp.positionId];
        const cols = numColorsMap[lp.positionId] || 1;
        const posData = product.printPositions.find(p => p.positionId === lp.positionId);
        const techData = posData?.techniques.find(t => t.techniqueId === techId);
        
        let pType = techData?.pricing?.varCosts?.length ? techData.pricingType : (techData?.pricingType || "NumberOfColours");
        let cIsArea = pType === "AreaRange" || pType === "ColourAreaRange";
        let cIsPos = pType === "NumberOfPositions";
        let cIsColor = pType === "NumberOfColours" || pType === "ColourAreaRange";
        let cEffCols = ((cIsArea && !cIsColor) || cIsPos) ? 1 : cols;
        
        return {
          positionId: lp.positionId,
          positionName: posData?.description || lp.positionId,
          techniqueId: techId || "",
          techniqueName: techData?.name || techId || "",
          numColors: cEffCols,
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
          <div key={s.n} className="flex-1 cursor-pointer" onClick={() => s.n <= step ? changeStep(s.n as any) : null}>
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
              {variant.images && variant.images.length > 0 ? (
                <img src={variant.images[activeImageIndex]?.urlHiRes || variant.images[activeImageIndex]?.url} alt={product.name} className="w-[85%] h-[85%] object-contain mix-blend-multiply" />
              ) : variant.mainImage ? (
                <img src={variant.mainImage} alt={product.name} className="w-[85%] h-[85%] object-contain mix-blend-multiply" />
              ) : (
                <Gift size={60} className="text-gray-200" />
              )}
            </div>
            
            {/* Gallery Thumbnails */}
            {variant.images && variant.images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                {variant.images.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveImageIndex(i)}
                    className={`w-16 h-16 flex-shrink-0 rounded-xl bg-surface-50 border-2 flex items-center justify-center overflow-hidden transition-all ${activeImageIndex === i ? "border-brand-red ring-2 ring-brand-red/20 shadow-sm" : "border-surface-200 hover:border-gray-300"
                      }`}
                  >
                    <img src={img.url} alt={`Vista ${i + 1}`} className="w-[85%] h-[85%] object-contain mix-blend-multiply" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product info */}
          <div>
            <div className="flex gap-2 mb-3">
              {product.isGreen && <span className="inline-flex items-center gap-1 bg-green-50 text-green-700 text-xs font-semibold px-2.5 py-0.5 rounded-full"><Leaf size={11} /> Sostenible</span>}
              <span className="bg-blue-50 text-blue-700 text-xs font-semibold px-2.5 py-0.5 rounded-full">REF: {product.masterCode}</span>
            </div>

            <h1 className="font-display font-extrabold text-3xl mb-2">{product.name} {product.shortDescription}</h1>
            {product.longDescription && <p className="text-base text-black leading-relaxed mb-6">{product.longDescription}</p>}

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
                      className={`w-8 h-8 rounded-full transition-all ring-offset-2 outline-none ${variant.color === v.color ? "ring-2 ring-brand-red border-brand-red scale-110" : "border-2 border-surface-200 hover:border-surface-300"}`}
                      style={{ backgroundColor: v.colorHex }}
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
                <label className="text-sm font-semibold mb-2 block">
                  Cantidad <span className="text-xs text-gray-500 font-normal ml-1">(De 1 a {maxStock.toLocaleString("es-ES")} uds)</span>
                </label>
                <div className="flex items-center gap-3 flex-wrap">
                  <button onClick={() => setBaseQty(Math.max(1, baseQty - 10))} disabled={isOutOfStock} title="Restar 10" className="w-9 h-9 rounded-lg border border-surface-200 flex items-center justify-center hover:bg-surface-50 disabled:opacity-50"><Minus size={14} /></button>
                  <input type="number" max={maxStock} title="Unidades" placeholder="1" value={baseQty} onChange={(e) => setBaseQty(Math.max(1, Math.min(maxStock, parseInt(e.target.value) || 1)))} disabled={isOutOfStock} className="w-20 text-center py-2 border-2 border-surface-200 rounded-lg text-base font-bold font-body outline-none disabled:opacity-50" />
                  <button onClick={() => setBaseQty(Math.min(maxStock, baseQty + 10))} disabled={isOutOfStock || baseQty >= maxStock} title="Sumar 10" className="w-9 h-9 rounded-lg border border-surface-200 flex items-center justify-center hover:bg-surface-50 disabled:opacity-50"><Plus size={14} /></button>
                  <div className="flex gap-1.5 ml-2 flex-wrap">
                    {[5, 15, 50, 100, 250, 500].map(q => (
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

            <PriceBox basePrice={basePrice} setupCost={setupCost} printTotal={printTotal} handlingTotal={handlingTotal} total={total} perUnit={perUnit} unitProductPrice={unitProductPrice} qty={qty} hasPrint={zonesCount > 0} printPerUnit={printPerUnit} numColors={effectiveColorsUI} handlingPerUnit={round(handlingCostPerUnit * printMarginMultiplier)} MARGINS={MARGINS} />

            <div className="mt-3 text-xs bg-amber-50 border border-amber-200 rounded-xl p-3.5 text-amber-900 font-medium flex flex-col gap-1.5">
              <span className="flex items-center gap-1.5"><span className="text-amber-500">✓</span> A mayor cantidad mayor descuento en imprenta.</span>
              <span className="flex items-center gap-1.5"><span className="text-amber-500">✓</span> Para cantidades grandes contactarnos por WhatsApp o email para descuentos especiales.</span>
            </div>

            <div className="flex gap-3 mt-5">
              <button
                onClick={() => { changeStep(2); if (!selectedPosition && printZones.length > 0) setSelectedPosition(printZones[0].positionId); }}
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
                productSku={variant.sku}
                productMasterCode={product.masterCode}
                onPlacementsChange={setLogoPlacements}
                activeZoneId={selectedPosition}
                onActiveZoneChange={handleCanvasZoneChange}
                initialLogos={
                  globalLogo && globalLogoName 
                  ? printZones.reduce((acc, z) => ({ ...acc, [z.positionId]: { dataUrl: globalLogo, fileName: globalLogoName } }), {}) 
                  : undefined
                }
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
            <p className="text-sm text-gray-500 mb-4">Completa los pasos en el visor para preparar tu producto.</p>

            {globalLogo && printZones.length > 0 && (
              <div className="mb-5 bg-purple-50 border border-purple-200 rounded-xl p-3 text-sm flex gap-3 text-purple-800 animate-fade-in shadow-sm">
                <span className="text-xl">✨</span>
                <div>
                  <p className="font-bold mb-0.5">Hemos pre-cargado tu logo</p>
                  <p className="text-xs opacity-90">Selecciona aquí abajo el método de impresión de la parte que más te guste y dale a Pagar. Evitaremos el resto de caras para no cobrarte de más.</p>
                </div>
              </div>
            )}

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

            {/* 3. Technique */}
            {selectedPosition && (
              <div className="mb-5 animate-slide-up">
                <div className="flex items-center gap-2 mb-3">
                  <span className="bg-brand-red text-white w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shadow-sm">3</span>
                  <label className="text-sm font-bold text-gray-900 leading-none">Elige técnica y colores de impresión</label>
                </div>
                <div className="space-y-2">
                  {positionData?.techniques.map(tech => {
                    const isSelected = currentSelectedTechnique === tech.techniqueId;
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
                        onClick={() => { 
                           setSelectedTechniques(prev => ({...prev, [selectedPosition]: tech.techniqueId}));
                           setNumColorsMap(prev => ({...prev, [selectedPosition]: 1})); 
                         }}
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
            {currentSelectedTechnique && isColorBased && !isPositionBased && (
              <div className="mb-5 animate-slide-up">
                <label className="text-sm font-semibold mb-2 block">2. Colores del logo</label>
                <div className="flex gap-2">
                  {Array.from({ length: techniqueData?.maxColors || 5 }, (_, i) => i + 1).slice(0, 6).map(n => (
                    <button key={n} onClick={() => setNumColorsMap(prev => ({...prev, [selectedPosition]: n}))} className={`w-10 h-10 rounded-lg border-2 font-bold text-sm transition-all ${currentNumColors === n ? "border-brand-red bg-brand-red/10 text-brand-red" : "border-surface-200 text-gray-400"}`}>{n}</button>
                  ))}
                </div>
                {techniqueData?.pricing?.nextColourCostIndicator && currentNumColors > 1 && (
                  <div className="mt-2 text-[10px] text-gray-400">
                    1er color: {round(printCosts.setupCost > 0 ? (calculateRealPrintCost({ pricing: techniqueData.pricing, pricingType, quantity: qty, numColors: 1, printAreaMm2 }).printCostPerUnit * printMarginMultiplier) : 0).toFixed(2)}€/ud ·
                    Colores adicionales a precio reducido
                  </div>
                )}
              </div>
            )}

            {/* Area/Position-based info */}
            {currentSelectedTechnique && (isAreaBased || isPositionBased) && !isColorBased && (
              <div className="mb-5 animate-slide-up">
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-xs text-blue-700">
                  <Info size={13} className="inline mr-1" />
                  {isAreaBased ? "Esta técnica es full color — el precio varía según el área de impresión" : "Precio por posición de impresión"}
                </div>
              </div>
            )}

            {/* 3. Logo status */}
            {currentSelectedTechnique && (
              <div className="mb-5 animate-slide-up">
                <label className="text-sm font-semibold mb-2 block flex items-center gap-2">
                  <Layers size={14} />
                  {hasActiveLogos ? "Logo colocado para esta zona" : "Sube tu logo en el editor visual"}
                </label>
                {hasActiveLogos ? (
                  <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                    <div className="flex items-center gap-2">
                      <Check size={16} className="text-green-600" />
                      <span className="text-sm font-medium text-green-700">{activePlacements.length} logo{activePlacements.length > 1 ? "s" : ""} posicionado{activePlacements.length > 1 ? "s" : ""}</span>
                    </div>
                    <ul className="mt-2 space-y-1">
                      {activePlacements.map(lp => (
                        <li key={lp.positionId} className="text-xs text-green-600">• {lp.logoFileName} en {printZones.find(z => z.positionId === lp.positionId)?.positionName || lp.positionId}</li>
                      ))}
                    </ul>
                  </div>
                ) : (
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-700">← Usa el editor visual a la izquierda para arrastrar tu logo sobre el producto</div>
                )}
              </div>
            )}

            <PriceBox basePrice={basePrice} setupCost={setupCost} printTotal={printTotal} handlingTotal={handlingTotal} total={total} perUnit={perUnit} unitProductPrice={unitProductPrice} qty={qty} hasPrint={zonesCount > 0} printPerUnit={printPerUnit} numColors={effectiveColorsUI} handlingPerUnit={round(handlingCostPerUnit * printMarginMultiplier)} compact MARGINS={MARGINS} />

            <div className="flex gap-3 mt-4">
              <button onClick={() => changeStep(1)} className="px-5 py-2.5 rounded-full border-2 border-surface-200 text-sm font-medium flex items-center gap-2 hover:border-gray-300 transition-colors"><ArrowLeft size={14} /> Volver</button>
              <button onClick={async () => {
                if (canvasEditorRef.current && hasLogos) {
                  const mockups = await canvasEditorRef.current.exportAllMockups();
                  console.log("[DEBUG] Mockups generated:", Object.keys(mockups).length, Object.values(mockups).map(v => (v as string)?.length || 0));
                  setCachedMockups(mockups);
                } else {
                  console.log("[DEBUG] No canvasEditorRef or no logos", !!canvasEditorRef.current, hasLogos);
                }
                changeStep(3);
              }} disabled={zonesCount === 0 || !hasLogos} className="flex-1 bg-brand-red text-white py-3 rounded-full font-semibold text-sm flex items-center justify-center gap-2 hover:bg-brand-red-dark transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
                {zonesCount > 0 && hasLogos ? <>Previsualizar <Eye size={16} /></> : "Selecciona técnica y sube logo"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── STEP 3: REVIEW ───────────────────────────────── */}
      {step === 3 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 animate-fade-in">
          <div>
            <div className={`grid gap-3 ${logoPlacements.length > 1 ? "grid-cols-2" : "grid-cols-1"}`}>
              {(logoPlacements.length > 0 ? logoPlacements : [null]).map((lp, idx) => {
                const zone = lp ? printZones.find(z => z.positionId === lp.positionId) : printZones[0];
                const getUrl = () => {
                  if (!zone) return variant.mainImage || "";
                  let img = zone.imageWithArea || zone.imageBlank || "";
                  if (variant.colorCode) {
                    if (zone.imageVariants?.length) {
                      const match = zone.imageVariants.find(v => {
                        if (!v.colorCode || !variant.colorCode) return false;
                        const c = v.colorCode.toUpperCase();
                        const t = variant.colorCode.toUpperCase();
                        return c === t || c.endsWith(`-${t}`) || t.endsWith(`-${c}`);
                      });
                      if (match) { 
                        const u = match.imageWithArea || match.imageBlank || ""; 
                        return u.includes("midocean.com") ? "/api/image-proxy?url=" + encodeURIComponent(u) : u; 
                      }
                    } else if (img && variant.colorCode && product.masterCode) {
                      const regex = new RegExp(`(${product.masterCode}-)([A-Za-z0-9]+)`, 'i');
                      if (regex.test(img)) {
                          const targetSyntax = `${product.masterCode}-${variant.colorCode}`.toUpperCase();
                          img = img.replace(regex, targetSyntax);
                      }
                    }
                  }
                  
                  if (!img) img = variant.mainImage || "";
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
                ...(zonesCount > 0 ? [
                  ["Posiciones configuradas", String(zonesCount)],
                  ["Manipulación", `${handlingInfo?.description || "Estándar"} (${round(handlingCostPerUnit * printMarginMultiplier).toFixed(2)}€/ud)`],
                  ...(hasActiveLogos ? activePlacements.map(lp => {
                    const techId = selectedTechniques[lp.positionId];
                    const tName = product.printPositions.find(p => p.positionId === lp.positionId)?.techniques.find(t => t.techniqueId === techId)?.name || techId;
                    return [`Logo (${printZones.find(z => z.positionId === lp.positionId)?.positionName || ""})`, `${lp.logoFileName} - ${tName}`];
                  }) : []),
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
              {zonesCount > 0 && (
                <>
                  <div className="flex justify-between mb-1.5 text-sm">
                    <span className="opacity-60">Setup (Total de posiciones)</span><span>{setupCost.toFixed(2)}€</span>
                  </div>
                  <div className="flex justify-between mb-1.5 text-sm">
                    <span className="opacity-60">Impresión ({qty} × {printPerUnit.toFixed(2)}€)</span><span>{printTotal.toFixed(2)}€</span>
                  </div>
                  <div className="flex justify-between mb-1.5 text-sm">
                    <span className="opacity-60">Manipulación</span><span>{handlingTotal.toFixed(2)}€</span>
                  </div>
                </>
              )}
              <div className="border-t border-white/20 pt-3 mt-2 flex justify-between items-baseline">
                <span className="font-bold">Total</span>
                <div className="flex flex-col items-end gap-0.5">
                  {MARGINS.clientDiscountPct > 0 && (
                    <span className="text-xs text-brand-red font-bold uppercase tracking-wider bg-red-50 px-2 py-0.5 rounded-full flex items-center gap-1">
                      <Star size={10} className="fill-brand-red" /> Tarifa VIP Aplicada
                    </span>
                  )}
                  <span className="font-display font-extrabold text-3xl text-brand-red">{total.toFixed(2)}€</span>
                </div>
              </div>
              <div className="text-right"><span className="text-xs opacity-40">{perUnit.toFixed(2)}€ / unidad</span></div>
            </div>

            <div className="flex gap-3">
              <button onClick={() => changeStep(zonesCount > 0 ? 2 : 1)} className="px-5 py-2.5 rounded-full border-2 border-surface-200 text-sm font-medium flex items-center gap-2 hover:border-gray-300"><ArrowLeft size={14} /> Editar</button>
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

            <div className="mt-4 bg-blue-50 border border-blue-200 rounded-xl p-3 flex gap-3 text-sm text-blue-800">
              <div className="flex-shrink-0 mt-0.5">
                <Info size={16} className="text-blue-600" />
              </div>
              <div className="leading-snug">
                <strong>¿No estás seguro de cómo quedará?</strong><br/>
                No te preocupes. Te enviaremos un <strong>boceto final profesional</strong> a tu correo para que lo valides antes de pasar a producción. Podrás aprobarlo o solicitar cambios desde tu panel de cliente.
              </div>
            </div>

            <div className="mt-4 bg-orange-50 border border-orange-200 rounded-xl p-3 flex gap-3 text-sm text-orange-800 animate-fade-in shadow-sm">
              <div className="flex-shrink-0 mt-0.5">
                <span className="text-orange-600 text-lg animate-pulse block">🔥</span>
              </div>
              <div className="leading-snug">
                <strong className="text-orange-900">Alta demanda en empresas corporativas.</strong><br/>
                {fomoData.type === "carts" 
                  ? `${fomoData.count} empresas han añadido este artículo a sus presupuestos hoy.`
                  : `${fomoData.count} usuarios están evaluando este producto ahora mismo.`}
              </div>
            </div>

            <div className={`mt-4 mb-2 grid gap-3 ${product.isGreen ? "grid-cols-2" : "grid-cols-1 sm:grid-cols-3"}`}>
              <div className="flex items-center gap-2 text-xs text-gray-700 bg-surface-50 p-2.5 rounded-lg border border-surface-200">
                <Package size={16} className="text-brand-red flex-shrink-0" />
                <span className="font-medium leading-tight">Envío a península <br className="hidden sm:block" />en 3-10 días</span>
              </div>
              {product.isGreen && (
                <div className="flex items-center gap-2 text-xs text-gray-700 bg-green-50 p-2.5 rounded-lg border border-green-200">
                  <Leaf size={16} className="text-green-600 flex-shrink-0" />
                  <span className="font-medium leading-tight text-green-800">Materiales <br className="hidden sm:block" />Sostenibles</span>
                </div>
              )}
              <div className="flex items-center gap-2 text-xs text-gray-700 bg-surface-50 p-2.5 rounded-lg border border-surface-200">
                <Handshake size={16} className="text-brand-red flex-shrink-0" />
                <span className="font-medium leading-tight">Atención B2B <br className="hidden sm:block" />Personalizada</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-700 bg-surface-50 p-2.5 rounded-lg border border-surface-200">
                <ShieldCheck size={16} className="text-brand-red flex-shrink-0" />
                <span className="font-medium leading-tight">Pago 100% <br className="hidden sm:block" />Seguro</span>
              </div>
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

export function ProductConfigurator(props: Props) {
  return (
    <Suspense fallback={<div className="h-40 flex items-center justify-center"><Loader2 className="animate-spin text-brand-red" /></div>}>
      <ProductConfiguratorInner {...props} />
    </Suspense>
  );
}

// ============================================================
// PRICE BOX COMPONENT
// ============================================================

function PriceBox({ basePrice, setupCost, printTotal, handlingTotal, total, perUnit, unitProductPrice, qty, hasPrint, printPerUnit, numColors, handlingPerUnit, compact, MARGINS }: {
  basePrice: number; setupCost: number; printTotal: number; handlingTotal: number;
  total: number; perUnit: number; unitProductPrice: number; qty: number;
  hasPrint: boolean; printPerUnit: number; numColors: number; handlingPerUnit: number; compact?: boolean; MARGINS: any;
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
