-- Supplier Dashboard module: new role, profiles, camera assignments, legal center tables

-- 1. UserRole enum: append SUPPLIER (idempotent)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type t JOIN pg_enum e ON e.enumtypid = t.oid
    WHERE t.typname = 'UserRole' AND e.enumlabel = 'SUPPLIER'
  ) THEN
    ALTER TYPE "UserRole" ADD VALUE 'SUPPLIER';
  END IF;
END $$;

-- 2. SupplierDocumentStatus enum
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'SupplierDocumentStatus') THEN
    CREATE TYPE "SupplierDocumentStatus" AS ENUM ('PENDING', 'SIGNED', 'DECLINED', 'EXPIRED');
  END IF;
END $$;

-- 3. Supplier: per-brand rotation threshold override (NULL means use global)
ALTER TABLE "Supplier" ADD COLUMN IF NOT EXISTS "rotationThresholdDays" INTEGER;

-- 4. SupplierProfile: linkage User <-> Supplier with module visibility flags
CREATE TABLE IF NOT EXISTS "SupplierProfile" (
  "id"               TEXT PRIMARY KEY,
  "userId"           TEXT NOT NULL UNIQUE,
  "supplierId"       TEXT NOT NULL,
  "displayName"      TEXT,
  "isActive"         BOOLEAN NOT NULL DEFAULT TRUE,
  "canViewSales"     BOOLEAN NOT NULL DEFAULT TRUE,
  "canViewVideo"     BOOLEAN NOT NULL DEFAULT TRUE,
  "canViewFootfall"  BOOLEAN NOT NULL DEFAULT TRUE,
  "canSignDocuments" BOOLEAN NOT NULL DEFAULT TRUE,
  "createdAt"        TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"        TIMESTAMP(3) NOT NULL,
  CONSTRAINT "SupplierProfile_user_fk"    FOREIGN KEY ("userId")     REFERENCES "User"("id")     ON DELETE CASCADE,
  CONSTRAINT "SupplierProfile_supplier_fk" FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id") ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS "SupplierProfile_supplierId_idx" ON "SupplierProfile"("supplierId");

-- 5. CameraAssignment: IP-камера → поставщик (опционально привязана к торговой точке)
CREATE TABLE IF NOT EXISTS "CameraAssignment" (
  "id"                TEXT PRIMARY KEY,
  "supplierProfileId" TEXT NOT NULL,
  "storeId"           TEXT,
  "label"             TEXT NOT NULL,
  "streamUrl"         TEXT NOT NULL,
  "isAvailable"       BOOLEAN NOT NULL DEFAULT TRUE,
  "createdAt"         TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"         TIMESTAMP(3) NOT NULL,
  CONSTRAINT "CameraAssignment_profile_fk" FOREIGN KEY ("supplierProfileId") REFERENCES "SupplierProfile"("id") ON DELETE CASCADE,
  CONSTRAINT "CameraAssignment_store_fk"   FOREIGN KEY ("storeId")           REFERENCES "Store"("id")           ON DELETE SET NULL
);
CREATE INDEX IF NOT EXISTS "CameraAssignment_supplierProfileId_idx" ON "CameraAssignment"("supplierProfileId");
CREATE INDEX IF NOT EXISTS "CameraAssignment_storeId_idx" ON "CameraAssignment"("storeId");

-- 6. SupplierDocumentTemplate: шаблоны договоров
CREATE TABLE IF NOT EXISTS "SupplierDocumentTemplate" (
  "id"           TEXT PRIMARY KEY,
  "title"        TEXT NOT NULL,
  "description"  TEXT,
  "mimeKind"     TEXT NOT NULL DEFAULT 'html',
  "content"      TEXT NOT NULL,
  "isArchived"   BOOLEAN NOT NULL DEFAULT FALSE,
  "createdAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"    TIMESTAMP(3) NOT NULL
);

-- 7. SupplierDocumentAssignment: привязка шаблона к поставщику + текущий статус
CREATE TABLE IF NOT EXISTS "SupplierDocumentAssignment" (
  "id"                TEXT PRIMARY KEY,
  "templateId"        TEXT NOT NULL,
  "supplierProfileId" TEXT NOT NULL,
  "status"            "SupplierDocumentStatus" NOT NULL DEFAULT 'PENDING',
  "dueAt"             TIMESTAMP(3),
  "createdAt"         TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"         TIMESTAMP(3) NOT NULL,
  CONSTRAINT "SupplierDocumentAssignment_tpl_fk"     FOREIGN KEY ("templateId")        REFERENCES "SupplierDocumentTemplate"("id") ON DELETE CASCADE,
  CONSTRAINT "SupplierDocumentAssignment_profile_fk" FOREIGN KEY ("supplierProfileId") REFERENCES "SupplierProfile"("id")           ON DELETE CASCADE
);
CREATE UNIQUE INDEX IF NOT EXISTS "SupplierDocumentAssignment_tpl_profile_uniq" ON "SupplierDocumentAssignment"("templateId", "supplierProfileId");
CREATE INDEX IF NOT EXISTS "SupplierDocumentAssignment_profile_status_idx" ON "SupplierDocumentAssignment"("supplierProfileId", "status");

-- 8. SupplierDocumentSignature: история подписей (каждая подпись = отдельная строка)
CREATE TABLE IF NOT EXISTS "SupplierDocumentSignature" (
  "id"               TEXT PRIMARY KEY,
  "assignmentId"     TEXT NOT NULL,
  "fullName"         TEXT NOT NULL,
  "signatureDataUrl" TEXT NOT NULL,
  "ipAddress"        TEXT,
  "userAgent"        TEXT,
  "signedAt"         TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "SupplierDocumentSignature_assignment_fk" FOREIGN KEY ("assignmentId") REFERENCES "SupplierDocumentAssignment"("id") ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS "SupplierDocumentSignature_assignment_signed_idx" ON "SupplierDocumentSignature"("assignmentId", "signedAt");

-- 9. SupplierSettings: синглтон глобальных настроек модуля
CREATE TABLE IF NOT EXISTS "SupplierSettings" (
  "id"                    INTEGER PRIMARY KEY DEFAULT 1,
  "rotationThresholdDays" INTEGER NOT NULL DEFAULT 30,
  "updatedAt"             TIMESTAMP(3) NOT NULL
);
INSERT INTO "SupplierSettings" ("id", "rotationThresholdDays", "updatedAt")
VALUES (1, 30, CURRENT_TIMESTAMP)
ON CONFLICT ("id") DO NOTHING;
