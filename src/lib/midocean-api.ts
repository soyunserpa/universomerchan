// ============================================================
// UNIVERSO MERCHAN — Midocean API Client
// ============================================================
// Handles all communication with Midocean's REST APIs.
// Auth: x-Gateway-APIKey header on every request.
// Base URL: https://api.midocean.com/gateway/
// ============================================================

const MIDOCEAN_BASE_URL = "https://api.midocean.com/gateway";
const API_KEY = process.env.MIDOCEAN_API_KEY!;

if (!API_KEY) {
  throw new Error("MIDOCEAN_API_KEY environment variable is required");
}

const headers = {
  "x-Gateway-APIKey": API_KEY,
  "Accept": "text/json",
  "Content-Type": "application/json",
};

// ============================================================
// HELPER
// ============================================================

async function midoceanGet<T>(endpoint: string): Promise<T> {
  const url = `${MIDOCEAN_BASE_URL}${endpoint}`;
  console.log(`[Midocean API] GET ${url}`);
  
  const response = await fetch(url, { method: "GET", headers });
  
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Midocean API error ${response.status}: ${errorText}`);
  }
  
  return response.json();
}

async function midoceanPost<T>(endpoint: string, body: any): Promise<T> {
  const url = `${MIDOCEAN_BASE_URL}${endpoint}`;
  console.log(`[Midocean API] POST ${url}`);
  
  const response = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Midocean API error ${response.status}: ${errorText}`);
  }
  
  return response.json();
}

// ============================================================
// 1. PRODUCT INFORMATION 2.0
// GET /products/2.0?language=es
// Returns ALL products in the Midocean catalog
// ============================================================

export interface MidoceanProduct {
  master_code: string;
  master_id: string;
  type_of_products: string;
  commodity_code: string;
  number_of_print_positions: string;
  country_of_origin: string;
  brand: string;
  product_name: string;
  category_code: string;
  product_class: string;
  dimensions: string;
  short_description: string;
  long_description: string;
  material: string;
  green: string;
  printable: string;
  digital_assets: Array<{
    url: string;
    type: string;
    subtype: string;
  }>;
  variants: Array<{
    variant_id: string;
    sku: string;
    release_date: string;
    product_proposition_category: string;
    category_level1: string;
    category_level2: string;
    category_level3: string;
    color_description: string;
    color_group: string;
    plc_status: string;
    plc_status_description: string;
    gtin: string;
    color_code: string;
    pms_color: string;
    size?: string;
    digital_assets: Array<{
      url: string;
      url_highress: string;
      type: string;
      subtype: string;
    }>;
  }>;
}

export async function fetchAllProducts(): Promise<MidoceanProduct[]> {
  console.log("[Midocean Sync] Fetching all products (language=es)...");
  const data = await midoceanGet<MidoceanProduct[]>("/products/2.0?language=es");
  console.log(`[Midocean Sync] Received ${data.length} products`);
  return data;
}

// ============================================================
// 2. STOCK INFORMATION 2.0
// GET /stock/2.0
// Returns stock levels per SKU
// ============================================================

export interface MidoceanStockItem {
  sku: string;
  qty: number;
  first_arrival_qty?: number;
  first_arrival_date?: string;
}

export async function fetchAllStock(): Promise<MidoceanStockItem[]> {
  console.log("[Midocean Sync] Fetching stock levels...");
  const data = await midoceanGet<MidoceanStockItem[]>("/stock/2.0");
  console.log(`[Midocean Sync] Received stock for ${data.length} SKUs`);
  return data;
}

// ============================================================
// 3. PRINT DATA 1.0
// GET /printdata/1.0
// Returns print positions, techniques, max sizes per product
// ============================================================

export interface MidoceanPrintData {
  master_code: string;
  master_id?: string;
  item_color_numbers?: string[];
  print_manipulation?: string;
  print_template?: string;
  print_positions: Array<{
    position_id: string;
    position_description?: string;
    max_print_size_height: string | number;
    max_print_size_width: string | number;
    print_size_unit?: string;
    rotation?: number;
    print_position_type?: string;
    print_position_image?: string;
    category?: string;
    points?: Array<{
      distance_from_left: number;
      distance_from_top: number;
      sequence_no: number;
    }>;
    images?: Array<{
      print_position_image_blank: string;
      print_position_image_with_area: string;
      variant_color: string;
    }>;
    techniques: Array<{
      technique_id: string;
      technique_description?: string;
      max_number_of_colors?: string;
      default?: boolean;
      id?: string;
    }>;
    printing_techniques?: Array<{
      id: string;
      max_colours?: string;
      default?: boolean;
    }>;
  }>;
}

