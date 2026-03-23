// ============================================================
// UNIVERSO MERCHAN — Midocean Sync Engine
// ============================================================
// Orchestrates periodic synchronization of all Midocean APIs
// into the local PostgreSQL database.
// 
// Sync schedule (configured via admin_settings):
//   - Products:       Every 6 hours
//   - Stock:          Every 30 minutes
//   - Pricelist:      Every 6 hours
//   - Print Pricelist: Every 6 hours
//   - Print Data:     Every 6 hours
//   - Order Status:   Every 15 minutes (for active orders)
// ============================================================

import { db } from "./database";
import { eq, sql } from "drizzle-orm";
import * as schema from "./schema";
import * as midocean from "./midocean-api";
import { sendProofReadyEmail } from "./email-service";

// ============================================================
// SYNC PRODUCTS
// Fetches entire product catalog and upserts into local DB
// ============================================================

export async function syncProducts(): Promise<{ created: number; updated: number }> {
  const startTime = Date.now();
  let created = 0;
  let updated = 0;

  try {
    console.log("[Sync] Starting product sync...");
    const products = await midocean.fetchAllProducts();

    for (const product of products) {
      // Upsert product
      const existing = await db.query.products.findFirst({
        where: eq(schema.products.masterCode, product.master_code),
      });

      const productData = {
        masterCode: product.master_code,
        masterId: product.master_id,
        productName: product.product_name || product.master_code || "Sin nombre",
        shortDescription: product.short_description,
        longDescription: product.long_description,
        material: product.material,
        dimensions: product.dimensions,
        commodityCode: product.commodity_code,
        countryOfOrigin: product.country_of_origin,
        brand: product.brand,
        categoryCode: product.category_code,
        categoryLevel1: product.variants?.[0]?.category_level1 || "",
        categoryLevel2: product.variants?.[0]?.category_level2 || "",
        categoryLevel3: product.variants?.[0]?.category_level3 || "",
        printable: product.printable === "yes",
        isGreen: product.green === "yes",
        numberOfPrintPositions: parseInt(product.number_of_print_positions) || 0,
        digitalAssets: product.digital_assets,
        lastSyncedAt: new Date(),
        rawApiData: product as any,
        updatedAt: new Date(),
      };

      if (existing) {
        await db.update(schema.products)
          .set(productData)
          .where(eq(schema.products.masterCode, product.master_code));
        updated++;
      } else {
        await db.insert(schema.products).values({
          ...productData,
          isVisible: true,
          createdAt: new Date(),
        });
        created++;
      }

      // Upsert variants
      if (product.variants) {
        const dbProduct = await db.query.products.findFirst({
          where: eq(schema.products.masterCode, product.master_code),
        });

        if (dbProduct) {
          for (const variant of product.variants) {
            const existingVariant = await db.query.productVariants.findFirst({
              where: eq(schema.productVariants.sku, variant.sku),
            });

            const variantData = {
              productId: dbProduct.id,
              variantId: variant.variant_id,
              sku: variant.sku,
              colorDescription: variant.color_description,
              colorGroup: variant.color_group,
              colorCode: variant.color_code,
              pmsColor: variant.pms_color,
              size: variant.size || variant.size_textile || null,
              gtin: variant.gtin,
              plcStatus: variant.plc_status,
              plcStatusDescription: variant.plc_status_description,
              releaseDate: variant.release_date,
              digitalAssets: variant.digital_assets,
              updatedAt: new Date(),
            };

            if (existingVariant) {
              await db.update(schema.productVariants)
                .set(variantData)
                .where(eq(schema.productVariants.sku, variant.sku));
            } else {
              await db.insert(schema.productVariants).values({
                ...variantData,
                createdAt: new Date(),
              });
            }
          }
        }
      }
    }

    // Log success
    await logSync("products", "success", products.length, updated, created, Date.now() - startTime);
    console.log(`[Sync] Products complete: ${created} created, ${updated} updated`);
    return { created, updated };

  } catch (error: any) {
    await logSync("products", "error", 0, 0, 0, Date.now() - startTime, error.message);
    console.error("[Sync] Product sync failed:", error.message);
    throw error;
  }
}

