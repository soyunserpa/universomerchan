"use client";

import { useState, useCallback, useRef, useEffect, forwardRef, useImperativeHandle } from "react";
import {
  Upload, Layers, Trash2, RotateCcw, ZoomIn, ZoomOut, Move, Eye
} from "lucide-react";

// ============================================================
// TYPES
// ============================================================

export interface PrintZone {
  positionId: string;
  positionName: string;
  maxWidthMm: number;
  maxHeightMm: number;
  points: Array<{ distance_from_left: number; distance_from_top: number; sequence_no: number }>;
  imageBlank: string;
  imageWithArea: string;
  imageVariants?: Array<{ colorCode: string; imageBlank: string; imageWithArea: string }>;
}

export interface LogoPlacement {
  positionId: string;
  logoDataUrl: string;
  logoFileName: string;
  x: number; y: number; width: number; height: number;
  rotation: number; scaleX: number; scaleY: number;
}

export interface CanvasEditorRef {
  getLogoPlacements: () => LogoPlacement[];
  exportMockup: (positionId: string) => Promise<string | null>;
  exportAllMockups: () => Promise<Record<string, string>>;
}

interface Props {
  printZones: PrintZone[];
  productImage: string;
  productName: string;
  onPlacementsChange?: (placements: LogoPlacement[]) => void;
  selectedColorCode?: string;
  productSku?: string;
  productMasterCode?: string;
  activeZoneId?: string | null;
  onActiveZoneChange?: (zoneId: string) => void;
  // Bug 2 fix: allow parent to own logo state so it survives unmount/remount
  initialLogos?: Record<string, { dataUrl: string; fileName: string }>;
  initialLogoPos?: Record<string, { x: number; y: number; scale: number }>;
  onLogosChange?: (logos: Record<string, { dataUrl: string; fileName: string }>) => void;
  onLogoPosChange?: (pos: Record<string, { x: number; y: number; scale: number }>) => void;
  disabled?: boolean;
}

function proxyUrl(url: string | null | undefined): string {
  if (!url) return "";
  if (url.includes("midocean.com") || url.includes("printposition-img"))
    return `/api/image-proxy?url=${encodeURIComponent(url)}`;
  return url;
}

const VECTOR_PLACEHOLDER = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 200 200'><rect width='200' height='200' fill='%2310b981' rx='20'/><text x='100' y='95' font-family='Arial' font-size='22' font-weight='bold' fill='white' text-anchor='middle'>VECTOR</text><text x='100' y='125' font-family='Arial' font-size='15' fill='%23f0fdf4' text-anchor='middle'>ADJUNTO</text></svg>";
const getDisplayDataUrl = (dataUrl: string, fileName: string) => {
  return /\\.(ai|eps|pdf)$/i.test(fileName) ? VECTOR_PLACEHOLDER : dataUrl;
};

// ============================================================
// COMPONENT — Midocean-style split layout
// Left: Print area canvas (checkerboard bg, logo draggable)
// Right: Product preview image (reference only)
// ============================================================

