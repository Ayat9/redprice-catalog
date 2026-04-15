-- CMS: поля для макетов и медиа (новости Redprice.kz)
ALTER TABLE "BlogPost" ADD COLUMN IF NOT EXISTS "videoUrl" TEXT;
ALTER TABLE "BlogPost" ADD COLUMN IF NOT EXISTS "layoutType" TEXT NOT NULL DEFAULT 'stack';
ALTER TABLE "BlogPost" ADD COLUMN IF NOT EXISTS "category" TEXT NOT NULL DEFAULT 'customers';
ALTER TABLE "BlogPost" ADD COLUMN IF NOT EXISTS "contentJson" JSONB;

CREATE INDEX IF NOT EXISTS "BlogPost_category_idx" ON "BlogPost"("category");
