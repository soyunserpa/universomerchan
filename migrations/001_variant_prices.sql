-- ============================================================
-- Migration: Create variant_prices table
-- Run on server: sudo -u postgres psql -d universomerchan -f migrations/001_variant_prices.sql
-- ============================================================

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
);

-- Unique index on SKU (one price per variant)
CREATE UNIQUE INDEX IF NOT EXISTS variant_prices_sku_idx ON variant_prices (sku);

-- Index for lookups by variant_id
CREATE INDEX IF NOT EXISTS variant_prices_variant_id_idx ON variant_prices (variant_id);

-- Index for aggregation by master_code (for product_prices rebuild)
CREATE INDEX IF NOT EXISTS variant_prices_master_code_idx ON variant_prices (master_code);

-- Also ensure product_prices has a unique constraint on master_code
-- (needed for ON CONFLICT in sync-engine)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE indexname = 'product_prices_master_code_unique'
  ) THEN
    -- Check if there are duplicates first
    DELETE FROM product_prices a USING product_prices b
    WHERE a.id < b.id AND a.master_code = b.master_code;
    
    CREATE UNIQUE INDEX product_prices_master_code_unique ON product_prices (master_code);
  END IF;
END $$;