export const ProductCanvasEditor = forwardRef<CanvasEditorRef, Props>(
  function ProductCanvasEditor(
    { printZones, productImage, productName, onPlacementsChange, selectedColorCode, productSku, productMasterCode, activeZoneId, onActiveZoneChange, disabled,
      initialLogos, initialLogoPos, onLogosChange, onLogoPosChange },
    ref
  ) {
    const [internalActiveZone, setInternalActiveZone] = useState<string>(printZones[0]?.positionId || "");
    const activeZone = activeZoneId ?? internalActiveZone;
    const setActiveZone = useCallback((id: string) => {
      setInternalActiveZone(id);
      onActiveZoneChange?.(id);
    }, [onActiveZoneChange]);

    const [logos, setLogosInternal] = useState<Record<string, { dataUrl: string; fileName: string }>>(initialLogos || {});
    const [logoPos, setLogoPosInternal] = useState<Record<string, { x: number; y: number; scale: number }>>(initialLogoPos || {});

    // Wrap setters to notify parent
    const setLogos: typeof setLogosInternal = useCallback((updater) => {
      setLogosInternal(prev => {
        const next = typeof updater === "function" ? updater(prev) : updater;
        onLogosChange?.(next);
        return next;
      });
    }, [onLogosChange]);

    const setLogoPos: typeof setLogoPosInternal = useCallback((updater) => {
      setLogoPosInternal(prev => {
        const next = typeof updater === "function" ? updater(prev) : updater;
        onLogoPosChange?.(next);
        return next;
      });
    }, [onLogoPosChange]);
    const [dragging, setDragging] = useState(false);
    const canvasAreaRef = useRef<HTMLDivElement>(null);
    const dragStartRef = useRef<{ startX: number; startY: number; origX: number; origY: number } | null>(null);

    const activeZoneData = printZones.find(z => z.positionId === activeZone);
    const activeLogoData = logos[activeZone];
    const currentLogoPos = logoPos[activeZone] || { x: 0.5, y: 0.5, scale: 0.65 };

    const previewUrl = (() => {
      if (!activeZoneData) return "";
      const baseMock = activeZoneData.imageWithArea || activeZoneData.imageBlank;
      if (selectedColorCode) {
        if (activeZoneData.imageVariants?.length) {
          const match = activeZoneData.imageVariants.find(v => {
            if (!v.colorCode || !selectedColorCode) return false;
            const c = v.colorCode.toUpperCase();
            const t = selectedColorCode.toUpperCase();
            return c === t || c.endsWith(`-${t}`) || t.endsWith(`-${c}`);
          });
          if (match) return proxyUrl(match.imageWithArea || match.imageBlank);
        }
        
        // Forge S3 URL for missing variants
        if (baseMock && selectedColorCode && productMasterCode) {
            const regex = new RegExp(`(${productMasterCode}-)([A-Za-z0-9]+)`, 'i');
            if (regex.test(baseMock)) {
                const targetSyntax = `${productMasterCode}-${selectedColorCode}`.toUpperCase();
                return proxyUrl(baseMock.replace(regex, targetSyntax));
            }
        }
      }
      return proxyUrl(baseMock || productImage);
    })();

    // Emit placements when logos change
    useEffect(() => {
      if (!onPlacementsChange) return;
      const placements: LogoPlacement[] = [];
      for (const [posId, logoData] of Object.entries(logos)) {
        const pos = logoPos[posId] || { x: 0.5, y: 0.5, scale: 0.65 };
        placements.push({
          positionId: posId, logoDataUrl: logoData.dataUrl, logoFileName: logoData.fileName,
          x: pos.x, y: pos.y, width: pos.scale, height: pos.scale,
          rotation: 0, scaleX: pos.scale, scaleY: pos.scale,
        });
      }
      onPlacementsChange(placements);
    }, [logos, logoPos, onPlacementsChange]);

    // Upload handler
    const handleLogoUpload = useCallback((file: File) => {
      if (!activeZone) return;
      const reader = new FileReader();
      reader.onload = (e) => {
        const dataUrl = e.target?.result as string;
        if (!dataUrl) return;
        setLogos(prev => ({ ...prev, [activeZone]: { dataUrl, fileName: file.name } }));
        setLogoPos(prev => ({ ...prev, [activeZone]: { x: 0.5, y: 0.5, scale: 0.65 } }));
      };
      reader.readAsDataURL(file);
    }, [activeZone]);

    // Drag handlers — relative to the canvas area div
    const handleLogoMouseDown = (e: React.MouseEvent) => {
      e.preventDefault(); e.stopPropagation();
      setDragging(true);
      dragStartRef.current = {
        startX: e.clientX, startY: e.clientY,
        origX: currentLogoPos.x, origY: currentLogoPos.y,
      };
    };

    useEffect(() => {
      if (!dragging) return;
      const handleMouseMove = (e: MouseEvent) => {
        if (!dragStartRef.current || !canvasAreaRef.current) return;
        const rect = canvasAreaRef.current.getBoundingClientRect();
        const dx = (e.clientX - dragStartRef.current.startX) / rect.width;
        const dy = (e.clientY - dragStartRef.current.startY) / rect.height;
        const newX = Math.max(0.05, Math.min(0.95, dragStartRef.current.origX + dx));
        const newY = Math.max(0.05, Math.min(0.95, dragStartRef.current.origY + dy));
        setLogoPos(prev => ({ ...prev, [activeZone]: { ...currentLogoPos, x: newX, y: newY } }));
      };
      const handleMouseUp = () => { setDragging(false); dragStartRef.current = null; };
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
      return () => {
        window.removeEventListener("mousemove", handleMouseMove);
        window.removeEventListener("mouseup", handleMouseUp);
      };
    }, [dragging, activeZone, currentLogoPos]);

    const adjustScale = (delta: number) => {
      setLogoPos(prev => ({
        ...prev,
        [activeZone]: { ...currentLogoPos, scale: Math.max(0.15, Math.min(1, currentLogoPos.scale + delta)) },
      }));
    };

    const handleDeleteLogo = () => {
      setLogos(prev => { const n = { ...prev }; delete n[activeZone]; return n; });
      setLogoPos(prev => { const n = { ...prev }; delete n[activeZone]; return n; });
    };

    // Export: composites logo onto product image using the SAME logic as PreviewWithLogo
    // Uses natural image dimensions + position_points (%) + logo aspect ratio (objectFit contain)
    const exportMockup = useCallback(async (positionId: string): Promise<string | null> => {
      const zone = printZones.find(z => z.positionId === positionId);
      const logo = logos[positionId];
      if (!zone || !logo) return null;
      try {
        // Load product image (color-matched) — same logic as previewUrl
        let imgSrc = zone.imageWithArea || zone.imageBlank;
        let isForged = false;
        
        if (selectedColorCode) {
          if (zone.imageVariants?.length) {
            const match = zone.imageVariants.find(v => {
              if (!v.colorCode || !selectedColorCode) return false;
              const c = v.colorCode.toUpperCase();
              const t = selectedColorCode.toUpperCase();
              return c === t || c.endsWith(`-${t}`) || t.endsWith(`-${c}`);
            });
            if (match) imgSrc = match.imageWithArea || match.imageBlank || imgSrc;
          } else if (imgSrc && selectedColorCode && productMasterCode) {
            // Forge URL
            const regex = new RegExp(`(${productMasterCode}-)([A-Za-z0-9]+)`, 'i');
            if (regex.test(imgSrc)) {
                const targetSyntax = `${productMasterCode}-${selectedColorCode}`.toUpperCase();
                imgSrc = imgSrc.replace(regex, targetSyntax);
                isForged = true;
            }
          }
        }
        
        if (!imgSrc) imgSrc = productImage;
        
        let productImg;
        try {
          productImg = await loadImage(proxyUrl(imgSrc));
        } catch (err) {
          if (isForged) {
             console.log("[Canvas Export] Forged URL failed 404, falling back to base mock", zone.imageWithArea);
             productImg = await loadImage(proxyUrl(zone.imageWithArea || productImage));
          } else {
             throw err;
          }
        }
        if (!productImg) return null;

        // Use NATURAL dimensions — matches how PreviewWithLogo renders the <img>
        const natW = productImg.naturalWidth;
        const natH = productImg.naturalHeight;
        const canvas = document.createElement("canvas");
        canvas.width = natW;
        canvas.height = natH;
        const ctx = canvas.getContext("2d");
        if (!ctx) return null;

        // White background first — prevents black bars on transparent/partial images
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, natW, natH);

        // Draw product image at full natural size
        ctx.drawImage(productImg, 0, 0, natW, natH);

        // Draw logo using IDENTICAL math to PreviewWithLogo's logoOverlay
        const displayDataUrl = getDisplayDataUrl(logo.dataUrl, logo.fileName);
        const logoImg = await loadImage(displayDataUrl);
        let parsedPoints = zone.points;
        if (typeof parsedPoints === "string") {
          try { parsedPoints = JSON.parse(parsedPoints); } catch(e) { parsedPoints = []; }
        }
        if (!Array.isArray(parsedPoints)) parsedPoints = [];

        if (logoImg && parsedPoints.length >= 2) {
          const pts = [...parsedPoints].sort((a: any, b: any) => a.sequence_no - b.sequence_no);
          const p = logoPos[positionId] || { x: 0.5, y: 0.5, scale: 0.65 };

          // Dynamic bounding box calc (supports polygons >2 points and any coordinate order)
          const minXPct = Math.min(...pts.map(p => p.distance_from_left)) / natW;
          const maxXPct = Math.max(...pts.map(p => p.distance_from_left)) / natW;
          const minYPct = Math.min(...pts.map(p => p.distance_from_top)) / natH;
          const maxYPct = Math.max(...pts.map(p => p.distance_from_top)) / natH;

          // Same relative % calc as PreviewWithLogo
          const zoneLeftPct = minXPct;
          const zoneTopPct = minYPct;
          const zoneWidthPct = maxXPct - minXPct;
          const zoneHeightPct = maxYPct - minYPct;

          // Zone bounding box in pixels (matches PreviewWithLogo's CSS %)
          const zonePxW = zoneWidthPct * natW * p.scale;
          const zonePxH = zoneHeightPct * natH * p.scale;

          // ── KEY FIX: respect logo aspect ratio (CSS objectFit: contain) ──
          // PreviewWithLogo uses CSS width+height+objectFit:contain on the <img>,
          // which fits the logo INSIDE the zone rect preserving its own aspect ratio.
          // ctx.drawImage stretches — so we must calculate the "contain" box ourselves.
          const logoNatAspect = logoImg.naturalWidth / logoImg.naturalHeight;
          const zoneAspect = zonePxW / zonePxH;
          let drawW: number, drawH: number;
          if (logoNatAspect > zoneAspect) {
            // Logo is wider than zone → constrain by width
            drawW = zonePxW;
            drawH = zonePxW / logoNatAspect;
          } else {
            // Logo is taller than zone → constrain by height
            drawH = zonePxH;
            drawW = zonePxH * logoNatAspect;
          }

          // Center the logo within its zone box (same as objectFit: contain centering)
          const logoLeftPct = zoneLeftPct + zoneWidthPct * p.x;
          const logoTopPct = zoneTopPct + zoneHeightPct * p.y;
          const lx = logoLeftPct * natW - drawW / 2;
          const ly = logoTopPct * natH - drawH / 2;

          ctx.globalAlpha = 0.92;
          ctx.drawImage(logoImg, lx, ly, drawW, drawH);
          ctx.globalAlpha = 1;
        }
        return canvas.toDataURL("image/jpeg", 0.85);
      } catch (err) {
        console.error("[exportMockup] Error:", err);
        return null;
      }
    }, [printZones, logos, logoPos, selectedColorCode]);

    const exportAllMockups = useCallback(async () => {
      const mockups: Record<string, string> = {};
      for (const zone of printZones) {
        if (logos[zone.positionId]) {
          const m = await exportMockup(zone.positionId);
          if (m) mockups[zone.positionId] = m;
        }
      }
      return mockups;
    }, [printZones, logos, exportMockup]);

    useImperativeHandle(ref, () => ({
      getLogoPlacements: () => {
        const placements: LogoPlacement[] = [];
        for (const [posId, logoData] of Object.entries(logos)) {
          const pos = logoPos[posId] || { x: 0.5, y: 0.5, scale: 0.65 };
          placements.push({
            positionId: posId, logoDataUrl: logoData.dataUrl, logoFileName: logoData.fileName,
            x: pos.x, y: pos.y, width: pos.scale, height: pos.scale,
            rotation: 0, scaleX: pos.scale, scaleY: pos.scale,
          });
        }
        return placements;
      },
      exportMockup, exportAllMockups,
    }));

    // Drop handler
    const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); };
    const handleDrop = (e: React.DragEvent) => {
      e.preventDefault();
      const file = e.dataTransfer.files[0];
      if (file && file.type.startsWith("image/")) handleLogoUpload(file);
    };

    // ── RENDER ───────────────────────────────────────────────
    return (
      <div className="space-y-4">
        {/* Zone Tabs */}
        <div className="flex gap-2 flex-wrap">
          {printZones.map((zone) => {
            const hasLogo = !!logos[zone.positionId];
            const isActive = activeZone === zone.positionId;
            return (
              <button
                key={zone.positionId}
                onClick={() => setActiveZone(zone.positionId)}
                className={`relative px-4 py-2.5 rounded-xl border-2 transition-all text-left ${
                  isActive ? "border-brand-red bg-brand-red/[0.06] shadow-sm" : "border-surface-200 hover:border-gray-300"
                }`}
              >
                <div className="flex items-center gap-2">
                  <Layers size={14} className={isActive ? "text-brand-red" : "text-gray-400"} />
                  <span className={`text-sm font-semibold ${isActive ? "text-brand-red" : ""}`}>{zone.positionName}</span>
                  {hasLogo && <span className="w-2 h-2 rounded-full bg-green-500" />}
                </div>
                <div className="text-[10px] text-gray-400 mt-0.5">{zone.maxWidthMm}&times;{zone.maxHeightMm}mm</div>
              </button>
            );
          })}
        </div>

        {/* Main area: Canvas + Preview side by side */}
        <div className="flex gap-4 items-start">
          {/* LEFT: Print area canvas */}
          <div className="flex-1 min-w-0">
            <div className="text-[10px] text-gray-400 mb-1.5 font-semibold uppercase tracking-wide">
              &Aacute;rea de impresi&oacute;n &middot; {activeZoneData?.maxWidthMm}&times;{activeZoneData?.maxHeightMm}mm
            </div>
            <div
              ref={canvasAreaRef}
              className="relative rounded-xl border-2 border-dashed border-brand-red/30 bg-white overflow-hidden"
              style={{
                aspectRatio: `${activeZoneData?.maxWidthMm || 100} / ${activeZoneData?.maxHeightMm || 100}`,
                maxHeight: "420px",
                backgroundImage: "linear-gradient(45deg, #f0f0f0 25%, transparent 25%), linear-gradient(-45deg, #f0f0f0 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #f0f0f0 75%), linear-gradient(-45deg, transparent 75%, #f0f0f0 75%)",
                backgroundSize: "16px 16px",
                backgroundPosition: "0 0, 0 8px, 8px -8px, -8px 0px",
              }}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
            >
              {/* Logo in the canvas */}
              {activeLogoData ? (
                <img
                  src={getDisplayDataUrl(activeLogoData.dataUrl, activeLogoData.fileName)}
                  alt="Logo"
                  className="cursor-move select-none"
                  style={{
                    position: "absolute",
                    left: `${currentLogoPos.x * 100}%`,
                    top: `${currentLogoPos.y * 100}%`,
                    transform: "translate(-50%, -50%)",
                    width: `${currentLogoPos.scale * 80}%`,
                    height: "auto",
                    maxWidth: "90%",
                    maxHeight: "90%",
                    objectFit: "contain",
                    filter: "drop-shadow(0 1px 4px rgba(0,0,0,0.12))",
                    zIndex: 5,
                  }}
                  onMouseDown={handleLogoMouseDown}
                  draggable={false}
                />
              ) : (
                <div
                  className="absolute inset-0 flex items-center justify-center cursor-pointer"
                  onClick={() => document.getElementById(`logo-upload-${activeZone}`)?.click()}
                >
                  <div className="text-center">
                    <Upload size={28} className="text-brand-red/40 mx-auto mb-2" />
                    <p className="text-xs text-gray-400 font-medium">Arrastra tu logo aqu&iacute;</p>
                    <p className="text-[10px] text-gray-300 mt-1">PNG, SVG, AI, EPS, PDF</p>
                  </div>
                </div>
              )}
            </div>

            {/* Upload button */}
            <div className="mt-3 flex justify-center">
              <button
                onClick={() => document.getElementById(`logo-upload-${activeZone}`)?.click()}
                className="bg-white text-brand-red text-xs font-semibold px-4 py-2 rounded-full shadow-sm border border-brand-red/20 hover:bg-brand-red hover:text-white transition-colors flex items-center gap-2"
              >
                <Upload size={14} />
                {activeLogoData ? "Cambiar logo" : "Subir logo"}
              </button>
            </div>

            <input
              id={`logo-upload-${activeZone}`}
              type="file" accept=".png,.jpg,.jpeg,.svg,.webp,.gif,.ai,.eps,.pdf" className="hidden"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) handleLogoUpload(f); e.target.value = ""; }}
            />
          </div>

          {/* RIGHT: Product preview with logo overlay */}
          <div className="w-[280px] flex-shrink-0">
            <div className="text-[10px] text-gray-400 mb-1.5 font-semibold uppercase tracking-wide flex items-center gap-1">
              <Eye size={10} /> Vista previa
            </div>
            <PreviewWithLogo
              previewUrl={previewUrl}
              productName={productName}
              activeLogoData={activeLogoData}
              activeZoneData={activeZoneData}
              currentLogoPos={currentLogoPos}
            />
            <div className="text-[9px] text-gray-300 text-center mt-1">
              {activeZoneData?.positionName}
            </div>
          </div>
        </div>

        {/* Toolbar */}
        {activeLogoData && (
          <div className="flex items-center gap-3 bg-surface-50 rounded-xl px-4 py-2.5 border border-surface-200">
            <span className="text-xs text-gray-400 mr-2">
              <Move size={12} className="inline mr-1" />Arrastra el logo para moverlo
            </span>
            <div className="flex-1" />
            <button onClick={() => adjustScale(-0.1)} className="w-7 h-7 rounded-lg bg-white border border-surface-200 flex items-center justify-center text-gray-500 hover:text-gray-700" title="Reducir"><ZoomOut size={13} /></button>
            <span className="text-[10px] font-mono text-gray-400 w-10 text-center">{Math.round(currentLogoPos.scale * 100)}%</span>
            <button onClick={() => adjustScale(0.1)} className="w-7 h-7 rounded-lg bg-white border border-surface-200 flex items-center justify-center text-gray-500 hover:text-gray-700" title="Ampliar"><ZoomIn size={13} /></button>
            <button onClick={() => setLogoPos(prev => ({ ...prev, [activeZone]: { x: 0.5, y: 0.5, scale: 0.65 } }))} className="w-7 h-7 rounded-lg bg-white border border-surface-200 flex items-center justify-center text-gray-500 hover:text-gray-700" title="Centrar"><RotateCcw size={13} /></button>
            <button onClick={handleDeleteLogo} className="w-7 h-7 rounded-lg bg-white border border-red-200 flex items-center justify-center text-red-400 hover:text-red-600 hover:bg-red-50" title="Eliminar logo"><Trash2 size={13} /></button>
          </div>
        )}

        {/* Bottom info */}
        <div className="flex items-center justify-between text-xs text-gray-400">
          <span>{Object.keys(logos).length} de {printZones.length} posiciones con logo</span>
          {activeLogoData && <span className="text-green-600 font-medium">&#10003; {activeLogoData.fileName}</span>}
        </div>
      </div>
    );
  }
);