// ============================================================
// SYNC STOCK
// Fetches current stock levels and updates local DB
// ============================================================

export async function syncStock(): Promise<{ updated: number }> {
  const startTime = Date.now();
  let updated = 0;

  try {
    console.log("[Sync] Starting stock sync...");
    const stockData = await midocean.fetchAllStock();

    // Batch upsert for performance
    for (const item of stockData) {
      await db.insert(schema.stock)
        .values({
          sku: item.sku,
          quantity: item.qty,
          lastSyncedAt: new Date(),
        })
        .onConflictDoUpdate({
          target: schema.stock.sku,
          set: {
            quantity: item.qty,
            lastSyncedAt: new Date(),
          },
        });
      updated++;
    }

    await logSync("stock", "success", stockData.length, updated, 0, Date.now() - startTime);
    console.log(`[Sync] Stock complete: ${updated} SKUs updated`);
    return { updated };

  } catch (error: any) {
    await logSync("stock", "error", 0, 0, 0, Date.now() - startTime, error.message);
    console.error("[Sync] Stock sync failed:", error.message);
    throw error;
  }
}

// ============================================================
// SYNC PRICELIST
// Midocean pricelist 2.0 returns prices per SKU (variant).
// Some SKUs include a `scale` array with quantity-based pricing.
//
// Strategy:
//   1. Upsert each SKU into `variant_prices` (per-SKU truth)
//   2. Aggregate by master_code into `product_prices` (for catalog listings)
//      - If any SKU has scales → use those (they're identical within a product)
//      - Otherwise → single scale at qty=1 with the lowest variant price
// ============================================================

