#!/usr/bin/env python3
"""
Sync product prices from Midocean Pricelist 2.0 API.
Uses variant_id from product_variants to match SKUs to products.
Stores prices in original EU format from Midocean.
"""
import json, urllib.request, psycopg2

MIDOCEAN_API_KEY = "0f4a331a-e3d7-4730-81ba-46de635b624f"
DB_PARAMS = dict(host="localhost", dbname="universomerchan", user="universo", password="UmErch2026Pg")

def parse_eu(s):
    """Parse EU price format: '3,28' or '1.234,50' -> float"""
    return float(s.replace(".", "").replace(",", "."))

print("[Sync] Fetching pricelist from Midocean API...")
req = urllib.request.Request(
    "https://api.midocean.com/gateway/pricelist/2.0",
    headers={"x-Gateway-APIKey": MIDOCEAN_API_KEY}
)
with urllib.request.urlopen(req) as resp:
    data = json.loads(resp.read())

sku_prices = data.get("price", [])
print(f"[Sync] Received {len(sku_prices)} SKU prices")

conn = psycopg2.connect(**DB_PARAMS)
cur = conn.cursor()

# Build variant_id -> master_code map from our DB (authoritative link)
cur.execute("""
    SELECT pv.variant_id, pv.sku, p.master_code 
    FROM product_variants pv 
    JOIN products p ON pv.product_id = p.id
""")
variant_to_master = {}
sku_to_master = {}
for row in cur.fetchall():
    variant_to_master[row[0]] = row[2]  # variant_id -> master_code
    sku_to_master[row[1]] = row[2]      # sku -> master_code
print(f"[Sync] Loaded {len(variant_to_master)} variant->master mappings")

# Group pricelist entries by master_code
by_master = {}
matched = unmatched = 0
for entry in sku_prices:
    variant_id = entry.get("variant_id", "")
    sku = entry.get("sku", "")
    
    # Match via variant_id first (most reliable), then SKU
    mc = variant_to_master.get(variant_id) or sku_to_master.get(sku) or ""
    if not mc:
        unmatched += 1
        continue
    matched += 1
    
    if mc not in by_master:
        by_master[mc] = []
    by_master[mc].append({
        "price": entry.get("price", "0"),  # Keep EU format as-is
        "valid_until": entry.get("valid_until", ""),
        "scales": entry.get("scale", [])
    })

print(f"[Sync] Matched {matched} SKUs, {unmatched} unmatched. Grouped into {len(by_master)} products")

updated = 0
with_scales = 0

for mc, entries in by_master.items():
    # Find entry with most quantity scale tiers
    entries_with_scales = sorted(
        [e for e in entries if e["scales"]],
        key=lambda e: len(e["scales"]), reverse=True
    )
    
    if entries_with_scales:
        best = entries_with_scales[0]
        ps = sorted(
            [{"minimum_quantity": s["minimum_quantity"], "price": s["price"]} for s in best["scales"]],
            key=lambda s: int(s["minimum_quantity"])
        )
        with_scales += 1
    else:
        # No scales — find lowest price variant, keep EU format
        min_price = float('inf')
        min_price_str = entries[0]["price"]
        for e in entries:
            try:
                p = parse_eu(e["price"])
                if 0 < p < min_price:
                    min_price = p
                    min_price_str = e["price"]
            except:
                continue
        ps = [{"minimum_quantity": "1", "price": min_price_str}]
    
    ps_json = json.dumps(ps)
    vu = entries[0]["valid_until"]
    
    cur.execute("""
        INSERT INTO product_prices (master_code, currency, pricelist_valid_from, pricelist_valid_until, price_scales, last_synced_at)
        VALUES (%s, 'EUR', %s, %s, %s::jsonb, NOW())
        ON CONFLICT (master_code) DO UPDATE SET
            price_scales = %s::jsonb,
            currency = 'EUR',
            pricelist_valid_from = %s,
            pricelist_valid_until = %s,
            last_synced_at = NOW()
    """, (mc, data.get("date",""), vu, ps_json, ps_json, data.get("date",""), vu))
    updated += 1

conn.commit()
print(f"[Sync] Done: {updated} products ({with_scales} with quantity scales)")

# Verify some products
for test_mc in ['S47101', 'MO1001', 'MO1401c', 'MO9177']:
    cur.execute("SELECT price_scales::text FROM product_prices WHERE master_code = %s", (test_mc,))
    r = cur.fetchone()
    print(f"  {test_mc}: {r[0][:120] if r else 'NOT FOUND'}")

cur.close()
conn.close()
