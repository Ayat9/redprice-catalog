-- Add comments table for public news articles
CREATE TABLE "BlogComment" (
  "id" TEXT NOT NULL,
  "postId" TEXT NOT NULL,
  "author" TEXT NOT NULL,
  "body" TEXT NOT NULL,
  "approved" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "BlogComment_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "BlogComment_postId_createdAt_idx" ON "BlogComment"("postId", "createdAt");
CREATE INDEX "BlogComment_approved_createdAt_idx" ON "BlogComment"("approved", "createdAt");

ALTER TABLE "BlogComment"
ADD CONSTRAINT "BlogComment_postId_fkey"
FOREIGN KEY ("postId") REFERENCES "BlogPost"("id") ON DELETE CASCADE ON UPDATE CASCADE;