export async function syncPricelist(): Promise<{ updated: number }> {
  const startTime = Date.now();
  let updated = 0;

  try {
    console.log("[Sync] Starting pricelist sync...");
    const pricelist = await midocean.fetchPricelist();
    const skuPrices = pricelist.price || [];
    console.log(`[Sync] Received ${skuPrices.length} SKU prices`);

    // Helper: parse EU price "6,90" or "1.234,50" → number; also handles "6.90" (legacy decimal)
    function parseEuPrice(s: string | number): number {
      if (typeof s === "number") return s;
      if (!s || s === "") return 0;
      const str = String(s).trim();
      // If it has comma → EU format: strip dots (thousands), replace comma with dot
      if (str.includes(",")) {
        return parseFloat(str.replace(/\./g, "").replace(",", ".")) || 0;
      }
      // Otherwise standard decimal
      return parseFloat(str) || 0;
    }

    // Build a map: SKU → variant info from product_variants table
    const variantRows = await db.execute(
      sql`SELECT sku, variant_id, product_id FROM product_variants`
    );
    const variantMap = new Map<string, { variantId: string; productId: number }>();
    for (const row of ((variantRows as any).rows || variantRows) as any[]) {
      variantMap.set(row.sku, { variantId: row.variant_id, productId: row.product_id });
    }

    // Build a map: product_id → master_code
    const productRows = await db.execute(
      sql`SELECT id, master_code FROM products`
    );
    const productIdToMaster = new Map<number, string>();
    for (const row of ((productRows as any).rows || productRows) as any[]) {
      productIdToMaster.set(row.id, row.master_code);
    }

    // Ensure variant_prices table exists (safe migration)
    try {
      await db.execute(sql`
        CREATE TABLE IF NOT EXISTS variant_prices (
          id SERIAL PRIMARY KEY,
          sku VARCHAR(30) NOT NULL,
          variant_id VARCHAR(20) NOT NULL,
          master_code VARCHAR(20) NOT NULL,
          price DECIMAL(10,4) NOT NULL,
          price_scales JSONB,
          valid_until VARCHAR(10),
          currency VARCHAR(3) DEFAULT 'EUR',
          last_synced_at TIMESTAMP DEFAULT NOW() NOT NULL
        )
      `);
      // Create unique index (ignore if exists)
      try {
        await db.execute(sql`CREATE UNIQUE INDEX variant_prices_sku_idx ON variant_prices (sku)`);
      } catch (e: any) {
        if (!e.message?.includes("already exists")) throw e;
      }
      try {
        await db.execute(sql`CREATE INDEX variant_prices_master_code_idx ON variant_prices (master_code)`);
      } catch (e: any) {
        if (!e.message?.includes("already exists")) throw e;
      }
    } catch (e: any) {
      console.log("[Sync] variant_prices table setup:", e.message);
    }

    // Group SKU prices by master_code for product_prices aggregation
    const byMaster = new Map<string, {
      prices: number[];
      scales: Array<{ minimum_quantity: string; price: string }> | null;
      validUntil: string;
    }>();

    // Process each SKU price in batches
    const BATCH_SIZE = 100;
    for (let i = 0; i < skuPrices.length; i += BATCH_SIZE) {
      const batch = skuPrices.slice(i, i + BATCH_SIZE);

      for (const entry of batch) {
        const price = parseEuPrice(entry.price);
        if (price <= 0) continue;

        // Resolve master_code: first try via variant_id from product_variants
        const variantInfo = variantMap.get(entry.sku);
        let masterCode = "";
        if (variantInfo) {
          masterCode = productIdToMaster.get(variantInfo.productId) || "";
        }
        // Fallback: extract master_code from SKU (format: "MO9177-06" → "MO9177" or "S47101-AQ-L" → "S47101")
        if (!masterCode) {
          masterCode = entry.sku.split("-")[0] || entry.sku;
        }

        // Parse scales if present (store as clean numbers)
        let cleanScales: Array<{ minimum_quantity: number; price: number }> | null = null;
        if (entry.scale && entry.scale.length > 0) {
          cleanScales = entry.scale.map(s => ({
            minimum_quantity: parseInt(s.minimum_quantity) || 1,
            price: parseEuPrice(s.price),
          })).sort((a, b) => a.minimum_quantity - b.minimum_quantity);
        }

        // Upsert into variant_prices
        await db.execute(sql`
          INSERT INTO variant_prices (sku, variant_id, master_code, price, price_scales, valid_until, currency, last_synced_at)
          VALUES (
            ${entry.sku},
            ${entry.variant_id},
            ${masterCode},
            ${price},
            ${cleanScales ? JSON.stringify(cleanScales) : null}::jsonb,
            ${entry.valid_until || ""},
            ${pricelist.currency || "EUR"},
            NOW()
          )
          ON CONFLICT (sku) DO UPDATE SET
            variant_id = EXCLUDED.variant_id,
            master_code = EXCLUDED.master_code,
            price = EXCLUDED.price,
            price_scales = EXCLUDED.price_scales,
            valid_until = EXCLUDED.valid_until,
            currency = EXCLUDED.currency,
            last_synced_at = NOW()
        `);
        updated++;

        // Aggregate for product_prices
        if (masterCode) {
          let group = byMaster.get(masterCode);
          if (!group) {
            group = { prices: [], scales: null, validUntil: entry.valid_until || "" };
            byMaster.set(masterCode, group);
          }
          group.prices.push(price);
          // If this SKU has scales, store them (they're identical across variants of the same product)
          if (entry.scale && entry.scale.length > 0 && !group.scales) {
            group.scales = entry.scale;
          }
        }
      }
    }

    // Now upsert aggregated product_prices
    let productPricesUpdated = 0;
    for (const [masterCode, group] of byMaster) {
      // Build price_scales for this product
      let priceScales: Array<{ minimum_quantity: number; price: number }>;

      if (group.scales && group.scales.length > 0) {
        // Product has real quantity scales — use them (parsed to clean numbers)
        priceScales = group.scales.map(s => ({
          minimum_quantity: parseInt(s.minimum_quantity) || 1,
          price: parseEuPrice(s.price),
        })).sort((a, b) => a.minimum_quantity - b.minimum_quantity);
      } else {
        // No scales — single price at qty=1, use the lowest variant price
        const minPrice = Math.min(...group.prices);
        priceScales = [{ minimum_quantity: 1, price: minPrice }];
      }

      await db.insert(schema.productPrices)
        .values({
          masterCode,
          currency: pricelist.currency || "EUR",
          pricelistValidFrom: pricelist.date || "",
          pricelistValidUntil: group.validUntil,
          priceScales: priceScales,
          lastSyncedAt: new Date(),
        })
        .onConflictDoUpdate({
          target: schema.productPrices.masterCode,
          set: {
            priceScales: priceScales,
            currency: pricelist.currency || "EUR",
            pricelistValidFrom: pricelist.date || "",
            pricelistValidUntil: group.validUntil,
            lastSyncedAt: new Date(),
          },
        });
      productPricesUpdated++;
    }

    await logSync("pricelist", "success", skuPrices.length, updated, 0, Date.now() - startTime);
    console.log(`[Sync] Pricelist complete: ${updated} variant prices, ${productPricesUpdated} product prices`);
    return { updated };

  } catch (error: any) {
    await logSync("pricelist", "error", 0, 0, 0, Date.now() - startTime, error.message);
    console.error("[Sync] Pricelist sync failed:", error.message);
    throw error;
  }
}

