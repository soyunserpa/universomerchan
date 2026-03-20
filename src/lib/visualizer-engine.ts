// ============================================================
// UNIVERSO MERCHAN — Mockup Visualizer Engine
// ============================================================
// Generates preview mockups by compositing the customer's logo
// onto the product image within the exact print area bounds.
//
// Key constraint: The logo placement MUST respect the max print
// dimensions from Midocean's Print Data API, so the customer
// sees a realistic preview of what they'll actually get.
//
// Two modes:
//   1. BROWSER (Canvas API) — Interactive preview in the configurator
//   2. SERVER (Sharp/Canvas) — Generate final mockup image for
//      Midocean's print_mockup_url field in the order
// ============================================================

export interface VisualizerConfig {
  // Product image (the base)
  productImageUrl: string;
  productImageWidth: number;   // px
  productImageHeight: number;  // px
  
  // Print zone on the product image (relative coordinates)
  // These define WHERE on the product image the print zone sits
  printZone: {
    x: number;      // % from left (0-100)
    y: number;      // % from top (0-100)
    width: number;   // % of product image width
    height: number;  // % of product image height
  };
  
  // Max print dimensions (from Midocean Print Data API)
  maxPrintWidthMm: number;
  maxPrintHeightMm: number;
  
  // Customer's actual print size (must be ≤ max)
  actualPrintWidthMm: number;
  actualPrintHeightMm: number;
  
  // Logo image
  logoImageUrl: string;
  logoWidth: number;   // px of uploaded logo
  logoHeight: number;  // px of uploaded logo
}

export interface VisualizerState {
  // Logo position within the print zone (relative to zone, not image)
  logoX: number;      // % from left of print zone (0-100)
  logoY: number;      // % from top of print zone (0-100)
  logoScale: number;  // 0.1 to 1.0 (% of max allowed area)
  logoRotation: number; // degrees
}

// ============================================================
// DEFAULT PRINT ZONES — Pre-mapped for common product types
// These are approximate positions of the printable area on
// standard Midocean product photos.
// In production, these would be refined per product or derived
// from Midocean's print_position_image data.
// ============================================================

export const DEFAULT_PRINT_ZONES: Record<string, Record<string, VisualizerConfig["printZone"]>> = {
  // Bottles/Termos — front is usually the center body
  "bottle": {
    FRONT: { x: 30, y: 25, width: 40, height: 35 },
    BACK:  { x: 30, y: 25, width: 40, height: 35 },
    WRAP:  { x: 15, y: 25, width: 70, height: 35 },
  },
  // Notebooks — front cover
  "notebook": {
    FRONT: { x: 20, y: 15, width: 60, height: 65 },
    BACK:  { x: 20, y: 15, width: 60, height: 65 },
  },
  // Bags — center of the bag
  "bag": {
    FRONT: { x: 15, y: 20, width: 70, height: 55 },
    BACK:  { x: 15, y: 20, width: 70, height: 55 },
  },
  // T-shirts — chest area
  "tshirt": {
    FRONT:    { x: 25, y: 20, width: 50, height: 40 },
    BACK:     { x: 25, y: 15, width: 50, height: 45 },
    LEFT_ARM: { x: 60, y: 25, width: 15, height: 15 },
  },
  // Mugs — side area
  "mug": {
    RIGHT: { x: 20, y: 20, width: 35, height: 50 },
    LEFT:  { x: 45, y: 20, width: 35, height: 50 },
    WRAP:  { x: 10, y: 20, width: 80, height: 50 },
  },
  // Pens — barrel
  "pen": {
    BARREL: { x: 20, y: 42, width: 60, height: 10 },
  },
  // Default fallback
  "default": {
    FRONT: { x: 25, y: 25, width: 50, height: 40 },
    BACK:  { x: 25, y: 25, width: 50, height: 40 },
  },
};

// ============================================================
// Detect product type from category/material for zone mapping
// ============================================================

export function detectProductType(category: string, material: string): string {
  const cat = category.toLowerCase();
  const mat = material.toLowerCase();
  
  if (cat.includes("botella") || cat.includes("termo") || cat.includes("bottle")) return "bottle";
  if (cat.includes("libreta") || cat.includes("notebook") || cat.includes("bloc")) return "notebook";
  if (cat.includes("bolsa") || cat.includes("bag") || cat.includes("tote")) return "bag";
  if (cat.includes("camiseta") || cat.includes("textil") || cat.includes("polo") || cat.includes("shirt")) return "tshirt";
  if (cat.includes("taza") || cat.includes("mug") || cat.includes("vaso")) return "mug";
  if (cat.includes("bolígrafo") || cat.includes("pen") || cat.includes("escritura")) return "pen";
  
  return "default";
}

// ============================================================
// Get print zone for a specific product and position
// ============================================================

export function getPrintZone(
  productType: string,
  positionId: string,
): VisualizerConfig["printZone"] {
  const zones = DEFAULT_PRINT_ZONES[productType] || DEFAULT_PRINT_ZONES["default"];
  return zones[positionId] || zones["FRONT"] || { x: 25, y: 25, width: 50, height: 40 };
}

// ============================================================
// Calculate the actual logo display size within the print zone
// Ensures the logo never exceeds the actual print dimensions
// ============================================================