export async function fetchAllPrintData(): Promise<MidoceanPrintData[]> {
  console.log("[Midocean Sync] Fetching print data...");
  const url = `${MIDOCEAN_BASE_URL}/printdata/1.0`;
  const response = await fetch(url, { method: "GET", headers });
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Midocean Print Data API error ${response.status}: ${errorText}`);
  }
  const responseText = await response.text();
  let data: any;
  if (responseText.startsWith("http")) {
    console.log("[Midocean Sync] Print data: following redirect URL...");
    const redirectResponse = await fetch(responseText);
    data = await redirectResponse.json();
  } else {
    data = JSON.parse(responseText);
  }
  let products: MidoceanPrintData[];
  if (Array.isArray(data)) {
    products = data;
  } else if (data.products && Array.isArray(data.products)) {
    products = data.products;
  } else {
    console.error("[Midocean Sync] Unexpected print data format:", Object.keys(data));
    products = [];
  }
  for (const product of products) {
    for (const pos of product.print_positions || []) {
      if (!pos.techniques && (pos as any).printing_techniques) {
        pos.techniques = (pos as any).printing_techniques.map((t: any) => ({
          technique_id: t.id || t.technique_id,
          technique_description: t.description || t.technique_description || t.id,
          max_number_of_colors: t.max_colours || t.max_number_of_colors,
        }));
      }
      if (pos.techniques) {
        pos.techniques = pos.techniques.map(t => ({
          ...t,
          technique_id: t.technique_id || (t as any).id,
        }));
      }
    }
  }
  console.log(`[Midocean Sync] Received print data for ${products.length} products`);
  return products;
}

// ============================================================
// 4. PRODUCT PRICELIST 2.0
// GET /pricelist/2.0
// Returns prices per product with quantity scales
// ============================================================

// Real structure from Midocean API pricelist/2.0:
// { currency, date, price: [{ sku, variant_id, price:"6,90", valid_until, scale? }] }
// `scale` is optional — only ~52 of 14,382 SKUs have quantity scales.
// When present: [{ minimum_quantity:"500", price:"2,99" }, ...]

export interface MidoceanPricelistSkuEntry {
  sku: string;
  variant_id: string;
  price: string;          // EU format "6,90" or "1.234,50"
  valid_until: string;
  scale?: Array<{
    minimum_quantity: string;
    price: string;        // EU format
  }>;
}

export interface MidoceanPricelistRaw {
  currency: string;
  date: string;
  price: MidoceanPricelistSkuEntry[];  // NOT "prices" — the API field is "price"
}

export async function fetchPricelist(): Promise<MidoceanPricelistRaw> {
  console.log("[Midocean Sync] Fetching product pricelist...");
  const data = await midoceanGet<MidoceanPricelistRaw>("/pricelist/2.0");
  console.log(`[Midocean Sync] Received pricelist with ${data.price?.length} SKU prices`);
  return data;
}

// ============================================================
// 5. PRINT PRICELIST 2.0
// GET /printpricelist/2.0
// Returns print technique prices with 4 pricing types
// ============================================================

export interface MidoceanPrintPricelist {
  currency: string;
  pricelist_valid_from: string;
  pricelist_valid_until: string;
  print_manipulations: Array<{
    code: string;           // "A", "B", "C", "D", "E", "Z"
    description: string;    // "Simple", "Medium", "Complex", etc.
    price: string;          // EU format "0,07"
  }>;
  print_techniques: Array<{
    id: string;
    description: string;
    pricing_type: string; // NumberOfColours | NumberOfPositions | AreaRange | ColourAreaRange
    setup: string;
    setup_repeat: string;
    next_colour_cost_indicator: string;
    var_costs: Array<{
      range_id: string;
      area_from: string;
      area_to: string;
      scales: Array<{
        minimum_quantity: string;
        price: string;
        next_price: string;
      }>;
    }>;
  }>;
}

export async function fetchPrintPricelist(): Promise<MidoceanPrintPricelist> {
  console.log("[Midocean Sync] Fetching print pricelist...");
  const data = await midoceanGet<MidoceanPrintPricelist>("/printpricelist/2.0");
  console.log(`[Midocean Sync] Received print pricelist`);
  return data;
}

// ============================================================
// 6. ORDER ENTRY 2.1
// POST /order/2.1/create
// Creates orders in Midocean's SAP system
// ============================================================

export interface MidoceanOrderRequest {
  order_header: {
    preferred_shipping_date: string;  // YYYY-MM-DD
    currency: string;
    contact_email: string;
    check_price: string;
    shipping_address: {
      contact_name: string;
      company_name: string;
      street1: string;
      postal_code: string;
      city: string;
      region: string;
      country: string;
      email: string;
      phone: string;
    };
    po_number: string;              // Our order reference (UM-2026-XXXX)
    timestamp: string;              // ISO format
    contact_name: string;
    order_type: "NORMAL" | "PRINT" | "SAMPLE";
    express: string;
  };
  order_lines: Array<{
    order_line_id: string;
    master_code?: string;           // Required for PRINT orders
    sku?: string;                   // Required for NORMAL/SAMPLE orders
    variant_id?: string;
    quantity: string;
    expected_price: string;
    // For PRINT orders:
    printing_positions?: Array<{
      id: string;                   // "FRONT", "BACK", etc.
      print_size_height: string;    // mm
      print_size_width: string;     // mm
      printing_technique_id: string;
      number_of_print_colors: string;
      print_artwork_url: string;
      print_mockup_url?: string;
      print_instruction?: string;
      print_colors: Array<{ color: string }>;
    }>;
    print_items?: Array<{
      item_color_number: string;
      item_size?: string;           // For textiles
      quantity: string;
    }>;
  }>;
}

export async function createOrder(order: MidoceanOrderRequest): Promise<any> {
  console.log(`[Midocean API] Creating order: ${order.order_header.po_number}`);
  return midoceanPost("/order/2.1/create", order);
}

// ============================================================
// 7. ORDER DETAILS 2.1
// GET /order/2.1/detail?order_number=XXXXX
// Returns order status, tracking, proof URLs
// ============================================================

export interface MidoceanOrderDetails {
  order_header: {
    order_found: string;
    order_number: string;
    order_date: string;
    order_status: "OPEN" | "COMPLETED" | "CANCELLED";
    order_type: string;
    total_item_price: string;
    total_print_costs: string;
    freight_charge: string;
    total_net_price: string;
    delivery_service: string;
  };
  order_lines: Array<{
    order_line_id: string;
    master_code: string;
    quantity: string;
    item_price: string;
    print_setup: string;
    print_cost: string;
    print_handling: string;
    proof_url: string;
    proof_status: "InProgress" | "ArtworkRequired" | "WaitingApproval" | "Approved";
    shipping_status: "OPEN" | "COMPLETED";
    shipping_date: string;
    forwarder?: string;
    tracking_number?: string;
    tracking_url?: string;
  }>;
}

export async function getOrderDetails(orderNumber: string): Promise<MidoceanOrderDetails> {
  console.log(`[Midocean API] Getting order details: ${orderNumber}`);
  return midoceanGet(`/order/2.1/detail?order_number=${orderNumber}`);
}

// ============================================================
// 8. APPROVE PROOF 1.0
// POST /proof/1.0/approve
// ============================================================

export async function approveProof(orderNumber: string, lineId: string): Promise<any> {
  console.log(`[Midocean API] Approving proof: order=${orderNumber} line=${lineId}`);
  return midoceanPost("/proof/1.0/approve", {
    order_number: orderNumber,
    order_line_id: lineId,
  });
}

// ============================================================
// 9. REJECT PROOF 1.0
// POST /proof/1.0/reject
// ============================================================

export async function rejectProof(
  orderNumber: string,
  lineId: string,
  reason: string
): Promise<any> {
  console.log(`[Midocean API] Rejecting proof: order=${orderNumber} line=${lineId}`);
  return midoceanPost("/proof/1.0/reject", {
    order_number: orderNumber,
    order_line_id: lineId,
    rejection_reason: reason,
  });
}

// ============================================================
// 10. ADD ARTWORK 1.0
// POST /artwork/1.0/add
// ============================================================

export async function addArtwork(
  orderNumber: string,
  lineId: string,
  artworkUrl: string
): Promise<any> {
  console.log(`[Midocean API] Adding artwork: order=${orderNumber} line=${lineId}`);
  return midoceanPost("/artwork/1.0/add", {
    order_number: orderNumber,
    order_line_id: lineId,
    artwork_url: artworkUrl,
  });
}

// ============================================================
// PRINT PRICE CALCULATOR
// Implements all 4 Midocean pricing types + textile white rule
// ============================================================

export interface PrintPriceCalculation {
  setupCost: number;
  printingCost: number;
  handlingCost: number;
  totalPrintCost: number;
}

export function calculatePrintPrice(params: {
  technique: MidoceanPrintPricelist["print_techniques"][0];
  quantity: number;
  numColors: number;
  numPositions: number;
  areaCm2: number;
  isRepeatOrder: boolean;
  isTextileNonWhite: boolean; // Non-white textile variants need +1 color for ST technique
  handlingPricePerUnit: number;
}): PrintPriceCalculation {
  const { technique, quantity, numColors, numPositions, areaCm2, isRepeatOrder, isTextileNonWhite, handlingPricePerUnit } = params;
  
  // Find the right scale price based on quantity
  const findScalePrice = (scales: Array<{ minimum_quantity: string; price: string; next_price: string }>) => {
    let selectedScale = scales[0];
    for (const scale of scales) {
      if (quantity >= parseInt(scale.minimum_quantity)) {
        selectedScale = scale;
      }
    }
    return {
      price: parseFloat(selectedScale.price.replace(",", ".")),
      nextPrice: selectedScale.next_price ? parseFloat(selectedScale.next_price.replace(",", ".")) : 0,
    };
  };

  // Setup cost
  const setupBase = parseFloat((isRepeatOrder ? technique.setup_repeat : technique.setup).replace(",", "."));
  let setupCost = 0;
  let printingCost = 0;

  // Effective colors for non-white textiles with ST technique
  const effectiveColors = isTextileNonWhite && technique.id.startsWith("ST") ? numColors + 1 : numColors;
  // But setup is still based on actual numColors, not effective
  
  switch (technique.pricing_type) {
    case "NumberOfColours": {
      setupCost = setupBase * numColors;
      const varCost = technique.var_costs[0]; // Usually single range for this type
      const { price, nextPrice } = findScalePrice(varCost.scales);
      
      if (technique.next_colour_cost_indicator === "true" || technique.next_colour_cost_indicator === "X") {
        // First color at price, rest at next_price
        const colorsForPrint = isTextileNonWhite ? effectiveColors : numColors;
        printingCost = (price * quantity) + (nextPrice * (colorsForPrint - 1) * quantity);
      } else {
        const colorsForPrint = isTextileNonWhite ? effectiveColors : numColors;
        printingCost = price * colorsForPrint * quantity;
      }
      break;
    }
    
    case "NumberOfPositions": {
      setupCost = setupBase * numPositions;
      const varCost = technique.var_costs[0];
      const { price } = findScalePrice(varCost.scales);
      printingCost = price * numPositions * quantity;
      break;
    }
    
    case "AreaRange": {
      setupCost = setupBase;
      // Find the right area range
      let selectedRange = technique.var_costs[0];
      for (const range of technique.var_costs) {
        const from = parseFloat(range.area_from);
        const to = parseFloat(range.area_to);
        if (areaCm2 >= from && (to === 0 || areaCm2 <= to)) {
          selectedRange = range;
        }
      }
      const { price } = findScalePrice(selectedRange.scales);
      printingCost = price * quantity;
      break;
    }
    
    case "ColourAreaRange": {
      setupCost = setupBase * numColors;
      // Find the right area range, then multiply by colors
      let selectedRange = technique.var_costs[0];
      for (const range of technique.var_costs) {
        const from = parseFloat(range.area_from);
        const to = parseFloat(range.area_to);
        if (areaCm2 >= from && (to === 0 || areaCm2 <= to)) {
          selectedRange = range;
        }
      }
      const { price, nextPrice } = findScalePrice(selectedRange.scales);
      
      if (technique.next_colour_cost_indicator === "true" || technique.next_colour_cost_indicator === "X") {
        printingCost = (price * quantity) + (nextPrice * (numColors - 1) * quantity);
      } else {
        printingCost = price * numColors * quantity;
      }
      break;
    }
  }

  const handlingCost = handlingPricePerUnit * quantity;

  return {
    setupCost: Math.round(setupCost * 100) / 100,
    printingCost: Math.round(printingCost * 100) / 100,
    handlingCost: Math.round(handlingCost * 100) / 100,
    totalPrintCost: Math.round((setupCost + printingCost + handlingCost) * 100) / 100,
  };
}

// ============================================================
// WHITE TEXTILE CHECK
// Variants considered white: AS, WW, WD, WH, NB, NW, RH
// ============================================================

const WHITE_TEXTILE_CODES = ["AS", "WW", "WD", "WH", "NB", "NW", "RH"];

export function isWhiteTextileVariant(colorCode: string): boolean {
  return WHITE_TEXTILE_CODES.includes(colorCode.toUpperCase());
}