// ============================================================
// SYNC PRINT DATA
// Fetches print positions and techniques per product
// ============================================================

export async function syncPrintData(): Promise<{ updated: number }> {
  const startTime = Date.now();
  let updated = 0;

  try {
    console.log("[Sync] Starting print data sync...");
    const printData = await midocean.fetchAllPrintData();

    for (const product of printData) {
      // Delete existing positions for this product and re-insert
      await db.delete(schema.printPositions)
        .where(eq(schema.printPositions.masterCode, product.master_code));

      for (const position of product.printing_positions || []) {
        // Canvas V2: Extract points and blank images from Midocean data
        const points = (position as any).points || [];
        const images = (position as any).images || [];
        const firstImage = images[0] || {};
        const imageBlank = firstImage.print_position_image_blank || null;
        const imageWithArea = firstImage.print_position_image_with_area || null;

        const pWidth = position.max_print_size_width && String(position.max_print_size_width).trim() !== "" ? String(position.max_print_size_width).replace(",", ".") : null;
        const pHeight = position.max_print_size_height && String(position.max_print_size_height).trim() !== "" ? String(position.max_print_size_height).replace(",", ".") : null;

        const imageVariantsToSave = images.map((img: any) => ({
          colorCode: img.variant_color,
          imageBlank: img.print_position_image_blank,
          imageWithArea: img.print_position_image_with_area
        }));

        await db.insert(schema.printPositions).values({
          masterCode: product.master_code,
          positionId: position.position_id,
          positionDescription: position.position_description,
          maxPrintWidth: pWidth,
          maxPrintHeight: pHeight,
          printPositionImage: imageWithArea || position.print_position_image || null,
          positionImageBlank: imageBlank,
          positionPoints: points.length > 0 ? JSON.stringify(points) : null,
          positionImageVariants: JSON.stringify(imageVariantsToSave),
          availableTechniques: JSON.stringify(position.printing_techniques || position.techniques || []),
          lastSyncedAt: new Date(),
        });

        updated++;
      }

      // Update print_manipulation on the product level
      if (product.print_manipulation) {
        await db.update(schema.products)
          .set({ printManipulation: product.print_manipulation })
          .where(eq(schema.products.masterCode, product.master_code));
      }
    }

    await logSync("print_data", "success", printData.length, updated, 0, Date.now() - startTime);
    console.log("[Sync] Print data complete: " + updated + " positions (with canvas coordinates)");
    return { updated };

  } catch (error: any) {
    await logSync("print_data", "error", 0, 0, 0, Date.now() - startTime, error.message);
    throw error;
  }
}

// ============================================================
// SYNC PRINT PRICELIST
// Fetches print technique pricing
// ============================================================

