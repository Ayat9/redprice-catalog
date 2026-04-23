-- Align Product with 1C nomenclature fields and ESL MAC binding
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "sku" VARCHAR(50);
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "full_name" TEXT;
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "cost_price" DECIMAL(10,2);
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "sale_price" DECIMAL(10,2);
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "unit" VARCHAR(20);
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "characteristics" JSONB;
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "image_url" VARCHAR(500);
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "device_mac" VARCHAR(12);

-- Backfill sku from legacy sku1c/article if available
UPDATE "Product"
SET "sku" = COALESCE(NULLIF("sku", ''), NULLIF("sku1c", ''), NULLIF("article", ''), CONCAT('sku-', "id"))
WHERE "sku" IS NULL OR "sku" = '';

ALTER TABLE "Product" ALTER COLUMN "sku" SET NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE schemaname = 'public' AND indexname = 'Product_sku_key'
  ) THEN
    CREATE UNIQUE INDEX "Product_sku_key" ON "Product"("sku");
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS "Product_device_mac_idx" ON "Product"("device_mac");