export function calculateLogoDisplaySize(params: {
  maxPrintWidthMm: number;
  maxPrintHeightMm: number;
  actualPrintWidthMm: number;
  actualPrintHeightMm: number;
  printZoneWidthPx: number;
  printZoneHeightPx: number;
  logoAspectRatio: number;  // width / height
}): { widthPx: number; heightPx: number } {
  const {
    maxPrintWidthMm, maxPrintHeightMm,
    actualPrintWidthMm, actualPrintHeightMm,
    printZoneWidthPx, printZoneHeightPx,
    logoAspectRatio,
  } = params;
  
  // The print zone in the image represents the MAX print area.
  // The customer's ACTUAL print area is ≤ max.
  // Scale the display proportionally.
  const widthRatio = actualPrintWidthMm / maxPrintWidthMm;
  const heightRatio = actualPrintHeightMm / maxPrintHeightMm;
  
  const availableWidthPx = printZoneWidthPx * widthRatio;
  const availableHeightPx = printZoneHeightPx * heightRatio;
  
  // Fit the logo within the available area maintaining aspect ratio
  let logoWidthPx, logoHeightPx;
  
  if (logoAspectRatio > (availableWidthPx / availableHeightPx)) {
    // Logo is wider than the area — constrain by width
    logoWidthPx = availableWidthPx;
    logoHeightPx = availableWidthPx / logoAspectRatio;
  } else {
    // Logo is taller — constrain by height
    logoHeightPx = availableHeightPx;
    logoWidthPx = availableHeightPx * logoAspectRatio;
  }
  
  return {
    widthPx: Math.round(logoWidthPx),
    heightPx: Math.round(logoHeightPx),
  };
}

// ============================================================
// BROWSER CANVAS RENDERER
// Draws the composite image on an HTML Canvas element
// ============================================================

export function renderMockupToCanvas(
  canvas: HTMLCanvasElement,
  config: VisualizerConfig,
  state: VisualizerState,
  productImg: HTMLImageElement,
  logoImg: HTMLImageElement,
): void {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  
  const cw = canvas.width;
  const ch = canvas.height;
  
  // Clear
  ctx.clearRect(0, 0, cw, ch);
  
  // Draw product image scaled to canvas
  ctx.drawImage(productImg, 0, 0, cw, ch);
  
  // Calculate print zone in canvas pixels
  const zoneX = (config.printZone.x / 100) * cw;
  const zoneY = (config.printZone.y / 100) * ch;
  const zoneW = (config.printZone.width / 100) * cw;
  const zoneH = (config.printZone.height / 100) * ch;
  
  // Draw print zone border (dashed, subtle)
  ctx.save();
  ctx.setLineDash([4, 4]);
  ctx.strokeStyle = "rgba(222, 1, 33, 0.3)";
  ctx.lineWidth = 1;
  ctx.strokeRect(zoneX, zoneY, zoneW, zoneH);
  ctx.restore();
  
  // Calculate logo size within the zone
  const logoAspect = logoImg.naturalWidth / logoImg.naturalHeight;
  const logoSize = calculateLogoDisplaySize({
    maxPrintWidthMm: config.maxPrintWidthMm,
    maxPrintHeightMm: config.maxPrintHeightMm,
    actualPrintWidthMm: config.actualPrintWidthMm,
    actualPrintHeightMm: config.actualPrintHeightMm,
    printZoneWidthPx: zoneW,
    printZoneHeightPx: zoneH,
    logoAspectRatio: logoAspect,
  });
  
  // Apply scale from user interaction
  const scaledW = logoSize.widthPx * state.logoScale;
  const scaledH = logoSize.heightPx * state.logoScale;
  
  // Position within the zone
  const logoX = zoneX + (state.logoX / 100) * zoneW - scaledW / 2;
  const logoY = zoneY + (state.logoY / 100) * zoneH - scaledH / 2;
  
  // Draw logo with rotation
  ctx.save();
  ctx.translate(logoX + scaledW / 2, logoY + scaledH / 2);
  ctx.rotate((state.logoRotation * Math.PI) / 180);
  ctx.globalAlpha = 0.92; // Slight transparency for realism
  ctx.drawImage(logoImg, -scaledW / 2, -scaledH / 2, scaledW, scaledH);
  ctx.restore();
  
  // "Previsualización orientativa" watermark
  ctx.save();
  ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
  ctx.font = "11px sans-serif";
  const text = "Previsualización orientativa";
  const metrics = ctx.measureText(text);
  const pad = 6;
  ctx.fillRect(8, ch - 28, metrics.width + pad * 2, 20);
  ctx.fillStyle = "white";
  ctx.fillText(text, 8 + pad, ch - 14);
  ctx.restore();
}

// ============================================================
// EXPORT MOCKUP — Generate a PNG data URL from the canvas
// This URL can be uploaded to our server and used as
// print_mockup_url in the Midocean Order Entry API
// ============================================================

export function exportMockupAsDataUrl(canvas: HTMLCanvasElement): string {
  return canvas.toDataURL("image/png", 0.92);
}

export function exportMockupAsBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error("Failed to export canvas to blob"));
      },
      "image/png",
      0.92,
    );
  });
}

// ============================================================
// DEFAULT VISUALIZER STATE — Logo centered in the zone at 80%
// ============================================================

export function defaultVisualizerState(): VisualizerState {
  return {
    logoX: 50,       // Centered
    logoY: 50,       // Centered
    logoScale: 0.8,  // 80% of max allowed size
    logoRotation: 0,
  };
}