export async function syncPrintPricelist(): Promise<{ updated: number }> {
  const startTime = Date.now();
  let updated = 0;

  try {
    console.log("[Sync] Starting print pricelist sync...");
    const printPricelist = await midocean.fetchPrintPricelist();

    // Sync techniques
    for (const technique of printPricelist.print_techniques || []) {
      const parsedSetup = technique.setup && technique.setup.trim() !== "" ? technique.setup.replace(",", ".") : null;
      const parsedSetupRepeat = technique.setup_repeat && technique.setup_repeat.trim() !== "" ? technique.setup_repeat.replace(",", ".") : null;

      await db.insert(schema.printPrices)
        .values({
          techniqueId: technique.id,
          techniqueDescription: technique.description,
          pricingType: technique.pricing_type,
          setup: parsedSetup,
          setupRepeat: parsedSetupRepeat,
          nextColourCostIndicator: technique.next_colour_cost_indicator === "true" || technique.next_colour_cost_indicator === "X",
          varCosts: technique.var_costs,
          currency: printPricelist.currency,
          pricelistValidFrom: printPricelist.pricelist_valid_from,
          pricelistValidUntil: printPricelist.pricelist_valid_until,
          lastSyncedAt: new Date(),
        })
        .onConflictDoUpdate({
          target: schema.printPrices.techniqueId,
          set: {
            techniqueDescription: technique.description,
            pricingType: technique.pricing_type,
            setup: parsedSetup,
            setupRepeat: parsedSetupRepeat,
            nextColourCostIndicator: technique.next_colour_cost_indicator === "true" || technique.next_colour_cost_indicator === "X",
            varCosts: technique.var_costs,
            lastSyncedAt: new Date(),
          },
        });
      updated++;
    }

    // Sync manipulations (handling costs)
    for (const manipulation of printPricelist.print_manipulations || []) {
      // API returns {code, description, price:"0,07"} — transform to clean JSONB
      const priceStr = (manipulation.price || '0').replace(/\./g, '').replace(',', '.');
      const cleanData = {
        code: manipulation.code,
        description: manipulation.description || manipulation.code,
        price_per_unit: parseFloat(priceStr) || 0,
      };
      await db.insert(schema.printManipulations)
        .values({
          masterCode: manipulation.code,
          handlingPriceScales: cleanData,
          lastSyncedAt: new Date(),
        })
        .onConflictDoUpdate({
          target: schema.printManipulations.masterCode,
          set: {
            handlingPriceScales: cleanData,
            lastSyncedAt: new Date(),
          },
        });
    }

    await logSync("print_pricelist", "success", updated, updated, 0, Date.now() - startTime);
    console.log(`[Sync] Print pricelist complete: ${updated} techniques`);
    return { updated };

  } catch (error: any) {
    await logSync("print_pricelist", "error", 0, 0, 0, Date.now() - startTime, error.message);
    throw error;
  }
}

// ============================================================
// SYNC ORDER STATUS
// Polls Midocean for updates on active orders
// ============================================================

