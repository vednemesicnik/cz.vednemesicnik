-- An issue's number is unique only once published (log 0039): the typed year, order
-- and supplement are no longer unique, and publish writes the held number to
-- publishedNumber and names the PDF.

-- DropIndex
DROP INDEX "Issue_year_order_supplementSlug_key";

-- AlterTable
ALTER TABLE "Issue" ADD COLUMN "publishedNumber" TEXT;

-- Backfill: published and archived issues, and drafts that were published before
-- (retract keeps publishedAt), hold the number they have.
UPDATE "Issue"
SET "publishedNumber" = "year" || '-' || "order" ||
  CASE WHEN "supplementSlug" = '' THEN '' ELSE '-' || "supplementSlug" END
WHERE "year" IS NOT NULL AND "order" IS NOT NULL
  AND ("state" <> 'draft' OR "publishedAt" IS NOT NULL);

-- A draft that was never published has no PDF name any more: publish gives it.
UPDATE "IssuePDF" SET "fileName" = NULL
WHERE "issueId" IN (SELECT "id" FROM "Issue" WHERE "publishedNumber" IS NULL);

-- CreateIndex
CREATE UNIQUE INDEX "Issue_publishedNumber_key" ON "Issue"("publishedNumber");

-- CreateIndex
CREATE INDEX "Issue_year_order_supplementSlug_idx" ON "Issue"("year", "order", "supplementSlug");