// ============================================================
// PREVIEW WITH LOGO — detects natural image dimensions
// ============================================================
export function PreviewWithLogo({ previewUrl, productName, activeLogoData, activeZoneData, currentLogoPos }: {
  previewUrl: string;
  productName: string;
  activeLogoData: { dataUrl: string; fileName: string } | undefined;
  activeZoneData: PrintZone | undefined;
  currentLogoPos: { x: number; y: number; scale: number };
}) {
  const imgRef = useRef<HTMLImageElement>(null);
  const [imgNatural, setImgNatural] = useState<{ w: number; h: number } | null>(null);

  const handleImageLoad = useCallback(() => {
    if (imgRef.current) {
      setImgNatural({ w: imgRef.current.naturalWidth, h: imgRef.current.naturalHeight });
    }
  }, []);

  // Reset dimensions when URL changes
  useEffect(() => { setImgNatural(null); }, [previewUrl]);

  const logoOverlay = (() => {
    if (!activeLogoData || !activeZoneData?.points || !imgNatural) return null;
    let parsedPoints = activeZoneData.points;
    if (typeof parsedPoints === "string") {
      try { parsedPoints = JSON.parse(parsedPoints); } catch(e) { parsedPoints = []; }
    }
    if (!Array.isArray(parsedPoints) || parsedPoints.length < 2) return null;

    const pts = [...parsedPoints].sort((a: any, b: any) => a.sequence_no - b.sequence_no);
    const imgW = imgNatural.w, imgH = imgNatural.h;
    
    const minX = Math.min(...pts.map(p => p.distance_from_left));
    const maxX = Math.max(...pts.map(p => p.distance_from_left));
    const minY = Math.min(...pts.map(p => p.distance_from_top));
    const maxY = Math.max(...pts.map(p => p.distance_from_top));

    const zoneLeft = (minX / imgW) * 100;
    const zoneTop = (minY / imgH) * 100;
    const zoneWidth = ((maxX - minX) / imgW) * 100;
    const zoneHeight = ((maxY - minY) / imgH) * 100;
    const logoW = zoneWidth * currentLogoPos.scale;
    const logoH = zoneHeight * currentLogoPos.scale;
    const logoLeft = zoneLeft + zoneWidth * currentLogoPos.x - logoW / 2;
    const logoTop = zoneTop + zoneHeight * currentLogoPos.y - logoH / 2;
    const displayDataUrl = getDisplayDataUrl(activeLogoData.dataUrl, activeLogoData.fileName);
    return (
      <img
        src={displayDataUrl}
        alt="Logo preview"
        className="pointer-events-none select-none"
        style={{
          position: "absolute",
          left: `${logoLeft}%`,
          top: `${logoTop}%`,
          width: `${logoW}%`,
          height: `${logoH}%`,
          objectFit: "contain",
          opacity: 0.92,
          filter: "drop-shadow(0 1px 3px rgba(0,0,0,0.15))",
        }}
        draggable={false}
      />
    );
  })();

  return (
    <div className="rounded-xl border border-surface-200 bg-surface-50 overflow-hidden relative">
      {previewUrl ? (
        <>
          <img
            ref={imgRef}
            src={previewUrl}
            alt={productName}
            className="w-full h-auto block"
            draggable={false}
            onLoad={handleImageLoad}
          />
          {logoOverlay}
        </>
      ) : (
        <div className="aspect-square flex items-center justify-center text-gray-300 text-xs">Sin imagen</div>
      )}
    </div>
  );
}

// ============================================================
// HELPER: Load image as HTMLImageElement
// ============================================================
function loadImage(url: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = url;
  });
}