export async function syncActiveOrders(): Promise<{ checked: number; updated: number }> {
  const startTime = Date.now();
  let checked = 0;
  let updated = 0;

  try {
    // Get all orders that are in a state where Midocean might have updates
    const activeOrders = await db.query.orders.findMany({
      where: sql`${schema.orders.status} IN ('submitted', 'proof_pending', 'proof_approved', 'in_production')
        AND ${schema.orders.midoceanOrderNumber} IS NOT NULL`,
    });

    for (const order of activeOrders) {
      checked++;
      try {
        const details = await midocean.getOrderDetails(order.midoceanOrderNumber!);

        if (!details.order_header || details.order_header.order_found !== "true") continue;

        // Check for status changes
        let newStatus = order.status;

        if (details.order_header.order_status === "COMPLETED") {
          newStatus = "completed";
        } else if (details.order_header.order_status === "CANCELLED") {
          newStatus = "cancelled";
        }

        // Check order lines for proof and shipping updates
        for (const line of details.order_lines || []) {
          // Update proof status
          if (line.proof_status === "WaitingApproval" && order.status !== "proof_pending") {
            newStatus = "proof_pending";
          }

          // Update tracking
          if (line.tracking_number && !order.trackingNumber) {
            await db.update(schema.orders).set({
              trackingNumber: line.tracking_number,
              trackingUrl: line.tracking_url || null,
              forwarder: line.forwarder || null,
              shippedAt: line.shipping_date ? new Date(line.shipping_date) : null,
              status: "shipped",
              updatedAt: new Date(),
            }).where(eq(schema.orders.id, order.id));
            updated++;
          }

          // Update order line proof info
          if (line.proof_url || line.proof_status) {
            const orderLine = await db.query.orderLines.findFirst({
              where: sql`${schema.orderLines.orderId} = ${order.id} 
                AND ${schema.orderLines.lineNumber} = ${parseInt(line.order_line_id)}`,
            });

            if (orderLine) {
              const newProofStatus = line.proof_status === "WaitingApproval" ? "waiting_approval" :
                line.proof_status === "Approved" ? "approved" :
                  line.proof_status === "ArtworkRequired" ? "artwork_required" :
                    "in_progress";

              if (orderLine.proofUrl !== line.proof_url || orderLine.proofStatus !== newProofStatus) {
                await db.update(schema.orderLines).set({
                  proofUrl: line.proof_url || orderLine.proofUrl,
                  proofStatus: newProofStatus,
                }).where(eq(schema.orderLines.id, orderLine.id));

                // Trigger email if it just became waiting_approval
                if (newProofStatus === "waiting_approval" && orderLine.proofStatus !== "waiting_approval") {
                  const user = await db.query.users.findFirst({ where: eq(schema.users.id, order.userId) });
                  if (user) {
                    await sendProofReadyEmail(user.email, {
                      firstName: user.firstName || "Cliente",
                      orderNumber: order.orderNumber,
                      productName: orderLine.productName || "Producto personalizado",
                      proofUrl: line.proof_url || orderLine.proofUrl || "",
                    });
                  }
                }
              }
            }
          }
        }

        // Update order status if changed
        if (newStatus !== order.status) {
          await db.update(schema.orders).set({
            status: newStatus as any,
            updatedAt: new Date(),
          }).where(eq(schema.orders.id, order.id));
          updated++;
        }

      } catch (orderError: any) {
        console.error(`[Sync] Error checking order ${order.orderNumber}:`, orderError.message);
        // Log error but continue with other orders
        await db.insert(schema.errorLog).values({
          errorType: "order_sync_error",
          severity: "medium",
          message: `Failed to sync order ${order.orderNumber}: ${orderError.message}`,
          orderId: order.id,
          context: { midoceanOrderNumber: order.midoceanOrderNumber },
          createdAt: new Date(),
        });
      }
    }

    console.log(`[Sync] Active orders: checked ${checked}, updated ${updated}`);
    return { checked, updated };

  } catch (error: any) {
    console.error("[Sync] Order status sync failed:", error.message);
    throw error;
  }
}

// ============================================================
// FULL SYNC — Run all syncs (called on first setup)
// ============================================================

export async function runFullSync(): Promise<void> {
  console.log("=".repeat(60));
  console.log("[Sync] Starting FULL SYNC with Midocean APIs...");
  console.log("=".repeat(60));

  try {
    await syncProducts();
    await syncStock();
    await syncPricelist();
    await syncPrintPricelist();
    await syncPrintData();
    console.log("=".repeat(60));
    console.log("[Sync] FULL SYNC completed successfully!");
    console.log("=".repeat(60));
  } catch (error) {
    console.error("[Sync] FULL SYNC failed — some data may be incomplete");
    throw error;
  }
}

// ============================================================
// HELPER — Log sync operations
// ============================================================

async function logSync(
  syncType: string,
  status: string,
  processed: number,
  updated: number,
  created: number,
  durationMs: number,
  errorMessage?: string
) {
  await db.insert(schema.syncLog).values({
    syncType,
    status,
    recordsProcessed: processed,
    recordsUpdated: updated,
    recordsCreated: created,
    durationMs,
    errorMessage: errorMessage || null,
    startedAt: new Date(),
    completedAt: new Date(),
  });
}
